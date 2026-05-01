import random

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import ENGINE, get_db
from app.generator.engine import QueensGenerator
from app.models.puzzle import Base, Puzzle
from app.schemas import PuzzleCreateRequest, PuzzleResponse

app = FastAPI(title="Queens Clone API")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
