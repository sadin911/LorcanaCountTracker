import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PWAInstallModalProps {
  onClose: () => void;
  onDirectInstall: () => Promise<void>;
  canPromptDirectly: boolean;
  isIOS: boolean;
}

export function PWAInstallModal({
  onClose,
  onDirectInstall,
  canPromptDirectly,
  isIOS,
}: PWAInstallModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#c8b07b]/40 bg-[#131627]/95 text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(200,176,123,0.2)] p-5 sm:p-6 space-y-5">
        {/* Header with App Logo */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1b2038] to-[#252b4b] border border-[#c8b07b]/50 p-1.5 shadow-lg shadow-[#c8b07b]/20 flex items-center justify-center shrink-0">
              <img
                src="/logo.jpeg"
                alt="Disney Lorcana Tracker"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#dfc792] tracking-wide">
                Install Lorcana Tracker
              </h2>
              <p className="text-xs text-slate-400">Add to Home Screen / Desktop</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#1b2038]/80 border border-[#c8b07b]/20 space-y-1">
            <span className="text-base">⚡</span>
            <p className="font-bold text-slate-200">Instant Launch</p>
            <p className="text-[11px] text-slate-400">Open fast without browser address bar</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1b2038]/80 border border-[#c8b07b]/20 space-y-1">
            <span className="text-base">📦</span>
            <p className="font-bold text-slate-200">Offline Ready</p>
            <p className="text-[11px] text-slate-400">Search cards & view binder offline</p>
          </div>
        </div>

        {/* Platform Specific Guide */}
        {isIOS ? (
          <div className="p-3.5 rounded-2xl bg-[#1b2038] border border-amber-500/30 text-xs space-y-2.5">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🍎</span> Safari iOS Installation:
            </p>
            <ol className="space-y-2 text-slate-300 text-[11px] leading-relaxed list-decimal list-inside">
              <li>
                Tap the <strong className="text-white">Share</strong> button (
                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-700/80 border border-slate-600 text-slate-200 font-mono text-[10px]">
                  ⎋ / Share
                </span>
                ) in Safari's toolbar.
              </li>
              <li>
                Scroll down and select{' '}
                <strong className="text-amber-200 font-semibold">
                  "Add to Home Screen"
                </strong>
                .
              </li>
              <li>
                Tap <strong className="text-white">"Add"</strong> in the top right corner.
              </li>
            </ol>
          </div>
        ) : canPromptDirectly ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 text-center">
              Click the button below to install the web app directly to your device.
            </p>
            <button
              type="button"
              onClick={onDirectInstall}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 active:scale-95 text-[#131627] font-black text-sm transition-all shadow-lg shadow-[#c8b07b]/30 flex items-center justify-center gap-2"
            >
              <span>📲</span>
              <span>Install App Now</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs space-y-2 text-slate-300">
            <p className="font-bold text-[#dfc792] flex items-center gap-1.5">
              <span>💻</span> Browser Installation:
            </p>
            <p className="text-[11px] leading-relaxed">
              Click the <strong className="text-white">Install icon (⊕)</strong> in your browser's address bar, or open the browser menu (<strong className="text-white">⋮</strong>) and choose <strong className="text-amber-200">"Install Disney Lorcana Tracker"</strong>.
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-1 border-t border-[#c8b07b]/15">
          <p className="text-[10px] text-slate-400">
            Progressive Web App • Free & lightweight • No App Store account required
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
