import type { FinishKey } from './card';

/**
 * Per-finish owned counts. Sparse on purpose — a fixed-field interface would
 * write `{normal: 0, foil: 0}` into every Firestore document.
 */
export type FinishCount = Partial<Record<FinishKey, number>>;

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP';

export interface CollectionCardEntry {
  cardId: string;
  variants: FinishCount;
  isWishlist?: boolean;
  condition?: CardCondition;
  note?: string;
  updatedAt: number;
}

/** A binder: one independent named collection. A user may have several. */
export interface CollectionProfile {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  /** Only owned, wishlisted or annotated cards appear here — empty entries are pruned. */
  cards: Record<string, CollectionCardEntry>;
  createdAt: number;
  updatedAt: number;
}

export type CollectionStatusFilter = 'all' | 'owned' | 'missing' | 'wishlist' | 'duplicates';

export type CollectionSortBy = 'number' | 'name' | 'cost' | 'lore' | 'strength' | 'quantity';

export type SortOrder = 'asc' | 'desc';

export interface CollectionFilters {
  selectedSet: string;
  statusFilter: CollectionStatusFilter;
  search: string;
  selectedInk: string;
  selectedType: string;
  selectedRarity: string;
  selectedClassification: string;
  sortBy: CollectionSortBy;
  sortOrder: SortOrder;
  showFullColor: boolean;
}

export interface SetProgress {
  setCode: string;
  setName: string;
  totalCards: number;
  uniqueOwned: number;
  totalCount: number;
  percentage: number;
}

export interface CollectionStats {
  totalProfiles: number;
  activeProfileName: string;
  totalUniqueOwned: number;
  totalCardsCount: number;
  wishlistCount: number;
  duplicatesCount: number;
  overallPercentage: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

/** Sum of every finish count on one entry. */
export function totalCopies(variants: FinishCount | undefined): number {
  if (!variants) return 0;
  let sum = 0;
  for (const v of Object.values(variants)) sum += Number(v) || 0;
  return sum;
}
