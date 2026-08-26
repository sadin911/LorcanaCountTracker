import { useState } from 'react';
import { INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { CARD_TYPES, INKS, RARITIES, rarityLabel } from '../../types/card';
import type { CollectionFilters, CollectionSortBy, CollectionStatusFilter } from '../../types/collection';
import { DEFAULT_COLLECTION_FILTERS } from '../../store/collectionStore';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';

const STATUS_TABS: { id: CollectionStatusFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎴' },
  { id: 'owned', label: 'Owned', icon: '✅' },
  { id: 'missing', label: 'Missing', icon: '⏳' },
  { id: 'wishlist', label: 'Wishlist', icon: '★' },
  { id: 'duplicates', label: 'Duplicates', icon: '🔁' },
];

const SORT_OPTIONS: { id: CollectionSortBy; label: string }[] = [
  { id: 'number', label: 'Card number' },
  { id: 'name', label: 'Name' },
  { id: 'cost', label: 'Ink cost' },
  { id: 'lore', label: 'Lore' },
  { id: 'strength', label: 'Strength' },
  { id: 'quantity', label: 'Copies owned' },
];

interface Props {
  filters: CollectionFilters;
  onChange: (patch: Partial<CollectionFilters>) => void;
  onReset: () => void;
  sets: SetOption[];
  classifications: string[];
  totalFiltered: number;
}

export function CollectionFilterBar({ filters, onChange, onReset, sets, classifications, totalFiltered }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filters.selectedInk !== 'ALL',
    filters.selectedType !== 'ALL',
    filters.selectedRarity !== 'ALL',
    filters.selectedClassification !== 'ALL',
    filters.statusFilter !== 'all',
    filters.search.trim() !== '',
  ].filter(Boolean).length;

  const isFiltered =
    activeFilterCount > 0 ||
    filters.selectedSet !== 'ALL' ||
    filters.sortBy !== DEFAULT_COLLECTION_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_COLLECTION_FILTERS.sortOrder;

  return (
    <div className="space-y-2.5">
      {/* Row 1: search + set + toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search name, subtitle, number, classification…"
            className="w-full pl-8 pr-8 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          {filters.search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <SearchableSetSelect
          sets={sets}
          selectedSet={filters.selectedSet}
          onSelectSet={(code) => onChange({ selectedSet: code })}
          className="w-full sm:w-auto sm:min-w-[260px]"
        />

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="lg:hidden px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 rounded-full bg-sky-600 text-white text-[10px]">{activeFilterCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange({ showFullColor: !filters.showFullColor })}
          title="Show unowned cards in full colour"
          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
            filters.showFullColor
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎨 Vivid {filters.showFullColor ? 'on' : 'off'}
        </button>

        <span className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 whitespace-nowrap">
          {totalFiltered.toLocaleString()} cards
        </span>
      </div>

      {/* Row 2: status */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange({ statusFilter: tab.id })}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${
              filters.statusFilter === tab.id
                ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Row 3: ink chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {INKS.map((ink) => {
          const active = filters.selectedInk === ink;
          return (
            <button
              key={ink}
              type="button"
              /* Click an active chip again to clear it. */
              onClick={() => onChange({ selectedInk: active ? 'ALL' : ink })}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-colors ${
                active ? INK_STYLES[ink].activeChip : `bg-slate-900 ${INK_STYLES[ink].chip}`
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${INK_STYLES[ink].dot}`} />
              {ink}
            </button>
          );
        })}
      </div>

      {/* Row 4: advanced */}
      <div className={`${showAdvanced ? 'block' : 'hidden'} lg:block space-y-2.5`}>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {CARD_TYPES.map((t) => {
            const active = filters.selectedType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ selectedType: active ? 'ALL' : t })}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-200/15 border-slate-300 text-slate-100'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {TYPE_ICONS[t]} {t}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {RARITIES.map((r) => {
            const active = filters.selectedRarity === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ selectedRarity: active ? 'ALL' : r })}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-colors ${
                  active ? 'bg-slate-200/15 border-slate-300 text-slate-100' : `bg-slate-900 border-slate-700 ${RARITY_STYLES[r]} hover:brightness-125`
                }`}
              >
                {rarityLabel(r)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Classification</span>
            <select
              value={filters.selectedClassification}
              onChange={(e) => onChange({ selectedClassification: e.target.value })}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All</option>
              {classifications.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Sort</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as CollectionSortBy })}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => onChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-slate-100"
          >
            {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-lg border border-rose-900/60 text-xs font-semibold text-rose-300 hover:bg-rose-950/40"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
