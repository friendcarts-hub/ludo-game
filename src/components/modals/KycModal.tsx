import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../game/audio';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [docType, setDocType] = useState('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
      soundManager.playVictory();
      updateProfile({ kycStatus: 'verified' });
    }, 1200);
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
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-black text-white">KYC Verification</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isDone || user?.kycStatus === 'verified' ? (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8 text-center space-y-3"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-white">KYC Verified Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your identity has been confirmed. You can now withdraw real cash winnings anytime without restrictions.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Continue to Wallet
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="py-4 space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      Select Identity Document
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'aadhaar', label: 'Aadhaar / National ID' },
                        { id: 'pan', label: 'PAN / Tax Card' },
                        { id: 'driving', label: 'Driving License' },
                        { id: 'passport', label: 'Passport' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            soundManager.playClick();
                            setDocType(item.id);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                            docType === item.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-sm'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">
                      Document Identification Number
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. 5482 1294 9283"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700 text-center cursor-pointer hover:border-slate-500 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-300 block">
                      Upload Document Photo (Front)
                    </span>
                    <span className="text-[10px] text-slate-500">Supports JPG, PNG, PDF (Max 5MB)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying Document...' : 'SUBMIT KYC FOR APPROVAL 🛡️'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
