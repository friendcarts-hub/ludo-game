import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Bot,
  Globe,
  Key,
  Trophy,
  Sparkles,
  Target,
  Award,
  Flame,
  ArrowRight,
  CreditCard,
  LogIn,
  UserPlus,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useSocial } from '../../context/SocialContext';
import { soundManager } from '../../game/audio';
import { AdsterraNativeBanner } from '../ads/AdsterraNativeBanner';

interface HomeScreenProps {
  onOpenGameMode: () => void;
  onOpenDailyBonus: () => void;
  onOpenLuckySpin: () => void;
  onOpenRewardedAd: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenFriends: () => void;
  onOpenWallet: () => void;
  onOpenWithdrawal: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenGameMode,
  onOpenDailyBonus,
  onOpenLuckySpin,
  onOpenRewardedAd,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenFriends,
  onOpenWallet,
  onOpenWithdrawal,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isDailyBonusAvailable, isLuckySpinAvailable, dailyBonusStreak } = useWallet();
  const { missions } = useSocial();

  const pendingMissionsCount = missions.filter((m) => m.isCompleted && !m.isClaimed).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 sm:pb-12 relative">
      {/* Ambient background light orbs */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Backend Authentication Banner if Guest or Logged Out */}
      {(!isAuthenticated || user?.email.endsWith('@ludoverse.io')) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a122c] to-indigo-950/60 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
              <Server className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white">
                  लाइव बैकएंड से जुड़ें (Live Backend)
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                साइन अप करें और <span className="text-amber-400 font-bold">3,500 + 500 बोनस सिक्के</span> पाएं!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                if (onOpenAuth) onOpenAuth('signup');
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> साइन अप (+500)
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                if (onOpenAuth) onOpenAuth('login');
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> लॉगिन
            </button>
          </div>
        </motion.div>
      )}

      {/* Featured Arena Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-950/40 via-[#070b24]/80 to-purple-950/40 border border-white/10 p-4 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        {/* Glow ambient accent */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-black tracking-wider uppercase">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" /> Season 1 Grand Arena
          </div>

          <h2 className="text-xl sm:text-4xl font-black text-white leading-tight">
            Roll, Conquer & Win Cash in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">LudoVerse</span>
          </h2>

          <p className="text-[11px] sm:text-sm text-slate-300 leading-relaxed">
            Compete in real-time 4-player online matches, challenge AI bots, host private rooms with friends, and cashout your winnings instantly!
          </p>

          <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenGameMode();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95"
            >
              <span>PLAY NOW 🎲</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenWithdrawal();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all backdrop-blur-md"
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> Withdraw Cash
            </button>
          </div>
        </div>
      </div>

      {/* Daily Quick Rewards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Daily Bonus Card */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => {
            soundManager.playClick();
            onOpenDailyBonus();
          }}
          className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border cursor-pointer transition-all flex items-center justify-between backdrop-blur-xl ${
            isDailyBonusAvailable
              ? 'bg-amber-500/10 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
              : 'bg-white/[0.03] border-white/10 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
              🎁
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white block">Daily Bonus</span>
              <span className="text-[10px] sm:text-xs text-amber-400 font-bold">
                {isDailyBonusAvailable ? 'Claim Reward!' : `Streak Day ${dailyBonusStreak}`}
              </span>
            </div>
          </div>
          {isDailyBonusAvailable && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </motion.div>

        {/* Lucky Spin Wheel Card */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => {
            soundManager.playClick();
            onOpenLuckySpin();
          }}
          className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border cursor-pointer transition-all flex items-center justify-between backdrop-blur-xl ${
            isLuckySpinAvailable
              ? 'bg-purple-500/10 border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/40'
              : 'bg-white/[0.03] border-white/10 hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
              🎡
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white block">Lucky Wheel</span>
              <span className="text-[10px] sm:text-xs text-purple-400 font-bold">
                {isLuckySpinAvailable ? 'Free Spin Ready!' : 'Win up to 10k Coins'}
              </span>
            </div>
          </div>
          {isLuckySpinAvailable && (
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
          )}
        </motion.div>

        {/* Rewarded Video Ad Card */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => {
            soundManager.playClick();
            onOpenRewardedAd();
          }}
          className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] cursor-pointer transition-all flex items-center justify-between backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
              📺
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white block">Watch & Earn</span>
              <span className="text-[10px] sm:text-xs text-cyan-400 font-bold">+250 Coins</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Free
          </span>
        </motion.div>
      </div>

      {/* Main Game Modes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> Choose Game Mode
          </h3>
          <span className="text-xs text-slate-400 font-bold">4 Multiplayer Formats</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Pass & Play Offline */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => {
              soundManager.playClick();
              onOpenGameMode();
            }}
            className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-[#070d18] to-slate-950 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group backdrop-blur-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Pass & Play (Offline)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Play locally with 2, 3, or 4 friends on one device with custom names. No internet needed.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-black text-emerald-400">
              <span>Free Local Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* 2. Play vs Computer AI */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => {
              soundManager.playClick();
              onOpenGameMode();
            }}
            className="p-5 rounded-3xl bg-gradient-to-br from-blue-950/30 via-[#070b20] to-slate-950 border border-blue-500/30 hover:border-blue-400/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group backdrop-blur-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Vs Computer AI</h4>
              <p className="text-xs text-slate-400 mt-1">
                Challenge Easy, Medium, or Grandmaster AI bots with practice or coin wagers.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-black text-blue-400">
              <span>3 AI Bot Levels</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* 3. Online Random Match */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => {
              soundManager.playClick();
              onOpenGameMode();
            }}
            className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-[#061024] to-slate-950 border border-cyan-500/40 hover:border-cyan-400 shadow-xl cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/20 rounded-full blur-xl" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Online Matchmaking</h4>
              <p className="text-xs text-slate-400 mt-1">
                Compete with online players in 4-player coin battles with live sync & rankings.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-black text-cyan-400">
              <span>Win 4x Prize Pool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* 4. Private Room with Friends */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => {
              soundManager.playClick();
              onOpenGameMode();
            }}
            className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/30 via-[#0d0720] to-slate-950 border border-purple-500/30 hover:border-purple-400/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group backdrop-blur-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Private Room Code</h4>
              <p className="text-xs text-slate-400 mt-1">
                Create or join custom 6-digit room codes to play exclusively with your squad.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-black text-purple-400">
              <span>Custom Room Codes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Adsterra High-CPM Native Banner Unit */}
      <AdsterraNativeBanner />

      {/* Social & Progression Hub Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenMissions();
          }}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer group backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <span className="text-xs font-black text-white block">Quests</span>
              <span className="text-[10px] text-slate-400">Daily missions</span>
            </div>
          </div>
          {pendingMissionsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
              {pendingMissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLeaderboard();
          }}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer group backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div className="text-left">
              <span className="text-xs font-black text-white block">Ranks</span>
              <span className="text-[10px] text-slate-400">Leaderboard</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors" />
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenAchievements();
          }}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer group backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <span className="text-xs font-black text-white block">Badges</span>
              <span className="text-[10px] text-slate-400">Achievements</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenFriends();
          }}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer group backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <span className="text-xs font-black text-white block">Friends</span>
              <span className="text-[10px] text-slate-400">Social list</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>
    </div>
  );
};
