import { useOTAUpdate } from '../../hooks/useOTAUpdate';

interface Props {
  variant?: 'toolbar' | 'menu' | 'badge';
  className?: string;
}

export function OTAUpdateButton({ variant = 'toolbar', className = '' }: Props) {
  const {
    needRefresh,
    isChecking,
    isUpdating,
    checkForUpdates,
    updateNow,
  } = useOTAUpdate();

  const handleClick = () => {
    if (needRefresh) {
      updateNow();
    } else {
      checkForUpdates();
    }
  };

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isChecking || isUpdating}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
          needRefresh
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 animate-pulse font-black shadow-lg shadow-amber-500/20'
            : isChecking
            ? 'bg-amber-500/10 text-amber-300'
            : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
            {needRefresh ? '🚀' : '⚡'}
          </span>
          <span>
            {isUpdating
              ? 'Updating app...'
              : isChecking
              ? 'Checking for updates...'
              : needRefresh
              ? 'Update available! Tap to reload'
              : 'Check for Updates (OTA)'}
          </span>
        </div>
        {needRefresh ? (
          <span className="text-[10px] bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
            NEW
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">
            {isChecking ? 'Checking...' : 'OTA'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isChecking || isUpdating}
        title={needRefresh ? 'New update available! Tap to reload' : 'Check for updates'}
        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
          needRefresh
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 animate-bounce ring-2 ring-amber-300'
            : 'bg-slate-800/90 text-amber-300/80 hover:text-amber-300 hover:bg-slate-800 border border-amber-500/30'
        } ${className}`}
      >
        <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
          {needRefresh ? '🚀' : '⚡'}
        </span>
        <span className="hidden sm:inline">
          {isUpdating ? 'Updating...' : isChecking ? 'Checking...' : needRefresh ? 'Update OTA' : 'Check Update'}
        </span>
      </button>
    );
  }

  // Default: toolbar button
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isChecking || isUpdating}
      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
        needRefresh
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 animate-pulse ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200'
      } ${className}`}
      title="Check for new versions and update Over-The-Air without restarting"
    >
      <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
        {needRefresh ? '🚀' : '⚡'}
      </span>
      <span>
        {isUpdating
          ? 'Updating...'
          : isChecking
          ? 'Checking...'
          : needRefresh
          ? 'Update OTA Now!'
          : 'Check for Updates'}
      </span>
    </button>
  );
}
