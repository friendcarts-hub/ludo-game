import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Smile, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../../types';
import { QUICK_CHAT_MESSAGES, EMOJI_REACTIONS } from '../../data/avatars';

interface InGameChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, isQuick?: boolean) => void;
  onSendEmoji: (emoji: string) => void;
}

export const InGameChatModal: React.FC<InGameChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onSendEmoji,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">In-Game Chat & Reactions</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji Reactions Bar */}
        <div className="py-3 border-b border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-yellow-400" /> TAP TO SEND BOARD REACTION
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EMOJI_REACTIONS.map((emoji, idx) => (
              <button
                key={`modal-emoji-${emoji}-${idx}`}
                onClick={() => {
                  onSendEmoji(emoji);
                }}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all text-xl flex items-center justify-center shrink-0 border border-slate-700/50 cursor-pointer shadow-md"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-[160px] max-h-[220px] pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No messages yet. Send a quick phrase or emoji!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={`modal-msg-${msg.id || idx}-${idx}`}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs flex items-start gap-2"
              >
                <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center font-bold text-[10px] text-amber-400 shrink-0">
                  {msg.senderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{msg.senderName}</span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5 break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Phrases */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 mb-2">QUICK PHRASES</p>
          <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
            {QUICK_CHAT_MESSAGES.map((phrase, idx) => (
              <button
                key={`modal-phrase-${phrase}-${idx}`}
                onClick={() => {
                  onSendMessage(phrase, true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700/40 truncate text-left transition-colors cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={100}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
