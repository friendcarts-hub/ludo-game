import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Player, PlayerColor, Token, GameState } from './src/types';
import { executeTokenMove, getMovableTokens, getNextPlayerIndex } from './src/game/ludoRules';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Simple Server Storage for Users & Auth Sessions ---
interface BackendUser {
  uid: string;
  email: string;
  passwordHash?: string;
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
  favoriteColor: 'red' | 'green' | 'yellow' | 'blue';
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  totalReferrals: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  isBanned: boolean;
  dailyStreak: number;
  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Initial default seed users
const DEFAULT_USERS: BackendUser[] = [
  {
    uid: 'user_master_001',
    email: 'player@ludoverse.io',
    passwordHash: hashPassword('password123'),
    displayName: 'Ludo Master',
    photoURL: 'king',
    role: 'user',
    coins: 3500,
    xp: 450,
    level: 3,
    totalGames: 14,
    totalWins: 9,
    totalKills: 28,
    totalSixes: 62,
    winStreak: 2,
    highestWinStreak: 4,
    favoriteColor: 'red',
    referralCode: 'LUDO777',
    referralEarnings: 750,
    totalReferrals: 3,
    kycStatus: 'unverified',
    isBanned: false,
    dailyStreak: 3,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now(),
  },
  {
    uid: 'user_admin_001',
    email: 'donarajwade@gmail.com',
    passwordHash: hashPassword('admin123'),
    displayName: 'Dona Rajwade (Admin)',
    photoURL: 'queen',
    role: 'admin',
    coins: 50000,
    xp: 2400,
    level: 10,
    totalGames: 85,
    totalWins: 64,
    totalKills: 210,
    totalSixes: 340,
    winStreak: 8,
    highestWinStreak: 12,
    favoriteColor: 'yellow',
    referralCode: 'DONA777',
    referralEarnings: 4500,
    totalReferrals: 18,
    kycStatus: 'verified',
    isBanned: false,
    dailyStreak: 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now(),
  },
];

let usersDatabase: BackendUser[] = loadUsers();
const activeSessions: Map<string, { uid: string; createdAt: number }> = new Map();
const activeOtps: Map<string, { otp: string; expiresAt: number }> = new Map();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_ludoverse_salt').digest('hex');
}

function loadUsers(): BackendUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Could not read users file, using initial memory defaults');
  }
  return [...DEFAULT_USERS];
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersDatabase, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write users file:', e);
  }
}

function generateToken(uid: string): string {
  const token = 'lv_tok_' + crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, { uid, createdAt: Date.now() });
  return token;
}

function sanitizeUser(user: BackendUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function getUserByToken(req: Request): BackendUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const session = activeSessions.get(token);
  if (!session) return null;
  return usersDatabase.find((u) => u.uid === session.uid) || null;
}

// ==========================================
// AUTHENTICATION API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), totalUsers: usersDatabase.length });
});

// 1. SIGNUP ENDPOINT
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { email, password, name, referralCode } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name or gamer tag.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = usersDatabase.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Check referral bonus
    let bonusCoins = 0;
    let validReferral: string | undefined = undefined;
    if (referralCode && referralCode.trim()) {
      const refCodeClean = referralCode.trim().toUpperCase();
      const referrer = usersDatabase.find((u) => u.referralCode === refCodeClean);
      if (referrer) {
        bonusCoins = 500; // 500 starter bonus coins for using referral
        validReferral = refCodeClean;
        // Credit referrer
        referrer.referralEarnings = (referrer.referralEarnings || 0) + 250;
        referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
        referrer.coins = (referrer.coins || 0) + 250;
      }
    }

    const newUid = 'user_' + crypto.randomBytes(6).toString('hex');
    const userReferralCode = 'LV' + Math.floor(1000 + Math.random() * 9000);

    const newUser: BackendUser = {
      uid: newUid,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      displayName: name.trim(),
      photoURL: 'king',
      role: normalizedEmail === 'donarajwade@gmail.com' ? 'admin' : 'user',
      coins: 3500 + bonusCoins,
      xp: 100,
      level: 1,
      totalGames: 0,
      totalWins: 0,
      totalKills: 0,
      totalSixes: 0,
      winStreak: 0,
      highestWinStreak: 0,
      favoriteColor: 'red',
      referralCode: userReferralCode,
      referredBy: validReferral,
      referralEarnings: 0,
      totalReferrals: 0,
      kycStatus: 'unverified',
      isBanned: false,
      dailyStreak: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    usersDatabase.push(newUser);
    saveUsers();

    const token = generateToken(newUser.uid);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to LudoVerse.',
      token,
      user: sanitizeUser(newUser),
      bonusCoinsAwarded: bonusCoins,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// 2. LOGIN ENDPOINT
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = usersDatabase.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found with this email. Please check your email or sign up.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }

    const hashed = hashPassword(password);
    if (user.passwordHash && user.passwordHash !== hashed) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user.uid);

    return res.json({
      success: true,
      message: `Welcome back, ${user.displayName}!`,
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// 3. GOOGLE SIGN-IN ENDPOINT
app.post('/api/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, photoURL } = req.body;
    const userEmail = (email || 'donarajwade@gmail.com').toLowerCase().trim();
    let user = usersDatabase.find((u) => u.email.toLowerCase() === userEmail);

    if (!user) {
      const newUid = 'google_' + crypto.randomBytes(6).toString('hex');
      user = {
        uid: newUid,
        email: userEmail,
        displayName: name || (userEmail.split('@')[0]) || 'Google Player',
        photoURL: photoURL || 'queen',
        role: userEmail === 'donarajwade@gmail.com' ? 'admin' : 'user',
        coins: 3500,
        xp: 150,
        level: 1,
        totalGames: 0,
        totalWins: 0,
        totalKills: 0,
        totalSixes: 0,
        winStreak: 0,
        highestWinStreak: 0,
        favoriteColor: 'yellow',
        referralCode: 'LV' + Math.floor(1000 + Math.random() * 9000),
        referralEarnings: 0,
        totalReferrals: 0,
        kycStatus: 'unverified',
        isBanned: false,
        dailyStreak: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      usersDatabase.push(user);
      saveUsers();
    }

    const token = generateToken(user.uid);
    return res.json({
      success: true,
      message: 'Google authentication successful!',
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
});

// 4. PHONE SEND OTP ENDPOINT
app.post('/api/auth/phone-send-otp', (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number.' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(cleanPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}! (Demo OTP: ${otp} or 123456)`,
      phone: cleanPhone,
      demoOtp: otp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// 5. PHONE VERIFY OTP ENDPOINT
app.post('/api/auth/phone-verify-otp', (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

    const stored = activeOtps.get(cleanPhone);
    const isValid = (stored && stored.otp === otp) || otp === '123456';

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code entered.' });
    }

    // Find or create phone user
    let user = usersDatabase.find((u) => u.phoneNumber === cleanPhone);
    if (!user) {
      const newUid = 'phone_' + crypto.randomBytes(6).toString('hex');
      user = {
        uid: newUid,
        email: `phone_${cleanPhone}@ludoverse.io`,
        phoneNumber: cleanPhone,
        displayName: 'Player ' + cleanPhone.slice(-4),
        photoURL: 'ninja',
        role: 'user',
        coins: 3500,
        xp: 100,
        level: 1,
        totalGames: 0,
        totalWins: 0,
        totalKills: 0,
        totalSixes: 0,
        winStreak: 0,
        highestWinStreak: 0,
        favoriteColor: 'green',
        referralCode: 'LV' + Math.floor(1000 + Math.random() * 9000),
        referralEarnings: 0,
        totalReferrals: 0,
        kycStatus: 'unverified',
        isBanned: false,
        dailyStreak: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      usersDatabase.push(user);
      saveUsers();
    }

    activeOtps.delete(cleanPhone);
    const token = generateToken(user.uid);

    return res.json({
      success: true,
      message: 'Phone number verified successfully!',
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Phone verification failed.' });
  }
});

// 6. GUEST LOGIN ENDPOINT
app.post('/api/auth/guest', (req: Request, res: Response) => {
  try {
    const { customName } = req.body;
    const guestUid = 'guest_' + Math.floor(1000 + Math.random() * 9000);
    const guestUser: BackendUser = {
      uid: guestUid,
      email: `${guestUid}@ludoverse.io`,
      displayName: customName || `Guest ${guestUid.slice(-4)}`,
      photoURL: 'ninja',
      role: 'user',
      coins: 3500,
      xp: 50,
      level: 1,
      totalGames: 0,
      totalWins: 0,
      totalKills: 0,
      totalSixes: 0,
      winStreak: 0,
      highestWinStreak: 0,
      favoriteColor: 'blue',
      referralCode: 'LV' + Math.floor(1000 + Math.random() * 9000),
      referralEarnings: 0,
      totalReferrals: 0,
      kycStatus: 'unverified',
      isBanned: false,
      dailyStreak: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    usersDatabase.push(guestUser);
    saveUsers();

    const token = generateToken(guestUser.uid);
    return res.json({
      success: true,
      message: 'Instant guest session created.',
      token,
      user: sanitizeUser(guestUser),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Could not create guest session.' });
  }
});

// 7. GET CURRENT USER (ME)
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserByToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized or session expired.' });
  }
  return res.json({ success: true, user: sanitizeUser(user) });
});

// 8. UPDATE PROFILE ENDPOINT
app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  try {
    const user = getUserByToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const { displayName, favoriteColor, photoURL, phoneNumber } = req.body;
    if (displayName) user.displayName = displayName.trim();
    if (favoriteColor) user.favoriteColor = favoriteColor;
    if (photoURL) user.photoURL = photoURL;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    user.updatedAt = Date.now();

    saveUsers();
    return res.json({ success: true, message: 'Profile updated successfully!', user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 9. FORGOT / RESET PASSWORD SIMULATOR
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  const user = usersDatabase.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email address.' });
  }
  return res.json({
    success: true,
    message: `Password reset link has been dispatched to ${email}. Please check your inbox.`,
  });
});

// 10. LEADERBOARD ENDPOINT
app.get('/api/users/leaderboard', (req: Request, res: Response) => {
  const sorted = [...usersDatabase]
    .filter((u) => !u.isBanned)
    .sort((a, b) => b.coins - a.coins || b.totalWins - a.totalWins)
    .slice(0, 20)
    .map((u, index) => ({
      rank: index + 1,
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      coins: u.coins,
      level: u.level,
      totalWins: u.totalWins,
      winStreak: u.winStreak,
      favoriteColor: u.favoriteColor,
    }));

  return res.json({ success: true, leaderboard: sorted });
});

// 11. WALLET SYNC ENDPOINT
app.post('/api/wallet/sync', (req: Request, res: Response) => {
  try {
    const user = getUserByToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }
    const { deltaCoins, reason } = req.body;
    if (typeof deltaCoins === 'number') {
      user.coins = Math.max(0, user.coins + deltaCoins);
      user.updatedAt = Date.now();
      saveUsers();
    }
    return res.json({ success: true, newBalance: user.coins, user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Wallet sync error.' });
  }
});

// ==========================================
// REAL-TIME MULTIPLAYER WEBSOCKET ENGINE
// ==========================================
interface RealRoomPlayer {
  socketId: string;
  uid: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  country?: string;
  rating?: number;
  winRate?: string;
}

interface RealGameRoom {
  id: string;
  roomCode?: string;
  mode: 'online_random' | 'private_room';
  wager: number;
  prizePool: number;
  status: 'waiting' | 'countdown' | 'playing' | 'ended';
  players: RealRoomPlayer[];
  maxPlayers: number;
  hostUid: string;
  gameState?: GameState;
  turnTimeout?: any;
  createdAt: number;
}

const activeRooms: Map<string, RealGameRoom> = new Map();
const matchmakingQueue: Array<{
  socketId: string;
  uid: string;
  name: string;
  avatar: string;
  coins: number;
  wager: number;
  joinedAt: number;
}> = [];

const COLOR_ROTATION: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

function createInitialTokensServer(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    step: -1,
    isBase: true,
    isHome: false,
    positionHistory: [],
  }));
}

function awardPrizes(room: RealGameRoom) {
  if (!room.gameState || !room.gameState.rankings) return;
  const winner = room.gameState.rankings[0];
  if (!winner) return;

  const winAmount = room.prizePool > 0 ? room.prizePool : 500;
  const loserReward = 50; // Admin default consolation reward

  // 1. Award Winner
  const winnerUser = usersDatabase.find((u) => u.uid === winner.id);
  if (winnerUser) {
    winnerUser.coins += winAmount;
    winnerUser.totalWins += 1;
    winnerUser.totalGames += 1;
    winnerUser.winStreak += 1;
    if (winnerUser.winStreak > winnerUser.highestWinStreak) {
      winnerUser.highestWinStreak = winnerUser.winStreak;
    }
    winnerUser.updatedAt = Date.now();
  }

  // 2. Award Losers / Runners-up with Participation Coins
  room.gameState.players.forEach((p) => {
    if (p.id !== winner.id) {
      const loserUser = usersDatabase.find((u) => u.uid === p.id);
      if (loserUser) {
        loserUser.coins += loserReward;
        loserUser.totalGames += 1;
        loserUser.winStreak = 0;
        loserUser.updatedAt = Date.now();
      }
    }
  });

  saveUsers();
}

/**
 * Handle match forfeiture when a player leaves or disconnects during an active game
 */
function handleServerPlayerForfeit(roomId: string, uid: string, socketId?: string) {
  const room = activeRooms.get(roomId);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const gs = room.gameState;
  const forfeitingPlayer = gs.players.find(
    (p) => p.id === uid || (socketId && p.id === socketId)
  );
  if (!forfeitingPlayer || forfeitingPlayer.isForfeited) return;

  // Mark forfeiting player as lost/forfeited
  forfeitingPlayer.isForfeited = true;
  forfeitingPlayer.hasWon = false;

  // Record loss on backend user if found
  const leaverUser = usersDatabase.find((u) => u.uid === forfeitingPlayer.id);
  if (leaverUser) {
    leaverUser.totalGames += 1;
    leaverUser.winStreak = 0;
    leaverUser.updatedAt = Date.now();
    saveUsers();
  }

  // Active contenders remaining who haven't forfeited
  const activeContenders = gs.players.filter((p) => !p.isForfeited);

  if (activeContenders.length <= 1) {
    // Only 1 player left in the match -> That player WINS by forfeit!
    const winner =
      activeContenders[0] ||
      gs.players.find((p) => p.id !== forfeitingPlayer.id) ||
      gs.players[0];

    winner.hasWon = true;
    winner.rank = 1;

    gs.status = 'finished';
    gs.winner = winner;
    gs.rankings = [winner, ...gs.players.filter((p) => p.id !== winner.id)];
    gs.forfeitInfo = {
      forfeitedPlayerId: forfeitingPlayer.id,
      forfeitedPlayerName: forfeitingPlayer.name,
      winnerPlayerId: winner.id,
      winnerPlayerName: winner.name,
      reason: `${forfeitingPlayer.name} left the match and lost by forfeit.`,
    };

    gs.logs.push(
      `⚠️ ${forfeitingPlayer.name} has left the match and forfeited. ${winner.name} wins by forfeit!`
    );

    awardPrizes(room);

    io.to(room.id).emit('player_forfeited', {
      roomId: room.id,
      forfeitedUid: forfeitingPlayer.id,
      forfeitedPlayerName: forfeitingPlayer.name,
      winner,
      gameFinished: true,
      gameState: gs,
      message: `⚠️ ${forfeitingPlayer.name} left the match and forfeited. ${winner.name} wins by forfeit!`,
    });
  } else {
    // 3 or 4 players game where 1 left -> continue game among remaining active players
    let nextIdx = gs.activePlayerIndex;
    if (gs.players[gs.activePlayerIndex]?.id === forfeitingPlayer.id) {
      nextIdx = getNextPlayerIndex(gs.players, gs.activePlayerIndex);
      gs.activePlayerIndex = nextIdx;
      gs.players.forEach((p, i) => (p.isTurn = i === nextIdx));
      gs.currentDice = null;
      gs.diceRolled = false;
      gs.movableTokens = [];
      gs.turnTimer = 15;
    }

    gs.forfeitInfo = {
      forfeitedPlayerId: forfeitingPlayer.id,
      forfeitedPlayerName: forfeitingPlayer.name,
      reason: `${forfeitingPlayer.name} left the game and forfeited.`,
    };
    gs.logs.push(`⚠️ ${forfeitingPlayer.name} forfeited and left the match.`);

    io.to(room.id).emit('player_forfeited', {
      roomId: room.id,
      forfeitedUid: forfeitingPlayer.id,
      forfeitedPlayerName: forfeitingPlayer.name,
      winner: null,
      gameFinished: false,
      gameState: gs,
      nextPlayerIndex: nextIdx,
      message: `⚠️ ${forfeitingPlayer.name} left the match and forfeited.`,
    });
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[WebSocket] Real Player connected: ${socket.id}`);

  // 1. JOIN MATCHMAKING QUEUE
  socket.on('join_matchmaking', (data: { uid: string; name: string; avatar: string; coins: number; wager: number }) => {
    // Remove if already in queue
    const existingIdx = matchmakingQueue.findIndex((q) => q.uid === data.uid || q.socketId === socket.id);
    if (existingIdx !== -1) matchmakingQueue.splice(existingIdx, 1);

    matchmakingQueue.push({
      socketId: socket.id,
      uid: data.uid || socket.id,
      name: data.name || 'Player',
      avatar: data.avatar || 'king',
      coins: data.coins || 0,
      wager: data.wager || 100,
      joinedAt: Date.now(),
    });

    console.log(`[Matchmaking] Player ${data.name} queued up for wager ${data.wager}. Total in queue: ${matchmakingQueue.length}`);

    // Check if we have matching players for a game (2 or up to 4 players)
    const matching = matchmakingQueue.filter((p) => p.wager === data.wager);

    if (matching.length >= 2) {
      // Pick up to 4 players
      const matchedPlayers = matching.slice(0, 4);
      // Remove from queue
      matchedPlayers.forEach((p) => {
        const idx = matchmakingQueue.findIndex((q) => q.socketId === p.socketId);
        if (idx !== -1) matchmakingQueue.splice(idx, 1);
      });

      const roomId = 'match_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const roomPlayers: RealRoomPlayer[] = matchedPlayers.map((p, idx) => ({
        socketId: p.socketId,
        uid: p.uid,
        name: p.name,
        avatar: p.avatar,
        color: COLOR_ROTATION[idx],
        isHost: idx === 0,
        isReady: true,
        country: 'Global Arena',
        rating: 1500 + Math.floor(Math.random() * 200),
        winRate: `${60 + Math.floor(Math.random() * 20)}%`,
      }));

      const prizePool = Math.floor(data.wager * roomPlayers.length * 0.9);
      const room: RealGameRoom = {
        id: roomId,
        mode: 'online_random',
        wager: data.wager,
        prizePool,
        status: 'countdown',
        players: roomPlayers,
        maxPlayers: roomPlayers.length,
        hostUid: roomPlayers[0].uid,
        createdAt: Date.now(),
      };

      activeRooms.set(roomId, room);

      // Join sockets to room
      matchedPlayers.forEach((p) => {
        const s = io.sockets.sockets.get(p.socketId);
        if (s) s.join(roomId);
      });

      // Notify all matched players in room
      io.to(roomId).emit('match_found', {
        roomId,
        players: roomPlayers,
        wager: data.wager,
        prizePool,
        countdown: 3,
      });

      // 3-second countdown then auto-start real-time game
      setTimeout(() => {
        const currentRoom = activeRooms.get(roomId);
        if (!currentRoom) return;

        currentRoom.status = 'playing';

        const gameStatePlayers: Player[] = currentRoom.players.map((rp, idx) => ({
          id: rp.uid,
          name: rp.name,
          avatar: rp.avatar,
          color: rp.color,
          type: 'human', // Every player is a REAL human in live multiplayer!
          isReady: true,
          isTurn: idx === 0,
          hasWon: false,
          tokens: createInitialTokensServer(rp.color),
          consecutiveSixes: 0,
          kills: 0,
          sixesRolled: 0,
        }));

        const newGameState: GameState = {
          id: roomId,
          mode: 'online_random',
          status: 'playing',
          players: gameStatePlayers,
          activePlayerIndex: 0,
          currentDice: null,
          diceRolled: false,
          isRolling: false,
          movableTokens: [],
          winner: null,
          rankings: [],
          turnTimer: 15,
          maxTurnTimer: 15,
          betAmount: currentRoom.wager,
          prizePool: currentRoom.prizePool,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          logs: ['Live Match Started! Real-to-real multiplayer in sync.'],
        };

        currentRoom.gameState = newGameState;
        io.to(roomId).emit('game_start', {
          roomId,
          gameState: newGameState,
        });
      }, 3000);
    }
  });

  // 2. LEAVE MATCHMAKING
  socket.on('leave_matchmaking', () => {
    const idx = matchmakingQueue.findIndex((q) => q.socketId === socket.id);
    if (idx !== -1) {
      matchmakingQueue.splice(idx, 1);
      console.log(`[Matchmaking] Player left queue: ${socket.id}`);
    }
  });

  // 3. CREATE PRIVATE ROOM
  socket.on('create_room', (data: { uid: string; name: string; avatar: string; wager: number; maxPlayers?: number }) => {
    const roomCode = 'LV' + Math.floor(1000 + Math.random() * 9000).toString();
    const roomId = 'room_' + roomCode;
    const maxPlayers = data.maxPlayers || 4;
    const wager = data.wager || 100;
    const prizePool = Math.floor(wager * maxPlayers * 0.9);

    const hostPlayer: RealRoomPlayer = {
      socketId: socket.id,
      uid: data.uid || socket.id,
      name: data.name || 'Room Host',
      avatar: data.avatar || 'king',
      color: 'red',
      isHost: true,
      isReady: true,
    };

    const room: RealGameRoom = {
      id: roomId,
      roomCode,
      mode: 'private_room',
      wager,
      prizePool,
      status: 'waiting',
      players: [hostPlayer],
      maxPlayers,
      hostUid: hostPlayer.uid,
      createdAt: Date.now(),
    };

    activeRooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('room_created', {
      roomId,
      roomCode,
      room,
    });
  });

  // 4. JOIN PRIVATE ROOM
  socket.on('join_room', (data: { uid: string; name: string; avatar: string; roomCode: string }) => {
    const roomCode = data.roomCode.trim().toUpperCase();
    const roomEntry = Array.from(activeRooms.values()).find(
      (r) => r.roomCode === roomCode || r.id === 'room_' + roomCode
    );

    if (!roomEntry) {
      socket.emit('room_error', { message: `Room with code "${roomCode}" not found.` });
      return;
    }

    if (roomEntry.status !== 'waiting') {
      socket.emit('room_error', { message: 'This game room has already started or concluded.' });
      return;
    }

    if (roomEntry.players.length >= roomEntry.maxPlayers) {
      socket.emit('room_error', { message: 'This room is currently full (4/4 players).' });
      return;
    }

    // Assign next available color
    const usedColors = roomEntry.players.map((p) => p.color);
    const availableColor = COLOR_ROTATION.find((c) => !usedColors.includes(c)) || 'blue';

    const newPlayer: RealRoomPlayer = {
      socketId: socket.id,
      uid: data.uid || socket.id,
      name: data.name || 'Guest Player',
      avatar: data.avatar || 'ninja',
      color: availableColor,
      isHost: false,
      isReady: true,
    };

    roomEntry.players.push(newPlayer);
    socket.join(roomEntry.id);

    socket.emit('room_joined', {
      roomId: roomEntry.id,
      room: roomEntry,
    });

    io.to(roomEntry.id).emit('room_updated', {
      room: roomEntry,
      message: `${newPlayer.name} joined the room!`,
    });
  });

  // 5. START PRIVATE ROOM GAME
  socket.on('start_room_game', (data: { roomId: string }) => {
    const room = activeRooms.get(data.roomId);
    if (!room) return;

    if (room.players.length < 2) {
      socket.emit('room_error', { message: 'Need at least 2 real players to start the match.' });
      return;
    }

    room.status = 'playing';

    const gameStatePlayers: Player[] = room.players.map((rp, idx) => ({
      id: rp.uid,
      name: rp.name,
      avatar: rp.avatar,
      color: rp.color,
      type: 'human',
      isReady: true,
      isTurn: idx === 0,
      hasWon: false,
      tokens: createInitialTokensServer(rp.color),
      consecutiveSixes: 0,
      kills: 0,
      sixesRolled: 0,
    }));

    const newGameState: GameState = {
      id: room.id,
      mode: 'private_room',
      roomCode: room.roomCode,
      status: 'playing',
      players: gameStatePlayers,
      activePlayerIndex: 0,
      currentDice: null,
      diceRolled: false,
      isRolling: false,
      movableTokens: [],
      winner: null,
      rankings: [],
      turnTimer: 15,
      maxTurnTimer: 15,
      betAmount: room.wager,
      prizePool: room.prizePool,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [`Private Match Started with ${room.players.length} real players!`],
    };

    room.gameState = newGameState;

    io.to(room.id).emit('game_start', {
      roomId: room.id,
      gameState: newGameState,
    });
  });

  // 6. REAL-TIME DICE ROLL
  socket.on('roll_dice', (data: { roomId: string; uid: string }) => {
    const room = activeRooms.get(data.roomId);
    if (!room || !room.gameState || room.gameState.status !== 'playing') return;

    const gs = room.gameState;
    const activePlayer = gs.players[gs.activePlayerIndex];

    if (!activePlayer || activePlayer.id !== data.uid) {
      console.warn(`[Dice] Rejecting roll: not player's turn (${data.uid} vs ${activePlayer?.id})`);
      return;
    }

    if (gs.diceRolled || gs.isRolling) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    gs.currentDice = dice;
    gs.diceRolled = true;
    gs.isRolling = false;

    if (dice === 6) {
      activePlayer.sixesRolled += 1;
      activePlayer.consecutiveSixes += 1;
    } else {
      activePlayer.consecutiveSixes = 0;
    }

    // Check three consecutive sixes penalty
    if (activePlayer.consecutiveSixes >= 3) {
      activePlayer.consecutiveSixes = 0;
      gs.logs.push(`⚠️ ${activePlayer.name} rolled three 6s! Turn forfeited.`);
      const nextIdx = getNextPlayerIndex(gs.players, gs.activePlayerIndex);
      gs.activePlayerIndex = nextIdx;
      gs.players.forEach((p, i) => (p.isTurn = i === nextIdx));
      gs.currentDice = null;
      gs.diceRolled = false;
      gs.movableTokens = [];
      gs.turnTimer = 15;

      io.to(room.id).emit('dice_penalty_three_sixes', {
        activePlayerIndex: nextIdx,
        gameState: gs,
      });
      return;
    }

    const movable = getMovableTokens(activePlayer, dice);
    gs.movableTokens = movable;

    // Broadcast synchronized roll to all room players
    io.to(room.id).emit('dice_rolled', {
      dice,
      activePlayerIndex: gs.activePlayerIndex,
      movableTokens: movable,
      consecutiveSixes: activePlayer.consecutiveSixes,
    });

    // If NO movable tokens: pass turn after brief 1.2s delay
    if (movable.length === 0) {
      if (room.turnTimeout) clearTimeout(room.turnTimeout);
      room.turnTimeout = setTimeout(() => {
        const nextIdx = getNextPlayerIndex(gs.players, gs.activePlayerIndex);
        gs.activePlayerIndex = nextIdx;
        gs.players.forEach((p, i) => (p.isTurn = i === nextIdx));
        gs.currentDice = null;
        gs.diceRolled = false;
        gs.movableTokens = [];
        gs.turnTimer = 15;

        io.to(room.id).emit('turn_changed', {
          activePlayerIndex: nextIdx,
          turnTimer: 15,
        });
      }, 1200);
    }
  });

  // 7. REAL-TIME MOVE TOKEN
  socket.on('move_token', (data: { roomId: string; uid: string; tokenId: number }) => {
    const room = activeRooms.get(data.roomId);
    if (!room || !room.gameState || room.gameState.status !== 'playing') return;

    const gs = room.gameState;
    const activePlayer = gs.players[gs.activePlayerIndex];

    if (!activePlayer || activePlayer.id !== data.uid) return;
    if (!gs.diceRolled || !gs.currentDice) return;

    const dice = gs.currentDice;

    try {
      const result = executeTokenMove(gs.players, gs.activePlayerIndex, data.tokenId, dice);

      gs.players = result.updatedPlayers;
      if (result.actionLog) gs.logs.push(result.actionLog);

      let nextPlayerIndex = gs.activePlayerIndex;
      if (!result.bonusTurn) {
        nextPlayerIndex = getNextPlayerIndex(gs.players, gs.activePlayerIndex);
      }

      gs.activePlayerIndex = nextPlayerIndex;
      gs.players.forEach((p, i) => (p.isTurn = i === nextPlayerIndex));
      gs.currentDice = null;
      gs.diceRolled = false;
      gs.movableTokens = [];
      gs.turnTimer = 15;

      if (result.gameFinished) {
        gs.status = 'finished';
        gs.rankings = result.rankings;
        gs.winner = result.rankings[0] || null;
        awardPrizes(room);
      }

      // Broadcast move animation & state update to all players
      io.to(room.id).emit('token_moved', {
        tokenId: data.tokenId,
        color: activePlayer.color,
        dice,
        updatedPlayers: gs.players,
        capturedOpponents: result.capturedOpponents,
        reachedHome: result.reachedHome,
        bonusTurn: result.bonusTurn,
        nextPlayerIndex,
        gameFinished: result.gameFinished,
        winner: gs.winner,
        rankings: gs.rankings,
        actionLog: result.actionLog,
      });
    } catch (err: any) {
      console.error('[MoveToken Error]', err);
    }
  });

  // 8. REAL-TIME IN-GAME CHAT
  socket.on('send_chat', (data: { roomId: string; message: any }) => {
    io.to(data.roomId).emit('chat_received', {
      message: data.message,
    });
  });

  // 9. REAL-TIME EMOJI REACTION
  socket.on('send_emoji', (data: { roomId: string; emoji: string; senderColor: PlayerColor }) => {
    io.to(data.roomId).emit('emoji_received', {
      id: 'emoji_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      emoji: data.emoji,
      senderColor: data.senderColor,
      timestamp: Date.now(),
    });
  });

  // 10. LEAVE GAME / DISCONNECT
  socket.on('leave_game', (data: { roomId: string; uid: string }) => {
    socket.leave(data.roomId);
    handleServerPlayerForfeit(data.roomId, data.uid, socket.id);
  });

  socket.on('disconnect', () => {
    // Remove from queue if in queue
    const qIdx = matchmakingQueue.findIndex((q) => q.socketId === socket.id);
    if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);
    console.log(`[WebSocket] Player disconnected: ${socket.id}`);

    // If socket was participating in any active game, forfeit them
    activeRooms.forEach((room) => {
      if (room.status === 'playing' && room.gameState) {
        const hasPlayer = room.players.some((p) => p.socketId === socket.id);
        if (hasPlayer) {
          const matchedPlayer = room.players.find((p) => p.socketId === socket.id);
          if (matchedPlayer) {
            handleServerPlayerForfeit(room.id, matchedPlayer.uid, socket.id);
          }
        }
      }
    });
  });
});

// ==========================================
// VITE INTEGRATION & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`LudoVerse Server running on port ${PORT}`);
  });
}

startServer();
