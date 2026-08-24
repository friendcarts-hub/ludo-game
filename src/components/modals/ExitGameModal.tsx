import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ArrowLeft, AlertTriangle, ShieldAlert, Trophy, Play, RotateCcw } from 'lucide-react';
import { GameState } from '../../types';
import { soundManager } from '../../game/audio';

interface ExitGameModalProps {
  isOpen: boolean;
  gameState: GameState | null;
  onClose: () => void;
  onForfeit: () => void;
  onLeave: () => void;
  onRestart?: () => void;
}

export const ExitGameModal: React.FC<ExitGameModalProps> = ({
  isOpen,
  gameState,
  onClose,
  onForfeit,
  onLeave,
  onRestart,
}) => {
  if (!isOpen || !gameState) return null;

  const isRealWager = gameState.betAmount > 0;
  const isOffline = gameState.mode === 'offline';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1330] to-[#060818] border border-red-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] ring-1 ring-white/10 select-none"
        >
          {/* Top Warning Icon Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {isOffline ? 'Leave Match? (मैच छोड़ें?)' : 'Surrender & Exit? (हार स्वीकार करें?)'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xs leading-relaxed">
              {isOffline
                ? 'अगर आप मैच छोड़ते हैं, तो मैच समाप्त हो जाएगा और विरोधी खिलाड़ी जीत जाएगा।'
                : isRealWager
                ? `You are in ${gameState.mode.replace('_', ' ').toUpperCase()} with ${gameState.betAmount} coins wager. Exiting now will count as a MATCH LOSS and declare your opponent winner.`
                : 'मैच बीच में छोड़ने पर आपकी हार दर्ज होगी और विरोधी खिलाड़ी को विजेता घोषित कर दिया जाएगा।'}
            </p>
          </div>

          {/* Warning badge */}
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {isRealWager
                ? 'मैच छोड़ने पर आपकी हार होगी और वेजर कॉइन्स विरोधी को मिलेंगे।'
                : 'Leaving this match records an immediate loss on your game record.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            {/* Resume Playing (Primary / Safe Action) */}
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>RESUME PLAYING</span>
            </button>

            {/* Restart Match (If Offline or Vs AI) */}
            {onRestart && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onRestart();
                }}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Restart Match</span>
              </button>
            )}

            {/* Confirm Surrender / Exit */}
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
                onForfeit();
              }}
              className="w-full py-2.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-300 font-black text-xs sm:text-sm border border-red-500/40 hover:border-red-400 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Forfeit & Leave Match (मैच छोड़ें / हार स्वीकार करें)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
