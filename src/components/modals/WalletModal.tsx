import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Tv,
  Users,
  CreditCard,
  History,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { soundManager } from '../../game/audio';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWithdrawal: () => void;
  onOpenDailyBonus: () => void;
  onOpenLuckySpin: () => void;
  onOpenRewardedAd: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onOpenWithdrawal,
  onOpenDailyBonus,
  onOpenLuckySpin,
  onOpenRewardedAd,
}) => {
  const { balance, transactions, settings, creditCoins } = useWallet();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filteredTxns = transactions.filter((t) => (filter === 'all' ? true : t.type === filter));

  const handleBuyCoins = (amount: number, price: string) => {
    soundManager.playClaimReward();
    creditCoins(amount, 'admin_adjustment', `Purchased ${amount.toLocaleString()} Coin Package (${price})`);
    alert(`Success! ${amount.toLocaleString()} Coins added to your wallet.`);
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
                <Coins className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-black text-white">LudoVerse Coin Wallet</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balance Card */}
            <div className="my-4 p-5 rounded-3xl bg-gradient-to-br from-yellow-500/20 via-amber-600/10 to-slate-950 border-2 border-yellow-500/40 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Current Coin Balance
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono tracking-tight">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    ≈ {settings.currencySymbol}
                    {(balance / settings.coinToCashRate).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenWithdrawal();
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer transform active:scale-95 flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Withdraw Cash
              </button>
            </div>

            {/* Quick Earn Shortcuts Bar */}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-800">
              <button
                onClick={() => {
                  onClose();
                  onOpenDailyBonus();
                }}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-center transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] font-black text-white">Daily Bonus</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenLuckySpin();
                }}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-center transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-[11px] font-black text-white">Lucky Spin</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenRewardedAd();
                }}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-center transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95"
              >
                <Tv className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-black text-white">Watch Ad (+250)</span>
              </button>
            </div>

            {/* Transaction History & Store Tabs */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1">
              {/* Buy Coins Store */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Coin Packages (Instant Top-Up)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { amount: 1000, price: '$0.99', popular: false },
                    { amount: 5000, price: '$3.99', popular: true },
                    { amount: 15000, price: '$9.99', popular: false },
                  ].map((pack) => (
                    <div
                      key={pack.amount}
                      className={`p-2.5 rounded-2xl border text-center relative ${
                        pack.popular
                          ? 'bg-yellow-500/10 border-yellow-400'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                          Best Value
                        </span>
                      )}
                      <span className="text-sm font-black text-white block mt-1">
                        {pack.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleBuyCoins(pack.amount, pack.price)}
                        className="mt-1.5 w-full py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        {pack.price}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ledger Transactions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Transaction Ledger
                  </h4>
                  <div className="flex gap-1 relative">
                    {(['all', 'credit', 'debit'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          soundManager.playClick();
                          setFilter(f);
                        }}
                        className={`relative px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          filter === f ? 'text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter === f && (
                          <motion.div
                            layoutId="wallet-ledger-filter"
                            className="absolute inset-0 rounded-lg bg-amber-500 shadow-sm -z-0"
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          />
                        )}
                        <span className="relative z-10">{f}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={filter}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-1.5"
                    >
                      {filteredTxns.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs">
                          No transactions in this category.
                        </div>
                      ) : (
                        filteredTxns.map((tx, idx) => (
                          <div
                            key={`wallet-tx-${tx.id || idx}-${idx}`}
                            className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                                  tx.type === 'credit'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {tx.type === 'credit' ? (
                                  <ArrowDownLeft className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-[11px] truncate max-w-[200px]">
                                  {tx.description}
                                </p>
                                <span className="text-[9px] text-slate-500">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-black font-mono text-xs ${
                                  tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {tx.type === 'credit' ? '+' : '-'}
                                {tx.amount.toLocaleString()}
                              </span>
                              <span className="block text-[9px] text-slate-500 font-mono">
                                Bal: {tx.balanceAfter.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
