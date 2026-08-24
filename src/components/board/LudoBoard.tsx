import React, { useState } from 'react';
import { Star, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { GameState, PlayerColor } from '../../types';
import { Pawn } from './Pawn';
import { findTokensAtSameSquare } from '../../game/ludoRules';
import { getTokenGridPos, getEntryArrowDetails } from '../../game/boardLayout';

interface LudoBoardProps {
  gameState: GameState;
  onSelectToken: (tokenId: number) => void;
  is3D?: boolean;
  viewTilt?: number;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  onSelectToken,
  is3D = true,
  viewTilt = 0,
}) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Helper to map 15x15 grid cell type
  const getCellDetails = (row: number, col: number) => {
    // 1. Blue Base (top-left 0..5, 0..5)
    if (row < 6 && col < 6) return { type: 'blue-base' };
    // 2. Red Base (top-right 0..5, 9..14)
    if (row < 6 && col > 8) return { type: 'red-base' };
    // 3. Yellow Base (bottom-left 9..14, 0..5)
    if (row > 8 && col < 6) return { type: 'yellow-base' };
    // 4. Green Base (bottom-right 9..14, 9..14)
    if (row > 8 && col > 8) return { type: 'green-base' };
    // 5. Center Triangle Area (6..8, 6..8)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return { type: 'center-goal' };

    // 6. Entry Directional Arrows
    const entryArrow = getEntryArrowDetails(row, col);
    if (entryArrow) {
      return { type: 'entry-arrow', color: entryArrow.color, direction: entryArrow.direction };
    }

    // 7. Home stretch columns matching standard board & reference
    if (row === 7 && col >= 1 && col <= 5) return { type: 'home-path', color: 'blue' as PlayerColor };
    if (col === 7 && row >= 1 && row <= 5) return { type: 'home-path', color: 'red' as PlayerColor };
    if (row === 7 && col >= 9 && col <= 13) return { type: 'home-path', color: 'green' as PlayerColor };
    if (col === 7 && row >= 9 && row <= 13) return { type: 'home-path', color: 'yellow' as PlayerColor };

    // 8. Starting safe squares with color
    if (row === 6 && col === 1) return { type: 'start-tile', color: 'blue' as PlayerColor, star: true };
    if (row === 1 && col === 8) return { type: 'start-tile', color: 'red' as PlayerColor, star: true };
    if (row === 8 && col === 13) return { type: 'start-tile', color: 'green' as PlayerColor, star: true };
    if (row === 13 && col === 6) return { type: 'start-tile', color: 'yellow' as PlayerColor, star: true };

    // 9. Safe star squares (Star outline icon)
    if (row === 2 && col === 6) return { type: 'star-tile', star: true };
    if (row === 6 && col === 12) return { type: 'star-tile', star: true };
    if (row === 12 && col === 8) return { type: 'star-tile', star: true };
    if (row === 8 && col === 2) return { type: 'star-tile', star: true };

    // 10. Standard track tile
    return { type: 'normal-track' };
  };

  const bluePlayer = gameState.players.find((p) => p.color === 'blue');
  const redPlayer = gameState.players.find((p) => p.color === 'red');
  const yellowPlayer = gameState.players.find((p) => p.color === 'yellow');
  const greenPlayer = gameState.players.find((p) => p.color === 'green');

  // Group tokens by their (color, step) to calculate multi-token stacking
  const tokensOnBoard = gameState.players.flatMap((player) =>
    player.tokens.map((token) => {
      const isMovable =
        player.color === activePlayer?.color &&
        gameState.diceRolled &&
        !gameState.isAnimatingMove &&
        gameState.movableTokens.includes(token.id);

      // Find other tokens at same position
      const sameSquareTokens = findTokensAtSameSquare(gameState.players, token.color, token.step);
      const isStacked = sameSquareTokens.length > 1;
      const indexInCell = sameSquareTokens.findIndex(
        (s) => s.token.id === token.id && s.token.color === token.color
      );

      return {
        ...token,
        isMovable,
        indexInCell: indexInCell >= 0 ? indexInCell : 0,
        totalInCell: isStacked ? sameSquareTokens.length : 1,
      };
    })
  );

  return (
    <div
      className="relative flex items-center justify-center w-full"
      style={{
        perspective: is3D && viewTilt > 0 ? '1100px' : 'none',
        perspectiveOrigin: '50% 60%',
      }}
    >
      <div
        id="ludo-board-wrapper"
        className={`relative w-full max-w-[min(98vw,min(76vh,520px))] xs:max-w-[min(98vw,min(78vh,550px))] sm:max-w-[560px] md:max-w-[600px] lg:max-w-[640px] aspect-square rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 select-none transition-transform duration-500 ease-out bg-[#0c2452] border-2 sm:border-[3px] border-[#ffcc00] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(255,204,0,0.35)]`}
        style={{
          transform: is3D && viewTilt > 0 ? `rotateX(${viewTilt}deg) scale(0.98)` : 'none',
          transformStyle: is3D && viewTilt > 0 ? 'preserve-3d' : 'flat',
        }}
      >
        {/* 15x15 Main Board Surface */}
        <div
          className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden grid grid-cols-15 grid-rows-15 border-2 border-slate-900 bg-white shadow-2xl"
        >
          {/* Render 15x15 Grid Cells */}
          {Array.from({ length: 225 }).map((_, index) => {
            const row = Math.floor(index / 15);
            const col = index % 15;
            const cell = getCellDetails(row, col);

            // Hide individual cells for base containers and center
            if (
              (row < 6 && col < 6) ||
              (row < 6 && col > 8) ||
              (row > 8 && col < 6) ||
              (row > 8 && col > 8) ||
              (row >= 6 && row <= 8 && col >= 6 && col <= 8)
            ) {
              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="w-full h-full bg-transparent"
                />
              );
            }

            // Entry Directional Arrow Tile
            if (cell.type === 'entry-arrow') {
              const arrowColor =
                cell.color === 'red'
                  ? '#ed1c24'
                  : cell.color === 'green'
                  ? '#00a651'
                  : cell.color === 'yellow'
                  ? '#e5b000'
                  : '#00aeef';

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="w-full h-full border border-slate-300 bg-white flex items-center justify-center relative"
                >
                  {cell.direction === 'right' && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" style={{ color: arrowColor }} />}
                  {cell.direction === 'down' && <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" style={{ color: arrowColor }} />}
                  {cell.direction === 'left' && <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" style={{ color: arrowColor }} />}
                  {cell.direction === 'up' && <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" style={{ color: arrowColor }} />}
                </div>
              );
            }

            // Home Stretch Path Tile
            if (cell.type === 'home-path') {
              const bgColor =
                cell.color === 'red'
                  ? '#ed1c24'
                  : cell.color === 'green'
                  ? '#00a651'
                  : cell.color === 'yellow'
                  ? '#ffc700'
                  : '#00aeef';

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="w-full h-full border border-slate-400 flex items-center justify-center relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
                  style={{ backgroundColor: bgColor }}
                />
              );
            }

            // Start Safe Tile with Color & Star
            if (cell.type === 'start-tile') {
              const bgColor =
                cell.color === 'red'
                  ? '#ed1c24'
                  : cell.color === 'green'
                  ? '#00a651'
                  : cell.color === 'yellow'
                  ? '#ffc700'
                  : '#00aeef';

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="w-full h-full border border-slate-400 flex items-center justify-center relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
                  style={{ backgroundColor: bgColor }}
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                </div>
              );
            }

            // Star Safe Tile (Clean Outline Star like Reference Image)
            if (cell.type === 'star-tile') {
              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="w-full h-full border border-slate-300 flex items-center justify-center relative bg-[#fafafa] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 stroke-[2] fill-slate-200/80" />
                </div>
              );
            }

            // Standard Track Tile
            return (
              <div
                key={`cell-${row}-${col}`}
                className="w-full h-full border border-slate-300 flex items-center justify-center bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
            );
          })}

          {/* 1. BLUE BASE CONTAINER (Top-Left 0..5, 0..5) */}
          <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#00aeef] border-r-2 border-b-2 border-slate-900 p-1 flex flex-col items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-white tracking-wide truncate w-full text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-0.5">
              {bluePlayer?.name || 'Blue'}
            </span>
            {/* Exactly centered 2x2 token holder matching coordinates row 1.5, 3.5, col 1.5, 3.5 */}
            <div className="absolute top-[16.667%] left-[16.667%] w-[66.667%] h-[66.667%] rounded-2xl bg-white border-2 border-slate-400 p-1.5 grid grid-cols-2 grid-rows-2 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((slotIdx) => (
                <div
                  key={`blue-slot-${slotIdx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#00aeef] border-2 border-[#1a567c] flex items-center justify-center shadow-sm"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#005f88] opacity-50" />
                </div>
              ))}
            </div>
          </div>

          {/* 2. RED BASE CONTAINER (Top-Right 0..5, 9..14) */}
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#ed1c24] border-l-2 border-b-2 border-slate-900 p-1 flex flex-col items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-white tracking-wide truncate w-full text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-0.5">
              {redPlayer?.name || 'Red'}
            </span>
            {/* Exactly centered 2x2 token holder matching coordinates row 1.5, 3.5, col 10.5, 12.5 */}
            <div className="absolute top-[16.667%] left-[16.667%] w-[66.667%] h-[66.667%] rounded-2xl bg-white border-2 border-slate-400 p-1.5 grid grid-cols-2 grid-rows-2 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((slotIdx) => (
                <div
                  key={`red-slot-${slotIdx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#ed1c24] border-2 border-[#8b1e1e] flex items-center justify-center shadow-sm"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#990000] opacity-50" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. YELLOW BASE CONTAINER (Bottom-Left 9..14, 0..5) */}
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#ffc700] border-r-2 border-t-2 border-slate-900 p-1 flex flex-col items-center justify-between">
            {/* Exactly centered 2x2 token holder matching coordinates row 10.5, 12.5, col 1.5, 3.5 */}
            <div className="absolute top-[16.667%] left-[16.667%] w-[66.667%] h-[66.667%] rounded-2xl bg-white border-2 border-slate-400 p-1.5 grid grid-cols-2 grid-rows-2 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((slotIdx) => (
                <div
                  key={`yellow-slot-${slotIdx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#ffc700] border-2 border-[#946c00] flex items-center justify-center shadow-sm"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#b38600] opacity-50" />
                </div>
              ))}
            </div>
            <span className="text-[11px] sm:text-xs font-black text-slate-950 tracking-wide truncate w-full text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] pb-0.5 mt-auto">
              {yellowPlayer?.name || 'Yellow'}
            </span>
          </div>

          {/* 4. GREEN BASE CONTAINER (Bottom-Right 9..14, 9..14) */}
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#00a651] border-l-2 border-t-2 border-slate-900 p-1 flex flex-col items-center justify-between">
            {/* Exactly centered 2x2 token holder matching coordinates row 10.5, 12.5, col 10.5, 12.5 */}
            <div className="absolute top-[16.667%] left-[16.667%] w-[66.667%] h-[66.667%] rounded-2xl bg-white border-2 border-slate-400 p-1.5 grid grid-cols-2 grid-rows-2 place-items-center shadow-inner">
              {[0, 1, 2, 3].map((slotIdx) => (
                <div
                  key={`green-slot-${slotIdx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#00a651] border-2 border-[#1e683b] flex items-center justify-center shadow-sm"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#005c2d] opacity-50" />
                </div>
              ))}
            </div>
            <span className="text-[11px] sm:text-xs font-black text-white tracking-wide truncate w-full text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pb-0.5 mt-auto">
              {greenPlayer?.name || 'Green'}
            </span>
          </div>

          {/* 5. CENTER HOME VICTORY TRIANGLE ZONE */}
          <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border-2 border-slate-900 bg-white overflow-hidden shadow-xl relative">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Top Red Triangle */}
              <polygon points="0,0 100,0 50,50" className="fill-[#ed1c24]" />
              {/* Right Green Triangle */}
              <polygon points="100,0 100,100 50,50" className="fill-[#00a651]" />
              {/* Bottom Yellow Triangle */}
              <polygon points="100,100 0,100 50,50" className="fill-[#ffc700]" />
              {/* Left Blue Triangle */}
              <polygon points="0,100 0,0 50,50" className="fill-[#00aeef]" />
            </svg>
            {/* Center Trophy Emblem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 border border-slate-900 shadow-md flex items-center justify-center text-[10px] sm:text-xs">
                🏆
              </div>
            </div>
          </div>

          {/* 6. RENDER ALL ACTIVE TOKENS ON BOARD */}
          {tokensOnBoard.map((token) => (
            <Pawn
              key={`${token.color}-${token.id}`}
              tokenId={token.id}
              color={token.color}
              step={token.step}
              isMovable={token.isMovable}
              isBase={token.isBase}
              isHome={token.isHome}
              indexInCell={token.indexInCell}
              totalInCell={token.totalInCell}
              onSelect={onSelectToken}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

