import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { BeforeInstallPromptEvent } from '../../utils/pwa';

interface PwaInstallBannerProps {
  tableName?: string;
}

export function PwaInstallBanner({ tableName = 'Table 12' }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if dismissed in last 7 days
    const dismissedUntil = localStorage.getItem('orderflow_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      setIsDismissed(true);
    }

    // Check if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    localStorage.setItem('orderflow_pwa_dismissed_until', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
  };

  if (isInstalled || isDismissed) return null;

  return (
    <div className="bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C9532F] border border-[#F0D8CC] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-extrabold text-[#211F1B]">Install OrderFlow App</h4>
              <span className="text-[10px] font-bold text-[#C9532F] bg-[#FAF0EB] px-1.5 py-0.2 rounded-md">
                Fast Access
              </span>
            </div>
            <p className="text-[11.5px] text-[#777067] mt-0.5 leading-snug">
              Instant menu loading, offline access &amp; live order alerts for {tableName}.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-[#AAA298] hover:text-[#211F1B] p-1 rounded-lg hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Not now"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSGuide ? (
        <div className="mt-3 p-2.5 bg-[#FAF0EB] rounded-xl text-[11px] text-[#696157] space-y-1 border border-[#F0D8CC]">
          <p className="font-bold text-[#C9532F]">How to install on iOS:</p>
          <p>Tap the <strong>Share</strong> icon in Safari, then scroll and tap <strong>"Add to Home Screen"</strong>.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#DDD6CA]/60">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="py-2 px-3 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#696157] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
