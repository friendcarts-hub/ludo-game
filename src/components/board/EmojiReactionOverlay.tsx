import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmojiReaction } from '../../types';

interface EmojiReactionOverlayProps {
  reactions: EmojiReaction[];
}

export const EmojiReactionOverlay: React.FC<EmojiReactionOverlayProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {reactions.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.35, 1.1, 0.8],
              y: -80,
              rotate: [0, -10, 10, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            className="flex items-center justify-center p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md"
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-lg select-none">
              {item.emoji}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
