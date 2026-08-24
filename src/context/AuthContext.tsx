import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PlayerColor } from '../types';
import { soundManager } from '../game/audio';
import {
  firebaseRegisterWithEmail,
  firebaseLoginWithEmail,
  firebaseLoginWithGoogle,
  firebaseResetPassword,
  firebaseLogout,
  subscribeToFirebaseAuth,
} from '../services/firebaseAuth';
import {
  apiSignup,
  apiLogin,
  apiGoogleLogin,
  apiSendPhoneOtp,
  apiVerifyPhoneOtp,
  apiGuestLogin,
  apiGetMe,
  apiUpdateProfile,
  apiResetPassword,
  authStorage,
} from '../services/apiAuth';
import {
  syncUserProfileToFirestore,
  getUserProfileFromFirestore,
  subscribeToUserProfile,
} from '../services/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signupWithEmail: (email: string, pass: string, name: string, referralCode?: string) => Promise<{ success: boolean; bonusCoins?: number }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<boolean>;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  loginAsGuest: (customName?: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleAdminRole: () => void;
  clearError: () => void;
}

const STORAGE_KEY = 'ludoverse_user_session';

const DEFAULT_GUEST: UserProfile = {
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only restore if real authenticated user
          if (
            parsed &&
            parsed.uid &&
            parsed.uid !== 'guest' &&
            parsed.email !== 'player@ludoverse.io' &&
            !parsed.isBanned
          ) {
            return parsed;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Listen for Firebase Auth State Changes & Sync with Firestore
  useEffect(() => {
    const unsubscribeFb = subscribeToFirebaseAuth((fbProfile) => {
      if (fbProfile) {
        setUser(fbProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fbProfile));
      }
    });

    // Verify backend session as fallback
    async function verifyBackendSession() {
      try {
        const remoteUser = await apiGetMe();
        if (remoteUser) {
          setUser((prev) => prev || remoteUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteUser));
        }
      } catch (err) {
        // use cached profile
      }
    }
    verifyBackendSession();

    return () => {
      unsubscribeFb();
    };
  }, []);

  // 2. Real-time sync of current user profile from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    // Subscribe to live Firestore user document updates
    const unsubscribeFirestore = subscribeToUserProfile(user.uid, (updatedProfile) => {
      if (updatedProfile) {
        setUser((prev) => {
          if (!prev) return updatedProfile;
          // Merge to preserve latest state
          return { ...prev, ...updatedProfile };
        });
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, [user?.uid]);

  const clearError = () => setAuthError(null);

  // 1. Email & Password Login connected with Firebase Auth
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // Primary: Firebase Auth Login
      try {
        const res = await firebaseLoginWithEmail(email, pass);
        if (res.user) {
          setUser(res.user);
          soundManager.playClick();
          return true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase email login note:', fbErr.message);
        // Fallback to API if Firebase client threw non-credential error
        if (
          fbErr.message.includes('not initialized') ||
          fbErr.message.includes('Network connection') ||
          fbErr.message.includes('Provider not enabled')
        ) {
          const resp = await apiLogin(email, pass);
          if (resp.user) {
            setUser(resp.user);
            soundManager.playClick();
            return true;
          }
        }
        throw fbErr;
      }
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email & Password Signup connected with Firebase Auth + Firestore
  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string,
    referralCode?: string
  ): Promise<{ success: boolean; bonusCoins?: number }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // Primary: Firebase Auth Registration
      try {
        const res = await firebaseRegisterWithEmail(email, pass, name, referralCode);
        if (res.user) {
          setUser(res.user);
          soundManager.playVictory();
          return { success: true, bonusCoins: res.bonusCoins };
        }
      } catch (fbErr: any) {
        console.warn('Firebase registration note:', fbErr.message);
        if (
          fbErr.message.includes('not initialized') ||
          fbErr.message.includes('Network connection') ||
          fbErr.message.includes('Provider not enabled')
        ) {
          const resp = await apiSignup(email, pass, name, referralCode);
          if (resp.user) {
            setUser(resp.user);
            soundManager.playVictory();
            return { success: true, bonusCoins: resp.bonusCoinsAwarded };
          }
        }
        throw fbErr;
      }
      return { success: false };
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google Sign-In connected with Firebase Auth Popup + Firestore
  const loginWithGoogle = async (email?: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      try {
        const res = await firebaseLoginWithGoogle();
        if (res.user) {
          setUser(res.user);
          soundManager.playClick();
          return true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase Google Sign-In note:', fbErr.message);
        // If popup closed or blocked, don't silently bypass
        if (fbErr.message.includes('Popup closed') || fbErr.message.includes('Popup blocked')) {
          throw fbErr;
        }
        // Fallback to API Google login if needed
        const resp = await apiGoogleLogin(email, name);
        if (resp.user) {
          setUser(resp.user);
          soundManager.playClick();
          return true;
        }
        throw fbErr;
      }
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Send Phone OTP
  const sendPhoneOtp = async (phone: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const resp = await apiSendPhoneOtp(phone);
      return {
        success: true,
        message: resp.message || 'OTP Sent',
        demoOtp: resp.demoOtp,
      };
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send OTP.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Verify Phone OTP & Sync with Firestore
  const loginWithPhoneOtp = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const resp = await apiVerifyPhoneOtp(phone, otp);
      if (resp.user) {
        setUser(resp.user);
        await syncUserProfileToFirestore(resp.user);
        soundManager.playClick();
        return true;
      }
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'OTP Verification failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Guest Login with Backend & Firestore
  const loginAsGuest = async (customName?: string) => {
    setIsLoading(true);
    try {
      const resp = await apiGuestLogin(customName);
      if (resp.user) {
        setUser(resp.user);
        await syncUserProfileToFirestore(resp.user);
      } else {
        const guestId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
        const guestProfile: UserProfile = {
          ...DEFAULT_GUEST,
          uid: guestId,
          email: `${guestId}@ludoverse.io`,
          displayName: customName || `Guest ${guestId.slice(-4)}`,
          photoURL: 'ninja',
        };
        setUser(guestProfile);
        await syncUserProfileToFirestore(guestProfile);
      }
      soundManager.playClick();
    } catch (err) {
      const guestId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
      const guestProfile: UserProfile = {
        ...DEFAULT_GUEST,
        uid: guestId,
        email: `${guestId}@ludoverse.io`,
        displayName: customName || `Guest ${guestId.slice(-4)}`,
        photoURL: 'ninja',
      };
      setUser(guestProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Reset Password with Firebase Auth
  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      try {
        await firebaseResetPassword(email);
        return true;
      } catch (fbErr: any) {
        console.warn('Firebase reset password note:', fbErr.message);
        await apiResetPassword(email);
        return true;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Password reset failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Logout from Firebase & Local session
  const logout = async () => {
    soundManager.playClick();
    authStorage.removeToken();
    localStorage.removeItem(STORAGE_KEY);
    await firebaseLogout();
    setUser(null);
  };

  // 9. Update Profile with Firestore and Backend Sync
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...data,
      updatedAt: Date.now(),
    };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    try {
      await syncUserProfileToFirestore(updatedUser);
    } catch (err) {
      console.warn('Firestore updateProfile warning:', err);
    }

    try {
      await apiUpdateProfile(data);
    } catch (err) {
      // Keep state
    }
  };

  // 10. Toggle Admin Role for testing/demo
  const toggleAdminRole = async () => {
    if (!user) return;
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser: UserProfile = { ...user, role: nextRole, updatedAt: Date.now() };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    await syncUserProfileToFirestore(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !user.isBanned,
        isAdmin: user?.role === 'admin',
        isLoading,
        authError,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithPhoneOtp,
        sendPhoneOtp,
        loginAsGuest,
        logout,
        resetPassword,
        updateProfile,
        toggleAdminRole,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
