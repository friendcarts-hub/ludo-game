import React, { useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, Tv } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { adsterraService } from '../../services/adsterraService';

interface AdsterraBannerProps {
  format?: 'banner' | 'leaderboard' | 'box';
  className?: string;
  showDirectLinkButton?: boolean;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  format = 'banner',
  className = '',
  showDirectLinkButton = true,
}) => {
  const { settings } = useWallet();
  const bannerRef = useRef<HTMLDivElement>(null);

  const isEnabled = settings.adsterraEnabled ?? true;
  const directLink = settings.adsterraDirectLink || 'https://www.profitablecpmrate.com/y3e2t8h45j?key=adsterra_ludoverse_direct';

  useEffect(() => {
    if (bannerRef.current && isEnabled) {
      adsterraService.setConfig({
        enabled: settings.adsterraEnabled,
        directLink: settings.adsterraDirectLink,
        bannerKey: settings.adsterraBannerKey,
        popunderEnabled: settings.adsterraPopunderEnabled,
        rewardCoins: settings.adsterraAdWatchReward,
      });
      adsterraService.injectBanner(bannerRef.current, settings.adsterraBannerKey);
    }
  }, [settings, isEnabled]);

  if (!isEnabled) return null;

  const handleOpenAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    adsterraService.triggerDirectLink(directLink);
  };

  return (
    <div
      onClick={handleOpenAd}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/60 to-slate-950 border border-purple-500/30 hover:border-purple-400/60 transition-all cursor-pointer shadow-lg group ${
        format === 'box'
          ? 'p-4 flex flex-col items-center justify-center text-center min-h-[160px]'
          : format === 'leaderboard'
          ? 'p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 min-h-[80px]'
          : 'p-2.5 sm:p-3 flex items-center justify-between gap-2'
      } ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

      {/* Adsterra Sponsor Tag & Info */}
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
          <Tv className="w-4 h-4 text-purple-400 animate-pulse" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-400/40">
              SPONSOR • ADSTERRA
            </span>
            <span className="text-[10px] text-amber-400 font-bold hidden sm:inline flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 inline" /> Free Games Partner
            </span>
          </div>
          <p className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-1 mt-0.5">
            Play & Win Real Coins • Discover Top Offers & Games
          </p>
        </div>
      </div>

      <div ref={bannerRef} className="hidden" />

      {/* Action CTA Button */}
      {showDirectLinkButton && (
        <button
          onClick={handleOpenAd}
          className="relative z-10 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 transition-all transform active:scale-95"
        >
          <span>Visit Offer</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
