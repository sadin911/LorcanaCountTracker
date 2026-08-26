import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import cardData from '../../data/lorcanaCards.json';
import setData from '../../data/lorcanaSets.json';
import { useCollectionStore } from '../../store/collectionStore';
import type { LorcanaCard, LorcanaSet } from '../../types/card';
import type { CollectionStats, SetProgress } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { createCardMatcher } from '../../utils/searchHelpers';
import type { SetOption } from '../common/SearchableSetSelect';
import { CollectionFilterBar } from './CollectionFilterBar';
import { CollectionGridView } from './CollectionGridView';
import { CollectionHeader } from './CollectionHeader';

const ALL_CARDS = cardData as LorcanaCard[];
const ALL_SETS = setData as LorcanaSet[];

/** Set order follows lorcanaSets.json (release order), not alphabetical codes. */
const SET_ORDER = new Map(ALL_SETS.map((s, i) => [s.code, i]));

const ALL_CLASSIFICATIONS = Array.from(
  new Set(ALL_CARDS.flatMap((c) => c.classifications))
).sort((a, b) => a.localeCompare(b));

export function CollectionTracker() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const filters = useCollectionStore((s) => s.filters);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);

  const ownedCards = profiles[activeProfileId]?.cards ?? {};

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Clearing the box should feel instant; typing can lag a frame behind.
  const deferredSearch = useDeferredValue(filters.search);
  const effectiveSearch = filters.search.trim() === '' ? '' : deferredSearch;
  const cardMatcher = useMemo(() => createCardMatcher(effectiveSearch), [effectiveSearch]);

  const sets: SetOption[] = useMemo(() => {
    const counts = new Map<string, { count: number; owned: number }>();
    for (const card of ALL_CARDS) {
      const bucket = counts.get(card.setCode) ?? { count: 0, owned: 0 };
      bucket.count++;
      if (totalCopies(ownedCards[card.id]?.variants) > 0) bucket.owned++;
      counts.set(card.setCode, bucket);
    }
    return ALL_SETS.map((s) => ({
      code: s.code,
      name: s.name,
      count: counts.get(s.code)?.count ?? 0,
      owned: counts.get(s.code)?.owned ?? 0,
    })).sort((a, b) => (SET_ORDER.get(a.code) ?? 0) - (SET_ORDER.get(b.code) ?? 0));
  }, [ownedCards]);

  const overallStats: CollectionStats = useMemo(() => {
    let unique = 0;
    let copies = 0;
    let wishlist = 0;
    let duplicates = 0;

    for (const entry of Object.values(ownedCards)) {
      const total = totalCopies(entry.variants);
      if (entry.isWishlist) wishlist++;
      if (total > 0) {
        unique++;
        copies += total;
        duplicates += total - 1;
      }
    }

    return {
      totalProfiles: Object.keys(profiles).length,
      activeProfileName: profiles[activeProfileId]?.name ?? '',
      totalUniqueOwned: unique,
      totalCardsCount: copies,
      wishlistCount: wishlist,
      duplicatesCount: duplicates,
      overallPercentage: ALL_CARDS.length ? Math.round((unique / ALL_CARDS.length) * 100) : 0,
    };
  }, [ownedCards, profiles, activeProfileId]);

  const currentSetProgress: SetProgress | null = useMemo(() => {
    if (filters.selectedSet === 'ALL') return null;
    const set = sets.find((s) => s.code === filters.selectedSet);
    if (!set) return null;
    let copies = 0;
    for (const card of ALL_CARDS) {
      if (card.setCode !== set.code) continue;
      copies += totalCopies(ownedCards[card.id]?.variants);
    }
    return {
      setCode: set.code,
      setName: set.name,
      totalCards: set.count,
      uniqueOwned: set.owned,
      totalCount: copies,
      percentage: set.count ? Math.round((set.owned / set.count) * 100) : 0,
    };
  }, [filters.selectedSet, sets, ownedCards]);

  const filteredCards = useMemo(() => {
    const {
      statusFilter,
      selectedSet,
      selectedInk,
      selectedType,
      selectedRarity,
      selectedClassification,
      sortBy,
      sortOrder,
    } = filters;

    const result = ALL_CARDS.filter((card) => {
      const entry = ownedCards[card.id];
      const copies = totalCopies(entry?.variants);

      switch (statusFilter) {
        case 'owned':
          if (copies === 0) return false;
          break;
        case 'missing':
          if (copies > 0) return false;
          break;
        case 'wishlist':
          if (!entry?.isWishlist) return false;
          break;
        case 'duplicates':
          if (copies < 2) return false;
          break;
      }

      if (selectedSet !== 'ALL' && card.setCode !== selectedSet) return false;
      // Membership, not equality: 187 cards are dual-ink and would otherwise
      // vanish from every ink filter.
      if (selectedInk !== 'ALL' && !card.inks.includes(selectedInk as never)) return false;
      if (selectedType !== 'ALL' && !card.types.includes(selectedType as never)) return false;
      if (selectedRarity !== 'ALL' && card.rarity !== selectedRarity) return false;
      if (selectedClassification !== 'ALL' && !card.classifications.includes(selectedClassification)) return false;
      if (!cardMatcher(card)) return false;

      return true;
    });

    const dir = sortOrder === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name) || (a.version ?? '').localeCompare(b.version ?? '');
          break;
        case 'cost':
          cmp = (a.cost ?? -1) - (b.cost ?? -1);
          break;
        case 'lore':
          cmp = (a.lore ?? -1) - (b.lore ?? -1);
          break;
        case 'strength':
          cmp = (a.strength ?? -1) - (b.strength ?? -1);
          break;
        case 'quantity':
          cmp = totalCopies(ownedCards[a.id]?.variants) - totalCopies(ownedCards[b.id]?.variants);
          break;
        default:
          // Set order first, then numeric part, then the "4a"/"1f" suffix.
          cmp =
            (SET_ORDER.get(a.setCode) ?? 0) - (SET_ORDER.get(b.setCode) ?? 0) ||
            a.sortNum - b.sortNum ||
            a.sortSuffix.localeCompare(b.sortSuffix);
          break;
      }
      // Stable tiebreak so equal keys never reorder between renders.
      return (cmp || a.id.localeCompare(b.id)) * dir;
    });

    return result;
  }, [filters, ownedCards, cardMatcher]);

  // Pagination resets when the query changes, but NOT when a card count changes.
  const filterKey = [
    filters.selectedSet,
    filters.statusFilter,
    filters.selectedInk,
    filters.selectedType,
    filters.selectedRarity,
    filters.selectedClassification,
    filters.sortBy,
    filters.sortOrder,
    effectiveSearch.trim(),
    activeProfileId,
  ].join('_');

  return (
    <div className="min-h-screen">
      <CollectionHeader stats={overallStats} />

      <main className="px-3 sm:px-4 py-3 space-y-3">
        <CollectionFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          sets={sets}
          classifications={ALL_CLASSIFICATIONS}
          totalFiltered={filteredCards.length}
        />

        <CollectionGridView
          cards={filteredCards}
          currentSetProgress={currentSetProgress}
          showFullColor={filters.showFullColor}
          filterKey={filterKey}
        />
      </main>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 z-40 px-3 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-black/50"
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}
