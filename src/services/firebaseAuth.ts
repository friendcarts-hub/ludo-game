import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from './firebase';
import {
  getUserProfileFromFirestore,
  syncUserProfileToFirestore,
  handleFirestoreError,
  OperationType,
} from './firestoreService';
import { UserProfile } from '../types';

export interface FirebaseAuthResult {
  success: boolean;
  user?: UserProfile;
  bonusCoins?: number;
  message?: string;
}

// Generate referral code helper
const generateReferralCode = (name: string): string => {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'LUDO';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${rand}`;
};

// Create a default UserProfile object for a new user
export const createInitialUserProfile = (
  uid: string,
  email: string,
  displayName: string,
  photoURL: string = 'king',
  referralCode?: string
): UserProfile => {
  const initialCoins = referralCode ? 1500 : 1000;
  const myRefCode = generateReferralCode(displayName);
  const now = Date.now();

  const profile: UserProfile = {
    uid,
    email: email || `${uid}@ludoverse.io`,
    displayName: displayName || 'Ludo Champion',
    photoURL: photoURL || 'king',
    role: email.toLowerCase() === 'donarajwade@gmail.com' ? 'admin' : 'user',
    coins: initialCoins,
    xp: 100,
    level: 1,
    totalGames: 0,
    totalWins: 0,
    totalKills: 0,
    totalSixes: 0,
    winStreak: 0,
    highestWinStreak: 0,
    favoriteColor: 'red',
    referralCode: myRefCode,
    referralEarnings: 0,
    totalReferrals: 0,
    kycStatus: 'unverified',
    isBanned: false,
    dailyStreak: 1,
    createdAt: now,
    updatedAt: now,
  };

  if (referralCode && referralCode.trim()) {
    profile.referredBy = referralCode.trim();
  }

  return profile;
};

/**
 * Format Firebase Auth errors into clear, friendly messages
 */
export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'Authentication error occurred.';
  const code = error.code || '';
  const msg = error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'अमान्य ईमेल पता (Invalid email address format).';
    case 'auth/user-disabled':
      return 'यह खाता अक्षम कर दिया गया है (User account has been disabled).';
    case 'auth/user-not-found':
      return 'इस ईमेल से कोई खाता नहीं मिला। कृपया साइन अप करें (Account not found. Please Sign Up).';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'गलत पासवर्ड या क्रेडेंशियल। पुनः प्रयास करें (Invalid password or credentials).';
    case 'auth/email-already-in-use':
      return 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें (Email already registered. Please Login).';
    case 'auth/weak-password':
      return 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password should be at least 6 characters).';
    case 'auth/popup-closed-by-user':
      return 'Google साइन-इन विंडो बंद कर दी गई (Popup closed before sign in).';
    case 'auth/popup-blocked':
      return 'ब्राउज़र पॉपअप अवरुद्ध हो गया। कृपया पॉपअप अनुमति दें (Popup blocked by browser).';
    case 'auth/network-request-failed':
      return 'नेटवर्क समस्या। अपना इंटरनेट कनेक्शन जांचें (Network connection error).';
    case 'auth/operation-not-allowed':
      return 'प्रदाता सक्षम नहीं है। Firebase Console से सक्षम करें (Provider not enabled).';
    case 'auth/too-many-requests':
      return 'बहुत अधिक असफल प्रयास। कुछ देर बाद पुनः प्रयास करें (Too many attempts. Try again later).';
    default:
      return msg.replace('Firebase: ', '') || 'Authentication error. Please try again.';
  }
}

/**
 * 1. Register with Email and Password using Firebase Auth + Firestore
 */
export async function firebaseRegisterWithEmail(
  email: string,
  pass: string,
  name: string,
  referralCode?: string
): Promise<FirebaseAuthResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    // Update Firebase display name
    try {
      await updateProfile(fbUser, {
        displayName: name.trim(),
      });
    } catch {
      // Non-blocking
    }

    // Create and save user profile in Firestore
    const profile = createInitialUserProfile(
      fbUser.uid,
      fbUser.email || email,
      name.trim(),
      'king',
      referralCode?.trim()
    );

    await syncUserProfileToFirestore(profile);

    return {
      success: true,
      user: profile,
      bonusCoins: referralCode ? 500 : 0,
      message: 'पंजीकरण सफल! Ludoverse में आपका स्वागत है (Registration successful).',
    };
  } catch (err: any) {
    const friendly = formatFirebaseAuthError(err);
    throw new Error(friendly);
  }
}

/**
 * 2. Login with Email and Password using Firebase Auth + Firestore
 */
export async function firebaseLoginWithEmail(
  email: string,
  pass: string
): Promise<FirebaseAuthResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    // Retrieve user profile from Firestore
    let profile = await getUserProfileFromFirestore(fbUser.uid);

    if (!profile) {
      // Profile does not exist yet in Firestore, initialize it
      profile = createInitialUserProfile(
        fbUser.uid,
        fbUser.email || email,
        fbUser.displayName || email.split('@')[0] || 'Ludo Player',
        'king'
      );
      await syncUserProfileToFirestore(profile);
    }

    if (profile.isBanned) {
      await signOut(auth);
      throw new Error('आपका खाता प्रतिबंधित है (Your account has been suspended).');
    }

    return {
      success: true,
      user: profile,
      message: 'लॉगिन सफल (Login successful)!',
    };
  } catch (err: any) {
    const friendly = formatFirebaseAuthError(err);
    throw new Error(friendly);
  }
}

/**
 * 3. Sign In / Sign Up with Google Popup using Firebase Auth + Firestore
 */
export async function firebaseLoginWithGoogle(): Promise<FirebaseAuthResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Check if profile exists in Firestore
    let profile = await getUserProfileFromFirestore(fbUser.uid);

    if (!profile) {
      // First time Google sign in
      profile = createInitialUserProfile(
        fbUser.uid,
        fbUser.email || '',
        fbUser.displayName || 'Google Champion',
        'queen'
      );
      await syncUserProfileToFirestore(profile);
    }

    if (profile.isBanned) {
      await signOut(auth);
      throw new Error('आपका खाता प्रतिबंधित है (Your account has been suspended).');
    }

    return {
      success: true,
      user: profile,
      message: 'Google लॉगिन सफल (Google login successful)!',
    };
  } catch (err: any) {
    const friendly = formatFirebaseAuthError(err);
    throw new Error(friendly);
  }
}

/**
 * 4. Password Reset using Firebase Auth
 */
export async function firebaseResetPassword(email: string): Promise<boolean> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (err: any) {
    const friendly = formatFirebaseAuthError(err);
    throw new Error(friendly);
  }
}

/**
 * 5. Sign Out from Firebase Auth
 */
export async function firebaseLogout(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

/**
 * 6. Attach Firebase Auth State Listener
 */
export function subscribeToFirebaseAuth(
  onUserFound: (profile: UserProfile | null) => void
): () => void {
  if (!auth) return () => {};

  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      onUserFound(null);
      return;
    }

    try {
      let profile = await getUserProfileFromFirestore(fbUser.uid);
      if (!profile) {
        profile = createInitialUserProfile(
          fbUser.uid,
          fbUser.email || '',
          fbUser.displayName || 'Ludo Player',
          'king'
        );
        await syncUserProfileToFirestore(profile);
      }
      onUserFound(profile);
    } catch (err) {
      console.warn('Firebase Auth state profile load:', err);
    }
  });
}
