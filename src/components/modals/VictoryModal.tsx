import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Coins,
  RotateCcw,
  Home,
  Sparkles,
  Swords,
  Crown,
  Medal,
  Flame,
  Share2,
  CheckCircle2,
  Award,
  ChevronRight,
  PartyPopper,
  Zap,
  TrendingUp,
  Shield,
  ShieldAlert,
  Dices,
} from 'lucide-react';
import { GameState, Player } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_LIST } from '../../data/avatars';
import { soundManager } from '../../game/audio';
import { AdsterraNativeBanner } from '../ads/AdsterraNativeBanner';

interface VictoryModalProps {
  gameState: GameState;
  onRematch: () => void;
  onLeave: () => void;
}

type SummaryTab = 'standings' | 'accolades' | 'stats';

export const VictoryModal: React.FC<VictoryModalProps> = ({ gameState, onRematch, onLeave }) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'splash' | 'summary'>('splash');
  const [activeTab, setActiveTab] = useState<SummaryTab>('standings');
  const [hasCopied, setHasCopied] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [animatedCoins, setAnimatedCoins] = useState(0);
  const [animatedXp, setAnimatedXp] = useState(0);

  const winner = gameState.rankings[0] || gameState.winner || gameState.players[0];
  const isCurrentUserWinner = winner?.id === user?.uid;
  const winnerAvatar = AVATAR_LIST.find((a) => a.id === winner?.avatar) || AVATAR_LIST[0];

  // Calculate match accolades
  const mostKillsPlayer = [...gameState.players].sort((a, b) => b.kills - a.kills)[0];
  const mostSixesPlayer = [...gameState.players].sort((a, b) => b.sixesRolled - a.sixesRolled)[0];
  const mostPawnsHomePlayer = [...gameState.players].sort((a, b) => {
    const aHome = a.tokens.filter((t) => t.isHome).length;
    const bHome = b.tokens.filter((t) => t.isHome).length;
    return bHome - aHome;
  })[0];

  const earnedCoins = isCurrentUserWinner ? gameState.prizePool : 0;
  const earnedXp = isCurrentUserWinner ? 150 : 50;

  // Trigger high-energy confetti explosion
  const launchVictoryConfetti = useCallback(() => {
    try {
      // Center star burst
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#ffffff'],
        shapes: ['circle', 'square'],
        scalar: 1.2,
      });

      // Left cannon stream
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 75,
          origin: { x: 0, y: 0.7 },
          colors: ['#fbbf24', '#38bdf8', '#a855f7'],
        });
      }, 200);

      // Right cannon stream
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 75,
          origin: { x: 1, y: 0.7 },
          colors: ['#ec4899', '#10b981', '#eab308'],
        });
      }, 400);

      // Gentle gold rain
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 90,
          spread: 120,
          origin: { y: 0, x: 0.5 },
          colors: ['#ffd700', '#ffae00', '#fff8dc'],
          gravity: 0.8,
          ticks: 200,
        });
      }, 700);
    } catch {
      // Ignored
    }
  }, []);

  // Launch initial confetti burst and audio on mount
  useEffect(() => {
    launchVictoryConfetti();
    soundManager.playTriumphantFanfare();

    // Auto-advance to summary after 3.2 seconds
    const timer = setTimeout(() => {
      setPhase('summary');
    }, 3400);

    return () => clearTimeout(timer);
  }, [launchVictoryConfetti]);

  // Animate coin and XP counters when summary opens
  useEffect(() => {
    if (phase === 'summary' && !rewardClaimed) {
      const targetCoins = earnedCoins;
      const targetXp = earnedXp;

      let coinStep = 0;
      const coinInterval = setInterval(() => {
        coinStep += Math.max(1, Math.floor(targetCoins / 15));
        if (coinStep >= targetCoins) {
          setAnimatedCoins(targetCoins);
          clearInterval(coinInterval);
        } else {
          setAnimatedCoins(coinStep);
          soundManager.playTallyTick();
        }
      }, 50);

      let xpStep = 0;
      const xpInterval = setInterval(() => {
        xpStep += Math.max(1, Math.floor(targetXp / 15));
        if (xpStep >= targetXp) {
          setAnimatedXp(targetXp);
          clearInterval(xpInterval);
        } else {
          setAnimatedXp(xpStep);
        }
      }, 50);

      return () => {
        clearInterval(coinInterval);
        clearInterval(xpInterval);
      };
    }
  }, [phase, earnedCoins, earnedXp, rewardClaimed]);

  const handleClaimReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    soundManager.playClaimReward();
    launchVictoryConfetti();
  };

  const handleManualConfetti = () => {
    soundManager.playClick();
    launchVictoryConfetti();
  };

  const handleShareSummary = () => {
    soundManager.playClick();
    const rank = gameState.rankings.findIndex((p) => p.id === user?.uid) + 1;
    const shareText = `🏆 LudoVerse Match Summary:\nMode: ${gameState.mode.toUpperCase()}\nWinner: ${winner.name}\nMy Rank: #${rank || 1}\nTotal Kills: ${gameState.players.find((p) => p.id === user?.uid)?.kills || 0} ⚔️\nPrize Pool: ${gameState.prizePool} Coins 🪙\nPlay now at LudoVerse!`;
    navigator.clipboard.writeText(shareText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const playerColorHex = (color: string) => {
    switch (color) {
      case 'red':
        return 'from-red-500 to-rose-600 border-red-400/50 text-red-400';
      case 'green':
        return 'from-emerald-500 to-green-600 border-emerald-400/50 text-emerald-400';
      case 'yellow':
        return 'from-amber-400 to-yellow-500 border-yellow-400/50 text-yellow-400';
      case 'blue':
        return 'from-cyan-500 to-blue-600 border-cyan-400/50 text-cyan-400';
      default:
        return 'from-purple-500 to-fuchsia-600 border-purple-400/50 text-purple-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* PHASE 1: IMMERSIVE CINEMATIC VICTORY BURST OVERLAY */}
        {/* ========================================================================= */}
        {phase === 'splash' ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            className="w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-yellow-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(234,179,8,0.45)] text-center relative overflow-hidden flex flex-col items-center justify-center"
          >
            {/* Rotating sunburst aura background */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
              className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(234,179,8,0.18)_0%,rgba(236,72,153,0.08)_40%,transparent_70%)] pointer-events-none"
            />

            {/* Glowing shockwave pulse rings */}
            <motion.div
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute w-72 h-72 rounded-full border-2 border-yellow-400/30 blur-sm pointer-events-none"
            />

            {/* Top Badge: Match Victory */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black tracking-widest uppercase mb-4 shadow-lg backdrop-blur-md"
            >
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span>Match Concluded</span>
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
            </motion.div>

            {/* Central Animated 3D Floating Trophy & Avatar */}
            <div className="relative my-2">
              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.2 }}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 p-1 shadow-[0_0_50px_rgba(234,179,8,0.7)] flex items-center justify-center relative group"
              >
                <div className="w-full h-full bg-slate-950/80 rounded-[22px] flex items-center justify-center text-5xl sm:text-6xl relative overflow-hidden backdrop-blur-sm">
                  {/* Floating Shine Bar */}
                  <motion.div
                    animate={{ x: [-100, 150] }}
                    transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1 }}
                    className="absolute inset-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span>{winnerAvatar.emoji}</span>
                </div>

                {/* Floating Crown on top */}
                <motion.div
                  animate={{ y: [-4, 4, -4], rotate: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-300 text-slate-950 p-1.5 rounded-full shadow-xl border-2 border-slate-950"
                >
                  <Crown className="w-6 h-6 fill-yellow-400" />
                </motion.div>

                {/* Trophy Badge on bottom */}
                <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 p-2 rounded-2xl shadow-xl border-2 border-slate-950">
                  <Trophy className="w-5 h-5 fill-slate-950" />
                </div>
              </motion.div>
            </div>

            {/* Big Victory Typography */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-100 tracking-wider drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]">
                {isCurrentUserWinner ? 'VICTORY!' : `${winner.name.toUpperCase()} WINS!`}
              </h2>
              {gameState.forfeitInfo ? (
                <div className="mt-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold inline-flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {isCurrentUserWinner
                      ? 'Opponent Exited & Forfeited • You Win!'
                      : `${gameState.forfeitInfo.forfeitedPlayerName} Left / Forfeited Match`}
                  </span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-yellow-300/90 font-bold mt-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span>Supreme Arena Champion</span>
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </p>
              )}
            </motion.div>

            {/* Quick Reward Highlight */}
            {gameState.prizePool > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 border border-yellow-500/50 flex items-center gap-3 shadow-lg"
              >
                <div className="p-2 rounded-xl bg-yellow-400 text-slate-950">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black text-yellow-300 tracking-wider">
                    Winner Prize Pot
                  </p>
                  <p className="text-base sm:text-lg font-black text-white">
                    +{gameState.prizePool.toLocaleString()} Coins
                  </p>
                </div>
              </motion.div>
            )}

            {/* Transition Button to Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mt-6 w-full flex items-center justify-center gap-3"
            >
              <button
                onClick={() => setPhase('summary')}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95"
              >
                <span>View Match Summary</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* PHASE 2: RICH INTERACTIVE MATCH SUMMARY MODAL */
          /* ========================================================================= */
          <motion.div
            key="summary-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-yellow-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_70px_rgba(234,179,8,0.35)] text-center relative overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Top ambient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* HEADER WITH TITLE & SHARE/CONFETTI SHORTCUTS */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 p-0.5 shadow-md flex items-center justify-center text-slate-950">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-black text-white">Match Summary</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Mode: {gameState.mode.toUpperCase()}{' '}
                    {gameState.roomCode ? `• #${gameState.roomCode}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleManualConfetti}
                  title="Fire Confetti Cannons"
                  className="p-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 transition-all cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShareSummary}
                  title="Share Match Summary"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs"
                >
                  {hasCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* REWARDS & PROGRESSION TICKER (If Human Player) */}
            {isCurrentUserWinner && gameState.prizePool > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 border border-yellow-500/40 flex items-center justify-between shrink-0 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black text-yellow-300">
                      Rewards Earned
                    </span>
                    <div className="flex items-center gap-2 text-white font-black text-sm sm:text-base">
                      <span className="text-yellow-400">+{animatedCoins.toLocaleString()} Coins</span>
                      <span className="text-cyan-400 text-xs">+{animatedXp} XP</span>
                    </div>
                  </div>
                </div>

                {!rewardClaimed ? (
                  <button
                    onClick={handleClaimReward}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                  </span>
                )}
              </motion.div>
            )}

            {/* TAB NAVIGATION */}
            <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 mb-3 shrink-0">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('standings');
                }}
                className={`py-1.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-yellow-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Medal className="w-3.5 h-3.5" /> Standings
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('accolades');
                }}
                className={`py-1.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'accolades'
                    ? 'bg-yellow-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Accolades
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('stats');
                }}
                className={`py-1.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-yellow-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Stats
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="overflow-y-auto max-h-[260px] pr-1 space-y-2 text-left mb-4">
              {/* TAB 1: STANDINGS & PODIUM */}
              {activeTab === 'standings' && (
                <div className="space-y-2">
                  {gameState.players.map((player, idx) => {
                    const rank =
                      gameState.rankings.findIndex((p) => p.id === player.id) + 1 ||
                      (player.hasWon ? 1 : idx + 1);
                    const isWinner = rank === 1;
                    const avatarData =
                      AVATAR_LIST.find((a) => a.id === player.avatar) || AVATAR_LIST[0];
                    const pawnsHome = player.tokens.filter((t) => t.isHome).length;

                    return (
                      <motion.div
                        key={`victory-player-${player.id || idx}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isWinner
                            ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-transparent border-yellow-500/50 shadow-md'
                            : 'bg-white/[0.03] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Rank Badge */}
                          <div
                            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shadow-md ${
                              player.isForfeited
                                ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                                : rank === 1
                                ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950'
                                : rank === 2
                                ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                                : rank === 3
                                ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {player.isForfeited ? (
                              '✕'
                            ) : rank === 1 ? (
                              <Crown className="w-4 h-4" />
                            ) : (
                              `#${rank}`
                            )}
                          </div>

                          {/* Avatar & Color */}
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-lg shadow-sm">
                              {avatarData.emoji}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 bg-gradient-to-br ${playerColorHex(
                                player.color
                              )}`}
                            />
                          </div>

                          {/* Name & Title */}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs sm:text-sm text-white truncate max-w-[110px]">
                                {player.name}
                              </span>
                              {player.id === user?.uid && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-md font-bold">
                                  YOU
                                </span>
                              )}
                              {player.isForfeited && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded-md font-bold border border-rose-500/30">
                                  FORFEIT
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {player.color} Realm • {player.type === 'ai' ? 'AI Bot' : 'Player'}
                            </p>
                          </div>
                        </div>

                        {/* Stats Badges */}
                        <div className="flex items-center gap-2 sm:gap-3 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">
                              Goal Progress
                            </span>
                            <span className="font-mono font-black text-white text-xs">
                              {pawnsHome}/4 🏁
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="flex items-center gap-0.5 text-rose-400 font-mono text-xs font-black">
                              <Swords className="w-3 h-3" /> {player.kills}
                            </span>
                            <span className="text-amber-400 font-mono text-[10px] font-bold">
                              🎲 {player.sixesRolled}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: MATCH ACCOLADES & MVP BADGES */}
              {activeTab === 'accolades' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Grand Champion */}
                  <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-yellow-400 block">
                        Grand Champion
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[130px] block">
                        {winner?.name}
                      </span>
                    </div>
                  </div>

                  {/* Most Captures (Executioner) */}
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-rose-400 block">
                        Executioner ({mostKillsPlayer?.kills || 0} Kills)
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[130px] block">
                        {mostKillsPlayer?.name}
                      </span>
                    </div>
                  </div>

                  {/* High Roller (Most Sixes) */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Dices className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-amber-400 block">
                        Lucky Roller ({mostSixesPlayer?.sixesRolled || 0} 6s)
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[130px] block">
                        {mostSixesPlayer?.name}
                      </span>
                    </div>
                  </div>

                  {/* Speed Demon (Home Goals) */}
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-cyan-400 block">
                        Speed Runner
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[130px] block">
                        {mostPawnsHomePlayer?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERFORMANCE METRICS */}
              {activeTab === 'stats' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                      Total Pawns Captured in Match
                    </span>
                    <div className="space-y-1.5">
                      {gameState.players.map((p, pIdx) => {
                        const totalMatchKills = gameState.players.reduce((sum, pl) => sum + pl.kills, 0) || 1;
                        const killPct = Math.round((p.kills / totalMatchKills) * 100);
                        return (
                          <div key={`victory-stats-${p.id || pIdx}-${pIdx}`} className="text-xs">
                            <div className="flex justify-between text-slate-300 font-bold mb-0.5">
                              <span>{p.name}</span>
                              <span className="font-mono text-rose-400">{p.kills} kills</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${playerColorHex(p.color)}`}
                                style={{ width: `${killPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Adsterra Native Sponsor Banner */}
            <div className="mb-2.5 shrink-0">
              <AdsterraNativeBanner variant="compact" showLabel={false} />
            </div>

            {/* ACTION BUTTONS (REMATCH & LOBBY) */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 shrink-0">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onRematch();
                }}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onLeave();
                }}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95"
              >
                <Home className="w-4 h-4" /> Home Lobby
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
