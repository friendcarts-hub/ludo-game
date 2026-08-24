import React, { useEffect, useRef } from 'react';
import { Tv, Sparkles, ExternalLink } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { adsterraService } from '../../services/adsterraService';

interface AdsterraNativeBannerProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'card' | 'compact' | 'minimal';
}

export const AdsterraNativeBanner: React.FC<AdsterraNativeBannerProps> = ({
  className = '',
  showLabel = true,
  variant = 'card',
}) => {
  const { settings } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef<boolean>(false);

  const isEnabled = settings?.adsterraEnabled ?? true;
  const directLink =
    settings?.adsterraDirectLink ||
    'https://www.profitablecpmrate.com/y3e2t8h45j?key=adsterra_ludoverse_direct';

  useEffect(() => {
    if (!isEnabled) return;

    // Check if script has already been appended to avoid multiple script additions
    const scriptId = 'adsterra-native-banner-script';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptElement && !scriptInjectedRef.current) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.src = 'https://pl31009229.profitableratecpmnetwork.com/a73c35a9d9daa40e05563bf4c80e8af0/invoke.js';
      scriptElement.async = true;
      scriptElement.setAttribute('data-cfasync', 'false');
      document.body.appendChild(scriptElement);
      scriptInjectedRef.current = true;
    }
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        variant === 'compact'
          ? 'p-2.5 bg-slate-900/60 border-purple-500/20'
          : 'p-3.5 sm:p-4 bg-gradient-to-br from-purple-950/25 via-slate-900/80 to-indigo-950/30 border-purple-500/30 shadow-lg'
      } ${className}`}
    >
      {/* Header Tag */}
      {showLabel && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5 text-purple-300 font-black">
            <Tv className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="uppercase tracking-wider">Sponsored Partner</span>
          </div>
          <button
            onClick={() => adsterraService.triggerDirectLink(directLink)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Explore Offers</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Adsterra Native Banner Target Container */}
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center min-h-[50px] overflow-hidden"
      >
        <div id="container-a73c35a9d9daa40e05563bf4c80e8af0" className="w-full text-center" />
      </div>

      {/* Subtle bottom note */}
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-slate-500">
        <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
        <span>Adsterra High CPM Native Ads</span>
      </div>
    </div>
  );
};
