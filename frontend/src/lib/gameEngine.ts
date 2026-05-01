/**
 * Generador de respaldo (fallback) en el frontend.
 * Recrea la lógica del motor de Python en TypeScript para asegurar que el juego funcione 
 * incluso si el backend no está disponible localmente.
 */

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function generateQueensBoard(size: number, seed?: number) {
  const effectiveSeed = seed ?? Math.floor(Date.now() % 2_147_483_647);
  const rand = mulberry32(effectiveSeed);
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  
  // 1. Colocación de reinas válida (Backtracking simplificado)
  const solution: [number, number][] = [];
  const rows = Array.from({length: size}, (_, i) => i);
  const cols = Array.from({length: size}, (_, i) => i);
  shuffleInPlace(rows, rand);
  shuffleInPlace(cols, rand);

  function isSafe(r: number, c: number, queens: [number, number][]) {
    for (const [qr, qc] of queens) {
      if (r === qr || c === qc) return false;
      if (Math.abs(r - qr) <= 1 && Math.abs(c - qc) <= 1) return false;
    }
    return true;
  }

  function backtrack(rowIdx: number): boolean {
    if (rowIdx === size) return true;
    const r = rows[rowIdx];
    const shuffledCols = [...cols];
    shuffleInPlace(shuffledCols, rand);
    for (const c of shuffledCols) {
      if (isSafe(r, c, solution)) {
        solution.push([r, c]);
        if (backtrack(rowIdx + 1)) return true;
        solution.pop();
      }
    }
    return false;
  }

  if (!backtrack(0)) return null;

  // 2. Crecimiento de regiones (Flood Fill)
  const queue: [number, number, number][] = [];
  solution.forEach(([r, c], i) => {
    regions[r][c] = i;
    queue.push([r, c, i]);
  });

  let cellsLeft = size * size - size;
  while (queue.length > 0 && cellsLeft > 0) {
    const idx = Math.floor(rand() * queue.length);
    const [r, c, regionId] = queue.splice(idx, 1)[0];
    
    const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
        regions[nr][nc] = regionId;
        queue.push([nr, nc, regionId]);
        cellsLeft--;
      }
    }
    // Mantener la semilla en la cola si tiene vecinos vacíos
    if (neighbors.some(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1)) {
        queue.push([r, c, regionId]);
    }
  }

  return { size, seed: effectiveSeed, regions, solution };
}
