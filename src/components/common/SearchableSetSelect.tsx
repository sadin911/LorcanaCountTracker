import { useEffect, useRef, useState } from 'react';

/**
 * A pickable option. Named for its first user, the set filter; the series filter
 * reuses the same control with `code` and `name` both set to the story name.
 */
export interface SetOption {
  code: string;
  name: string;
  count: number;
  owned: number;
}

interface Props {
  sets: SetOption[];
  selectedSet: string;
  onSelectSet: (code: string) => void;
  placeholder?: string;
  className?: string;
  /** Label for the clear-the-filter row, e.g. "All Series". */
  allLabel?: string;
  /** Lowercase plural used in the empty state and the footer count. */
  itemNoun?: string;
  icon?: string;
  /** Off when `code` and `name` are the same string, as they are for stories. */
  showCode?: boolean;
}

function pct(owned: number, count: number) {
  return count > 0 ? Math.round((owned / count) * 100) : 0;
}

export function SearchableSetSelect({
  sets,
  selectedSet,
  onSelectSet,
  placeholder = 'Choose a set…',
  className = '',
  allLabel = 'All Sets',
  itemNoun = 'sets',
  icon = '📦',
  showCode = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = sets.find((s) => s.code === selectedSet);
  const totalCards = sets.reduce((n, s) => n + s.count, 0);
  const totalOwned = sets.reduce((n, s) => n + s.owned, 0);

  const q = query.trim().toLowerCase();
  const filtered = q ? sets.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : sets;
  const showAllRow = !q || allLabel.toLowerCase().includes(q);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('mousedown', onDown);
      clearTimeout(t);
    };
  }, [isOpen]);

  const pick = (code: string) => {
    onSelectSet(code);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!q) pick('ALL');
      else if (filtered.length) pick(filtered[0].code);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const list = containerRef.current?.querySelector('[data-setlist]');
      list?.scrollBy({ top: e.key === 'ArrowDown' ? 48 : -48, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
          isOpen
            ? 'bg-slate-900 border-amber-400/80 text-amber-200 ring-2 ring-amber-400/20'
            : selected
              ? 'bg-slate-900/90 border-amber-500/40 text-amber-200 hover:border-amber-400/70 hover:bg-slate-900'
              : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              {showCode ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-mono text-[10px] text-amber-300 font-bold shrink-0">
                  {selected.code}
                </span>
              ) : (
                <span className="text-sm shrink-0">{icon}</span>
              )}
              <span className="truncate font-bold text-slate-100">{selected.name}</span>
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300">
                {pct(selected.owned, selected.count)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-sm shrink-0">{icon}</span>
              <span className="truncate text-slate-300">
                {allLabel} <span className="text-slate-500 text-[11px]">({sets.length})</span>
              </span>
              <span className="shrink-0 text-[10px] text-slate-400 font-medium ml-auto">
                {pct(totalOwned, totalCards)}%
              </span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-1">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${itemNoun} filter`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSet('ALL');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelectSet('ALL');
                }
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs"
            >
              ✕
            </span>
          )}
          <span className={`transition-transform text-slate-400 text-[10px] ${isOpen ? 'rotate-180 text-amber-400' : ''}`}>
            ▾
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-40 mt-1.5 w-full sm:min-w-[420px] max-w-[95vw] rounded-2xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/80 animate-fade-in overflow-hidden"
          style={{ maxHeight: 440 }}
        >
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/50">
            <div className="relative">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div data-setlist className="max-h-[310px] overflow-y-auto scrollbar-thin p-1.5 space-y-1">
            {showAllRow && (
              <button
                type="button"
                onClick={() => pick('ALL')}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                  selectedSet === 'ALL'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 font-bold'
                    : 'hover:bg-slate-900/80 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{icon}</span>
                  <span className="font-bold">{allLabel}</span>
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {totalOwned}/{totalCards} ({pct(totalOwned, totalCards)}%)
                  </span>
                  {selectedSet === 'ALL' && <span className="text-amber-400 font-bold">✓</span>}
                </div>
              </button>
            )}

            {filtered.map((s) => {
              const p = pct(s.owned, s.count);
              const isPicked = selectedSet === s.code;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => pick(s.code)}
                  className={`w-full flex flex-col gap-1 px-3 py-2 rounded-xl text-xs transition-all text-left group ${
                    isPicked
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                      : 'hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="flex items-center gap-2 min-w-0">
                      {showCode && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 font-mono text-[10px] text-slate-300 font-bold shrink-0">
                          {s.code}
                        </span>
                      )}
                      <span className="truncate font-medium group-hover:text-slate-100">{s.name}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                        {s.owned}/{s.count} <span className="text-emerald-400 ml-0.5">{p}%</span>
                      </span>
                      {isPicked && <span className="text-amber-400 font-bold">✓</span>}
                    </div>
                  </div>

                  {/* Visual micro progress bar */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p === 100 ? 'bg-emerald-400' : p > 0 ? 'bg-amber-400' : 'bg-transparent'
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {!filtered.length && !showAllRow && (
              <div className="px-3 py-8 text-center text-xs text-slate-500">
                No {itemNoun} match “{query}”.
                <button onClick={() => setQuery('')} className="ml-1 text-amber-400 hover:underline font-semibold">
                  Clear search
                </button>
              </div>
            )}
          </div>

          <div className="px-3.5 py-2 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-500 flex justify-between items-center">
            <span>Esc to close · Enter to select</span>
            <span className="font-medium text-slate-400">
              {filtered.length} {itemNoun}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

