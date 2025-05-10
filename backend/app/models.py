# InsureDocsProject/backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.sqlite import JSON # Using specific import for SQLite JSON type
# If using PostgreSQL: from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# --- Enums (ensure NER statuses are present) ---
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    OCR_PENDING = "ocr_pending"
    OCR_PROCESSING = "ocr_processing"
    OCR_COMPLETED = "ocr_completed" # Ready for Extraction
    OCR_FAILED = "ocr_failed"
    EXTRACT_PENDING = "extract_pending" # Optional: Explicitly queued for extraction
    EXTRACT_PROCESSING = "extract_processing" # Extraction (Regex) process started
    EXTRACT_COMPLETED = "extract_completed"   # Extraction succeeded (NER_COMPLETED equiv.)
    EXTRACT_FAILED = "extract_failed"     # Extraction (Regex) process failed
    APPROVED = "approved"             # Optional final status
    REJECTED = "rejected"             # Optional final status
    # PENDING_APPROVAL = "pending_approval" # Evaluate if still needed

# --- User Model ---
class User(Base):
    __tablename__ = "users"
    # ... (columns as before) ...
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(SAEnum(UserRole, name="userroleenum"), default=UserRole.USER, nullable=False)
    full_name = Column(String, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    documents = relationship("Document", back_populates="owner")

# --- Document Model ---
class Document(Base):
    __tablename__ = "documents"
    # ... (other columns as before) ...
    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, index=True, nullable=False)
    stored_filename = Column(String, unique=True, nullable=False)
    file_path_on_disk = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    size_kb = Column(Integer, nullable=True)
    status = Column(SAEnum(DocumentStatus, name="documentstatusenum"), default=DocumentStatus.UPLOADED, index=True, nullable=False)
    extracted_text_path = Column(String, nullable=True) # Path to OCR text file
    # --- ADDED JSON FIELD ---
    extracted_metadata = Column(JSON, nullable=True) # Stores dict of extracted entities (e.g., {"policy_numbers": [...], "dates": [...]})
    # --- End Added Field ---
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    owner = relationship("User", back_populates="documents")