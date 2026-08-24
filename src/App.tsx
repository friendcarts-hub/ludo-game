import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Trophy, Target, Users, Wallet, Play } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { AdminProvider } from './context/AdminContext';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/layout/Header';
import { HomeScreen } from './components/screens/HomeScreen';
import { GamePlayScreen } from './components/screens/GamePlayScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { AdminRoutePage } from './components/screens/AdminRoutePage';

// Modals
import { GameModeSelectModal } from './components/modals/GameModeSelectModal';
import { MatchmakingModal } from './components/modals/MatchmakingModal';
import { WalletModal } from './components/modals/WalletModal';
import { WithdrawalModal } from './components/modals/WithdrawalModal';
import { KycModal } from './components/modals/KycModal';
import { DailyBonusModal } from './components/modals/DailyBonusModal';
import { LuckySpinModal } from './components/modals/LuckySpinModal';
import { RewardedAdModal } from './components/modals/RewardedAdModal';
import { DailyMissionsModal } from './components/modals/DailyMissionsModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { AchievementsModal } from './components/modals/AchievementsModal';
import { FriendsModal } from './components/modals/FriendsModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AdminDashboardModal } from './components/modals/AdminDashboardModal';
import { AuthModal } from './components/modals/AuthModal';
import { OnlinePlayersModal } from './components/modals/OnlinePlayersModal';
import { OnlinePlayer } from './types';

const AppContent: React.FC = () => {
  const {
    gameState,
    startOfflineGame,
    startAiGame,
    startOnlineRandomMatch,
    createPrivateRoom,
    joinPrivateRoom,
  } = useGame();
  const { user, isAuthenticated } = useAuth();
  const { missions } = useSocial();

  // URL / Routing detection for /admin path or #/admin hash
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.endsWith('/admin') ||
      path === '/admin' ||
      hash.includes('admin') ||
      search.includes('route=admin')
    );
  });

  // Listen for browser URL back/forward and hash changes
  React.useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      setIsAdminRoute(
        path.endsWith('/admin') ||
        path === '/admin' ||
        hash.includes('admin') ||
        search.includes('route=admin')
      );
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToLobby = () => {
    if (window.location.pathname.includes('/admin')) {
      window.history.pushState({}, '', '/');
    }
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
    setIsAdminRoute(false);
  };

  // Modals state
  const [isGameModeOpen, setIsGameModeOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [matchmakingWager, setMatchmakingWager] = useState(500);
  const [isMatchmakingFreeAd, setIsMatchmakingFreeAd] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [isLuckySpinOpen, setIsLuckySpinOpen] = useState(false);
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isOnlinePlayersOpen, setIsOnlinePlayersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [showFullAuthScreen, setShowFullAuthScreen] = useState(false);
  
  // Global 3D / Perspective settings
  const [is3DView, setIs3DView] = useState(true);
  const [tiltDegree, setTiltDegree] = useState(25);

  const isInActiveMatch = !!gameState;
  const pendingMissionsCount = (missions || []).filter((m) => m.completed && !m.claimed).length;

  const handleOpenAuth = (mode: 'login' | 'signup' | 'phone' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthOpen(true);
  };

  const requireAuth = (action: () => void, mode: 'login' | 'signup' | 'phone' = 'login') => {
    if (!isAuthenticated) {
      handleOpenAuth(mode);
      return;
    }
    action();
  };

  const handleChallengePlayer = (player: OnlinePlayer) => {
    requireAuth(() => {
      // If player is in lobby, create a quick private match room
      createPrivateRoom(200);
    });
  };

  // If user navigated to URL /admin or #admin, show secure Admin Login / Management Page
  if (isAdminRoute) {
    return <AdminRoutePage onBackToLobby={navigateToLobby} />;
  }

  return (
    <div className="min-h-screen bg-[#05050f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Navigation Bar */}
      <Header
        onOpenWallet={() => requireAuth(() => setIsWalletOpen(true))}
        onOpenWithdrawal={() => requireAuth(() => setIsWithdrawalOpen(true))}
        onOpenProfile={() => requireAuth(() => setIsProfileOpen(true))}
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenGameMode={() => requireAuth(() => setIsGameModeOpen(true))}
        onOpenDailyBonus={() => requireAuth(() => setIsDailyBonusOpen(true))}
        onOpenLuckySpin={() => requireAuth(() => setIsLuckySpinOpen(true))}
        onOpenMissions={() => requireAuth(() => setIsMissionsOpen(true))}
        onOpenLeaderboard={() => requireAuth(() => setIsLeaderboardOpen(true))}
        onOpenAchievements={() => requireAuth(() => setIsAchievementsOpen(true))}
        onOpenFriends={() => requireAuth(() => setIsFriendsOpen(true))}
        onOpenOnlinePlayers={() => requireAuth(() => setIsOnlinePlayersOpen(true))}
        onOpenKyc={() => requireAuth(() => setIsKycOpen(true))}
        onOpenSettings={() => requireAuth(() => setIsSettingsOpen(true))}
        onOpenRewardedAd={() => requireAuth(() => setIsRewardedAdOpen(true))}
      />

      {/* Main Content Area: Active Game Screen, Full Auth Screen, or Full Home Lobby UI */}
      <main className="flex-1 flex flex-col items-center justify-start w-full relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isInActiveMatch ? (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <GamePlayScreen />
            </motion.div>
          ) : showFullAuthScreen ? (
            <motion.div
              key="authscreen"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="w-full"
            >
              <AuthScreen
                initialMode={authModalMode}
                onBackToLobby={() => setShowFullAuthScreen(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="w-full"
            >
              <HomeScreen
                onOpenGameMode={() => requireAuth(() => setIsGameModeOpen(true))}
                onOpenDailyBonus={() => requireAuth(() => setIsDailyBonusOpen(true))}
                onOpenLuckySpin={() => requireAuth(() => setIsLuckySpinOpen(true))}
                onOpenRewardedAd={() => requireAuth(() => setIsRewardedAdOpen(true))}
                onOpenMissions={() => requireAuth(() => setIsMissionsOpen(true))}
                onOpenLeaderboard={() => requireAuth(() => setIsLeaderboardOpen(true))}
                onOpenAchievements={() => requireAuth(() => setIsAchievementsOpen(true))}
                onOpenFriends={() => requireAuth(() => setIsFriendsOpen(true))}
                onOpenWallet={() => requireAuth(() => setIsWalletOpen(true))}
                onOpenWithdrawal={() => requireAuth(() => setIsWithdrawalOpen(true))}
                onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Console Dock Navigation (Visible on Home lobby) */}
      <AnimatePresence>
        {!isInActiveMatch && !showFullAuthScreen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl sm:rounded-full bg-[#06081cdc]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center justify-between sm:justify-center gap-1 sm:gap-3 max-w-[calc(100vw-16px)] sm:max-w-none ring-1 ring-white/10"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[10px] sm:text-xs flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 border border-cyan-500/40 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Lobby</span>
            </button>

            <button
              onClick={() => requireAuth(() => setIsLeaderboardOpen(true))}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-slate-300 hover:text-white hover:bg-white/5 font-bold text-[10px] sm:text-xs flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Ranks</span>
            </button>

            {/* Quick Play Center Pulse Button */}
            <button
              onClick={() => requireAuth(() => setIsGameModeOpen(true))}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-[0_0_25px_rgba(6,182,212,0.6)] transform active:scale-95 transition-all cursor-pointer ring-2 ring-cyan-400/50"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>PLAY</span>
            </button>

            <button
              onClick={() => requireAuth(() => setIsMissionsOpen(true))}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-slate-300 hover:text-white hover:bg-white/5 font-bold text-[10px] sm:text-xs flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 transition-colors cursor-pointer relative"
            >
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span>Quests</span>
              {pendingMissionsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-0.5 right-1 animate-ping" />
              )}
            </button>

            <button
              onClick={() => requireAuth(() => setIsWalletOpen(true))}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-slate-300 hover:text-white hover:bg-white/5 font-bold text-[10px] sm:text-xs flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>Wallet</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Dialogues */}
      <GameModeSelectModal
        isOpen={isGameModeOpen}
        onClose={() => setIsGameModeOpen(false)}
        onStartOffline={startOfflineGame}
        onStartAi={startAiGame}
        onStartOnline={(wager, isFree) => {
          setMatchmakingWager(wager);
          setIsMatchmakingFreeAd(!!isFree);
          setIsMatchmakingOpen(true);
        }}
        onCreateRoom={createPrivateRoom}
        onJoinRoom={joinPrivateRoom}
      />

      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        wager={matchmakingWager}
        isFreeAdMatch={isMatchmakingFreeAd}
        onCancel={() => setIsMatchmakingOpen(false)}
        onMatchFound={(wager, opponents, isFree) => {
          setIsMatchmakingOpen(false);
          startOnlineRandomMatch(wager, opponents, isFree ?? isMatchmakingFreeAd);
        }}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
        onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
        onOpenLuckySpin={() => setIsLuckySpinOpen(true)}
        onOpenRewardedAd={() => setIsRewardedAdOpen(true)}
      />

      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        onOpenKyc={() => setIsKycOpen(true)}
      />

      <KycModal isOpen={isKycOpen} onClose={() => setIsKycOpen(false)} />

      <DailyBonusModal isOpen={isDailyBonusOpen} onClose={() => setIsDailyBonusOpen(false)} />

      <LuckySpinModal isOpen={isLuckySpinOpen} onClose={() => setIsLuckySpinOpen(false)} />

      <RewardedAdModal isOpen={isRewardedAdOpen} onClose={() => setIsRewardedAdOpen(false)} />

      <DailyMissionsModal isOpen={isMissionsOpen} onClose={() => setIsMissionsOpen(false)} />

      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />

      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />

      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onChallengeFriend={(friendName) => {
          createPrivateRoom(200);
        }}
        onChallengePlayer={handleChallengePlayer}
      />

      <OnlinePlayersModal
        isOpen={isOnlinePlayersOpen}
        onClose={() => setIsOnlinePlayersOpen(false)}
        onChallengePlayer={handleChallengePlayer}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
        onOpenKyc={() => setIsKycOpen(true)}
        onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
        onOpenLuckySpin={() => setIsLuckySpinOpen(true)}
        onOpenMissions={() => setIsMissionsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenRewardedAd={() => setIsRewardedAdOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        is3DView={is3DView}
        onToggle3D={() => setIs3DView(!is3DView)}
        tiltDegree={tiltDegree}
        onChangeTilt={(deg) => setTiltDegree(deg)}
      />

      <AdminDashboardModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <SocialProvider>
          <AdminProvider>
            <GameProvider>
              <AppContent />
            </GameProvider>
          </AdminProvider>
        </SocialProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
