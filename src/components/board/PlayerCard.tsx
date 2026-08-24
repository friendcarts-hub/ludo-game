import React from 'react';
import { motion } from 'motion/react';
import { Swords, Trophy, Crown, Bot } from 'lucide-react';
import { Player, PlayerColor } from '../../types';
import { AVATAR_LIST } from '../../data/avatars';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  position: 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right';
}

const COLOR_MAP: Record<
  PlayerColor,
  {
    border: string;
    glow: string;
    bg: string;
    badge: string;
    accent: string;
    homeDot: string;
  }
> = {
  red: {
    border: 'border-red-500/80',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-2 ring-red-500',
    bg: 'from-red-950/60 via-slate-900/80 to-slate-950/80',
    badge: 'bg-red-500/20 text-red-400 border-red-500/40',
    accent: 'text-red-400',
    homeDot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
  },
  green: {
    border: 'border-emerald-500/80',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)] ring-2 ring-emerald-500',
    bg: 'from-emerald-950/60 via-slate-900/80 to-slate-950/80',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    accent: 'text-emerald-400',
    homeDot: 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]',
  },
  yellow: {
    border: 'border-amber-500/80',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)] ring-2 ring-amber-500',
    bg: 'from-amber-950/60 via-slate-900/80 to-slate-950/80',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    accent: 'text-amber-400',
    homeDot: 'bg-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]',
  },
  blue: {
    border: 'border-blue-500/80',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500',
    bg: 'from-blue-950/60 via-slate-900/80 to-slate-950/80',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    accent: 'text-blue-400',
    homeDot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
  },
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isActive }) => {
  const styles = COLOR_MAP[player.color];
  const avatarObj = AVATAR_LIST.find((a) => a.id === player.avatar) || AVATAR_LIST[0];

  const homeTokensCount = player.tokens.filter((t) => t.isHome).length;

  return (
    <motion.div
      id={`player-card-${player.color}`}
      animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
      className={`relative p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md bg-gradient-to-br ${
        styles.bg
      } ${styles.border} ${
        isActive ? styles.glow : 'shadow-md opacity-90'
      } flex items-center gap-2 sm:gap-2.5 transition-all min-w-[120px] max-w-[170px] sm:min-w-[160px] sm:max-w-[220px]`}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div
          className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br ${avatarObj.bgGradient} border sm:border-2 ${avatarObj.borderAccent} shadow-inner flex items-center justify-center text-lg sm:text-2xl select-none`}
        >
          {avatarObj.emoji}
        </div>

        {/* AI Bot badge */}
        {player.type === 'ai' && (
          <div className="absolute -bottom-1 -right-1 bg-slate-900/90 text-cyan-400 rounded-full p-0.5 border border-cyan-500/50">
            <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
        )}

        {/* Winner Crown */}
        {player.hasWon && (
          <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-slate-950 rounded-full p-0.5 sm:p-1 shadow-lg animate-bounce">
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950" />
          </div>
        )}
      </div>

      {/* Info & Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-[11px] sm:text-xs font-black text-white truncate max-w-[70px] sm:max-w-[110px]">
            {player.name}
          </h4>
          {player.rank && (
            <span className="text-[9px] sm:text-[10px] font-extrabold px-1 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hidden xs:flex items-center gap-0.5">
              <Trophy className="w-2 h-2" /> #{player.rank}
            </span>
          )}
        </div>

        {/* Home tokens status dots (4 dots) */}
        <div className="flex items-center gap-1 mt-0.5">
          {[0, 1, 2, 3].map((dotIdx) => {
            const isHome = dotIdx < homeTokensCount;
            return (
              <div
                key={`player-${player.id}-dot-${dotIdx}`}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                  isHome ? styles.homeDot : 'bg-slate-700/60 border border-slate-600/40'
                }`}
              />
            );
          })}
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono ml-0.5 font-bold">
            {homeTokensCount}/4
          </span>
        </div>

        {/* Kills & Sixes info */}
        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-0.5 text-red-400">
            <Swords className="w-2.5 h-2.5" /> {player.kills}
          </span>
          <span className="text-amber-400">🎲 {player.sixesRolled}</span>
        </div>
      </div>
    </motion.div>
  );
};
