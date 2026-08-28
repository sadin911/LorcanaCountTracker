import { create } from 'zustand';
import { db } from '../utils/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { MarketPrice, UserCardPrice, Currency } from '../types/pricing';
import fallbackMarketData from '../data/market_prices.json';

const USER_PRICES_STORAGE_KEY = 'lorcana_user_custom_prices';
const CURRENCY_STORAGE_KEY = 'lorcana_preferred_currency';
const USD_RATE_STORAGE_KEY = 'lorcana_usd_thb_rate';

interface PricingState {
  marketPrices: Record<string, MarketPrice>;
  userPrices: Record<string, UserCardPrice>;
  currency: Currency;
  usdToThbRate: number; // default e.g. 35.0
  loading: boolean;
  marketLoaded: boolean;
  userPricesLoaded: boolean;
  error: string | null;

  // Actions
  setCurrency: (currency: Currency) => void;
  setUsdToThbRate: (rate: number) => void;
  initPricing: (uid?: string | null) => Promise<void>;
  loadMarketPrices: () => Promise<void>;
  loadUserPrices: (uid?: string | null) => Promise<void>;
  setUserPrice: (
    cardId: string,
    priceData: { costPrice?: number | null; sellPrice?: number | null; notes?: string },
    uid?: string | null
  ) => Promise<void>;
  deleteUserPrice: (cardId: string, uid?: string | null) => Promise<void>;
  adminUpdateMarketPrice: (
    cardId: string,
    prices: { regular?: number | null; foil?: number | null }
  ) => Promise<void>;
  adminSyncLivePrices: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Calculations
  formatPrice: (usdAmount: number | null | undefined, targetCurrency?: Currency) => string;
  getCardMarketPrice: (cardId: string) => MarketPrice | undefined;
  getCardUserPrice: (cardId: string) => UserCardPrice | undefined;
  calculateCardTotalValue: (
    cardId: string,
    normalCount?: number,
    foilCount?: number
  ) => {
    marketUSD: number;
    marketTHB: number;
    userCost: number;
    userValuation: number;
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

export const usePricingStore = create<PricingState>((set, get) => ({
  marketPrices: (fallbackMarketData?.prices as unknown as Record<string, MarketPrice>) || {},
  userPrices: loadLocalUserPrices(),
  currency: (typeof window !== 'undefined' && (localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency)) || 'THB',
  usdToThbRate:
    (typeof window !== 'undefined' && parseFloat(localStorage.getItem(USD_RATE_STORAGE_KEY) || '35.0')) || 35.0,
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

  setUsdToThbRate: (usdToThbRate: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USD_RATE_STORAGE_KEY, String(usdToThbRate));
    }
    set({ usdToThbRate });
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
          // Non-blocking if collection permissions are not yet configured
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
          snap.forEach((d) => {
            const data = d.data() as UserCardPrice;
            if (data && data.cardId) {
              cloudPrices[data.cardId] = data;
            }
          });
        }
      } catch {
        // Fallback to vault doc /binders/lorcana_user_prices
        const fallbackDoc = await getDoc(doc(db, 'users', uid, 'binders', 'lorcana_user_prices'));
        if (fallbackDoc.exists()) {
          const data = fallbackDoc.data();
          if (data?.prices) {
            cloudPrices = data.prices as Record<string, UserCardPrice>;
          }
        }
      }

      const merged = { ...local, ...cloudPrices };
      saveLocalUserPrices(merged);
      set({ userPrices: merged });
    } catch (err) {
      console.warn('Failed to load user prices from cloud:', err);
    }
  },

  setUserPrice: async (cardId, priceData, uid) => {
    const { userPrices, currency } = get();
    const updatedRecord: UserCardPrice = {
      cardId,
      costPrice: priceData.costPrice ?? null,
      sellPrice: priceData.sellPrice ?? null,
      currency: (priceData as unknown as { currency?: Currency }).currency || currency,
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
      updatedAt: new Date().toISOString(),
    };

    const updated: MarketPrice = {
      ...existing,
      regular: prices.regular !== undefined ? prices.regular : existing.regular,
      foil: prices.foil !== undefined ? prices.foil : existing.foil,
      updatedAt: new Date().toISOString(),
      source: 'admin_manual',
    };

    const next = { ...marketPrices, [cardId]: updated };
    set({ marketPrices: next });

    if (db) {
      try {
        const ref = doc(db, 'market_prices', cardId);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('Admin market price Firestore save failed:', err);
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
          const num = String(card.collector_number);
          const cardId = `${card.set.code}-${num}`;
          const parseP = (v: unknown) => {
            if (v === null || v === undefined || v === '') return null;
            const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''));
            return isNaN(n) ? null : Math.round(n * 100) / 100;
          };

          const regular = parseP(card.prices?.usd);
          const foil = parseP(card.prices?.usd_foil);

          if (regular !== null || foil !== null) {
            count++;
          }

          newPrices[cardId] = {
            cardId,
            regular,
            foil,
            updatedAt: new Date().toISOString(),
            source: 'lorcast',
          };
        }
      }

      set((state) => ({
        marketPrices: { ...state.marketPrices, ...newPrices },
        loading: false,
      }));

      // If DB is connected, push batch to Firestore
      if (db) {
        try {
          const chunks = Object.values(newPrices);
          // Write in chunks of 450 to stay under Firestore 500 limit
          for (let i = 0; i < chunks.length; i += 450) {
            const batch = writeBatch(db);
            const slice = chunks.slice(i, i + 450);
            for (const item of slice) {
              const docRef = doc(db, 'market_prices', item.cardId);
              batch.set(docRef, item, { merge: true });
            }
            await batch.commit();
          }
        } catch (dbErr) {
          console.warn('Firestore bulk market_prices update notice:', dbErr);
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
    const rate = get().usdToThbRate;

    if (curr === 'THB') {
      const thb = usdAmount * rate;
      return `฿${thb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    const rate = get().usdToThbRate;

    const regPrice = market?.regular ?? 0;
    const foilPrice = market?.foil ?? (market?.regular ?? 0);

    const totalMarketUSD = normalCount * regPrice + foilCount * foilPrice;
    const totalMarketTHB = totalMarketUSD * rate;

    const totalCopies = normalCount + foilCount;
    let userCost = 0;
    let userValuation = 0;

    if (user?.costPrice) {
      const costPerCopy = user.currency === 'USD' ? user.costPrice * rate : user.costPrice;
      userCost = totalCopies * costPerCopy;
    }

    if (user?.sellPrice) {
      const sellPerCopy = user.currency === 'USD' ? user.sellPrice * rate : user.sellPrice;
      userValuation = totalCopies * sellPerCopy;
    }

    return {
      marketUSD: totalMarketUSD,
      marketTHB: totalMarketTHB,
      userCost,
      userValuation,
    };
  },
}));
