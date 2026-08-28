import { useState, useMemo, useEffect } from 'react';
import type { Deck } from '../../types/deck';
import type { LorcanaCard } from '../../types/card';
import { cardDisplayName } from '../../types/card';
import { ALL_CARDS } from '../../data/catalogue';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { createCardMatcher } from '../../utils/searchHelpers';
import { LorcanaInkIcon } from '../icons/LorcanaIcons';

function InkPill({ ink, className = 'w-3.5 h-3.5' }: { ink: string; className?: string }) {
  return <LorcanaInkIcon ink={ink} className={className} />;
}

interface Props {
  deck: Deck;
  onSelectCover: (cardId: string) => void;
  onClose: () => void;
}

export function DeckCoverPickerModal({ deck, onSelectCover, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'deck' | 'all'>('deck');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Card lookup map
  const cardDataMap = useMemo(() => {
    const map = new Map<string, LorcanaCard>();
    ALL_CARDS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Cards currently in this deck
  const deckCardsList = useMemo(() => {
    const list: LorcanaCard[] = [];
    for (const cardId of Object.keys(deck.cards)) {
      const c = cardDataMap.get(cardId);
      if (c) list.push(c);
    }
    return list;
  }, [deck.cards, cardDataMap]);

  const cardMatcher = useMemo(() => createCardMatcher(search), [search]);

  const displayList = useMemo(() => {
    const source = activeTab === 'deck' ? deckCardsList : ALL_CARDS;
    if (!search.trim()) return source;
    return source.filter((c) => cardMatcher(c));
  }, [activeTab, deckCardsList, search, cardMatcher]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#c8b07b]/20 flex items-center justify-between bg-[#181d33]/80">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#dfc792]">เลือกรูปหน้าปกเด็ค</h3>
              <p className="text-xs text-slate-400">เด็ค: {deck.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-[#161a2e] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('deck')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'deck'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              การ์ดในเด็ค ({deckCardsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              การ์ดทั้งหมดในแคตตาล็อก
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อการ์ด..."
              className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">🔍</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Card Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[300px]">
          {displayList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <span className="text-3xl block">🔍</span>
              <span>ไม่พบการ์ดที่ตรงกับคำค้นหา</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
              {displayList.slice(0, 100).map((card) => {
                const isCurrent = deck.coverCardId === card.id;
                const thumbUrl = resolveCardImageUrl(card.setCode, card.collectorNumber, false);
                const fullName = cardDisplayName(card);

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      onSelectCover(card.id);
                      onClose();
                    }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[5/7] bg-slate-950 flex flex-col justify-between ${
                      isCurrent
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-105'
                        : 'border-slate-800 hover:border-[#c8b07b] hover:scale-105 shadow-md'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={fullName}
                      onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                      loading="lazy"
                    />

                    {/* Ink Badge */}
                    <div className="absolute top-1 left-1 flex gap-0.5 pointer-events-none">
                      {card.inks?.map((ink) => (
                        <InkPill key={ink} ink={ink} />
                      ))}
                    </div>

                    {isCurrent && (
                      <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-lg">
                          ปกปัจจุบัน
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
