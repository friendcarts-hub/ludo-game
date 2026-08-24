import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Wallet,
  CreditCard,
  ShieldCheck,
  Trophy,
  Sparkles,
  Swords,
  Flame,
  Gift,
  Target,
  Award,
  Users,
  Tv,
  Copy,
  Check,
  ArrowRight,
  LogOut,
  Sliders,
  Volume2,
  VolumeX,
  Clock,
  Coins,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useSocial } from '../../context/SocialContext';
import { useSoundManager } from '../../game/audio';
import { AVATAR_LIST } from '../../data/avatars';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: () => void;
  onOpenWithdrawal: () => void;
  onOpenKyc: () => void;
  onOpenDailyBonus: () => void;
  onOpenLuckySpin: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenFriends: () => void;
  onOpenRewardedAd: () => void;
}

type TabType = 'features' | 'payout' | 'stats' | 'settings';

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenWallet,
  onOpenWithdrawal,
  onOpenKyc,
  onOpenDailyBonus,
  onOpenLuckySpin,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenFriends,
  onOpenRewardedAd,
}) => {
  const { user, updateProfile, logout } = useAuth();
  const {
    balance,
    withdrawals,
    settings,
    canClaimDailyBonus,
    dailyStreak,
    isLuckySpinAvailable,
  } = useWallet();
  const { missions } = useSocial();
  const { isMuted, volume, toggleMute, setVolume, soundManager } = useSoundManager();

  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [name, setName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || 'king');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !user) return null;

  const currentAvatarObj = AVATAR_LIST.find((a) => a.id === (user.photoURL || selectedAvatar)) || AVATAR_LIST[0];
  const pendingMissionsCount = missions.filter((m) => m.isCompleted && !m.isClaimed).length;
  const isKycVerified = user.kycStatus === 'verified';
  const isKycPending = user.kycStatus === 'pending';

  const rate = settings?.coinToCashRate || 1000;
  const currSym = settings?.currencySymbol || '$';
  const cashEquivalent = (balance / rate).toFixed(2);
  const minCoins = settings?.minWithdrawalCoins ?? 2000;

  const winPercentage =
    user.totalGames > 0 ? Math.round((user.totalWins / user.totalGames) * 100) : 0;

  const handleSaveNameAndAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    updateProfile({
      displayName: name.trim() || user.displayName,
      photoURL: selectedAvatar,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-xl bg-[#080918] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100 ring-1 ring-white/10"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Player Hub & Profile
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Level {user.level || 1} • {user.xp || 0} XP
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Profile Hero Banner with Balance & KYC Status */}
          <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#0a112c] to-indigo-950/60 border border-cyan-500/30 shrink-0 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${currentAvatarObj.bgGradient} border-2 ${currentAvatarObj.borderAccent} flex items-center justify-center text-2xl sm:text-3xl shadow-md shrink-0`}
              >
                {currentAvatarObj.emoji}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white truncate">
                    {user.displayName}
                  </h4>
                  {isKycVerified ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> KYC Verified
                    </span>
                  ) : isKycPending ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> KYC Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenKyc();
                      }}
                      className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 text-[9px] font-black flex items-center gap-1 shrink-0 cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-3 h-3 text-red-400" /> Verify KYC
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {user.email || user.phoneNumber || 'LudoVerse Champion'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-24 sm:w-32 h-1.5 rounded-full bg-slate-950 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${(user.xp % 200) / 2}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-300 font-bold">
                    {user.xp % 200}/200 XP
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Balances in Header */}
            <div className="text-right shrink-0">
              <div className="text-xs sm:text-sm font-black text-amber-300 font-mono flex items-center justify-end gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{balance.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                ≈ {currSym}{cashEquivalent} Cash
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 my-3 border-b border-white/10 pb-2 shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('features');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'features'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Features Hub</span>
              {pendingMissionsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {pendingMissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('payout');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'payout'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payout & Wallet</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('stats');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Stats & Ranks</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('settings');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Edit & Settings</span>
            </button>
          </div>

          {/* TAB CONTENT BODY */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
            {/* 1. FEATURES HUB TAB */}
            {activeTab === 'features' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Quick Features & Reward Centers
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">7 Live Services</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Payout & Cashout Quick Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenWithdrawal();
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Instant Payout</span>
                        <span className="text-[10px] text-emerald-400 font-bold">UPI & Bank Transfer</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Wallet & Add Coins Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenWallet();
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Wallet & Coins</span>
                        <span className="text-[10px] text-amber-400 font-bold">{balance.toLocaleString()} Coins</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Daily Bonus Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenDailyBonus();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-md ${
                      canClaimDailyBonus
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                        🎁
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">Daily Login Bonus</span>
                          {canClaimDailyBonus && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          )}
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold">
                          {canClaimDailyBonus ? 'Claim Bonus Now!' : `Day ${dailyStreak} Streak Active`}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Lucky Spin Wheel Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenLuckySpin();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-md ${
                      isLuckySpinAvailable
                        ? 'bg-purple-500/15 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                        🎡
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">Lucky Spin Wheel</span>
                          {isLuckySpinAvailable && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                          )}
                        </div>
                        <span className="text-[10px] text-purple-400 font-bold">
                          {isLuckySpinAvailable ? 'Free Spin Ready!' : 'Win up to 10,000 Coins'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Daily Quests / Missions Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenMissions();
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Quests & Missions</span>
                        <span className="text-[10px] text-cyan-400 font-bold">
                          {pendingMissionsCount > 0 ? `${pendingMissionsCount} Ready to Claim!` : 'Daily Challenges'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Leaderboards Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenLeaderboard();
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-yellow-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Leaderboard</span>
                        <span className="text-[10px] text-yellow-400 font-bold">Global & Weekly Ranks</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Achievements Badges Card */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenAchievements();
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Badges & Trophies</span>
                        <span className="text-[10px] text-purple-400 font-bold">Milestone Rewards</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Friends & Social Squad */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenFriends();
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Friends & Squad</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Challenge & Chat</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Watch & Earn Rewarded Ad */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenRewardedAd();
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-md sm:col-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                        📺
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">Watch Video & Earn Coins</span>
                        <span className="text-[10px] text-cyan-400 font-bold">+250 Free Bonus Coins instantly</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/40 group-hover:bg-cyan-500/30">
                      Watch Ad
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PAYOUT & WALLET TAB */}
            {activeTab === 'payout' && (
              <div className="space-y-3.5">
                {/* Financial Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-[#07151a] border border-emerald-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        Withdrawable Balance
                      </span>
                      <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
                        <span>{currSym}{cashEquivalent}</span>
                        <span className="text-xs text-amber-400 font-normal">({balance.toLocaleString()} Coins)</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">Rate:</span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {rate.toLocaleString()} Coins = {currSym}1.00
                      </span>
                    </div>
                  </div>

                  {/* Primary Payout & Add Money Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onClose();
                        onOpenWithdrawal();
                      }}
                      className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" /> Request Payout
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onClose();
                        onOpenWallet();
                      }}
                      className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Wallet className="w-4 h-4" /> Deposit Coins
                    </button>
                  </div>
                </div>

                {/* KYC Verification Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">KYC Verification</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                            isKycVerified
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : isKycPending
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                        >
                          {user.kycStatus.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isKycVerified
                          ? 'Aadhaar / PAN ID Verified for instant cashouts'
                          : 'Required for real-money UPI & bank payouts'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenKyc();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-bold border border-white/10 cursor-pointer transition-all"
                  >
                    {isKycVerified ? 'View KYC' : 'Verify Now'}
                  </button>
                </div>

                {/* Payout Channels Supported */}
                <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                    Supported Payout Channels
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-emerald-400 font-bold block">UPI Express</span>
                      <span className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-cyan-400 font-bold block">Bank IMPS</span>
                      <span className="text-[9px] text-slate-400">Direct Account Transfer</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-amber-400 font-bold block">Min Payout</span>
                      <span className="text-[9px] text-slate-400">{minCoins.toLocaleString()} Coins</span>
                    </div>
                  </div>
                </div>

                {/* Recent Withdrawals */}
                {(withdrawals || []).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                      Recent Payout Requests
                    </span>
                    {(withdrawals || []).slice(0, 3).map((w) => (
                      <div
                        key={w.id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              w.status === 'approved'
                                ? 'bg-emerald-400'
                                : w.status === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                          />
                          <span className="font-bold text-white">
                            {w.currency}{w.cashAmount.toFixed(2)} ({w.method.toUpperCase()})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize font-mono">
                          {w.status} • {new Date(w.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. CAREER STATS & LEADERBOARD TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-3.5">
                {/* Stats Bento Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block font-mono">
                      {user.totalWins}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Victories</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-emerald-400 block font-mono">
                      {winPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Win Rate</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <Swords className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block font-mono">
                      {user.totalKills}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pawns Cut</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <span className="text-lg font-black text-amber-400 block font-mono">
                      {user.winStreak}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Win Streak</span>
                  </div>
                </div>

                {/* Match Totals & Experience Card */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Matches Played:</span>
                    <span className="font-mono font-bold text-white">{user.totalGames} Matches</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Arena Tier:</span>
                    <span className="font-bold text-cyan-400">Grandmaster Division</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Lifetime Earned Coins:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {(user.totalWins * 1800 + 3500).toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                {/* Quick Leaderboard & Badges Launchers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenLeaderboard();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-yellow-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-yellow-400" /> View Rankings
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onClose();
                      onOpenAchievements();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-purple-400" /> View Badges
                  </button>
                </div>
              </div>
            )}

            {/* 4. SETTINGS & PROFILE EDIT TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Referral Code Share Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Referral Code (Earn 500 Coins/Friend)
                    </span>
                    <span className="text-base font-mono font-black text-yellow-400 tracking-widest">
                      {user.referralCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

                {/* Choose Avatar Grid */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                    Select Player Avatar
                  </label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATAR_LIST.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedAvatar(av.id);
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                          selectedAvatar === av.id
                            ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110 shadow-md ring-2 ring-cyan-400/60'
                            : 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Display Name Form */}
                <form onSubmit={handleSaveNameAndAvatar} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">
                      Player Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={20}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-colors"
                      placeholder="Enter your game name..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {isSaved ? <Check className="w-4 h-4 text-slate-950" /> : null}
                    <span>{isSaved ? 'Profile Updated!' : 'Save Name & Avatar'}</span>
                  </button>
                </form>

                {/* Sound Settings Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      Game Sound FX Volume
                    </span>
                    <span className="font-mono text-slate-400">
                      {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (val > 0 && isMuted) {
                        toggleMute();
                      }
                      soundManager.playPawnStep();
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 border border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out of Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
