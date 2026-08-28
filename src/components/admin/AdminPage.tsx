import { useEffect, useState } from 'react';
import { analytics, type AnalyticsSummary } from '../../utils/analytics';
import { AdminAuthGate } from './AdminAuthGate';
import { AdminPriceManager } from './AdminPriceManager';
import { INK_STYLES } from '../../constants/lorcana';
import { LorcanaInkIcon } from '../icons/LorcanaIcons';
import { useAuthStore } from '../../store/authStore';

type AdminTab = 'overview' | 'pricing' | 'cards' | 'trends' | 'events' | 'ga4';

export function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [summary, setSummary] = useState<AnalyticsSummary>(() => analytics.getSummary());

  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || null;

  const refresh = () => {
    setSummary(analytics.getSummary());
  };

  const returnToTracker = () => {
    // Clear admin query/hash and return to main app
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    if (url.hash === '#/admin') url.hash = '';
    window.location.href = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') returnToTracker();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derived metrics
  const topCardsAdded = Object.values(summary.cardsAdded)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topWishlist = Object.values(summary.wishlistCards)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSearches = Object.entries(summary.searchQueries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  const totalCardsAddedCount = Object.values(summary.cardsAdded).reduce((acc, c) => acc + c.count, 0);
  const totalWishlistCount = Object.values(summary.wishlistCards).reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="min-h-screen bg-[#0d0f1b] text-slate-200 flex flex-col">
      {/* Top Admin Navigation Header */}
      <header
        className="sticky top-0 z-30 border-b border-[#c8b07b]/20 bg-[#131627]/95 backdrop-blur-xl shadow-lg"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c8b07b] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#dfc792] to-[#c8b07b] text-[#131627] flex items-center justify-center font-extrabold text-xl shadow-md">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100">Disney Lorcana Admin Console</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/40">
                  OAuth Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Traffic & Collector Telemetry Insights</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {gaId ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-xs text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                GA4 Active: {gaId}
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-xs text-amber-300 font-semibold">
                Local Telemetry Mode
              </span>
            )}

            {user && isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Admin Avatar" className="w-6 h-6 rounded-full border border-[#c8b07b]/50 object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#131627] text-[10px] font-bold text-[#dfc792] flex items-center justify-center border border-[#c8b07b]/30">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">{user.email}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setIsAuthenticated(false);
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold ml-1"
                  title="Sign out of Admin"
                >
                  Log out
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={returnToTracker}
              className="px-3.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs font-bold text-slate-300 hover:text-[#dfc792] transition-all flex items-center gap-1.5"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-md bg-[#131627] border border-[#c8b07b]/40 rounded-3xl p-6 shadow-2xl">
              <AdminAuthGate
                onAuthenticated={() => setIsAuthenticated(true)}
                onClose={returnToTracker}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#131627] border border-[#c8b07b]/20 overflow-x-auto text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                📈 Analytics Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'pricing'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                💎 Card Pricing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'cards'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                🎴 Popular Cards & Wishlists
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('trends')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'trends'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                ✨ Inks & Sets Distribution
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'events'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                📜 Realtime Events ({summary.eventsLog?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ga4')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'ga4'
                    ? 'bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
                }`}
              >
                ⚙️ GA4 Settings
              </button>

              <div className="ml-auto flex items-center gap-2 pl-2">
                <button
                  type="button"
                  onClick={refresh}
                  className="px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs font-bold text-slate-200 hover:text-[#dfc792] transition-colors"
                >
                  🔄 Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all telemetry records?')) {
                      analytics.clearTelemetry();
                      refresh();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors"
                >
                  🗑️ Clear Data
                </button>
              </div>
            </div>

            {/* Content Body */}
            {activeTab === 'pricing' && <AdminPriceManager />}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-[#131627] border border-[#c8b07b]/25 shadow-lg space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Actions</p>
                    <p className="text-3xl font-black text-[#dfc792]">{summary.totalEvents.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">Telemetry logs recorded</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#131627] border border-[#c8b07b]/25 shadow-lg space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cards Collected</p>
                    <p className="text-3xl font-black text-emerald-400">{totalCardsAddedCount.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">Total binder additions</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#131627] border border-[#c8b07b]/25 shadow-lg space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wishlist Starred</p>
                    <p className="text-3xl font-black text-amber-300">{totalWishlistCount.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">Wanted card tags</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-[#131627] border border-[#c8b07b]/25 shadow-lg space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Terms</p>
                    <p className="text-3xl font-black text-sky-400">{topSearches.length}</p>
                    <p className="text-[11px] text-slate-500">Unique searches logged</p>
                  </div>
                </div>

                {/* Search Keywords */}
                <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <span>🔍</span> Top Searched Terms
                  </h2>
                  {topSearches.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No search events recorded yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {topSearches.map(([term, count]) => (
                        <span
                          key={term}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs font-semibold text-slate-200"
                        >
                          <span className="text-[#dfc792]">"{term}"</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#131627] text-slate-400 font-mono font-bold">
                            {count} searches
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Added Cards */}
                <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <span>🎴</span> Most Collected Lorcana Cards
                  </h2>
                  {topCardsAdded.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No cards collected yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {topCardsAdded.map((card, idx) => (
                        <div
                          key={card.name + card.setCode}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/15 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#131627] border border-[#c8b07b]/30 text-[11px] font-bold text-[#dfc792] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-100 truncate">{card.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{card.setCode}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 font-bold text-xs shrink-0">
                            +{card.count} copies
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Wishlist */}
                <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <span>⭐</span> Most Wanted Wishlist Cards
                  </h2>
                  {topWishlist.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No wishlist cards yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {topWishlist.map((card, idx) => (
                        <div
                          key={card.name + card.setCode}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/15 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#131627] border border-[#c8b07b]/30 text-[11px] font-bold text-amber-400 flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-100 truncate">{card.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{card.setCode}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-300 font-bold text-xs shrink-0">
                            ★ {card.count} wants
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ink Breakdown */}
                <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <span>🎨</span> Ink Element Popularity
                  </h2>
                  <div className="space-y-3">
                    {(['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'] as const).map((ink) => {
                      const count = summary.inkFilterUsage[ink] || 0;
                      const max = Math.max(1, ...Object.values(summary.inkFilterUsage));
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={ink} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={`inline-flex items-center gap-2 ${INK_STYLES[ink].text}`}>
                              <LorcanaInkIcon ink={ink} className="w-4 h-4" />
                              {ink}
                            </span>
                            <span className="text-slate-400 font-mono">{count} clicks</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#1b2038] rounded-full overflow-hidden border border-slate-700">
                            <div
                              className={`h-full rounded-full transition-all ${INK_STYLES[ink].dot}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Set Popularity */}
                <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <span>📦</span> Set Interaction Rates
                  </h2>
                  {Object.keys(summary.setFilterUsage).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No set filters logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(summary.setFilterUsage)
                        .sort(([, a], [, b]) => b - a)
                        .map(([setCode, count]) => (
                          <div
                            key={setCode}
                            className="flex items-center justify-between p-3 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/15 text-xs"
                          >
                            <span className="font-bold text-slate-200">{setCode}</span>
                            <span className="px-2.5 py-1 rounded-lg bg-[#131627] text-slate-300 font-mono text-xs font-bold">
                              {count} views
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-200">Chronological Telemetry Stream</h2>
                  <span className="text-xs text-slate-400 font-mono">Last {summary.eventsLog?.length || 0} events</span>
                </div>

                <div className="space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto pr-2 flex-1">
                  {summary.eventsLog?.length === 0 ? (
                    <p className="text-slate-500 italic py-8 text-center">No telemetry events captured yet.</p>
                  ) : (
                    summary.eventsLog?.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/10 text-slate-300"
                      >
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#131627] text-[#dfc792] text-[10px] font-bold uppercase shrink-0">
                          {ev.category}
                        </span>
                        <span className="font-bold text-slate-100 shrink-0">{ev.action}</span>
                        <span className="text-slate-400 truncate">{ev.label || '-'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ga4' && (
              <div className="p-6 rounded-3xl bg-[#131627] border border-[#c8b07b]/20 space-y-5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                    📈
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Google Analytics 4 (GA4)</h2>
                    <p className="text-xs text-slate-400">Connect Google Analytics for global visitor insights.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/20 space-y-3 text-xs">
                  <p className="font-semibold text-slate-200">How to set up:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                    <li>Create a Web Stream in your Google Analytics property.</li>
                    <li>Copy your Measurement ID (<code className="text-amber-300">G-XXXXXXXXXX</code>).</li>
                    <li>
                      Add to your <code className="text-emerald-300">.env.local</code>:
                      <pre className="mt-1.5 p-2.5 rounded-xl bg-black/60 text-[#dfc792] font-mono text-[11px]">
                        VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
                      </pre>
                    </li>
                  </ol>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1b2038] border border-slate-700 text-xs">
                  <span className="text-slate-400 font-medium">Measurement Status:</span>
                  {gaId ? (
                    <span className="font-bold text-emerald-400">Connected ({gaId})</span>
                  ) : (
                    <span className="font-bold text-amber-400">Local Telemetry Mode (Standalone)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
