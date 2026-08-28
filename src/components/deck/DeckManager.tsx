import { useState, useMemo, useEffect } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { useCollectionStore } from '../../store/collectionStore';
import { useAuthStore } from '../../store/authStore';
import { DeckHeader } from './DeckHeader';
import { DeckEditor } from './DeckEditor';
import { MissingCardsModal } from './MissingCardsModal';
import { DeckImportExportModal } from './DeckImportExportModal';
import { DeckCoverPickerModal } from './DeckCoverPickerModal';
import { calculateMissingCards, calculateDeckStats } from '../../utils/deckCalculator';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { ALL_CARDS } from '../../data/catalogue';
import { LorcanaInkIcon, LorcanaInkwellIcon } from '../icons/LorcanaIcons';
import type { LorcanaCard, Ink } from '../../types/card';

function InkPill({ ink, className = 'w-3.5 h-3.5' }: { ink: Ink | string; className?: string }) {
  return <LorcanaInkIcon ink={ink} className={className} />;
}

interface Props {
  onSwitchToCollection?: () => void;
}

export function DeckManager({ onSwitchToCollection }: Props) {
  const decks = useDeckStore((s) => s.decks);
  const createDeck = useDeckStore((s) => s.createDeck);
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const duplicateDeck = useDeckStore((s) => s.duplicateDeck);
  const setDeckCover = useDeckStore((s) => s.setDeckCover);
  const loadUserDecksFromCloud = useDeckStore((s) => s.loadUserDecksFromCloud);

  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const profile = profiles[activeProfileId];
  const userCollectionCards = profile?.cards || {};

  const user = useAuthStore((s) => s.user);

  // Sync / load cloud decks on mount if logged in
  useEffect(() => {
    if (user?.uid) {
      loadUserDecksFromCloud(user.uid);
    }
  }, [user?.uid, loadUserDecksFromCloud]);

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [selectedMissingDeckId, setSelectedMissingDeckId] = useState<string | null>(null);
  const [selectedCoverDeckId, setSelectedCoverDeckId] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Card lookup map
  const cardDataMap = useMemo(() => {
    const map = new Map<string, LorcanaCard>();
    ALL_CARDS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  const deckList = useMemo(() => {
    return Object.values(decks).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [decks]);

  const handleCreateNewDeck = () => {
    const name = newDeckName.trim() || `Deck #${deckList.length + 1}`;
    const id = createDeck(name, newDeckDesc.trim());
    setNewDeckName('');
    setNewDeckDesc('');
    setShowNewDeckModal(false);
    setEditingDeckId(id);
  };

  const editingDeck = editingDeckId ? decks[editingDeckId] : null;
  const missingDeck = selectedMissingDeckId ? decks[selectedMissingDeckId] : null;
  const coverDeck = selectedCoverDeckId ? decks[selectedCoverDeckId] : null;

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white transition-colors duration-200">
      {/* Deck Header */}
      <DeckHeader
        isEditing={!!editingDeck}
        deckName={editingDeck?.name}
        onBackToDecks={() => setEditingDeckId(null)}
        onOpenImportExport={() => setShowImportExport(true)}
        onSwitchToCollection={onSwitchToCollection}
      />

      {/* Main Content: If editing, show Editor; otherwise show Deck List */}
      {editingDeck ? (
        <DeckEditor
          deck={editingDeck}
          onBackToDecks={() => setEditingDeckId(null)}
        />
      ) : (
        <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-[#171a2e] via-[#1a213d] to-[#251f38] border border-[#c8b07b]/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* Background glowing orb */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8b07b]/15 border border-[#c8b07b]/30 text-[#dfc792] text-xs font-black uppercase tracking-wider">
                <span>🃏</span>
                <span>Disney Lorcana Deck Manager</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                คลังเด็คการ์ดของคุณ ({deckList.length} เด็ค)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                สร้าง จัดการ และตรวจสอบความพร้อมของการ์ดในเด็คเทียบกับสมุดสะสมของคุณได้ทันที
              </p>
            </div>

            {/* Actions: Create & Import */}
            <div className="flex items-center gap-3 w-full sm:w-auto z-10">
              <button
                type="button"
                onClick={() => setShowImportExport(true)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-[#1b2038] hover:bg-[#252c4d] text-slate-200 border border-[#c8b07b]/30 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <span>📥</span>
                <span>นำเข้าเด็ค</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewDeckModal(true)}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <span>➕</span>
                <span>สร้างเด็คใหม่</span>
              </button>
            </div>
          </div>

          {/* Deck Cards Grid */}
          {deckList.length === 0 ? (
            <div className="text-center py-20 bg-[#131627]/60 rounded-3xl border border-slate-800 space-y-3">
              <span className="text-5xl block">🃏</span>
              <h3 className="text-lg font-black text-slate-200">ยังไม่มีเด็คในคลังของคุณ</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                เริ่มต้นสร้างเด็คใหม่หรือนำเข้าเด็คจากการแข่งขัน / Dreamborn เพื่อเริ่มจัดเด็คและตรวจสอบการ์ดที่ขาดได้ทันที
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDeckModal(true)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  ➕ สร้างเด็คแรกของคุณ
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {deckList.map((deck) => {
                const totalCards = Object.values(deck.cards).reduce((acc, c) => acc + c.count, 0);
                const stats = calculateDeckStats(deck, cardDataMap);
                const missingReport = calculateMissingCards(deck, cardDataMap, userCollectionCards);
                const coverCard = deck.coverCardId ? cardDataMap.get(deck.coverCardId) : null;
                const coverImg = coverCard
                  ? resolveCardImageUrl(coverCard.setCode, coverCard.collectorNumber, false)
                  : null;

                return (
                  <div
                    key={deck.id}
                    className="bg-[#131627]/90 border border-slate-800 hover:border-[#c8b07b]/60 rounded-3xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:shadow-amber-500/10"
                  >
                    <div>
                      {/* Top Row: Cover Thumbnail + Info */}
                      <div className="flex items-start gap-4">
                        <div
                          onClick={() => setSelectedCoverDeckId(deck.id)}
                          className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-950 border border-[#c8b07b]/30 shadow-md cursor-pointer shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center relative group/cover"
                          title="คลิกเพื่อเปลี่ยนรูปหน้าปกเด็ค"
                        >
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={deck.name}
                              onError={(e) =>
                                coverCard &&
                                handleCardImageError(e, coverCard.setCode, coverCard.collectorNumber)
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">🃏</span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-[#dfc792] font-black text-center p-1">
                            เปลี่ยนปก
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h3
                            onClick={() => setEditingDeckId(deck.id)}
                            className="text-base sm:text-lg font-black text-slate-100 group-hover:text-[#dfc792] transition-colors truncate cursor-pointer"
                          >
                            {deck.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {deck.description || 'ไม่มีคำอธิบาย'}
                          </p>

                          {/* Ink Colors Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {stats.activeInks.map((ink) => (
                              <div
                                key={ink}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-200"
                              >
                                <InkPill ink={ink} />
                                <span>{stats.inkCounts[ink]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Middle Stats: Card counts & Inkable ratio */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">จำนวนการ์ด</span>
                          <span
                            className={`text-xs sm:text-sm font-black ${
                              totalCards === 60 ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {totalCards} / 60
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center gap-0.5">
                            <LorcanaInkwellIcon inkable={true} className="w-2.5 h-2.5 text-amber-400" />
                            <span>Inkable</span>
                          </span>
                          <span className="text-xs sm:text-sm font-black text-[#dfc792]">
                            {stats.inkablePercentage}%
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">ความพร้อม</span>
                          <span
                            className={`text-xs sm:text-sm font-black ${
                              missingReport.completionPercentage === 100
                                ? 'text-emerald-400'
                                : 'text-amber-300'
                            }`}
                          >
                            {missingReport.completionPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Missing Cards Alert Bar */}
                      <div
                        onClick={() => setSelectedMissingDeckId(deck.id)}
                        className="mt-3 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-[#c8b07b]/40 transition-all flex items-center justify-between text-xs cursor-pointer group/miss"
                      >
                        <div className="flex items-center gap-2">
                          <span>{missingReport.totalCardsMissing === 0 ? '🎉' : '📋'}</span>
                          <span className="font-semibold text-slate-300 group-hover/miss:text-slate-100">
                            {missingReport.totalCardsMissing === 0
                              ? 'มีการ์ดครบทั้งหมดแล้ว (100%)'
                              : `ยังขาดการ์ดอีก ${missingReport.totalCardsMissing} ใบ`}
                          </span>
                        </div>
                        <span className="text-amber-400 text-xs font-bold group-hover/miss:translate-x-0.5 transition-transform">
                          ดูรายการ ›
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => duplicateDeck(deck.id)}
                          title="ทำสำเนาเด็คนี้"
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-bold active:scale-95 transition-all"
                        >
                          📑
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`คุณต้องการลบเด็ค "${deck.name}" ใช่หรือไม่?`)) {
                              deleteDeck(deck.id);
                            }
                          }}
                          title="ลบเด็คนี้"
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-700/40 text-xs font-bold active:scale-95 transition-all"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Edit Deck Button */}
                      <button
                        type="button"
                        onClick={() => setEditingDeckId(deck.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <span>✏️</span>
                        <span>แก้ไขเด็ค (Edit)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl p-6 space-y-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#c8b07b]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">➕</span>
                <h3 className="text-lg font-black text-[#dfc792]">สร้างเด็คใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDeckModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">ชื่อเด็ค (Deck Name):</label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="เช่น Ruby & Amethyst Control..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-sm text-slate-100 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">คำอธิบาย (Description):</label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="เช่น เด็คแข่งงาน Championship..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-sm text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewDeckModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateNewDeck}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95"
              >
                สร้างเด็ค
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Cards Modal */}
      {missingDeck && (
        <MissingCardsModal
          deck={missingDeck}
          report={calculateMissingCards(missingDeck, cardDataMap, userCollectionCards)}
          activeProfileName={profile?.name ?? 'Main Binder'}
          onClose={() => setSelectedMissingDeckId(null)}
        />
      )}

      {/* Cover Picker Modal */}
      {coverDeck && (
        <DeckCoverPickerModal
          deck={coverDeck}
          onSelectCover={(cardId) => setDeckCover(coverDeck.id, cardId)}
          onClose={() => setSelectedCoverDeckId(null)}
        />
      )}

      {/* Import / Export Modal */}
      {showImportExport && (
        <DeckImportExportModal
          onClose={() => setShowImportExport(false)}
          onDeckImported={(newId) => {
            setEditingDeckId(newId);
            setShowImportExport(false);
          }}
        />
      )}
    </div>
  );
}
