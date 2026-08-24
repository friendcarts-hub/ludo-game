import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Smile,
  LogOut,
  Volume2,
  VolumeX,
  Sliders,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { LudoBoard } from '../board/LudoBoard';
import { CornerPlayerStation } from '../board/CornerPlayerStation';
import { EmojiReactionOverlay } from '../board/EmojiReactionOverlay';
import { InGameChatSidePanel } from '../board/InGameChatSidePanel';
import { VictoryModal } from '../modals/VictoryModal';
import { ExitGameModal } from '../modals/ExitGameModal';
import { SettingsModal } from '../modals/SettingsModal';
import { soundManager, useSoundManager } from '../../game/audio';
import { EMOJI_REACTIONS } from '../../data/avatars';

export const GamePlayScreen: React.FC = () => {
  const { user } = useAuth();
  const { isMuted, toggleMute } = useSoundManager();
  const {
    gameState,
    chatMessages,
    emojiReactions,
    rollDice,
    selectTokenToMove,
    sendChatMessage,
    triggerEmojiReaction,
    surrenderMatch,
    leaveGame,
    rematch,
  } = useGame();

  const [isChatSidePanelOpen, setIsChatSidePanelOpen] = useState(false);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [tiltDegree, setTiltDegree] = useState(0);

  // Update read messages count when panel is opened
  useEffect(() => {
    if (isChatSidePanelOpen) {
      setLastSeenMessageCount(chatMessages.length);
    }
  }, [isChatSidePanelOpen, chatMessages.length]);

  const unreadMessagesCount = isChatSidePanelOpen
    ? 0
    : Math.max(0, chatMessages.length - lastSeenMessageCount);

  if (!gameState) return null;

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Separate players by layout positions:
  // Red = Bottom-Left, Green = Top-Left, Yellow = Top-Right, Blue = Bottom-Right
  const redPlayer = gameState.players.find((p) => p.color === 'red');
  const greenPlayer = gameState.players.find((p) => p.color === 'green');
  const yellowPlayer = gameState.players.find((p) => p.color === 'yellow');
  const bluePlayer = gameState.players.find((p) => p.color === 'blue');

  const handleExitClick = () => {
    soundManager.playClick();
    setIsExitModalOpen(true);
  };

  const handleSoundClick = () => {
    toggleMute();
  };

  const handleChatClick = () => {
    soundManager.playClick();
    setIsChatSidePanelOpen((prev) => !prev);
  };

  const handleSettingsClick = () => {
    soundManager.playClick();
    setIsSettingsModalOpen(true);
  };

  return (
    <div
      id="gameplay-arena"
      className="w-full min-h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-between p-1 sm:p-3 relative select-none overflow-hidden bg-gradient-to-b from-[#060818] via-[#03040c] to-[#060818]"
    >
      {/* Immersive background glow effects */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-cyan-500/10" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-blue-600/10" />

      {/* Floating Emojis over board */}
      <EmojiReactionOverlay reactions={emojiReactions} />

      {/* TOP NAVIGATION BAR: ONLY Exit, Sound, Chat, Settings */}
      <div className="w-full max-w-[min(95vw,440px)] sm:max-w-[540px] bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl px-2.5 sm:px-4 py-1.5 flex items-center justify-between shadow-2xl z-20 shrink-0">
        {/* 1. EXIT BUTTON */}
        <button
          id="btn-game-exit"
          onClick={handleExitClick}
          title="Exit / Forfeit Game"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">EXIT</span>
        </button>

        {/* Center Match Mode Pill */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wide">
            {gameState.mode.replace('_', ' ')}
          </span>
          {gameState.roomCode && (
            <span className="text-[9px] font-mono font-bold text-cyan-300">
              #{gameState.roomCode}
            </span>
          )}
        </div>

        {/* Right Action Controls: SOUND, CHAT, SETTINGS */}
        <div className="flex items-center gap-1.5">
          {/* 2. SOUND BUTTON */}
          <button
            id="btn-game-sound"
            onClick={handleSoundClick}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className={`p-2 rounded-xl transition-all cursor-pointer relative shadow-sm border active:scale-95 ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* 3. CHAT BUTTON */}
          <button
            id="btn-game-chat"
            onClick={handleChatClick}
            title={isChatSidePanelOpen ? 'Close In-Game Chat' : 'Open In-Game Chat'}
            className={`p-2 rounded-xl transition-all cursor-pointer relative shadow-sm border active:scale-95 ${
              isChatSidePanelOpen
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-cyan-400 border-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1 min-w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* 4. SETTINGS BUTTON */}
          <button
            id="btn-game-settings"
            onClick={handleSettingsClick}
            title="Game Settings (3D Tilt, Audio, Rules)"
            className="p-2 rounded-xl transition-all cursor-pointer relative shadow-sm border bg-white/5 hover:bg-white/10 text-amber-400 border-white/10 active:scale-95"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME ARENA: OCCUPIES 90-95% OF MOBILE SCREEN */}
      <div
        className={`w-full max-w-4xl flex flex-col items-center justify-center gap-1 sm:gap-2 my-auto transition-all duration-300 ${
          isChatSidePanelOpen ? 'lg:pr-40 xl:pr-60' : ''
        }`}
      >
        {/* TOP ROW: BLUE & RED PLAYER STATIONS */}
        <div className="w-full max-w-[min(98vw,min(76vh,520px))] xs:max-w-[min(98vw,min(78vh,550px))] sm:max-w-[560px] md:max-w-[600px] lg:max-w-[640px] flex items-center justify-between gap-1.5 px-0.5">
          {bluePlayer ? (
            <CornerPlayerStation
              player={bluePlayer}
              isActive={activePlayer?.color === 'blue'}
              isRolling={gameState.isRolling}
              currentDice={gameState.currentDice}
              diceRolled={gameState.diceRolled}
              canRoll={!gameState.diceRolled && !gameState.isRolling}
              turnTimer={gameState.turnTimer}
              maxTurnTimer={gameState.maxTurnTimer}
              onRoll={rollDice}
              position="top-left"
            />
          ) : (
            <div />
          )}

          {redPlayer ? (
            <CornerPlayerStation
              player={redPlayer}
              isActive={activePlayer?.color === 'red'}
              isRolling={gameState.isRolling}
              currentDice={gameState.currentDice}
              diceRolled={gameState.diceRolled}
              canRoll={!gameState.diceRolled && !gameState.isRolling}
              turnTimer={gameState.turnTimer}
              maxTurnTimer={gameState.maxTurnTimer}
              onRoll={rollDice}
              position="top-right"
            />
          ) : (
            <div />
          )}
        </div>

        {/* CENTER ROW: 15x15 BOARD (90-95% MOBILE SCREEN WIDTH) */}
        <div className="relative flex items-center justify-center w-full">
          <LudoBoard
            gameState={gameState}
            onSelectToken={selectTokenToMove}
            is3D={is3DView}
            viewTilt={tiltDegree}
          />
        </div>

        {/* BOTTOM ROW: YELLOW & GREEN PLAYER STATIONS */}
        <div className="w-full max-w-[min(98vw,min(76vh,520px))] xs:max-w-[min(98vw,min(78vh,550px))] sm:max-w-[560px] md:max-w-[600px] lg:max-w-[640px] flex items-center justify-between gap-1.5 px-0.5">
          {yellowPlayer ? (
            <CornerPlayerStation
              player={yellowPlayer}
              isActive={activePlayer?.color === 'yellow'}
              isRolling={gameState.isRolling}
              currentDice={gameState.currentDice}
              diceRolled={gameState.diceRolled}
              canRoll={!gameState.diceRolled && !gameState.isRolling}
              turnTimer={gameState.turnTimer}
              maxTurnTimer={gameState.maxTurnTimer}
              onRoll={rollDice}
              position="bottom-left"
            />
          ) : (
            <div />
          )}

          {greenPlayer ? (
            <CornerPlayerStation
              player={greenPlayer}
              isActive={activePlayer?.color === 'green'}
              isRolling={gameState.isRolling}
              currentDice={gameState.currentDice}
              diceRolled={gameState.diceRolled}
              canRoll={!gameState.diceRolled && !gameState.isRolling}
              turnTimer={gameState.turnTimer}
              maxTurnTimer={gameState.maxTurnTimer}
              onRoll={rollDice}
              position="bottom-right"
            />
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* BOTTOM ACTION BAR: TURN STATUS & QUICK REACTION PILLS */}
      <div
        className={`w-full max-w-md flex flex-col items-center justify-center gap-1 z-20 pb-0.5 transition-all duration-300 shrink-0 h-[64px] ${
          isChatSidePanelOpen ? 'lg:pr-40 xl:pr-60' : ''
        }`}
      >
        {/* Turn Action Banner with stable fixed height */}
        <div className="h-7 w-full flex items-center justify-center">
          {activePlayer?.type === 'human' && !gameState.diceRolled && !gameState.isRolling ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={rollDice}
              className="flex items-center gap-2 px-5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer ring-2 ring-white/50"
            >
              <span className="text-sm">🎲</span>
              <span>ROLL DICE</span>
            </motion.button>
          ) : activePlayer?.type === 'human' && gameState.movableTokens.length > 1 ? (
            <div className="text-[11px] font-extrabold tracking-wide px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              ✨ SELECT WHICH PAWN TO MOVE
            </div>
          ) : (
            <div className="text-[11px] font-bold text-slate-400/90 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{activePlayer ? `${activePlayer.name}'s turn` : 'Playing...'}</span>
            </div>
          )}
        </div>

        {/* Quick Emoji Reaction Pill Strip */}
        <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-full px-2.5 py-0.5 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 mr-0.5 flex items-center gap-0.5">
            <Smile className="w-3 h-3 text-cyan-400" />
          </span>
          {EMOJI_REACTIONS.slice(0, 6).map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerEmojiReaction(emoji)}
              className="text-sm sm:text-base hover:scale-125 active:scale-95 transition-transform cursor-pointer px-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* IN-GAME CHAT SIDE-PANEL */}
      <InGameChatSidePanel
        isOpen={isChatSidePanelOpen}
        onToggle={handleChatClick}
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        onSendEmoji={triggerEmojiReaction}
        currentUserId={user?.uid}
      />

      {/* EXIT / SURRENDER CONFIRMATION MODAL */}
      <ExitGameModal
        isOpen={isExitModalOpen}
        gameState={gameState}
        onClose={() => setIsExitModalOpen(false)}
        onForfeit={() => {
          setIsExitModalOpen(false);
          surrenderMatch();
        }}
        onLeave={() => {
          setIsExitModalOpen(false);
          leaveGame();
        }}
        onRestart={() => {
          setIsExitModalOpen(false);
          rematch();
        }}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        is3DView={is3DView}
        onToggle3D={() => setIs3DView((prev) => !prev)}
        tiltDegree={tiltDegree}
        onChangeTilt={(deg) => setTiltDegree(deg)}
        onRestartGame={rematch}
      />

      {/* VICTORY CELEBRATION MODAL */}
      {gameState.status === 'finished' && (
        <VictoryModal gameState={gameState} onRematch={rematch} onLeave={leaveGame} />
      )}
    </div>
  );
};
