import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CONDITIONS,
  FINISH_META,
  INK_STYLES,
  RARITY_STYLES,
  TYPE_ICONS,
  foilSheenDelay,
  isPremiumRarity,
} from '../../constants/lorcana';
import { DEFAULT_COLLECTION_FILTERS, useCollectionStore } from '../../store/collectionStore';
import type { FinishKey, LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { CardCondition, CollectionFilters } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { useFoilTilt } from '../../hooks/useFoilTilt';
import { relatedByStory, relatedBySameName } from '../../utils/cardRelations';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
import { RelatedCardStrip } from './RelatedCardStrip';
import {
  LorcanaInkIcon,
  LorcanaInkwellIcon,
  LorcanaLoreIcon,
  LorcanaRarityIcon,
  LorcanaStrengthIcon,
  LorcanaWillpowerIcon,
} from '../icons/LorcanaIcons';
import { analytics } from '../../utils/analytics';

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
  const showSheen = isPremiumRarity(card.rarity);
  /* Gyro only here, on a card being looked at on its own — sixty grid tiles
     tilting in unison every time the phone moves is motion sickness, not depth. */
  const tilt = useFoilTilt<HTMLButtonElement>(showSheen, { gyro: true });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin rounded-3xl border border-[#c8b07b]/40 bg-[#131627]/95 backdrop-blur-2xl shadow-2xl shadow-black/90"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-6">
          {/* Image Column */}
          <div className="md:col-span-5 space-y-3">
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              ref={tilt.ref}
              onPointerMove={showSheen ? tilt.onPointerMove : undefined}
              onPointerLeave={showSheen ? tilt.onPointerLeave : undefined}
              className={`relative block w-full rounded-2xl overflow-hidden border bg-[#1b2038] group ${
                showSheen
                  ? 'foil-3d border-[#dfc792]/50 hover:border-[#dfc792]'
                  : 'border-[#c8b07b]/30 hover:border-[#c8b07b] transition-all shadow-xl shadow-black/50'
              }`}
            >
              <img
                src={imageUrl}
                alt={cardDisplayName(card)}
                onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {showSheen && (
                <>
                  {/* The stagger sits on these layers, not on the tilt target:
                      custom properties inherit down through the wrappers,
                      animation-delay does not. */}
                  <div
                    className="foil-holo"
                    aria-hidden="true"
                    style={{ animationDelay: `${foilSheenDelay(card.id)}s` }}
                  />
                  <div
                    className="foil-sheen"
                    aria-hidden="true"
                    style={{ animationDelay: `${foilSheenDelay(card.id)}s` }}
                  />
                </>
              )}
            </button>
            {/* iOS 13+ will only open the motion permission prompt from a user
                gesture, so the tilt needs a button rather than an effect.
                Android starts on its own and never renders this. */}
            {showSheen && tilt.gyro.needsGesture && (
              <button
                type="button"
                onClick={tilt.gyro.enable}
                className="w-full py-2 rounded-xl border border-[#dfc792]/40 bg-[#dfc792]/10 text-xs font-bold text-[#dfc792] hover:bg-[#dfc792]/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>✨</span>
                <span>Tilt your phone to catch the foil</span>
              </button>
            )}
            {showSheen && tilt.gyro.status === 'denied' && (
              <p className="text-[10px] text-slate-400 text-center">
                Motion access was declined — the foil still shifts, just without the tilt.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="w-full py-2 rounded-xl border border-[#c8b07b]/30 bg-[#1b2038]/80 hover:bg-[#252a48] text-xs font-bold text-slate-200 hover:text-[#dfc792] transition-all flex items-center justify-center gap-1.5"
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
                  <span className="px-2 py-0.5 rounded-md bg-[#1b2038] border border-[#c8b07b]/30 font-mono text-[10px] text-[#dfc792] font-bold">
                    {card.setCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => seeAll({ selectedStory: card.story })}
                    title={`Show every card from ${card.story}`}
                    className="px-2 py-0.5 rounded-md bg-[#1b2038] border border-sky-500/40 text-[10px] text-sky-200 hover:border-sky-400 hover:bg-sky-900/40 font-semibold transition-colors"
                  >
                    🎬 {card.story}
                  </button>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#1b2038] border border-[#c8b07b]/20 font-bold ${RARITY_STYLES[card.rarity]}`}>
                    <LorcanaRarityIcon rarity={card.rarity} className="w-3.5 h-3.5 shrink-0" />
                    {rarityLabel(card.rarity)}
                  </span>
                  {card.types.map((t) => (
                    <span key={t} className="text-[10px] text-slate-300 font-medium px-1.5 py-0.5 rounded bg-[#1b2038]">
                      {TYPE_ICONS[t] ?? ''} {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-extrabold text-slate-100 leading-tight">{card.name}</h2>
                {card.version && <p className="text-sm font-medium text-[#dfc792] italic">{card.version}</p>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    analytics.trackWishlist(card.name, card.setCode, !entry?.isWishlist);
                    toggleWishlist(card.id);
                  }}
                  aria-label="Toggle wishlist"
                  className={`w-9 h-9 rounded-xl text-base transition-all flex items-center justify-center ${
                    entry?.isWishlist
                      ? 'bg-gradient-to-tr from-[#dfc792] to-[#c8b07b] text-[#131627] shadow-md shadow-[#c8b07b]/40 font-bold'
                      : 'bg-[#1b2038] border border-[#c8b07b]/30 text-slate-400 hover:text-[#dfc792] hover:bg-[#252a48]'
                  }`}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-slate-400 hover:text-slate-100 hover:bg-[#252a48] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stat Strip */}
            <div className="flex flex-wrap items-center gap-1.5">
              {card.inks.map((ink) => (
                <span
                  key={ink}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${INK_STYLES[ink].activeChip}`}
                >
                  <LorcanaInkIcon ink={ink} className="w-3.5 h-3.5 shrink-0" />
                  {ink}
                </span>
              ))}
              {card.cost !== null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b2038] border border-[#c8b07b]/20 text-[11px] font-bold text-slate-200">
                  <LorcanaInkwellIcon inkable={card.inkwell} className="w-3.5 h-3.5 shrink-0" />
                  Cost {card.cost} {card.inkwell ? '(Inkable)' : '(Uninkable)'}
                </span>
              )}
              {card.strength !== null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b2038] border border-[#c8b07b]/20 text-[11px] font-bold text-amber-200">
                  <LorcanaStrengthIcon className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  {card.strength} Strength
                </span>
              )}
              {card.willpower !== null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b2038] border border-[#c8b07b]/20 text-[11px] font-bold text-slate-200">
                  <LorcanaWillpowerIcon className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                  {card.willpower} Willpower
                </span>
              )}
              {card.lore !== null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b2038] border border-[#c8b07b]/40 text-[11px] font-bold text-[#dfc792]">
                  <LorcanaLoreIcon className="w-3.5 h-3.5 shrink-0 text-[#dfc792]" />
                  {card.lore} Lore
                </span>
              )}
              {card.moveCost !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-[#1b2038] border border-[#c8b07b]/20 text-[11px] font-bold text-slate-200">
                  Move {card.moveCost}
                </span>
              )}
            </div>

            {!!card.classifications.length && (
              <p className="text-xs text-slate-400 font-medium">{card.classifications.join(' · ')}</p>
            )}

            {card.text && (
              <p className="text-xs leading-relaxed text-slate-200 bg-[#1b2038]/80 border border-[#c8b07b]/25 rounded-xl p-3 whitespace-pre-wrap shadow-inner font-normal">
                {card.text}
              </p>
            )}

            {/* Finish Counters */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Copies in Binder</p>
              {finishes.map((finish) => {
                const meta = FINISH_META[finish];
                const value = variants[finish] ?? 0;
                return (
                  <div
                    key={finish}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#1b2038] border border-[#c8b07b]/25 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-bold ${meta.color}`}>
                        {meta.icon} {meta.label} Printing
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate">{meta.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={`Remove one ${meta.label}`}
                        onClick={() => {
                          analytics.trackCardRemoved(card.name, card.setCode, finish, Math.max(0, value - 1));
                          decrementFinish(card.id, finish);
                        }}
                        className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl bg-[#252a48] hover:bg-[#2e3459] text-slate-100 text-xl sm:text-base font-black transition-all active:scale-90 border border-[#c8b07b]/20 flex items-center justify-center"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={value}
                        onChange={(e) => {
                          const n = Math.max(0, Number(e.target.value));
                          analytics.trackCardAdded(card.name, card.setCode, finish, n);
                          setFinishCount(card.id, finish, n);
                        }}
                        className="w-14 h-11 sm:h-9 text-center rounded-xl bg-[#131627] border border-[#c8b07b]/30 text-base sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-[#c8b07b]"
                      />
                      <button
                        type="button"
                        aria-label={`Add one ${meta.label}`}
                        onClick={() => {
                          analytics.trackCardAdded(card.name, card.setCode, finish, value + 1);
                          incrementFinish(card.id, finish);
                        }}
                        className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 text-[#131627] text-xl sm:text-base font-black transition-all shadow-md shadow-[#c8b07b]/20 active:scale-90 flex items-center justify-center"
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
                  className="mt-1 w-full px-3 py-2.5 sm:py-2 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-sm sm:text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b] min-h-[42px] sm:min-h-[38px]"
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
                  className="mt-1 w-full px-3 py-2.5 sm:py-2 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-sm sm:text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#c8b07b] min-h-[42px] sm:min-h-[38px]"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#c8b07b]/15">
              <button
                type="button"
                disabled={!entry}
                onClick={() => {
                  if (window.confirm(`Remove ${cardDisplayName(card)} from this binder?`)) {
                    clearCard(card.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-rose-300 border border-rose-900/60 hover:bg-rose-950/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors min-h-[40px] sm:min-h-[34px]"
              >
                Remove from Binder
              </button>
              <span className="text-xs sm:text-[11px] text-slate-400 font-medium">
                {count > 0 ? `${count} cop${count === 1 ? 'y' : 'ies'} · saved` : 'Auto-saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Related Cards */}
        {(sameName.length > 0 || sameStory.length > 0) && (
          <div className="border-t border-[#c8b07b]/20 px-4 sm:px-6 py-4 space-y-4 bg-[#1b2038]/50">
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
