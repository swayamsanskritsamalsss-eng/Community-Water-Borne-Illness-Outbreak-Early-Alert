from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


# SQLite (local demo) needs check_same_thread disabled because
# FastAPI may use different threads for the same connection.
# PostgreSQL/Supabase (production) does not need this.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)


engine = create_engine(
    settings.sqlalchemy_database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


def get_db():
    """
    FastAPI database dependency.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()