# InsureDocsProject/backend/app/main.py

# --- Core Python Imports ---
import os
import sys      # For logging handler
import logging  # For setting up logging

# --- FastAPI Imports ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- Application Specific Imports ---
# Use relative imports - ensure these files exist and are correct
try:
    from .config import settings
    from .database import SessionLocal # For startup event's DB session
    from . import crud                # For initial user creation
    from . import models              # For UserRole enum in startup
    from .schemas import UserCreate    # For initial user schema
    # Import your routers
    from .routers import auth, users, documents # Add others as needed
except ImportError as import_err:
    print(f"CRITICAL IMPORT ERROR in main.py: {import_err}")
    print("Check if all necessary files exist and imports are correct.")
    sys.exit(1) # Exit if basic imports fail


# --- Basic Logging Configuration ---
# Configure logging BEFORE creating the FastAPI app instance
log_format = "%(asctime)s | %(levelname)s | %(name)s | %(message)s" # Added separator
logging.basicConfig(
    level=logging.INFO, # Log INFO, WARNING, ERROR, CRITICAL
    format=log_format,
    datefmt="%Y-%m-%d %H:%M:%S", # Optional: Define date format
    handlers=[
        logging.FileHandler("backend.log", mode='a'), # Log to 'backend.log' in the CWD (where Uvicorn runs)
        logging.StreamHandler(sys.stdout) # Log to the console/terminal as well
    ],
    # force=True # Optional: Useful if reconfiguring logging in notebooks or complex setups
)
# Get a logger instance for this module (main)
logger = logging.getLogger(__name__)


# --- Create FastAPI App Instance ---
# Ensure this line exists and the instance is named 'app'
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API for InsureDocs document management and processing.",
    # openapi_url="/api/v1/openapi.json", # Example: Custom OpenAPI path
    docs_url="/docs", # Standard path for Swagger UI
    redoc_url="/redoc" # Standard path for ReDoc UI
)


# --- CORS Middleware ---
# Define allowed origins for Cross-Origin Resource Sharing
# Replace with your frontend's actual URL in production
origins = [
    "http://localhost:3000",  # Example: Common default for Create React App
    "http://localhost:5173",  # Example: Common default for Vite
    "http://127.0.0.1:5173", # Include 127.0.0.1 as well
    "http://localhost:8081",
    "http://localhost:8000",
    "http://localhost:8082"

    # Add the URL where your React app will be running
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Allows requests from these origins
    allow_credentials=True,    # Allows cookies/authorization headers
    allow_methods=["*"],       # Allows all standard HTTP methods
    allow_headers=["*"],       # Allows all headers
)


# --- Include API Routers ---
# Mount the routers defined in the routers/ directory
# Prefixes ensure endpoints are grouped under /api/v1/...
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
# Use the router from the potentially simplified documents.py for now
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
# Example for future admin router:
# from .routers import admin
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


# --- Application Startup Event ---
@app.on_event("startup")
async def startup_event():
    """
    Perform initial setup tasks when the application starts.
    - Creates the upload directory if it doesn't exist.
    - Creates default admin/user accounts if they don't exist in the database.
    """
    logger.info("Application startup sequence initiated...")

    # Ensure upload directory exists
    # Calculate path relative to where Uvicorn is run (should be 'backend/')
    upload_dir_path = os.path.abspath(os.path.join(os.getcwd(), settings.UPLOAD_DIR))
    if not os.path.exists(upload_dir_path):
        try:
            os.makedirs(upload_dir_path)
            logger.info(f"Upload directory successfully created at: {upload_dir_path}")
        except OSError as e:
            logger.error(f"Error creating upload directory {upload_dir_path}: {e}")
            # Consider if this should prevent startup

    # Create initial users in the database
    db: Optional[SessionLocal] = None # Define db with type hint
    try:
        db = SessionLocal() # Obtain a new database session for startup tasks
        logger.info("Checking for default users...")

        # --- Default Admin ---
        admin_email = "admin@example.com"  # TODO: Change default email? Move to config?
        admin_password = "AdminPassword123!" # TODO: Change default password! Move to secure config/env?
        admin_user = crud.get_user_by_email(db, email=admin_email)
        if not admin_user:
            admin_create = UserCreate(
                email=admin_email,
                password=admin_password, # Raw password, will be hashed by crud.create_user
                full_name="Admin User",
                role=models.UserRole.ADMIN
            )
            crud.create_user(db, admin_create) # Handles hashing and DB commit
            logger.info(f"Default admin user '{admin_email}' created.")
        else:
            logger.info(f"Default admin user '{admin_email}' already exists.")

        # --- Default Regular User ---
        user_email = "user@example.com" # TODO: Change default email?
        user_password = "UserPassword123!" # TODO: Change default password!
        regular_user = crud.get_user_by_email(db, email=user_email)
        if not regular_user:
            user_create = UserCreate(
                email=user_email,
                password=user_password,
                full_name="Regular User",
                role=models.UserRole.USER
            )
            crud.create_user(db, user_create)
            logger.info(f"Default regular user '{user_email}' created.")
        else:
            logger.info(f"Default regular user '{user_email}' already exists.")

        logger.info("Default user check complete.")

    except Exception as e:
        logger.error(f"FATAL ERROR during startup user creation: {e}")
        # Depending on severity, you might want to raise the exception
        # to prevent the application from starting if the DB isn't usable.
        # traceback.print_exc() # uncomment for full traceback during debugging
    finally:
        if db:
            db.close() # Ensure the session is closed after use

    logger.info("Application startup complete.")


# --- Root Endpoint ---
@app.get("/", tags=["Root"], summary="Root Endpoint")
async def read_root():
    """
    Simple health check / welcome endpoint.
    """
    logger.info("Root endpoint '/' accessed.")
    return {"message": f"Welcome to {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}"}

# --- Optional Shutdown Event ---
@app.on_event("shutdown")
async def shutdown_event():
     logger.info("Application shutting down...")
     # Add any cleanup tasks here if needed