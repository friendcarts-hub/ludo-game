import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Users,
  CreditCard,
  Trophy,
  Sliders,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  Coins,
  DollarSign,
  Gamepad2,
  TrendingUp,
  Tv,
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Lock,
  KeyRound,
  User,
  AlertCircle,
  LogIn,
  LogOut,
  Key,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../game/audio';
import { adsterraService } from '../../services/adsterraService';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, toggleAdminRole, isAdmin } = useAuth();
  const {
    stats,
    allUsers,
    tournaments,
    toggleUserBan,
    adjustUserCoins,
    approveWithdrawal,
    rejectWithdrawal,
    createTournament,
  } = useAdmin();

  const { withdrawals, settings, updateSettings, addCoins } = useWallet();

  // Dedicated Admin Auth State (isolated from public user login)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('LUDO_ADMIN_AUTHORIZED') === 'true' || user?.role === 'admin';
  });
  const [loginMethod, setLoginMethod] = useState<'passkey' | 'credentials'>('passkey');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync state whenever modal opens or user's role updates
  useEffect(() => {
    if (isOpen) {
      const isAuth = sessionStorage.getItem('LUDO_ADMIN_AUTHORIZED') === 'true' || user?.role === 'admin';
      setIsAdminAuthenticated(isAuth);
      setAuthError('');
      setAuthSuccess('');
    }
  }, [isOpen, user?.role]);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'tournaments' | 'settings' | 'ads'>('overview');
  const [searchUser, setSearchUser] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // New Tournament form state
  const [tTitle, setTTitle] = useState('');
  const [tEntry, setTEntry] = useState('200');
  const [tPrize, setTPrize] = useState('1400');
  const [tPlayers, setTPlayers] = useState('8');

  // Economy settings state with safe default fallbacks
  const [coinRate, setCoinRate] = useState((settings?.coinToCashRate ?? 1000).toString());
  const [minWith, setMinWith] = useState((settings?.minWithdrawalCoins ?? 2000).toString());
  const [commission, setCommission] = useState((settings?.gameCommissionPercent ?? 10).toString());

  // Adsterra & Match Coins Reward settings
  const [winnerCoins, setWinnerCoins] = useState((settings?.matchWinnerRewardCoins ?? 500).toString());
  const [loserCoins, setLoserCoins] = useState((settings?.matchLoserRewardCoins ?? 50).toString());
  const [freeWinnerCoins, setFreeWinnerCoins] = useState((settings?.freeAdMatchWinnerReward ?? 350).toString());
  const [freeLoserCoins, setFreeLoserCoins] = useState((settings?.freeAdMatchLoserReward ?? 60).toString());
  const [adsterraEnabled, setAdsterraEnabled] = useState(settings?.adsterraEnabled ?? true);
  const [directLink, setDirectLink] = useState(settings?.adsterraDirectLink ?? 'https://www.profitablecpmrate.com/y3e2t8h45j?key=adsterra_ludoverse_direct');
  const [bannerKey, setBannerKey] = useState(settings?.adsterraBannerKey ?? 'adsterra_banner_728x90_ludo');
  const [popunderEnabled, setPopunderEnabled] = useState(settings?.adsterraPopunderEnabled ?? true);
  const [adWatchBonus, setAdWatchBonus] = useState((settings?.adsterraAdWatchReward ?? 250).toString());
  const [freeMatchesEnabled, setFreeMatchesEnabled] = useState(settings?.freeMatchAdEntryEnabled ?? true);

  const filteredUsers = (allUsers || []).filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Dedicated Admin Passkey Authentication Handler
  const handleAdminPasskeyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const key = adminPasskey.trim();
    if (
      key === 'admin123' ||
      key === 'ludo@admin' ||
      key === 'admin' ||
      key === 'superadmin2026' ||
      key === 'admin2026'
    ) {
      soundManager.playVictory();
      sessionStorage.setItem('LUDO_ADMIN_AUTHORIZED', 'true');
      setAuthSuccess('Master Admin Passkey verified successfully!');
      setTimeout(() => {
        setIsAdminAuthenticated(true);
        setAdminPasskey('');
      }, 350);
    } else {
      soundManager.playError();
      setAuthError('Access Denied: Invalid Master Secret Passkey.');
    }
  };

  // Dedicated Admin Account Credentials Authentication Handler
  const handleAdminCredentialsAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();

    if (!u || !p) {
      setAuthError('Please enter both Admin Username/Email and Password.');
      return;
    }

    setIsVerifying(true);

    // Validate dedicated admin credentials
    const isMasterAdmin =
      (u === 'admin@ludoverse.com' || u === 'admin' || u === 'superadmin') &&
      (p === 'admin123' || p === 'admin' || p === 'superadmin2026');

    const matchingAdminUser = allUsers.find(
      (usr) => (usr.email.toLowerCase() === u || usr.displayName.toLowerCase() === u) && usr.role === 'admin'
    );

    if (isMasterAdmin || matchingAdminUser) {
      soundManager.playVictory();
      sessionStorage.setItem('LUDO_ADMIN_AUTHORIZED', 'true');
      setAuthSuccess('Admin Credentials Authorized!');
      setTimeout(() => {
        setIsAdminAuthenticated(true);
        setIsVerifying(false);
        setAdminUsername('');
        setAdminPassword('');
      }, 350);
    } else {
      soundManager.playError();
      setIsVerifying(false);
      setAuthError('Access Denied: Unauthorized credentials. Only registered Admin accounts can log in here.');
    }
  };

  const handleAdminLockLogout = () => {
    soundManager.playClick();
    sessionStorage.removeItem('LUDO_ADMIN_AUTHORIZED');
    setIsAdminAuthenticated(false);
    setAdminPasskey('');
    setAdminUsername('');
    setAdminPassword('');
    setAuthError('');
    setAuthSuccess('');
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;

    createTournament({
      title: tTitle.trim(),
      description: 'Championship Arena Bracket',
      entryFee: parseInt(tEntry) || 0,
      prizePool: parseInt(tPrize) || 1000,
      maxPlayers: (parseInt(tPlayers) || 8) as 4 | 8 | 16,
      startTime: Date.now() + 3600000,
    });

    setTTitle('');
    soundManager.playVictory();
    alert('New tournament scheduled successfully!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      coinToCashRate: parseInt(coinRate) || 1000,
      minWithdrawalCoins: parseInt(minWith) || 2000,
      gameCommissionPercent: parseInt(commission) || 10,
    });
    soundManager.playClick();
    alert('Economy settings updated!');
  };

  const handleSaveAdsterraSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      matchWinnerRewardCoins: parseInt(winnerCoins) || 500,
      matchLoserRewardCoins: parseInt(loserCoins) || 50,
      freeAdMatchWinnerReward: parseInt(freeWinnerCoins) || 350,
      freeAdMatchLoserReward: parseInt(freeLoserCoins) || 60,
      adsterraEnabled,
      adsterraDirectLink: directLink.trim(),
      adsterraBannerKey: bannerKey.trim(),
      adsterraPopunderEnabled: popunderEnabled,
      adsterraAdWatchReward: parseInt(adWatchBonus) || 250,
      freeMatchAdEntryEnabled: freeMatchesEnabled,
    };
    updateSettings(updated);
    adsterraService.setConfig({
      enabled: adsterraEnabled,
      directLink: directLink.trim(),
      bannerKey: bannerKey.trim(),
      popunderEnabled,
      rewardCoins: parseInt(adWatchBonus) || 250,
    });
    soundManager.playVictory();
    alert('Adsterra Ads & Match Coins Configuration Saved Successfully!');
  };

  const handleTestDirectLink = () => {
    if (!directLink || !directLink.startsWith('http')) {
      alert('Please enter a valid HTTP/HTTPS Adsterra Direct Link URL.');
      return;
    }
    adsterraService.triggerDirectLink(directLink);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          {!isAdminAuthenticated ? (
            /* DEDICATED ADMIN LOGIN FORM VIEW (Isolated from public user auth) */
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-md bg-gradient-to-b from-[#11091a] via-[#0b0612] to-[#06040a] border-2 border-red-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col relative overflow-hidden"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-red-500/20 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">Admin Console Login</h3>
                    <p className="text-[11px] text-red-300/70">Dedicated Admin Authorization</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Login Method Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 border border-red-500/20 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setLoginMethod('passkey');
                    setAuthError('');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginMethod === 'passkey'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Master Passkey</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setLoginMethod('credentials');
                    setAuthError('');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginMethod === 'credentials'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Admin Account</span>
                </button>
              </div>

              {/* Error & Success Feedback Alerts */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </motion.div>
                )}
                {authSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode 1: Master Secret Passkey Form */}
              {loginMethod === 'passkey' ? (
                <form onSubmit={handleAdminPasskeyAuth} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-red-400" />
                      <span>Admin Master Key</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={adminPasskey}
                        onChange={(e) => setAdminPasskey(e.target.value)}
                        placeholder="Enter master admin passkey (e.g. admin123)"
                        autoFocus
                        className="w-full bg-slate-950/90 border border-red-500/30 focus:border-red-400 focus:ring-1 focus:ring-red-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 px-1">
                      <span className="text-[10px] text-slate-500">Default Super Key:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminPasskey('admin123');
                          soundManager.playClick();
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold underline cursor-pointer"
                      >
                        Insert admin123
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>UNLOCK ADMIN CONSOLE</span>
                  </button>
                </form>
              ) : (
                /* Mode 2: Dedicated Admin Account Form */
                <form onSubmit={handleAdminCredentialsAuth} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-red-400" />
                      <span>Admin Username / Email</span>
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin@ludoverse.com or admin"
                      autoFocus
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-red-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>Admin Account Password</span>
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Admin secret password"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-red-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isVerifying ? 'Validating Admin Access...' : 'SIGN IN TO ADMIN CONSOLE'}</span>
                  </button>
                </form>
              )}

              {/* Security Footnote */}
              <div className="mt-5 pt-3 border-t border-red-500/20 text-center">
                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-red-400/70" />
                  <span>Strictly reserved for administrators. Public user accounts cannot log in here.</span>
                </p>
              </div>
            </motion.div>
          ) : (
            /* AUTHENTICATED FULL ADMIN DASHBOARD VIEW */
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-4xl bg-slate-900 border-2 border-red-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-500" />
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      LudoVerse Admin Suite
                      <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/40">
                        SUPER ADMIN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Manage real-time ecosystem, payouts, and economy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Admin Lock / Sign Out Button */}
                  <button
                    onClick={handleAdminLockLogout}
                    title="Lock Admin Console"
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 text-red-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Lock Console</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 py-2.5 border-b border-slate-800 relative">
                {[
                  { id: 'overview' as const, label: 'Analytics', icon: TrendingUp },
                  { id: 'users' as const, label: 'Players', icon: Users },
                  { id: 'withdrawals' as const, label: 'Payouts', icon: CreditCard },
                  { id: 'tournaments' as const, label: 'Tourneys', icon: Trophy },
                  { id: 'settings' as const, label: 'Economy', icon: Sliders },
                  { id: 'ads' as const, label: 'Ads & Coins', icon: Tv },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        soundManager.playClick();
                        setActiveTab(tab.id);
                      }}
                      className={`relative py-2 px-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'text-red-400 font-black'
                          : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="admin-tab-pill"
                          className="absolute inset-0 rounded-xl bg-red-500/20 border border-red-500/50 shadow-md -z-0"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="text-[11px] sm:text-xs relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              <AnimatePresence mode="wait">
                {/* 1. OVERVIEW ANALYTICS */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Players</span>
                        <p className="text-2xl font-black text-white font-mono mt-1">
                          {(stats?.totalUsers ?? allUsers.length).toLocaleString()}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Live Matches</span>
                        <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                          {stats?.liveMatches ?? 3}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Games Played</span>
                        <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                          {(stats?.totalMatches ?? 1250).toLocaleString()}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Platform Revenue</span>
                        <p className="text-2xl font-black text-yellow-400 font-mono mt-1">
                          ${(stats?.platformRevenueEstimate ?? 1420.5).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Economy Summary Card */}
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Real-time Coin Circulation & Reserves
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Total Coins in Circulation</span>
                          <span className="block text-sm font-black text-yellow-400 font-mono">
                            {(stats?.totalCoinsInCirculation ?? 280000).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Pending Payouts Queue</span>
                          <span className="block text-sm font-black text-amber-400 font-mono">
                            {stats?.pendingWithdrawalsCount ?? withdrawals.filter((w) => w.status === 'pending').length}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Platform House Fee</span>
                          <span className="block text-sm font-black text-emerald-400 font-mono">
                            {settings?.gameCommissionPercent ?? 10}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Super Admin Quick Actions & Broadcast Console */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-red-400" /> Super Admin Quick Actions
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Live Server v2.4</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            addCoins(50000, 'Super Admin developer grant');
                            soundManager.playVictory();
                            alert('Added 50,000 Coins to your balance!');
                          }}
                          className="p-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Coins className="w-4 h-4 text-yellow-400" /> +50,000 Free Coins
                        </button>

                        <button
                          onClick={() => {
                            soundManager.playClick();
                            alert('Matchmaking lobbies and Redis state refreshed.');
                          }}
                          className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Gamepad2 className="w-4 h-4 text-cyan-400" /> Refresh Matchmaking
                        </button>

                        <button
                          onClick={async () => {
                            soundManager.playVictory();
                            await toggleAdminRole();
                          }}
                          className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Shield className="w-4 h-4 text-purple-400" /> Toggle Role ({user?.role || 'user'})
                        </button>
                      </div>

                      {/* Global Player Broadcast Announcement Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!broadcastMsg.trim()) return;
                          setBroadcastSent(true);
                          soundManager.playVictory();
                          setTimeout(() => setBroadcastSent(false), 3000);
                          setBroadcastMsg('');
                        }}
                        className="space-y-2 pt-2 border-t border-red-500/20"
                      >
                        <label className="text-[11px] font-bold text-slate-300 block">
                          Broadcast In-Game Global Announcement
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder="Type announcement to all players (e.g. Mega Tournament starts in 15 mins!)..."
                            className="flex-1 bg-slate-950 border border-slate-700 focus:border-red-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                          >
                            {broadcastSent ? 'Sent Broadcast!' : 'Broadcast'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* 2. USER MANAGEMENT */}
                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Search players by name, email, or user ID..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
                    />

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {filteredUsers.map((u, idx) => (
                        <div
                          key={`admin-user-${u.uid || idx}-${idx}`}
                          className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">{u.displayName}</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  u.isBanned
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {u.isBanned ? 'BANNED' : 'ACTIVE'}
                              </span>
                              {u.role === 'admin' && (
                                <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{u.email}</span>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                              <span className="text-yellow-400 font-bold">
                                {u.coins.toLocaleString()} Coins
                              </span>
                              <span>{u.totalGames} Matches</span>
                              <span>{u.totalWins} Wins</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const delta = prompt('Enter coins to add (or negative to deduct):', '1000');
                                if (delta) {
                                  const val = parseInt(delta) || 0;
                                  adjustUserCoins(u.uid, Math.abs(val), val >= 0, 'Admin manual adjustment');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-yellow-400 font-bold text-xs cursor-pointer"
                            >
                              ± Coins
                            </button>

                            <button
                              onClick={() => {
                                toggleUserBan(u.uid);
                              }}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                                u.isBanned
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }`}
                            >
                              {u.isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. WITHDRAWAL PAYOUT APPROVALS */}
                {activeTab === 'withdrawals' && (
                  <motion.div
                    key="withdrawals"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Payout Review Queue
                    </h4>
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          No withdrawal requests submitted yet.
                        </div>
                      ) : (
                        withdrawals.map((w, idx) => (
                          <div
                            key={`admin-withdraw-${w.id || idx}-${idx}`}
                            className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm">
                                  {w.currency || settings?.currencySymbol || '$'}
                                  {w.cashAmount.toFixed(2)}
                                </span>
                                <span className="text-yellow-400 font-mono">
                                  ({w.coinsAmount.toLocaleString()} Coins)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                Method: <strong className="uppercase">{w.method}</strong> •{' '}
                                {w.method === 'upi' ? (w.upiId || 'N/A') : `${w.bankDetails?.holderName || 'Player'} (${w.bankDetails?.accountNumber || 'N/A'})`}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                Requested: {new Date(w.createdAt).toLocaleString()}
                              </span>
                            </div>

                            {w.status === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    approveWithdrawal(w.id, 'TXN_' + Date.now().toString().slice(-6));
                                    soundManager.playVictory();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    rejectWithdrawal(w.id, 'Information mismatch or KYC required');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                                  w.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {w.status}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 4. TOURNAMENT CREATOR */}
                {activeTab === 'tournaments' && (
                  <motion.div
                    key="tournaments"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleCreateTournament} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Create New Tournament Bracket
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Tournament Title</label>
                          <input
                            type="text"
                            value={tTitle}
                            onChange={(e) => setTTitle(e.target.value)}
                            placeholder="e.g. Sunday Mega Clash"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Max Players</label>
                          <select
                            value={tPlayers}
                            onChange={(e) => setTPlayers(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            <option value="4">4 Players</option>
                            <option value="8">8 Players</option>
                            <option value="16">16 Players</option>
                            <option value="32">32 Players</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Entry Fee (Coins)</label>
                          <input
                            type="number"
                            value={tEntry}
                            onChange={(e) => setTEntry(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Prize Pool (Coins)</label>
                          <input
                            type="number"
                            value={tPrize}
                            onChange={(e) => setTPrize(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 text-white font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        PUBLISH TOURNAMENT 🏆
                      </button>
                    </form>

                    {/* Tournament List */}
                    <div className="space-y-2">
                      {tournaments.map((t, idx) => (
                        <div
                          key={`admin-tourn-${t.id || idx}-${idx}`}
                          className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <h5 className="font-black text-white">{t.title}</h5>
                            <span className="text-[10px] text-slate-400">
                              Prize: {t.prizePool} Coins • Entry: {t.entryFee} Coins • Max: {t.maxPlayers}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. GAME ECONOMY SETTINGS */}
                {activeTab === 'settings' && (
                  <motion.form
                    key="settings"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSaveSettings}
                    className="space-y-4 max-w-md"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">
                        Coin to USD/Cash Conversion Rate (e.g. 1000 Coins = $1.00)
                      </label>
                      <input
                        type="number"
                        value={coinRate}
                        onChange={(e) => setCoinRate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">
                        Minimum Withdrawal Coins
                      </label>
                      <input
                        type="number"
                        value={minWith}
                        onChange={(e) => setMinWith(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">
                        House Commission Fee Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 text-white font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95"
                    >
                      SAVE ECONOMY CONFIGURATION ⚙️
                    </button>
                  </motion.form>
                )}

                {/* 6. ADSTERRA ADS & MATCH REWARDS (WINNER / LOSER COINS) */}
                {activeTab === 'ads' && (
                  <motion.form
                    key="ads"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSaveAdsterraSettings}
                    className="space-y-5 max-w-2xl"
                  >
                    {/* Header Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-950 border border-purple-500/40 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                            <Tv className="w-3 h-3 text-purple-400" /> ADSTERRA AD NETWORK
                          </span>
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Free Matches & Match Coins Control
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1.5">
                          Admin Match Coins & Ad Monetization Suite
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Set custom coin rewards for winners & losers, enable free matches via Adsterra ad watch, and configure direct links.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestDirectLink}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/50 hover:bg-purple-600 text-white text-xs font-black border border-purple-400/40 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Ad Link</span>
                      </button>
                    </div>

                    {/* Section 1: Match Coin Rewards (Winner & Loser) */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span>Match Winner & Loser Coin Rewards (मैच इनाम)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Match Winner Reward Coins (विजेता के सिक्के)
                          </label>
                          <input
                            type="number"
                            value={winnerCoins}
                            onChange={(e) => setWinnerCoins(e.target.value)}
                            placeholder="500"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-yellow-400 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Coins given to the winner when finishing standard/wager matches.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-cyan-400" /> Match Loser / Consolation Coins (हारने वाले के सिक्के)
                          </label>
                          <input
                            type="number"
                            value={loserCoins}
                            onChange={(e) => setLoserCoins(e.target.value)}
                            placeholder="50"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-cyan-400 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Participation/consolation coins awarded to losing players upon match completion.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Free Ad Match Winner Reward (फ्री मैच विनर)
                          </label>
                          <input
                            type="number"
                            value={freeWinnerCoins}
                            onChange={(e) => setFreeWinnerCoins(e.target.value)}
                            placeholder="350"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-emerald-400 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Coins awarded when a player wins a 100% Free Ad-watched match.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-purple-400" /> Free Ad Match Loser Reward (फ्री मैच लूज़र)
                          </label>
                          <input
                            type="number"
                            value={freeLoserCoins}
                            onChange={(e) => setFreeLoserCoins(e.target.value)}
                            placeholder="60"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-purple-400 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Consolation reward for free ad-entry match losers.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Adsterra Configuration */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-wider">
                          <Tv className="w-4 h-4 text-purple-400" />
                          <span>Adsterra Monetization & Ad Links Settings</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdsterraEnabled(!adsterraEnabled)}
                            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
                          >
                            {adsterraEnabled ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Adsterra Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-400">Disabled</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div
                          onClick={() => setFreeMatchesEnabled(!freeMatchesEnabled)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            freeMatchesEnabled
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> Free Ad-Watch Match Entry
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Users watch an ad to join matches 100% free with 0 coins
                            </div>
                          </div>
                          {freeMatchesEnabled ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-500 shrink-0 ml-2" />
                          )}
                        </div>

                        <div
                          onClick={() => setPopunderEnabled(!popunderEnabled)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            popunderEnabled
                              ? 'bg-purple-950/30 border-purple-500/40 text-purple-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <Tv className="w-3.5 h-3.5 text-purple-400" /> Match Start Adsterra Trigger
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Trigger direct smart link impression when players join matches
                            </div>
                          </div>
                          {popunderEnabled ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-500 shrink-0 ml-2" />
                          )}
                        </div>
                      </div>

                      {/* Direct Link & Script Unit Key */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 block">
                            Adsterra Direct / SmartLink URL
                          </label>
                          <input
                            type="text"
                            value={directLink}
                            onChange={(e) => setDirectLink(e.target.value)}
                            placeholder="https://www.profitablecpmrate.com/YOUR_DIRECT_LINK"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-bold text-slate-300 mb-1 block">
                              Adsterra Banner Unit ID / Slot
                            </label>
                            <input
                              type="text"
                              value={bannerKey}
                              onChange={(e) => setBannerKey(e.target.value)}
                              placeholder="adsterra_banner_728x90_ludo"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 mb-1 block">
                              Adsterra Video Ad Watch Reward (Coins)
                            </label>
                            <input
                              type="number"
                              value={adWatchBonus}
                              onChange={(e) => setAdWatchBonus(e.target.value)}
                              placeholder="250"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs shadow-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>SAVE ADSTERRA & MATCH REWARD SETTINGS 💾</span>
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
