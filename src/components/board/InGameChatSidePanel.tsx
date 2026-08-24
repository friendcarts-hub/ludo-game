import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Smile,
  Send,
  X,
  Sparkles,
  Swords,
  Crown,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Trash2,
  Check,
  Zap,
} from 'lucide-react';
import { ChatMessage, PlayerColor } from '../../types';
import { AVATAR_LIST, QUICK_CHAT_CATEGORIES, EMOJI_REACTIONS } from '../../data/avatars';
import { soundManager } from '../../game/audio';

interface InGameChatSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, isQuick?: boolean) => void;
  onSendEmoji: (emoji: string) => void;
  currentUserId?: string;
}

export const InGameChatSidePanel: React.FC<InGameChatSidePanelProps> = ({
  isOpen,
  onToggle,
  messages,
  onSendMessage,
  onSendEmoji,
  currentUserId,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeCategory, setActiveCategory] = useState<'greetings' | 'tactics' | 'reactions' | 'taunts'>('greetings');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, false);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleQuickPhraseClick = (phrase: string) => {
    soundManager.playClick();
    onSendMessage(phrase, true);
  };

  const handleEmojiClick = (emoji: string) => {
    onSendEmoji(emoji);
  };

  const getPlayerColorGlow = (color?: PlayerColor) => {
    switch (color) {
      case 'red':
        return 'border-red-500/40 bg-red-500/10 text-red-400';
      case 'green':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
      case 'yellow':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
      case 'blue':
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400';
      default:
        return 'border-purple-500/40 bg-purple-500/10 text-purple-400';
    }
  };

  const activeCategoryObj = QUICK_CHAT_CATEGORIES.find((c) => c.id === activeCategory) || QUICK_CHAT_CATEGORIES[0];

  return (
    <>
      {/* Mobile / Tablet Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDE PANEL DRAWER */}
      <motion.aside
        id="in-game-chat-sidepanel"
        initial={false}
        animate={{
          x: isOpen ? 0 : '100%',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className={`fixed top-16 right-0 bottom-0 w-full sm:w-80 md:w-88 lg:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.6)] z-40 flex flex-col justify-between overflow-hidden`}
      >
        {/* PANEL HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">Live Match Chat</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Real-time tactics & emojis</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              title="Close chat side-panel"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EMOJI REACTION QUICK BAR */}
        <div className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 tracking-wider">
              <Smile className="w-3 h-3 text-yellow-400" /> Tap to React
            </span>
            <span className="text-[9px] text-slate-500">Board + Chat</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {EMOJI_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-base flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CHAT MESSAGES SCROLLABLE FEED */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px] text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mb-2 border border-white/5">
                <MessageSquare className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-xs font-bold text-slate-400">Match Chat is Ready</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Send a quick tactic or emoji reaction to your opponents!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId || msg.senderName === 'You';
              const avatarObj = AVATAR_LIST.find((a) => a.id === msg.senderAvatar);
              const emojiDisplay = avatarObj?.emoji || '👑';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    {!isMe && (
                      <span className="text-xs">{emojiDisplay}</span>
                    )}
                    <span className="text-[10px] font-black text-slate-400">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    {msg.senderColor && (
                      <span className={`text-[8px] font-bold uppercase px-1 rounded-sm border ${getPlayerColorGlow(msg.senderColor)}`}>
                        {msg.senderColor}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-md text-xs break-words border ${
                      isMe
                        ? 'bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-cyan-500/10 border-cyan-500/40 text-cyan-50 rounded-tr-xs'
                        : 'bg-slate-900 border-white/10 text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.isQuickChat && !msg.text.includes(' ') && msg.text.length <= 4 ? (
                      <span className="text-2xl block py-0.5">{msg.text}</span>
                    ) : (
                      <span className="font-medium leading-relaxed">{msg.text}</span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK CHAT TABS & PHRASES SELECTOR */}
        <div className="border-t border-white/10 bg-slate-950/80 p-2.5">
          <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_CHAT_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
            {activeCategoryObj.phrases.map((phrase) => (
              <motion.button
                key={phrase}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickPhraseClick(phrase)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-[11px] font-bold text-slate-300 hover:text-white border border-white/5 hover:border-cyan-500/30 truncate text-left transition-all cursor-pointer shadow-xs"
              >
                {phrase}
              </motion.button>
            ))}
          </div>
        </div>

        {/* BOTTOM MESSAGE INPUT BAR */}
        <div className="p-3 border-t border-white/10 bg-slate-900/90">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type in-game chat..."
                maxLength={80}
                className="w-full bg-slate-950 border border-white/15 focus:border-cyan-400 rounded-2xl pl-3.5 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none shadow-inner transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-600">
                {inputText.length}/80
              </span>
            </div>

            <motion.button
              type="submit"
              disabled={!inputText.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:scale-100 text-slate-950 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md font-bold"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </motion.aside>
    </>
  );
};
