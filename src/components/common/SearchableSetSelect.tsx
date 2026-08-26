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

function progressColor(owned: number, count: number) {
  const p = pct(owned, count);
  if (p >= 100) return 'text-emerald-400';
  if (p > 0) return 'text-sky-400';
  return 'text-slate-500';
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
      // Keep the list scrolled with the keyboard without a full focus model.
      e.preventDefault();
      const list = containerRef.current?.querySelector('[data-setlist]');
      list?.scrollBy({ top: e.key === 'ArrowDown' ? 44 : -44, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
          isOpen
            ? 'bg-slate-800 border-sky-500 text-sky-200'
            : selected
              ? 'bg-slate-900 border-sky-700/60 text-sky-200 hover:bg-slate-800'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              {showCode && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 shrink-0">
                  {selected.code}
                </span>
              )}
              <span className="truncate">{selected.name}</span>
              <span className={`shrink-0 text-[10px] ${progressColor(selected.owned, selected.count)}`}>
                {selected.owned}/{selected.count} · {pct(selected.owned, selected.count)}%
              </span>
            </>
          ) : (
            <>
              <span>{icon}</span>
              <span className="truncate">
                {allLabel} <span className="text-slate-500">({sets.length})</span>
              </span>
              <span className={`shrink-0 text-[10px] ${progressColor(totalOwned, totalCards)}`}>
                {totalOwned}/{totalCards}
              </span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
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
              className="px-1 text-slate-500 hover:text-slate-200"
            >
              ✕
            </span>
          )}
          <span className={`transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-40 mt-1 w-full sm:min-w-[420px] max-w-[95vw] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 animate-fade-in"
          style={{ maxHeight: 420 }}
        >
          <div className="p-2 border-b border-slate-800">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div data-setlist className="max-h-[300px] overflow-y-auto scrollbar-thin p-1">
            {showAllRow && (
              <button
                type="button"
                onClick={() => pick('ALL')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="font-semibold">{allLabel}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-[10px] ${progressColor(totalOwned, totalCards)}`}>
                    {totalOwned}/{totalCards} ({pct(totalOwned, totalCards)}%)
                  </span>
                  {selectedSet === 'ALL' && <span className="text-sky-400">✓</span>}
                </span>
              </button>
            )}

            {filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => pick(s.code)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-300"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {showCode && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] shrink-0">
                      {s.code}
                    </span>
                  )}
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] ${progressColor(s.owned, s.count)}`}>
                    {s.owned}/{s.count} ({pct(s.owned, s.count)}%)
                  </span>
                  {selectedSet === s.code && <span className="text-sky-400">✓</span>}
                </span>
              </button>
            ))}

            {!filtered.length && !showAllRow && (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                No {itemNoun} match “{query}”.
                <button onClick={() => setQuery('')} className="ml-1 text-sky-400 hover:underline">
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Esc to close · Enter to pick</span>
            <span>
              {filtered.length} {itemNoun}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
