import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper para clases de Tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Colores vibrantes estilo Queens Master
const REGION_COLORS = [
  'bg-rose-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-cyan-500',
  'bg-lime-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500',
  'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-red-500', 'bg-slate-500', 'bg-zinc-500', 'bg-neutral-500'
];

interface GameBoardProps {
  size: number;
  regions: number[][];
  disabled?: boolean;
  onWin: () => void;
  onMistake?: () => void;
}

function createBoolMatrix(size: number, initial: boolean) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(initial));
}

export default function GameBoard({
  size,
  regions,
  disabled = false,
  onWin,
  onMistake,
}: GameBoardProps) {
  const [state, setState] = useState(() => ({
    queens: createBoolMatrix(size, false),
    userMarks: createBoolMatrix(size, false),
  }));
  const [conflicts, setConflicts] = useState<boolean[][]>(
    createBoolMatrix(size, false)
  );
  const [autoMarks, setAutoMarks] = useState<boolean[][]>(
    createBoolMatrix(size, false)
  );
  const [status, setStatus] = useState<string | null>(null);
  const [shakeCell, setShakeCell] = useState<{ r: number; c: number } | null>(
    null
  );
  const lastActionRef = useRef<
    | { r: number; c: number; action: 'mark' | 'queen' | 'remove-queen' }
    | null
  >(null);

  const regionCells = useMemo(() => {
    const map = new Map<number, Array<[number, number]>>();
    for (let r = 0; r < regions.length; r++) {
      for (let c = 0; c < regions[r].length; c++) {
        const regionId = regions[r][c];
        const list = map.get(regionId) ?? [];
        list.push([r, c]);
        map.set(regionId, list);
      }
    }
    return map;
  }, [regions]);

  const computeConflicts = (queens: boolean[][]) => {
    const nextConflicts = createBoolMatrix(size, false);
    const queenPositions: Array<[number, number]> = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (queens[r][c]) queenPositions.push([r, c]);
      }
    }

    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const [r1, c1] = queenPositions[i];
        const [r2, c2] = queenPositions[j];

        const sameRow = r1 === r2;
        const sameCol = c1 === c2;
        const sameRegion = regions[r1][c1] === regions[r2][c2];
        const adjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;

        if (sameRow || sameCol || sameRegion || adjacent) {
          nextConflicts[r1][c1] = true;
          nextConflicts[r2][c2] = true;
        }
      }
    }

    return nextConflicts;
  };

  const computeAutoMarks = (queens: boolean[][]) => {
    const nextAutoMarks = createBoolMatrix(size, false);
    const queenPositions: Array<[number, number]> = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (queens[r][c]) queenPositions.push([r, c]);
      }
    }

    for (const [r, c] of queenPositions) {
      for (let cc = 0; cc < size; cc++) {
        if (!queens[r][cc]) nextAutoMarks[r][cc] = true;
      }
      for (let rr = 0; rr < size; rr++) {
        if (!queens[rr][c]) nextAutoMarks[rr][c] = true;
      }

      const regionId = regions[r][c];
      const cells = regionCells.get(regionId) ?? [];
      for (const [rr, cc] of cells) {
        if (!queens[rr][cc]) nextAutoMarks[rr][cc] = true;
      }

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          if (!queens[rr][cc]) nextAutoMarks[rr][cc] = true;
        }
      }
    }

    for (const [r, c] of queenPositions) {
      nextAutoMarks[r][c] = false;
    }

    return nextAutoMarks;
  };

  const syncDerivedState = (queens: boolean[][]) => {
    const nextConflicts = computeConflicts(queens);
    const nextAutoMarks = computeAutoMarks(queens);
    setConflicts(nextConflicts);
    setAutoMarks(nextAutoMarks);

    const totalQueens = queens.flat().filter(Boolean).length;
    const hasConflicts = nextConflicts.some((row) => row.some((v) => v));
    if (totalQueens === size && !hasConflicts) onWin();

    const last = lastActionRef.current;
    if (!last) return;

    if (last.action === 'queen' && nextConflicts[last.r][last.c]) {
      setStatus('Esa reina entra en conflicto con las reglas.');
      setShakeCell({ r: last.r, c: last.c });
      onMistake?.();
    } else {
      setStatus(null);
      setShakeCell(null);
    }
  };

  // Manejar click en celda
  const handleCellClick = (r: number, c: number) => {
    if (disabled) return;
    setState((prev) => {
      const nextQueens = prev.queens.map((row) => [...row]);
      const nextUserMarks = prev.userMarks.map((row) => [...row]);

      const hasQueen = nextQueens[r][c];
      const hasUserMark = nextUserMarks[r][c];

      if (hasQueen) {
        nextQueens[r][c] = false;
        lastActionRef.current = { r, c, action: 'remove-queen' };
      } else if (hasUserMark) {
        nextQueens[r][c] = true;
        nextUserMarks[r][c] = false;
        lastActionRef.current = { r, c, action: 'queen' };
      } else {
        nextUserMarks[r][c] = true;
        lastActionRef.current = { r, c, action: 'mark' };
      }

      queueMicrotask(() => syncDerivedState(nextQueens));

      return { queens: nextQueens, userMarks: nextUserMarks };
    });
  };

  useEffect(() => {
    setState({
      queens: createBoolMatrix(size, false),
      userMarks: createBoolMatrix(size, false),
    });
    setConflicts(createBoolMatrix(size, false));
    setAutoMarks(createBoolMatrix(size, false));
    setStatus(null);
    setShakeCell(null);
    lastActionRef.current = null;
  }, [size, regions]);

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 text-red-300 text-xs font-semibold bg-red-500/10 px-4 py-2 rounded-full border border-red-400/20"
          >
            <AlertTriangle size={14} />
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="grid gap-1 p-2 bg-slate-900/50 rounded-xl shadow-2xl backdrop-blur-sm"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          width: 'min(90vw, 600px)',
          height: 'min(90vw, 600px)',
        }}
      >
        {regions.map((row, r) =>
          row.map((regionId, c) => {
            const hasQueen = state.queens[r]?.[c] ?? false;
            const hasUserMark = state.userMarks[r]?.[c] ?? false;
            const hasAutoMark = autoMarks[r]?.[c] ?? false;
            const showMark = !hasQueen && (hasUserMark || hasAutoMark);
            const isShaking = !!shakeCell && shakeCell.r === r && shakeCell.c === c;
            const showConflict = hasQueen && (conflicts[r]?.[c] ?? false);

            return (
              <motion.div
                key={`${r}-${c}`}
                whileTap={{ scale: 0.95 }}
                animate={
                  isShaking
                    ? { x: [0, -4, 4, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.25 }}
                onClick={() => handleCellClick(r, c)}
                className={cn(
                  'relative cursor-pointer rounded-sm flex items-center justify-center transition-colors duration-300',
                  REGION_COLORS[regionId % REGION_COLORS.length],
                  'hover:brightness-110 active:brightness-90 shadow-inner',
                  showConflict && 'ring-4 ring-red-500/80 ring-inset'
                )}
              >
                <AnimatePresence mode="wait">
                  {hasQueen && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      className="text-white drop-shadow-md"
                    >
                      <Crown size={32} fill="currentColor" strokeWidth={1.5} />
                    </motion.div>
                  )}
                  {showMark && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hasUserMark ? 0.45 : 0.25 }}
                      exit={{ opacity: 0 }}
                      className="text-black/50"
                    >
                      <X size={28} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity rounded-sm pointer-events-none" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
