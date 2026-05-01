'use client';

import { useState, useEffect } from 'react';
import GameBoard from '@/components/GameBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, Settings, AlertCircle, Heart, Skull } from 'lucide-react';
import { generateQueensBoard } from '@/lib/gameEngine';

export default function Home() {
  const initialLives = 3;
  const [gameData, setGameData] = useState<{ size: number, seed: number, regions: number[][], solution: Array<[number, number]> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWin, setShowWin] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [lives, setLives] = useState(initialLives);

  const handleMistake = () => {
    if (loading || showWin || gameOver) return;
    setLives((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setGameOver(true);
      return next;
    });
  };

  const fetchNewGame = async (size: number) => {
    setLoading(true);
    setShowWin(false);
    setGameOver(false);
    setError(null);
    setLives(initialLives);
    console.log(`Intentando cargar tablero de tamaño ${size}...`);

    try {
      // Intentar con el Backend
      const res = await fetch(`http://127.0.0.1:8000/generate?size=${size}`, { 
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error("Backend respondió con error");
      const data = await res.json();
      console.log("Tablero cargado desde el Backend ✅");
      setGameData(data);
    } catch (err) {
      console.warn("Backend inaccesible, activando motor de respaldo (Frontend Fallback) 🛠️");
      // Activar Fallback
      const fallbackData = generateQueensBoard(size);
      if (fallbackData) {
        setGameData(fallbackData);
        setError("Modo Offline: Usando generador local (Backend no detectado)");
      } else {
        setError("Error crítico: No se pudo generar el tablero.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewGame(difficulty);
  }, [difficulty]);

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 text-center"
      >
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-fuchsia-500 mb-2">
          QUEENS CLONE
        </h1>
        <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">
          Master of Logic & Strategy
        </p>
      </motion.div>

      {/* Controles */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex gap-4">
          <button 
            onClick={() => fetchNewGame(difficulty)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-full font-bold transition-all border border-slate-700 active:scale-95"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            Nuevo Reto
          </button>
          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-full font-bold outline-none cursor-pointer"
          >
            <option value={5}>Fácil (5x5)</option>
            <option value={8}>Normal (8x8)</option>
            <option value={12}>Difícil (12x12)</option>
            <option value={15}>Experto (15x15)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
          <span className="uppercase tracking-wide text-slate-400">Vidas</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: initialLives }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={i < lives ? "text-red-400" : "text-slate-700"}
                fill={i < lives ? "currentColor" : "none"}
              />
            ))}
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-amber-400 text-xs font-semibold bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20"
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </div>

      {/* Área del Juego */}
      <div className="relative">
        {loading ? (
          <div className="w-[min(90vw,600px)] h-[min(90vw,600px)] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gameData && (
          <GameBoard 
            size={gameData.size} 
            regions={gameData.regions} 
            solution={gameData.solution}
            disabled={loading || showWin || gameOver}
            onWin={() => setShowWin(true)}
            onMistake={handleMistake}
          />
        )}

        {/* Overlay de Victoria */}
        <AnimatePresence>
          {showWin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-xl z-10 border-4 border-yellow-500/50"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Trophy size={120} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-6">¡VICTORIA!</h2>
              <button 
                onClick={() => fetchNewGame(difficulty)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-10 py-4 rounded-full font-black text-xl shadow-lg transition-all active:scale-95"
              >
                SIGUIENTE NIVEL
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay de Derrota */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-xl z-10 border-4 border-red-500/40"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                <Skull size={110} className="text-red-400 mb-4 drop-shadow-[0_0_15px_rgba(248,113,113,0.35)]" />
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-2">¡DERROTA!</h2>
              <p className="text-slate-300 mb-6 font-semibold">Te quedaste sin vidas.</p>
              <button 
                onClick={() => fetchNewGame(difficulty)}
                className="bg-red-500 hover:bg-red-400 text-slate-900 px-10 py-4 rounded-full font-black text-xl shadow-lg transition-all active:scale-95"
              >
                REINTENTAR
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Info */}
      <div className="mt-12 text-slate-500 text-sm font-medium flex gap-8">
        <span className="flex items-center gap-1"><Settings size={14} /> 1 Reina por fila/col/color</span>
        <span className="flex items-center gap-1">✨ Basado en SDD</span>
      </div>
    </main>
  );
}
