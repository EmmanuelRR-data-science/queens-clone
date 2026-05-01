import random

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.generator.engine import QueensGenerator
from typing import List, Tuple

app = FastAPI(title="Queens Clone API")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
