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
  /* The displayed card is state, not the prop: clicking a related thumbnail
     walks the modal to that card instead of closing it. CollectionGridView keys
     this component by card id, so opening a different card from the grid
     remounts and starts the walk over. */
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

  /* "Same character" for Characters; for a Song, Action or Item the same name
     means other printings of that card, which is still worth offering. */
  const sameNameTitle = card.types.includes('Character') ? 'Same character' : 'Cards with this name';

  const goToCard = (next: LorcanaCard) => {
    setCard(next);
    setShowZoom(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* "See all" must mean all of them, not the leftovers of a stale ink or rarity
     filter — so reset to defaults and apply exactly one condition. showFullColor
     survives because it is a display preference, not a filter. */
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
          {/* Image */}
          <div className="md:col-span-5 space-y-2">
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="block w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 hover:border-sky-500 transition-colors"
            >
              <img
                src={imageUrl}
                alt={cardDisplayName(card)}
                onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                className="w-full h-auto"
              />
            </button>
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="w-full py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              ⛶ View fullscreen
            </button>
            <p className="text-[10px] text-slate-500 text-center font-mono">
              {card.setName} · {card.setCode}·{card.collectorNumber}
            </p>
          </div>

          {/* Detail */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                    {card.setCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => seeAll({ selectedStory: card.story })}
                    title={`Show every card from ${card.story}`}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-amber-200 hover:border-amber-500 hover:text-amber-100"
                  >
                    🎬 {card.story}
                  </button>
                  <span className={`text-[10px] font-bold ${RARITY_STYLES[card.rarity]}`}>
                    {rarityLabel(card.rarity)}
                  </span>
                  {card.types.map((t) => (
                    <span key={t} className="text-[10px] text-slate-400">
                      {TYPE_ICONS[t] ?? ''} {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-slate-100 leading-tight">{card.name}</h2>
                {card.version && <p className="text-sm text-slate-400">{card.version}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(card.id)}
                  aria-label="Toggle wishlist"
                  className={`w-8 h-8 rounded-lg text-sm ${
                    entry?.isWishlist
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stat strip */}
            <div className="flex flex-wrap gap-1.5">
              {card.inks.map((ink) => (
                <span
                  key={ink}
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${INK_STYLES[ink].activeChip}`}
                >
                  {ink}
                </span>
              ))}
              {card.cost !== null && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                  Cost {card.cost}
                </span>
              )}
              {card.inkwell && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-emerald-300">Inkwell</span>
              )}
              {card.strength !== null && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                  ⚔ {card.strength}
                </span>
              )}
              {card.willpower !== null && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                  🛡 {card.willpower}
                </span>
              )}
              {card.lore !== null && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-amber-300">◇ {card.lore}</span>
              )}
              {card.moveCost !== null && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                  Move {card.moveCost}
                </span>
              )}
            </div>

            {!!card.classifications.length && (
              <p className="text-[11px] text-slate-400">{card.classifications.join(' · ')}</p>
            )}

            {card.text && (
              <p className="text-[11px] leading-relaxed text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg p-2 whitespace-pre-wrap">
                {card.text}
              </p>
            )}

            {/* Finish counters */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Copies owned</p>
              {finishes.map((finish) => {
                const meta = FINISH_META[finish];
                const value = variants[finish] ?? 0;
                return (
                  <div
                    key={finish}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{meta.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Remove one ${meta.label}`}
                        onClick={() => decrementFinish(card.id, finish)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={value}
                        onChange={(e) => setFinishCount(card.id, finish, Number(e.target.value))}
                        className="w-14 h-8 text-center rounded-lg bg-slate-950 border border-slate-700 text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        aria-label={`Add one ${meta.label}`}
                        onClick={() => incrementFinish(card.id, finish)}
                        className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Condition + note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Condition</span>
                <select
                  value={entry?.condition ?? ''}
                  onChange={(e) =>
                    setCardDetails(card.id, { condition: (e.target.value || undefined) as CardCondition })
                  }
                  className="mt-1 w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">—</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Note</span>
                <input
                  value={entry?.note ?? ''}
                  onChange={(e) => setCardDetails(card.id, { note: e.target.value })}
                  placeholder="Graded, signed, traded…"
                  className="mt-1 w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={!entry}
                onClick={() => {
                  if (window.confirm(`Remove ${cardDisplayName(card)} from this binder?`)) {
                    clearCard(card.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-300 border border-rose-900/60 hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Remove from binder
              </button>
              <span className="text-[10px] text-slate-500">
                {count > 0 ? `${count} cop${count === 1 ? 'y' : 'ies'} · saved automatically` : 'Saved automatically'}
              </span>
            </div>
          </div>
        </div>

        {(sameName.length > 0 || sameStory.length > 0) && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-3">
            <RelatedCardStrip
              title={sameNameTitle}
              cards={sameName}
              onSelect={goToCard}
              onSeeAll={() => seeAll({ selectedCharacter: card.name })}
            />
            <RelatedCardStrip
              title={`Same series — ${card.story}`}
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
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 animate-fade-in"
            onClick={() => setShowZoom(false)}
          >
            <img
              src={imageUrl}
              alt={cardDisplayName(card)}
              onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowZoom(false)}
              aria-label="Close fullscreen"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/80 text-slate-200 text-lg"
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
