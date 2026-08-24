import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  limit,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserProfile, WalletTransaction, OnlinePlayer } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Removes any undefined values from objects before sending to Firestore
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

export interface FirestoreTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  date: number;
  paymentMethod?: string;
  referenceId?: string;
}

/**
 * Saves or synchronizes a user profile to Firestore
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!db || !profile.uid) return;
  const path = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    const dataToSave = cleanForFirestore({
      ...profile,
      updatedAt: Date.now(),
    });
    await setDoc(userRef, dataToSave, { merge: true });

    // Also update leaderboard entry if user has played matches
    if (profile.totalWins > 0 || profile.totalGames > 0) {
      const leaderRef = doc(db, 'leaderboards', profile.uid);
      const leaderData = cleanForFirestore({
        userId: profile.uid,
        displayName: profile.displayName || 'Player',
        photoURL: profile.photoURL || 'king',
        totalWins: profile.totalWins || 0,
        totalGames: profile.totalGames || 0,
        rating: 1400 + profile.totalWins * 25,
        coinsWon: profile.coins || 0,
        winRate:
          profile.totalGames > 0
            ? `${Math.round((profile.totalWins / profile.totalGames) * 100)}%`
            : '0%',
        updatedAt: Date.now(),
      });
      await setDoc(leaderRef, leaderData, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Retrieves a user profile from Firestore
 */
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!db || !uid) return null;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Saves a wallet transaction to Firestore subcollection
 */
export async function saveTransactionToFirestore(
  userId: string,
  transaction: FirestoreTransaction
): Promise<void> {
  if (!db || !userId || !transaction.id) return;
  const path = `users/${userId}/transactions/${transaction.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transaction.id);
    const cleanedTx = cleanForFirestore(transaction);
    await setDoc(txRef, cleanedTx, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetches transactions for a user
 */
export async function getUserTransactionsFromFirestore(userId: string): Promise<WalletTransaction[]> {
  if (!db || !userId) return [];
  const path = `users/${userId}/transactions`;
  try {
    const txCol = collection(db, 'users', userId, 'transactions');
    const q = query(txCol, orderBy('date', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as FirestoreTransaction;
      return {
        id: data.id,
        userId: data.userId,
        type: data.type === 'game_entry' || data.type === 'withdrawal' ? 'debit' : 'credit',
        category: (data.type as any) || 'daily_bonus',
        amount: data.amount,
        description: data.description || 'Transaction',
        balanceAfter: 0,
        status: (data.status as any) || 'completed',
        timestamp: data.date,
        referenceId: data.referenceId,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Real-time listener for user profile updates
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile) => void
): () => void {
  if (!db || !uid) return () => {};
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as UserProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Publishes user online presence to Firestore
 */
export async function publishUserOnlinePresence(
  user: UserProfile,
  status: 'online' | 'in_lobby' | 'playing' | 'matchmaking' = 'in_lobby',
  statusText?: string,
  gameMode?: string
): Promise<void> {
  if (!db || !user?.uid) return;
  const path = `online_users/${user.uid}`;
  try {
    const presenceRef = doc(db, 'online_users', user.uid);
    const winPercentage =
      user.totalGames > 0 ? `${Math.round((user.totalWins / user.totalGames) * 100)}%` : '0%';
    
    const payload = cleanForFirestore({
      uid: user.uid,
      displayName: user.displayName || 'Ludo Champion',
      photoURL: user.photoURL || 'king',
      coins: user.coins || 0,
      level: user.level || 1,
      totalWins: user.totalWins || 0,
      winRate: winPercentage,
      rating: 1400 + (user.totalWins || 0) * 25,
      status: status,
      statusText: statusText || (status === 'playing' ? `Playing ${gameMode || 'Match'}` : 'Online in Lobby'),
      gameMode: gameMode || 'lobby',
      lastActive: Date.now(),
      isOnline: true,
      isRealUser: true,
    });

    await setDoc(presenceRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sets user status to offline in Firestore
 */
export async function setUserOfflinePresence(userId: string): Promise<void> {
  if (!db || !userId) return;
  const path = `online_users/${userId}`;
  try {
    const presenceRef = doc(db, 'online_users', userId);
    await setDoc(
      presenceRef,
      {
        isOnline: false,
        status: 'online',
        statusText: 'Offline',
        lastActive: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for all active online users from Firestore
 */
export function subscribeToOnlineUsers(
  onUpdate: (players: OnlinePlayer[]) => void
): () => void {
  if (!db) return () => {};
  const path = 'online_users';
  try {
    const colRef = collection(db, 'online_users');
    const q = query(colRef, limit(60));

    return onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        // Filter users who are marked online and have pulsed within last 3 minutes
        const activeUsers: OnlinePlayer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as OnlinePlayer;
          if (data && data.uid) {
            const isFresh = !data.lastActive || now - data.lastActive < 1000 * 60 * 3; // 3 minutes threshold
            if (data.isOnline !== false && isFresh) {
              activeUsers.push({
                ...data,
                isRealUser: true,
              });
            }
          }
        });
        onUpdate(activeUsers);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

