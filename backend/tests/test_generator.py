import pytest
from app.generator.engine import QueensGenerator

def test_generator_output_size():
    """Verifica que el tablero generado tenga el tamaño correcto."""
    size = 8
    gen = QueensGenerator(size)
    regions, solution = gen.generate()
    
    assert len(regions) == size
    assert all(len(row) == size for row in regions)
    assert len(solution) == size

def test_queen_rules_rows_and_cols():
    """Verifica que no haya dos reinas en la misma fila o columna."""
    size = 8
    gen = QueensGenerator(size)
    _, solution = gen.generate()
    
    rows = [r for r, c in solution]
    cols = [c for r, c in solution]
    
    assert len(set(rows)) == size, "Hay reinas compartiendo fila"
    assert len(set(cols)) == size, "Hay reinas compartiendo columna"

def test_queen_rules_adjacency():
    """Verifica que no haya reinas adyacentes (incluyendo diagonales inmediatas)."""
    size = 8
    gen = QueensGenerator(size)
    _, solution = gen.generate()
    
    for i, (r1, c1) in enumerate(solution):
        for j, (r2, c2) in enumerate(solution):
            if i == j: continue
            # Distancia de Chebyshev <= 1 significa que son adyacentes
            assert max(abs(r1 - r2), abs(c1 - c2)) > 1, f"Reinas en ({r1},{c1}) y ({r2},{c2}) son adyacentes"

def test_queen_rules_regions():
    """Verifica que haya exactamente una reina por cada región de color."""
    size = 8
    gen = QueensGenerator(size)
    regions, solution = gen.generate()
    
    queen_regions = []
    for r, c in solution:
        queen_regions.append(regions[r][c])
        
    assert len(set(queen_regions)) == size, "Hay reinas compartiendo la misma región de color"

def test_regions_are_contiguous():
    """Verifica que todas las celdas de una región estén conectadas."""
    size = 8
    gen = QueensGenerator(size)
    regions, _ = gen.generate()
    
    for region_id in range(size):
        # Encontrar todas las celdas de esta región
        cells = [(r, c) for r in range(size) for c in range(size) if regions[r][c] == region_id]
        assert len(cells) > 0, f"La región {region_id} está vacía"
        
        # BFS para verificar conectividad
        visited = set()
        queue = [cells[0]]
        visited.add(cells[0])
        
        while queue:
            r, c = queue.pop(0)
            for nr, nc in [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]:
                if (nr, nc) in cells and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        
        assert len(visited) == len(cells), f"La región {region_id} no es contigua"

@pytest.mark.parametrize("size", [5, 10, 15])
def test_different_sizes(size):
    """Prueba el generador con diferentes tamaños de tablero."""
    gen = QueensGenerator(size)
    regions, solution = gen.generate()
    assert len(regions) == size
    assert len(solution) == size
