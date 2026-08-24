import { AiDifficulty, Player, PlayerColor, Token } from '../types';
import { isSafeSquare, COLOR_START_INDEX } from './boardLayout';
import { TOTAL_STEPS_TO_HOME } from './ludoRules';

/**
 * Determines the best token to move for an AI player
 */
export function getAiBestMove(
  players: Player[],
  aiPlayerIndex: number,
  movableTokenIds: number[],
  dice: number,
  difficulty: AiDifficulty = 'medium'
): number {
  if (movableTokenIds.length === 0) return -1;
  if (movableTokenIds.length === 1) return movableTokenIds[0];

  const aiPlayer = players[aiPlayerIndex];
  if (!aiPlayer) return movableTokenIds[0];

  // EASY: 75% random pick, 25% simple heuristic
  if (difficulty === 'easy') {
    if (Math.random() < 0.75) {
      const randomIndex = Math.floor(Math.random() * movableTokenIds.length);
      return movableTokenIds[randomIndex];
    }
  }

  // MEDIUM & HARD: Advanced multi-factor tactical heuristic
  let bestTokenId = movableTokenIds[0];
  let highestScore = -Infinity;

  for (const tokenId of movableTokenIds) {
    const token = aiPlayer.tokens.find((t) => t.id === tokenId);
    if (!token) continue;

    const score = evaluateMoveScore(players, aiPlayerIndex, token, dice, difficulty);
    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}

/**
 * Calculates an advanced tactical score for moving a specific token
 */
function evaluateMoveScore(
  players: Player[],
  aiPlayerIndex: number,
  token: Token,
  dice: number,
  difficulty: AiDifficulty
): number {
  const aiPlayer = players[aiPlayerIndex];
  let score = 0;

  // 1. Moving out of Base on rolling a 6
  if (token.step === -1 || token.isBase) {
    const activeTokensOnBoard = aiPlayer.tokens.filter((t) => !t.isBase && !t.isHome).length;
    // If no active tokens, opening base is supreme priority (Score 800)
    if (activeTokensOnBoard === 0) {
      return 850;
    }
    if (activeTokensOnBoard === 1) {
      return 620;
    }
    // If already 2 or 3 tokens active, slightly prefer advancing active tokens unless safe
    return 480;
  }

  const targetStep = token.step + dice;

  // 2. REACHING EXACT HOME GOAL (Step 56) -> Supreme Priority (Score 1500)
  if (targetStep === TOTAL_STEPS_TO_HOME) {
    score += 1500;
    return score;
  }

  // 3. Entering the Safe Home Stretch (Step 51..55) -> High Safety (Score 850)
  if (token.step < 51 && targetStep >= 51) {
    score += 850;
  } else if (token.step >= 51) {
    // Advancing inside home stretch towards step 56
    score += 650 + (targetStep - 51) * 35;
  }

  // 4. Capture Analysis on target square (Step < 51)
  if (targetStep < 51) {
    const targetCommonIndex = (COLOR_START_INDEX[token.color] + targetStep) % 52;
    const targetIsSafe = isSafeSquare(token.color, targetStep);

    if (!targetIsSafe) {
      // Check if this move captures an opponent!
      let opponentCapturedValue = 0;
      players.forEach((otherPlayer, pIdx) => {
        if (pIdx === aiPlayerIndex) return;

        otherPlayer.tokens.forEach((otherToken) => {
          if (otherToken.isHome || otherToken.isBase || otherToken.step === -1 || otherToken.step >= 51) return;

          const otherCommonIndex = (COLOR_START_INDEX[otherToken.color] + otherToken.step) % 52;
          if (otherCommonIndex === targetCommonIndex) {
            // Value capture more if opponent was far advanced!
            const opponentProgress = otherToken.step;
            opponentCapturedValue = Math.max(opponentCapturedValue, 1200 + opponentProgress * 8);
          }
        });
      });

      if (opponentCapturedValue > 0) {
        score += opponentCapturedValue; // HIGHEST PRIORITY: Capturing opponents gives extra turn + resets enemy
      }
    } else {
      // Landing on a Safe Star or Start Square
      score += 550;
    }
  }

  // 5. Tactical Threat & Danger Evaluation (Medium & Hard)
  if (difficulty === 'hard' || difficulty === 'medium') {
    // A. Escaping from danger: Check if current token position is under threat by any opponent within 1..6 steps behind
    if (token.step < 51 && !isSafeSquare(token.color, token.step)) {
      const currentCommonIndex = (COLOR_START_INDEX[token.color] + token.step) % 52;
      let underThreat = false;
      let closestThreatDistance = 99;

      players.forEach((otherPlayer, pIdx) => {
        if (pIdx === aiPlayerIndex) return;

        otherPlayer.tokens.forEach((otherToken) => {
          if (otherToken.isHome || otherToken.isBase || otherToken.step === -1 || otherToken.step >= 51) return;

          const otherCommonIndex = (COLOR_START_INDEX[otherToken.color] + otherToken.step) % 52;
          const distanceBehind = (currentCommonIndex - otherCommonIndex + 52) % 52;

          if (distanceBehind >= 1 && distanceBehind <= 6) {
            underThreat = true;
            closestThreatDistance = Math.min(closestThreatDistance, distanceBehind);
          }
        });
      });

      if (underThreat) {
        // Escaping threatened position is heavily rewarded, especially if token has made high progress
        score += 500 + token.step * 6;
      }
    }

    // B. Vulnerability penalty: Check if landing position lands within 1..6 steps ahead of an active enemy
    if (targetStep < 51 && !isSafeSquare(token.color, targetStep)) {
      const targetCommonIndex = (COLOR_START_INDEX[token.color] + targetStep) % 52;
      let placedInDanger = false;

      players.forEach((otherPlayer, pIdx) => {
        if (pIdx === aiPlayerIndex) return;

        otherPlayer.tokens.forEach((otherToken) => {
          if (otherToken.isHome || otherToken.isBase || otherToken.step === -1 || otherToken.step >= 51) return;

          const otherCommonIndex = (COLOR_START_INDEX[otherToken.color] + otherToken.step) % 52;
          const distanceAhead = (targetCommonIndex - otherCommonIndex + 52) % 52;

          if (distanceAhead >= 1 && distanceAhead <= 6) {
            placedInDanger = true;
          }
        });
      });

      if (placedInDanger) {
        // Significant penalty if placing high-progress token into dangerous range
        const dangerPenalty = difficulty === 'hard' ? 320 + token.step * 4 : 200;
        score -= dangerPenalty;
      }
    }
  }

  // 6. Base progression value: favor advancing tokens closer to home
  score += targetStep * 5;

  return score;
}
