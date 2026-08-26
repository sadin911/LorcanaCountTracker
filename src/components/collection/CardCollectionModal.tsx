import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CONDITIONS, FINISH_META, INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { DEFAULT_COLLECTION_FILTERS, useCollectionStore } from '../../store/collectionStore';
import type { FinishKey, LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { CardCondition, CollectionFilters } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { relatedByStory, relatedBySameName } from '../../utils/cardRelations';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
import { RelatedCardStrip } from './RelatedCardStrip';

interface Props {
  card: LorcanaCard;
  onClose: () => void;
}

/**
 * The finishes to show steppers for: the ones this card is printed in, plus any
 * finish that already holds a count. That second half means a wrong entry in the
 * finish rule table can never hide a collector's existing data.
 */
function visibleFinishes(card: LorcanaCard, variants: Record<string, number | undefined>): FinishKey[] {
  const list = [...card.finishes];
  for (const key of Object.keys(FINISH_META) as FinishKey[]) {
    if (!list.includes(key) && (variants[key] ?? 0) > 0) list.push(key);
  }
  return list;
}

export function CardCollectionModal({ card: initialCard, onClose }: Props) {
  const [card, setCard] = useState(initialCard);
  const [showZoom, setShowZoom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entry = useCollectionStore((s) => s.profiles[s.activeProfileId]?.cards[card.id]);
  const setFinishCount = useCollectionStore((s) => s.setFinishCount);
  const incrementFinish = useCollectionStore((s) => s.incrementFinish);
  const decrementFinish = useCollectionStore((s) => s.decrementFinish);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);
  const setCardDetails = useCollectionStore((s) => s.setCardDetails);
  const clearCard = useCollectionStore((s) => s.clearCard);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const showFullColor = useCollectionStore((s) => s.filters.showFullColor);

  const sameName = useMemo(() => relatedBySameName(card), [card]);
  const sameStory = useMemo(() => relatedByStory(card), [card]);

  const sameNameTitle = card.types.includes('Character') ? 'Same Character in Other Sets' : 'Cards With This Name';

  const goToCard = (next: LorcanaCard) => {
    setCard(next);
    setShowZoom(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const seeAll = (patch: Partial<CollectionFilters>) => {
    setFilters({ ...DEFAULT_COLLECTION_FILTERS, showFullColor, ...patch });
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const variants = entry?.variants ?? {};
  const count = totalCopies(variants);
  const finishes = visibleFinishes(card, variants);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showZoom) setShowZoom(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, showZoom]);

  const imageUrl = resolveCardImageUrl(card.setCode, card.collectorNumber, true);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin rounded-3xl border border-amber-500/30 bg-[#0c1222]/95 backdrop-blur-2xl shadow-2xl shadow-black/90"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-6">
          {/* Image Column */}
          <div className="md:col-span-5 space-y-3">
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="block w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 hover:border-amber-400/80 transition-all shadow-xl shadow-black/50 group"
            >
              <img
                src={imageUrl}
                alt={cardDisplayName(card)}
                onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="w-full py-2 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-slate-100 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔍</span>
              <span>View Fullscreen Artwork</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center font-mono font-medium">
              {card.setName} · {card.setCode}·{card.collectorNumber}
            </p>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">
                    {card.setCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => seeAll({ selectedStory: card.story })}
                    title={`Show every card from ${card.story}`}
                    className="px-2 py-0.5 rounded-md bg-sky-950/70 border border-sky-600/40 text-[10px] text-sky-200 hover:border-sky-400 hover:bg-sky-900/70 font-semibold transition-colors"
                  >
                    🎬 {card.story}
                  </button>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-bold ${RARITY_STYLES[card.rarity]}`}>
                    {rarityLabel(card.rarity)}
                  </span>
                  {card.types.map((t) => (
                    <span key={t} className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-900">
                      {TYPE_ICONS[t] ?? ''} {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-extrabold text-slate-100 leading-tight">{card.name}</h2>
                {card.version && <p className="text-sm font-medium text-amber-300/80 italic">{card.version}</p>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(card.id)}
                  aria-label="Toggle wishlist"
                  className={`w-9 h-9 rounded-xl text-base transition-all flex items-center justify-center ${
                    entry?.isWishlist
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40 font-bold'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                  }`}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stat Strip */}
            <div className="flex flex-wrap gap-1.5">
              {card.inks.map((ink) => (
                <span
                  key={ink}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${INK_STYLES[ink].activeChip}`}
                >
                  {ink}
                </span>
              ))}
              {card.cost !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] font-bold text-slate-200">
                  Cost {card.cost}
                </span>
              )}
              {card.inkwell && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[11px] font-bold text-emerald-300">
                  Inkwell
                </span>
              )}
              {card.strength !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] font-bold text-slate-200">
                  ⚔ {card.strength}
                </span>
              )}
              {card.willpower !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] font-bold text-slate-200">
                  🛡 {card.willpower}
                </span>
              )}
              {card.lore !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-[11px] font-bold text-amber-300">
                  ◇ {card.lore} Lore
                </span>
              )}
              {card.moveCost !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] font-bold text-slate-200">
                  Move {card.moveCost}
                </span>
              )}
            </div>

            {!!card.classifications.length && (
              <p className="text-xs text-slate-400 font-medium">{card.classifications.join(' · ')}</p>
            )}

            {card.text && (
              <p className="text-xs leading-relaxed text-slate-200 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 whitespace-pre-wrap shadow-inner font-normal">
                {card.text}
              </p>
            )}

            {/* Finish Counters */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Copies in Binder</p>
              {finishes.map((finish) => {
                const meta = FINISH_META[finish];
                const value = variants[finish] ?? 0;
                return (
                  <div
                    key={finish}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${meta.color}`}>
                        {meta.icon} {meta.label} Printing
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{meta.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Remove one ${meta.label}`}
                        onClick={() => decrementFinish(card.id, finish)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-bold transition-all active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={value}
                        onChange={(e) => setFinishCount(card.id, finish, Number(e.target.value))}
                        className="w-14 h-8 text-center rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        aria-label={`Add one ${meta.label}`}
                        onClick={() => incrementFinish(card.id, finish)}
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-base font-black transition-all shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Condition + Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Condition</span>
                <select
                  value={entry?.condition ?? ''}
                  onChange={(e) =>
                    setCardDetails(card.id, { condition: (e.target.value || undefined) as CardCondition })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">— Select Condition —</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Note</span>
                <input
                  value={entry?.note ?? ''}
                  onChange={(e) => setCardDetails(card.id, { note: e.target.value })}
                  placeholder="Graded, signed, deck slot…"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                disabled={!entry}
                onClick={() => {
                  if (window.confirm(`Remove ${cardDisplayName(card)} from this binder?`)) {
                    clearCard(card.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 border border-rose-900/60 hover:bg-rose-950/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Remove from Binder
              </button>
              <span className="text-[11px] text-slate-400 font-medium">
                {count > 0 ? `${count} cop${count === 1 ? 'y' : 'ies'} · saved` : 'Auto-saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Related Cards */}
        {(sameName.length > 0 || sameStory.length > 0) && (
          <div className="border-t border-slate-800/80 px-4 sm:px-6 py-4 space-y-4 bg-slate-950/50">
            <RelatedCardStrip
              title={sameNameTitle}
              cards={sameName}
              onSelect={goToCard}
              onSeeAll={() => seeAll({ selectedCharacter: card.name })}
            />
            <RelatedCardStrip
              title={`Same Series — ${card.story}`}
              cards={sameStory}
              onSelect={goToCard}
              onSeeAll={() => seeAll({ selectedStory: card.story })}
            />
          </div>
        )}
      </div>

      {showZoom &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in"
            onClick={() => setShowZoom(false)}
          >
            <img
              src={imageUrl}
              alt={cardDisplayName(card)}
              onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black"
            />
            <button
              type="button"
              onClick={() => setShowZoom(false)}
              aria-label="Close fullscreen"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/90 text-slate-100 text-lg flex items-center justify-center hover:bg-slate-700"
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </div>,
    document.body
  );
}
