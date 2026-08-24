import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Coins } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { LUCKY_SPIN_REWARDS } from '../../data/initialData';
import { soundManager } from '../../game/audio';

interface LuckySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckySpinModal: React.FC<LuckySpinModalProps> = ({ isOpen, onClose }) => {
  const { isLuckySpinAvailable, claimLuckySpin } = useWallet();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonReward, setWonReward] = useState<number | null>(null);

  const handleSpin = () => {
    if (isSpinning || !isLuckySpinAvailable) return;

    soundManager.playClick();
    setIsSpinning(true);
    setWonReward(null);

    // Play ticking ratchet sound intervals with deceleration
    const tickIntervals = [80, 80, 90, 100, 120, 150, 180, 220, 280, 360, 460, 580];
    let tickAccumulator = 0;
    tickIntervals.forEach((interval) => {
      tickAccumulator += interval;
      setTimeout(() => {
        soundManager.playWheelTick();
      }, tickAccumulator);
    });

    // Pick random slice index (0 to 7)
    const randomIndex = Math.floor(Math.random() * LUCKY_SPIN_REWARDS.length);
    const selectedReward = LUCKY_SPIN_REWARDS[randomIndex];

    // Calculate rotation to land on slice
    const sliceAngle = 360 / LUCKY_SPIN_REWARDS.length;
    // 5 full rotations (1800 deg) + target angle
    const targetAngle = 1800 + (360 - randomIndex * sliceAngle - sliceAngle / 2);

    setRotationDegree((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonReward(selectedReward.coins);
      soundManager.playClaimReward();
      claimLuckySpin(selectedReward.coins);
    }, 3800);
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
            className="w-full max-w-md bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-black text-white">Lucky Fortune Wheel</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fortune Wheel Canvas / SVG */}
            <div className="relative my-6 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Top Indicator Needle */}
              <div className="absolute -top-3 z-30 transform -translate-x-1/2 left-1/2">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />
              </div>

              {/* Outer Chrome Bezel */}
              <div className="absolute inset-0 rounded-full border-8 border-amber-500/80 shadow-[0_0_40px_rgba(234,179,8,0.5)] pointer-events-none z-20" />

              {/* Animated Rotating Wheel */}
              <div
                id="wheel-rotor"
                className="w-full h-full rounded-full overflow-hidden relative shadow-inner transition-transform duration-[3800ms] ease-out"
                style={{ transform: `rotate(${rotationDegree}deg)` }}
              >
                {LUCKY_SPIN_REWARDS.map((slice, index) => {
                  const angle = (360 / LUCKY_SPIN_REWARDS.length) * index;
                  return (
                    <div
                      key={`spin-slice-${slice.coins}-${index}`}
                      className="absolute top-0 left-0 w-full h-full origin-center"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div
                        className={`w-full h-1/2 origin-bottom ${slice.color} flex flex-col items-center pt-3 select-none`}
                        style={{
                          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                        }}
                      >
                        <span className="text-sm font-black text-white drop-shadow-md">
                          {slice.coins}
                        </span>
                        <span className="text-[10px] text-yellow-300 font-bold">COINS</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Center Spin Hub / Button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning || !isLuckySpinAvailable}
                className={`absolute z-30 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-4 border-slate-950 shadow-xl flex items-center justify-center font-black text-xs text-slate-950 transition-all cursor-pointer ${
                  !isLuckySpinAvailable || isSpinning
                    ? 'opacity-80 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95 animate-pulse'
                }`}
              >
                {isSpinning ? '...' : 'SPIN!'}
              </button>
            </div>

            {/* Won Banner or Status */}
            <AnimatePresence mode="wait">
              {wonReward !== null ? (
                <motion.div
                  key="won"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="p-3 rounded-2xl bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-black text-sm flex items-center gap-2"
                >
                  <Coins className="w-5 h-5" />
                  <span>You won +{wonReward.toLocaleString()} Coins!</span>
                </motion.div>
              ) : (
                <p className="text-xs text-slate-400">
                  {isLuckySpinAvailable
                    ? '✨ Tap SPIN for your free daily reward!'
                    : '⏰ Free spin used for today. Next spin resets tomorrow!'}
                </p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
