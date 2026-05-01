import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
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
  onWin: () => void;
}

type CellState = 'empty' | 'queen' | 'mark';

export default function GameBoard({ size, regions, onWin }: GameBoardProps) {
  const [board, setBoard] = useState<CellState[][]>(
    Array(size).fill(null).map(() => Array(size).fill('empty'))
  );
  const [conflicts, setConflicts] = useState<boolean[][]>(
    Array(size).fill(null).map(() => Array(size).fill(false))
  );

  // Manejar click en celda
  const handleCellClick = (r: number, c: number) => {
    const newBoard = board.map(row => [...row]);
    const current = newBoard[r][c];
    
    // Ciclo: vacío -> reina -> marca (X) -> vacío
    if (current === 'empty') newBoard[r][c] = 'queen';
    else if (current === 'queen') newBoard[r][c] = 'mark';
    else newBoard[r][c] = 'empty';
    
    setBoard(newBoard);
    validateBoard(newBoard);
  };

  // Validar reglas del juego
  const validateBoard = (currentBoard: CellState[][]) => {
    const newConflicts = Array(size).fill(null).map(() => Array(size).fill(false));
    const queenPositions: [number, number][] = [];

    // Recopilar posiciones de reinas
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentBoard[r][c] === 'queen') queenPositions.push([r, c]);
      }
    }

    // Verificar conflictos
    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const [r1, c1] = queenPositions[i];
        const [r2, c2] = queenPositions[j];

        const sameRow = r1 === r2;
        const sameCol = c1 === c2;
        const sameRegion = regions[r1][c1] === regions[r2][c2];
        const adjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;

        if (sameRow || sameCol || sameRegion || adjacent) {
          newConflicts[r1][c1] = true;
          newConflicts[r2][c2] = true;
        }
      }
    }

    setConflicts(newConflicts);

    // Verificar victoria
    const totalQueens = queenPositions.length;
    const hasConflicts = newConflicts.some(row => row.some(c => c));
    if (totalQueens === size && !hasConflicts) {
      onWin();
    }
  };

  return (
    <div 
      className="grid gap-1 p-2 bg-slate-900/50 rounded-xl shadow-2xl backdrop-blur-sm"
      style={{ 
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        width: 'min(90vw, 600px)',
        height: 'min(90vw, 600px)'
      }}
    >
      {regions.map((row, r) => 
        row.map((regionId, c) => (
          <motion.div
            key={`${r}-${c}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCellClick(r, c)}
            className={cn(
              "relative cursor-pointer rounded-sm flex items-center justify-center transition-colors duration-300",
              REGION_COLORS[regionId % REGION_COLORS.length],
              "hover:brightness-110 active:brightness-90 shadow-inner",
              conflicts[r][c] && "ring-4 ring-red-500/80 ring-inset"
            )}
          >
            <AnimatePresence mode="wait">
              {board[r][c] === 'queen' && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                  className="text-white drop-shadow-md"
                >
                  <Crown size={32} fill="currentColor" strokeWidth={1.5} />
                </motion.div>
              )}
              {board[r][c] === 'mark' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  className="text-black/40"
                >
                  <X size={24} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Efecto de brillo sutil */}
            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity rounded-sm pointer-events-none" />
          </motion.div>
        ))
      )}
    </div>
  );
}
