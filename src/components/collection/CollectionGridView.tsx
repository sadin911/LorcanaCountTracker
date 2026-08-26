import { useEffect, useRef, useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import type { LorcanaCard } from '../../types/card';
import type { SetProgress } from '../../types/collection';
import { CardCollectionModal } from './CardCollectionModal';
import { CollectionCardItem } from './CollectionCardItem';

const ITEMS_PER_PAGE = 60;

interface Props {
  cards: LorcanaCard[];
  currentSetProgress?: SetProgress | null;
  showFullColor?: boolean;
  /** Changing this resets pagination; card mutations deliberately do not. */
  filterKey: string;
}

export function CollectionGridView({ cards, currentSetProgress, showFullColor, filterKey }: Props) {
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [selectedCard, setSelectedCard] = useState<LorcanaCard | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeCards = useCollectionStore((s) => s.profiles[s.activeProfileId]?.cards ?? {});
  const cardZoom = useCollectionStore((s) => s.filters.cardZoom ?? 'normal');
  const customColumns = useCollectionStore((s) => s.filters.customColumns ?? 6);
  const incrementFinish = useCollectionStore((s) => s.incrementFinish);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);

  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [filterKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayLimit((n) => (n >= cards.length ? n : n + ITEMS_PER_PAGE));
        }
      },
      { rootMargin: '400px', threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cards.length]);

  const visible = cards.slice(0, displayLimit);

  const isCustom = cardZoom === 'custom';
  const gridColsClass =
    cardZoom === 'compact'
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 sm:gap-2.5'
      : cardZoom === 'large'
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5'
        : isCustom
          ? 'gap-2.5 sm:gap-3.5'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 md:gap-4';

  const customGridStyle = isCustom
    ? { gridTemplateColumns: `repeat(${Math.max(1, Math.min(12, customColumns))}, minmax(0, 1fr))` }
    : undefined;

  return (
    <div className="relative z-0 space-y-3">
      {currentSetProgress && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 backdrop-blur-md p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-amber-100 flex items-center gap-1.5">
              <span className="text-amber-400">✦</span>
              <span>{currentSetProgress.setName}</span>
            </span>
            <span className="text-slate-300 font-medium">
              <span className="font-bold text-white">{currentSetProgress.uniqueOwned}</span> / {currentSetProgress.totalCards} cards ·{' '}
              <span className="text-amber-400 font-extrabold">{currentSetProgress.percentage}%</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-950/80 p-0.5 border border-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-[width] duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${currentSetProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {!cards.length ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md py-20 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
            ✨
          </div>
          <h4 className="text-base font-bold text-slate-200 mb-1">No Illumineer Cards Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, ink color filters, or set selection to reveal cards in your realm.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`grid ${gridColsClass} transition-all duration-300`}
            style={customGridStyle}
          >
            {visible.map((card) => (
              <CollectionCardItem
                key={card.id}
                card={card}
                variants={activeCards[card.id]?.variants ?? {}}
                isWishlist={activeCards[card.id]?.isWishlist}
                showFullColor={showFullColor}
                onSelect={setSelectedCard}
                /* Quick-add targets the card's first real finish — no rarity
                   guessing needed, the catalogue already states it. */
                onQuickAdd={(c) => incrementFinish(c.id, c.finishes[0])}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-8 flex items-center justify-center">
            {displayLimit < cards.length && (
              <span className="text-[11px] text-slate-500">
                Showing {visible.length} of {cards.length}…
              </span>
            )}
          </div>
        </>
      )}

      {/* Keyed by id so opening a different card from the grid remounts the modal
          and resets any walk through related cards. */}
      {selectedCard && (
        <CardCollectionModal key={selectedCard.id} card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
