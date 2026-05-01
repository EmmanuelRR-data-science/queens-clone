from pydantic import BaseModel


class PuzzleCreateRequest(BaseModel):
    size: int
    seed: int | None = None


class PuzzleResponse(BaseModel):
    id: int
    size: int
    seed: int
    regions: list[list[int]]
    solution: list[tuple[int, int]]

