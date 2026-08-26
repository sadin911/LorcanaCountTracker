/**
 * Disney Lorcana Analytics & Local Telemetry Service
 * Supports Google Analytics 4 (GA4) + In-App Admin Telemetry Store
 */

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  category: 'card' | 'search' | 'filter' | 'wishlist' | 'backup' | 'profile' | 'view';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  sessionStartTime: number;
  searchQueries: Record<string, number>;
  cardsAdded: Record<string, { name: string; setCode: string; count: number }>;
  wishlistCards: Record<string, { name: string; setCode: string; count: number }>;
  inkFilterUsage: Record<string, number>;
  setFilterUsage: Record<string, number>;
  eventsLog: TelemetryEvent[];
}

const LOCAL_STORAGE_KEY = 'lorcana_admin_telemetry_v1';
const MAX_LOG_EVENTS = 200;

// GA4 Window Extension
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

class AnalyticsService {
  private gaId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || null;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    if (this.gaId) {
      // Inject GA4 Tag
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', this.gaId, {
        send_page_view: true,
      });
      // eslint-disable-next-line no-console
      console.info(`[Analytics] GA4 initialized (${this.gaId})`);
    }

    this.isInitialized = true;
  }

  /**
   * Log an event both to GA4 and Local Telemetry Store for Admin Dashboard
   */
  public logEvent(
    category: TelemetryEvent['category'],
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ) {
    const event: TelemetryEvent = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      metadata,
    };

    // 1. Send to GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
        ...metadata,
      });
    }

    // 2. Persist to Local Storage for In-App Admin
    this.saveLocalTelemetry(event);
  }

  public trackCardAdded(cardName: string, setCode: string, finish: string, newTotal: number) {
    this.logEvent('card', 'card_added', `${cardName} (${setCode}) [${finish}]`, newTotal, {
      cardName,
      setCode,
      finish,
    });
  }

  public trackCardRemoved(cardName: string, setCode: string, finish: string, newTotal: number) {
    this.logEvent('card', 'card_removed', `${cardName} (${setCode}) [${finish}]`, newTotal, {
      cardName,
      setCode,
      finish,
    });
  }

  public trackWishlist(cardName: string, setCode: string, isWishlisted: boolean) {
    this.logEvent('wishlist', isWishlisted ? 'wishlist_add' : 'wishlist_remove', `${cardName} (${setCode})`, 1, {
      cardName,
      setCode,
      isWishlisted,
    });
  }

  public trackSearch(query: string) {
    if (!query.trim()) return;
    this.logEvent('search', 'search_query', query.trim());
  }

  public trackFilter(type: 'ink' | 'set' | 'rarity' | 'cost' | 'type', value: string) {
    this.logEvent('filter', `filter_${type}`, value);
  }

  public trackBackup(action: 'export' | 'restore' | 'clear') {
    this.logEvent('backup', `backup_${action}`);
  }

  // --- Local Telemetry Store ---

  private getStoredSummary(): AnalyticsSummary {
    if (typeof window === 'undefined') {
      return {
        totalEvents: 0,
        sessionStartTime: Date.now(),
        searchQueries: {},
        cardsAdded: {},
        wishlistCards: {},
        inkFilterUsage: {},
        setFilterUsage: {},
        eventsLog: [],
      };
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        return {
          totalEvents: 0,
          sessionStartTime: Date.now(),
          searchQueries: {},
          cardsAdded: {},
          wishlistCards: {},
          inkFilterUsage: {},
          setFilterUsage: {},
          eventsLog: [],
        };
      }
      return JSON.parse(raw);
    } catch {
      return {
        totalEvents: 0,
        sessionStartTime: Date.now(),
        searchQueries: {},
        cardsAdded: {},
        wishlistCards: {},
        inkFilterUsage: {},
        setFilterUsage: {},
        eventsLog: [],
      };
    }
  }

  private saveLocalTelemetry(event: TelemetryEvent) {
    try {
      const summary = this.getStoredSummary();
      summary.totalEvents = (summary.totalEvents || 0) + 1;

      // Aggregations
      if (event.category === 'search' && event.label) {
        const q = event.label.toLowerCase();
        summary.searchQueries[q] = (summary.searchQueries[q] || 0) + 1;
      } else if (event.category === 'card' && event.action === 'card_added' && event.metadata) {
        const { cardName, setCode } = event.metadata as { cardName: string; setCode: string };
        const key = `${cardName}_${setCode}`;
        if (!summary.cardsAdded[key]) {
          summary.cardsAdded[key] = { name: cardName, setCode, count: 0 };
        }
        summary.cardsAdded[key].count += 1;
      } else if (event.category === 'wishlist' && event.action === 'wishlist_add' && event.metadata) {
        const { cardName, setCode } = event.metadata as { cardName: string; setCode: string };
        const key = `${cardName}_${setCode}`;
        if (!summary.wishlistCards[key]) {
          summary.wishlistCards[key] = { name: cardName, setCode, count: 0 };
        }
        summary.wishlistCards[key].count += 1;
      } else if (event.category === 'filter') {
        if (event.action === 'filter_ink' && event.label) {
          summary.inkFilterUsage[event.label] = (summary.inkFilterUsage[event.label] || 0) + 1;
        } else if (event.action === 'filter_set' && event.label) {
          summary.setFilterUsage[event.label] = (summary.setFilterUsage[event.label] || 0) + 1;
        }
      }

      // Log buffer
      summary.eventsLog = [event, ...(summary.eventsLog || [])].slice(0, MAX_LOG_EVENTS);

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(summary));
    } catch {
      // ignore storage errors
    }
  }

  public getSummary(): AnalyticsSummary {
    return this.getStoredSummary();
  }

  public clearTelemetry() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const analytics = new AnalyticsService();
