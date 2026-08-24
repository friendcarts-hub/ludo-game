import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  Phone,
  User,
  Gift,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  Eye,
  EyeOff,
  CheckCircle2,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../game/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'phone';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginWithPhoneOtp,
    sendPhoneOtp,
    loginAsGuest,
    resetPassword,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'phone' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [referral, setReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError('');
      setSuccessMsg('');
      setOtpSent(false);
      setDemoOtpCode(null);
    }
  }, [isOpen, defaultMode]);

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setOtpSent(false);
    setDemoOtpCode(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('कृपया अपना नाम दर्ज करें (Please enter your name).');
          return;
        }
        if (password.length < 6) {
          setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password must be at least 6 characters).');
          return;
        }
        const res = await signupWithEmail(email, password, name, referral);
        if (res.success) {
          setSuccessMsg(
            res.bonusCoins
              ? `🎉 बधाई! खाता सफलतापूर्वक बन गया और ${res.bonusCoins} बोनस सिक्के मिले!`
              : '🎉 आपका खाता सफलतापूर्वक बन गया है! (Signup successful)'
          );
          soundManager.playVictory();
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        const success = await loginWithEmail(email, password);
        if (success) {
          setSuccessMsg('✅ लॉगिन सफल रहा! (Login successful)');
          soundManager.playVictory();
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'प्रमाणीकरण विफल रहा। कृपया विवरण जांचें। (Authentication failed)');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle('donarajwade@gmail.com', 'Dona Rajwade');
      setSuccessMsg('✅ Google से लॉगिन सफल रहा!');
      soundManager.playVictory();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Google sign-in error.');
    }
  };

  const handlePhoneOtpFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpSent) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile).');
        return;
      }
      try {
        const res = await sendPhoneOtp(cleanPhone);
        if (res.success) {
          setOtpSent(true);
          if (res.demoOtp) {
            setDemoOtpCode(res.demoOtp);
            setOtp(res.demoOtp); // Auto-fill for convenience
          }
          setSuccessMsg(res.message || `+91 ${cleanPhone} पर OTP भेजा गया!`);
        }
      } catch (err: any) {
        setError(err.message || 'OTP भेजने में विफल रहे।');
      }
    } else {
      if (!otp.trim() || otp.length < 4) {
        setError('कृपया सही OTP दर्ज करें (Please enter the OTP).');
        return;
      }
      try {
        await loginWithPhoneOtp(phone, otp);
        setSuccessMsg('✅ फोन नंबर सत्यापित हुआ! (Phone verified)');
        soundManager.playVictory();
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err: any) {
        setError(err.message || 'अमान्य OTP (Invalid OTP code).');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('कृपया अपना पंजीकृत ईमेल दर्ज करें (Please enter your email).');
      return;
    }
    try {
      await resetPassword(email);
      setSuccessMsg(`पासवर्ड रीसेट लिंक ${email} पर भेज दिया गया है।`);
    } catch (err: any) {
      setError(err.message || 'पासवर्ड रीसेट विफल रहा।');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md bg-[#090a18] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col relative overflow-hidden text-white"
          >
            {/* Top Status & Close Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  🎲
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                    {mode === 'login'
                      ? 'LudoVerse Login'
                      : mode === 'signup'
                      ? 'LudoVerse Signup'
                      : mode === 'phone'
                      ? 'Phone OTP Login'
                      : 'Reset Password'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Backend Server Live & Connected</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auth Mode Toggle Tabs with Spring Pill */}
            <div className="grid grid-cols-3 gap-1.5 my-3.5 bg-black/40 p-1 rounded-2xl border border-white/10 relative">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setMode('login');
                  resetForm();
                }}
                className={`relative py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'login' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span>लॉगिन (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setMode('signup');
                  resetForm();
                }}
                className={`relative py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'signup' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span>साइन अप (Sign Up)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setMode('phone');
                  resetForm();
                }}
                className={`relative py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'phone' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'phone' && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span>फोन OTP</span>
              </button>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-300 bg-red-950/60 p-3 rounded-2xl border border-red-500/40 mb-3 flex items-start gap-2"
              >
                <span className="text-red-400 font-bold">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-300 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/40 mb-3 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* 1. EMAIL & PASSWORD LOGIN / SIGNUP */}
              {(mode === 'login' || mode === 'signup') && (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleEmailAuth}
                  className="space-y-3"
                >
                  {mode === 'signup' && (
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block">
                        आपका नाम / Player Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma or LudoKing"
                          required
                          className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">
                      ईमेल पता / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="player@example.com"
                        required
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        पासवर्ड / Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            resetForm();
                          }}
                          className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          पासवर्ड भूल गए? (Forgot?)
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">
                          रेफरल कोड / Referral Code (वैकल्पिक)
                        </label>
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> +500 मुफ़्त सिक्के
                        </span>
                      </div>
                      <div className="relative">
                        <Gift className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={referral}
                          onChange={(e) => setReferral(e.target.value.toUpperCase())}
                          placeholder="e.g. LUDO777 या DONA777"
                          className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        प्रक्रिया जारी है...
                      </span>
                    ) : mode === 'signup' ? (
                      'नया खाता बनाएं (CREATE ACCOUNT) 🚀'
                    ) : (
                      'लॉगिन करें (SIGN IN) 🎲'
                    )}
                  </button>
                </motion.form>
              )}

              {/* 2. PHONE OTP LOGIN */}
              {mode === 'phone' && (
                <motion.form
                  key="phone"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handlePhoneOtpFlow}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">
                      मोबाइल नंबर / Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        disabled={otpSent}
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-12 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">
                          6 अंकों का OTP दर्ज करें
                        </label>
                        {demoOtpCode && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            Demo OTP: {demoOtpCode}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full bg-black/50 border border-cyan-500/50 rounded-xl px-3.5 py-2 text-center font-mono font-bold text-base text-white tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'सत्यापित कर रहे हैं...'
                    ) : otpSent ? (
                      'OTP सत्यापित करें (VERIFY & LOGIN) 🛡️'
                    ) : (
                      'OTP भेजें (SEND OTP) 📲'
                    )}
                  </button>
                </motion.form>
              )}

              {/* 3. FORGOT PASSWORD */}
              {mode === 'forgot' && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">
                      पंजीकृत ईमेल / Registered Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@example.com"
                      required
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    रीसेट लिंक भेजें (SEND RESET LINK) ✉️
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs text-slate-400 hover:text-white pt-1"
                  >
                    वापस लॉगिन पर जाएं (Back to Login)
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social Authentication */}
            <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>🌐 Google खाते से जारी रखें (Continue with Google)</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
