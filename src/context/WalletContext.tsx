import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletTransaction, WithdrawalRequest, GlobalSettings } from '../types';
import { useAuth } from './AuthContext';
import { INITIAL_SETTINGS } from '../data/initialData';
import { soundManager } from '../game/audio';
import { saveTransactionToFirestore } from '../services/firestoreService';

interface WalletContextType {
  balance: number;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  settings: GlobalSettings;
  canClaimDailyBonus: boolean;
  isDailyBonusAvailable: boolean;
  dailyStreak: number;
  dailyBonusStreak: number;
  timeUntilNextSpin: number; // in seconds, 0 if ready
  isLuckySpinAvailable: boolean;
  claimDailyBonus: (day?: number) => number;
  claimLuckySpin: (coinsAmount?: number) => number;
  spinLuckyWheel: () => Promise<number>;
  watchRewardedAd: () => Promise<number>;
  submitWithdrawal: (
    coins: number,
    method: 'upi' | 'bank_transfer',
    details: { upiId?: string; bankDetails?: { accountNumber: string; ifscCode: string; holderName: string; bankName: string } }
  ) => Promise<{ success: boolean; message: string }>;
  submitKyc: (docType: string, docNumber: string) => Promise<boolean>;
  creditCoins: (amount: number, category: WalletTransaction['category'], description: string, referenceId?: string) => void;
  debitCoins: (amount: number, category: WalletTransaction['category'], description: string, referenceId?: string) => boolean;
  updateSettings: (newSettings: Partial<GlobalSettings>) => void;
  updateWithdrawalStatus: (withdrawalId: string, status: 'approved' | 'rejected', notes?: string, payoutTxnId?: string) => void;
}

const STORAGE_KEY_TXNS = 'ludoverse_wallet_txns';
const STORAGE_KEY_WITHDRAWALS = 'ludoverse_withdrawals';
const STORAGE_KEY_SETTINGS = 'ludoverse_global_settings';

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_init_1',
    userId: 'user_master_001',
    type: 'credit',
    category: 'daily_bonus',
    amount: 500,
    description: 'Day 3 Streak Daily Login Reward',
    balanceAfter: 3500,
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'tx_init_2',
    userId: 'user_master_001',
    type: 'credit',
    category: 'game_win',
    amount: 1800,
    description: 'Victory in Online Match #4928',
    balanceAfter: 3000,
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'tx_init_3',
    userId: 'user_master_001',
    type: 'debit',
    category: 'game_entry',
    amount: 1000,
    description: 'Match Entry Wager for Online Room #4928',
    balanceAfter: 1200,
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 60 * 13,
  },
];

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd_001',
    userId: 'user_master_001',
    userDisplayName: 'Ludo Master',
    userEmail: 'player@ludoverse.io',
    coinsAmount: 5000,
    cashAmount: 5.0,
    currency: '$',
    method: 'upi',
    upiId: 'ludomaster@okaxis',
    status: 'approved',
    adminNotes: 'Transferred via UPI Express Gateway',
    payoutTxnId: 'UPI948293847291',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    processedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        try {
          return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_TXNS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_WITHDRAWALS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TXNS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  const balance = user?.coins ?? 0;
  const dailyStreak = user?.dailyStreak ?? 1;

  // Check daily bonus eligibility (once per calendar day)
  const todayStr = new Date().toISOString().split('T')[0];
  const canClaimDailyBonus = user?.lastDailyBonusClaim !== todayStr;

  // Check lucky spin cooldown (e.g. 6 hours)
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState(0);

  useEffect(() => {
    const checkCooldown = () => {
      if (!user?.lastSpinTimestamp) {
        setTimeUntilNextSpin(0);
        return;
      }
      const cooldownMs = settings.luckySpinCooldownHours * 60 * 60 * 1000;
      const elapsed = Date.now() - user.lastSpinTimestamp;
      const remaining = Math.max(0, Math.floor((cooldownMs - elapsed) / 1000));
      setTimeUntilNextSpin(remaining);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [user?.lastSpinTimestamp, settings.luckySpinCooldownHours]);

  const creditCoins = (amount: number, category: WalletTransaction['category'], description: string, referenceId?: string) => {
    if (!user) return;
    const nextBalance = user.coins + amount;
    updateProfile({ coins: nextBalance });

    const newTxn: WalletTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.uid,
      type: 'credit',
      category,
      amount,
      description,
      balanceAfter: nextBalance,
      status: 'completed',
      timestamp: Date.now(),
      referenceId,
    };

    setTransactions((prev) => [newTxn, ...prev]);

    saveTransactionToFirestore(user.uid, {
      id: newTxn.id,
      userId: user.uid,
      type: category === 'game_win' ? 'game_win' : category === 'daily_bonus' || category === 'lucky_spin' || category === 'rewarded_ad' ? 'bonus' : 'deposit',
      amount,
      status: 'completed',
      description,
      date: newTxn.timestamp,
      paymentMethod: 'In-Game Wallet',
      referenceId: referenceId || newTxn.id,
    });
  };

  const debitCoins = (amount: number, category: WalletTransaction['category'], description: string, referenceId?: string): boolean => {
    if (!user || user.coins < amount) return false;
    const nextBalance = user.coins - amount;
    updateProfile({ coins: nextBalance });

    const newTxn: WalletTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.uid,
      type: 'debit',
      category,
      amount,
      description,
      balanceAfter: nextBalance,
      status: 'completed',
      timestamp: Date.now(),
      referenceId,
    };

    setTransactions((prev) => [newTxn, ...prev]);

    saveTransactionToFirestore(user.uid, {
      id: newTxn.id,
      userId: user.uid,
      type: category === 'game_entry' ? 'game_entry' : category === 'withdrawal' ? 'withdrawal' : 'refund',
      amount,
      status: 'completed',
      description,
      date: newTxn.timestamp,
      paymentMethod: 'In-Game Wallet',
      referenceId: referenceId || newTxn.id,
    });

    return true;
  };

  const claimDailyBonus = (day?: number): number => {
    if (!user || !canClaimDailyBonus) return 0;
    const streakIndex = day !== undefined ? Math.min(Math.max(0, day - 1), 6) : Math.min((user.dailyStreak - 1) % 7, 6);
    const reward = settings.dailyBonusRewards[streakIndex] || 250;

    const nextStreak = user.dailyStreak >= 7 ? 1 : user.dailyStreak + 1;
    updateProfile({
      lastDailyBonusClaim: todayStr,
      dailyStreak: nextStreak,
    });

    creditCoins(reward, 'daily_bonus', `Day ${streakIndex + 1} Daily Login Streak Reward`);
    soundManager.playVictory();
    return reward;
  };

  const claimLuckySpin = (coinsAmount?: number): number => {
    if (!user) return 0;
    const reward = typeof coinsAmount === 'number' && coinsAmount > 0 ? coinsAmount : 500;
    updateProfile({ lastSpinTimestamp: Date.now() });
    creditCoins(reward, 'lucky_spin', `Lucky Spin of Fortune Reward (${reward} Coins)`);
    return reward;
  };

  const spinLuckyWheel = async (): Promise<number> => {
    if (!user) return 0;
    // Possible rewards
    const wheelPrizes = [100, 250, 500, 750, 1000, 1500, 2500, 5000];
    const randomIndex = Math.floor(Math.random() * wheelPrizes.length);
    const wonCoins = wheelPrizes[randomIndex];

    return claimLuckySpin(wonCoins);
  };

  const watchRewardedAd = async (): Promise<number> => {
    const reward = settings.rewardedAdCoins;
    creditCoins(reward, 'rewarded_ad', `Sponsored Video Ad Reward (${reward} Coins)`);
    soundManager.playSafeStar();
    return reward;
  };

  const submitWithdrawal = async (
    coins: number,
    method: 'upi' | 'bank_transfer',
    details: { upiId?: string; bankDetails?: { accountNumber: string; ifscCode: string; holderName: string; bankName: string } }
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Please log in to withdraw' };

    if (coins < settings.minWithdrawalCoins) {
      return { success: false, message: `Minimum withdrawal is ${settings.minWithdrawalCoins} Coins` };
    }

    if (user.coins < coins) {
      return { success: false, message: 'Insufficient coin balance in wallet' };
    }

    if (user.kycStatus === 'rejected') {
      return { success: false, message: 'KYC Verification failed. Please re-submit your verification.' };
    }

    const cashAmount = parseFloat((coins / settings.coinToCashRate).toFixed(2));

    // Deduct coins immediately from wallet to lock balance for processing
    const debited = debitCoins(coins, 'withdrawal', `Cashout Request: ${settings.currencySymbol}${cashAmount} via ${method.toUpperCase()}`);
    if (!debited) {
      return { success: false, message: 'Could not process coin deduction' };
    }

    const newReq: WithdrawalRequest = {
      id: 'wd_' + Date.now().toString().slice(-6),
      userId: user.uid,
      userDisplayName: user.displayName,
      userEmail: user.email,
      coinsAmount: coins,
      cashAmount,
      currency: settings.currencySymbol,
      method,
      upiId: details.upiId,
      bankDetails: details.bankDetails,
      status: 'pending',
      createdAt: Date.now(),
    };

    setWithdrawals((prev) => [newReq, ...prev]);
    soundManager.playClick();
    return { success: true, message: `Withdrawal of ${settings.currencySymbol}${cashAmount} submitted successfully!` };
  };

  const submitKyc = async (_docType: string, _docNumber: string): Promise<boolean> => {
    if (!user) return false;
    updateProfile({ kycStatus: 'pending' });
    soundManager.playSafeStar();

    // Auto verify in prototype after 2.5 seconds
    setTimeout(() => {
      updateProfile({ kycStatus: 'verified' });
    }, 2500);

    return true;
  };

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateWithdrawalStatus = (withdrawalId: string, status: 'approved' | 'rejected', notes?: string, payoutTxnId?: string) => {
    setWithdrawals((prev) =>
      prev.map((item) => {
        if (item.id === withdrawalId) {
          // If rejected, refund the coins back to the user
          if (status === 'rejected' && item.status === 'pending') {
            creditCoins(item.coinsAmount, 'admin_adjustment', `Refund for Rejected Withdrawal #${item.id}: ${notes || 'Rejected by Admin'}`);
          }
          return {
            ...item,
            status,
            adminNotes: notes,
            payoutTxnId,
            processedAt: Date.now(),
          };
        }
        return item;
      })
    );
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        withdrawals,
        settings,
        canClaimDailyBonus,
        isDailyBonusAvailable: canClaimDailyBonus,
        dailyStreak,
        dailyBonusStreak: dailyStreak,
        timeUntilNextSpin,
        isLuckySpinAvailable: timeUntilNextSpin === 0,
        claimDailyBonus,
        claimLuckySpin,
        spinLuckyWheel,
        watchRewardedAd,
        submitWithdrawal,
        submitKyc,
        creditCoins,
        debitCoins,
        updateSettings,
        updateWithdrawalStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
