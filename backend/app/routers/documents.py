# InsureDocsProject/backend/app/routers/documents.py
import shutil
import uuid
import os
import traceback
import logging
import pytesseract

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
    Response,
    BackgroundTasks
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

# Use relative imports
try:
    from .. import crud, schemas, models, dependencies, ocr_utils, extraction_utils
    from ..database import get_db, SessionLocal
    from ..config import settings
except ImportError as import_err:
    print(f"CRITICAL IMPORT ERROR in documents.py: {import_err}")
    import sys
    sys.exit(1)

logger = logging.getLogger(__name__)
router = APIRouter()

# =====================================
# Background Task Function (OCR + Extraction)
# =====================================
def run_ocr_and_extraction_task(doc_id: int):
    """Background task: OCR -> Read Text -> Regex Extract -> Update DB"""
    logger.info(f"[BG Task Start doc_id={doc_id}] Starting OCR & Extraction process.")
    db: Optional[Session] = None
    ocr_success = False
    extraction_success = False
    final_status = models.DocumentStatus.EXTRACT_FAILED # Default unless completely successful
    extracted_text_relative_path = None
    extracted_metadata = None

    try:
        # --- Phase 1: OCR ---
        db = SessionLocal()
        # 1a. Get Doc & Validate State
        db_doc = crud.get_document_by_id(db, doc_id)
        if not db_doc: logger.error(f"[BG Task {doc_id}] ERROR: Doc not found."); return
        valid_start_statuses = [
            models.DocumentStatus.UPLOADED, models.DocumentStatus.OCR_PENDING,
            models.DocumentStatus.OCR_FAILED, models.DocumentStatus.EXTRACT_FAILED # Allow reprocessing
        ]
        if db_doc.status not in valid_start_statuses: logger.info(f"[BG Task {doc_id}] INFO: Doc status ({db_doc.status}) not suitable for reprocessing. Skipping."); return
        if not db_doc.file_path_on_disk or not db_doc.stored_filename:
             logger.error(f"[BG Task {doc_id}] ERROR: Doc missing paths. Setting OCR_FAILED.");
             crud.update_document_status(db, doc_id, models.DocumentStatus.OCR_FAILED); return

        # 1b. Update status to OCR_PROCESSING
        crud.update_document_status(db, doc_id=doc_id, new_status=models.DocumentStatus.OCR_PROCESSING)
        logger.info(f"[BG Task {doc_id}] Status -> OCR_PROCESSING.")

        # 1c. Determine Paths
        pdf_full_path = ocr_utils.get_full_pdf_path(db_doc.file_path_on_disk)
        text_output_full_path = ocr_utils.get_output_text_path(db_doc.stored_filename)

        # --- 1d. Perform OCR ---
        # ocr_utils.perform_ocr_on_pdf handles internal errors and raises on failure
        saved_text_full_path = ocr_utils.perform_text_extract_or_ocr(doc_id, pdf_full_path, text_output_full_path)
        extracted_text_relative_path = os.path.basename(saved_text_full_path)
        ocr_success = True
        # Update status immediately after successful OCR (ready for extraction)
        crud.update_document_ocr_results(db, doc_id=doc_id, text_path=extracted_text_relative_path, new_status=models.DocumentStatus.OCR_COMPLETED)
        logger.info(f"[BG Task {doc_id}] OCR successful. Status -> OCR_COMPLETED. Text path stored: {extracted_text_relative_path}")

        # === Phase 2: Extraction (Regex) ===
        # 2a. Set status to EXTRACT_PROCESSING
        crud.update_document_status(db, doc_id=doc_id, new_status=models.DocumentStatus.EXTRACT_PROCESSING)
        logger.info(f"[BG Task {doc_id}] Status -> EXTRACT_PROCESSING.")

        # 2b. Read the extracted text content
        logger.info(f"[BG Task {doc_id}] Reading text file for extraction: {text_output_full_path}")
        with open(text_output_full_path, "r", encoding="utf-8") as f:
            ocr_text_content = f.read()

        # 2c. Apply Regex Extraction
        logger.info(f"[BG Task {doc_id}] Applying regex extraction...")
        # Calls your function in extraction_utils.py
        extracted_metadata = extraction_utils.extract_information_with_regex(ocr_text_content)
        extraction_success = True
        # Assuming successful extraction is the final "good" state for now
        final_status = models.DocumentStatus.EXTRACT_COMPLETED
        logger.info(f"[BG Task {doc_id}] Regex extraction successful. Status -> {final_status}. Metadata keys: {list(extracted_metadata.keys()) if extracted_metadata else 'None'}")

    except FileNotFoundError as fnf_err:
        logger.error(f"[BG Task {doc_id}] ERROR: File not found during process: {fnf_err}", exc_info=True)
        final_status = models.DocumentStatus.OCR_FAILED if not ocr_success else models.DocumentStatus.EXTRACT_FAILED
    except pytesseract.TesseractNotFoundError as tess_err:
        logger.critical(f"[BG Task {doc_id}] CRITICAL ERROR: Tesseract engine misconfiguration: {tess_err}")
        final_status = models.DocumentStatus.OCR_FAILED
    except Exception as e:
        logger.error(f"[BG Task {doc_id}] ERROR: Unhandled exception during processing: {e}", exc_info=True)
        # Determine failure point based on flags
        final_status = models.DocumentStatus.OCR_FAILED if not ocr_success else models.DocumentStatus.EXTRACT_FAILED

    finally:
        # --- Final DB Update ---
        if db:
            try:
                 final_check_doc = crud.get_document_by_id(db, doc_id)
                 if final_check_doc:
                    logger.info(f"[BG Task Update {doc_id}] Updating final status to {final_status}")
                    if extraction_success:
                         crud.update_document_extraction_results(db, doc_id=doc_id, metadata=extracted_metadata, new_status=final_status)
                    else:
                         # Update status only, leave metadata as is (likely None or old value)
                         crud.update_document_status(db, doc_id=doc_id, new_status=final_status)
                         # If OCR succeeded but extraction failed, text_path should still be there from previous update
                 else:
                     logger.warning(f"[BG Task Update {doc_id}] Doc deleted before final update.")
            except Exception as db_update_err:
                logger.critical(f"[BG Task Update {doc_id}] CRITICAL ERROR on final DB update: {db_update_err}", exc_info=True)
            finally:
                 db.close()
        else: logger.error(f"[BG Task End {doc_id}] ERROR: No DB Session available.")
        logger.info(f"[BG Task End doc_id={doc_id}] Processing finished.")

# =====================================
# API Endpoint Definitions
# =====================================

@router.post("/", response_model=schemas.Document, status_code=status.HTTP_201_CREATED)
async def upload_new_document(
    file: UploadFile = File(..., description="The PDF document file to upload."),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uploads PDF, saves file, creates DB record, queues background processing."""
    logger.info(f"User {current_user.email} starting upload for file: {file.filename or 'Unknown'}")
    if not file.filename: raise HTTPException(status_code=400, detail="Filename missing.")
    original_fn = file.filename; stored_fn_on_disk, file_path_on_disk_full = None, None # Init
    try:
        _, file_extension = os.path.splitext(original_fn); file_extension = file_extension.lower()
        if file_extension != ".pdf": raise HTTPException(status_code=400, detail="Invalid file type (PDF only).")
        stored_fn_on_disk = f"{uuid.uuid4()}{file_extension}"
        file_path_on_disk_full = ocr_utils.get_full_pdf_path(stored_fn_on_disk)
        logger.info(f"Saving '{original_fn}' as '{stored_fn_on_disk}'")
        with open(file_path_on_disk_full, "wb") as buffer:
            while content := await file.read(1024 * 1024): buffer.write(content)
        logger.info(f"File saved to {file_path_on_disk_full}")
        file_size_kb = round(os.path.getsize(file_path_on_disk_full) / 1024)
        doc_create_data = schemas.DocumentCreate(original_filename=original_fn, content_type=file.content_type or "application/pdf", size_kb=file_size_kb)
        db_doc_created = crud.create_document_db(db, doc_create_data, current_user.id, stored_fn_on_disk, stored_fn_on_disk)
        if not db_doc_created or not db_doc_created.id: raise HTTPException(status_code=500, detail="Failed to save document record.")
        created_doc_id = db_doc_created.id
        logger.info(f"DB record created ID: {created_doc_id}, Status: {db_doc_created.status}")
        # Add combined task to background
        background_tasks.add_task(run_ocr_and_extraction_task, doc_id=created_doc_id)
        logger.info(f"Background task queued for doc_id={created_doc_id}")
        # Update status to PENDING right away (DB commit is handled by CRUD func)
        db_doc_updated = crud.update_document_status(db, doc_id=created_doc_id, new_status=models.DocumentStatus.OCR_PENDING)
        response_doc = db_doc_updated if db_doc_updated else db_doc_created
        logger.info(f"Upload endpoint finished for doc_id={created_doc_id}. Returning status: {response_doc.status if response_doc else 'Unknown'}")
        return response_doc
    except Exception as e:
        logger.error(f"Exception during upload by user {current_user.email}: {e}", exc_info=True)
        if stored_fn_on_disk and os.path.exists(file_path_on_disk_full):
             try: os.remove(file_path_on_disk_full); logger.info(f"Cleaned up file: {file_path_on_disk_full}")
             except OSError as rm_err: logger.error(f"Error cleaning up file {file_path_on_disk_full}: {rm_err}")
        raise HTTPException(status_code=500, detail="Server error during upload.")
    finally:
        if file and hasattr(file, 'close') and callable(file.close):
            try: await file.close()
            except Exception as close_err: logger.warning(f"Error closing upload file handle: {close_err}")


# --- Other Document Endpoints ---
# (These remain largely the same as the last full version, just ensure schemas match)

@router.get("/", response_model=List[schemas.DocumentMinimal])
async def read_documents_list(skip: int=0, limit: int=10, search_term: Optional[str]=None, status_filter: Optional[models.DocumentStatus]=None, current_user: models.User=Depends(dependencies.get_current_active_user), db: Session=Depends(get_db)):
    owner_id_filter = current_user.id if current_user.role != models.UserRole.ADMIN else None
    documents = crud.get_documents(db, owner_id=owner_id_filter, skip=skip, limit=limit, search_term=search_term, status_filter=status_filter)
    return documents

@router.get("/stats/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_statistics(current_user: models.User=Depends(dependencies.get_current_active_user), db: Session=Depends(get_db)):
    owner_id_filter = current_user.id if current_user.role != models.UserRole.ADMIN else None
    # Use the refined CRUD count functions
    total_docs = crud.get_total_document_count(db, owner_id=owner_id_filter)
    recent_uploads = crud.get_recent_uploads_count(db, days=30, owner_id=owner_id_filter)
    pending_ocr = crud.get_pending_ocr_count(db, owner_id=owner_id_filter)
    processing_ocr = crud.get_processing_ocr_count(db, owner_id=owner_id_filter)
    pending_extraction = crud.get_pending_extraction_count(db, owner_id=owner_id_filter)
    processing_extraction = crud.get_processing_extraction_count(db, owner_id=owner_id_filter)
    approved_count = crud.get_approved_doc_count(db, owner_id=owner_id_filter)
    needs_review_count = crud.get_needs_review_doc_count(db, owner_id=owner_id_filter)
    return schemas.DashboardStats(total_documents=total_docs, recent_uploads_30_days=recent_uploads, pending_ocr_count=pending_ocr, processing_ocr_count=processing_ocr, pending_extraction_count=pending_extraction, processing_extraction_count=processing_extraction, needs_review_count=needs_review_count, approved_count=approved_count)

@router.get("/{doc_id}", response_model=schemas.Document)
async def read_single_document_details(doc_id: int, current_user: models.User=Depends(dependencies.get_current_active_user), db: Session=Depends(get_db)):
    db_doc = crud.get_document_by_id(db, doc_id=doc_id)
    if not db_doc: raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != models.UserRole.ADMIN and db_doc.owner_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    return db_doc # Response model 'Document' includes extracted_metadata

@router.get("/{doc_id}/download", response_class=FileResponse)
async def download_document_file(doc_id: int, current_user: models.User=Depends(dependencies.get_current_active_user), db: Session=Depends(get_db)):
    db_doc = crud.get_document_by_id(db, doc_id=doc_id)
    if not db_doc: raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != models.UserRole.ADMIN and db_doc.owner_id != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    file_path = ocr_utils.get_full_pdf_path(db_doc.file_path_on_disk)
    if not os.path.exists(file_path): raise HTTPException(status_code=404, detail="File not found on disk.")
    return FileResponse(path=file_path, filename=db_doc.original_filename, media_type=db_doc.content_type or 'application/pdf')

@router.patch("/{doc_id}/status", response_model=schemas.Document)
async def update_document_status_by_admin(doc_id: int, status_update: schemas.DocumentUpdate, db: Session=Depends(get_db), current_admin_user: models.User=Depends(dependencies.get_current_admin_user)):
    """(Admin Only) Manually updates document status."""
    if status_update.status is None: raise HTTPException(status_code=400, detail="No status provided.")
    logger.info(f"Admin {current_admin_user.email} setting doc_id={doc_id} status to {status_update.status}")
    updated_doc = crud.update_document_status(db, doc_id=doc_id, new_status=status_update.status)
    if not updated_doc: raise HTTPException(status_code=404, detail="Document not found.")
    return updated_doc

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_document_by_admin(doc_id: int, db: Session=Depends(get_db), current_admin_user: models.User=Depends(dependencies.get_current_admin_user)):
    """(Admin Only) Deletes document record and associated files."""
    logger.info(f"Admin {current_admin_user.email} attempting delete for doc_id={doc_id}")
    db_doc = crud.get_document_by_id(db, doc_id)
    if not db_doc: raise HTTPException(status_code=404, detail="Document not found.")
    pdf_path = ocr_utils.get_full_pdf_path(db_doc.file_path_on_disk)
    txt_path = None
    if db_doc.extracted_text_path: txt_path = os.path.join(ocr_utils.TEXT_OUTPUT_DIR, db_doc.extracted_text_path)
    deleted_db = crud.delete_document_db(db, doc_id=doc_id)
    if not deleted_db: raise HTTPException(status_code=500, detail="DB delete failed.")
    logger.info(f"Deleted DB record for doc_id={doc_id}")
    for file_path in [pdf_path, txt_path]: # Attempt to delete both files
        if file_path and os.path.exists(file_path):
            try: os.remove(file_path); logger.info(f"Deleted file: {file_path}")
            except OSError as e: logger.error(f"Error deleting file {file_path}: {e}")
    return Response(status_code=status.HTTP_204_NO_CONTENT)