import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tournament, UserProfile } from '../types';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import { INITIAL_TOURNAMENTS } from '../data/initialData';
import { soundManager } from '../game/audio';

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  newUsersToday: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalMatches: number;
  liveMatches: number;
  activeRooms: number;
  totalCoinsInCirculation: number;
  totalWithdrawalsProcessed: number;
  pendingWithdrawalsCount: number;
  platformRevenueEstimate: number; // in $
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'reward' | 'tournament' | 'maintenance';
  timestamp: number;
  sender: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: number;
}

interface AdminContextType {
  stats: AdminStats;
  allUsers: UserProfile[];
  tournaments: Tournament[];
  broadcasts: BroadcastNotification[];
  auditLogs: AuditLog[];
  searchUsers: (query: string) => UserProfile[];
  toggleUserBan: (uid: string) => boolean;
  adjustUserCoins: (uid: string, amount: number, isCredit: boolean, reason: string) => boolean;
  sendBroadcast: (title: string, message: string, type?: BroadcastNotification['type']) => void;
  createTournament: (tournData: Omit<Tournament, 'id' | 'registeredPlayerIds' | 'status' | 'currentRound' | 'totalRounds'>) => void;
  deleteTournament: (tournId: string) => void;
  approveWithdrawal: (id: string, txnId?: string) => void;
  rejectWithdrawal: (id: string, reason: string) => void;
}

const STORAGE_KEY_TOURNAMENTS = 'ludoverse_tournaments';
const STORAGE_KEY_BROADCASTS = 'ludoverse_broadcasts';
const STORAGE_KEY_AUDITS = 'ludoverse_audit_logs';

const INITIAL_MOCK_USERS: UserProfile[] = [
  {
    uid: 'user_master_001',
    email: 'player@ludoverse.io',
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
    uid: 'user_002',
    email: 'queen.elena@gmail.com',
    displayName: 'Queen Elena',
    photoURL: 'queen',
    role: 'user',
    coins: 45000,
    xp: 3200,
    level: 16,
    totalGames: 180,
    totalWins: 130,
    totalKills: 340,
    totalSixes: 580,
    winStreak: 5,
    highestWinStreak: 9,
    favoriteColor: 'yellow',
    referralCode: 'ELENA88',
    referralEarnings: 4500,
    totalReferrals: 18,
    kycStatus: 'verified',
    isBanned: false,
    dailyStreak: 14,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now(),
  },
  {
    uid: 'user_003',
    email: 'vortex.ninja@outlook.com',
    displayName: 'Vortex Ninja',
    photoURL: 'ninja',
    role: 'user',
    coins: 1200,
    xp: 900,
    level: 5,
    totalGames: 42,
    totalWins: 22,
    totalKills: 78,
    totalSixes: 140,
    winStreak: 0,
    highestWinStreak: 3,
    favoriteColor: 'green',
    referralCode: 'NINJA99',
    referralEarnings: 500,
    totalReferrals: 2,
    kycStatus: 'pending',
    isBanned: false,
    dailyStreak: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now(),
  },
  {
    uid: 'user_004',
    email: 'alex.knight@yahoo.com',
    displayName: 'Alex Knight',
    photoURL: 'knight',
    role: 'user',
    coins: 14500,
    xp: 1600,
    level: 8,
    totalGames: 68,
    totalWins: 41,
    totalKills: 112,
    totalSixes: 210,
    winStreak: 1,
    highestWinStreak: 6,
    favoriteColor: 'blue',
    referralCode: 'KNIGHT1',
    referralEarnings: 1250,
    totalReferrals: 5,
    kycStatus: 'verified',
    isBanned: false,
    dailyStreak: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now(),
  },
  {
    uid: 'user_005',
    email: 'spammer_bot@test.com',
    displayName: 'Suspect Player',
    photoURL: 'alien',
    role: 'user',
    coins: 50,
    xp: 10,
    level: 1,
    totalGames: 3,
    totalWins: 0,
    totalKills: 1,
    totalSixes: 4,
    winStreak: 0,
    highestWinStreak: 0,
    favoriteColor: 'red',
    referralCode: 'SUS999',
    referralEarnings: 0,
    totalReferrals: 0,
    kycStatus: 'rejected',
    isBanned: true,
    dailyStreak: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now(),
  },
];

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { withdrawals, updateWithdrawalStatus, creditCoins } = useWallet();

  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_MOCK_USERS);

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_TOURNAMENTS;
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_BROADCASTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'bc_1',
        title: '🎉 Welcome to LudoVerse 2.0',
        message: 'Claim your daily bonus and participate in the Weekend Grand Arena Tournament for 3,600 coins prize pool!',
        type: 'tournament',
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        sender: 'Admin Team',
      },
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_AUDITS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'aud_1',
        adminName: 'Super Admin',
        action: 'APPROVED_WITHDRAWAL',
        target: 'wd_001',
        details: 'Approved $5.00 via UPI (Ref: UPI948293847291)',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TOURNAMENTS, JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Keep current active user synchronized with allUsers list
  useEffect(() => {
    if (user) {
      setAllUsers((prev) => {
        const exists = prev.some((u) => u.uid === user.uid);
        if (exists) {
          return prev.map((u) => (u.uid === user.uid ? user : u));
        } else {
          return [user, ...prev];
        }
      });
    }
  }, [user]);

  const addAudit = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: 'aud_' + Date.now().toString().slice(-6),
      adminName: user?.displayName || 'Admin',
      action,
      target,
      details,
      timestamp: Date.now(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const totalCoinsInCirculation = allUsers.reduce((sum, u) => sum + u.coins, 0);
  const totalWithdrawalsProcessed = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.cashAmount, 0);

  const stats: AdminStats = {
    totalUsers: 1420 + allUsers.length,
    onlineUsers: 1462,
    offlineUsers: 1284,
    newUsersToday: 48,
    dailyActiveUsers: 840,
    monthlyActiveUsers: 3950,
    totalMatches: 18490,
    liveMatches: 34,
    activeRooms: 18,
    totalCoinsInCirculation: totalCoinsInCirculation + 1850000,
    totalWithdrawalsProcessed,
    pendingWithdrawalsCount,
    platformRevenueEstimate: 4280.5,
  };

  const searchUsers = (query: string): UserProfile[] => {
    if (!query.trim()) return allUsers;
    const q = query.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
    );
  };

  const toggleUserBan = (uid: string): boolean => {
    let newStatus = false;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          newStatus = !u.isBanned;
          return { ...u, isBanned: newStatus };
        }
        return u;
      })
    );
    addAudit('TOGGLE_BAN', uid, `User status set to ${newStatus ? 'BANNED' : 'ACTIVE'}`);
    soundManager.playClick();
    return newStatus;
  };

  const adjustUserCoins = (uid: string, amount: number, isCredit: boolean, reason: string): boolean => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const nextCoins = isCredit ? u.coins + amount : Math.max(0, u.coins - amount);
          return { ...u, coins: nextCoins };
        }
        return u;
      })
    );

    if (user && user.uid === uid) {
      if (isCredit) {
        creditCoins(amount, 'admin_adjustment', `Admin Coin Credit: ${reason}`);
      }
    }

    addAudit(
      isCredit ? 'CREDIT_COINS' : 'DEBIT_COINS',
      uid,
      `${isCredit ? '+' : '-'}${amount} coins. Reason: ${reason}`
    );
    soundManager.playSafeStar();
    return true;
  };

  const sendBroadcast = (title: string, message: string, type: BroadcastNotification['type'] = 'info') => {
    const newBroadcast: BroadcastNotification = {
      id: 'bc_' + Date.now().toString().slice(-6),
      title,
      message,
      type,
      timestamp: Date.now(),
      sender: user?.displayName || 'Admin Console',
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    addAudit('BROADCAST_MESSAGE', 'ALL_USERS', `Title: "${title}"`);
    soundManager.playVictory();
  };

  const createTournament = (tournData: Omit<Tournament, 'id' | 'registeredPlayerIds' | 'status' | 'currentRound' | 'totalRounds'>) => {
    const totalRounds = tournData.maxPlayers === 4 ? 2 : tournData.maxPlayers === 8 ? 3 : 4;
    const newTourn: Tournament = {
      ...tournData,
      id: 'tourn_' + Date.now().toString().slice(-6),
      registeredPlayerIds: [],
      status: 'registering',
      currentRound: 1,
      totalRounds,
    };
    setTournaments((prev) => [newTourn, ...prev]);
    addAudit('CREATE_TOURNAMENT', newTourn.id, `Title: "${tournData.title}", Prize: ${tournData.prizePool}`);
    soundManager.playSafeStar();
  };

  const deleteTournament = (tournId: string) => {
    setTournaments((prev) => prev.filter((t) => t.id !== tournId));
    addAudit('DELETE_TOURNAMENT', tournId, `Deleted tournament`);
    soundManager.playClick();
  };

  const approveWithdrawal = (id: string, txnId?: string) => {
    const generatedTxn = txnId || 'TXN' + Math.floor(1000000000 + Math.random() * 9000000000);
    updateWithdrawalStatus(id, 'approved', 'Approved & Dispatched via Banking Channel', generatedTxn);
    addAudit('APPROVE_WITHDRAWAL', id, `TxnRef: ${generatedTxn}`);
    soundManager.playVictory();
  };

  const rejectWithdrawal = (id: string, reason: string) => {
    updateWithdrawalStatus(id, 'rejected', reason || 'Rejected by administrator');
    addAudit('REJECT_WITHDRAWAL', id, `Reason: ${reason}`);
    soundManager.playClick();
  };

  return (
    <AdminContext.Provider
      value={{
        stats,
        allUsers,
        tournaments,
        broadcasts,
        auditLogs,
        searchUsers,
        toggleUserBan,
        adjustUserCoins,
        sendBroadcast,
        createTournament,
        deleteTournament,
        approveWithdrawal,
        rejectWithdrawal,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
