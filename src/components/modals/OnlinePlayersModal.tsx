import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Swords,
  UserPlus,
  Shield,
  Circle,
  Trophy,
  Flame,
  Search,
  Check,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_LIST } from '../../data/avatars';
import { soundManager } from '../../game/audio';
import { OnlinePlayer } from '../../types';

interface OnlinePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengePlayer: (player: OnlinePlayer) => void;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  isOpen,
  onClose,
  onChallengePlayer,
}) => {
  const { realOnlineUsers, onlinePlayersCount, addFriend } = useSocial();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_lobby' | 'playing'>('all');
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const filteredPlayers = realOnlineUsers.filter((player) => {
    const matchesSearch =
      player.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.uid.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'in_lobby') return player.status === 'in_lobby' || player.status === 'online';
    if (statusFilter === 'playing') return player.status === 'playing' || player.status === 'matchmaking';
    return true;
  });

  const handleAddFriendClick = (player: OnlinePlayer) => {
    soundManager.playClick();
    addFriend(player.displayName);
    setAddedMap((prev) => ({ ...prev, [player.uid]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [player.uid]: false }));
    }, 3000);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#070b20] to-[#040614] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
                  <Wifi className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Live Online Players
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black font-mono border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {onlinePlayersCount.toLocaleString()} Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Real-time active players online in LudoVerse Arena
                  </p>
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

            {/* Search & Filter Bar */}
            <div className="py-3 space-y-2 border-b border-white/5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="खिलाड़ी खोजें / Search online user by name or ID..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  All Active ({realOnlineUsers.length})
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setStatusFilter('in_lobby');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'in_lobby'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  In Lobby (Ready)
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setStatusFilter('playing');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'playing'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  In Match
                </button>
              </div>
            </div>

            {/* Players Scroll Area */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No online users found matching criteria.</p>
                </div>
              ) : (
                filteredPlayers.map((player, idx) => {
                  const avatarObj =
                    AVATAR_LIST.find((a) => a.id === player.photoURL) || AVATAR_LIST[0];
                  const isCurrent = player.uid === user?.uid || player.isCurrentUser;
                  const isPlaying = player.status === 'playing';

                  return (
                    <motion.div
                      key={`online-player-${player.uid || idx}-${idx}`}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                      }`}
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/15 flex items-center justify-center text-2xl shadow-md">
                            {avatarObj.emoji}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                              isPlaying ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPlaying ? 'bg-amber-200' : 'bg-emerald-100 animate-ping'
                              }`}
                            />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] sm:max-w-[180px]">
                              {player.displayName}
                            </h4>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[9px] font-black uppercase">
                                You
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                              ⭐ Lvl {player.level || 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                            <span
                              className={`font-semibold ${
                                isPlaying ? 'text-amber-300' : 'text-emerald-400'
                              }`}
                            >
                              {player.statusText || (isPlaying ? 'In Match' : 'In Lobby')}
                            </span>
                            <span>•</span>
                            <span className="text-slate-300">
                              🏆 {player.totalWins || 0} Wins
                            </span>
                            {player.winRate && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-300">⚡ {player.winRate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCurrent && (
                          <>
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onClose();
                                onChallengePlayer(player);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Challenge</span>
                            </button>

                            <button
                              onClick={() => handleAddFriendClick(player)}
                              disabled={addedMap[player.uid]}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Add Friend"
                            >
                              {addedMap[player.uid] ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Auto-refreshes with live cloud presence
              </span>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
