import { useState } from 'react';
import { INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { CARD_TYPES, INKS, RARITIES, rarityLabel } from '../../types/card';
import type { CollectionFilters, CollectionSortBy, CollectionStatusFilter } from '../../types/collection';
import { DEFAULT_COLLECTION_FILTERS } from '../../store/collectionStore';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';

const STATUS_TABS: { id: CollectionStatusFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Cards', icon: '🎴' },
  { id: 'owned', label: 'Owned', icon: '✨' },
  { id: 'missing', label: 'Missing', icon: '⏳' },
  { id: 'wishlist', label: 'Wishlist', icon: '★' },
  { id: 'duplicates', label: 'Duplicates', icon: '🔁' },
];

const SORT_OPTIONS: { id: CollectionSortBy; label: string }[] = [
  { id: 'number', label: 'Card Number' },
  { id: 'name', label: 'Name' },
  { id: 'cost', label: 'Ink Cost' },
  { id: 'lore', label: 'Lore Value' },
  { id: 'strength', label: 'Strength' },
  { id: 'quantity', label: 'Copies Owned' },
];

interface Props {
  filters: CollectionFilters;
  onChange: (patch: Partial<CollectionFilters>) => void;
  onReset: () => void;
  sets: SetOption[];
  stories: SetOption[];
  classifications: string[];
  totalFiltered: number;
}

export function CollectionFilterBar({
  filters,
  onChange,
  onReset,
  sets,
  stories,
  classifications,
  totalFiltered,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeSecondaryFilterCount = [
    filters.selectedType !== 'ALL',
    filters.selectedRarity !== 'ALL',
    filters.selectedClassification !== 'ALL',
    filters.sortBy !== DEFAULT_COLLECTION_FILTERS.sortBy || filters.sortOrder !== DEFAULT_COLLECTION_FILTERS.sortOrder,
  ].filter(Boolean).length;

  const isFiltered =
    filters.selectedSet !== 'ALL' ||
    filters.selectedStory !== 'ALL' ||
    filters.selectedCharacter !== 'ALL' ||
    filters.selectedInk !== 'ALL' ||
    filters.selectedType !== 'ALL' ||
    filters.selectedRarity !== 'ALL' ||
    filters.selectedClassification !== 'ALL' ||
    filters.statusFilter !== 'all' ||
    filters.search.trim() !== '' ||
    filters.sortBy !== DEFAULT_COLLECTION_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_COLLECTION_FILTERS.sortOrder;

  return (
    <div className="space-y-2.5">
      {/* Main Command Bar (Card Container with glass styling) */}
      <div className="p-2.5 sm:p-3 rounded-2xl border border-slate-700/60 bg-slate-950/70 backdrop-blur-xl shadow-lg shadow-black/40 space-y-2.5">
        {/* Row 1: Search, Set, Series, and Quick Action Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Search cards, series, subtitle, #num…"
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            {filters.search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-100 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Set Select */}
          <SearchableSetSelect
            sets={sets}
            selectedSet={filters.selectedSet}
            onSelectSet={(code) => onChange({ selectedSet: code })}
            className="w-full sm:w-auto sm:min-w-[250px]"
          />

          {/* Disney Series Select */}
          <SearchableSetSelect
            sets={stories}
            selectedSet={filters.selectedStory}
            onSelectSet={(story) => onChange({ selectedStory: story })}
            placeholder="Choose a Disney series…"
            allLabel="All Disney Series"
            itemNoun="series"
            icon="🎬"
            showCode={false}
            className="w-full sm:w-auto sm:min-w-[230px]"
          />

          {/* Vivid Color Mode Toggle */}
          <button
            type="button"
            onClick={() => onChange({ showFullColor: !filters.showFullColor })}
            title="Toggle Vivid full-color for unowned cards"
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              filters.showFullColor
                ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-amber-400/10'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <span>🎨</span>
            <span className="hidden sm:inline">Vivid</span>
            <span className={`text-[10px] font-mono ${filters.showFullColor ? 'text-amber-300' : 'text-slate-500'}`}>
              {filters.showFullColor ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Advanced Filters Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              showAdvanced || activeSecondaryFilterCount > 0
                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sky-400/10'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:text-slate-100 hover:border-slate-600'
            }`}
          >
            <span>⚙️</span>
            <span>Filters</span>
            {activeSecondaryFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 text-[10px] font-extrabold">
                {activeSecondaryFilterCount}
              </span>
            )}
            <span className={`text-[10px] transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {/* Results Count Badge */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-bold text-slate-300 whitespace-nowrap ml-auto sm:ml-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{totalFiltered.toLocaleString()}</span>
            <span className="text-slate-500 font-normal">cards</span>
          </div>
        </div>

        {/* Row 2: Status Tabs Segment & Lorcana Inks Gem Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-1">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 rounded-xl bg-slate-900/80 border border-slate-800/80">
            {STATUS_TABS.map((tab) => {
              const active = filters.statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange({ statusFilter: tab.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Lorcana 6-Inks Gem Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => onChange({ selectedInk: 'ALL' })}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all ${
                filters.selectedInk === 'ALL'
                  ? 'bg-slate-800 border-slate-500 text-slate-100 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              All Inks
            </button>

            {INKS.map((ink) => {
              const active = filters.selectedInk === ink;
              const style = INK_STYLES[ink];
              return (
                <button
                  key={ink}
                  type="button"
                  onClick={() => onChange({ selectedInk: active ? 'ALL' : ink })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all ${
                    active ? style.activeChip : `bg-slate-900/90 ${style.chip}`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span>{ink}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Tags (if any active character, story, ink, etc.) */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/50 text-[11px]">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mr-1">Active:</span>

            {filters.selectedCharacter !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 font-semibold">
                🧝 {filters.selectedCharacter}
                <button
                  type="button"
                  onClick={() => onChange({ selectedCharacter: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedStory !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-200 font-semibold">
                🎬 {filters.selectedStory}
                <button
                  type="button"
                  onClick={() => onChange({ selectedStory: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedSet !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 font-semibold">
                📦 {filters.selectedSet}
                <button
                  type="button"
                  onClick={() => onChange({ selectedSet: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedInk !== 'ALL' && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-semibold ${INK_STYLES[filters.selectedInk as keyof typeof INK_STYLES]?.badgeBg ?? 'bg-slate-800'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${INK_STYLES[filters.selectedInk as keyof typeof INK_STYLES]?.dot ?? 'bg-slate-400'}`} />
                {filters.selectedInk}
                <button
                  type="button"
                  onClick={() => onChange({ selectedInk: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedType !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 font-semibold">
                {TYPE_ICONS[filters.selectedType as keyof typeof TYPE_ICONS] ?? '🃏'} {filters.selectedType}
                <button
                  type="button"
                  onClick={() => onChange({ selectedType: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedRarity !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 font-semibold">
                ⭐ {rarityLabel(filters.selectedRarity)}
                <button
                  type="button"
                  onClick={() => onChange({ selectedRarity: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onReset}
              className="ml-auto px-2 py-0.5 rounded-lg border border-rose-800/40 text-rose-300 hover:bg-rose-950/50 text-[10px] font-bold transition-colors"
            >
              Reset all ✕
            </button>
          </div>
        )}

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvanced && (
          <div className="pt-2 border-t border-slate-800 space-y-2.5 animate-fade-in">
            {/* Card Types */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Type:</span>
              <div className="flex gap-1">
                {CARD_TYPES.map((t) => {
                  const active = filters.selectedType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChange({ selectedType: active ? 'ALL' : t })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-sky-500/20 border-sky-400 text-sky-100 shadow-sm'
                          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{TYPE_ICONS[t]}</span>
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rarities */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Rarity:</span>
              <div className="flex gap-1">
                {RARITIES.map((r) => {
                  const active = filters.selectedRarity === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChange({ selectedRarity: active ? 'ALL' : r })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-amber-400/20 border-amber-400 text-amber-100 shadow-sm'
                          : `bg-slate-900 border-slate-700/80 ${RARITY_STYLES[r]} hover:brightness-125`
                      }`}
                    >
                      {rarityLabel(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classifications & Sorting */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Classification</span>
                <select
                  value={filters.selectedClassification}
                  onChange={(e) => onChange({ selectedClassification: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Classifications</option>
                  {classifications.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sort By</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => onChange({ sortBy: e.target.value as CollectionSortBy })}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
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
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 hover:text-slate-100 font-medium"
              >
                {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

