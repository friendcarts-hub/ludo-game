import { PlayerColor, Token } from '../types';

export interface GridPos {
  row: number;
  col: number;
}

// 52 Common Path Grid Positions (Clockwise starting from Red Start at index 0)
export const COMMON_TRACK_COORDS: GridPos[] = [
  // 0..4 (Red arm going right)
  { row: 6, col: 1 }, // 0: Red Start (SAFE)
  { row: 6, col: 2 }, // 1
  { row: 6, col: 3 }, // 2
  { row: 6, col: 4 }, // 3
  { row: 6, col: 5 }, // 4

  // 5..10 (Going up towards Green side)
  { row: 5, col: 6 }, // 5
  { row: 4, col: 6 }, // 6
  { row: 3, col: 6 }, // 7
  { row: 2, col: 6 }, // 8 (STAR - SAFE)
  { row: 1, col: 6 }, // 9
  { row: 0, col: 6 }, // 10

  // 11 (Top apex)
  { row: 0, col: 7 }, // 11

  // 12..17 (Going down Green arm)
  { row: 0, col: 8 }, // 12
  { row: 1, col: 8 }, // 13: Green Start (SAFE)
  { row: 2, col: 8 }, // 14
  { row: 3, col: 8 }, // 15
  { row: 4, col: 8 }, // 16
  { row: 5, col: 8 }, // 17

  // 18..23 (Going right towards Yellow side)
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21 (STAR - SAFE)
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23

  // 24 (Right apex)
  { row: 7, col: 14 }, // 24

  // 25..30 (Going left Yellow arm)
  { row: 8, col: 14 }, // 25
  { row: 8, col: 13 }, // 26: Yellow Start (SAFE)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30

  // 31..36 (Going down towards Blue side)
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34 (STAR - SAFE)
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36

  // 37 (Bottom apex)
  { row: 14, col: 7 }, // 37

  // 38..43 (Going up Blue arm)
  { row: 14, col: 6 }, // 38
  { row: 13, col: 6 }, // 39: Blue Start (SAFE)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43

  // 44..49 (Going left towards Red side)
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47 (STAR - SAFE)
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49

  // 50..51 (Left apex & turn)
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 },  // 51
];

// Color start offsets on the 52 common path
export const COLOR_START_INDEX: Record<PlayerColor, number> = {
  blue: 0,
  red: 13,
  green: 26,
  yellow: 39,
};

// Safe indices on common track (0..51)
export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home stretches for each color (steps 51..55, and 56 is the goal)
export const HOME_STRETCH_COORDS: Record<PlayerColor, GridPos[]> = {
  blue: [
    { row: 7, col: 1 }, // step 51
    { row: 7, col: 2 }, // step 52
    { row: 7, col: 3 }, // step 53
    { row: 7, col: 4 }, // step 54
    { row: 7, col: 5 }, // step 55
    { row: 7, col: 6.2 }, // step 56 (Home Goal - Left Triangle)
  ],
  red: [
    { row: 1, col: 7 }, // step 51
    { row: 2, col: 7 }, // step 52
    { row: 3, col: 7 }, // step 53
    { row: 4, col: 7 }, // step 54
    { row: 5, col: 7 }, // step 55
    { row: 6.2, col: 7 }, // step 56 (Home Goal - Top Triangle)
  ],
  green: [
    { row: 7, col: 13 }, // step 51
    { row: 7, col: 12 }, // step 52
    { row: 7, col: 11 }, // step 53
    { row: 7, col: 10 }, // step 54
    { row: 7, col: 9 },  // step 55
    { row: 7, col: 7.8 }, // step 56 (Home Goal - Right Triangle)
  ],
  yellow: [
    { row: 13, col: 7 }, // step 51
    { row: 12, col: 7 }, // step 52
    { row: 11, col: 7 }, // step 53
    { row: 10, col: 7 }, // step 54
    { row: 9, col: 7 },  // step 55
    { row: 7.8, col: 7 }, // step 56 (Home Goal - Bottom Triangle)
  ],
};

// Base 4-Token Slot Coordinates for each color (Exact Quadrant Positions)
export const BASE_TOKEN_COORDS: Record<PlayerColor, GridPos[]> = {
  blue: [
    { row: 1.5, col: 1.5 },
    { row: 1.5, col: 3.5 },
    { row: 3.5, col: 1.5 },
    { row: 3.5, col: 3.5 },
  ],
  red: [
    { row: 1.5, col: 10.5 },
    { row: 1.5, col: 12.5 },
    { row: 3.5, col: 10.5 },
    { row: 3.5, col: 12.5 },
  ],
  yellow: [
    { row: 10.5, col: 1.5 },
    { row: 10.5, col: 3.5 },
    { row: 12.5, col: 1.5 },
    { row: 12.5, col: 3.5 },
  ],
  green: [
    { row: 10.5, col: 10.5 },
    { row: 10.5, col: 12.5 },
    { row: 12.5, col: 10.5 },
    { row: 12.5, col: 12.5 },
  ],
};

/**
 * Converts a player's token step (-1 to 56) to exact board grid (row, col)
 */
export function getTokenGridPos(color: PlayerColor, tokenId: number, step: number): GridPos {
  // In base
  if (step === -1) {
    return BASE_TOKEN_COORDS[color][tokenId] || { row: 0, col: 0 };
  }

  // In home stretch (51 to 56)
  if (step >= 51) {
    const stretchIdx = Math.min(step - 51, 5);
    return HOME_STRETCH_COORDS[color][stretchIdx];
  }

  // On common 52-tile track (0 to 50)
  const commonIdx = (COLOR_START_INDEX[color] + step) % 52;
  return COMMON_TRACK_COORDS[commonIdx];
}

/**
 * Checks if a step corresponds to a safe square
 */
export function isSafeSquare(color: PlayerColor, step: number): boolean {
  if (step === -1) return true; // in base
  if (step >= 51) return true; // in home stretch / goal
  const commonIdx = (COLOR_START_INDEX[color] + step) % 52;
  return SAFE_TRACK_INDICES.has(commonIdx);
}

/**
 * Calculates percentage offset within a 15x15 board container
 */
export function getPercentagePosition(gridPos: GridPos): { top: string; left: string } {
  // Each cell is 100% / 15 = 6.66667%
  const cellPercent = 100 / 15;
  return {
    top: `${(gridPos.row + 0.5) * cellPercent}%`,
    left: `${(gridPos.col + 0.5) * cellPercent}%`,
  };
}

/**
 * Offsets tokens when multiple tokens occupy the exact same cell
 */
export function getStackedTokenOffset(tokenIndexInCell: number, totalTokensInCell: number): { x: number; y: number } {
  if (totalTokensInCell <= 1) return { x: 0, y: 0 };

  const spread = 5; // px offset to keep within cell boundaries
  if (totalTokensInCell === 2) {
    return tokenIndexInCell === 0 ? { x: -spread, y: 0 } : { x: spread, y: 0 };
  }
  if (totalTokensInCell === 3) {
    const angle = (tokenIndexInCell * 120 * Math.PI) / 180;
    return { x: Math.cos(angle) * spread, y: Math.sin(angle) * spread };
  }
  // 4 or more
  const offsets = [
    { x: -spread, y: -spread },
    { x: spread, y: -spread },
    { x: -spread, y: spread },
    { x: spread, y: spread },
  ];
  return offsets[tokenIndexInCell % 4];
}

/**
 * Returns grid positions along a token's walking path
 */
export function getStepGridPositions(color: PlayerColor, startStep: number, dice: number): GridPos[] {
  const positions: GridPos[] = [];
  if (startStep === -1) {
    positions.push(getTokenGridPos(color, 0, 0));
    return positions;
  }
  for (let s = startStep + 1; s <= startStep + dice; s++) {
    positions.push(getTokenGridPos(color, 0, s));
  }
  return positions;
}

/**
 * Identifies directional entry arrows pointing into home paths
 */
export function getEntryArrowDetails(row: number, col: number): { color: PlayerColor; direction: 'right' | 'down' | 'left' | 'up' } | null {
  if (row === 7 && col === 0) return { color: 'blue', direction: 'right' };
  if (row === 0 && col === 7) return { color: 'red', direction: 'down' };
  if (row === 7 && col === 14) return { color: 'green', direction: 'left' };
  if (row === 14 && col === 7) return { color: 'yellow', direction: 'up' };
  return null;
}

