# InsureDocsProject/backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import logging # Use logging instead of print
from .config import settings
import os
# import Optional

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine_args = {}
# For SQLite, requires connect_args for FastAPI's threading model
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info(f"Database engine created for URL: {SQLALCHEMY_DATABASE_URL}")
except Exception as e:
    logger.critical(f"Failed to create database engine: {e}", exc_info=True)
    # Depending on requirements, may want to exit application if DB cannot be setup
    raise

# Base class for SQLAlchemy ORM models
Base = declarative_base()

# --- Dependency for getting DB session in API endpoints ---
def get_db():
    db: Optional[Session] = None # Initialize with Optional typing
    try:
        db = SessionLocal()
        yield db
    finally:
        if db:
            db.close()

# --- Create Upload Directory Logic (Moved to main.py startup) ---
# It's generally better practice to do setup like this once when the main app starts,
# rather than every time this module might be imported.