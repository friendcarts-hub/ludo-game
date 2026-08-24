import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Check, Coins, Sparkles } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { soundManager } from '../../game/audio';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ isOpen, onClose }) => {
  const { missions, claimMissionReward } = useSocial();

  const handleClaim = (id: string) => {
    soundManager.playClaimReward();
    claimMissionReward(id);
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
                <Target className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-xl font-black text-white">Daily Missions & Quests</h3>
                  <p className="text-xs text-slate-400">Complete quests every 24 hours for bonus coins</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Missions List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {missions.map((mission, idx) => {
                const isCompleted = mission.isCompleted;
                const isClaimed = mission.isClaimed;
                const progressPct = Math.min(100, Math.floor((mission.progress / mission.target) * 100));

                return (
                  <motion.div
                    key={`mission-${mission.id || idx}-${idx}`}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isClaimed
                        ? 'bg-slate-800/30 border-slate-800 opacity-60'
                        : isCompleted
                        ? 'bg-amber-500/10 border-yellow-400/60 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{mission.icon}</div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-white">{mission.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{mission.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-yellow-400 font-black text-xs">
                          <Coins className="w-3.5 h-3.5" /> +{mission.rewardCoins}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar and claim button */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {mission.progress}/{mission.target}
                      </span>

                      {isClaimed ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : isCompleted ? (
                        <button
                          onClick={() => handleClaim(mission.id)}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 text-[10px] font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> CLAIM
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">In Progress</span>
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
