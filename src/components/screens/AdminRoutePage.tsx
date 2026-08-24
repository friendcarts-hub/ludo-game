import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Shield } from 'lucide-react';
import { soundManager } from '../../game/audio';
import { AdminDashboardModal } from '../modals/AdminDashboardModal';

interface AdminRoutePageProps {
  onBackToLobby: () => void;
}

export const AdminRoutePage: React.FC<AdminRoutePageProps> = ({ onBackToLobby }) => {
  return (
    <div className="min-h-screen w-full bg-[#04040a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with back to game button */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 z-10">
        <button
          onClick={() => {
            soundManager.playClick();
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Game Lobby</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-[10px] font-mono font-black uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Restricted Route (/admin)</span>
        </div>
      </div>

      {/* Always render the full AdminDashboardModal with built-in dedicated authentication form */}
      <AdminDashboardModal
        isOpen={true}
        onClose={() => {
          onBackToLobby();
        }}
      />
    </div>
  );
};
