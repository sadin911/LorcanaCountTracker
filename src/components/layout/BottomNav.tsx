import { useDeckStore } from '../../store/deckStore';

export type AppMode = 'collection' | 'deck' | 'admin';

interface Props {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isAdmin?: boolean;
}

export function BottomNav({ currentMode, onSelectMode, isAdmin }: Props) {
  const decks = useDeckStore((s) => s.decks);
  const deckCount = Object.keys(decks).length;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#131627]/95 backdrop-blur-xl border-t border-[#c8b07b]/30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-all duration-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Top gold line */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#c8b07b] to-transparent" />

      <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-around">
        {/* Collection Tab */}
        <button
          type="button"
          onClick={() => onSelectMode('collection')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 group ${
            currentMode === 'collection'
              ? 'text-[#dfc792] scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-xl transition-transform group-hover:scale-110">📖</span>
          <span className={`text-[10px] font-black tracking-wide mt-0.5 ${
            currentMode === 'collection' ? 'text-[#dfc792]' : 'text-slate-400'
          }`}>
            สมุดสะสม
          </span>
          {currentMode === 'collection' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8b07b] mt-0.5 shadow-[0_0_8px_#c8b07b]" />
          )}
        </button>

        {/* Deck Builder Tab */}
        <button
          type="button"
          onClick={() => onSelectMode('deck')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 group relative ${
            currentMode === 'deck'
              ? 'text-[#dfc792] scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <span className="text-xl transition-transform group-hover:scale-110">🃏</span>
            {deckCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black shadow-md">
                {deckCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-black tracking-wide mt-0.5 ${
            currentMode === 'deck' ? 'text-[#dfc792]' : 'text-slate-400'
          }`}>
            จัดเด็ค
          </span>
          {currentMode === 'deck' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8b07b] mt-0.5 shadow-[0_0_8px_#c8b07b]" />
          )}
        </button>

        {/* Admin Tab (only shown if in admin mode) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onSelectMode('admin')}
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 group ${
              currentMode === 'admin'
                ? 'text-[#dfc792] scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xl transition-transform group-hover:scale-110">⚙️</span>
            <span className={`text-[10px] font-black tracking-wide mt-0.5 ${
              currentMode === 'admin' ? 'text-[#dfc792]' : 'text-slate-400'
            }`}>
              ผู้ดูแล
            </span>
            {currentMode === 'admin' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8b07b] mt-0.5 shadow-[0_0_8px_#c8b07b]" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
