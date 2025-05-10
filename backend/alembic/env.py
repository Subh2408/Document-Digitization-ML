# InsureDocsProject/backend/alembic/env.py

from logging.config import fileConfig
import os
import sys

# Imports required by Alembic and SQLAlchemy
from sqlalchemy import pool
from sqlalchemy import create_engine
from alembic import context

# --- Configuration to Locate Your Application ---
# Add the parent directory ('InsureDocsProject/backend/') to the Python path
# This allows Alembic to find modules within your 'app' package.
PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

# Import your application's Base object and settings
try:
    from app.database import Base  # Your SQLAlchemy declarative base
    import app.models              # <<< *** THE KEY FIX: Explicitly import models ***
                                   # This ensures models inheriting from Base are loaded
                                   # before Base.metadata is accessed below.
    from app.config import settings  # Your application's configuration settings
except ImportError as e:
    sys.stderr.write(f"Error importing application modules in alembic/env.py: {e}\n")
    sys.stderr.write("Ensure you are running alembic from the 'backend' directory "
                     "and that the path is correct.\n")
    sys.exit(1)

# --- Alembic Configuration ---

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Set the database URL in the Alembic config object programmatically.
# This overrides/provides the value for 'sqlalchemy.url' defined
# in alembic.ini, ensuring consistency with your application's settings.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except Exception as e:
        sys.stderr.write(f"Error configuring logging from alembic.ini: {e}\n")

# Set the target metadata for 'autogenerate' support.
# Alembic compares this metadata with the database schema.
# This MUST use the Base from your application after your models have been loaded.
target_metadata = Base.metadata

# --- Migration Functions ---

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True, # Render values directly in SQL statements (offline mode)
        dialect_opts={"paramstyle": "named"},
        # Enable batch mode for SQLite to handle ALTER limitations
        render_as_batch=settings.DATABASE_URL.startswith("sqlite"),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # Create engine directly using the sqlalchemy.url set in the config object
    engine_args = {}
    # 'check_same_thread' is mainly needed for the ASGI app's concurrent access,
    # usually not required for Alembic's single-threaded operation,
    # but we respect the possibility if configured.
    if settings.DATABASE_URL.startswith("sqlite"):
         # Check if engine_args should be passed to create_engine if necessary
         pass

    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"), # Get URL previously set from settings
        poolclass=pool.NullPool,
        **engine_args
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Enable batch mode for SQLite to handle ALTER limitations
            render_as_batch=settings.DATABASE_URL.startswith("sqlite"),
        )

        with context.begin_transaction():
            context.run_migrations()

# --- Main Execution Logic ---

# Determine if running in offline or online mode and call the appropriate function.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()