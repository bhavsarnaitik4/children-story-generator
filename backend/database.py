from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Create SQLite database by default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./short_stories.db")

# check_same_thread=False is needed only for SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
