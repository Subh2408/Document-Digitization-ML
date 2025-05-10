# InsureDocsProject/backend/app/config.py
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsureDocs Backend"
    PROJECT_VERSION: str = "1.0.0"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./default_insure_docs.db")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change_this_default_secret_key_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24))) # 24 hours

    UPLOAD_DIR: str = "uploaded_documents" # Relative to backend/ when running Uvicorn there
    # TEXT_OUTPUT_SUBDIR is now defined within ocr_utils using UPLOAD_DIR as base

    # Pydantic V2 configuration to read from .env file
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Create a single instance of the settings
settings = Settings()

# Debug print (optional, remove later)
# print(f"--- CONFIG LOADED --- DATABASE_URL: {settings.DATABASE_URL}")