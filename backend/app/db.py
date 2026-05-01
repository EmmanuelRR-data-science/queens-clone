import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        return "sqlite:///./dev.db"
    return url


ENGINE = create_engine(get_database_url(), future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

