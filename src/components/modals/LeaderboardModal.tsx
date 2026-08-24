import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Crown } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_LIST } from '../../data/avatars';
import { soundManager } from '../../game/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { globalLeaderboard = [], weeklyLeaderboard = [] } = useSocial();
  const [tab, setTab] = useState<'global' | 'weekly'>('global');

  const currentList = tab === 'global' ? globalLeaderboard : weeklyLeaderboard;
  const safeList = Array.isArray(currentList) ? currentList : [];

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
            className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-black text-white">Global Leaderboard</h3>
                  <p className="text-xs text-slate-400">Top ranked players of LudoVerse Season 1</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Switch */}
            <div className="grid grid-cols-2 gap-2 my-3 relative">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setTab('global');
                }}
                className={`relative py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  tab === 'global' ? 'text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'global' && (
                  <motion.div
                    layoutId="leaderboard-tab-pill"
                    className="absolute inset-0 rounded-xl bg-amber-500 shadow-md -z-0"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span className="relative z-10">All-Time Champions 🏆</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setTab('weekly');
                }}
                className={`relative py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  tab === 'weekly' ? 'text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'weekly' && (
                  <motion.div
                    layoutId="leaderboard-tab-pill"
                    className="absolute inset-0 rounded-xl bg-amber-500 shadow-md -z-0"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span className="relative z-10">Weekly Rush ⚡</span>
              </button>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-3 gap-2 mb-3 pt-2">
              {safeList.slice(0, 3).map((entry) => {
                const avatarObj = AVATAR_LIST.find((a) => a.id === entry.avatar) || AVATAR_LIST[0];
                const isRank1 = entry.rank === 1;

                return (
                  <motion.div
                    key={entry.uid}
                    whileHover={{ scale: 1.03 }}
                    className={`p-2.5 rounded-2xl border text-center relative flex flex-col items-center justify-between ${
                      isRank1
                        ? 'bg-yellow-500/15 border-yellow-400 shadow-lg -translate-y-1 ring-1 ring-yellow-400'
                        : entry.rank === 2
                        ? 'bg-slate-800/80 border-slate-400/50'
                        : 'bg-amber-950/30 border-amber-600/40'
                    }`}
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      {isRank1 ? (
                        <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <span
                          className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                            entry.rank === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl mt-2">
                      {avatarObj.emoji}
                    </div>

                    <span className="text-xs font-bold text-white truncate max-w-full mt-1">
                      {entry.name}
                    </span>

                    <span className="text-[10px] font-black text-yellow-400 font-mono">
                      {(entry.coinsEarned ?? 0).toLocaleString()} Won
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Remaining List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  {safeList.slice(3).map((entry) => {
                    const avatarObj = AVATAR_LIST.find((a) => a.id === entry.avatar) || AVATAR_LIST[0];
                    const isUser = entry.uid === user?.uid || entry.isCurrentUser;

                    return (
                      <div
                        key={entry.uid}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isUser
                            ? 'bg-yellow-500/20 border-yellow-400 text-white'
                            : 'bg-slate-800/40 border-slate-700/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-mono font-bold text-slate-500">
                            #{entry.rank}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-sm">
                            {avatarObj.emoji}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{entry.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {entry.wins} Wins • {entry.winRate}% Win Rate
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-yellow-400 font-mono">
                            {(entry.coinsEarned ?? 0).toLocaleString()}
                          </span>
                          <span className="block text-[9px] text-slate-500">Coins</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
