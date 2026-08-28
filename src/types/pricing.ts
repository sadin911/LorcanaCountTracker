export type Currency = 'USD' | 'THB';

export interface MarketPrice {
  cardId: string;
  regular: number | null; // USD base
  foil: number | null; // USD base
  updatedAt: string; // ISO string
  source?: 'tcgplayer' | 'lorcast' | 'cardmarket' | 'admin_manual';
}

export interface UserCardPrice {
  cardId: string;
  costPrice: number | null; // Purchase/Cost price per copy
  sellPrice: number | null; // User's target selling/valuation price per copy
  currency: Currency;
  notes?: string;
  updatedAt: string;
}

export interface CardPricingSummary {
  marketValueUSD: number;
  marketValueTHB: number;
  userCostTHB: number;
  userCostUSD: number;
  userValuationTHB: number;
  userValuationUSD: number;
  profitOrLossTHB: number;
  profitOrLossUSD: number;
}
