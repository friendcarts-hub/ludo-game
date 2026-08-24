import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
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
  Sparkles,
  Zap,
  Award,
  Users,
  Coins,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../game/audio';

interface AuthScreenProps {
  onBackToLobby?: () => void;
  initialMode?: 'login' | 'signup' | 'phone';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onBackToLobby,
  initialMode = 'login',
}) => {
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

  const [mode, setMode] = useState<'login' | 'signup' | 'phone' | 'forgot'>(initialMode);
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
          setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password must be min 6 characters).');
          return;
        }
        const res = await signupWithEmail(email, password, name, referral);
        if (res.success) {
          setSuccessMsg(
            res.bonusCoins
              ? `🎉 बधाई! खाता बन गया और ${res.bonusCoins} बोनस सिक्के मिले!`
              : '🎉 आपका खाता सफलतापूर्वक बन गया है!'
          );
          soundManager.playVictory();
          if (onBackToLobby) {
            setTimeout(onBackToLobby, 1000);
          }
        }
      } else {
        const success = await loginWithEmail(email, password);
        if (success) {
          setSuccessMsg('✅ लॉगिन सफल रहा! (Login successful)');
          soundManager.playVictory();
          if (onBackToLobby) {
            setTimeout(onBackToLobby, 800);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'प्रमाणीकरण विफल रहा। (Authentication failed)');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle('donarajwade@gmail.com', 'Dona Rajwade');
      setSuccessMsg('✅ Google से लॉगिन सफल रहा!');
      soundManager.playVictory();
      if (onBackToLobby) {
        setTimeout(onBackToLobby, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Google login error.');
    }
  };

  const handlePhoneOtpFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpSent) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।');
        return;
      }
      try {
        const res = await sendPhoneOtp(cleanPhone);
        if (res.success) {
          setOtpSent(true);
          if (res.demoOtp) {
            setDemoOtpCode(res.demoOtp);
            setOtp(res.demoOtp);
          }
          setSuccessMsg(res.message || `+91 ${cleanPhone} पर OTP भेजा गया!`);
        }
      } catch (err: any) {
        setError(err.message || 'OTP भेजने में विफल रहे।');
      }
    } else {
      if (!otp.trim() || otp.length < 4) {
        setError('कृपया सही OTP दर्ज करें।');
        return;
      }
      try {
        await loginWithPhoneOtp(phone, otp);
        setSuccessMsg('✅ फोन नंबर सत्यापित हुआ!');
        soundManager.playVictory();
        if (onBackToLobby) {
          setTimeout(onBackToLobby, 800);
        }
      } catch (err: any) {
        setError(err.message || 'अमान्य OTP।');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('कृपया अपना पंजीकृत ईमेल दर्ज करें।');
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
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-8 relative">
      {/* Dynamic Ambient Background Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
        {/* Left Side: Game Branding, Highlights & Stats */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="self-start inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> वापस लॉबी में जाएं (Back to Lobby)
            </button>
          )}

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> सुरक्षित बैकएंड प्रमाणीकरण
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              LUDO<span className="text-cyan-400">VERSE</span> PRO
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              असली खिलाड़ियों के साथ 3D लूडो खेलें, वास्तविक सिक्के जीतें और अपनी रैंकिंग को लाइव सर्वर पर सुरक्षित रखें।
            </p>
          </div>

          {/* Value Propositions */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">3,500 मुफ़्त स्वागत सिक्के (Free Welcome Bonus)</h4>
                <p className="text-[11px] text-slate-400">साइन अप करते ही तुरंत 3,500 सिक्के पाएं और गेम खेलें।</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">14,800+ लाइव खिलाड़ी (Real Multiplayer)</h4>
                <p className="text-[11px] text-slate-400">24/7 तुरंत मैचमेकिंग और दोस्तों के साथ प्राइवेट रूम्स।</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">100% सुरक्षित और सुरक्षित निकासी (Fast Payouts)</h4>
                <p className="text-[11px] text-slate-400">UPI और बैंक ट्रांसफर द्वारा सीधे सुरक्षित निकासी।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="lg:col-span-7">
          <div className="w-full bg-[#090a18]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-2xl relative overflow-hidden text-white">
            {/* Header Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black text-white">
                  {mode === 'login'
                    ? 'लॉगिन करें (Account Login)'
                    : mode === 'signup'
                    ? 'नया खाता बनाएं (Sign Up)'
                    : mode === 'phone'
                    ? 'फोन नंबर OTP लॉगिन'
                    : 'पासवर्ड रीसेट'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'signup'
                    ? 'नया खाता खोलें और तुरंत 3,500 + 500 बोनस सिक्के प्राप्त करें'
                    : 'अपने खाते में प्रवेश करें और खेल शुरू करें'}
                </p>
              </div>
            </div>

            {/* Mode Selector Tabs with Motion Pill */}
            <div className="grid grid-cols-3 gap-1.5 my-5 bg-black/40 p-1.5 rounded-2xl border border-white/10 relative">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setMode('login');
                  resetForm();
                }}
                className={`relative py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'login' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="auth-screen-tab"
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
                className={`relative py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'signup' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="auth-screen-tab"
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
                className={`relative py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 z-10 ${
                  mode === 'phone' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'phone' && (
                  <motion.div
                    layoutId="auth-screen-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span>फोन OTP</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-300 bg-red-950/60 p-3 rounded-2xl border border-red-500/40 mb-4 flex items-start gap-2"
              >
                <span className="text-red-400 font-bold">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-300 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/40 mb-4 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* 1. EMAIL & PASSWORD LOGIN / SIGNUP FORM */}
              {(mode === 'login' || mode === 'signup') && (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleEmailAuth}
                  className="space-y-4"
                >
                  {mode === 'signup' && (
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                        आपका नाम / Gamer Tag
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. LudoKing या Rahul"
                          required
                          className="w-full bg-black/50 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      ईमेल पता / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full bg-black/50 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
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
                          className="text-xs text-cyan-400 hover:underline cursor-pointer"
                        >
                          पासवर्ड भूल गए?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full bg-black/50 border border-white/15 rounded-2xl pl-10 pr-12 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          रेफरल कोड / Referral Code (वैकल्पिक)
                        </label>
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> +500 मुफ़्त सिक्के
                        </span>
                      </div>
                      <div className="relative">
                        <Gift className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={referral}
                          onChange={(e) => setReferral(e.target.value.toUpperCase())}
                          placeholder="उदा: LUDO777 या DONA777"
                          className="w-full bg-black/50 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        सर्वर से जुड़ रहे हैं...
                      </span>
                    ) : mode === 'signup' ? (
                      'खाता बनाएं और 3,500 सिक्के पाएं (CREATE ACCOUNT) 🚀'
                    ) : (
                      'लॉगिन करें (SIGN IN TO PLAY) 🎲'
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
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      मोबाइल नंबर / Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        disabled={otpSent}
                        className="w-full bg-black/50 border border-white/15 rounded-2xl pl-12 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          6 अंकों का OTP कोड
                        </label>
                        {demoOtpCode && (
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            Demo Code: {demoOtpCode}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full bg-black/50 border border-cyan-500/50 rounded-2xl px-4 py-2.5 text-center font-mono font-bold text-lg text-white tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'सत्यापित हो रहा है...'
                    ) : otpSent ? (
                      'OTP सत्यापित करें और खेलें (VERIFY & LOGIN) 🛡️'
                    ) : (
                      'OTP कोड भेजें (SEND OTP) 📲'
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
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      पंजीकृत ईमेल / Registered Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@example.com"
                      required
                      className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all active:scale-95"
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
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <span className="text-base">🌐</span>
                <span>Google खाते से तुरंत जुड़ें (Continue with Google)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
