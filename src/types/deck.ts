import type { Ink, CardType } from './card';

export interface DeckCardEntry {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  coverCardId?: string;
  coverImageUrl?: string;
  cards: Record<string, DeckCardEntry>; // Keyed by cardId (e.g. "1-42")
  createdAt: number;
  updatedAt: number;
}

export interface DeckCostCurveItem {
  cost: number;
  count: number;
  inkableCount: number;
  uninkableCount: number;
}

export interface DeckStats {
  totalCards: number;
  inkableCount: number;
  uninkableCount: number;
  inkablePercentage: number;
  
  // Ink breakdown
  inkCounts: Record<Ink, number>;
  activeInks: Ink[];
  isInkLegal: boolean; // Max 2 inks

  // Card types breakdown
  characterCount: number;
  actionCount: number; // Regular actions
  songCount: number;   // Songs (Action - Song)
  itemCount: number;
  locationCount: number;

  // Lore stats
  totalLore: number;
  charactersWithLoreCount: number;
  averageLore: number;

  // Cost curve
  costCurve: DeckCostCurveItem[];
  averageCost: number;

  // Legality
  isLegal60: boolean;
  ruleViolations: string[];
}

export interface MissingCardInfo {
  cardId: string;
  name: string;
  version: string | null;
  fullName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  inks: Ink[];
  types: CardType[];
  inkwell: boolean;
  cost: number | null;
  countNeeded: number;
  countOwned: number;
  missingCount: number;
}

export interface DeckMissingReport {
  totalCardsNeeded: number;
  totalCardsOwned: number;
  totalCardsMissing: number;
  missingItems: MissingCardInfo[];
  completeItems: MissingCardInfo[];
  isComplete: boolean;
  completionPercentage: number;
}

export interface DeckImportResult {
  success: boolean;
  message: string;
  deckId?: string;
  unmatchedLines?: string[];
  cardsAddedCount?: number;
}
