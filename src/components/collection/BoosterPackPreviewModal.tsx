import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { handleBoosterImageError } from '../../utils/boosterImages';

interface Props {
  setId: string;
  setName: string;
  boosterImageUrl: string;
  totalCards?: number;
  uniqueOwned?: number;
  totalCount?: number;
  percentage?: number;
  onClose: () => void;
}

export function BoosterPackPreviewModal({
  setId,
  setName,
  boosterImageUrl,
  totalCards,
  uniqueOwned,
  totalCount,
  percentage,
  onClose,
}: Props) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    /* Entrance is the project's own `animate-fade-in` plus a CSS transform, the
       same way every other modal here animates — one modal's spring curve is not
       worth an animation library in the bundle. */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none overflow-y-auto animate-fade-in"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
      }}
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full flex flex-col items-center gap-4 my-auto py-2 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#1b2038]/95 border border-[#c8b07b]/40 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] font-black text-xs shadow-md shadow-[#c8b07b]/25 ring-1 ring-[#dfc792]/50 shrink-0">
              {setId}
            </span>
            <h3 className="text-sm font-black text-slate-100 truncate">{setName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booster pack preview"
            className="p-1.5 rounded-xl bg-[#252a48] hover:bg-rose-500 text-slate-400 hover:text-white transition-all active:scale-95 border border-[#c8b07b]/20"
            title="Close (ESC)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Booster Pack Image Frame */}
        <button
          type="button"
          className={`relative group rounded-3xl overflow-hidden shadow-2xl p-2 transition-transform duration-300 cursor-pointer ${
            isZoomed ? 'scale-110' : 'hover:scale-[1.02]'
          }`}
          onClick={() => setIsZoomed((v) => !v)}
          title="Click to zoom in / out"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#dfc792]/20 via-purple-500/15 to-[#c8b07b]/25 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
          <img
            src={boosterImageUrl}
            alt={`Booster Pack - ${setName} (${setId})`}
            className="relative max-h-[58vh] sm:max-h-[62vh] w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] rounded-2xl"
            loading="eager"
            onError={(e) => handleBoosterImageError(e, setId)}
          />
        </button>

        {/* Bottom Info Card */}
        {totalCards !== undefined && (
          <div className="w-full text-center px-4 py-3 rounded-2xl bg-[#1b2038]/95 border border-[#c8b07b]/40 shadow-2xl backdrop-blur-sm space-y-2">
            <p className="text-xs sm:text-sm text-slate-300">
              Collected <span className="text-[#dfc792] font-extrabold">{uniqueOwned}</span> of{' '}
              <span className="text-slate-100 font-extrabold">{totalCards}</span> distinct cards
              {totalCount !== undefined && (
                <>
                  {' '}
                  (<span className="text-[#dfc792] font-bold">{totalCount}</span> total copies)
                </>
              )}
            </p>
            {percentage !== undefined && (
              <div className="flex items-center justify-center gap-2.5">
                <div className="w-40 bg-[#0d0f1b] rounded-full h-2.5 overflow-hidden border border-[#c8b07b]/30 p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#b39552] via-[#c8b07b] to-[#dfc792] h-full rounded-full transition-all shadow-[0_0_8px_rgba(223,199,146,0.5)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs font-black text-[#dfc792]">{percentage}%</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400">Click pack to zoom in/out • Press ESC to close</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
