import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, UserPlus, Gamepad2, Circle, Wifi, Swords, Check } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_LIST } from '../../data/avatars';
import { soundManager } from '../../game/audio';
import { OnlinePlayer } from '../../types';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeFriend: (friendName: string) => void;
  onChallengePlayer?: (player: OnlinePlayer) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onChallengeFriend,
  onChallengePlayer,
}) => {
  const { friends, addFriend, realOnlineUsers, onlinePlayersCount } = useSocial();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'online' | 'friends'>('online');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendNameInput.trim()) return;

    soundManager.playClick();
    addFriend(friendNameInput.trim());
    setAddMsg(`Sent friend request to ${friendNameInput.trim()}!`);
    setFriendNameInput('');
    setTimeout(() => setAddMsg(''), 3000);
  };

  const handleQuickAdd = (player: OnlinePlayer) => {
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
            className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#070b20] to-[#040614] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col max-h-[88vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Social & Live Players</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] text-emerald-400 font-bold font-mono">
                      {onlinePlayersCount.toLocaleString()} Real Users Live
                    </span>
                  </div>
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-2 border-b border-white/5 shrink-0">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('online');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'online'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" /> Live Online ({realOnlineUsers.length})
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('friends');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'friends'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Friends List ({friends.length})
              </button>
            </div>

            {activeTab === 'online' ? (
              /* TAB 1: Live Real Online Users */
              <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
                {realOnlineUsers.map((player, idx) => {
                  const avatarObj =
                    AVATAR_LIST.find((a) => a.id === player.photoURL) || AVATAR_LIST[0];
                  const isCurrent = player.uid === user?.uid || player.isCurrentUser;
                  const isPlaying = player.status === 'playing';

                  return (
                    <motion.div
                      key={`online-user-${player.uid || idx}-${idx}`}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center text-xl shadow">
                            {avatarObj.emoji}
                          </div>
                          <Circle
                            className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-current ${
                              isPlaying ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px]">
                              {player.displayName}
                            </h4>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 text-[8px] font-black uppercase">
                                You
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold">
                              Lvl {player.level || 1}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold block ${
                              isPlaying ? 'text-amber-300' : 'text-emerald-400'
                            }`}
                          >
                            {player.statusText || (isPlaying ? 'In Match' : 'In Lobby')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCurrent && (
                          <>
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onClose();
                                if (onChallengePlayer) {
                                  onChallengePlayer(player);
                                } else {
                                  onChallengeFriend(player.displayName);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <Swords className="w-3 h-3" /> Challenge
                            </button>

                            <button
                              onClick={() => handleQuickAdd(player)}
                              disabled={addedMap[player.uid]}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Add Friend"
                            >
                              {addedMap[player.uid] ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* TAB 2: Friends List & Add Form */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Add Friend Input */}
                <form onSubmit={handleAddFriend} className="py-2.5 border-b border-white/10 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={friendNameInput}
                    onChange={(e) => setFriendNameInput(e.target.value)}
                    placeholder="Enter friend username or player ID..."
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!friendNameInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-1 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Add
                  </button>
                </form>

                {addMsg && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/40 my-2 shrink-0">
                    {addMsg}
                  </p>
                )}

                {/* Friends List */}
                <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
                  {friends.map((friend, idx) => {
                    const avatarObj = AVATAR_LIST.find((a) => a.id === friend.avatar) || AVATAR_LIST[0];

                    return (
                      <motion.div
                        key={`friend-item-${friend.id || idx}-${idx}`}
                        whileHover={{ scale: 1.01 }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-xl">
                              {avatarObj.emoji}
                            </div>
                            <Circle
                              className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-current ${
                                friend.isOnline ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            />
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">{friend.name}</h4>
                            <span
                              className={`text-[10px] font-bold capitalize ${
                                friend.isOnline ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {friend.statusText}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onClose();
                            onChallengeFriend(friend.name);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" /> Challenge
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

