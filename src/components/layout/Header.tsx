import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Plus,
  Coins,
  Shield,
  User,
  Sliders,
  CreditCard,
  ChevronDown,
  Gift,
  Target,
  Trophy,
  Award,
  Users,
  ShieldCheck,
  LogOut,
  Play,
  Sparkles,
  Gamepad2,
  Settings,
  Tv,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useSocial } from '../../context/SocialContext';
import { useSoundManager } from '../../game/audio';
import { AVATAR_LIST } from '../../data/avatars';

interface HeaderProps {
  onOpenWallet: () => void;
  onOpenWithdrawal: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenGameMode: () => void;
  onOpenDailyBonus: () => void;
  onOpenLuckySpin: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenFriends: () => void;
  onOpenOnlinePlayers?: () => void;
  onOpenKyc?: () => void;
  onOpenSettings?: () => void;
  onOpenRewardedAd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWallet,
  onOpenWithdrawal,
  onOpenProfile,
  onOpenAuth,
  onOpenGameMode,
  onOpenDailyBonus,
  onOpenLuckySpin,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenFriends,
  onOpenOnlinePlayers,
  onOpenKyc,
  onOpenSettings,
  onOpenRewardedAd,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { balance, canClaimDailyBonus, isLuckySpinAvailable, settings } = useWallet();
  const { missions, onlinePlayersCount, realOnlineUsers } = useSocial();
  const { isMuted, volume, toggleMute, setVolume, soundManager } = useSoundManager();

  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const soundMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
        setShowSoundMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userAvatarObj = AVATAR_LIST.find((a) => a.id === user?.photoURL) || AVATAR_LIST[0];
  const pendingMissionsCount = missions.filter((m) => m.isCompleted && !m.isClaimed).length;
  const isKycVerified = user?.kycStatus === 'verified';
  const isKycPending = user?.kycStatus === 'pending';
  const currSym = settings?.currencySymbol || '$';
  const rate = settings?.coinToCashRate || 1000;
  const cashVal = (balance / rate).toFixed(2);

  return (
    <header className="w-full bg-[#05050f]/95 backdrop-blur-2xl border-b border-white/10 px-2.5 sm:px-6 py-2 sm:py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-lg">
      {/* LEFT: Brand Logo & Arena Quick Play */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          onClick={() => {
            soundManager.playClick();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none"
        >
          {/* Glowing 3D Emblem */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-[#070818] flex items-center justify-center text-lg sm:text-2xl font-black">
              🎲
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
              <h1 className="text-xs sm:text-base font-black tracking-wider text-white">
                LUDO<span className="text-cyan-400">VERSE</span>
              </h1>
              <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                if (onOpenOnlinePlayers) onOpenOnlinePlayers();
                else if (onOpenFriends) onOpenFriends();
              }}
              className="flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all cursor-pointer group/live"
              title="Click to view all real online players"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500" />
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold font-mono tracking-tight group-hover/live:text-emerald-300">
                {onlinePlayersCount.toLocaleString()} LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Quick Play Button in Header */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenGameMode();
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-cyan-300" />
          <span>Play Arena</span>
        </button>
      </div>

      {/* RIGHT: Audio FX, Coin Wallet & User Profile Options Menu */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* 1. WALLET / COIN BALANCE PILL WITH + BUTTON */}
        <div
          id="header-wallet-pill"
          onClick={() => {
            soundManager.playClick();
            onOpenWallet();
          }}
          title="Open Coin Wallet & Add Cash"
          className="flex items-center gap-1 sm:gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 rounded-full pl-2 sm:pl-3 pr-0.5 sm:pr-1 py-0.5 sm:py-1 cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] group backdrop-blur-xl"
        >
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] sm:text-sm font-black text-amber-300 font-mono tracking-tight">
            {balance.toLocaleString()}
          </span>
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 group-hover:scale-105 text-slate-950 font-black text-[10px] sm:text-xs flex items-center justify-center shadow-md transition-transform">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* 2. AUDIO FX QUICK TOGGLE & VOLUME SLIDER */}
        <div className="relative" ref={soundMenuRef}>
          <button
            id="sound-settings-toggle"
            onClick={toggleMute}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowSoundMenu(!showSoundMenu);
            }}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute / Volume Settings (Click or Right-Click)'}
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-sm ${
              isMuted
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : volume < 0.4 ? (
              <Volume1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Volume Settings Popover */}
          {showSoundMenu && (
            <div className="absolute right-0 mt-2 w-48 p-3 rounded-2xl bg-[#0b0c1e] border border-white/15 shadow-2xl z-50 flex flex-col gap-2.5 backdrop-blur-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Sliders className="w-3.5 h-3.5" /> Audio FX
                </span>
                <span className="font-mono text-[10px] text-slate-400">
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

              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                <button
                  onClick={() => toggleMute()}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold cursor-pointer"
                >
                  {isMuted ? 'Unmute' : 'Mute All'}
                </button>
                <button
                  onClick={() => soundManager.playClaimReward()}
                  className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold cursor-pointer"
                >
                  Test FX 🎵
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. USER PROFILE & EXPANDED OPTIONS MENU (Contains Payout, Settings & Pages) */}
        {isAuthenticated && user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              id="header-user-profile-menu-button"
              onClick={() => {
                soundManager.playClick();
                setShowProfileDropdown(!showProfileDropdown);
              }}
              className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all cursor-pointer group backdrop-blur-xl shadow-sm"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${userAvatarObj.bgGradient} ring-2 ring-cyan-400/50 flex items-center justify-center text-sm sm:text-base shadow-md group-hover:scale-105 transition-transform`}
              >
                {userAvatarObj.emoji}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-white max-w-[85px] truncate">
                  {user.displayName}
                </span>
                <span className="text-[9px] text-cyan-400 font-mono font-bold mt-0.5">
                  LVL {user.level || 1}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>

            {/* Comprehensive Profile & Options Dropdown Menu */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 max-h-[85vh] overflow-y-auto p-3 rounded-2xl bg-[#090b1c]/98 border border-cyan-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.85)] z-50 flex flex-col gap-2.5 backdrop-blur-2xl ring-1 ring-white/10 scrollbar-thin scrollbar-thumb-cyan-500/20"
                >
                  {/* User Profile Card Header */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setShowProfileDropdown(false);
                      onOpenProfile();
                    }}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/70 to-purple-950/70 border border-cyan-500/30 flex items-center gap-2.5 cursor-pointer hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${userAvatarObj.bgGradient} border border-cyan-400/40 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      {userAvatarObj.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                          {user.displayName}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Lv.{user.level || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-slate-400">View Full Profile</span>
                        <span className="text-[9px] text-amber-400 font-mono font-bold">
                          {balance.toLocaleString()}🪙
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FINANCIAL SECTION: PAYOUT & WALLET */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">
                      Financials & Earnings
                    </div>

                    {/* PAYOUT / WITHDRAWAL BUTTON (Integrated Inside Menu) */}
                    <button
                      id="menu-payout-button"
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenWithdrawal();
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 hover:from-emerald-500/30 hover:to-teal-500/25 text-emerald-300 font-black text-xs flex items-center justify-between border border-emerald-500/40 hover:border-emerald-400/80 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black text-emerald-200 group-hover:text-white transition-colors">
                            Payout / Withdraw
                          </div>
                          <div className="text-[9px] text-emerald-400/80 font-normal">
                            Instant Bank / UPI / Crypto
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-300 font-mono font-black block">
                          {currSym}{cashVal}
                        </span>
                        <span className="text-[8px] text-emerald-400/70 font-mono">
                          Cash Balance
                        </span>
                      </div>
                    </button>

                    {/* WALLET & ADD COINS BUTTON */}
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenWallet();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-between border border-amber-500/20 hover:border-amber-400/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                        <span className="group-hover:text-white transition-colors">Wallet & Add Coins</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono font-black">
                        {balance.toLocaleString()}🪙
                      </span>
                    </button>

                    {/* KYC DOCUMENT VERIFICATION */}
                    {onOpenKyc && (
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setShowProfileDropdown(false);
                          onOpenKyc();
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-3.5 h-3.5 ${isKycVerified ? 'text-emerald-400' : isKycPending ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span>KYC Verification</span>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${isKycVerified ? 'bg-emerald-500/20 text-emerald-300' : isKycPending ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                          {isKycVerified ? 'VERIFIED' : isKycPending ? 'PENDING' : 'VERIFY ID'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* SETTINGS & GAMEPLAY CONTROLS */}
                  <div className="space-y-0.5 pt-1.5 border-t border-white/10">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">
                      Preferences & System
                    </div>

                    {/* GAME SETTINGS BUTTON */}
                    <button
                      id="menu-settings-button"
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        if (onOpenSettings) onOpenSettings();
                        else onOpenProfile();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 hover:text-white text-xs font-bold flex items-center justify-between border border-cyan-500/20 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Game & Audio Settings</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono">3D / FX</span>
                    </button>
                  </div>

                  {/* DAILY REWARDS & BONUS SECTION */}
                  <div className="space-y-0.5 pt-1.5 border-t border-white/10">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">
                      Daily Rewards & Quests
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenDailyBonus();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span>Daily Login Bonus</span>
                      </div>
                      {canClaimDailyBonus ? (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full animate-bounce">
                          CLAIM
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenLuckySpin();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Lucky Spin Wheel</span>
                      </div>
                      {isLuckySpinAvailable ? (
                        <span className="px-1.5 py-0.2 bg-purple-500 text-white font-black text-[9px] rounded-full">
                          FREE
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenMissions();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Quests & Missions</span>
                      </div>
                      {pendingMissionsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full">
                          {pendingMissionsCount}
                        </span>
                      )}
                    </button>

                    {onOpenRewardedAd && (
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setShowProfileDropdown(false);
                          onOpenRewardedAd();
                        }}
                        className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tv className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Watch Ad (+500 Coins)</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">+500</span>
                      </button>
                    )}
                  </div>

                  {/* COMMUNITY & COMPETITION */}
                  <div className="space-y-0.5 pt-1.5 border-t border-white/10">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">
                      Social & Leaderboards
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenLeaderboard();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Leaderboard Ranks</span>
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenAchievements();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span>Badges & Trophies</span>
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setShowProfileDropdown(false);
                        onOpenFriends();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Friends & Squad</span>
                    </button>
                  </div>

                  {/* SIGN OUT ACTION */}
                  <div className="pt-1.5 border-t border-white/10">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-red-950/30 text-red-400 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                if (onOpenSettings) onOpenSettings();
              }}
              title="Game Settings"
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenAuth();
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer transform active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

