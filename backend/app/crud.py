# InsureDocsProject/backend/app/crud.py
import logging # Use logging instead of print
from sqlalchemy.orm import Session
from sqlalchemy import func, or_ # For combining filter conditions
from typing import List, Optional, Dict, Any # Added Dict, Any
from datetime import datetime, timedelta

from . import models, schemas, security # Import local modules

# --- Get Logger ---
logger = logging.getLogger(__name__)

# ==================================
# User CRUD Operations
# ==================================
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Retrieves a user by their ID."""
    logger.debug(f"Querying user by id={user_id}")
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Retrieves a user by their email address."""
    logger.debug(f"Querying user by email={email}")
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Retrieves a list of users with pagination."""
    logger.debug(f"Querying users with skip={skip}, limit={limit}")
    return db.query(models.User).order_by(models.User.id).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Creates a new user, hashing the password before storage."""
    logger.info(f"Creating new user with email={user.email}, role={user.role}")
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User created successfully with id={db_user.id}")
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Updates an existing user's information."""
    db_user = get_user(db, user_id)
    if not db_user:
        logger.warning(f"Attempted to update non-existent user with id={user_id}")
        return None
    logger.info(f"Updating user with id={user_id}")
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        db_user.hashed_password = hashed_password
        logger.info(f"User id={user_id} password updated.")
        del update_data["password"]
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User id={user_id} updated successfully.")
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    """Deletes a user from the database."""
    db_user = get_user(db, user_id)
    if not db_user:
        logger.warning(f"Attempted to delete non-existent user with id={user_id}")
        return None
    logger.info(f"Deleting user with id={user_id}")
    # Consider related document handling (e.g., anonymize, reassign, cascade delete?)
    db.delete(db_user)
    db.commit()
    logger.info(f"User id={user_id} deleted successfully.")
    return db_user


# =====================================
# Document CRUD Operations
# =====================================
def create_document_db(db: Session, doc: schemas.DocumentCreate, owner_id: int, stored_filename: str, file_path_on_disk: str) -> models.Document:
    """Creates a new document record with initial UPLOADED status."""
    logger.info(f"Creating document DB record for original_filename='{doc.original_filename}', owner_id={owner_id}")
    db_doc = models.Document(
        original_filename=doc.original_filename,
        content_type=doc.content_type,
        size_kb=doc.size_kb,
        owner_id=owner_id,
        stored_filename=stored_filename,
        file_path_on_disk=file_path_on_disk, # Store relative path/filename
        status=models.DocumentStatus.UPLOADED,
        extracted_metadata={} # Initialize JSON field as empty dict
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    logger.info(f"Document record created with id={db_doc.id}, status={db_doc.status}")
    return db_doc

def get_document_by_id(db: Session, doc_id: int) -> Optional[models.Document]:
    """Retrieves a single document by its ID."""
    logger.debug(f"Querying document by id={doc_id}")
    return db.query(models.Document).filter(models.Document.id == doc_id).first()

def get_documents(
    db: Session,
    owner_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 10,
    search_term: Optional[str] = None,
    status_filter: Optional[models.DocumentStatus] = None
) -> List[models.Document]:
    """Retrieves documents with optional filtering/searching and pagination."""
    logger.debug(f"Querying documents: owner={owner_id}, skip={skip}, limit={limit}, search='{search_term}', status={status_filter}")
    query = db.query(models.Document)
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    if status_filter is not None:
        query = query.filter(models.Document.status == status_filter)
    if search_term:
        # Basic search on original filename (case-insensitive)
        query = query.filter(models.Document.original_filename.ilike(f"%{search_term}%"))
        # TODO: Later, extend search to indexed extracted text or metadata
    return query.order_by(models.Document.upload_date.desc()).offset(skip).limit(limit).all()

def update_document_status(db: Session, doc_id: int, new_status: models.DocumentStatus) -> Optional[models.Document]:
    """Updates only the status of a specific document."""
    db_doc = get_document_by_id(db, doc_id)
    if db_doc:
        if db_doc.status != new_status: # Avoid unnecessary updates if status is same
            logger.info(f"Updating status for doc_id={doc_id} from '{db_doc.status}' to '{new_status}'")
            db_doc.status = new_status
            db.commit()
            db.refresh(db_doc)
        else:
             logger.debug(f"Status for doc_id={doc_id} is already '{new_status}'. No update needed.")
    else:
        logger.warning(f"Attempted to update status for non-existent doc_id={doc_id}")
    return db_doc

def update_document_ocr_results(db: Session, doc_id: int, text_path: Optional[str], new_status: models.DocumentStatus) -> Optional[models.Document]:
    """Updates document status and extracted_text_path after OCR."""
    db_doc = get_document_by_id(db, doc_id)
    if db_doc:
        logger.info(f"Updating OCR results for doc_id={doc_id}. Status -> {new_status}, TextPath -> {text_path or 'None'}")
        db_doc.status = new_status
        db_doc.extracted_text_path = text_path
        db.commit()
        db.refresh(db_doc)
    else:
        logger.warning(f"Attempted to update OCR results for non-existent doc_id={doc_id}")
    return db_doc

def update_document_extraction_results(
    db: Session,
    doc_id: int,
    metadata: Optional[Dict[str, Any]], # Extracted data dict
    new_status: models.DocumentStatus
) -> Optional[models.Document]:
    """Updates document status and the extracted_metadata JSON field."""
    db_doc = get_document_by_id(db, doc_id)
    if db_doc:
        logger.info(f"Updating Extraction results for doc_id={doc_id}. Status -> {new_status}, Metadata -> {'Present' if metadata else 'None'}")
        db_doc.status = new_status
        db_doc.extracted_metadata = metadata # Assign the dictionary to the JSON field
        db.commit()
        db.refresh(db_doc)
    else:
        logger.warning(f"Attempted to update extraction results for non-existent doc_id={doc_id}")
    return db_doc

def delete_document_db(db: Session, doc_id: int) -> bool:
    """Deletes a document record from the database. Returns True if successful."""
    db_doc = get_document_by_id(db, doc_id)
    if db_doc:
        logger.info(f"Deleting document record for doc_id={doc_id}")
        db.delete(db_doc)
        db.commit()
        return True
    else:
        logger.warning(f"Attempted to delete non-existent document record with id={doc_id}")
        return False

# =====================================
# Dashboard Stats CRUD Operations
# =====================================
def get_document_count_by_status(db: Session, status: models.DocumentStatus, owner_id: Optional[int] = None) -> int:
    """Gets the count of documents with a specific status, optionally filtered by owner."""
    query = db.query(func.count(models.Document.id)).filter(models.Document.status == status)
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    count = query.scalar_one_or_none()
    return count or 0

def get_total_document_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Gets total doc count, optionally filtered by owner."""
    query = db.query(func.count(models.Document.id))
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    count = query.scalar_one_or_none()
    return count or 0

def get_recent_uploads_count(db: Session, days: int = 30, owner_id: Optional[int] = None) -> int:
    """Gets count of docs uploaded recently, optionally filtered."""
    try:
        if days <= 0: days = 30
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = db.query(func.count(models.Document.id)).filter(models.Document.upload_date >= cutoff_date)
        if owner_id is not None:
            query = query.filter(models.Document.owner_id == owner_id)
        count = query.scalar_one_or_none()
        return count or 0
    except Exception as e:
        logger.error(f"Error getting recent uploads count: {e}")
        return 0

def get_pending_ocr_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Docs waiting for OCR (Uploaded or Pending states)."""
    query = db.query(func.count(models.Document.id)).filter(
        models.Document.status.in_([models.DocumentStatus.UPLOADED, models.DocumentStatus.OCR_PENDING])
    )
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    result = query.scalar_one_or_none()
    return result or 0

def get_processing_ocr_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Docs actively being OCR'd."""
    return get_document_count_by_status(db, models.DocumentStatus.OCR_PROCESSING, owner_id)

def get_pending_extraction_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Docs ready for extraction (OCR done)."""
    # Assuming EXTRACT_PENDING is optional, count OCR_COMPLETED as ready
    query = db.query(func.count(models.Document.id)).filter(
         or_(models.Document.status == models.DocumentStatus.OCR_COMPLETED,
             models.Document.status == models.DocumentStatus.EXTRACT_PENDING) # if using this status
    )
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    result = query.scalar_one_or_none()
    return result or 0

def get_processing_extraction_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Docs actively being processed for extraction."""
    return get_document_count_by_status(db, models.DocumentStatus.EXTRACT_PROCESSING, owner_id)

def get_approved_doc_count(db: Session, owner_id: Optional[int] = None) -> int:
    """Gets count of docs in final usable states."""
    # Define what counts as 'approved' based on your final workflow states
    approved_statuses = [models.DocumentStatus.EXTRACT_COMPLETED, models.DocumentStatus.APPROVED]
    query = db.query(func.count(models.Document.id)).filter(models.Document.status.in_(approved_statuses))
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    result = query.scalar_one_or_none()
    return result or 0

# Example count for 'needs review' - could be docs failing OCR/Extract or specific PENDING_APPROVAL status
def get_needs_review_doc_count(db: Session, owner_id: Optional[int] = None) -> int:
    review_statuses = [models.DocumentStatus.OCR_FAILED, models.DocumentStatus.EXTRACT_FAILED]
    # if models.DocumentStatus.PENDING_APPROVAL in models.DocumentStatus.__members__:
    #     review_statuses.append(models.DocumentStatus.PENDING_APPROVAL)

    query = db.query(func.count(models.Document.id)).filter(models.Document.status.in_(review_statuses))
    if owner_id is not None:
        query = query.filter(models.Document.owner_id == owner_id)
    result = query.scalar_one_or_none()
    return result or 0