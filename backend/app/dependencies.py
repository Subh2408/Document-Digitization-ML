# InsureDocsProject/backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from . import crud, models, security, schemas # Need schemas for TokenData
from .database import get_db

# --- HTTP Bearer Scheme Setup ---
# This looks for "Authorization: Bearer <token>" header
http_bearer_scheme = HTTPBearer(
    description="Enter the JWT access token obtained from the /api/v1/auth/token endpoint.",
    auto_error=True # Raise 401 automatically if header is bad/missing
)

async def get_token_data_from_http_bearer(
    # Dependency uses the scheme instance to extract credential data
    auth_header: HTTPAuthorizationCredentials = Depends(http_bearer_scheme)
) -> schemas.TokenData:
    """
    Validates Bearer scheme, decodes token using security module.
    Raises HTTPException if invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check scheme and decode token
    if auth_header.scheme.lower() != "bearer":
        raise HTTPException(status_code=403, detail="Invalid authentication scheme.")

    token = auth_header.credentials
    token_data = security.decode_access_token(token)

    if token_data is None or token_data.email is None:
        raise credentials_exception # If decoding failed or email not in payload

    return token_data

# --- Core User Dependency Functions ---
async def get_current_user(
    db: Session = Depends(get_db),
    token_data: schemas.TokenData = Depends(get_token_data_from_http_bearer)
) -> models.User:
    """Retrieves user from DB based on validated token data."""
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        # Token might be valid, but user deleted since issuance
        raise HTTPException(status_code=404, detail="User associated with token not found.")
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Ensures the retrieved user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
    return current_user

async def get_current_admin_user(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Ensures the retrieved, active user is an admin."""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required."
        )
    return current_user