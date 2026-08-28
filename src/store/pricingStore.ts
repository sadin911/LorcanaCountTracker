import { create } from 'zustand';
import { db } from '../utils/firebase';
import {
  doc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { MarketPrice, UserCardPrice, Currency, CardSaleTransaction } from '../types/pricing';
import fallbackMarketData from '../data/market_prices.json';

const USER_PRICES_STORAGE_KEY = 'lorcana_user_custom_prices';
const CURRENCY_STORAGE_KEY = 'lorcana_preferred_currency';
const EXCHANGE_RATES_STORAGE_KEY = 'lorcana_exchange_rates';

export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  THB: 35.0,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155.0,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

interface PricingState {
  marketPrices: Record<string, MarketPrice>;
  userPrices: Record<string, UserCardPrice>;
  currency: Currency;
  exchangeRates: Record<Currency, number>;
  loading: boolean;
  marketLoaded: boolean;
  userPricesLoaded: boolean;
  error: string | null;

  // Actions
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (currency: Currency, rate: number) => void;
  initPricing: (uid?: string | null) => Promise<void>;
  loadMarketPrices: () => Promise<void>;
  loadUserPrices: (uid?: string | null) => Promise<void>;
  setUserPrice: (
    cardId: string,
    priceData: {
      costPrice?: number | null;
      sellPrice?: number | null;
      currency?: Currency;
      isGraded?: boolean;
      gradingCompany?: 'PSA' | 'BGS' | 'CGC' | 'OTHER' | 'RAW';
      grade?: string;
      notes?: string;
    },
    uid?: string | null
  ) => Promise<void>;
  deleteUserPrice: (cardId: string, uid?: string | null) => Promise<void>;
  adminUpdateMarketPrice: (
    cardId: string,
    prices: {
      regular?: number | null;
      foil?: number | null;
      psa10?: number | null;
      lastSold?: number | null;
      lastSoldDate?: string | null;
    }
  ) => Promise<void>;
  logCardSaleTransaction: (
    cardId: string,
    sale: Omit<CardSaleTransaction, 'id'>
  ) => Promise<void>;
  adminSyncLivePrices: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Calculations & Formatting
  formatPrice: (usdAmount: number | null | undefined, targetCurrency?: Currency) => string;
  formatRawCurrency: (amount: number | null | undefined, currency: Currency) => string;
  getCardMarketPrice: (cardId: string) => MarketPrice | undefined;
  getCardUserPrice: (cardId: string) => UserCardPrice | undefined;
  calculateCardTotalValue: (
    cardId: string,
    normalCount?: number,
    foilCount?: number
  ) => {
    marketUSD: number;
    marketConverted: number;
    userCostConverted: number;
    userValuationConverted: number;
    currency: Currency;
  };
}

function loadLocalUserPrices(): Record<string, UserCardPrice> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_PRICES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUserPrices(prices: Record<string, UserCardPrice>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PRICES_STORAGE_KEY, JSON.stringify(prices));
  } catch (err) {
    console.warn('Failed to save user prices to localStorage:', err);
  }
}

function loadLocalExchangeRates(): Record<Currency, number> {
  if (typeof window === 'undefined') return DEFAULT_EXCHANGE_RATES;
  try {
    const raw = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
    return raw ? { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(raw) } : DEFAULT_EXCHANGE_RATES;
  } catch {
    return DEFAULT_EXCHANGE_RATES;
  }
}

export const usePricingStore = create<PricingState>((set, get) => ({
  marketPrices: (fallbackMarketData?.prices as unknown as Record<string, MarketPrice>) || {},
  userPrices: loadLocalUserPrices(),
  currency: (typeof window !== 'undefined' && (localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency)) || 'THB',
  exchangeRates: loadLocalExchangeRates(),
  loading: false,
  marketLoaded: false,
  userPricesLoaded: false,
  error: null,

  setCurrency: (currency: Currency) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    }
    set({ currency });
  },

  setExchangeRate: (curr: Currency, rate: number) => {
    const nextRates = { ...get().exchangeRates, [curr]: rate };
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(nextRates));
    }
    set({ exchangeRates: nextRates });
  },

  initPricing: async (uid?: string | null) => {
    await Promise.allSettled([get().loadMarketPrices(), get().loadUserPrices(uid)]);
  },

  loadMarketPrices: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Try fetching latest public static json (which might be updated by cronjob)
      let pricesMap: Record<string, MarketPrice> = {};
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/market_prices.json`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.prices && Object.keys(data.prices).length > 0) {
            pricesMap = data.prices;
          }
        }
      } catch (fetchErr) {
        console.warn('Fallback to bundled market data:', fetchErr);
      }

      // If fetch failed or empty, fallback to static import
      if (Object.keys(pricesMap).length === 0 && fallbackMarketData?.prices) {
        pricesMap = fallbackMarketData.prices as unknown as Record<string, MarketPrice>;
      }

      // 2. If Firestore is active, fetch cloud overrides or market prices doc if present
      if (db) {
        try {
          const snapshot = await getDocs(collection(db, 'market_prices'));
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MarketPrice;
              if (data && data.cardId) {
                pricesMap[data.cardId] = data;
              }
            });
          }
        } catch (firestoreErr) {
          console.debug('Firestore market_prices read skipped/failed:', firestoreErr);
        }
      }

      set({ marketPrices: pricesMap, marketLoaded: true, loading: false });
    } catch (err) {
      console.error('Failed to load market prices:', err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  loadUserPrices: async (uid?: string | null) => {
    // 1. Always start with local storage cache
    const local = loadLocalUserPrices();
    set({ userPrices: local, userPricesLoaded: true });

    if (!uid || !db) return;

    try {
      // Try subcollection /users/{uid}/custom_prices
      let cloudPrices: Record<string, UserCardPrice> = {};
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'custom_prices'));
        if (!snap.empty) {
          snap.forEach((docSnap) => {
            const data = docSnap.data() as UserCardPrice;
            if (data?.cardId) {
              cloudPrices[data.cardId] = data;
            }
          });
        }
      } catch {
        // Fallback to binder doc
        try {
          const vaultSnap = await getDocs(collection(db, 'users', uid, 'binders'));
          vaultSnap.forEach((docSnap) => {
            if (docSnap.id === 'lorcana_user_prices') {
              const vaultData = docSnap.data() as { prices?: Record<string, UserCardPrice> };
              if (vaultData?.prices) {
                cloudPrices = vaultData.prices;
              }
            }
          });
        } catch (vaultErr) {
          console.debug('User price cloud fallback read error:', vaultErr);
        }
      }

      const merged = { ...local, ...cloudPrices };
      saveLocalUserPrices(merged);
      set({ userPrices: merged });
    } catch (err) {
      console.error('Failed to load user custom prices:', err);
    }
  },

  setUserPrice: async (cardId, priceData, uid) => {
    const { userPrices, currency } = get();
    const updatedRecord: UserCardPrice = {
      cardId,
      costPrice: priceData.costPrice ?? null,
      sellPrice: priceData.sellPrice ?? null,
      currency: priceData.currency || userPrices[cardId]?.currency || currency,
      isGraded: priceData.isGraded ?? userPrices[cardId]?.isGraded ?? false,
      gradingCompany: priceData.gradingCompany || userPrices[cardId]?.gradingCompany || 'PSA',
      grade: priceData.grade || userPrices[cardId]?.grade || '10',
      notes: priceData.notes || '',
      updatedAt: new Date().toISOString(),
    };

    const nextUserPrices = {
      ...userPrices,
      [cardId]: updatedRecord,
    };

    saveLocalUserPrices(nextUserPrices);
    set({ userPrices: nextUserPrices });

    if (uid && db) {
      try {
        // 1. Try subcollection write
        const priceDocRef = doc(db, 'users', uid, 'custom_prices', cardId);
        await setDoc(priceDocRef, updatedRecord, { merge: true });
      } catch {
        // 2. Fallback to binder doc
        try {
          const vaultRef = doc(db, 'users', uid, 'binders', 'lorcana_user_prices');
          await setDoc(vaultRef, { prices: nextUserPrices, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (vaultErr) {
          console.warn('Failed to sync user price to cloud fallback:', vaultErr);
        }
      }
    }
  },

  deleteUserPrice: async (cardId, uid) => {
    const { userPrices } = get();
    const next = { ...userPrices };
    delete next[cardId];

    saveLocalUserPrices(next);
    set({ userPrices: next });

    if (uid && db) {
      try {
        const vaultRef = doc(db, 'users', uid, 'binders', 'lorcana_user_prices');
        await setDoc(vaultRef, { prices: next, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Failed to remove user price in cloud:', err);
      }
    }
  },

  adminUpdateMarketPrice: async (cardId, prices) => {
    const { marketPrices } = get();
    const existing = marketPrices[cardId] || {
      cardId,
      regular: null,
      foil: null,
      psa10: null,
      lastSold: null,
      lastSoldDate: null,
      recentSales: [],
      updatedAt: new Date().toISOString(),
    };

    const updated: MarketPrice = {
      ...existing,
      regular: prices.regular !== undefined ? prices.regular : existing.regular,
      foil: prices.foil !== undefined ? prices.foil : existing.foil,
      psa10: prices.psa10 !== undefined ? prices.psa10 : existing.psa10,
      lastSold: prices.lastSold !== undefined ? prices.lastSold : existing.lastSold,
      lastSoldDate: prices.lastSoldDate !== undefined ? prices.lastSoldDate : existing.lastSoldDate,
      updatedAt: new Date().toISOString(),
      source: 'admin_manual',
    };

    const next = { ...marketPrices, [cardId]: updated };
    set({ marketPrices: next });

    if (db) {
      try {
        const ref = doc(db, 'market_prices', cardId);
        // Strip undefined fields for Firestore
        const cleanPayload = JSON.parse(JSON.stringify(updated));
        await setDoc(ref, cleanPayload, { merge: true });
      } catch (err) {
        console.error('Admin market price Firestore save failed:', err);
        throw err;
      }
    }
  },

  logCardSaleTransaction: async (cardId, sale) => {
    const { marketPrices } = get();
    const existing = marketPrices[cardId] || {
      cardId,
      regular: null,
      foil: null,
      psa10: null,
      lastSold: null,
      lastSoldDate: null,
      recentSales: [],
      updatedAt: new Date().toISOString(),
    };

    const newTransaction: CardSaleTransaction = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: sale.date || new Date().toISOString().split('T')[0],
      price: sale.price,
      condition: sale.condition,
      source: sale.source,
      notes: sale.notes || '',
    };

    const existingSales = Array.isArray(existing.recentSales) ? existing.recentSales : [];
    const updatedSales = [newTransaction, ...existingSales].slice(0, 20); // Keep last 20

    const updated: MarketPrice = {
      ...existing,
      lastSold: sale.price,
      lastSoldDate: newTransaction.date,
      recentSales: updatedSales,
      updatedAt: new Date().toISOString(),
    };

    const next = { ...marketPrices, [cardId]: updated };
    set({ marketPrices: next });

    if (db) {
      try {
        const ref = doc(db, 'market_prices', cardId);
        const cleanPayload = JSON.parse(JSON.stringify(updated));
        await setDoc(ref, cleanPayload, { merge: true });
      } catch (err) {
        console.error('Firestore logCardSaleTransaction error:', err);
        throw err;
      }
    }
  },

  adminSyncLivePrices: async () => {
    set({ loading: true });
    try {
      const res = await fetch('https://api.lorcast.com/v0/sets');
      if (!res.ok) throw new Error(`Lorcast API HTTP ${res.status}`);
      const setsData = await res.json();
      const rawSets = setsData.results ?? setsData;

      const newPrices: Record<string, MarketPrice> = {};
      let count = 0;

      for (const s of rawSets) {
        const setRes = await fetch(`https://api.lorcast.com/v0/sets/${s.code}/cards`);
        if (!setRes.ok) continue;
        const setCards = await setRes.json();
        const list = Array.isArray(setCards) ? setCards : setCards.results ?? [];

        for (const card of list) {
          if (!card.set?.code || !card.collector_number) continue;
          const cardId = `${card.set.code}-${card.collector_number}`;
          const prices = card.prices || {};

          const regular = prices.usd ? parseFloat(prices.usd) : null;
          const foil = prices.usd_foil ? parseFloat(prices.usd_foil) : null;

          if (regular !== null || foil !== null) {
            newPrices[cardId] = {
              cardId,
              regular: isNaN(regular as number) ? null : regular,
              foil: isNaN(foil as number) ? null : foil,
              updatedAt: new Date().toISOString(),
              source: 'lorcast',
            };
            count++;
          }
        }
      }

      set({ marketPrices: newPrices, marketLoaded: true, loading: false });

      // Batch save into Firestore if available
      if (db) {
        const entries = Object.values(newPrices);
        const chunkSize = 450;
        for (let i = 0; i < entries.length; i += chunkSize) {
          const batch = writeBatch(db);
          const chunk = entries.slice(i, i + chunkSize);
          for (const item of chunk) {
            const ref = doc(db, 'market_prices', item.cardId);
            batch.set(ref, item, { merge: true });
          }
          await batch.commit();
        }
      }

      return { success: true, count };
    } catch (err) {
      console.error('adminSyncLivePrices error:', err);
      set({ loading: false, error: (err as Error).message });
      return { success: false, count: 0, error: (err as Error).message };
    }
  },

  formatPrice: (usdAmount, targetCurrency) => {
    if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return '—';
    const curr = targetCurrency || get().currency;
    const rate = get().exchangeRates[curr] ?? 1.0;
    const converted = usdAmount * rate;
    const symbol = CURRENCY_SYMBOLS[curr] || '$';
    const decimals = curr === 'JPY' ? 0 : 2;

    return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  },

  formatRawCurrency: (amount, currency) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    const decimals = currency === 'JPY' ? 0 : 2;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  },

  getCardMarketPrice: (cardId) => {
    return get().marketPrices[cardId];
  },

  getCardUserPrice: (cardId) => {
    return get().userPrices[cardId];
  },

  calculateCardTotalValue: (cardId, normalCount = 0, foilCount = 0) => {
    const market = get().marketPrices[cardId];
    const user = get().userPrices[cardId];
    const activeCurrency = get().currency;
    const rates = get().exchangeRates;

    const regPrice = market?.regular ?? 0;
    const foilPrice = market?.foil ?? (market?.regular ?? 0);

    const totalMarketUSD = normalCount * regPrice + foilCount * foilPrice;
    const activeRate = rates[activeCurrency] ?? 1.0;
    const totalMarketConverted = totalMarketUSD * activeRate;

    const totalCopies = normalCount + foilCount;
    let userCostConverted = 0;
    let userValuationConverted = 0;

    if (user?.costPrice) {
      const userCurr = user.currency || 'THB';
      const userRate = rates[userCurr] ?? 1.0;
      // Convert to USD base first, then to activeCurrency
      const costUsd = user.costPrice / userRate;
      userCostConverted = totalCopies * costUsd * activeRate;
    }

    if (user?.sellPrice) {
      const userCurr = user.currency || 'THB';
      const userRate = rates[userCurr] ?? 1.0;
      const sellUsd = user.sellPrice / userRate;
      userValuationConverted = totalCopies * sellUsd * activeRate;
    }

    return {
      marketUSD: totalMarketUSD,
      marketConverted: totalMarketConverted,
      userCostConverted,
      userValuationConverted,
      currency: activeCurrency,
    };
  },
}));
