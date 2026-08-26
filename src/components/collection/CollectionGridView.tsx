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

  return (
    <div className="space-y-3">
      {currentSetProgress && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-200">{currentSetProgress.setName}</span>
            <span className="text-slate-400">
              {currentSetProgress.uniqueOwned}/{currentSetProgress.totalCards} ·{' '}
              <span className="text-sky-300 font-bold">{currentSetProgress.percentage}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width] duration-500"
              style={{ width: `${currentSetProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {!cards.length ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 py-16 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-slate-400">No cards match these filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 md:gap-4">
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

      {selectedCard && <CardCollectionModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  );
}
