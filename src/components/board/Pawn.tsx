import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { PlayerColor } from '../../types';
import { getPercentagePosition, getStackedTokenOffset, getTokenGridPos } from '../../game/boardLayout';

interface PawnProps {
  tokenId: number;
  color: PlayerColor;
  step: number;
  isMovable: boolean;
  isBase: boolean;
  isHome: boolean;
  indexInCell: number;
  totalInCell: number;
  is3D?: boolean;
  onSelect: (tokenId: number) => void;
  onHoverPath?: (tokenId: number) => void;
  onLeavePath?: () => void;
}

const COLOR_CONFIG: Record<
  PlayerColor,
  {
    primary: string;
    dark: string;
    light: string;
    collarGold: string;
    glow: string;
    badgeBg: string;
  }
> = {
  red: {
    primary: '#ed1c24',
    dark: '#990000',
    light: '#ff7675',
    collarGold: '#ffd700',
    glow: 'rgba(237, 28, 36, 0.85)',
    badgeBg: 'bg-red-600',
  },
  green: {
    primary: '#00a651',
    dark: '#005c2d',
    light: '#55efc4',
    collarGold: '#ffd700',
    glow: 'rgba(0, 166, 81, 0.85)',
    badgeBg: 'bg-emerald-600',
  },
  yellow: {
    primary: '#ffc700',
    dark: '#b38600',
    light: '#ffeaa7',
    collarGold: '#ffffff',
    glow: 'rgba(255, 199, 0, 0.9)',
    badgeBg: 'bg-amber-500',
  },
  blue: {
    primary: '#00aeef',
    dark: '#005f88',
    light: '#74b9ff',
    collarGold: '#ffd700',
    glow: 'rgba(0, 174, 239, 0.85)',
    badgeBg: 'bg-blue-600',
  },
};

export const Pawn: React.FC<PawnProps> = ({
  tokenId,
  color,
  step,
  isMovable,
  isBase,
  isHome,
  indexInCell,
  totalInCell,
  onSelect,
  onHoverPath,
  onLeavePath,
}) => {
  const gridPos = getTokenGridPos(color, tokenId, step);
  const { top, left } = getPercentagePosition(gridPos);
  const offset = getStackedTokenOffset(indexInCell, totalInCell);
  const conf = COLOR_CONFIG[color];

  // Track step changes to trigger snappy jump hop physics on each tile movement
  const prevStepRef = useRef(step);
  const [hopCount, setHopCount] = useState(0);

  useEffect(() => {
    if (prevStepRef.current !== step && step >= 0) {
      setHopCount((c) => c + 1);
    }
    prevStepRef.current = step;
  }, [step]);

  // Scale down when multiple pawns share the same cell so they fit cleanly inside the square
  const pawnScale =
    totalInCell === 1 ? 1 : totalInCell === 2 ? 0.82 : totalInCell === 3 ? 0.74 : 0.66;

  return (
    <motion.div
      id={`pawn-${color}-${tokenId}`}
      layout={false}
      initial={false}
      animate={{
        top,
        left,
      }}
      transition={{
        top: {
          duration: 0.17,
          ease: [0.22, 1, 0.36, 1],
        },
        left: {
          duration: 0.17,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      className={`absolute z-20 cursor-pointer pointer-events-auto select-none touch-manipulation flex items-center justify-center ${
        isMovable ? 'z-30' : ''
      }`}
      style={{
        top,
        left,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-74% + ${offset.y}px)) scale(${pawnScale})`,
        transformOrigin: '50% 85%',
      }}
      onMouseEnter={() => {
        if (isMovable && onHoverPath) onHoverPath(tokenId);
      }}
      onMouseLeave={() => {
        if (onLeavePath) onLeavePath();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isMovable) {
          onSelect(tokenId);
        }
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Ground Contact Shadow (Planted directly in center of cell / base socket) */}
        <motion.div
          key={`shadow-${hopCount}`}
          animate={
            hopCount > 0
              ? {
                  scale: [1, 0.55, 1],
                  opacity: [0.55, 0.2, 0.55],
                }
              : { scale: 1, opacity: 0.55 }
          }
          transition={hopCount > 0 ? { duration: 0.17, ease: 'easeInOut' } : { duration: 0.2 }}
          className="absolute -bottom-0.5 w-6 h-2.5 sm:w-6.5 sm:h-3 rounded-full bg-black/60 blur-[1px] pointer-events-none"
        />

        {/* Movable Floating Arrow Indicator */}
        {isMovable && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: [-4, -10, -4] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
            className="absolute -top-7 sm:-top-8 z-40 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 fill-yellow-400 stroke-[3]" />
          </motion.div>
        )}

        {/* Pulsing Active Move Halo */}
        {isMovable && (
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.2, 0.9] }}
            transition={{ repeat: Infinity, duration: 0.95 }}
            className="absolute -inset-1.5 rounded-full border-2 border-yellow-300 pointer-events-none"
            style={{
              boxShadow: `0 0 14px ${conf.glow}`,
            }}
          />
        )}

        {/* Authentic Ludo King Style Pawn Body with Hop Physics */}
        <motion.div
          key={`body-hop-${hopCount}`}
          whileHover={isMovable ? { scale: 1.18, y: -3 } : { scale: 1.05 }}
          whileTap={isMovable ? { scale: 0.92 } : {}}
          animate={
            hopCount > 0
              ? {
                  y: [0, -13, 0],
                  scaleY: [0.92, 1.08, 0.95, 1],
                }
              : isMovable
              ? {
                  y: [0, -3.5, 0],
                }
              : { y: 0 }
          }
          transition={
            hopCount > 0
              ? { duration: 0.17, ease: 'easeInOut' }
              : isMovable
              ? { repeat: Infinity, duration: 1.0, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
          className="relative w-6 h-7.5 sm:w-7 sm:h-8.5 md:w-8 md:h-9 flex items-center justify-center"
          style={{
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.45))',
          }}
        >
          <svg
            viewBox="0 0 32 40"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Radial gradient for the top sphere */}
              <radialGradient id={`sphere-grad-${color}-${tokenId}`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="25%" stopColor={conf.light} />
                <stop offset="65%" stopColor={conf.primary} />
                <stop offset="100%" stopColor={conf.dark} />
              </radialGradient>

              {/* Linear gradient for the flared cone body */}
              <linearGradient id={`cone-grad-${color}-${tokenId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={conf.light} />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="50%" stopColor={conf.primary} />
                <stop offset="85%" stopColor={conf.dark} />
                <stop offset="100%" stopColor="#1e1e1e" />
              </linearGradient>

              {/* Base ring gradient */}
              <linearGradient id={`base-grad-${color}-${tokenId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="40%" stopColor={conf.primary} />
                <stop offset="100%" stopColor={conf.dark} />
              </linearGradient>
            </defs>

            {/* 1. Base Ellipse Ring (Firmly sitting on the cell) */}
            <ellipse
              cx="16"
              cy="35"
              rx="12.5"
              ry="3.8"
              fill={`url(#base-grad-${color}-${tokenId})`}
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* Base top rim highlight */}
            <ellipse
              cx="16"
              cy="34"
              rx="11"
              ry="2.8"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.7"
            />

            {/* 2. Flared Conical Trunk / Body */}
            <path
              d="M10 18 C10 26, 4.5 32, 4.5 34.5 C4.5 36, 27.5 36, 27.5 34.5 C27.5 32, 22 26, 22 18 Z"
              fill={`url(#cone-grad-${color}-${tokenId})`}
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* Trunk specular highlight line */}
            <path
              d="M13 20 C13 25, 8 31, 8 33.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* 3. Golden Collar Ring Accent */}
            <ellipse
              cx="16"
              cy="17"
              rx="6.5"
              ry="2"
              fill="#ffd700"
              stroke="#b38600"
              strokeWidth="0.6"
            />

            {/* 4. Glossy Spherical Top Head */}
            <circle
              cx="16"
              cy="9.5"
              r="7.5"
              fill={`url(#sphere-grad-${color}-${tokenId})`}
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* Top-Left Crisp Specular Glint */}
            <ellipse
              cx="13.5"
              cy="7"
              rx="2.6"
              ry="1.5"
              fill="#ffffff"
              opacity="0.9"
              transform="rotate(-30 13.5 7)"
            />

            {/* Winner Crown when token reaches goal */}
            {isHome && (
              <text
                x="16"
                y="13"
                fontSize="10"
                textAnchor="middle"
                className="select-none pointer-events-none"
              >
                👑
              </text>
            )}
          </svg>

          {/* Stack Count Badge when multiple pawns share the exact same cell */}
          {totalInCell > 1 && indexInCell === 0 && (
            <div
              className={`absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full ${conf.badgeBg} border-2 border-white text-white text-[9px] font-black flex items-center justify-center shadow-md z-30`}
            >
              {totalInCell}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};


