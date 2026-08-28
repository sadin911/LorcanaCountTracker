export type Currency = 'THB' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  label: string;
  defaultRate: number; // Against 1.0 USD
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'THB', symbol: '฿', label: 'THB (฿)', defaultRate: 35.0 },
  { code: 'USD', symbol: '$', label: 'USD ($)', defaultRate: 1.0 },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', defaultRate: 0.92 },
  { code: 'GBP', symbol: '£', label: 'GBP (£)', defaultRate: 0.78 },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)', defaultRate: 155.0 },
];

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
  marketValueConverted: number;
  userCostConverted: number;
  userValuationConverted: number;
  currency: Currency;
}
