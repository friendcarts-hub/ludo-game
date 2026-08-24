import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AiDifficulty,
  ChatMessage,
  EmojiReaction,
  GameMode,
  GameState,
  Player,
  PlayerColor,
  Token,
} from '../types';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useSocial } from './SocialContext';
import { soundManager } from '../game/audio';
import { executeTokenMove, getMovableTokens, getNextPlayerIndex } from '../game/ludoRules';
import { getAiBestMove } from '../game/ludoAi';
import { socketService } from '../services/socketService';
import { adsterraService } from '../services/adsterraService';

export interface MatchedOpponent {
  name: string;
  avatar: string;
  color: PlayerColor;
  country?: string;
  rating?: number;
  winRate?: string;
}

interface GameContextType {
  gameState: GameState | null;
  isInGame: boolean;
  chatMessages: ChatMessage[];
  emojiReactions: EmojiReaction[];
  startOfflineGame: (numPlayers: 2 | 3 | 4, customNames?: Record<PlayerColor, string>) => void;
  startAiGame: (difficulty: AiDifficulty, wager: number, numPlayers?: 2 | 4, userColor?: PlayerColor, isFreeAdMatch?: boolean) => void;
  startComputerVsComputerGame: (difficulty?: AiDifficulty) => void;
  startOnlineRandomMatch: (wager: number, customOpponents?: MatchedOpponent[], isFreeAdMatch?: boolean) => Promise<void>;
  createPrivateRoom: (wager: number, isFreeAdMatch?: boolean) => string;
  joinPrivateRoom: (roomCode: string, isFreeAdMatch?: boolean) => Promise<boolean>;
  rollDice: () => void;
  selectTokenToMove: (tokenId: number) => void;
  sendChatMessage: (text: string, isQuickChat?: boolean) => void;
  triggerEmojiReaction: (emoji: string) => void;
  surrenderMatch: () => void;
  leaveGame: () => void;
  rematch: () => void;
}

function createInitialTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    step: -1, // in base
    isBase: true,
    isHome: false,
    positionHistory: [],
  }));
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const { creditCoins, debitCoins, settings } = useWallet();
  const { trackMissionEvent } = useSocial();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([]);

  // Keep gameStateRef always synchronously synced with gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepAnimationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const cleanupTimers = useCallback(() => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    if (aiTurnTimeoutRef.current) {
      clearTimeout(aiTurnTimeoutRef.current);
      aiTurnTimeoutRef.current = null;
    }
    if (noMoveTimeoutRef.current) {
      clearTimeout(noMoveTimeoutRef.current);
      noMoveTimeoutRef.current = null;
    }
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
    stepAnimationTimeoutsRef.current.forEach((t) => clearTimeout(t));
    stepAnimationTimeoutsRef.current = [];
  }, []);

  // Clean up floating emojis after 3.5s
  useEffect(() => {
    if (emojiReactions.length === 0) return;
    const timeout = setTimeout(() => {
      setEmojiReactions((prev) => prev.filter((e) => Date.now() - e.timestamp < 3500));
    }, 3500);
    return () => clearTimeout(timeout);
  }, [emojiReactions]);

  // Setup Real-time WebSocket Listeners
  useEffect(() => {
    const socket = socketService.init();

    const handleDiceRolled = (data: {
      dice: number;
      activePlayerIndex: number;
      movableTokens: number[];
      consecutiveSixes: number;
    }) => {
      soundManager.playDiceRoll();

      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;
        const updatedPlayers = prev.players.map((p, idx) => {
          if (idx === data.activePlayerIndex) {
            return {
              ...p,
              consecutiveSixes: data.consecutiveSixes,
              sixesRolled: data.dice === 6 ? (p.sixesRolled || 0) + 1 : (p.sixesRolled || 0),
            };
          }
          return p;
        });

        const activeP = updatedPlayers[data.activePlayerIndex];

        const nextState = {
          ...prev,
          players: updatedPlayers,
          currentDice: data.dice,
          diceRolled: true,
          isRolling: false,
          movableTokens: data.movableTokens,
          lastAction: {
            type: 'roll' as const,
            text: `${activeP?.name || 'Player'} rolled a ${data.dice}!`,
            color: activeP?.color || 'red',
            timestamp: Date.now(),
          },
        };
        gameStateRef.current = nextState;
        return nextState;
      });

      // Auto-move if exactly 1 token is movable and it's this user's turn
      const current = gameStateRef.current;
      if (
        current &&
        data.movableTokens.length === 1 &&
        current.players[data.activePlayerIndex]?.id === user?.uid
      ) {
        setTimeout(() => {
          socketService.moveToken(current.id, user?.uid || '', data.movableTokens[0]);
        }, 320);
      }
    };

    const handleTokenMoved = (data: {
      tokenId: number;
      color: PlayerColor;
      dice: number;
      updatedPlayers: Player[];
      capturedOpponents: PlayerColor[];
      reachedHome: boolean;
      bonusTurn: boolean;
      nextPlayerIndex: number;
      gameFinished: boolean;
      winner: Player | null;
      rankings: Player[];
      actionLog?: string;
    }) => {
      const currentState = gameStateRef.current;
      if (!currentState) return;

      const activePlayer = currentState.players[currentState.activePlayerIndex];
      const tokenBeforeMove = activePlayer?.tokens.find((t) => t.id === data.tokenId);
      const wasInBase = !tokenBeforeMove || tokenBeforeMove.isBase || tokenBeforeMove.step === -1;
      const startStep = tokenBeforeMove?.step ?? -1;

      // Clear any prior step animations
      stepAnimationTimeoutsRef.current.forEach((t) => clearTimeout(t));
      stepAnimationTimeoutsRef.current = [];

      // 1. BASE DEPLOY MOVE
      if (wasInBase) {
        soundManager.playExitBase();

        const playersWithDeploy = currentState.players.map((p, pIdx) => {
          if (pIdx !== currentState.activePlayerIndex) return p;
          return {
            ...p,
            tokens: p.tokens.map((tok) =>
              tok.id === data.tokenId ? { ...tok, step: 0, isBase: false } : tok
            ),
          };
        });

        setGameState((prev) => {
          if (!prev) return null;
          const animatingState = {
            ...prev,
            players: playersWithDeploy,
            isAnimatingMove: true,
            movableTokens: [],
          };
          gameStateRef.current = animatingState;
          return animatingState;
        });

        const deployTimeout = setTimeout(() => {
          setGameState((stateAfterDeploy) => {
            if (!stateAfterDeploy || stateAfterDeploy.status !== 'playing') return stateAfterDeploy;
            const deployedState = {
              ...stateAfterDeploy,
              players: data.updatedPlayers,
              activePlayerIndex: data.nextPlayerIndex,
              currentDice: null,
              diceRolled: false,
              isRolling: false,
              isAnimatingMove: false,
              movableTokens: [],
              turnTimer: stateAfterDeploy.maxTurnTimer,
              lastAction: {
                type: 'move' as const,
                text: `${activePlayer?.name || 'Player'} deployed token to track! Extra roll awarded!`,
                color: activePlayer?.color || 'red',
                timestamp: Date.now(),
              },
            };
            gameStateRef.current = deployedState;
            return deployedState;
          });
        }, 240);

        stepAnimationTimeoutsRef.current.push(deployTimeout);
        return;
      }

      // 2. STEP-BY-STEP HOPPING MOVE ALONG TRACK
      const targetStep = startStep + data.dice;
      const stepCount = targetStep - startStep;
      const stepDurationMs = 190;

      setGameState((prev) => {
        if (!prev) return null;
        const hoppingLockState = {
          ...prev,
          isAnimatingMove: true,
          movableTokens: [],
        };
        gameStateRef.current = hoppingLockState;
        return hoppingLockState;
      });

      for (let i = 1; i <= stepCount; i++) {
        const intermediateStep = startStep + i;
        const stepIdx = i;

        const timeout = setTimeout(() => {
          soundManager.playPawnStep(stepIdx - 1);

          setGameState((stateDuringHop) => {
            if (!stateDuringHop || stateDuringHop.status !== 'playing') return stateDuringHop;
            const updatedPlayersHop = stateDuringHop.players.map((p, pIdx) => {
              if (pIdx !== currentState.activePlayerIndex) return p;
              return {
                ...p,
                tokens: p.tokens.map((tok) =>
                  tok.id === data.tokenId ? { ...tok, step: intermediateStep } : tok
                ),
              };
            });
            const midState = {
              ...stateDuringHop,
              players: updatedPlayersHop,
            };
            gameStateRef.current = midState;
            return midState;
          });
        }, (i - 1) * stepDurationMs);

        stepAnimationTimeoutsRef.current.push(timeout);
      }

      const finalLandingTimeout = setTimeout(() => {
        if (data.capturedOpponents.length > 0) {
          soundManager.playCapture();
        }
        if (data.reachedHome) {
          soundManager.playHomeGoal();
        }
        setGameState((stateOnLanding) => {
          if (!stateOnLanding || stateOnLanding.status !== 'playing') return stateOnLanding;

          if (data.gameFinished) {
            soundManager.playVictory();
            fireVictoryConfetti();

            const isMeWinner = data.winner && data.winner.id === user?.uid;
            const isFree = stateOnLanding.isFreeAdMatch || (stateOnLanding.prizePool || 0) === 0;

            if (isMeWinner) {
              const winnerReward = isFree
                ? (settings.freeAdMatchWinnerReward || settings.matchWinnerRewardCoins || 350)
                : Math.max(stateOnLanding.prizePool || 0, settings.matchWinnerRewardCoins || 500);
              creditCoins(winnerReward, 'game_win', `Winner of Online Ludo Match #${stateOnLanding.id || ''}`);
              trackMissionEvent('win_match', 1);
            } else if (user) {
              const loserReward = isFree
                ? (settings.freeAdMatchLoserReward || settings.matchLoserRewardCoins || 60)
                : (settings.matchLoserRewardCoins || 50);
              if (loserReward > 0) {
                creditCoins(loserReward, 'game_loss_consolation', 'Online Match Participation & Consolation Reward');
              }
            }
          }

          const finalState: GameState = {
            ...stateOnLanding,
            players: data.updatedPlayers,
            activePlayerIndex: data.nextPlayerIndex,
            currentDice: null,
            diceRolled: false,
            isRolling: false,
            isAnimatingMove: false,
            movableTokens: [],
            status: data.gameFinished ? 'finished' : 'playing',
            winner: data.winner,
            rankings: data.rankings,
            turnTimer: stateOnLanding.maxTurnTimer,
            lastAction: {
              type: 'move' as const,
              text: data.actionLog || `${activePlayer?.name || 'Player'} moved token.`,
              color: activePlayer?.color || 'red',
              timestamp: Date.now(),
            },
          };
          gameStateRef.current = finalState;
          return finalState;
        });
      }, stepCount * stepDurationMs + 80);

      stepAnimationTimeoutsRef.current.push(finalLandingTimeout);
    };

    const handleTurnChanged = (data: { activePlayerIndex: number; turnTimer: number }) => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;
        const nextActive = prev.players[data.activePlayerIndex];
        const nextState = {
          ...prev,
          activePlayerIndex: data.activePlayerIndex,
          currentDice: null,
          diceRolled: false,
          isRolling: false,
          movableTokens: [],
          turnTimer: data.turnTimer || 15,
          lastAction: nextActive
            ? {
                type: 'skip' as const,
                text: `${nextActive.name}'s turn to roll!`,
                color: nextActive.color,
                timestamp: Date.now(),
              }
            : prev.lastAction,
        };
        gameStateRef.current = nextState;
        return nextState;
      });
    };

    const handleChatReceived = (data: { message: ChatMessage }) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      if (data.message.senderId !== user?.uid) {
        soundManager.playMessageReceived();
      }
    };

    const handleEmojiReceived = (data: EmojiReaction) => {
      setEmojiReactions((prev) => [...prev, data]);
    };

    const handleGameStart = (data: { roomId: string; gameState: GameState }) => {
      cleanupTimers();
      socketService.setCurrentRoomId(data.roomId);
      gameStateRef.current = data.gameState;
      setGameState(data.gameState);
      setChatMessages([]);
      setEmojiReactions([]);
      soundManager.playClick();
    };

    const handlePlayerForfeited = (data: {
      roomId: string;
      forfeitedUid: string;
      forfeitedPlayerName: string;
      winner: Player | null;
      gameFinished: boolean;
      gameState: GameState;
      nextPlayerIndex?: number;
      message?: string;
    }) => {
      const isMeWhoForfeited = data.forfeitedUid === user?.uid;
      const isMeWinner = data.winner && data.winner.id === user?.uid;

      if (data.gameFinished && data.winner) {
        const isFree = data.gameState.isFreeAdMatch || (data.gameState.prizePool || 0) === 0;
        if (isMeWinner) {
          soundManager.playVictory();
          fireVictoryConfetti();
          const winnerReward = isFree
            ? (settings.freeAdMatchWinnerReward || settings.matchWinnerRewardCoins || 350)
            : Math.max(data.gameState.prizePool || 0, settings.matchWinnerRewardCoins || 500);

          creditCoins(
            winnerReward,
            'game_win',
            `Winner by Opponent Forfeit in Match #${data.roomId}`
          );
          trackMissionEvent('win_match', 1);
          if (user) {
            trackMissionEvent('play_matches', 1);
            const nextGames = (user.totalGames || 0) + 1;
            const nextWins = (user.totalWins || 0) + 1;
            const nextStreak = (user.winStreak || 0) + 1;
            const nextHighestStreak = Math.max(user.highestWinStreak || 0, nextStreak);
            const nextXp = (user.xp || 0) + 150;
            const nextLevel = Math.floor(nextXp / 200) + 1;

            updateProfile({
              totalGames: nextGames,
              totalWins: nextWins,
              winStreak: nextStreak,
              highestWinStreak: nextHighestStreak,
              xp: nextXp,
              level: nextLevel,
            });
          }
        } else if (isMeWhoForfeited) {
          soundManager.playCapture();
          const loserReward = isFree
            ? (settings.freeAdMatchLoserReward || settings.matchLoserRewardCoins || 60)
            : (settings.matchLoserRewardCoins || 50);

          if (loserReward > 0) {
            creditCoins(loserReward, 'game_loss_consolation', 'Match Consolation Coins (Exit/Forfeit)');
          }

          if (user) {
            trackMissionEvent('play_matches', 1);
            updateProfile({
              totalGames: (user.totalGames || 0) + 1,
              winStreak: 0,
              xp: (user.xp || 0) + 20,
            });
          }
        }
      }

      gameStateRef.current = data.gameState;
      setGameState(data.gameState);
    };

    socket.on('dice_rolled', handleDiceRolled);
    socket.on('token_moved', handleTokenMoved);
    socket.on('turn_changed', handleTurnChanged);
    socket.on('chat_received', handleChatReceived);
    socket.on('emoji_received', handleEmojiReceived);
    socket.on('game_start', handleGameStart);
    socket.on('player_forfeited', handlePlayerForfeited);

    return () => {
      socket.off('dice_rolled', handleDiceRolled);
      socket.off('token_moved', handleTokenMoved);
      socket.off('turn_changed', handleTurnChanged);
      socket.off('chat_received', handleChatReceived);
      socket.off('emoji_received', handleEmojiReceived);
      socket.off('game_start', handleGameStart);
      socket.off('player_forfeited', handlePlayerForfeited);
    };
  }, [user?.uid, user, cleanupTimers, creditCoins, trackMissionEvent, updateProfile]);

  // Launch celebratory confetti upon victory
  const fireVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#ec4899'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
        });
      }, 400);
    } catch {
      // Ignored if canvas-confetti is not loaded
    }
  };

  /**
   * Rolls the dice for the active player (Human, AI, or Online Real Player)
   */
  const rollDice = useCallback(() => {
    const currentState = gameStateRef.current;
    if (
      !currentState ||
      currentState.status !== 'playing' ||
      currentState.diceRolled ||
      currentState.isRolling ||
      currentState.isAnimatingMove
    ) {
      return;
    }

    const activePlayer = currentState.players[currentState.activePlayerIndex];
    if (!activePlayer) return;

    // Real-time Online Multiplayer Mode Routing
    if (currentState.mode === 'online_random' || currentState.mode === 'private_room') {
      if (activePlayer.id === user?.uid) {
        socketService.rollDice(currentState.id, user.uid);
      }
      return;
    }

    soundManager.playDiceRoll();

    // Lock board with rolling state
    setGameState((prev) => {
      if (!prev) return null;
      const nextState = { ...prev, isRolling: true };
      gameStateRef.current = nextState;
      return nextState;
    });

    setTimeout(() => {
      const diceValue = Math.floor(Math.random() * 6) + 1;
      const stateNow = gameStateRef.current;
      if (!stateNow || stateNow.status !== 'playing') return;

      const activePlayer = stateNow.players[stateNow.activePlayerIndex];

      // Track mission stats for human user
      if (activePlayer && activePlayer.id === user?.uid) {
        if (diceValue === 6) {
          trackMissionEvent('roll_six', 1);
          if (user) updateProfile({ totalSixes: (user.totalSixes || 0) + 1 });
        }
      }

      setGameState((stateAfterRollTimeout) => {
        if (!stateAfterRollTimeout || stateAfterRollTimeout.status !== 'playing') return stateAfterRollTimeout;

        const currActivePlayer = stateAfterRollTimeout.players[stateAfterRollTimeout.activePlayerIndex];
        if (!currActivePlayer) return stateAfterRollTimeout;

        // Check 3 consecutive 6s rule
        let nextConsecutiveSixes = diceValue === 6 ? (currActivePlayer.consecutiveSixes || 0) + 1 : 0;
        let consecutiveSixesPenalty = false;

        if (nextConsecutiveSixes === 3) {
          consecutiveSixesPenalty = true;
          nextConsecutiveSixes = 0;
        }

        const updatedPlayers = stateAfterRollTimeout.players.map((p, idx) => {
          if (idx === stateAfterRollTimeout.activePlayerIndex) {
            return {
              ...p,
              consecutiveSixes: nextConsecutiveSixes,
              sixesRolled: diceValue === 6 ? (p.sixesRolled || 0) + 1 : (p.sixesRolled || 0),
            };
          }
          return p;
        });

        // 3 consecutive 6s penalty: Turn immediately passes to next player
        if (consecutiveSixesPenalty) {
          const nextIndex = getNextPlayerIndex(updatedPlayers, stateAfterRollTimeout.activePlayerIndex);
          const penaltyState = {
            ...stateAfterRollTimeout,
            players: updatedPlayers,
            currentDice: diceValue,
            diceRolled: false,
            isRolling: false,
            movableTokens: [],
            activePlayerIndex: nextIndex,
            turnTimer: stateAfterRollTimeout.maxTurnTimer,
            lastAction: {
              type: 'skip' as const,
              text: `⚠️ ${currActivePlayer.name} rolled three 6s in a row! Turn skipped.`,
              color: currActivePlayer.color,
              timestamp: Date.now(),
            },
          };
          gameStateRef.current = penaltyState;
          return penaltyState;
        }

        const movableTokens = getMovableTokens(updatedPlayers[stateAfterRollTimeout.activePlayerIndex], diceValue);

        // Case A: No legal moves possible -> Pass turn automatically after brief crisp delay
        if (movableTokens.length === 0) {
          if (noMoveTimeoutRef.current) clearTimeout(noMoveTimeoutRef.current);
          noMoveTimeoutRef.current = setTimeout(() => {
            setGameState((stateAfterNoMove) => {
              if (!stateAfterNoMove || stateAfterNoMove.status !== 'playing') return stateAfterNoMove;
              const nextIdx = getNextPlayerIndex(stateAfterNoMove.players, stateAfterNoMove.activePlayerIndex);
              const passedState = {
                ...stateAfterNoMove,
                activePlayerIndex: nextIdx,
                currentDice: null,
                diceRolled: false,
                isRolling: false,
                movableTokens: [],
                turnTimer: stateAfterNoMove.maxTurnTimer,
                lastAction: {
                  type: 'skip' as const,
                  text: `${currActivePlayer.name} has no valid moves for ${diceValue}. Turn passed.`,
                  color: currActivePlayer.color,
                  timestamp: Date.now(),
                },
              };
              gameStateRef.current = passedState;
              return passedState;
            });
          }, 450);
        } else if (movableTokens.length === 1 && currActivePlayer.type === 'human') {
          // Case B: Exactly 1 move possible for Human player -> Auto-move cleanly after brief highlight
          if (autoMoveTimeoutRef.current) clearTimeout(autoMoveTimeoutRef.current);
          autoMoveTimeoutRef.current = setTimeout(() => {
            const current = gameStateRef.current;
            if (
              current &&
              current.status === 'playing' &&
              current.diceRolled &&
              current.movableTokens.length === 1 &&
              !current.isAnimatingMove
            ) {
              selectTokenToMove(movableTokens[0]);
            }
          }, 320);
        }

        const rolledState = {
          ...stateAfterRollTimeout,
          players: updatedPlayers,
          currentDice: diceValue,
          diceRolled: true,
          isRolling: false,
          movableTokens,
          lastAction: {
            type: 'roll' as const,
            text: `${currActivePlayer.name} rolled a ${diceValue}!`,
            color: currActivePlayer.color,
            timestamp: Date.now(),
          },
        };
        gameStateRef.current = rolledState;
        return rolledState;
      });
    }, 260);
  }, [user, trackMissionEvent, updateProfile]);

  /**
   * Moves a selected token for the active player with smooth step-by-step hop
   */
  const selectTokenToMove = useCallback((tokenId: number) => {
    const currentState = gameStateRef.current;
    if (
      !currentState ||
      currentState.status !== 'playing' ||
      !currentState.diceRolled ||
      !currentState.currentDice ||
      currentState.isAnimatingMove
    ) {
      return;
    }
    if (!currentState.movableTokens.includes(tokenId)) return;

    const activePlayerIndex = currentState.activePlayerIndex;
    const activePlayer = currentState.players[activePlayerIndex];
    if (!activePlayer) return;

    // Real-time Online Multiplayer Mode Routing
    if (currentState.mode === 'online_random' || currentState.mode === 'private_room') {
      if (activePlayer.id === user?.uid) {
        socketService.moveToken(currentState.id, user.uid, tokenId);
      }
      return;
    }

    const dice = currentState.currentDice;
    const tokenBeforeMove = activePlayer.tokens.find((t) => t.id === tokenId);
    if (!tokenBeforeMove) return;

    const wasInBase = tokenBeforeMove.isBase || tokenBeforeMove.step === -1;
    const startStep = tokenBeforeMove.step;

    // Clear any prior step animations
    stepAnimationTimeoutsRef.current.forEach((t) => clearTimeout(t));
    stepAnimationTimeoutsRef.current = [];

    const moveResult = executeTokenMove(currentState.players, activePlayerIndex, tokenId, dice);

    // 1. BASE DEPLOY MOVE (deploy token out of home yard onto start tile 0)
    if (wasInBase) {
      soundManager.playExitBase();

      const playersWithDeploy = currentState.players.map((p, pIdx) => {
        if (pIdx !== activePlayerIndex) return p;
        return {
          ...p,
          tokens: p.tokens.map((tok) => (tok.id === tokenId ? { ...tok, step: 0, isBase: false } : tok)),
        };
      });

      setGameState((prev) => {
        if (!prev) return null;
        const animatingState = {
          ...prev,
          players: playersWithDeploy,
          isAnimatingMove: true,
          movableTokens: [],
        };
        gameStateRef.current = animatingState;
        return animatingState;
      });

      const deployTimeout = setTimeout(() => {
        let nextActiveIndex = activePlayerIndex;
        if (!moveResult.bonusTurn && !moveResult.gameFinished) {
          nextActiveIndex = getNextPlayerIndex(moveResult.updatedPlayers, activePlayerIndex);
        }

        setGameState((stateAfterDeploy) => {
          if (!stateAfterDeploy || stateAfterDeploy.status !== 'playing') return stateAfterDeploy;
          const deployedState = {
            ...stateAfterDeploy,
            players: moveResult.updatedPlayers,
            activePlayerIndex: nextActiveIndex,
            currentDice: null,
            diceRolled: false,
            isRolling: false,
            isAnimatingMove: false,
            movableTokens: [],
            turnTimer: stateAfterDeploy.maxTurnTimer,
            lastAction: {
              type: 'move' as const,
              text: `${activePlayer.name} deployed token to track! Extra roll awarded!`,
              color: activePlayer.color,
              timestamp: Date.now(),
            },
          };
          gameStateRef.current = deployedState;
          return deployedState;
        });
      }, 240);

      stepAnimationTimeoutsRef.current.push(deployTimeout);
      return;
    }

    // 2. STEP-BY-STEP HOPPING MOVE ALONG TRACK (Deliberate tile-by-tile counting)
    const targetStep = startStep + dice;
    const stepCount = targetStep - startStep;
    const stepDurationMs = 190; // 190ms per tile hop for distinct rhythmic step-by-step counting

    // Lock board for animation immediately
    setGameState((prev) => {
      if (!prev) return null;
      const hoppingLockState = {
        ...prev,
        isAnimatingMove: true,
        movableTokens: [],
      };
      gameStateRef.current = hoppingLockState;
      return hoppingLockState;
    });

    // Schedule rhythmic step hops
    for (let i = 1; i <= stepCount; i++) {
      const intermediateStep = startStep + i;
      const stepIdx = i;

      const timeout = setTimeout(() => {
        soundManager.playPawnStep(stepIdx - 1);

        setGameState((stateDuringHop) => {
          if (!stateDuringHop || stateDuringHop.status !== 'playing') return stateDuringHop;
          const updatedPlayersHop = stateDuringHop.players.map((p, pIdx) => {
            if (pIdx !== activePlayerIndex) return p;
            return {
              ...p,
              tokens: p.tokens.map((tok) =>
                tok.id === tokenId ? { ...tok, step: intermediateStep } : tok
              ),
            };
          });
          const midState = {
            ...stateDuringHop,
            players: updatedPlayersHop,
          };
          gameStateRef.current = midState;
          return midState;
        });
      }, (i - 1) * stepDurationMs);

      stepAnimationTimeoutsRef.current.push(timeout);
    }

    // Schedule final landing resolution after all steps complete
    const finalLandingTimeout = setTimeout(() => {
      // Audio & mission triggers on final landing
      if (moveResult.capturedOpponents.length > 0) {
        soundManager.playCapture();
        if (activePlayer.id === user?.uid) {
          trackMissionEvent('capture_pawn', moveResult.capturedOpponents.length);
          if (user) updateProfile({ totalKills: (user.totalKills || 0) + moveResult.capturedOpponents.length });
        }
      }

      if (moveResult.reachedHome) {
        soundManager.playHomeGoal();
      }

      if (moveResult.gameFinished) {
        soundManager.playVictory();
        fireVictoryConfetti();

        const winner = moveResult.rankings[0] || activePlayer;
        const isUserWinner = winner?.id === user?.uid;
        const latestState = gameStateRef.current;
        const isFree = latestState?.isFreeAdMatch || (latestState?.prizePool || 0) === 0;

        if (isUserWinner) {
          const winnerReward = isFree
            ? (settings.freeAdMatchWinnerReward || settings.matchWinnerRewardCoins || 350)
            : Math.max(latestState?.prizePool || 0, settings.matchWinnerRewardCoins || 500);

          creditCoins(winnerReward, 'game_win', `Winner of ${latestState?.mode?.toUpperCase() || 'Ludo'} Match #${latestState?.id || ''}`);
          trackMissionEvent('win_match', 1);
        } else if (user) {
          const loserReward = isFree
            ? (settings.freeAdMatchLoserReward || settings.matchLoserRewardCoins || 60)
            : (settings.matchLoserRewardCoins || 50);

          if (loserReward > 0) {
            creditCoins(loserReward, 'game_loss_consolation', `Match Participation & Loser Reward for ${latestState?.mode?.toUpperCase() || 'Ludo'} Match`);
          }
        }

        if (user) {
          trackMissionEvent('play_matches', 1);
          const nextGames = (user.totalGames || 0) + 1;
          const nextWins = isUserWinner ? (user.totalWins || 0) + 1 : (user.totalWins || 0);
          const nextStreak = isUserWinner ? (user.winStreak || 0) + 1 : 0;
          const nextHighestStreak = Math.max(user.highestWinStreak || 0, nextStreak);
          const nextXp = (user.xp || 0) + (isUserWinner ? 150 : 50);
          const nextLevel = Math.floor(nextXp / 200) + 1;

          updateProfile({
            totalGames: nextGames,
            totalWins: nextWins,
            winStreak: nextStreak,
            highestWinStreak: nextHighestStreak,
            xp: nextXp,
            level: nextLevel,
          });
        }
      }

      let nextActiveIndex = activePlayerIndex;
      if (!moveResult.bonusTurn && !moveResult.gameFinished) {
        nextActiveIndex = getNextPlayerIndex(moveResult.updatedPlayers, activePlayerIndex);
      }

      setGameState((stateAfterHopComplete) => {
        if (!stateAfterHopComplete || stateAfterHopComplete.status !== 'playing') return stateAfterHopComplete;
        const landedState = {
          ...stateAfterHopComplete,
          players: moveResult.updatedPlayers,
          activePlayerIndex: nextActiveIndex,
          currentDice: null,
          diceRolled: false,
          isRolling: false,
          isAnimatingMove: false,
          movableTokens: [],
          status: moveResult.gameFinished ? ('finished' as const) : ('playing' as const),
          winner: moveResult.gameFinished ? moveResult.rankings[0] || null : null,
          rankings: moveResult.rankings,
          turnTimer: stateAfterHopComplete.maxTurnTimer,
          lastAction: {
            type: moveResult.capturedOpponents.length > 0 ? ('capture' as const) : moveResult.reachedHome ? ('home' as const) : ('move' as const),
            text: moveResult.actionLog,
            color: activePlayer.color,
            timestamp: Date.now(),
          },
        };
        gameStateRef.current = landedState;
        return landedState;
      });
    }, stepCount * stepDurationMs + 80);

    stepAnimationTimeoutsRef.current.push(finalLandingTimeout);
  }, [user, trackMissionEvent, updateProfile, creditCoins]);

  // Turn timer timeout: auto-roll or auto-move on expiry
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || gameState.isAnimatingMove) return;

    if (gameState.turnTimer === 0) {
      if (!gameState.diceRolled && !gameState.isRolling) {
        rollDice();
      } else if (gameState.diceRolled && gameState.movableTokens.length > 0) {
        const activePlayer = gameState.players[gameState.activePlayerIndex];
        if (activePlayer) {
          const chosenTokenId =
            activePlayer.type === 'ai'
              ? getAiBestMove(
                  gameState.players,
                  gameState.activePlayerIndex,
                  gameState.movableTokens,
                  gameState.currentDice || 1,
                  activePlayer.aiDifficulty || 'medium'
                )
              : gameState.movableTokens[0];
          selectTokenToMove(chosenTokenId);
        }
      }
    }
  }, [gameState?.turnTimer, gameState?.diceRolled, gameState?.isRolling, gameState?.isAnimatingMove, rollDice, selectTokenToMove]);

  // Automated AI turn loop (executes automatically in all modes without user input)
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || gameState.isAnimatingMove) return;

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (activePlayer && activePlayer.type === 'ai') {
      if (!gameState.diceRolled && !gameState.isRolling) {
        // AI rolls dice swiftly
        aiTurnTimeoutRef.current = setTimeout(() => {
          const currentState = gameStateRef.current;
          if (
            currentState &&
            currentState.status === 'playing' &&
            !currentState.diceRolled &&
            !currentState.isRolling &&
            !currentState.isAnimatingMove &&
            currentState.players[currentState.activePlayerIndex]?.type === 'ai'
          ) {
            rollDice();
          }
        }, 260);
      } else if (gameState.diceRolled && !gameState.isRolling && gameState.movableTokens.length > 0) {
        // AI evaluates optimal tactical move and executes
        aiTurnTimeoutRef.current = setTimeout(() => {
          const currentState = gameStateRef.current;
          if (
            currentState &&
            currentState.status === 'playing' &&
            currentState.diceRolled &&
            currentState.currentDice &&
            !currentState.isAnimatingMove &&
            currentState.movableTokens.length > 0 &&
            currentState.players[currentState.activePlayerIndex]?.type === 'ai'
          ) {
            const bestTokenId = getAiBestMove(
              currentState.players,
              currentState.activePlayerIndex,
              currentState.movableTokens,
              currentState.currentDice,
              activePlayer.aiDifficulty || 'medium'
            );
            selectTokenToMove(bestTokenId);
          }
        }, 280);
      }
    }

    return () => {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
        aiTurnTimeoutRef.current = null;
      }
    };
  }, [
    gameState?.status,
    gameState?.activePlayerIndex,
    gameState?.diceRolled,
    gameState?.isRolling,
    gameState?.isAnimatingMove,
    gameState?.movableTokens,
    gameState?.currentDice,
    rollDice,
    selectTokenToMove,
  ]);

  /**
   * Start Pass & Play Offline Game (2 to 4 players)
   */
  const startOfflineGame = (numPlayers: 2 | 3 | 4, customNames?: Record<PlayerColor, string>) => {
    cleanupTimers();
    soundManager.playClick();

    const selectedColors: PlayerColor[] =
      numPlayers === 2
        ? ['red', 'yellow']
        : numPlayers === 3
        ? ['red', 'green', 'yellow']
        : ['red', 'green', 'yellow', 'blue'];

    const players: Player[] = selectedColors.map((color, idx) => ({
      id: `offline_p_${idx + 1}`,
      name: customNames?.[color] || (idx === 0 && user?.displayName ? user.displayName : `Player ${color.toUpperCase()}`),
      avatar: idx === 0 && user?.photoURL ? user.photoURL : color === 'red' ? 'king' : color === 'green' ? 'dragon' : color === 'yellow' ? 'queen' : 'ninja',
      color,
      type: 'human',
      isReady: true,
      isTurn: idx === 0,
      hasWon: false,
      tokens: createInitialTokens(color),
      consecutiveSixes: 0,
      kills: 0,
      sixesRolled: 0,
    }));

    const newGame: GameState = {
      id: 'offline_' + Date.now().toString().slice(-6),
      mode: 'offline',
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: 0,
      prizePool: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: ['Game started! Pass & Play mode.'],
    };

    gameStateRef.current = newGame;
    setGameState(newGame);
    setChatMessages([]);
    setEmojiReactions([]);
  };

  /**
   * Start Play vs Computer AI match (Human vs Bots)
   */
  const startAiGame = (
    difficulty: AiDifficulty,
    wager: number,
    numPlayers: 2 | 4 = 4,
    userColor: PlayerColor = 'red',
    isFreeAdMatch: boolean = false
  ) => {
    cleanupTimers();
    soundManager.playClick();
    adsterraService.triggerMatchStartPopunder();

    if (wager > 0 && !isFreeAdMatch) {
      const debited = debitCoins(wager, 'game_entry', `Wager for AI Match vs Bots (${difficulty.toUpperCase()})`);
      if (!debited) return;
    }

    const totalParticipants = numPlayers;
    const effectiveWager = isFreeAdMatch ? 0 : wager;
    const prizePool = isFreeAdMatch
      ? (settings.freeAdMatchWinnerReward || 350)
      : effectiveWager > 0
      ? Math.floor(effectiveWager * totalParticipants * 0.9)
      : (settings.matchWinnerRewardCoins || 500);
    const botAvatars = ['robot', 'wolf', 'wizard', 'alien', 'ninja'];

    let selectedColors: PlayerColor[];
    if (numPlayers === 2) {
      // Opposite color pairing
      const oppositeMap: Record<PlayerColor, PlayerColor> = {
        red: 'yellow',
        yellow: 'red',
        blue: 'green',
        green: 'blue',
      };
      selectedColors = [userColor, oppositeMap[userColor]];
    } else {
      // Standard 4-player clockwise order starting with human's choice or clockwise
      selectedColors = ['red', 'green', 'yellow', 'blue'];
    }

    let botCounter = 0;
    const players: Player[] = selectedColors.map((color, idx) => {
      const isHuman = color === userColor;
      if (isHuman) {
        return {
          id: user?.uid || 'user_local',
          name: user?.displayName || 'You',
          avatar: user?.photoURL || (color === 'red' ? 'king' : color === 'green' ? 'dragon' : color === 'yellow' ? 'queen' : 'ninja'),
          color,
          type: 'human' as const,
          isReady: true,
          isTurn: idx === 0,
          hasWon: false,
          tokens: createInitialTokens(color),
          consecutiveSixes: 0,
          kills: 0,
          sixesRolled: 0,
        };
      } else {
        const botAvatar = botAvatars[botCounter % botAvatars.length];
        botCounter++;
        return {
          id: `bot_${color}`,
          name: `${difficulty === 'hard' ? 'Pro' : 'Bot'} ${color.charAt(0).toUpperCase() + color.slice(1)}`,
          avatar: botAvatar,
          color,
          type: 'ai' as const,
          aiDifficulty: difficulty,
          isReady: true,
          isTurn: idx === 0,
          hasWon: false,
          tokens: createInitialTokens(color),
          consecutiveSixes: 0,
          kills: 0,
          sixesRolled: 0,
        };
      }
    });

    const newGame: GameState = {
      id: 'ai_' + Date.now().toString().slice(-6),
      mode: 'ai',
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: isFreeAdMatch ? 0 : wager,
      prizePool,
      isFreeAdMatch,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [
        isFreeAdMatch
          ? `Started Free Ad-Unlocked Match vs ${difficulty.toUpperCase()} AI Bots!`
          : `Started vs ${difficulty.toUpperCase()} AI Bots (${numPlayers} Players)!`
      ],
    };

    gameStateRef.current = newGame;
    setGameState(newGame);
    setChatMessages([]);
    setEmojiReactions([]);
  };

  /**
   * Start Computer vs Computer Demo Simulation (4 AI Bots playing automatically)
   */
  const startComputerVsComputerGame = (difficulty: AiDifficulty = 'hard') => {
    cleanupTimers();
    soundManager.playClick();

    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const botAvatars = ['king', 'robot', 'wizard', 'ninja'];

    const players: Player[] = colors.map((color, idx) => ({
      id: `bot_${color}`,
      name: `Bot ${color.toUpperCase()}`,
      avatar: botAvatars[idx],
      color,
      type: 'ai',
      aiDifficulty: difficulty,
      isReady: true,
      isTurn: idx === 0,
      hasWon: false,
      tokens: createInitialTokens(color),
      consecutiveSixes: 0,
      kills: 0,
      sixesRolled: 0,
    }));

    const newGame: GameState = {
      id: 'bot_sim_' + Date.now().toString().slice(-6),
      mode: 'ai',
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: 0,
      prizePool: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: ['Started Computer vs Computer 4-Bot Match!'],
    };

    gameStateRef.current = newGame;
    setGameState(newGame);
    setChatMessages([]);
    setEmojiReactions([]);
  };

  /**
   * Start Online Random Matchmaking
   */
  const startOnlineRandomMatch = async (
    wager: number,
    customOpponents?: MatchedOpponent[],
    isFreeAdMatch: boolean = false
  ) => {
    cleanupTimers();
    soundManager.playClick();
    adsterraService.triggerMatchStartPopunder();

    if (wager > 0 && !isFreeAdMatch) {
      const debited = debitCoins(wager, 'game_entry', `Wager for Online Random Match`);
      if (!debited) return;
    }

    const effectiveWager = isFreeAdMatch ? 0 : wager;
    const prizePool = isFreeAdMatch
      ? (settings.freeAdMatchWinnerReward || 350)
      : effectiveWager > 0
      ? Math.floor(effectiveWager * 4 * 0.9)
      : (settings.matchWinnerRewardCoins || 500);

    const defaultOpponentPool: MatchedOpponent[] = [
      { name: 'Alex Knight', avatar: 'knight', color: 'green' as PlayerColor, country: '🇮🇳 India', rating: 1420 },
      { name: 'Queen Elena', avatar: 'queen', color: 'yellow' as PlayerColor, country: '🇺🇸 USA', rating: 1530 },
      { name: 'Vortex Shadow', avatar: 'ninja', color: 'blue' as PlayerColor, country: '🇬🇧 UK', rating: 1485 },
    ];

    const opponentPool = customOpponents && customOpponents.length === 3 ? customOpponents : defaultOpponentPool;

    // In online match, ALL players are human peers (no client-side AI simulation takes their turn)
    const players: Player[] = [
      {
        id: user?.uid || 'user_local',
        name: user?.displayName || 'You',
        avatar: user?.photoURL || 'king',
        color: 'red',
        type: 'human',
        isReady: true,
        isTurn: true,
        hasWon: false,
        tokens: createInitialTokens('red'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      ...opponentPool.map((opp, idx) => ({
        id: `online_peer_${idx}`,
        name: opp.name,
        avatar: opp.avatar,
        color: opp.color,
        type: 'human' as const,
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens(opp.color),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      })),
    ];

    const newGame: GameState = {
      id: 'online_' + Date.now().toString().slice(-6),
      mode: 'online_random',
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: isFreeAdMatch ? 0 : wager,
      prizePool,
      isFreeAdMatch,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [
        isFreeAdMatch
          ? 'Live Free Match Synchronized! Ad watched, rewards enabled.'
          : 'Live Match Synchronized! Real players in arena.'
      ],
    };

    socketService.setCurrentRoomId(newGame.id);
    gameStateRef.current = newGame;
    setGameState(newGame);
    setChatMessages([]);
    setEmojiReactions([]);
  };

  /**
   * Create Private Room with 6-char code
   */
  const createPrivateRoom = (wager: number, isFreeAdMatch: boolean = false): string => {
    cleanupTimers();
    soundManager.playClick();
    adsterraService.triggerMatchStartPopunder();

    if (wager > 0 && !isFreeAdMatch) {
      debitCoins(wager, 'game_entry', `Private Room Creation Wager`);
    }

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const effectiveWager = isFreeAdMatch ? 0 : wager;
    const prizePool = isFreeAdMatch
      ? (settings.freeAdMatchWinnerReward || 350)
      : effectiveWager > 0
      ? Math.floor(effectiveWager * 4 * 0.9)
      : (settings.matchWinnerRewardCoins || 500);

    socketService.createPrivateRoom(
      {
        uid: user?.uid || 'user_host',
        name: user?.displayName || 'Host',
        avatar: user?.photoURL || 'king',
      },
      effectiveWager,
      4
    );

    const players: Player[] = [
      {
        id: user?.uid || 'user_host',
        name: user?.displayName || 'Host',
        avatar: user?.photoURL || 'king',
        color: 'red',
        type: 'human',
        isReady: true,
        isTurn: true,
        hasWon: false,
        tokens: createInitialTokens('red'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: 'guest_g1',
        name: 'Friend Green',
        avatar: 'wolf',
        color: 'green',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('green'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: 'guest_y1',
        name: 'Friend Yellow',
        avatar: 'dragon',
        color: 'yellow',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('yellow'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: 'guest_b1',
        name: 'Friend Blue',
        avatar: 'ninja',
        color: 'blue',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('blue'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
    ];

    const newGame: GameState = {
      id: 'room_' + roomCode,
      mode: 'private_room',
      roomCode,
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: wager,
      prizePool,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [`Private Room ${roomCode} created! Share code with friends to join.`],
    };

    socketService.setCurrentRoomId(newGame.id);
    gameStateRef.current = newGame;
    setGameState(newGame);
    return roomCode;
  };

  /**
   * Join Private Room via Code
   */
  const joinPrivateRoom = async (roomCode: string, isFreeAdMatch: boolean = false): Promise<boolean> => {
    cleanupTimers();
    soundManager.playClick();
    adsterraService.triggerMatchStartPopunder();

    if (!roomCode || roomCode.length < 4) return false;

    socketService.joinPrivateRoom(
      {
        uid: user?.uid || 'user_guest',
        name: user?.displayName || 'Guest Player',
        avatar: user?.photoURL || 'ninja',
      },
      roomCode
    );

    const players: Player[] = [
      {
        id: 'host_p1',
        name: 'Room Host',
        avatar: 'crown',
        color: 'red',
        type: 'human',
        isReady: true,
        isTurn: true,
        hasWon: false,
        tokens: createInitialTokens('red'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: user?.uid || 'user_guest',
        name: user?.displayName || 'You',
        avatar: user?.photoURL || 'ninja',
        color: 'green',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('green'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: 'room_p3',
        name: 'Player Yellow',
        avatar: 'wizard',
        color: 'yellow',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('yellow'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
      {
        id: 'room_p4',
        name: 'Player Blue',
        avatar: 'robot',
        color: 'blue',
        type: 'human',
        isReady: true,
        isTurn: false,
        hasWon: false,
        tokens: createInitialTokens('blue'),
        consecutiveSixes: 0,
        kills: 0,
        sixesRolled: 0,
      },
    ];

    const newGame: GameState = {
      id: 'room_' + roomCode.toUpperCase(),
      mode: 'private_room',
      roomCode: roomCode.toUpperCase(),
      status: 'playing',
      players,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: 100,
      prizePool: 360,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [`Joined Room ${roomCode.toUpperCase()}! Real-time match active.`],
    };

    socketService.setCurrentRoomId(newGame.id);
    gameStateRef.current = newGame;
    setGameState(newGame);
    return true;
  };

  /**
   * Send in-game chat message
   */
  const sendChatMessage = (text: string, isQuickChat = false) => {
    if (!text.trim()) return;
    const activePlayer = gameState?.players.find((p) => p.id === user?.uid) || gameState?.players[0];

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: user?.uid || 'user',
      senderName: user?.displayName || 'You',
      senderAvatar: user?.photoURL || 'king',
      senderColor: activePlayer?.color || 'red',
      text: text.trim(),
      timestamp: Date.now(),
      isQuickChat,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    soundManager.playMessageSent();

    // Broadcast to real players via WebSocket
    if (gameState && (gameState.mode === 'online_random' || gameState.mode === 'private_room')) {
      socketService.sendChatMessage(gameState.id, newMsg);
    }
  };

  /**
   * Trigger floating emoji animation across the board
   */
  const triggerEmojiReaction = (emoji: string) => {
    const activePlayer = gameState?.players.find((p) => p.id === user?.uid) || gameState?.players[0];

    const newReaction: EmojiReaction = {
      id: `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: user?.uid || 'user',
      senderColor: activePlayer?.color || 'red',
      emoji,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      timestamp: Date.now(),
    };

    setEmojiReactions((prev) => [...prev, newReaction]);

    const emojiMsg: ChatMessage = {
      id: `chat_emoji_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: user?.uid || 'user',
      senderName: user?.displayName || 'You',
      senderAvatar: user?.photoURL || 'king',
      senderColor: activePlayer?.color || 'red',
      text: emoji,
      timestamp: Date.now(),
      isQuickChat: true,
    };
    setChatMessages((prev) => [...prev, emojiMsg]);
    soundManager.playMessageSent();

    // Broadcast to real players via WebSocket
    if (gameState && (gameState.mode === 'online_random' || gameState.mode === 'private_room')) {
      socketService.sendEmojiReaction(gameState.id, emoji, activePlayer?.color || 'red');
    }
  };

  const surrenderMatch = () => {
    const currentState = gameStateRef.current;
    if (!currentState) return;
    cleanupTimers();
    soundManager.playCapture();

    // Identify the player surrendering (current user or 1st human player)
    const surrenderingPlayer =
      currentState.players.find((p) => p.id === user?.uid) || currentState.players[0];
    const otherPlayers = currentState.players.filter(
      (p) => p.id !== surrenderingPlayer?.id && !p.isForfeited
    );
    const opponentWinner =
      otherPlayers[0] || currentState.players[1] || currentState.players[0];

    // Mark current user as forfeited/loss in profile & award consolation coins
    if (user) {
      const loserReward = currentState.isFreeAdMatch
        ? (settings.freeAdMatchLoserReward || settings.matchLoserRewardCoins || 60)
        : (settings.matchLoserRewardCoins || 50);

      if (loserReward > 0) {
        creditCoins(loserReward, 'game_loss_consolation', 'Match Surrender / Participation Reward');
      }

      trackMissionEvent('play_matches', 1);
      const nextGames = (user.totalGames || 0) + 1;
      const nextStreak = 0; // Win streak broken on surrender/loss
      const nextXp = (user.xp || 0) + 20;
      updateProfile({
        totalGames: nextGames,
        winStreak: nextStreak,
        xp: nextXp,
      });
    }

    // Inform server in online mode
    if (currentState.mode === 'online_random' || currentState.mode === 'private_room') {
      socketService.leaveGame(
        currentState.id,
        user?.uid || surrenderingPlayer?.id || ''
      );
    }

    const updatedPlayers = currentState.players.map((p) => {
      if (p.id === surrenderingPlayer?.id) {
        return { ...p, isForfeited: true, hasWon: false };
      }
      if (p.id === opponentWinner?.id) {
        return { ...p, hasWon: true, rank: 1 };
      }
      return p;
    });

    const finishedState: GameState = {
      ...currentState,
      players: updatedPlayers,
      status: 'finished',
      winner: opponentWinner,
      rankings: [
        opponentWinner,
        ...updatedPlayers.filter((p) => p.id !== opponentWinner.id),
      ],
      forfeitInfo: {
        forfeitedPlayerId: surrenderingPlayer?.id || 'user',
        forfeitedPlayerName: surrenderingPlayer?.name || 'You',
        winnerPlayerId: opponentWinner?.id,
        winnerPlayerName: opponentWinner?.name,
        reason: 'Match forfeited by player exit',
      },
      logs: [
        ...currentState.logs,
        `⚠️ ${surrenderingPlayer?.name || 'Player'} has surrendered and forfeited the game. ${opponentWinner?.name || 'Opponent'} is declared the Winner!`,
      ],
      lastAction: {
        type: 'skip',
        text: `${surrenderingPlayer?.name || 'Player'} forfeited the match.`,
        color: surrenderingPlayer?.color || 'red',
        timestamp: Date.now(),
      },
    };

    gameStateRef.current = finishedState;
    setGameState(finishedState);
  };

  const leaveGame = () => {
    const currentState = gameStateRef.current;
    if (currentState && currentState.status === 'playing') {
      // User is quitting mid-game -> record loss
      if (user) {
        trackMissionEvent('play_matches', 1);
        updateProfile({
          totalGames: (user.totalGames || 0) + 1,
          winStreak: 0,
          xp: (user.xp || 0) + 20,
        });
      }
      if (currentState.mode === 'online_random' || currentState.mode === 'private_room') {
        socketService.leaveGame(currentState.id, user?.uid || '');
      }
    }
    cleanupTimers();
    soundManager.playClick();
    gameStateRef.current = null;
    setGameState(null);
  };

  const rematch = () => {
    if (!gameState) return;
    if (gameState.mode === 'offline') {
      startOfflineGame(gameState.players.length as 2 | 3 | 4);
    } else if (gameState.mode === 'ai') {
      startAiGame('medium', gameState.betAmount);
    } else {
      startOnlineRandomMatch(gameState.betAmount);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        isInGame: !!gameState && gameState.status !== 'finished',
        chatMessages,
        emojiReactions,
        startOfflineGame,
        startAiGame,
        startComputerVsComputerGame,
        startOnlineRandomMatch,
        createPrivateRoom,
        joinPrivateRoom,
        rollDice,
        selectTokenToMove,
        sendChatMessage,
        triggerEmojiReaction,
        surrenderMatch,
        leaveGame,
        rematch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
