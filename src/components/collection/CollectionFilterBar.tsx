import { useState } from 'react';
import { INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { CARD_TYPES, INKS, RARITIES, rarityLabel } from '../../types/card';
import type { CollectionFilters, CollectionSortBy, CollectionStatusFilter } from '../../types/collection';
import { DEFAULT_COLLECTION_FILTERS } from '../../store/collectionStore';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';
import { LorcanaInkIcon, LorcanaInkwellIcon, LorcanaRarityIcon } from '../icons/LorcanaIcons';

const STATUS_TABS: { id: CollectionStatusFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Cards', icon: '🎴' },
  { id: 'owned', label: 'Owned', icon: '✨' },
  { id: 'missing', label: 'Missing', icon: '⏳' },
  { id: 'wishlist', label: 'Wishlist', icon: '★' },
  { id: 'duplicates', label: 'Duplicates', icon: '🔁' },
];

const INK_COSTS = ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9+'];

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
    filters.selectedCost !== 'ALL',
    filters.selectedInkwell !== 'ALL',
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
    filters.selectedCost !== 'ALL' ||
    filters.selectedInkwell !== 'ALL' ||
    filters.selectedType !== 'ALL' ||
    filters.selectedRarity !== 'ALL' ||
    filters.selectedClassification !== 'ALL' ||
    filters.statusFilter !== 'all' ||
    filters.search.trim() !== '' ||
    filters.sortBy !== DEFAULT_COLLECTION_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_COLLECTION_FILTERS.sortOrder;

  return (
    <div className="relative z-20 space-y-2.5" data-testid="filter-bar">
      {/* Main Command Bar (Card Container with glass styling) */}
      <div className="relative z-20 p-2.5 sm:p-3 rounded-2xl border border-[#c8b07b]/25 bg-[#131627]/85 backdrop-blur-xl shadow-lg shadow-black/50 space-y-2.5">
        {/* Row 1: Search, Set, Series, and Quick Action Toggles */}
        <div className="relative z-20 flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Search cards, series, subtitle, #num…"
              className="w-full pl-9 pr-9 py-2.5 sm:py-2 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-sm sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#c8b07b] focus:ring-1 focus:ring-[#c8b07b]/40 transition-all min-h-[42px] sm:min-h-[38px]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm sm:text-xs">🔍</span>
            {filters.search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-100 text-xs bg-[#252a48]/80 sm:bg-transparent"
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
            /* Half width, so Set and Series share a row on a phone. gap-2 is
               0.5rem, hence the 0.25rem each side. */
            className="w-[calc(50%-0.25rem)] sm:w-auto sm:min-w-[250px]"
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
            className="w-[calc(50%-0.25rem)] sm:w-auto sm:min-w-[220px]"
          />

          {/* Action Toolbar Row on Mobile, Inline on Desktop: Sort, Vivid, Filters, and Results Count */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quick Sort By & Direction Toggle */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1 p-1 sm:p-0.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 shadow-sm min-h-[40px] sm:min-h-[38px] min-w-0" title="Sort cards">
              <span className="text-[10px] font-bold text-slate-400 pl-2 hidden lg:inline">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value as CollectionSortBy })}
                aria-label="Sort cards by"
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer py-1.5 px-1.5 sm:px-2 rounded-lg hover:text-[#dfc792] transition-colors truncate w-full"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id} className="bg-[#1b2038] text-slate-200">
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title={`Sort Order: ${filters.sortOrder === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}`}
                onClick={() => onChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="w-7 h-7 sm:w-7 sm:h-7 shrink-0 rounded-lg bg-[#252a48] hover:bg-[#2e3459] text-xs font-black text-[#dfc792] flex items-center justify-center transition-all active:scale-90 border border-[#c8b07b]/20"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Vivid Color Mode Toggle */}
            <button
              type="button"
              onClick={() => onChange({ showFullColor: !filters.showFullColor })}
              title="Toggle Vivid full-color for unowned cards"
              className={`px-2.5 py-2 sm:px-3 sm:py-2 shrink-0 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1 min-h-[40px] sm:min-h-[38px] active:scale-95 ${
                filters.showFullColor
                  ? 'bg-[#c8b07b]/20 border-[#c8b07b] text-[#dfc792] shadow-[#c8b07b]/10'
                  : 'bg-[#1b2038] border-[#c8b07b]/25 text-slate-400 hover:text-slate-200 hover:border-[#c8b07b]/50'
              }`}
            >
              <span>🎨</span>
              <span className="hidden md:inline">Vivid</span>
              <span className={`text-[10px] font-mono ${filters.showFullColor ? 'text-[#dfc792]' : 'text-slate-500'}`}>
                {filters.showFullColor ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Advanced Filters Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`px-2.5 py-2 sm:px-3 sm:py-2 shrink-0 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1 min-h-[40px] sm:min-h-[38px] active:scale-95 ${
                showAdvanced || activeSecondaryFilterCount > 0
                  ? 'bg-[#252a48] border-[#c8b07b] text-[#dfc792] shadow-[#c8b07b]/15'
                  : 'bg-[#1b2038] border-[#c8b07b]/25 text-slate-300 hover:text-slate-100 hover:border-[#c8b07b]/50'
              }`}
            >
              <span>⚙️</span>
              <span className="hidden xs:inline">Filters</span>
              {activeSecondaryFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#dfc792] text-[#131627] text-[10px] font-extrabold">
                  {activeSecondaryFilterCount}
                </span>
              )}
              <span className={`text-[10px] transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {/* Results Count Badge */}
            <div
              data-testid="result-count"
              data-count={totalFiltered}
              className="px-2.5 py-2 sm:px-3 sm:py-2 shrink-0 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 text-[11px] font-bold text-slate-300 whitespace-nowrap flex items-center gap-1.5 min-h-[40px] sm:min-h-[38px]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#dfc792]" />
              <span className="text-[#dfc792]">{totalFiltered.toLocaleString()}</span>
              <span className="text-slate-400 font-normal hidden xs:inline">cards</span>
            </div>
          </div>
        </div>

        {/* Row 2: Status Tabs Segment, Card Zoom / Columns Stepper, Lorcana Inks & Cost */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Status Tabs (Compact & Meaningful Icons) */}
          <div className="flex flex-nowrap sm:flex-wrap items-center justify-between sm:justify-start gap-1 p-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/20 w-full sm:w-auto">
            {STATUS_TABS.map((tab) => {
              const active = filters.statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange({ statusFilter: tab.id })}
                  title={tab.label}
                  className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 min-h-[36px] sm:min-h-[32px] ${
                    active
                      ? 'bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] shadow-md shadow-[#c8b07b]/20 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#252a48]/50'
                  }`}
                >
                  <span className="text-sm sm:text-xs">{tab.icon}</span>
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Group: Grid Zoom, Minimal Ink Gems, Cost, and Inkwell.
              Every capsule grows on a phone: flex-wrap packs what fits on a line
              and the growers absorb the remainder, so no line ends in a gap. */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Grid Zoom & Custom Column Controls. Hidden on a phone — it sets how
                the grid looks, not what is in it, so it does not earn a row next to
                the filters. The drawer renders the same block there. */}
            <div className="hidden sm:flex grow sm:grow-0 items-center justify-between sm:justify-start gap-0.5 p-1 sm:p-0.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 shadow-sm min-h-[38px] sm:min-h-[34px]" title="Adjust Card Size / Column Count">
              {/* Presets */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onChange({ cardZoom: 'compact' })}
                  title="Compact Grid"
                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg text-xs font-black transition-all flex items-center justify-center active:scale-95 ${
                    filters.cardZoom === 'compact'
                      ? 'bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ cardZoom: 'normal' })}
                  title="Standard Grid"
                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg text-xs transition-all flex items-center justify-center active:scale-95 ${
                    (filters.cardZoom ?? 'normal') === 'normal'
                      ? 'bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🎴
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ cardZoom: 'large' })}
                  title="Large Grid"
                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg text-xs font-black transition-all flex items-center justify-center active:scale-95 ${
                    filters.cardZoom === 'large'
                      ? 'bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  +
                </button>
              </div>

              <span className="w-px h-4 bg-[#c8b07b]/30 my-auto mx-0.5" />

              {/* Custom Column Stepper */}
              <div className="flex items-center gap-0.5 px-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const curr = filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : 6;
                    const next = Math.max(1, curr - 1);
                    onChange({ cardZoom: 'custom', customColumns: next });
                  }}
                  title="Decrease custom columns"
                  className="w-6 h-6 sm:w-5 sm:h-5 rounded flex items-center justify-center text-slate-300 hover:text-[#dfc792] bg-[#252a48]/60 sm:bg-transparent text-xs font-black active:scale-90"
                >
                  −
                </button>

                <input
                  type="number"
                  min={1}
                  max={12}
                  value={filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : ''}
                  placeholder={filters.cardZoom === 'compact' ? '10' : filters.cardZoom === 'large' ? '4' : '6'}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      const clamped = Math.max(1, Math.min(12, val));
                      onChange({ cardZoom: 'custom', customColumns: clamped });
                    }
                  }}
                  title="Custom columns (1-12)"
                  className={`w-7 sm:w-6 text-center font-mono text-xs sm:text-[11px] font-bold py-0.5 rounded bg-[#131627] border focus:outline-none focus:border-[#c8b07b] ${
                    filters.cardZoom === 'custom'
                      ? 'border-[#c8b07b] text-[#dfc792] ring-1 ring-[#c8b07b]/40'
                      : 'border-[#c8b07b]/20 text-slate-400 placeholder:text-slate-600'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => {
                    const curr = filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : 6;
                    const next = Math.min(12, curr + 1);
                    onChange({ cardZoom: 'custom', customColumns: next });
                  }}
                  title="Increase custom columns"
                  className="w-6 h-6 sm:w-5 sm:h-5 rounded flex items-center justify-center text-slate-300 hover:text-[#dfc792] bg-[#252a48]/60 sm:bg-transparent text-xs font-black active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* Lorcana 6-Inks Minimal Gem Capsule (Official SVG Icons) */}
            <div className="flex grow sm:grow-0 items-center justify-between sm:justify-start gap-1 p-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 shadow-sm w-full sm:w-auto" title="Filter by Ink Colour">
              <button
                type="button"
                onClick={() => onChange({ selectedInk: 'ALL' })}
                title="All Inks"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 min-h-[30px] sm:min-h-[28px] flex items-center gap-1 ${
                  filters.selectedInk === 'ALL'
                    ? 'bg-[#252a48] border border-[#c8b07b] text-[#dfc792] shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>✦</span>
                <span className="hidden xl:inline text-[11px]">All</span>
              </button>

              {INKS.map((ink) => {
                const active = filters.selectedInk === ink;
                const style = INK_STYLES[ink];
                return (
                  <button
                    key={ink}
                    type="button"
                    title={ink}
                    onClick={() => onChange({ selectedInk: active ? 'ALL' : ink })}
                    className={`w-7 h-7 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center transition-all active:scale-90 ${
                      active ? `${style.activeChip} shadow-md` : `bg-[#131627] ${style.chip}`
                    }`}
                  >
                    <LorcanaInkIcon ink={ink} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Rarity Dropdown, out in the bar right up to the desktop capsule
                breakpoint: it is the filter people reach for most. */}
            <div className="flex xl:hidden grow sm:grow-0 items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 shadow-sm min-h-[38px] sm:min-h-[34px]" title="Filter by Rarity">
              <span className="text-[11px] font-bold text-[#dfc792] shrink-0">Rarity:</span>
              <select
                value={filters.selectedRarity}
                onChange={(e) => onChange({ selectedRarity: e.target.value as any })}
                aria-label="Filter cards by rarity"
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-[#1b2038] text-slate-200">All Rarities</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r} className="bg-[#1b2038] text-slate-200">
                    {rarityLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Rarity Filter Capsule (Full Text Names) */}
            <div className="hidden xl:flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 shadow-sm" title="Filter by Rarity">
              <button
                type="button"
                onClick={() => onChange({ selectedRarity: 'ALL' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 min-h-[30px] sm:min-h-[28px] ${
                  filters.selectedRarity === 'ALL'
                    ? 'bg-[#c8b07b]/25 border border-[#c8b07b] text-[#dfc792] shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Rarities
              </button>

              {RARITIES.map((r) => {
                const active = filters.selectedRarity === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ selectedRarity: active ? 'ALL' : r })}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[30px] sm:min-h-[28px] ${
                      active
                        ? 'bg-[#c8b07b]/30 border-[#c8b07b] text-[#dfc792] shadow-md ring-1 ring-[#c8b07b]/50 font-extrabold'
                        : `bg-[#131627] border-[#c8b07b]/20 ${RARITY_STYLES[r]} hover:brightness-125`
                    }`}
                  >
                    {rarityLabel(r)}
                  </button>
                );
              })}
            </div>

            {/* Ink Cost Selector. Phone reaches this through the drawer. */}
            <div className="hidden sm:flex grow sm:grow-0 items-center justify-between sm:justify-start gap-0.5 p-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 shadow-sm" title="Filter by Ink Cost">
              <button
                type="button"
                onClick={() => onChange({ selectedCost: 'ALL' })}
                title="All Ink Costs"
                className={`px-1.5 py-1 rounded-lg text-xs sm:text-[10px] font-bold transition-all active:scale-95 ${
                  filters.selectedCost === 'ALL'
                    ? 'bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {INK_COSTS.filter((c) => c !== 'ALL').map((c) => {
                const active = filters.selectedCost === c;
                return (
                  <button
                    key={c}
                    type="button"
                    title={`Cost ${c}`}
                    onClick={() => onChange({ selectedCost: active ? 'ALL' : c })}
                    className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg text-xs sm:text-[11px] font-mono font-black flex items-center justify-center transition-all active:scale-90 ${
                      active
                        ? 'bg-gradient-to-tr from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] shadow-sm shadow-[#c8b07b]/30'
                        : 'text-slate-300 hover:text-[#dfc792] hover:bg-[#252a48]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Inkwell (Inkable) Toggle with Official Swirl Icon */}
            <button
              type="button"
              onClick={() => {
                const next = filters.selectedInkwell === 'ALL' ? 'inkable' : filters.selectedInkwell === 'inkable' ? 'uninkable' : 'ALL';
                onChange({ selectedInkwell: next });
              }}
              title={`Inkwell: ${filters.selectedInkwell === 'inkable' ? 'Inkable cards only' : filters.selectedInkwell === 'uninkable' ? 'Uninkable cards only' : 'All cards'}`}
              className={`hidden sm:flex grow sm:grow-0 justify-center sm:justify-start px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all items-center gap-1.5 active:scale-95 min-h-[38px] sm:min-h-[34px] ${
                filters.selectedInkwell !== 'ALL'
                  ? 'bg-[#c8b07b]/20 border-[#c8b07b] text-[#dfc792] shadow-sm'
                  : 'bg-[#1b2038] border-[#c8b07b]/25 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LorcanaInkwellIcon inkable={filters.selectedInkwell} className="w-4 h-4 shrink-0" />
              <span className={`text-[11px] font-semibold ${filters.selectedInkwell !== 'ALL' ? 'text-[#dfc792]' : 'text-slate-400'}`}>
                {filters.selectedInkwell === 'inkable' ? 'Inkable' : filters.selectedInkwell === 'uninkable' ? 'Uninkable' : 'Inkwell'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Filter Tags (if any active character, story, ink, cost, etc.) */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#c8b07b]/15 text-[11px]">
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
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-[#c8b07b]/40 text-[#dfc792] font-semibold">
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
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-semibold ${INK_STYLES[filters.selectedInk as keyof typeof INK_STYLES]?.badgeBg ?? 'bg-[#1b2038]'}`}>
                <LorcanaInkIcon ink={filters.selectedInk} className="w-3.5 h-3.5" />
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

            {filters.selectedCost !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-[#c8b07b]/40 text-[#dfc792] font-semibold">
                Cost {filters.selectedCost}
                <button
                  type="button"
                  onClick={() => onChange({ selectedCost: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedInkwell !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-[#c8b07b]/40 text-[#dfc792] font-semibold">
                <LorcanaInkwellIcon inkable={filters.selectedInkwell} className="w-3.5 h-3.5" />
                {filters.selectedInkwell === 'inkable' ? 'Inkable' : 'Uninkable'}
                <button
                  type="button"
                  onClick={() => onChange({ selectedInkwell: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedType !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-slate-600 text-slate-200 font-semibold">
                {TYPE_ICONS[filters.selectedType as keyof typeof TYPE_ICONS]} {filters.selectedType}
                <button
                  type="button"
                  onClick={() => onChange({ selectedType: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedClassification !== 'ALL' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-slate-600 text-slate-200 font-semibold">
                🏷 {filters.selectedClassification}
                <button
                  type="button"
                  onClick={() => onChange({ selectedClassification: 'ALL' })}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            )}

            {filters.selectedRarity !== 'ALL' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1b2038] border border-slate-600 text-slate-200 font-semibold">
                <LorcanaRarityIcon rarity={filters.selectedRarity} className="w-3.5 h-3.5" />
                {rarityLabel(filters.selectedRarity)}
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

        {/* Collapsible Advanced Filters Drawer (No horizontal scroll, clean wrap) */}
        {showAdvanced && (
          <div className="pt-2.5 border-t border-[#c8b07b]/20 space-y-2.5 animate-fade-in">
            {/* Grid density, phone only — the capsule in the bar above covers every
                wider screen, so this never renders twice. */}
            <div className="flex sm:hidden flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Grid:</span>
              <div className="flex items-center gap-1">
                {([
                  { id: 'compact', label: 'Compact' },
                  { id: 'normal', label: 'Standard' },
                  { id: 'large', label: 'Large' },
                ] as const).map((preset) => {
                  const active = (filters.cardZoom ?? 'normal') === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange({ cardZoom: preset.id })}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 min-h-[34px] ${
                        active
                          ? 'bg-[#c8b07b]/25 border-[#c8b07b] text-[#dfc792] font-extrabold'
                          : 'bg-[#131627] border-[#c8b07b]/20 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Columns:</span>
                <button
                  type="button"
                  aria-label="Fewer columns"
                  onClick={() => {
                    const curr = filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : 6;
                    onChange({ cardZoom: 'custom', customColumns: Math.max(1, curr - 1) });
                  }}
                  className="w-8 h-8 rounded-lg bg-[#252a48] text-slate-200 text-sm font-black active:scale-90"
                >
                  −
                </button>
                <span
                  className={`w-8 text-center font-mono text-xs font-bold ${
                    filters.cardZoom === 'custom' ? 'text-[#dfc792]' : 'text-slate-500'
                  }`}
                >
                  {filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : '–'}
                </span>
                <button
                  type="button"
                  aria-label="More columns"
                  onClick={() => {
                    const curr = filters.cardZoom === 'custom' ? (filters.customColumns ?? 6) : 6;
                    onChange({ cardZoom: 'custom', customColumns: Math.min(12, curr + 1) });
                  }}
                  className="w-8 h-8 rounded-lg bg-[#252a48] text-slate-200 text-sm font-black active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* Card Types */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Type:</span>
              <div className="flex flex-wrap gap-1">
                {CARD_TYPES.map((t) => {
                  const active = filters.selectedType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChange({ selectedType: active ? 'ALL' : t })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-[#c8b07b]/20 border-[#c8b07b] text-[#dfc792] shadow-sm'
                          : 'bg-[#1b2038] border-[#c8b07b]/20 text-slate-400 hover:text-slate-200'
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Rarity:</span>
              <div className="flex flex-wrap gap-1">
                {RARITIES.map((r) => {
                  const active = filters.selectedRarity === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChange({ selectedRarity: active ? 'ALL' : r })}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-[#c8b07b]/30 border-[#c8b07b] text-[#dfc792] shadow-sm font-extrabold'
                          : `bg-[#1b2038] border-[#c8b07b]/20 ${RARITY_STYLES[r]} hover:brightness-125`
                      }`}
                    >
                      {rarityLabel(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ink Cost & Inkwell in Drawer */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#c8b07b]/15">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Ink Cost:</span>
                <div className="flex flex-wrap gap-1">
                  {INK_COSTS.map((c) => {
                    const active = filters.selectedCost === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ selectedCost: c })}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                          active
                            ? 'bg-[#c8b07b]/25 border-[#c8b07b] text-[#dfc792] shadow-sm'
                            : 'bg-[#1b2038] border-[#c8b07b]/20 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {c === 'ALL' ? 'All Costs' : c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Inkwell:</span>
                <div className="flex flex-wrap gap-1">
                  {(['ALL', 'inkable', 'uninkable'] as const).map((mode) => {
                    const active = filters.selectedInkwell === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onChange({ selectedInkwell: mode })}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-[#c8b07b]/25 border-[#c8b07b] text-[#dfc792] shadow-sm'
                            : 'bg-[#1b2038] border-[#c8b07b]/20 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'ALL' ? 'All' : mode === 'inkable' ? '⬡ Inkable' : 'Uninkable'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Classifications & Sorting */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#c8b07b]/15">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classification</span>
                <select
                  value={filters.selectedClassification}
                  onChange={(e) => onChange({ selectedClassification: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort By</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => onChange({ sortBy: e.target.value as CollectionSortBy })}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
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
                className="px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-300 hover:text-[#dfc792] font-medium"
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
