/** Shape of one record in src/data/lorcanaCards.json (written by scripts/fetch-lorcana-cards.mjs). */

export type Ink = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

export type CardType = 'Character' | 'Action' | 'Song' | 'Item' | 'Location';

export type Rarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Super_rare'
  | 'Legendary'
  | 'Enchanted'
  | 'Epic'
  | 'Iconic'
  | 'Promo';

/** The physical finishes a Lorcana card is printed in. Lorcana has exactly two. */
export type FinishKey = 'normal' | 'foil';

export interface LorcanaCard {
  /** `${setCode}-${collectorNumber}`, verbatim and unique across all 3,192 cards. */
  id: string;
  name: string;
  /** The subtitle after the em dash. Null for 633 cards (mostly Actions/Songs/Items). */
  version: string | null;
  setCode: string;
  setName: string;
  /** The Disney story this card comes from, e.g. "Frozen". Joined in from LorcanaJSON. */
  story: string;
  /** Not always numeric: "4a", "1f", "25ja", "24B" all occur. */
  collectorNumber: string;
  /** Leading digits of collectorNumber, for stable ordering. */
  sortNum: number;
  /** Trailing non-digits of collectorNumber ("a", "f", "ja", "B" or ""). */
  sortSuffix: string;
  rarity: Rarity;
  /** Always an array: `ink` is null for 160 cards and 187 cards are dual-ink. */
  inks: Ink[];
  inkwell: boolean;
  cost: number | null;
  types: CardType[];
  classifications: string[];
  strength: number | null;
  willpower: number | null;
  lore: number | null;
  moveCost: number | null;
  text: string;
  keywords: string[];
  illustrators: string[];
  /** 'landscape' for all 106 Location cards, 'normal' otherwise. */
  layout: 'normal' | 'landscape';
  /** Which finishes this card exists in. Never empty. */
  finishes: FinishKey[];
}

export interface LorcanaSet {
  code: string;
  name: string;
  releasedAt: string | null;
  cardCount: number;
}

/** One Disney story and how many catalogue cards belong to it. */
export interface LorcanaStory {
  name: string;
  cardCount: number;
}

export const INKS: Ink[] = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

export const CARD_TYPES: CardType[] = ['Character', 'Action', 'Song', 'Item', 'Location'];

export const RARITIES: Rarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Super_rare',
  'Legendary',
  'Epic',
  'Iconic',
  'Enchanted',
  'Promo',
];

/** `Super_rare` is the API's spelling; everywhere user-facing wants "Super Rare". */
export function rarityLabel(rarity: string): string {
  return rarity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Full display name: "Elsa – Concerned Sister", or just "Friends on the Other Side". */
export function cardDisplayName(card: Pick<LorcanaCard, 'name' | 'version'>): string {
  return card.version ? `${card.name} – ${card.version}` : card.name;
}
