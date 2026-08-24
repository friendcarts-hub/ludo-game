import React from 'react';
import { motion } from 'motion/react';
import { Bot, Crown } from 'lucide-react';
import { Player, PlayerColor } from '../../types';
import { Dice3D } from './Dice3D';

interface CornerPlayerStationProps {
  player: Player;
  isActive: boolean;
  isRolling: boolean;
  currentDice: number | null;
  diceRolled: boolean;
  canRoll: boolean;
  turnTimer: number;
  maxTurnTimer: number;
  onRoll: () => void;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PIN_COLORS: Record<
  PlayerColor,
  {
    pipColor: string;
    outerRing: string;
    glow: string;
  }
> = {
  green: {
    pipColor: '#00a651',
    outerRing: '#005c2d',
    glow: 'rgba(0, 166, 81, 0.6)',
  },
  yellow: {
    pipColor: '#ffc700',
    outerRing: '#b38600',
    glow: 'rgba(255, 199, 0, 0.6)',
  },
  red: {
    pipColor: '#ed1c24',
    outerRing: '#990000',
    glow: 'rgba(237, 28, 36, 0.6)',
  },
  blue: {
    pipColor: '#00aeef',
    outerRing: '#005f88',
    glow: 'rgba(0, 174, 239, 0.6)',
  },
};

export const CornerPlayerStation: React.FC<CornerPlayerStationProps> = ({
  player,
  isActive,
  isRolling,
  currentDice,
  diceRolled,
  canRoll,
  turnTimer,
  maxTurnTimer,
  onRoll,
  position,
}) => {
  const pin = PIN_COLORS[player.color];
  const isHuman = player.type === 'human';

  // Layout alignment: Right-side cards place dice on left, pin on right
  const isRightSide = position === 'top-right' || position === 'bottom-right';

  return (
    <div
      id={`station-${player.color}`}
      className={`relative flex items-center justify-between p-1 sm:p-1.5 h-[58px] sm:h-[66px] rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-[#ffcc00] shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${
        isRightSide ? 'flex-row-reverse' : 'flex-row'
      } w-[48%] max-w-[185px] sm:max-w-[220px] ${
        isActive
          ? 'bg-gradient-to-b from-[#0c59bf] via-[#083e8b] to-[#042459] ring-2 ring-yellow-400/90 shadow-[0_0_20px_rgba(255,204,0,0.5)]'
          : 'bg-gradient-to-b from-[#0e4896] via-[#0a316b] to-[#051c40] opacity-95'
      }`}
    >
      {/* 1. Teardrop Pin Marker Badge (Exact Match to User Reference) */}
      <div className="relative shrink-0 flex items-center justify-center px-1">
        <div className="relative w-8 h-10 sm:w-9 sm:h-11 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          <svg viewBox="0 0 36 46" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`badge-chrome-${player.color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#e2e8f0" />
                <stop offset="75%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <radialGradient id={`badge-pip-${player.color}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="35%" stopColor={pin.pipColor} />
                <stop offset="100%" stopColor={pin.outerRing} />
              </radialGradient>
            </defs>

            {/* Teardrop Pin Outer Frame */}
            <path
              d="M18 1.5 C9 1.5 2 8.5 2 17.5 C2 27 18 44.5 18 44.5 C18 44.5 34 27 34 17.5 C34 8.5 27 1.5 18 1.5 Z"
              fill={`url(#badge-chrome-${player.color})`}
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Inner Colored Core Bead */}
            <circle
              cx="18"
              cy="17.5"
              r="9"
              fill={`url(#badge-pip-${player.color})`}
              stroke="#0f172a"
              strokeWidth="0.8"
            />
            {/* Glossy Reflection */}
            <ellipse
              cx="15"
              cy="14"
              rx="3"
              ry="1.8"
              fill="#ffffff"
              opacity="0.75"
              transform="rotate(-25 15 14)"
            />
          </svg>

          {/* AI Bot badge */}
          {player.type === 'ai' && (
            <div className="absolute -bottom-1 -right-1 bg-slate-900 text-cyan-300 rounded-full p-0.5 border border-cyan-400/60 shadow">
              <Bot className="w-3 h-3" />
            </div>
          )}

          {/* Winner Crown */}
          {player.hasWon && (
            <div className="absolute -top-3 -right-1 bg-yellow-400 text-slate-950 rounded-full p-0.5 shadow animate-bounce">
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Soft Pink/Cream Gradient Square Dice Box */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Turn Timer Glowing Progress Indicator when active */}
        {isActive && (
          <div
            className="absolute -inset-1.5 rounded-2xl pointer-events-none transition-opacity"
            style={{
              border: `2px solid ${turnTimer <= 4 ? '#ef4444' : '#ffcc00'}`,
              boxShadow: `0 0 12px ${turnTimer <= 4 ? 'rgba(239,68,68,0.8)' : 'rgba(255,204,0,0.7)'}`,
            }}
          />
        )}

        {/* Dice Tray Container */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#ffdede] via-[#ffebeb] to-[#ffdada] border-2 border-[#fff3d4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center p-0.5 relative"
        >
          {isActive ? (
            <div className="relative flex items-center justify-center">
              <Dice3D
                value={currentDice}
                isRolling={isRolling}
                canRoll={canRoll && isHuman}
                color={player.color}
                size="md"
                onRoll={onRoll}
                showTimerRing={true}
                turnTimer={turnTimer}
                maxTurnTimer={maxTurnTimer}
              />
              {!diceRolled && !isRolling && isHuman && canRoll && !currentDice && (
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.9, 1, 0.9] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="absolute -bottom-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md pointer-events-none tracking-tight border border-white/50 z-30"
                >
                  ROLL
                </motion.div>
              )}
            </div>
          ) : (
            /* Inactive Player Dice Placeholder */
            <div className="w-8 h-8 rounded-lg bg-white/70 border border-slate-300/80 shadow-sm flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400/80" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
