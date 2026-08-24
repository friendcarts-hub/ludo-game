export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  borderAccent: string;
  category: 'royalty' | 'cyber' | 'beast' | 'legend';
}

export const AVATAR_LIST: AvatarOption[] = [
  { id: 'king', name: 'Ludo King', emoji: '👑', bgGradient: 'from-amber-500 to-yellow-600', borderAccent: 'border-yellow-400', category: 'royalty' },
  { id: 'queen', name: 'Board Queen', emoji: '👸', bgGradient: 'from-pink-500 to-rose-600', borderAccent: 'border-rose-400', category: 'royalty' },
  { id: 'wizard', name: 'Dice Wizard', emoji: '🧙‍♂️', bgGradient: 'from-purple-600 to-indigo-700', borderAccent: 'border-purple-400', category: 'legend' },
  { id: 'ninja', name: 'Shadow Ninja', emoji: '🥷', bgGradient: 'from-slate-800 to-zinc-950', borderAccent: 'border-slate-400', category: 'legend' },
  { id: 'dragon', name: 'Fire Dragon', emoji: '🐉', bgGradient: 'from-red-600 to-orange-700', borderAccent: 'border-red-400', category: 'beast' },
  { id: 'lion', name: 'Golden Lion', emoji: '🦁', bgGradient: 'from-amber-600 to-orange-600', borderAccent: 'border-amber-400', category: 'beast' },
  { id: 'wolf', name: 'Cyber Wolf', emoji: '🐺', bgGradient: 'from-cyan-600 to-blue-700', borderAccent: 'border-cyan-400', category: 'cyber' },
  { id: 'robot', name: 'Mecha Bot', emoji: '🤖', bgGradient: 'from-emerald-500 to-teal-700', borderAccent: 'border-emerald-400', category: 'cyber' },
  { id: 'pirate', name: 'Grand Captain', emoji: '🏴‍☠️', bgGradient: 'from-amber-900 to-stone-900', borderAccent: 'border-amber-600', category: 'legend' },
  { id: 'tiger', name: 'Neon Tiger', emoji: '🐯', bgGradient: 'from-orange-500 to-amber-600', borderAccent: 'border-orange-400', category: 'beast' },
  { id: 'alien', name: 'Cosmic Alien', emoji: '👽', bgGradient: 'from-lime-500 to-green-700', borderAccent: 'border-lime-400', category: 'cyber' },
  { id: 'ghost', name: 'Dice Phantom', emoji: '👻', bgGradient: 'from-indigo-400 to-purple-700', borderAccent: 'border-indigo-300', category: 'legend' },
  { id: 'eagle', name: 'Storm Eagle', emoji: '🦅', bgGradient: 'from-blue-500 to-indigo-800', borderAccent: 'border-blue-400', category: 'beast' },
  { id: 'knight', name: 'Valiant Knight', emoji: '🛡️', bgGradient: 'from-slate-600 to-slate-800', borderAccent: 'border-slate-300', category: 'royalty' },
  { id: 'joker', name: 'Wild Card', emoji: '🃏', bgGradient: 'from-fuchsia-600 to-pink-700', borderAccent: 'border-fuchsia-400', category: 'legend' },
  { id: 'trophy', name: 'Champion', emoji: '🏆', bgGradient: 'from-yellow-400 to-amber-600', borderAccent: 'border-yellow-300', category: 'royalty' },
];

export const QUICK_CHAT_MESSAGES = [
  'Good luck everyone! 🎲',
  'Nice roll! 🔥',
  'Oh no! 😱',
  'Almost had me! 😉',
  'Time for a Six! 🎯',
  'Watch your back! ⚔️',
  'Well played! 👏',
  'Rematch after this? 🔁',
  'Speed up please! ⏳',
  'Ludo Champion vibes! 👑',
];

export interface QuickChatCategory {
  id: 'tactics' | 'greetings' | 'reactions' | 'taunts';
  name: string;
  iconName: string;
  phrases: string[];
}

export const QUICK_CHAT_CATEGORIES: QuickChatCategory[] = [
  {
    id: 'greetings',
    name: 'Greetings',
    iconName: 'Sparkles',
    phrases: [
      'Good luck everyone! 🎲',
      'Hello fellow players! 👋',
      'May the best roller win! 🏆',
      'Ready to roll! ⚡',
    ],
  },
  {
    id: 'tactics',
    name: 'Tactics',
    iconName: 'Swords',
    phrases: [
      'Watch your back! ⚔️',
      'Time for a Six! 🎯',
      'Heading for home! 🏁',
      'Safe tile saved me! 🛡️',
      'Speed up please! ⏳',
    ],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    iconName: 'Smile',
    phrases: [
      'Nice roll! 🔥',
      'Oh no! 😱',
      'Almost had me! 😉',
      'Well played! 👏',
      'Oops, that was close! 😅',
    ],
  },
  {
    id: 'taunts',
    name: 'Celebrations',
    iconName: 'Crown',
    phrases: [
      'Ludo Champion vibes! 👑',
      'Unstoppable momentum! 🚀',
      'Rematch after this? 🔁',
      'GG well played! 🎉',
    ],
  },
];

export const EMOJI_REACTIONS = [
  '🔥',
  '😂',
  '🎯',
  '👑',
  '😱',
  '🎲',
  '❤️',
  '😎',
  '💀',
  '🎉',
  '🍀',
  '⚡',
  '👏',
  '🛡️',
  '🚀',
  '😭',
];

