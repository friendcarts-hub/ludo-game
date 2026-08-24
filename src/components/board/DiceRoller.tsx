import React from 'react';
import { PlayerColor } from '../../types';
import { Dice3D } from './Dice3D';

interface DiceRollerProps {
  currentDice: number | null;
  isRolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  turnTimer: number;
  maxTurnTimer: number;
  onRoll: () => void;
  isAiTurn: boolean;
}

const COLOR_GLOW: Record<PlayerColor, { ring: string; border: string; bg: string; button: string }> = {
  red: {
    ring: 'shadow-[0_0_25px_rgba(239,68,68,0.7)]',
    border: 'border-red-500',
    bg: 'from-red-600 to-rose-700',
    button: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/50',
  },
  green: {
    ring: 'shadow-[0_0_25px_rgba(34,197,94,0.7)]',
    border: 'border-emerald-500',
    bg: 'from-emerald-600 to-green-700',
    button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-900/50',
  },
  yellow: {
    ring: 'shadow-[0_0_25px_rgba(234,179,8,0.7)]',
    border: 'border-amber-500',
    bg: 'from-amber-500 to-yellow-600',
    button: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-amber-900/50',
  },
  blue: {
    ring: 'shadow-[0_0_25px_rgba(59,130,246,0.7)]',
    border: 'border-blue-500',
    bg: 'from-blue-600 to-indigo-700',
    button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/50',
  },
};

export const DiceRoller: React.FC<DiceRollerProps> = ({
  currentDice,
  isRolling,
  canRoll,
  activeColor,
  turnTimer,
  maxTurnTimer,
  onRoll,
  isAiTurn,
}) => {
  const styles = COLOR_GLOW[activeColor];

  return (
    <div id="dice-roller-container" className="flex flex-col items-center gap-1 sm:gap-2">
      {/* 3D Dice with Turn Ring and Radial Timer */}
      <div className="relative flex items-center justify-center p-1">
        <Dice3D
          value={currentDice}
          isRolling={isRolling}
          canRoll={canRoll && !isAiTurn}
          color={activeColor}
          size="lg"
          onRoll={onRoll}
          showTimerRing={true}
          turnTimer={turnTimer}
          maxTurnTimer={maxTurnTimer}
        />
      </div>

      {/* Action Button & Timer Label */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <button
          id="btn-roll-dice"
          onClick={onRoll}
          disabled={!canRoll || isAiTurn || isRolling}
          className={`px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black shadow-lg transition-all transform active:scale-95 flex items-center gap-1.5 ${
            canRoll && !isAiTurn
              ? `${styles.button} cursor-pointer animate-pulse`
              : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          {isRolling
            ? 'Rolling...'
            : isAiTurn
            ? 'AI Thinking...'
            : canRoll
            ? 'TAP TO ROLL 🎲'
            : 'Move Token'}
        </button>

        {/* Turn Countdown Badge */}
        <span
          className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider ${
            turnTimer <= 5 ? 'text-red-400 animate-bounce' : 'text-slate-400'
          }`}
        >
          ⏱️ {turnTimer}s
        </span>
      </div>
    </div>
  );
};
