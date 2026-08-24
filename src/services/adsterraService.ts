/**
 * Adsterra Advertising Network Integration Service
 * Manages Direct Links, SmartLinks, Banner units, Popunders, and Rewarded Ad view callbacks
 */

export interface AdsterraConfig {
  enabled: boolean;
  directLink: string;
  bannerKey: string;
  popunderEnabled: boolean;
  rewardCoins: number;
}

const DEFAULT_CONFIG: AdsterraConfig = {
  enabled: true,
  directLink: 'https://www.profitablecpmrate.com/y3e2t8h45j?key=adsterra_ludoverse_direct',
  bannerKey: 'adsterra_banner_728x90_ludo',
  popunderEnabled: true,
  rewardCoins: 250,
};

class AdsterraService {
  private config: AdsterraConfig = { ...DEFAULT_CONFIG };
  private scriptLoaded: boolean = false;

  public setConfig(newConfig: Partial<AdsterraConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): AdsterraConfig {
    return this.config;
  }

  /**
   * Triggers the Adsterra Direct Link / SmartLink in a safe manner
   */
  public triggerDirectLink(customUrl?: string): boolean {
    if (!this.config.enabled) return false;
    const targetUrl = customUrl || this.config.directLink;
    if (!targetUrl || !targetUrl.startsWith('http')) return false;

    try {
      // Open in a new tab/window for Adsterra impression
      const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return !!newWin;
    } catch (err) {
      console.warn('[Adsterra] Could not open direct link popup:', err);
      return false;
    }
  }

  /**
   * Trigger popunder when entering a match or starting game (if enabled in Admin)
   */
  public triggerMatchStartPopunder() {
    if (this.config.enabled && this.config.popunderEnabled && this.config.directLink) {
      // Optional background direct link trigger on match start
      try {
        window.open(this.config.directLink, '_blank', 'noopener,noreferrer');
      } catch {}
    }
  }

  /**
   * Injects Adsterra banner script dynamically into target container element
   */
  public injectBanner(container: HTMLElement | null, bannerSlotKey?: string) {
    if (!container || !this.config.enabled) return;

    // Clear previous banner content if any
    container.innerHTML = '';

    const slot = bannerSlotKey || this.config.bannerKey;

    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'adsterra-banner-inner w-full flex items-center justify-center';
    bannerWrapper.setAttribute('data-adsterra-slot', slot);

    container.appendChild(bannerWrapper);
  }
}

export const adsterraService = new AdsterraService();
