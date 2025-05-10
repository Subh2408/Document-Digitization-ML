# InsureDocsProject/backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict # Import Dict and Any
from datetime import datetime
from .models import UserRole, DocumentStatus # Import updated Enums

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: UserRole = UserRole.USER

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    password: Optional[str] = Field(default=None, min_length=8)

class User(UserBase): # For responses
    id: int
    is_active: bool
    role: UserRole
    created_at: datetime
    model_config = {"from_attributes": True}

class UserInDB(User): # Internal or admin use
    hashed_password: str

# --- Document Schemas ---
class DocumentBase(BaseModel):
    original_filename: str
    content_type: Optional[str] = None
    size_kb: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel): # Primarily for updating status
    status: Optional[DocumentStatus] = None

class Document(DocumentBase): # Detailed Document response
    id: int
    stored_filename: str
    file_path_on_disk: str # Relative filename
    status: DocumentStatus
    upload_date: datetime
    owner_id: int
    extracted_text_path: Optional[str] = None # Relative filename
    extracted_metadata: Optional[Dict[str, Any]] = None # NER results included
    model_config = {"from_attributes": True}

class DocumentMinimal(BaseModel): # For list views
    id: int
    original_filename: str
    upload_date: datetime
    size_kb: Optional[int] = None
    status: DocumentStatus # Status important for lists
    model_config = {"from_attributes": True}

# --- Dashboard Stats Schema ---
class DashboardStats(BaseModel):
    total_documents: int
    recent_uploads_30_days: int
    # More granular processing counts:
    pending_ocr_count: int = 0
    processing_ocr_count: int = 0
    pending_ner_count: int = 0      # Count includes OCR_COMPLETED
    processing_ner_count: int = 0
    completed_ner_count: int = 0    # Essentially "ready" docs for MVP
    failed_ocr_count: int = 0
    failed_ner_count: int = 0