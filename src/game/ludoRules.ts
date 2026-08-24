import { Player, PlayerColor, Token, GameState } from '../types';
import { isSafeSquare, COLOR_START_INDEX } from './boardLayout';

export const TOTAL_STEPS_TO_HOME = 56; // step 56 is the goal

/**
 * Checks which tokens of a player can legally move given a dice roll
 */
export function getMovableTokens(player: Player, dice: number): number[] {
  const movable: number[] = [];

  for (const token of player.tokens) {
    if (token.isHome) continue;

    // Token in base: can ONLY move out if dice is 6
    if (token.step === -1 || token.isBase) {
      if (dice === 6) {
        movable.push(token.id);
      }
      continue;
    }

    // Token on track: can move if (currentStep + dice) <= TOTAL_STEPS_TO_HOME
    const targetStep = token.step + dice;
    if (targetStep <= TOTAL_STEPS_TO_HOME) {
      movable.push(token.id);
    }
  }

  return movable;
}

/**
 * Finds all tokens (active, opponents, etc.) at the same location as a moved token
 */
export function findTokensAtSameSquare(
  players: Player[],
  targetColor: PlayerColor,
  targetStep: number
): { playerIndex: number; token: Token }[] {
  if (targetStep === -1 || targetStep >= 51) {
    // In base or home stretch, tokens can only collide within their own team
    return [];
  }

  const targetCommonIndex = (COLOR_START_INDEX[targetColor] + targetStep) % 52;
  const result: { playerIndex: number; token: Token }[] = [];

  players.forEach((player, pIdx) => {
    player.tokens.forEach((tok) => {
      if (tok.isHome || tok.isBase || tok.step === -1 || tok.step >= 51) return;

      const tokCommonIndex = (COLOR_START_INDEX[tok.color] + tok.step) % 52;
      if (tokCommonIndex === targetCommonIndex) {
        result.push({ playerIndex: pIdx, token: tok });
      }
    });
  });

  return result;
}

export interface MoveExecutionResult {
  updatedPlayers: Player[];
  capturedOpponents: { playerColor: PlayerColor; tokenId: number }[];
  reachedHome: boolean;
  bonusTurn: boolean;
  gameFinished: boolean;
  rankings: Player[];
  actionLog: string;
}

/**
 * Executes a token move, handles captures, home entries, bonus turns, and win detection
 */
export function executeTokenMove(
  players: Player[],
  activePlayerIndex: number,
  tokenId: number,
  dice: number
): MoveExecutionResult {
  const updatedPlayers = JSON.parse(JSON.stringify(players)) as Player[];
  const activePlayer = updatedPlayers[activePlayerIndex];
  const token = activePlayer.tokens.find((t) => t.id === tokenId);

  if (!token) {
    throw new Error(`Token ${tokenId} not found for player ${activePlayer.name}`);
  }

  let capturedOpponents: { playerColor: PlayerColor; tokenId: number }[] = [];
  let reachedHome = false;
  let bonusTurn = dice === 6; // base rule: rolling 6 gives another turn
  let actionLog = '';

  if (token.step === -1 || token.isBase) {
    // Moving out of base to start position (step 0)
    token.step = 0;
    token.isBase = false;
    actionLog = `${activePlayer.name} deployed a token to the track!`;
  } else {
    // Moving forward
    const nextStep = token.step + dice;
    token.step = nextStep;

    if (nextStep === TOTAL_STEPS_TO_HOME) {
      token.isHome = true;
      reachedHome = true;
      bonusTurn = true; // Bonus turn on reaching home!
      actionLog = `🎉 ${activePlayer.name}'s token reached HOME GOAL! Extra roll awarded!`;
    } else {
      actionLog = `${activePlayer.name} advanced token by ${dice} steps.`;
    }
  }

  // Handle Capture Mechanics
  if (!token.isHome && token.step >= 0 && token.step < 51) {
    const isSafe = isSafeSquare(token.color, token.step);

    if (!isSafe) {
      const activeCommonIndex = (COLOR_START_INDEX[token.color] + token.step) % 52;

      updatedPlayers.forEach((otherPlayer, pIdx) => {
        if (pIdx === activePlayerIndex) return; // Cannot capture own tokens

        otherPlayer.tokens.forEach((otherToken) => {
          if (otherToken.isHome || otherToken.isBase || otherToken.step === -1 || otherToken.step >= 51) return;

          const otherCommonIndex = (COLOR_START_INDEX[otherToken.color] + otherToken.step) % 52;
          if (otherCommonIndex === activeCommonIndex) {
            // CAPTURE HAPPENED!
            otherToken.step = -1;
            otherToken.isBase = true;
            capturedOpponents.push({ playerColor: otherToken.color, tokenId: otherToken.id });
            activePlayer.kills += 1;
            bonusTurn = true; // Bonus turn for capturing an opponent!
            actionLog = `💥 ${activePlayer.name} captured ${otherPlayer.name}'s token! Extra roll awarded!`;
          }
        });
      });
    }
  }

  // Check if active player has completed all 4 tokens
  const allHome = activePlayer.tokens.every((t) => t.isHome);
  if (allHome && !activePlayer.hasWon) {
    activePlayer.hasWon = true;
    const currentWinners = updatedPlayers.filter((p) => p.hasWon).length;
    activePlayer.rank = currentWinners;
    actionLog = `🏆 ${activePlayer.name} finished in Rank #${activePlayer.rank}!`;
  }

  // Check if game is finished (all active players except maybe the last one have finished or forfeited)
  const activeContenders = updatedPlayers.filter((p) => !p.hasWon && !p.isForfeited);
  const gameFinished = activeContenders.length <= 1;

  // Build current rankings
  const rankings = updatedPlayers
    .filter((p) => p.hasWon)
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  return {
    updatedPlayers,
    capturedOpponents,
    reachedHome,
    bonusTurn,
    gameFinished,
    rankings,
    actionLog,
  };
}

/**
 * Calculates next active player index (skipping players who have already won or forfeited)
 */
export function getNextPlayerIndex(players: Player[], currentIndex: number): number {
  let next = (currentIndex + 1) % players.length;
  let attempts = 0;

  while ((players[next].hasWon || players[next].isForfeited) && attempts < players.length) {
    next = (next + 1) % players.length;
    attempts++;
  }

  return next;
}
