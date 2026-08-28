import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { useCollectionStore } from '../../store/collectionStore';
import { calculateDeckStats, calculateMissingCards } from '../../utils/deckCalculator';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { MissingCardsModal } from './MissingCardsModal';
import { CardCollectionModal } from '../collection/CardCollectionModal';
import { DeckCoverPickerModal } from './DeckCoverPickerModal';
import { createCardMatcher } from '../../utils/searchHelpers';
import { ALL_CARDS, SETS_NEWEST_FIRST } from '../../data/catalogue';
import { cardDisplayName, INKS, RARITIES, rarityLabel } from '../../types/card';
import type { Deck } from '../../types/deck';
import type { LorcanaCard, Ink, CardType } from '../../types/card';
import {
  LorcanaInkIcon,
  LorcanaInkwellIcon,
  LorcanaLoreIcon,
} from '../icons/LorcanaIcons';

export function InkPill({ ink, className = 'w-3.5 h-3.5' }: { ink: Ink | string; className?: string }) {
  return <LorcanaInkIcon ink={ink} className={className} />;
}

interface Props {
  deck: Deck;
  onBackToDecks?: () => void;
}

const ITEMS_PER_PAGE = 36;

export function DeckEditor({ deck }: Props) {
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);
  const removeCardFromDeck = useDeckStore((s) => s.removeCardFromDeck);
  const clearDeckCards = useDeckStore((s) => s.clearDeckCards);
  const setDeckCover = useDeckStore((s) => s.setDeckCover);

  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfile = profiles[activeProfileId];
  const userCollectionCards = activeProfile?.cards || {};

  // Card lookup map
  const cardDataMap = useMemo(() => {
    const map = new Map<string, LorcanaCard>();
    ALL_CARDS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Live Deck Stats & Missing Report
  const stats = useMemo(() => calculateDeckStats(deck, cardDataMap), [deck, cardDataMap]);
  const missingReport = useMemo(
    () => calculateMissingCards(deck, cardDataMap, userCollectionCards),
    [deck, cardDataMap, userCollectionCards]
  );

  // States
  const [deckName, setDeckName] = useState(deck.name);
  const [deckDesc, setDeckDesc] = useState(deck.description || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [previewCard, setPreviewCard] = useState<LorcanaCard | null>(null);
  const [mobileTab, setMobileTab] = useState<'deck' | 'catalog'>('deck');
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // Catalog Filters
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState('ALL');
  const [selectedInk, setSelectedInk] = useState<string>('ALL');
  const [selectedCost, setSelectedCost] = useState<string>('ALL');
  const [selectedInkwell, setSelectedInkwell] = useState<'ALL' | 'inkable' | 'uninkable'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [catalogLimit, setCatalogLimit] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Keep internal name in sync when deck changes
  useEffect(() => {
    setDeckName(deck.name);
    setDeckDesc(deck.description || '');
  }, [deck.name, deck.description]);

  // Scroll listener for back to top
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setShowBackToTop(scrollPos > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSaveDeckDetails = () => {
    if (deckName.trim()) {
      renameDeck(deck.id, deckName.trim(), deckDesc.trim());
    }
    setIsEditingName(false);
  };

  const deferredSearch = useDeferredValue(search);
  const effectiveSearch = search.trim() === '' ? '' : deferredSearch;
  const cardMatcher = useMemo(() => createCardMatcher(effectiveSearch), [effectiveSearch]);

  // Filter Catalog Cards
  const filteredCatalog = useMemo(() => {
    const hasSearch = effectiveSearch.trim().length > 0;

    return ALL_CARDS.filter((c) => {
      // Search
      if (hasSearch && !cardMatcher(c)) return false;

      // Set
      if (selectedSet !== 'ALL' && c.setCode !== selectedSet) return false;

      // Ink
      if (selectedInk !== 'ALL' && !c.inks.includes(selectedInk as Ink)) return false;

      // Cost
      if (selectedCost !== 'ALL') {
        if (selectedCost === '7+') {
          if ((c.cost ?? 0) < 7) return false;
        } else if (c.cost !== Number(selectedCost)) {
          return false;
        }
      }

      // Inkwell
      if (selectedInkwell === 'inkable' && !c.inkwell) return false;
      if (selectedInkwell === 'uninkable' && c.inkwell) return false;

      // Type
      if (selectedType !== 'ALL') {
        if (selectedType === 'Song') {
          const isSong = c.text && (c.text.toLowerCase().includes('a character with cost') || c.text.toLowerCase().includes('sing together') || c.types.includes('Song'));
          if (!isSong) return false;
        } else if (!c.types.includes(selectedType as CardType)) {
          return false;
        }
      }

      // Rarity
      if (selectedRarity !== 'ALL' && c.rarity !== selectedRarity) return false;

      return true;
    });
  }, [
    effectiveSearch,
    cardMatcher,
    selectedSet,
    selectedInk,
    selectedCost,
    selectedInkwell,
    selectedType,
    selectedRarity,
  ]);

  // Cards currently in the deck grouped by Type
  const deckGroupedCards = useMemo(() => {
    const groups: {
      title: string;
      icon: string;
      cards: { card: LorcanaCard; count: number }[];
    }[] = [
      { title: 'Characters (ตัวละคร)', icon: '👤', cards: [] },
      { title: 'Actions & Songs (แอ็กชัน/เพลง)', icon: '⚡', cards: [] },
      { title: 'Items (ไอเทม)', icon: '🔮', cards: [] },
      { title: 'Locations (สถานที่)', icon: '🏰', cards: [] },
    ];

    for (const [cardId, entry] of Object.entries(deck.cards)) {
      if (entry.count <= 0) continue;
      const card = cardDataMap.get(cardId);
      if (!card) continue;

      const item = { card, count: entry.count };
      if (card.types.includes('Character')) {
        groups[0].cards.push(item);
      } else if (card.types.includes('Location')) {
        groups[3].cards.push(item);
      } else if (card.types.includes('Item')) {
        groups[2].cards.push(item);
      } else {
        groups[1].cards.push(item);
      }
    }

    // Sort cards inside each group by Ink, Cost, and Name
    groups.forEach((g) => {
      g.cards.sort((a, b) => {
        const inkA = a.card.inks[0] || '';
        const inkB = b.card.inks[0] || '';
        if (inkA !== inkB) return inkA.localeCompare(inkB);
        if ((a.card.cost ?? 0) !== (b.card.cost ?? 0)) return (a.card.cost ?? 0) - (b.card.cost ?? 0);
        return cardDisplayName(a.card).localeCompare(cardDisplayName(b.card));
      });
    });

    return groups;
  }, [deck.cards, cardDataMap]);

  const coverCard = deck.coverCardId ? cardDataMap.get(deck.coverCardId) : null;
  const coverUrl = coverCard
    ? resolveCardImageUrl(coverCard.setCode, coverCard.collectorNumber, false)
    : null;

  return (
    <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full p-2 sm:p-4 lg:p-6 space-y-4">
      {/* Top Banner: Deck Information & Quick Stats */}
      <div className="bg-[#131627]/95 border border-[#c8b07b]/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Deck Info & Cover */}
          <div className="flex items-center gap-4 min-w-0 w-full lg:w-auto">
            {/* Cover image button */}
            <div
              onClick={() => setShowCoverModal(true)}
              className="w-16 h-22 sm:w-20 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 border border-[#c8b07b]/40 shadow-lg cursor-pointer shrink-0 hover:scale-105 transition-transform flex items-center justify-center relative group"
              title="คลิกเพื่อเปลี่ยนรูปหน้าปกเด็ค"
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Deck Cover"
                  onError={(e) => coverCard && handleCardImageError(e, coverCard.setCode, coverCard.collectorNumber)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🃏</span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-[#dfc792] font-black text-center p-1">
                เปลี่ยนปก
              </div>
            </div>

            {/* Title / Rename */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="space-y-2 max-w-md">
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-[#c8b07b] text-base font-black text-white focus:outline-none"
                    placeholder="ชื่อเด็ค..."
                    autoFocus
                  />
                  <input
                    type="text"
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                    className="w-full px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none"
                    placeholder="คำอธิบายสั้น ๆ..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDeckDetails}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md"
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[#dfc792] truncate">{deck.name}</h1>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      title="แก้ไขชื่อเด็ค"
                      className="text-slate-400 hover:text-[#dfc792] text-xs p-1"
                    >
                      ✏️
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {deck.description || 'เด็คมาตรฐานดิสนีย์ ลอร์คานา'}
                  </p>
                  {/* Ink Badges */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {stats.activeInks.map((ink) => (
                      <div
                        key={ink}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-[#c8b07b]/30 text-[11px] font-bold text-slate-200"
                      >
                        <InkPill ink={ink} />
                        <span>{stats.inkCounts[ink]} ใบ</span>
                      </div>
                    ))}
                    {stats.activeInks.length === 0 && (
                      <span className="text-[11px] text-slate-500">ยังไม่มีการ์ดในเด็ค</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics: 60 cards, Inkable Ratio, Missing Cards */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
            {/* Card Count Badge */}
            <div
              className={`px-3.5 py-2 rounded-2xl border flex flex-col items-center ${
                stats.totalCards === 60
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : stats.totalCards > 60
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">จำนวนการ์ด</span>
              <span className="text-lg font-black">{stats.totalCards} / 60</span>
            </div>

            {/* Inkable Ratio */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <LorcanaInkwellIcon inkable={true} className="w-3 h-3 text-amber-400" />
                <span>Inkable</span>
              </div>
              <span className="text-lg font-black text-[#dfc792]">
                {stats.inkableCount} <span className="text-xs text-slate-400 font-normal">({stats.inkablePercentage}%)</span>
              </span>
            </div>

            {/* Missing Cards Button */}
            <button
              type="button"
              onClick={() => setShowMissingModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#1b2038] to-[#252c4d] hover:from-[#252c4d] hover:to-[#313962] border border-[#c8b07b]/40 text-slate-100 text-xs font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 group hover:border-[#c8b07b]"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📋</span>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 font-semibold">เทียบสมุดสะสม</span>
                <span>{missingReport.totalCardsMissing === 0 ? 'ครบ 100%' : `ขาด ${missingReport.totalCardsMissing} ใบ`}</span>
              </div>
            </button>

            {/* Toggle Detailed Stats Drawer */}
            <button
              type="button"
              onClick={() => setShowStatsDrawer(!showStatsDrawer)}
              className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>📊</span>
              <span className="hidden sm:inline">สถิติละเอียด</span>
            </button>
          </div>
        </div>

        {/* Rule Violations Alert (if any) */}
        {stats.ruleViolations.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs space-y-1">
            <div className="font-black flex items-center gap-1.5 text-rose-300">
              <span>⚠️</span>
              <span>แจ้งเตือนกติกาเด็ค:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] opacity-90">
              {stats.ruleViolations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Stats Drawer */}
        {showStatsDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 animate-in fade-in duration-150 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Characters:</span>
              <span className="text-base font-black text-slate-100">{stats.characterCount} ใบ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Actions / Songs:</span>
              <span className="text-base font-black text-slate-100">
                {stats.actionCount + stats.songCount} ใบ
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Items / Locations:</span>
              <span className="text-base font-black text-slate-100">
                {stats.itemCount + stats.locationCount} ใบ
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Uninkable Cards:</span>
              <span className="text-base font-black text-rose-400">{stats.uninkableCount} ใบ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Avg Cost (ค่าร่ายเฉลี่ย):</span>
              <span className="text-base font-black text-[#dfc792]">{stats.averageCost}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Lore Potential:</span>
              <span className="text-base font-black text-amber-400 flex items-center gap-1">
                <LorcanaLoreIcon className="w-3.5 h-3.5" />
                <span>{stats.totalLore}</span>
              </span>
            </div>

            {/* Cost Curve Chart */}
            <div className="col-span-2 sm:col-span-4 md:col-span-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300">Cost Curve (กราฟค่าร่าย):</span>
              <div className="grid grid-cols-8 gap-2 items-end h-24 pt-2">
                {stats.costCurve.map((item) => {
                  const maxCount = Math.max(...stats.costCurve.map((c) => c.count), 10);
                  const heightPercent = Math.min(100, Math.round((item.count / maxCount) * 100));

                  return (
                    <div key={item.cost} className="flex flex-col items-center h-full justify-end gap-1">
                      <span className="text-[10px] font-bold text-slate-300">{item.count}</span>
                      <div className="w-full bg-slate-950 rounded-t-md h-full flex flex-col justify-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-amber-600 to-[#dfc792] rounded-t-sm transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{item.cost === 8 ? '8+' : item.cost}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher: Deck vs Catalog */}
      <div className="flex md:hidden rounded-2xl bg-slate-900 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'deck'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
              : 'text-slate-400'
          }`}
        >
          <span>🃏 การ์ดในเด็ค</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/40 text-[10px]">
            {stats.totalCards}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'catalog'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
              : 'text-slate-400'
          }`}
        >
          <span>🔍 ค้นหาการ์ดเพิ่ม</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/40 text-[10px]">
            {filteredCatalog.length}
          </span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Cards in Deck (5 cols on lg) */}
        <div
          className={`md:col-span-5 lg:col-span-5 space-y-4 ${
            mobileTab === 'catalog' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="bg-[#131627]/90 border border-[#c8b07b]/20 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🃏</span>
                <h2 className="text-sm sm:text-base font-black text-[#dfc792]">
                  รายการการ์ดในเด็ค ({stats.totalCards} ใบ)
                </h2>
              </div>

              {stats.totalCards > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างการ์ดทั้งหมดในเด็คนี้?')) {
                      clearDeckCards(deck.id);
                    }
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold hover:underline"
                >
                  ล้างเด็ค
                </button>
              )}
            </div>

            {/* Empty state */}
            {stats.totalCards === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs space-y-3">
                <span className="text-4xl block">✨</span>
                <p>เด็คนี้ยังไม่มีการ์ด</p>
                <p className="text-[11px] text-slate-400">
                  เลือกการ์ดจากแคตตาล็อกฝั่งขวา เพื่อกด <strong className="text-[#dfc792]">+1</strong> หรือ <strong className="text-[#dfc792]">+4</strong> เพิ่มลงในเด็คได้ทันที
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {deckGroupedCards.map((group) => {
                  if (group.cards.length === 0) return null;
                  const groupCount = group.cards.reduce((acc, c) => acc + c.count, 0);

                  return (
                    <div key={group.title} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-300 px-1">
                        <span className="flex items-center gap-1.5">
                          <span>{group.icon}</span>
                          <span>{group.title}</span>
                        </span>
                        <span className="text-slate-400 font-normal">({groupCount} ใบ)</span>
                      </div>

                      <div className="space-y-1.5">
                        {group.cards.map(({ card, count }) => {
                          const thumb = resolveCardImageUrl(card.setCode, card.collectorNumber, false);
                          const fullName = cardDisplayName(card);

                          return (
                            <div
                              key={card.id}
                              className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#c8b07b]/40 flex items-center justify-between gap-2 transition-all group"
                            >
                              <div
                                onClick={() => setPreviewCard(card)}
                                className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                              >
                                <img
                                  src={thumb}
                                  alt={fullName}
                                  onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                                  className="w-8 h-11 object-cover rounded-lg border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    {card.cost !== null && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-bold text-amber-300 border border-slate-700">
                                        {card.cost}
                                      </span>
                                    )}
                                    {card.inks?.map((ink) => (
                                      <InkPill key={ink} ink={ink} />
                                    ))}
                                    {card.inkwell && (
                                      <LorcanaInkwellIcon inkable={true} className="w-3 h-3 text-amber-400" />
                                    )}
                                  </div>
                                  <h4 className="text-xs font-black text-slate-100 truncate group-hover:text-[#dfc792] transition-colors">
                                    {fullName}
                                  </h4>
                                </div>
                              </div>

                              {/* Stepper Controls */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => removeCardFromDeck(deck.id, card.id)}
                                  className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center justify-center active:scale-90 transition-transform"
                                  title="ลดจำนวน"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-black text-[#dfc792]">
                                  {count}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addCardToDeck(deck.id, card.id, 1)}
                                  disabled={count >= 4}
                                  className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center active:scale-90 transition-transform ${
                                    count >= 4
                                      ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
                                      : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40'
                                  }`}
                                  title={count >= 4 ? 'ครบ 4 ใบแล้ว' : 'เพิ่ม 1 ใบ'}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Catalog Browser & Filters (7 cols on lg) */}
        <div
          className={`md:col-span-7 lg:col-span-7 space-y-4 ${
            mobileTab === 'deck' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="bg-[#131627]/90 border border-[#c8b07b]/20 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            {/* Search & Filter Header */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Box */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อการ์ด, ตัวละคร, ข้อความสกิล..."
                    className="w-full px-3.5 py-2 pl-9 rounded-2xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Set Selector */}
                <div className="w-full sm:w-56">
                  <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">📦 ทุกชุด (All Sets)</option>
                    {SETS_NEWEST_FIRST.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ink Pills Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedInk('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedInk === 'ALL'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Inks
                </button>
                {INKS.map((ink) => (
                  <button
                    key={ink}
                    type="button"
                    onClick={() => setSelectedInk(ink === selectedInk ? 'ALL' : ink)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedInk === ink
                        ? 'bg-[#1b2038] border-2 border-amber-400 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <InkPill ink={ink} />
                    <span>{ink}</span>
                  </button>
                ))}
              </div>

              {/* Secondary Filters: Cost, Type, Inkwell, Rarity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Cost */}
                <select
                  value={selectedCost}
                  onChange={(e) => setSelectedCost(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#c8b07b] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Cost: ทั้งหมด</option>
                  <option value="1">Cost 1</option>
                  <option value="2">Cost 2</option>
                  <option value="3">Cost 3</option>
                  <option value="4">Cost 4</option>
                  <option value="5">Cost 5</option>
                  <option value="6">Cost 6</option>
                  <option value="7+">Cost 7+</option>
                </select>

                {/* Type */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#c8b07b] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Type: ทั้งหมด</option>
                  <option value="Character">Character</option>
                  <option value="Action">Action</option>
                  <option value="Song">Song (เพลง)</option>
                  <option value="Item">Item</option>
                  <option value="Location">Location</option>
                </select>

                {/* Inkwell */}
                <select
                  value={selectedInkwell}
                  onChange={(e) => setSelectedInkwell(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#c8b07b] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Inkwell: ทั้งหมด</option>
                  <option value="inkable">Inkable (ใส่หมึกได้)</option>
                  <option value="uninkable">Uninkable (ใส่หมึกไม่ได้)</option>
                </select>

                {/* Rarity */}
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#c8b07b] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Rarity: ทั้งหมด</option>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {rarityLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count & Clear filters */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-t border-slate-800 pt-2">
              <span>
                พบการ์ด <strong className="text-[#dfc792]">{filteredCatalog.length}</strong> ใบ
              </span>
              {(search || selectedSet !== 'ALL' || selectedInk !== 'ALL' || selectedCost !== 'ALL' || selectedType !== 'ALL' || selectedInkwell !== 'ALL' || selectedRarity !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedSet('ALL');
                    setSelectedInk('ALL');
                    setSelectedCost('ALL');
                    setSelectedType('ALL');
                    setSelectedInkwell('ALL');
                    setSelectedRarity('ALL');
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            {/* Cards Grid */}
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <span className="text-3xl block">🔍</span>
                <span>ไม่พบการ์ดตามเงื่อนไขที่เลือก</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredCatalog.slice(0, catalogLimit).map((card) => {
                  const currentInDeck = deck.cards[card.id]?.count || 0;
                  const thumb = resolveCardImageUrl(card.setCode, card.collectorNumber, false);
                  const fullName = cardDisplayName(card);

                  return (
                    <div
                      key={card.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-[#c8b07b]/60 rounded-2xl p-2.5 shadow-md flex flex-col justify-between group transition-all"
                    >
                      {/* Thumbnail & Click for Preview */}
                      <div
                        onClick={() => setPreviewCard(card)}
                        className="relative rounded-xl overflow-hidden aspect-[5/7] bg-slate-950 cursor-pointer mb-2"
                      >
                        <img
                          src={thumb}
                          alt={fullName}
                          onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-1 left-1 flex gap-0.5 pointer-events-none">
                          {card.inks?.map((ink) => (
                            <InkPill key={ink} ink={ink} />
                          ))}
                        </div>

                        {card.cost !== null && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded-md bg-slate-950/80 border border-slate-700 text-amber-300 text-[10px] font-black pointer-events-none">
                            {card.cost}
                          </div>
                        )}

                        {/* In deck badge */}
                        {currentInDeck > 0 && (
                          <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-lg">
                            ในเด็ค: {currentInDeck}
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="space-y-1 mb-2">
                        <h4
                          onClick={() => setPreviewCard(card)}
                          className="text-xs font-black text-slate-200 group-hover:text-[#dfc792] truncate cursor-pointer transition-colors"
                        >
                          {fullName}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{card.types.join(' • ')}</span>
                          {card.lore !== null && card.lore > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                              <LorcanaLoreIcon className="w-2.5 h-2.5" />
                              <span>{card.lore}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => addCardToDeck(deck.id, card.id, 1)}
                          disabled={currentInDeck >= 4}
                          className={`py-1 rounded-xl text-xs font-black transition-all ${
                            currentInDeck >= 4
                              ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
                              : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 active:scale-95'
                          }`}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => addCardToDeck(deck.id, card.id, 4 - currentInDeck)}
                          disabled={currentInDeck >= 4}
                          className={`py-1 rounded-xl text-xs font-black transition-all ${
                            currentInDeck >= 4
                              ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-sm'
                          }`}
                        >
                          +4 Max
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {catalogLimit < filteredCatalog.length && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setCatalogLimit((prev) => prev + ITEMS_PER_PAGE)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs border border-slate-700 active:scale-95 transition-all shadow-md"
                >
                  โหลดการ์ดเพิ่มเติม ({filteredCatalog.length - catalogLimit} ใบที่เหลือ)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Back to Top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-2xl active:scale-90 transition-transform"
          title="ขึ้นบนสุด"
        >
          ▲
        </button>
      )}

      {/* Missing Cards Modal */}
      {showMissingModal && (
        <MissingCardsModal
          deck={deck}
          report={missingReport}
          activeProfileName={activeProfile?.name ?? 'Main Binder'}
          onClose={() => setShowMissingModal(false)}
          onSelectCardPreview={(cardId) => {
            const c = cardDataMap.get(cardId);
            if (c) setPreviewCard(c);
          }}
        />
      )}

      {/* Cover Picker Modal */}
      {showCoverModal && (
        <DeckCoverPickerModal
          deck={deck}
          onSelectCover={(cardId: string) => setDeckCover(deck.id, cardId)}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {/* Card Detail / Collection Modal */}
      {previewCard && (
        <CardCollectionModal
          card={previewCard}
          onClose={() => setPreviewCard(null)}
        />
      )}
    </div>
  );
}
