interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isSuccess: boolean;
  isThresholdMet: boolean;
  progress: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isSuccess,
  isThresholdMet,
  progress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null;

  // Calculate rotation and circular progress
  const rotation = progress * 360;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className="fixed left-0 right-0 z-50 pointer-events-none flex justify-center transition-transform duration-100 ease-out"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        transform: `translateY(${Math.min(pullDistance, 75)}px)`,
        opacity: isRefreshing ? 1 : Math.min(1, Math.max(0, pullDistance / 24)),
      }}
    >
      <div className="px-4 py-2 rounded-2xl bg-[#131627]/95 border border-[#c8b07b]/40 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_20px_rgba(200,176,123,0.35)] flex items-center gap-3 animate-fade-in text-slate-100">
        {/* Animated Lorcana Starlight Progress Icon */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background Track */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-slate-700/60"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Gold Progress Bar */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-[#dfc792] transition-all duration-75"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={isRefreshing ? 0 : strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Lore / Starlight Symbol */}
          <div
            className={`absolute inset-0 flex items-center justify-center text-xs transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          >
            {isSuccess ? '✓' : isThresholdMet ? '✨' : '⬡'}
          </div>
        </div>

        {/* Textual Feedback */}
        <div className="min-w-0 pr-1">
          <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#dfc792] leading-tight">
            {isSuccess
              ? 'Synced & Filters Reset!'
              : isRefreshing
                ? 'Syncing Collection…'
                : isThresholdMet
                  ? 'Release to Refresh ✨'
                  : 'Pull to Sync & Reset'}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {isRefreshing ? 'Reconciling cloud & state' : 'Clears search & active filters'}
          </p>
        </div>
      </div>
    </div>
  );
}
