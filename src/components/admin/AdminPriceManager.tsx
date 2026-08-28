import { useState, useMemo } from 'react';
import { ALL_CARDS, ALL_SETS } from '../../data/catalogue';
import { usePricingStore } from '../../store/pricingStore';
import { RARITY_STYLES } from '../../constants/lorcana';
import { LorcanaInkIcon } from '../icons/LorcanaIcons';

export function AdminPriceManager() {
  const marketPrices = usePricingStore((s) => s.marketPrices);
  const loading = usePricingStore((s) => s.loading);
  const adminUpdateMarketPrice = usePricingStore((s) => s.adminUpdateMarketPrice);
  const adminSyncLivePrices = usePricingStore((s) => s.adminSyncLivePrices);
  const usdToThbRate = usePricingStore((s) => s.usdToThbRate);
  const setUsdToThbRate = usePricingStore((s) => s.setUsdToThbRate);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('ALL');
  const [selectedRarity, setSelectedRarity] = useState('ALL');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editRegular, setEditRegular] = useState<string>('');
  const [editFoil, setEditFoil] = useState<string>('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);

  // Filter cards
  const filteredCards = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (selectedSet !== 'ALL' && card.setCode !== selectedSet) return false;
      if (selectedRarity !== 'ALL' && card.rarity !== selectedRarity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesVersion = (card.version || '').toLowerCase().includes(q);
        const matchesId = card.id.toLowerCase().includes(q);
        const matchesNumber = String(card.collectorNumber).includes(q);
        if (!matchesName && !matchesVersion && !matchesId && !matchesNumber) return false;
      }
      return true;
    }).slice(0, 100); // Limit to top 100 for fast UI rendering
  }, [searchQuery, selectedSet, selectedRarity]);

  const handleStartEdit = (cardId: string) => {
    const p = marketPrices[cardId];
    setEditingCardId(cardId);
    setEditRegular(p?.regular !== null && p?.regular !== undefined ? String(p.regular) : '');
    setEditFoil(p?.foil !== null && p?.foil !== undefined ? String(p.foil) : '');
  };

  const handleSaveEdit = async (cardId: string) => {
    setSavingCardId(cardId);
    try {
      const reg = editRegular.trim() === '' ? null : parseFloat(editRegular);
      const foil = editFoil.trim() === '' ? null : parseFloat(editFoil);
      await adminUpdateMarketPrice(cardId, {
        regular: isNaN(Number(reg)) ? null : reg,
        foil: isNaN(Number(foil)) ? null : foil,
      });
      setEditingCardId(null);
    } catch (err) {
      alert(`Save failed: ${(err as Error).message}`);
    } finally {
      setSavingCardId(null);
    }
  };

  const handleSyncLive = async () => {
    if (!confirm('Fetch and update market prices for all sets from Lorcast?')) return;
    setSyncStatusMsg('Fetching latest prices from Lorcast API...');
    const res = await adminSyncLivePrices();
    if (res.success) {
      setSyncStatusMsg(`✅ Successfully updated ${res.count.toLocaleString()} card prices!`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } else {
      setSyncStatusMsg(`❌ Error: ${res.error || 'Failed to sync prices'}`);
    }
  };

  const totalPricedCount = useMemo(() => {
    return Object.values(marketPrices).filter((p) => p.regular !== null || p.foil !== null).length;
  }, [marketPrices]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls & Sync */}
      <div className="p-5 rounded-2xl bg-[#1b2038]/80 border border-[#c8b07b]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <span>💎</span>
            <span>Card Market Pricing Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized Lorcana market valuations (USD & THB exchange rate conversion)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131627] px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold">1 USD =</span>
            <input
              type="number"
              step="0.1"
              value={usdToThbRate}
              onChange={(e) => setUsdToThbRate(parseFloat(e.target.value) || 35.0)}
              className="w-14 bg-transparent text-amber-300 font-mono font-bold focus:outline-none text-right"
            />
            <span className="text-slate-400 font-bold">THB</span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleSyncLive}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            <span>{loading ? '⏳' : '🔄'}</span>
            <span>{loading ? 'Syncing Prices…' : 'Sync Live Prices (Lorcast)'}</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 text-xs font-semibold text-[#dfc792] flex items-center justify-between">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#131627]/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Priced Cards</div>
          <div className="text-lg font-black text-emerald-400 mt-1 font-mono">
            {totalPricedCount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {ALL_CARDS.length}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#131627]/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Sets Monitored</div>
          <div className="text-lg font-black text-[#dfc792] mt-1 font-mono">{ALL_SETS.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#131627]/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">USD / THB Rate</div>
          <div className="text-lg font-black text-amber-300 mt-1 font-mono">฿{usdToThbRate.toFixed(2)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#131627]/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Data Source</div>
          <div className="text-lg font-black text-sky-300 mt-1 font-mono">Lorcast / TCG</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search card name, number, or ID (e.g. Elsa, 1-195)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#131627] border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[#131627] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
        >
          <option value="ALL">All Sets ({ALL_SETS.length})</option>
          {ALL_SETS.map((s) => (
            <option key={s.code} value={s.code}>
              Set {s.code}: {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[#131627] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
        >
          <option value="ALL">All Rarities</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Super Rare">Super Rare</option>
          <option value="Legendary">Legendary</option>
          <option value="Enchanted">Enchanted</option>
          <option value="Promo">Promo</option>
        </select>
      </div>

      {/* Cards Price Table */}
      <div className="rounded-2xl border border-[#c8b07b]/20 bg-[#131627]/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1b2038] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Card</th>
                <th className="py-3 px-3">Set / No.</th>
                <th className="py-3 px-3">Rarity</th>
                <th className="py-3 px-3 text-right">Regular ($ USD)</th>
                <th className="py-3 px-3 text-right">Foil ($ USD)</th>
                <th className="py-3 px-3 text-right">Est. THB (Reg / Foil)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredCards.map((card) => {
                const p = marketPrices[card.id];
                const isEditing = editingCardId === card.id;
                const rarityClass = RARITY_STYLES[card.rarity] || 'text-slate-400';
                const regUSD = p?.regular ?? null;
                const foilUSD = p?.foil ?? null;
                const regTHB = regUSD !== null ? regUSD * usdToThbRate : null;
                const foilTHB = foilUSD !== null ? foilUSD * usdToThbRate : null;

                return (
                  <tr key={card.id} className="hover:bg-[#1b2038]/40 transition-colors">
                    {/* Card Identity */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          {card.inks?.map((ink) => (
                            <span
                              key={ink}
                              className="w-4 h-4 rounded-full flex items-center justify-center bg-[#1b2038] border border-[#c8b07b]/20"
                            >
                              <LorcanaInkIcon ink={ink} className="w-2.5 h-2.5" />
                            </span>
                          ))}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{card.name}</div>
                          {card.version && <div className="text-[10px] text-slate-400">{card.version}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Set Code & Number */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      <span className="text-[#dfc792] font-semibold">{card.setCode}</span> #{card.collectorNumber}
                    </td>

                    {/* Rarity */}
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rarityClass}`}>
                        {card.rarity}
                      </span>
                    </td>

                    {/* Regular Price */}
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editRegular}
                          onChange={(e) => setEditRegular(e.target.value)}
                          placeholder="0.00"
                          className="w-20 px-2 py-1 rounded bg-[#0d0f1b] border border-[#c8b07b] text-right font-mono text-xs text-slate-100"
                        />
                      ) : (
                        <span className="font-mono text-slate-200">
                          {regUSD !== null ? `$${regUSD.toFixed(2)}` : '—'}
                        </span>
                      )}
                    </td>

                    {/* Foil Price */}
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editFoil}
                          onChange={(e) => setEditFoil(e.target.value)}
                          placeholder="0.00"
                          className="w-20 px-2 py-1 rounded bg-[#0d0f1b] border border-[#c8b07b] text-right font-mono text-xs text-amber-300"
                        />
                      ) : (
                        <span className="font-mono text-amber-300 font-semibold">
                          {foilUSD !== null ? `$${foilUSD.toFixed(2)}` : '—'}
                        </span>
                      )}
                    </td>

                    {/* Est. THB */}
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">
                      <span>{regTHB !== null ? `฿${Math.round(regTHB).toLocaleString()}` : '—'}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-amber-400/90 font-semibold">
                        {foilTHB !== null ? `฿${Math.round(foilTHB).toLocaleString()}` : '—'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={savingCardId === card.id}
                            onClick={() => handleSaveEdit(card.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow active:scale-95 transition-all"
                          >
                            {savingCardId === card.id ? '...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCardId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(card.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#1b2038] hover:bg-[#252c4d] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs text-[#dfc792] transition-all"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCards.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">No cards matching filter.</div>
        )}
      </div>
    </div>
  );
}
