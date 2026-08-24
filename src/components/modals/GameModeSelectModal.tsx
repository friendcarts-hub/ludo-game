import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Bot,
  Globe,
  Key,
  Trophy,
  Coins,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Tv,
  Gift,
} from 'lucide-react';
import { AiDifficulty, GameMode, PlayerColor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useAdmin } from '../../context/AdminContext';
import { soundManager } from '../../game/audio';
import { RewardedAdModal } from './RewardedAdModal';
import { AdsterraBanner } from '../ads/AdsterraBanner';

interface GameModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOffline: (numPlayers: 2 | 3 | 4, customNames?: Record<PlayerColor, string>) => void;
  onStartAi: (difficulty: AiDifficulty, wager: number, numPlayers?: 2 | 4, userColor?: PlayerColor, isFreeAdMatch?: boolean) => void;
  onStartOnline: (wager: number, isFreeAdMatch?: boolean) => void;
  onCreateRoom: (wager: number, isFreeAdMatch?: boolean) => string;
  onJoinRoom: (roomCode: string, isFreeAdMatch?: boolean) => Promise<boolean>;
}

export const GameModeSelectModal: React.FC<GameModeSelectModalProps> = ({
  isOpen,
  onClose,
  onStartOffline,
  onStartAi,
  onStartOnline,
  onCreateRoom,
  onJoinRoom,
}) => {
  const { user } = useAuth();
  const { balance, settings } = useWallet();
  const { tournaments } = useAdmin();

  const [activeTab, setActiveTab] = useState<GameMode>('online_random');
  const [isAdRewardModalOpen, setIsAdRewardModalOpen] = useState(false);
  const [pendingGameLauncher, setPendingGameLauncher] = useState<(() => void) | null>(null);

  // Offline config
  const [offlineCount, setOfflineCount] = useState<2 | 3 | 4>(4);
  const [playerNames, setPlayerNames] = useState<Record<PlayerColor, string>>({
    red: user?.displayName || 'Player Red',
    green: 'Player Green',
    yellow: 'Player Yellow',
    blue: 'Player Blue',
  });

  // AI config
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('medium');
  const [aiWager, setAiWager] = useState<number>(100);
  const [aiPlayerCount, setAiPlayerCount] = useState<2 | 4>(4);
  const [aiUserColor, setAiUserColor] = useState<PlayerColor>('red');

  // Online config
  const [onlineWager, setOnlineWager] = useState<number>(500);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);

  // Private Room config
  const [roomMode, setRoomMode] = useState<'create' | 'join'>('create');
  const [roomWager, setRoomWager] = useState<number>(200);
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');

  const triggerFreeAdMatch = (launchFn: () => void) => {
    soundManager.playClick();
    setPendingGameLauncher(() => launchFn);
    setIsAdRewardModalOpen(true);
  };

  const handleAdWatchSuccess = () => {
    setIsAdRewardModalOpen(false);
    onClose();
    if (pendingGameLauncher) {
      pendingGameLauncher();
      setPendingGameLauncher(null);
    }
  };

  const handleStartOnlineClick = (isFree: boolean = false) => {
    if (isFree) {
      triggerFreeAdMatch(() => onStartOnline(0, true));
      return;
    }
    if (onlineWager > balance) {
      alert('Insufficient coin balance for this wager tier.');
      return;
    }
    soundManager.playClick();
    onClose();
    onStartOnline(onlineWager, false);
  };

  const handleCreateRoom = (isFree: boolean = false) => {
    if (isFree) {
      triggerFreeAdMatch(() => {
        const code = onCreateRoom(0, true);
        setCreatedCode(code);
      });
      return;
    }
    if (roomWager > balance) {
      alert('Insufficient coin balance.');
      return;
    }
    const code = onCreateRoom(roomWager, false);
    setCreatedCode(code);
  };

  const handleJoinRoom = async (isFree: boolean = false) => {
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Please enter a 6-character room code.');
      return;
    }
    if (isFree) {
      triggerFreeAdMatch(async () => {
        const success = await onJoinRoom(joinCode.trim(), true);
        if (success) {
          onClose();
        } else {
          setJoinError('Room code not found or game already in progress.');
        }
      });
      return;
    }
    const success = await onJoinRoom(joinCode.trim(), false);
    if (success) {
      onClose();
    } else {
      setJoinError('Room code not found or game already in progress.');
    }
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Select Game Mode
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wallet Balance: <span className="text-yellow-400 font-bold">{balance.toLocaleString()} Coins</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Navigation Tabs */}
            <div className="grid grid-cols-5 gap-1.5 py-3 border-b border-slate-800 relative">
              {[
                { id: 'offline' as GameMode, label: 'Pass & Play', icon: Users },
                { id: 'ai' as GameMode, label: 'Vs Computer', icon: Bot },
                { id: 'online_random' as GameMode, label: 'Online Match', icon: Globe },
                { id: 'private_room' as GameMode, label: 'Private Room', icon: Key },
                { id: 'tournament' as GameMode, label: 'Tournaments', icon: Trophy },
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
                    className={`relative py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'text-yellow-400 font-black'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="gamemode-tab-indicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/50 shadow-md -z-0"
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="text-[10px] font-bold truncate max-w-full relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Body with AnimatePresence */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <AnimatePresence mode="wait">
                {/* 1. PASS & PLAY OFFLINE */}
                {activeTab === 'offline' && (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-2 block">
                        Select Number of Players
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([2, 3, 4] as const).map((cnt) => (
                          <button
                            key={cnt}
                            onClick={() => setOfflineCount(cnt)}
                            className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              offlineCount === cnt
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {cnt} Players ({cnt === 2 ? 'Red & Yellow' : cnt === 3 ? '3 Colors' : '4 Colors'})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Player Names Configuration */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">Customize Player Names</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-slate-800/60 border border-red-500/40">
                          <span className="text-[10px] font-bold text-red-400 block mb-1">🔴 Red Player</span>
                          <input
                            type="text"
                            value={playerNames.red}
                            onChange={(e) => setPlayerNames({ ...playerNames, red: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        {offlineCount >= 3 && (
                          <div className="p-2 rounded-xl bg-slate-800/60 border border-emerald-500/40">
                            <span className="text-[10px] font-bold text-emerald-400 block mb-1">🟢 Green Player</span>
                            <input
                              type="text"
                              value={playerNames.green}
                              onChange={(e) => setPlayerNames({ ...playerNames, green: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        )}

                        <div className="p-2 rounded-xl bg-slate-800/60 border border-amber-500/40">
                          <span className="text-[10px] font-bold text-amber-400 block mb-1">🟡 Yellow Player</span>
                          <input
                            type="text"
                            value={playerNames.yellow}
                            onChange={(e) => setPlayerNames({ ...playerNames, yellow: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        {offlineCount >= 4 && (
                          <div className="p-2 rounded-xl bg-slate-800/60 border border-cyan-500/40">
                            <span className="text-[10px] font-bold text-cyan-400 block mb-1">🔵 Blue Player</span>
                            <input
                              type="text"
                              value={playerNames.blue}
                              onChange={(e) => setPlayerNames({ ...playerNames, blue: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onStartOffline(offlineCount, playerNames);
                        onClose();
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      Start Pass & Play Match 🎲
                    </button>
                  </motion.div>
                )}

                {/* 2. VS COMPUTER AI */}
                {activeTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* Player Mode: 2 Players or 4 Players */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                        Match Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { count: 2 as const, label: '2 Players (1v1 vs Bot)', desc: 'Fast head-to-head' },
                          { count: 4 as const, label: '4 Players (1 vs 3 Bots)', desc: 'Full 4-corner classic' },
                        ].map((m) => (
                          <button
                            key={m.count}
                            onClick={() => setAiPlayerCount(m.count)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              aiPlayerCount === m.count
                                ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/40 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/60'
                            }`}
                          >
                            <span className="text-xs font-black block text-white">{m.label}</span>
                            <span className="text-[10px] text-slate-400">{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Picker for Human Player */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                        Choose Your Token Color
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { color: 'red' as PlayerColor, label: '🔴 Red', bg: 'bg-[#ed1c24]', border: 'border-[#ed1c24]' },
                          { color: 'green' as PlayerColor, label: '🟢 Green', bg: 'bg-[#00a651]', border: 'border-[#00a651]' },
                          { color: 'yellow' as PlayerColor, label: '🟡 Yellow', bg: 'bg-[#ffc700]', border: 'border-[#ffc700]' },
                          { color: 'blue' as PlayerColor, label: '🔵 Blue', bg: 'bg-[#00aeef]', border: 'border-[#00aeef]' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => setAiUserColor(c.color)}
                            className={`py-2 px-1 rounded-xl text-center font-black text-xs transition-all border cursor-pointer ${
                              aiUserColor === c.color
                                ? `${c.bg} text-white shadow-lg ring-2 ring-white/60 scale-105`
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                        Select AI Intelligence Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'easy' as AiDifficulty, label: 'Novice Bot', desc: 'Random moves' },
                          { id: 'medium' as AiDifficulty, label: 'Challenger', desc: 'Balanced tactic' },
                          { id: 'hard' as AiDifficulty, label: 'Grandmaster', desc: 'Aggressive & home rush' },
                        ].map((diff) => (
                          <button
                            key={diff.id}
                            onClick={() => setAiDifficulty(diff.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              aiDifficulty === diff.id
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/60'
                            }`}
                          >
                            <span className="text-xs font-black block">{diff.label}</span>
                            <span className="text-[10px] text-slate-400">{diff.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                        Coin Wager Stake (Optional)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 100, 500, 1000].map((w) => (
                          <button
                            key={w}
                            onClick={() => setAiWager(w)}
                            className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              aiWager === w
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {w === 0 ? 'Practice (0)' : `${w} Coins`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {settings.freeMatchAdEntryEnabled && (
                        <button
                          onClick={() => triggerFreeAdMatch(() => onStartAi(aiDifficulty, 0, aiPlayerCount, aiUserColor, true))}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Tv className="w-4 h-4" />
                          <span>Watch Ad & Play Free (Win +{settings.freeAdMatchWinnerReward || 350} / Loss +{settings.freeAdMatchLoserReward || 60}) 🎬</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (aiWager > balance) {
                            alert('Insufficient coin balance for this wager.');
                            return;
                          }
                          onStartAi(aiDifficulty, aiWager, aiPlayerCount, aiUserColor, false);
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                      >
                        Play vs Computer AI ({aiWager > 0 ? `${aiWager} Coins` : 'Practice'}) 🤖
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. ONLINE RANDOM MATCH */}
                {activeTab === 'online_random' && (
                  <motion.div
                    key="online_random"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* Free Ad Entry High-Impact Card */}
                    {settings.freeMatchAdEntryEnabled && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0a1e1d] to-cyan-950/60 border border-emerald-500/40 space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                            <Tv className="w-3.5 h-3.5" /> Adsterra Free Entry Mode Active
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            100% Free
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Watch a short video ad and join any 4-player online match for <b>FREE</b>.
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                          <span>🏆 Winner Reward: <b className="text-amber-400">+{settings.freeAdMatchWinnerReward || 350} Coins</b></span>
                          <span>🤝 Loser Consolation: <b className="text-cyan-400">+{settings.freeAdMatchLoserReward || 60} Coins</b></span>
                        </div>
                        <button
                          onClick={() => handleStartOnlineClick(true)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Tv className="w-4 h-4" /> Watch Ad & Join Free Match ⚡
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-2 block">
                        Or Choose Coin Wager Tier
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { wager: 100, prize: 360 },
                          { wager: 500, prize: 1800 },
                          { wager: 1000, prize: 3600 },
                          { wager: 5000, prize: 18000 },
                        ].map((tier) => (
                          <button
                            key={tier.wager}
                            onClick={() => setOnlineWager(tier.wager)}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              onlineWager === tier.wager
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-yellow-400 shadow-md'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span className="text-xs font-black block">{tier.wager} Coins</span>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Win {tier.prize}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                      <p className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" /> 4-Player Synchronized Tournament
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Winner gets 4x pool minus commission. Loser gets +{settings.matchLoserRewardCoins || 50} consolation coins!
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartOnlineClick(false)}
                      disabled={isSearchingMatch}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSearchingMatch ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Matching Opponents in Queue...</span>
                        </>
                      ) : (
                        <span>Find 4-Player Match ({onlineWager} Coins Wager) ⚡</span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* 4. PRIVATE ROOM WITH FRIENDS */}
                {activeTab === 'private_room' && (
                  <motion.div
                    key="private_room"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Free Watch Ad Private Room Header */}
                    {settings.freeMatchAdEntryEnabled && (
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                        <span className="text-purple-300 font-bold flex items-center gap-1">
                          <Tv className="w-3.5 h-3.5 text-purple-400" /> Free Ad-Watch Host & Join Available
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">
                          Win +{settings.freeAdMatchWinnerReward || 350} Coins
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRoomMode('create')}
                        className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          roomMode === 'create'
                            ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        Create Private Room
                      </button>
                      <button
                        onClick={() => setRoomMode('join')}
                        className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          roomMode === 'join'
                            ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        Join with Code
                      </button>
                    </div>

                    {roomMode === 'create' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 block">
                            Room Entry Stake (Coins)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 100, 200, 500].map((w) => (
                              <button
                                key={w}
                                onClick={() => setRoomWager(w)}
                                className={`py-1.5 rounded-xl text-xs font-bold border ${
                                  roomWager === w
                                    ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {w === 0 ? 'Free' : `${w}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {!createdCode ? (
                          <div className="flex flex-col gap-2">
                            {settings.freeMatchAdEntryEnabled && (
                              <button
                                onClick={() => handleCreateRoom(true)}
                                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              >
                                <Tv className="w-3.5 h-3.5" /> Watch Ad & Create Free Room
                              </button>
                            )}
                            <button
                              onClick={() => handleCreateRoom(false)}
                              className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                            >
                              Generate 6-Digit Room Code ({roomWager} Coins) 🔑
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/50 text-center space-y-2">
                            <span className="text-xs text-purple-300 font-bold block">Share this code with your friends:</span>
                            <span className="text-3xl font-black text-yellow-400 tracking-widest block font-mono bg-black/40 py-2 rounded-xl border border-purple-500/30">
                              {createdCode}
                            </span>
                            <button
                              onClick={() => {
                                onClose();
                              }}
                              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                            >
                              Enter Room Lobby & Start Match 🚀
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 block">
                            Enter 6-Digit Room Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="e.g. 7X9K2L"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-lg font-black tracking-widest text-yellow-400 uppercase placeholder:text-slate-600"
                          />
                          {joinError && <p className="text-xs text-red-400 mt-1 font-bold">{joinError}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                          {settings.freeMatchAdEntryEnabled && (
                            <button
                              onClick={() => handleJoinRoom(true)}
                              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            >
                              <Tv className="w-3.5 h-3.5" /> Watch Ad & Join Room Free
                            </button>
                          )}
                          <button
                            onClick={() => handleJoinRoom(false)}
                            className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                          >
                            Join Match Room 🚀
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. TOURNAMENTS */}
                {activeTab === 'tournament' && (
                  <motion.div
                    key="tournament"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-300 font-bold">Live & Upcoming Tournaments</p>
                    <div className="space-y-2">
                      {tournaments.map((tourn) => (
                        <div
                          key={tourn.id}
                          className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <h4 className="text-xs font-black text-white">{tourn.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Prize: <span className="text-yellow-400 font-bold">{tourn.prizePool} Coins</span> •{' '}
                              {tourn.maxPlayers} Players Single Knockout
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              onStartOnline(tourn.entryFee);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                          >
                            {tourn.entryFee === 0 ? 'Enter Free' : `Join (${tourn.entryFee})`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional Adsterra Banner at modal footer */}
            {settings.adsterraBannerEnabled && (
              <div className="mt-3 pt-2 border-t border-slate-800 flex justify-center">
                <AdsterraBanner size="468x60" placementId="modal_footer" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Rewarded Ad Modal for Free Match Entry */}
      <RewardedAdModal
        isOpen={isAdRewardModalOpen}
        rewardType="free_match"
        onClose={() => setIsAdRewardModalOpen(false)}
        onRewardGranted={handleAdWatchSuccess}
      />
    </AnimatePresence>
  );
};
