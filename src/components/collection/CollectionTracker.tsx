import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ALL_CARDS, ALL_CLASSIFICATIONS, ALL_SETS, ALL_STORIES, SET_ORDER } from '../../data/catalogue';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import type { CollectionStats, SetProgress } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { normalizeCardName } from '../../utils/cardRelations';
import { createCardMatcher } from '../../utils/searchHelpers';
import { analytics } from '../../utils/analytics';
import type { SetOption } from '../common/SearchableSetSelect';
import { PullToRefreshIndicator } from '../common/PullToRefreshIndicator';
import { CollectionFilterBar } from './CollectionFilterBar';
import { CollectionGridView } from './CollectionGridView';
import { CollectionHeader } from './CollectionHeader';

export function CollectionTracker() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  const user = useAuthStore((s) => s.user);
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const filters = useCollectionStore((s) => s.filters);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const loadUserFromCloud = useCollectionStore((s) => s.loadUserFromCloud);

  const handleRefresh = async () => {
    if (user) {
      await loadUserFromCloud(user.uid);
    }
    resetFilters();
  };

  const pullState = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const ownedCards = profiles[activeProfileId]?.cards ?? {};

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track search queries
  useEffect(() => {
    if (!filters.search.trim()) return;
    const timer = setTimeout(() => {
      analytics.trackSearch(filters.search);
    }, 800);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Track major filter changes
  useEffect(() => {
    if (filters.selectedInk !== 'ALL') {
      analytics.trackFilter('ink', filters.selectedInk);
    }
  }, [filters.selectedInk]);

  useEffect(() => {
    if (filters.selectedSet !== 'ALL') {
      analytics.trackFilter('set', filters.selectedSet);
    }
  }, [filters.selectedSet]);

  // Clearing the box should feel instant; typing can lag a frame behind.
  const deferredSearch = useDeferredValue(filters.search);
  const effectiveSearch = filters.search.trim() === '' ? '' : deferredSearch;
  const cardMatcher = useMemo(() => createCardMatcher(effectiveSearch), [effectiveSearch]);

  const { sets, stories } = useMemo(() => {
    const setCounts = new Map<string, { count: number; owned: number }>();
    const storyOwned = new Map<string, number>();

    for (const card of ALL_CARDS) {
      const bucket = setCounts.get(card.setCode) ?? { count: 0, owned: 0 };
      bucket.count++;
      if (totalCopies(ownedCards[card.id]?.variants) > 0) {
        bucket.owned++;
        storyOwned.set(card.story, (storyOwned.get(card.story) ?? 0) + 1);
      }
      setCounts.set(card.setCode, bucket);
    }

    const setOptions: SetOption[] = ALL_SETS.map((s) => ({
      code: s.code,
      name: s.name,
      count: setCounts.get(s.code)?.count ?? 0,
      owned: setCounts.get(s.code)?.owned ?? 0,
    })).sort((a, b) => (SET_ORDER.get(a.code) ?? 0) - (SET_ORDER.get(b.code) ?? 0));

    // A story is its own key: `code` and `name` are both the story name.
    const storyOptions: SetOption[] = ALL_STORIES.map((s) => ({
      code: s.name,
      name: s.name,
      count: s.cardCount,
      owned: storyOwned.get(s.name) ?? 0,
    })).sort((a, b) => a.name.localeCompare(b.name));

    return { sets: setOptions, stories: storyOptions };
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
      selectedStory,
      selectedCharacter,
      selectedInk,
      selectedCost,
      selectedInkwell,
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
      if (selectedStory !== 'ALL' && card.story !== selectedStory) return false;
      // Normalized both sides so this groups cards the same way the related-card
      // index does.
      if (
        selectedCharacter !== 'ALL' &&
        normalizeCardName(card.name) !== normalizeCardName(selectedCharacter)
      ) {
        return false;
      }
      // Membership, not equality: 187 cards are dual-ink and would otherwise
      // vanish from every ink filter.
      if (selectedInk !== 'ALL' && !card.inks.includes(selectedInk as never)) return false;

      // Ink Cost Filter
      if (selectedCost !== 'ALL') {
        if (selectedCost === '9+') {
          if (card.cost === null || card.cost < 9) return false;
        } else {
          const target = Number(selectedCost);
          if (card.cost !== target) return false;
        }
      }

      // Inkwell Filter
      if (selectedInkwell !== 'ALL') {
        if (selectedInkwell === 'inkable' && !card.inkwell) return false;
        if (selectedInkwell === 'uninkable' && card.inkwell) return false;
      }

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
    filters.selectedStory,
    filters.selectedCharacter,
    filters.statusFilter,
    filters.selectedInk,
    filters.selectedCost,
    filters.selectedInkwell,
    filters.selectedType,
    filters.selectedRarity,
    filters.selectedClassification,
    filters.sortBy,
    filters.sortOrder,
    filters.cardZoom,
    filters.customColumns,
    effectiveSearch.trim(),
    activeProfileId,
  ].join('_');

  return (
    <div className="min-h-screen">
      <PullToRefreshIndicator {...pullState} />
      <CollectionHeader stats={overallStats} />

      <main
        className="px-3 sm:px-4 py-3 space-y-3"
        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <h1 className="sr-only">Disney Lorcana Card Collection Tracker - Track Inks, Foils, Cards, and Sets</h1>
        <CollectionFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          sets={sets}
          stories={stories}
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
          className="fixed z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] text-xs font-black shadow-xl shadow-black/80 hover:brightness-110 active:scale-95 transition-all border border-[#c8b07b]"
          style={{
            bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
            right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
          }}
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}
