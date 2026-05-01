import os
import random

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import ENGINE, get_db
from app.generator.engine import QueensGenerator
from app.models.puzzle import Base, Puzzle, PuzzleAttempt
from app.schemas import (
    PuzzleAttemptCreateRequest,
    PuzzleAttemptResponse,
    PuzzleCreateRequest,
    PuzzleResponse,
    PuzzleStatsResponse,
)

app = FastAPI(title="Queens Clone API")

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

trusted_hosts_env = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1")
trusted_hosts = [h.strip() for h in trusted_hosts_env.split(",") if h.strip()]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
    response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    return response


@app.on_event("startup")
def _startup() -> None:
    Base.metadata.create_all(bind=ENGINE)


@app.get("/")
async def root():
    return {"message": "Welcome to Queens Clone API", "docs": "/docs"}

@app.get("/generate")
async def generate_board(
    size: int = Query(default=8, ge=5, le=20),
    seed: int | None = Query(default=None, ge=0),
):
    """
    Endpoint para generar un nuevo tablero de Queens.
    """
    effective_seed = seed if seed is not None else random.randint(0, 2**31 - 1)
    generator = QueensGenerator(size, seed=effective_seed)
    regions, solution = generator.generate()
    
    return {
        "size": size,
        "seed": effective_seed,
        "regions": regions,
        "solution": solution,
        "rules": [
            "Una reina por fila",
            "Una reina por columna",
            "Una reina por región de color",
            "Dos reinas no pueden tocarse (ni en diagonal)"
        ]
    }


@app.post("/puzzles", response_model=PuzzleResponse)
def create_puzzle(payload: PuzzleCreateRequest, db: Session = Depends(get_db)):
    if payload.size < 5 or payload.size > 20:
        raise HTTPException(status_code=400, detail="size must be between 5 and 20")

    effective_seed = payload.seed if payload.seed is not None else random.randint(0, 2**31 - 1)
    generator = QueensGenerator(payload.size, seed=effective_seed)
    regions, solution = generator.generate()

    puzzle = Puzzle(
        size=payload.size,
        seed=effective_seed,
        regions=regions,
        solution=solution,
    )
    db.add(puzzle)
    db.commit()
    db.refresh(puzzle)

    return PuzzleResponse(
        id=puzzle.id,
        size=puzzle.size,
        seed=puzzle.seed,
        regions=puzzle.regions,
        solution=[tuple(x) for x in puzzle.solution],
    )


@app.get("/puzzles/{puzzle_id}", response_model=PuzzleResponse)
def get_puzzle(puzzle_id: int, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="puzzle not found")

    return PuzzleResponse(
        id=puzzle.id,
        size=puzzle.size,
        seed=puzzle.seed,
        regions=puzzle.regions,
        solution=[tuple(x) for x in puzzle.solution],
    )


@app.post("/puzzles/{puzzle_id}/attempts", response_model=PuzzleAttemptResponse)
def create_attempt(puzzle_id: int, payload: PuzzleAttemptCreateRequest, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="puzzle not found")

    if payload.started_at and payload.ended_at and payload.ended_at < payload.started_at:
        raise HTTPException(status_code=400, detail="ended_at must be >= started_at")

    attempt = PuzzleAttempt(
        puzzle_id=puzzle_id,
        outcome=payload.outcome,
        mistakes=payload.mistakes,
        duration_ms=payload.duration_ms,
        started_at=payload.started_at,
        ended_at=payload.ended_at,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return PuzzleAttemptResponse(
        id=attempt.id,
        puzzle_id=attempt.puzzle_id,
        outcome=attempt.outcome,
        mistakes=attempt.mistakes,
        duration_ms=attempt.duration_ms,
    )


@app.get("/puzzles/{puzzle_id}/stats", response_model=PuzzleStatsResponse)
def get_puzzle_stats(puzzle_id: int, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="puzzle not found")

    plays = (
        db.query(func.count(PuzzleAttempt.id))
        .filter(PuzzleAttempt.puzzle_id == puzzle_id)
        .scalar()
    )
    wins = (
        db.query(func.count(PuzzleAttempt.id))
        .filter(PuzzleAttempt.puzzle_id == puzzle_id, PuzzleAttempt.outcome == "win")
        .scalar()
    )
    losses = (
        db.query(func.count(PuzzleAttempt.id))
        .filter(PuzzleAttempt.puzzle_id == puzzle_id, PuzzleAttempt.outcome == "lose")
        .scalar()
    )
    avg_duration_ms = (
        db.query(func.avg(PuzzleAttempt.duration_ms))
        .filter(PuzzleAttempt.puzzle_id == puzzle_id)
        .scalar()
    )
    avg_mistakes = (
        db.query(func.avg(PuzzleAttempt.mistakes))
        .filter(PuzzleAttempt.puzzle_id == puzzle_id)
        .scalar()
    )

    return PuzzleStatsResponse(
        puzzle_id=puzzle_id,
        plays=int(plays or 0),
        wins=int(wins or 0),
        losses=int(losses or 0),
        avg_duration_ms=float(avg_duration_ms) if avg_duration_ms is not None else None,
        avg_mistakes=float(avg_mistakes) if avg_mistakes is not None else None,
    )
