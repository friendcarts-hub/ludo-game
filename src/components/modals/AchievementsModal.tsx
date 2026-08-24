import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Check, Sparkles, Lock } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { soundManager } from '../../game/audio';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { achievements, claimAchievementReward } = useSocial();

  const handleClaim = (id: string) => {
    soundManager.playClaimReward();
    claimAchievementReward(id);
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
            className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-xl font-black text-white">Achievements & Badges</h3>
                  <p className="text-xs text-slate-400">Unlock milestones for trophy rewards and XP</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {achievements.map((ach) => {
                const isUnlocked = ach.isUnlocked;
                const isClaimed = ach.isClaimed;
                const progressPct = Math.min(100, Math.floor((ach.progress / ach.target) * 100));

                return (
                  <motion.div
                    key={ach.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isClaimed
                        ? 'bg-slate-800/30 border-slate-800 opacity-60'
                        : isUnlocked
                        ? 'bg-purple-950/20 border-purple-500/60 shadow-md'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{ach.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-white">{ach.title}</h4>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                ach.tier === 'legendary'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                  : ach.tier === 'gold'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : ach.tier === 'silver'
                                  ? 'bg-slate-500/20 text-slate-300'
                                  : 'bg-amber-800/20 text-amber-600'
                              }`}
                            >
                              {ach.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-yellow-400 block font-mono">
                          +{ach.rewardCoins} Coins
                        </span>
                        <span className="text-[9px] text-purple-400 font-bold">+{ach.xpReward} XP</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {ach.progress}/{ach.target}
                      </span>

                      {isClaimed ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Claimed
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleClaim(ach.id)}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> CLAIM
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
