import random
from typing import List, Optional, Tuple

class QueensGenerator:
    """
    Motor de generación de tableros para el juego Queens.
    Implementa algoritmos de generación de regiones contiguas y 
    validación mediante CSP (Constraint Satisfaction Problem).
    """

    def __init__(self, size: int, seed: int | None = None):
        self.size = size
        self.seed = seed
        self.rng = random.Random(seed)
        self.board = [[None for _ in range(size)] for _ in range(size)]
        self.regions = [[-1 for _ in range(size)] for _ in range(size)]

    def generate(self) -> Tuple[List[List[int]], List[Tuple[int, int]]]:
        """
        Genera un tablero completo: regiones y una solución válida.
        """
        self.regions = [[-1 for _ in range(self.size)] for _ in range(self.size)]
        # 1. Generar una solución válida primero para asegurar que el tablero sea resoluble
        solution = self._generate_valid_queen_placement()
        if not solution:
            raise ValueError("No se pudo generar una disposición de reinas válida.")

        # 2. Generar regiones contiguas alrededor de esas reinas
        self._generate_regions(solution)
        
        return self.regions, solution

    def _generate_valid_queen_placement(self) -> Optional[List[Tuple[int, int]]]:
        """
        Busca una disposición de N reinas que cumpla las reglas de Queens.
        """
        queens = []
        rows = list(range(self.size))
        cols = list(range(self.size))
        self.rng.shuffle(rows)
        self.rng.shuffle(cols)

        def is_safe(r, c, placed_queens):
            for qr, qc in placed_queens:
                # Misma fila o columna (ya manejado por la iteración)
                if r == qr or c == qc: return False
                # Adyacencia (incluyendo diagonal inmediata)
                if abs(r - qr) <= 1 and abs(c - qc) <= 1: return False
            return True

        def backtrack(row_idx):
            if row_idx == self.size:
                return True
            
            r = rows[row_idx]
            # Mezclar columnas para aleatoriedad
            shuffled_cols = list(range(self.size))
            self.rng.shuffle(shuffled_cols)
            
            for c in shuffled_cols:
                if is_safe(r, c, queens):
                    queens.append((r, c))
                    if backtrack(row_idx + 1):
                        return True
                    queens.pop()
            return False

        if backtrack(0):
            return queens
        return None

    def _generate_regions(self, solution: List[Tuple[int, int]]):
        """
        Algoritmo de crecimiento de regiones (Flood Fill / Seed Growth).
        Cada reina de la solución es la semilla de una región.
        """
        # Inicializar regiones con las semillas (posiciones de las reinas)
        queue = []
        for i, (r, c) in enumerate(solution):
            self.regions[r][c] = i
            queue.append((r, c, i))

        self.rng.shuffle(queue)
        
        # Expandir regiones aleatoriamente hasta llenar el tablero
        cells_left = self.size * self.size - self.size
        
        while queue and cells_left > 0:
            r, c, region_id = queue.pop(0)
            
            # Vecinos (Arriba, Abajo, Izquierda, Derecha)
            neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
            self.rng.shuffle(neighbors)
            
            for nr, nc in neighbors:
                if 0 <= nr < self.size and 0 <= nc < self.size:
                    if self.regions[nr][nc] == -1:
                        self.regions[nr][nc] = region_id
                        queue.append((nr, nc, region_id))
                        cells_left -= 1
                        # Pequeña probabilidad de mover al frente para crecimiento más orgánico
                        if self.rng.random() > 0.3:
                            self.rng.shuffle(queue)
                        break
            
            # Si la región actual no pudo expandirse pero aún quedan celdas, 
            # re-añadimos a la cola para intentar después si tiene espacio
            if any(0 <= nr < self.size and 0 <= nc < self.size and self.regions[nr][nc] == -1 
                   for nr, nc in neighbors):
                queue.append((r, c, region_id))

if __name__ == "__main__":
    # Test rápido
    gen = QueensGenerator(8)
    regions, sol = gen.generate()
    for row in regions:
        print(row)
    print(f"Solución: {sol}")
