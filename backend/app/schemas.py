from datetime import datetime

from pydantic import BaseModel, Field


class PuzzleCreateRequest(BaseModel):
    size: int
    seed: int | None = None


class PuzzleResponse(BaseModel):
    id: int
    size: int
    seed: int
    regions: list[list[int]]
    solution: list[tuple[int, int]]


class PuzzleAttemptCreateRequest(BaseModel):
    outcome: str = Field(pattern="^(win|lose)$")
    mistakes: int = Field(ge=0)
    duration_ms: int = Field(ge=0)
    started_at: datetime | None = None
    ended_at: datetime | None = None


class PuzzleAttemptResponse(BaseModel):
    id: int
    puzzle_id: int
    outcome: str
    mistakes: int
    duration_ms: int


class PuzzleStatsResponse(BaseModel):
    puzzle_id: int
    plays: int
    wins: int
    losses: int
    avg_duration_ms: float | None
    avg_mistakes: float | None

