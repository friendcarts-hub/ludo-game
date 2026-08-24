import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { PlayerColor } from '../../types';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  color: PlayerColor;
  size?: 'sm' | 'md' | 'lg';
  onRoll?: () => void;
  showTimerRing?: boolean;
  turnTimer?: number;
  maxTurnTimer?: number;
}

const COLOR_THEMES: Record<
  PlayerColor,
  {
    glow: string;
    border: string;
    rollText: string;
    pipColor: string;
    sixColor: string;
  }
> = {
  red: {
    glow: 'rgba(237, 28, 36, 0.7)',
    border: '#ed1c24',
    rollText: '#ed1c24',
    pipColor: '#0f172a',
    sixColor: '#ed1c24',
  },
  green: {
    glow: 'rgba(0, 166, 81, 0.7)',
    border: '#00a651',
    rollText: '#00a651',
    pipColor: '#0f172a',
    sixColor: '#00a651',
  },
  yellow: {
    glow: 'rgba(255, 199, 0, 0.8)',
    border: '#ffc700',
    rollText: '#b38600',
    pipColor: '#0f172a',
    sixColor: '#e5a500',
  },
  blue: {
    glow: 'rgba(0, 174, 239, 0.7)',
    border: '#00aeef',
    rollText: '#00aeef',
    pipColor: '#0f172a',
    sixColor: '#00aeef',
  },
};

// 3D rotations for landing each face squarely in front
const FACE_ROTATIONS: Record<number, { rotateX: number; rotateY: number; rotateZ: number }> = {
  1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
  2: { rotateX: -90, rotateY: 0, rotateZ: 0 },
  3: { rotateX: 0, rotateY: -90, rotateZ: 0 },
  4: { rotateX: 0, rotateY: 90, rotateZ: 0 },
  5: { rotateX: 90, rotateY: 0, rotateZ: 0 },
  6: { rotateX: 180, rotateY: 0, rotateZ: 0 },
};

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  color,
  size = 'md',
  onRoll,
  showTimerRing = false,
  turnTimer = 15,
  maxTurnTimer = 15,
}) => {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.red;
  const [displayNumber, setDisplayNumber] = useState<number>(value || 1);

  // During rolling, cycle through random faces rapidly for rich 3D visuals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 6) + 1);
      }, 55);
    } else if (value) {
      setDisplayNumber(value);
    }
    return () => clearInterval(interval);
  }, [isRolling, value]);

  // Dice dimensions based on size variant
  const cubeSize = size === 'lg' ? 56 : size === 'md' ? 44 : 36;
  const halfCube = cubeSize / 2;

  // Render authentic realistic dice pips for any face
  const renderPips = (faceVal: number) => {
    const isRedFace = faceVal === 1 || faceVal === 6;
    const dotColor = isRedFace ? theme.sixColor : '#1e293b';

    switch (faceVal) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-inner ring-1 ring-black/20"
              style={{
                background: `radial-gradient(circle at 35% 35%, #ff7675, ${theme.sixColor} 60%, #800000 100%)`,
              }}
            />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-1 sm:p-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30 self-start" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30 self-end" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-1 sm:p-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30 self-start" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30 self-center" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30 self-end" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-1 sm:gap-1.5 p-1 sm:p-1.5 place-items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-1 sm:p-1.5">
            <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm ring-1 ring-black/30" />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-0.5 sm:gap-1 p-1 sm:p-1.5 place-items-center">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm ring-1 ring-black/20"
                style={{
                  background: `radial-gradient(circle at 35% 35%, #ff7675, ${theme.sixColor} 60%, #800000 100%)`,
                }}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const targetRotation = value ? FACE_ROTATIONS[value] : FACE_ROTATIONS[1];
  const timerPercentage = Math.max(0, Math.min(100, (turnTimer / maxTurnTimer) * 100));

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: cubeSize + 16,
        height: cubeSize + 16,
        perspective: '600px',
      }}
      onClick={() => {
        if (canRoll && onRoll && !isRolling) {
          onRoll();
        }
      }}
    >
      {/* Optional Circular Turn Timer Progress Ring */}
      {showTimerRing && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-slate-800/40"
            strokeWidth="3.5"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={turnTimer <= 4 ? '#ef4444' : '#ffcc00'}
            strokeWidth="3.5"
            strokeDasharray={276}
            strokeDashoffset={276 - (276 * timerPercentage) / 100}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-300 ease-linear"
          />
        </svg>
      )}

      {/* Realistic 3D Ground Drop Shadow */}
      <motion.div
        animate={
          isRolling
            ? {
                scale: [0.75, 1.15, 0.7, 1],
                opacity: [0.4, 0.8, 0.35, 0.7],
              }
            : { scale: 1, opacity: 0.6 }
        }
        transition={isRolling ? { repeat: Infinity, duration: 0.4 } : { duration: 0.2 }}
        className="absolute -bottom-1 w-[80%] h-3.5 bg-black/40 rounded-full blur-[3px] pointer-events-none"
      />

      {/* 3D CUBE CONTAINER */}
      <motion.div
        animate={
          isRolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, -360, -720, -1080],
                rotateZ: [0, 90, 180, 360],
                y: [0, -16, 4, -10, 0],
                scale: [1, 1.18, 0.96, 1.08, 1],
              }
            : {
                rotateX: targetRotation.rotateX,
                rotateY: targetRotation.rotateY,
                rotateZ: targetRotation.rotateZ,
                y: 0,
                scale: 1,
              }
        }
        transition={
          isRolling
            ? {
                duration: 0.5,
                repeat: Infinity,
                ease: 'linear',
              }
            : {
                type: 'spring',
                damping: 14,
                stiffness: 260,
                mass: 0.6,
              }
        }
        whileHover={canRoll ? { scale: 1.08, y: -3 } : {}}
        whileTap={canRoll ? { scale: 0.94 } : {}}
        className={`relative rounded-xl flex items-center justify-center ${
          canRoll ? 'cursor-pointer' : ''
        }`}
        style={{
          width: cubeSize,
          height: cubeSize,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* FACE 1: FRONT */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `translateZ(${halfCube}px)` }}
        >
          {renderPips(isRolling ? displayNumber : 1)}
        </div>

        {/* FACE 6: BACK */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `rotateY(180deg) translateZ(${halfCube}px)` }}
        >
          {renderPips(6)}
        </div>

        {/* FACE 3: RIGHT */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `rotateY(90deg) translateZ(${halfCube}px)` }}
        >
          {renderPips(3)}
        </div>

        {/* FACE 4: LEFT */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `rotateY(-90deg) translateZ(${halfCube}px)` }}
        >
          {renderPips(4)}
        </div>

        {/* FACE 2: TOP */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `rotateX(90deg) translateZ(${halfCube}px)` }}
        >
          {renderPips(2)}
        </div>

        {/* FACE 5: BOTTOM */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-[1.5px] border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
          style={{ transform: `rotateX(-90deg) translateZ(${halfCube}px)` }}
        >
          {renderPips(5)}
        </div>
      </motion.div>

      {/* Sparkles Particle burst when rolled a 6 */}
      {!isRolling && value === 6 && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -top-3 -right-3 pointer-events-none text-yellow-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
        >
          <Sparkles className="w-5 h-5 fill-yellow-400 stroke-yellow-500" />
        </motion.div>
      )}
    </div>
  );
};
