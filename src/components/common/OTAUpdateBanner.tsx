import { useOTAUpdate } from '../../hooks/useOTAUpdate';

export function OTAUpdateBanner() {
  const {
    needRefresh,
    isUpdating,
    statusMessage,
    updateNow,
    dismissNotification,
  } = useOTAUpdate();

  if (!needRefresh && !statusMessage) {
    return null;
  }

  // If update is ready (needRefresh)
  if (needRefresh) {
    return (
      <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-amber-500/50 backdrop-blur-xl ring-2 ring-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30 shrink-0 animate-bounce text-slate-950 font-black">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  New update available!
                </h4>
                <button
                  type="button"
                  onClick={dismissNotification}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs cursor-pointer"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Update card catalogue and features instantly via OTA without losing your saved collection data.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateNow()}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 active:scale-95 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className={isUpdating ? 'animate-spin' : ''}>⚡</span>
                  <span>{isUpdating ? 'Reloading new version...' : 'Update Now (OTA Reload)'}</span>
                </button>
                <button
                  type="button"
                  onClick={dismissNotification}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Toast status message (e.g. "✓ Your app is up to date")
  if (statusMessage) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="px-4 py-2 rounded-full bg-slate-900/90 text-amber-300 text-xs font-bold shadow-xl border border-amber-500/40 backdrop-blur-md flex items-center gap-2">
          <span>✨</span>
          <span>{statusMessage}</span>
        </div>
      </div>
    );
  }

  return null;
}
