import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { soundManager, useSoundManager } from '../../game/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  is3DView: boolean;
  onToggle3D: () => void;
  tiltDegree: number;
  onChangeTilt: (deg: number) => void;
  onRestartGame?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  is3DView,
  onToggle3D,
  tiltDegree,
  onChangeTilt,
  onRestartGame,
}) => {
  const { isMuted, volume, toggleMute, setVolume } = useSoundManager();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Game Settings</h3>
                <p className="text-[11px] text-slate-400">Audio, Graphics & Board Controls</p>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sound Controls */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-bold text-slate-200">Sound Effects</span>
              </div>
              <button
                onClick={() => {
                  toggleMute();
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isMuted
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isMuted ? 'MUTED' : 'ACTIVE'}
              </button>
            </div>

            {/* Volume Slider */}
            {!isMuted && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[10px] text-slate-400 font-mono">VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-cyan-300 font-mono w-7 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* 3D / 2D Perspective Controls */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Board Perspective</span>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onToggle3D();
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  is3DView
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {is3DView ? '3D ARENA' : '2D CLASSIC'}
              </button>
            </div>

            {/* 3D Tilt Slider */}
            {is3DView && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-slate-400 font-mono">TILT</span>
                <input
                  type="range"
                  min="12"
                  max="40"
                  step="2"
                  value={tiltDegree}
                  onChange={(e) => onChangeTilt(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-amber-300 font-mono w-7 text-right">
                  {tiltDegree}°
                </span>
              </div>
            )}
          </div>

          {/* Quick Rules & Help Highlights */}
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200/90 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Official Rules Quick Guide</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px] leading-relaxed">
              <li>Roll a 6 to deploy a token from your corner yard.</li>
              <li>Safe squares (⭐ and color starts) protect tokens from capture.</li>
              <li>Capturing an opponent or reaching Home gives an EXTRA roll!</li>
              <li>Rolling three consecutive 6s skips your turn.</li>
            </ul>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {onRestartGame && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onRestartGame();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer mr-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            )}
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DONE</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
