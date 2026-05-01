from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
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


class PuzzleAttempt(Base):
    __tablename__ = "puzzle_attempts"

    id = Column(Integer, primary_key=True, index=True)
    puzzle_id = Column(Integer, ForeignKey("puzzles.id"), nullable=False, index=True)
    outcome = Column(String(16), nullable=False, index=True)
    mistakes = Column(Integer, nullable=False, default=0)
    duration_ms = Column(Integer, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
