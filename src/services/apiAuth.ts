import { UserProfile } from '../types';

const TOKEN_KEY = 'ludoverse_auth_token';

export interface AuthApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
  bonusCoinsAwarded?: number;
  demoOtp?: string;
}

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// 1. Signup API
export async function apiSignup(
  email: string,
  password: string,
  name: string,
  referralCode?: string
): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, referralCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Server connection error during signup.');
  }
}

// 2. Login API
export async function apiLogin(email: string, password: string): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Invalid email or password');
    }
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Server connection error during login.');
  }
}

// 3. Google Sign-In API
export async function apiGoogleLogin(
  email: string = 'donarajwade@gmail.com',
  name: string = 'Dona Rajwade'
): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, photoURL: 'queen' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Google login failed');
    }
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Google authentication error.');
  }
}

// 4. Send Phone OTP
export async function apiSendPhoneOtp(phone: string): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/phone-send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Network error sending OTP.');
  }
}

// 5. Verify Phone OTP
export async function apiVerifyPhoneOtp(phone: string, otp: string): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/phone-verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Error verifying phone number.');
  }
}

// 6. Guest Login API
export async function apiGuestLogin(customName?: string): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Guest login error');
    }
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to initialize guest session.');
  }
}

// 7. Get Current Session
export async function apiGetMe(): Promise<UserProfile | null> {
  try {
    const token = authStorage.getToken();
    if (!token) return null;

    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      authStorage.removeToken();
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    return null;
  }
}

// 8. Update Profile in Backend
export async function apiUpdateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    return null;
  }
}

// 9. Reset Password Request
export async function apiResetPassword(email: string): Promise<AuthApiResponse> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send reset link');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Password reset failed.');
  }
}

// 10. Sync Wallet Coins with Backend
export async function apiSyncWallet(deltaCoins: number, reason: string): Promise<number | null> {
  try {
    const res = await fetch('/api/wallet/sync', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ deltaCoins, reason }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.newBalance ?? null;
  } catch (err) {
    return null;
  }
}
