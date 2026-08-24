export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GameMode = 'offline' | 'ai' | 'online_random' | 'private_room' | 'tournament';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

export type PlayerType = 'human' | 'ai' | 'remote';

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  step: number; // -1: Base, 0..50: Main common path, 51..55: Home stretch column, 56: Home goal
  isBase: boolean;
  isHome: boolean;
  positionHistory: number[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  type: PlayerType;
  aiDifficulty?: AiDifficulty;
  isReady: boolean;
  isTurn: boolean;
  hasWon: boolean;
  isForfeited?: boolean;
  rank?: number; // 1st, 2nd, 3rd, 4th
  tokens: Token[];
  consecutiveSixes: number;
  kills: number;
  sixesRolled: number;
  isDisconnected?: boolean;
  disconnectTimeRemaining?: number; // seconds before forfeit
  coinWager?: number;
}

export interface MoveStep {
  tokenId: number;
  color: PlayerColor;
  fromStep: number;
  toStep: number;
}

export interface GameState {
  id: string;
  mode: GameMode;
  roomCode?: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  players: Player[];
  activePlayerIndex: number;
  currentDice: number | null;
  diceRolled: boolean;
  isRolling: boolean;
  movableTokens: number[]; // token IDs that can legally move
  winner: Player | null;
  rankings: Player[];
  turnTimer: number; // countdown in seconds (e.g., 15s)
  maxTurnTimer: number;
  betAmount: number;
  prizePool: number;
  createdAt: number;
  updatedAt: number;
  logs: string[];
  isAnimatingMove?: boolean;
  isFreeAdMatch?: boolean;
  forfeitInfo?: {
    forfeitedPlayerId: string;
    forfeitedPlayerName: string;
    winnerPlayerId?: string;
    winnerPlayerName?: string;
    reason?: string;
  } | null;
  highlightedPath?: { color: PlayerColor; steps: number[] } | null;
  bonusNotification?: { type: 'extra_six' | 'capture' | 'home'; text: string } | null;
  lastAction?: {
    type: 'roll' | 'move' | 'capture' | 'home' | 'skip';
    text: string;
    color: PlayerColor;
    timestamp: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor?: PlayerColor;
  text: string;
  timestamp: number;
  isQuickChat?: boolean;
}

export interface EmojiReaction {
  id: string;
  senderId: string;
  senderColor: PlayerColor;
  emoji: string;
  x: number; // percent across board 0..100
  y: number; // percent across board 0..100
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  coins: number;
  xp: number;
  level: number;
  totalGames: number;
  totalWins: number;
  totalKills: number;
  totalSixes: number;
  winStreak: number;
  highestWinStreak: number;
  favoriteColor: PlayerColor;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  totalReferrals: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  isBanned: boolean;
  lastDailyBonusClaim?: string; // YYYY-MM-DD
  dailyStreak: number;
  lastSpinTimestamp?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  category: 'game_win' | 'game_loss_consolation' | 'game_entry' | 'daily_bonus' | 'lucky_spin' | 'referral' | 'rewarded_ad' | 'adsterra_reward' | 'withdrawal' | 'admin_adjustment' | 'tournament_prize';
  amount: number;
  description: string;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  timestamp: number;
  referenceId?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  coinsAmount: number;
  cashAmount: number;
  currency: string;
  method: 'upi' | 'bank_transfer';
  upiId?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    holderName: string;
    bankName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  payoutTxnId?: string;
  createdAt: number;
  processedAt?: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  type: 'roll_six' | 'capture_pawn' | 'win_match' | 'play_matches' | 'spin_wheel';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: 4 | 8 | 16;
  registeredPlayerIds: string[];
  status: 'upcoming' | 'registering' | 'live' | 'completed';
  startTime: number;
  currentRound: number;
  totalRounds: number;
  winnerId?: string;
  winnerName?: string;
}

export interface GlobalSettings {
  coinToCashRate: number; // e.g., 1000 coins = $1.00
  currencySymbol: string;
  minWithdrawalCoins: number;
  dailyBonusRewards: number[]; // 7 days values
  luckySpinCooldownHours: number;
  referralRewardCoins: number;
  rewardedAdCoins: number;
  gameCommissionPercent: number;
  // Match Rewards (Managed by Admin)
  matchWinnerRewardCoins: number; // Coins rewarded to winner of match
  matchLoserRewardCoins: number; // Coins rewarded to loser/consolation
  freeAdMatchWinnerReward: number; // Coins rewarded for free ad-entry match win
  freeAdMatchLoserReward: number; // Coins rewarded for free ad-entry match loss
  // Adsterra Ads Configuration (Managed by Admin)
  adsterraEnabled: boolean; // Master toggle for Adsterra network
  adsterraDirectLink: string; // Adsterra direct link / smartlink URL
  adsterraBannerKey: string; // Adsterra banner unit script/zone ID
  adsterraPopunderEnabled: boolean; // Popunder trigger on match join
  adsterraAdWatchReward: number; // Coins given when user watches an Adsterra ad
  freeMatchAdEntryEnabled: boolean; // Allow all games to be played 100% free by watching ad
}

export interface OnlinePlayer {
  uid: string;
  displayName: string;
  photoURL: string;
  coins: number;
  level: number;
  totalWins: number;
  winRate?: string;
  rating?: number;
  status: 'online' | 'in_lobby' | 'playing' | 'matchmaking';
  statusText: string;
  gameMode?: string;
  lastActive: number;
  isOnline?: boolean;
  isRealUser?: boolean;
  isCurrentUser?: boolean;
}




