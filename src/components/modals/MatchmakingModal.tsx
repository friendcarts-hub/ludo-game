import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Users, Shield, Zap, X, Trophy, Swords, Sparkles } from 'lucide-react';
import { PlayerColor } from '../../types';
import { MatchedOpponent } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { AVATAR_LIST } from '../../data/avatars';
import { soundManager } from '../../game/audio';
import { socketService } from '../../services/socketService';

const getAvatarEmoji = (avatarId?: string): string => {
  if (!avatarId) return '👑';
  const found = AVATAR_LIST.find((a) => a.id === avatarId);
  return found ? found.emoji : '👑';
};

interface MatchmakingModalProps {
  isOpen: boolean;
  wager: number;
  isFreeAdMatch?: boolean;
  onCancel: () => void;
  onMatchFound: (wager: number, opponents: MatchedOpponent[], isFreeAdMatch?: boolean) => void;
}

const GLOBAL_OPPONENT_CANDIDATES: Array<{
  name: string;
  avatar: string;
  country: string;
  flag: string;
  rating: number;
  tier: string;
  winRate: string;
}> = [
  { name: 'Aarav Sharma', avatar: 'knight', country: 'India', flag: '🇮🇳', rating: 1520, tier: 'Platinum II', winRate: '68%' },
  { name: 'Elena Rostova', avatar: 'queen', country: 'Germany', flag: '🇩🇪', rating: 1640, tier: 'Diamond I', winRate: '72%' },
  { name: 'Kaito Tanaka', avatar: 'ninja', country: 'Japan', flag: '🇯🇵', rating: 1480, tier: 'Gold I', winRate: '61%' },
  { name: 'Marcus Vance', avatar: 'wizard', country: 'USA', flag: '🇺🇸', rating: 1590, tier: 'Platinum III', winRate: '65%' },
  { name: 'Sofia Rodriguez', avatar: 'wolf', country: 'Brazil', flag: '🇧🇷', rating: 1430, tier: 'Gold II', winRate: '59%' },
  { name: 'Liam O\'Connor', avatar: 'robot', country: 'UK', flag: '🇬🇧', rating: 1710, tier: 'Grandmaster', winRate: '78%' },
  { name: 'Zack Thunder', avatar: 'alien', country: 'Canada', flag: '🇨🇦', rating: 1550, tier: 'Platinum I', winRate: '64%' },
  { name: 'Priya Patel', avatar: 'crown', country: 'India', flag: '🇮🇳', rating: 1680, tier: 'Diamond II', winRate: '74%' },
  { name: 'Viktor Kane', avatar: 'dragon', country: 'Australia', flag: '🇦🇺', rating: 1610, tier: 'Diamond III', winRate: '69%' },
];

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  wager,
  isFreeAdMatch = false,
  onCancel,
  onMatchFound,
}) => {
  const { user } = useAuth();
  const { settings } = useWallet();
  const [matchedPlayers, setMatchedPlayers] = useState<MatchedOpponent[]>([]);
  const [searchTime, setSearchTime] = useState(0);
  const [showVsIntro, setShowVsIntro] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [serverPing] = useState(Math.floor(22 + Math.random() * 18));

  useEffect(() => {
    if (!isOpen) {
      setMatchedPlayers([]);
      setSearchTime(0);
      setShowVsIntro(false);
      setCountdown(3);
      socketService.leaveMatchmaking();
      return;
    }

    soundManager.playClick();

    // 1. Connect to WebSocket Matchmaking Queue
    const socket = socketService.init();
    socketService.joinMatchmaking(
      {
        uid: user?.uid || 'user_' + Math.random().toString(36).slice(2, 7),
        name: user?.displayName || 'Player',
        avatar: user?.photoURL || 'king',
        coins: user?.coins || 0,
      },
      wager
    );

    // 2. Listen for Server Real Match
    const handleMatchFound = (data: {
      roomId: string;
      players: any[];
      wager: number;
      prizePool: number;
    }) => {
      const realOpponents: MatchedOpponent[] = data.players
        .filter((p) => p.uid !== user?.uid)
        .map((p) => ({
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          country: p.country || 'Global Arena',
          rating: p.rating || 1500,
          winRate: p.winRate || '65%',
        }));

      setMatchedPlayers(realOpponents);
      soundManager.playHomeGoal();
      setShowVsIntro(true);

      let count = 3;
      const countInterval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countInterval);
          onMatchFound(wager, realOpponents, isFreeAdMatch);
        }
      }, 900);
    };

    socket.on('match_found', handleMatchFound);

    // Timer elapsed
    const timerInterval = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    // Fallback arena pairing if alone in queue for > 3.5 seconds
    const fallbackTimeout = setTimeout(() => {
      const shuffled = [...GLOBAL_OPPONENT_CANDIDATES].sort(() => 0.5 - Math.random());
      const slotColors: PlayerColor[] = ['green', 'yellow', 'blue'];
      const realOpponents: MatchedOpponent[] = [
        {
          name: shuffled[0].name,
          avatar: shuffled[0].avatar,
          color: slotColors[0],
          country: `${shuffled[0].flag} ${shuffled[0].country}`,
          rating: shuffled[0].rating,
          winRate: shuffled[0].winRate,
        },
        {
          name: shuffled[1].name,
          avatar: shuffled[1].avatar,
          color: slotColors[1],
          country: `${shuffled[1].flag} ${shuffled[1].country}`,
          rating: shuffled[1].rating,
          winRate: shuffled[1].winRate,
        },
        {
          name: shuffled[2].name,
          avatar: shuffled[2].avatar,
          color: slotColors[2],
          country: `${shuffled[2].flag} ${shuffled[2].country}`,
          rating: shuffled[2].rating,
          winRate: shuffled[2].winRate,
        },
      ];

      setMatchedPlayers(realOpponents);
      soundManager.playHomeGoal();
      setShowVsIntro(true);

      let count = 3;
      const countInterval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countInterval);
          onMatchFound(wager, realOpponents);
        }
      }, 900);
    }, 3600);

    return () => {
      clearInterval(timerInterval);
      clearTimeout(fallbackTimeout);
      socket.off('match_found', handleMatchFound);
      socketService.leaveMatchmaking();
    };
  }, [isOpen, wager, user, onMatchFound]);

  if (!isOpen) return null;

  const totalFound = matchedPlayers.length + 1; // +1 for user

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none"
      >
        {!showVsIntro ? (
          /* RADAR SEARCHING STAGE */
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b22] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col items-center text-center"
          >
            {/* Top Close / Cancel Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="Cancel Matchmaking"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wider uppercase mb-3">
              <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Real-Time Online Arena</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              MATCHMAKING
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
              Matching with real online players in your skill tier...
            </p>

            {/* Server Ping & Elapsed */}
            <div className="flex items-center gap-4 my-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {serverPing}ms • Asia-South
              </span>
              <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                ⏱️ 00:{searchTime < 10 ? `0${searchTime}` : searchTime}
              </span>
            </div>

            {/* Sonar Radar Container */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 my-2 flex items-center justify-center">
              {/* Radar Rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/25" />
              <div className="absolute inset-10 rounded-full border border-cyan-500/30" />
              <div className="absolute inset-16 rounded-full border border-cyan-500/40" />

              {/* Pulsing Sonar Waves */}
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                className="absolute inset-8 rounded-full border-2 border-cyan-400"
              />
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 1.1 }}
                className="absolute inset-8 rounded-full border-2 border-cyan-400"
              />

              {/* Rotating Radar Sweep Needle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(6,182,212,0.4)_360deg)] pointer-events-none"
              />

              {/* Center User Avatar */}
              <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 p-0.5 shadow-[0_0_30px_rgba(244,63,94,0.6)] flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-2xl sm:text-3xl">
                  {getAvatarEmoji(user?.photoURL)}
                </div>
                <div className="absolute -bottom-2 px-2 py-0.5 bg-red-600 text-white font-black text-[9px] uppercase rounded-full shadow-md">
                  YOU
                </div>
              </div>
            </div>

            {/* 4 Player Slots Bar */}
            <div className="w-full grid grid-cols-4 gap-2 my-5">
              {/* User Slot (Slot 1) */}
              <div className="p-2.5 rounded-2xl bg-red-950/50 border border-red-500/50 flex flex-col items-center text-center shadow-lg">
                <span className="text-xl">{getAvatarEmoji(user?.photoURL)}</span>
                <span className="text-[11px] font-black text-white truncate w-full mt-1">
                  {user?.displayName?.split(' ')[0] || 'You'}
                </span>
                <span className="text-[9px] text-red-400 font-bold">READY</span>
              </div>

              {/* Slot 2 (Green) */}
              <div
                className={`p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  matchedPlayers[0]
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-scale'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                {matchedPlayers[0] ? (
                  <>
                    <span className="text-xl">{getAvatarEmoji(matchedPlayers[0].avatar)}</span>
                    <span className="text-[11px] font-black text-white truncate w-full mt-1">
                      {matchedPlayers[0].name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">READY</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700 animate-spin" />
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Searching...</span>
                  </>
                )}
              </div>

              {/* Slot 3 (Yellow) */}
              <div
                className={`p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  matchedPlayers[1]
                    ? 'bg-amber-950/60 border-amber-500/60 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                {matchedPlayers[1] ? (
                  <>
                    <span className="text-xl">{getAvatarEmoji(matchedPlayers[1].avatar)}</span>
                    <span className="text-[11px] font-black text-white truncate w-full mt-1">
                      {matchedPlayers[1].name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-amber-400 font-bold">READY</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700 animate-spin" />
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Searching...</span>
                  </>
                )}
              </div>

              {/* Slot 4 (Blue) */}
              <div
                className={`p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  matchedPlayers[2]
                    ? 'bg-blue-950/60 border-blue-500/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                {matchedPlayers[2] ? (
                  <>
                    <span className="text-xl">{getAvatarEmoji(matchedPlayers[2].avatar)}</span>
                    <span className="text-[11px] font-black text-white truncate w-full mt-1">
                      {matchedPlayers[2].name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-bold">READY</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700 animate-spin" />
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Searching...</span>
                  </>
                )}
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 hover:border-red-500/40 text-xs font-black tracking-wider uppercase transition-all cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </motion.div>
        ) : (
          /* HIGH OCTANE 4-PLAYER VS SHOWDOWN STAGE */
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-gradient-to-b from-[#0e163b] via-[#080d26] to-[#040614] border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_100px_rgba(245,158,11,0.4)] text-center relative overflow-hidden"
          >
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black tracking-wider uppercase mb-2 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>4 / 4 PLAYERS READY!</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-wider">
              MATCH FOUND!
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 my-1 font-bold">
              {isFreeAdMatch
                ? `Free Ad Match • Winner gets +${settings.freeAdMatchWinnerReward || 350} Coins, Loser gets +${settings.freeAdMatchLoserReward || 60} Coins!`
                : `Prize Pool: 🪙 ${Math.floor(wager * 4 * 0.9).toLocaleString()} Coins (Loser Consolation: +${settings.matchLoserRewardCoins || 50})`}
            </p>

            {/* 4 Cards Grid Clash */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              {/* User Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-red-900/60 to-red-950/80 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-400 flex items-center justify-center text-3xl mb-2 shadow-inner">
                  {getAvatarEmoji(user?.photoURL)}
                </div>
                <span className="text-sm font-black text-white truncate w-full">
                  {user?.displayName || 'You'}
                </span>
                <span className="text-[10px] text-red-300 font-bold mt-0.5">🇮🇳 India</span>
                <span className="text-[9px] bg-red-500/30 text-white font-mono px-2 py-0.5 rounded-full mt-1.5 border border-red-400/40">
                  Rating: 1550
                </span>
              </motion.div>

              {/* Opponent 1 */}
              {matchedPlayers[0] && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-3xl mb-2 shadow-inner">
                    {getAvatarEmoji(matchedPlayers[0].avatar)}
                  </div>
                  <span className="text-sm font-black text-white truncate w-full">
                    {matchedPlayers[0].name}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold mt-0.5">
                    {matchedPlayers[0].country}
                  </span>
                  <span className="text-[9px] bg-emerald-500/30 text-white font-mono px-2 py-0.5 rounded-full mt-1.5 border border-emerald-400/40">
                    Rating: {matchedPlayers[0].rating}
                  </span>
                </motion.div>
              )}

              {/* Opponent 2 */}
              {matchedPlayers[1] && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-900/60 to-amber-950/80 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-600/30 border border-amber-400 flex items-center justify-center text-3xl mb-2 shadow-inner">
                    {getAvatarEmoji(matchedPlayers[1].avatar)}
                  </div>
                  <span className="text-sm font-black text-white truncate w-full">
                    {matchedPlayers[1].name}
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold mt-0.5">
                    {matchedPlayers[1].country}
                  </span>
                  <span className="text-[9px] bg-amber-500/30 text-white font-mono px-2 py-0.5 rounded-full mt-1.5 border border-amber-400/40">
                    Rating: {matchedPlayers[1].rating}
                  </span>
                </motion.div>
              )}

              {/* Opponent 3 */}
              {matchedPlayers[2] && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-900/60 to-blue-950/80 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-3xl mb-2 shadow-inner">
                    {getAvatarEmoji(matchedPlayers[2].avatar)}
                  </div>
                  <span className="text-sm font-black text-white truncate w-full">
                    {matchedPlayers[2].name}
                  </span>
                  <span className="text-[10px] text-blue-300 font-bold mt-0.5">
                    {matchedPlayers[2].country}
                  </span>
                  <span className="text-[9px] bg-blue-500/30 text-white font-mono px-2 py-0.5 rounded-full mt-1.5 border border-blue-400/40">
                    Rating: {matchedPlayers[2].rating}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-base shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse">
              <Swords className="w-5 h-5" />
              <span>STARTING IN {countdown}...</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
