import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, Sparkles, Flame } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { DAILY_BONUS_SCHEDULE } from '../../data/initialData';
import { soundManager } from '../../game/audio';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, onClose }) => {
  const { dailyBonusStreak, isDailyBonusAvailable, claimDailyBonus } = useWallet();

  const handleClaim = (day: number) => {
    soundManager.playClaimReward();
    claimDailyBonus(day);
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
            className="w-full max-w-lg bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col relative overflow-hidden"
          >
            {/* Ambient top glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-xl font-black text-white">Daily Login Rewards</h3>
                  <p className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-yellow-400" /> Current Streak: Day {dailyBonusStreak}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="py-4 grid grid-cols-4 gap-2.5">
              {DAILY_BONUS_SCHEDULE.map((item, idx) => {
                const isCompleted = item.day < dailyBonusStreak;
                const isCurrentToday = item.day === dailyBonusStreak;
                const canClaim = isCurrentToday && isDailyBonusAvailable;
                const isMegaDay = item.day === 7;

                return (
                  <motion.div
                    key={`daily-bonus-${item.day}-${idx}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center relative transition-all ${
                      isMegaDay ? 'col-span-2 bg-gradient-to-br from-yellow-500/20 via-amber-600/20 to-slate-950 border-yellow-400 shadow-lg' : ''
                    } ${
                      isCompleted
                        ? 'bg-slate-800/40 border-emerald-500/40 text-emerald-400'
                        : canClaim
                        ? 'bg-amber-500/20 border-yellow-400 text-yellow-300 ring-2 ring-yellow-400/50 shadow-md animate-pulse'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block mb-1">
                      Day {item.day}
                    </span>

                    <div className="text-2xl sm:text-3xl my-1">{item.icon}</div>

                    <span className="text-xs font-black text-white block font-mono">
                      +{item.coins.toLocaleString()}
                    </span>

                    {isCompleted ? (
                      <div className="mt-1.5 w-full py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center gap-0.5">
                        <Check className="w-3 h-3" /> Claimed
                      </div>
                    ) : canClaim ? (
                      <button
                        onClick={() => handleClaim(item.day)}
                        className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 text-[10px] font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> CLAIM
                      </button>
                    ) : (
                      <span className="mt-1.5 text-[10px] text-slate-500 font-bold block">Locked</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Claim status info */}
            <div className="pt-2 text-center text-xs text-slate-400">
              {isDailyBonusAvailable
                ? '🎁 Your reward for today is ready to claim!'
                : '⏰ Come back tomorrow to continue your streak and unlock the Day 7 Mega Chest!'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
