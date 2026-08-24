import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tv, Coins, Sparkles, ExternalLink, Gamepad2, Play } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { soundManager } from '../../game/audio';
import { adsterraService } from '../../services/adsterraService';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted?: () => void;
  title?: string;
  rewardType?: 'coins' | 'free_match';
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardGranted,
  title,
  rewardType = 'coins',
}) => {
  const { settings, creditCoins } = useWallet();
  const [secondsRemaining, setSecondsRemaining] = useState(6);
  const [isCompleted, setIsCompleted] = useState(false);

  const adRewardCoins = settings.adsterraAdWatchReward || 250;
  const isAdsterraEnabled = settings.adsterraEnabled ?? true;
  const directLink = settings.adsterraDirectLink || 'https://www.profitablecpmrate.com/y3e2t8h45j?key=adsterra_ludoverse_direct';

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(6);
      setIsCompleted(false);
      return;
    }

    setSecondsRemaining(6);
    setIsCompleted(false);

    let count = 6;
    const interval = setInterval(() => {
      count -= 1;
      setSecondsRemaining(count);
      if (count <= 0) {
        clearInterval(interval);
        setIsCompleted(true);
        soundManager.playClaimReward();

        if (rewardType === 'coins') {
          creditCoins(adRewardCoins, 'adsterra_reward', 'Adsterra Sponsored Video Ad Reward');
        }

        if (onRewardGranted) {
          onRewardGranted();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, creditCoins, adRewardCoins, onRewardGranted, rewardType]);

  const handleOpenAdsterraLink = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Header info */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Tv className="w-3 h-3 text-purple-400" /> Adsterra Ads Partner
                </span>
              </div>
              {isCompleted && (
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ad Video Simulator Screen */}
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border border-purple-500/40 flex flex-col items-center justify-center relative overflow-hidden shadow-inner p-4 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 mb-2 shadow-lg animate-pulse">
                {rewardType === 'free_match' ? (
                  <Gamepad2 className="w-8 h-8 text-cyan-400" />
                ) : (
                  <Tv className="w-8 h-8 text-purple-400" />
                )}
              </div>

              <h4 className="text-base font-black text-white">
                {title || (rewardType === 'free_match' ? 'Unlocking Free Match Entry' : 'Adsterra Sponsor Arena')}
              </h4>
              <p className="text-xs text-purple-300 mt-1">
                {isCompleted
                  ? (rewardType === 'free_match' ? 'Free Match Entry Unlocked!' : 'Reward Unlocked!')
                  : `Watching sponsor ad... ${secondsRemaining}s remaining`}
              </p>

              {/* Visit Adsterra Link Button */}
              {isAdsterraEnabled && (
                <button
                  onClick={handleOpenAdsterraLink}
                  className="mt-2.5 px-3 py-1 rounded-xl bg-purple-600/60 hover:bg-purple-600 text-white text-[11px] font-bold border border-purple-400/40 flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <span>Explore Sponsor Offer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${((6 - secondsRemaining) / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Outcome Details */}
            <div className="mt-5 w-full">
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-3"
                  >
                    {rewardType === 'free_match' ? (
                      <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-black text-sm flex items-center justify-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-cyan-400" />
                        <span>Free Match Pass Granted! Ready to Play!</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-sm flex items-center justify-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <span>+{adRewardCoins} Coins Added to Wallet!</span>
                      </div>
                    )}

                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {rewardType === 'free_match' ? (
                        <>
                          <Play className="w-4 h-4 fill-slate-950" />
                          <span>START FREE MATCH NOW 🎲</span>
                        </>
                      ) : (
                        <span>COLLECT COINS & CLOSE 🎁</span>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      {rewardType === 'free_match'
                        ? `Please wait ${secondsRemaining}s to unlock your free match pass`
                        : `Please wait ${secondsRemaining}s to receive your ${adRewardCoins} Coins`}
                    </p>
                    <p className="text-[10px] text-slate-500">Sponsored by Adsterra High-CPM Network</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
