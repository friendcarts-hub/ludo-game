import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Building,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../game/audio';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKyc: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onOpenKyc }) => {
  const { user } = useAuth();
  const { balance, withdrawals, settings, submitWithdrawal } = useWallet();

  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [coinAmount, setCoinAmount] = useState<string>('2000');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState(user?.displayName || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const minCoins = settings?.minWithdrawalCoins ?? 2000;
  const rate = settings?.coinToCashRate || 1000;
  const currSym = settings?.currencySymbol || '$';
  const parsedCoins = parseInt(coinAmount) || 0;
  const cashValue = (parsedCoins / rate).toFixed(2);

  const isKycVerified = user?.kycStatus === 'verified';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isKycVerified) {
      setErrorMsg('KYC Verification is required to withdraw real cash earnings.');
      return;
    }

    if (parsedCoins < minCoins) {
      setErrorMsg(`Minimum withdrawal is ${minCoins.toLocaleString()} Coins.`);
      return;
    }

    if (parsedCoins > balance) {
      setErrorMsg('Requested coin amount exceeds current available balance.');
      return;
    }

    if (method === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      setErrorMsg('Please enter a valid UPI ID (e.g. name@okhdfcbank).');
      return;
    }

    if (method === 'bank' && (!accountNumber.trim() || !ifscCode.trim() || !accountHolder.trim())) {
      setErrorMsg('Please fill in all bank account details.');
      return;
    }

    const details =
      method === 'upi'
        ? { upiId: upiId.trim() }
        : {
            bankDetails: {
              accountNumber: accountNumber.trim(),
              ifscCode: ifscCode.trim().toUpperCase(),
              holderName: accountHolder.trim(),
              bankName: 'Direct Bank Wire',
            },
          };

    const res = await submitWithdrawal(parsedCoins, method === 'upi' ? 'upi' : 'bank_transfer', details);
    if (res.success) {
      soundManager.playVictory();
      setSuccessMsg(res.message || `Withdrawal of ${currSym}${cashValue} submitted for processing!`);
      setCoinAmount((minCoins ?? 2000).toString());
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
    } else {
      setErrorMsg(res.message || 'Failed to process withdrawal. Check your balance.');
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-black text-white">Cashout Winnings</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KYC Status Badge Bar */}
            <div className="py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                {isKycVerified ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">
                    KYC Identity: {user?.kycStatus ? user.kycStatus.toUpperCase() : 'PENDING'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isKycVerified
                      ? 'Government ID verified for secure payouts.'
                      : 'Submit ID proof for instant payout approvals.'}
                  </span>
                </div>
              </div>

              {!isKycVerified && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenKyc();
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Verify KYC
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setMethod('upi');
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'upi'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left">
                    <span className="text-xs font-black block text-white">Instant UPI</span>
                    <span className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setMethod('bank');
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    method === 'bank'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <div className="text-left">
                    <span className="text-xs font-black block text-white">Direct Bank Wire</span>
                    <span className="text-[10px] text-slate-400">NEFT / IMPS transfer</span>
                  </div>
                </button>
              </div>

              {/* Amount Calculator */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Coins to Cashout</span>
                  <span className="text-yellow-400">Bal: {balance.toLocaleString()}</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    min={minCoins}
                    max={balance}
                    step={100}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Coins
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">
                    Rate: {settings.coinToCashRate} Coins = {settings.currencySymbol}1.00
                  </span>
                  <span className="font-black text-emerald-400 text-sm">
                    Payout: {settings.currencySymbol}
                    {cashValue}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <AnimatePresence mode="wait">
                  {method === 'upi' ? (
                    <motion.div
                      key="upi-input"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <label className="text-xs font-bold text-slate-300 mb-1 block">
                        Enter UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi or username@okhdfcbank"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bank-inputs"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2.5"
                    >
                      <div>
                        <label className="text-xs font-bold text-slate-300 mb-1 block">
                          Account Holder Full Name
                        </label>
                        <input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 block">
                            Bank Account Number
                          </label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-300 mb-1 block">IFSC Code</label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            placeholder="e.g. HDFC0001234"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white uppercase"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {errorMsg && (
                  <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-500/40">
                    {errorMsg}
                  </p>
                )}

                {successMsg && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/40">
                    {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  SUBMIT CASHOUT REQUEST 💳
                </button>
              </form>

              {/* Past Requests History */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Payout Requests History
                </h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      No withdrawal requests yet.
                    </div>
                  ) : (
                    withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            {w.currency || settings?.currencySymbol || '$'}
                            {w.cashAmount.toFixed(2)} ({w.coinsAmount.toLocaleString()} Coins)
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {w.method.toUpperCase()} • {new Date(w.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {w.status === 'approved' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                          {w.status === 'pending' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {w.status === 'rejected' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
