from sqlalchemy import Column, DateTime, Integer, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Puzzle(Base):
    __tablename__ = "puzzles"

    id = Column(Integer, primary_key=True, index=True)
    size = Column(Integer, nullable=False, index=True)
    seed = Column(Integer, nullable=False, index=True)
    regions = Column(JSON, nullable=False)
    solution = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

