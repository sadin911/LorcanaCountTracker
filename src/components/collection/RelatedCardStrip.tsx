import { useCollectionStore } from '../../store/collectionStore';
import type { LorcanaCard } from '../../types/card';
import { cardDisplayName } from '../../types/card';
import { totalCopies } from '../../types/collection';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';

/**
 * A story like Mickey Mouse & Friends has 179 cards. Showing them all would load
 * 179 images into a modal nobody scrolls to the end of, so the strip is a taste
 * and "See all" hands the rest to the grid.
 */
const MAX_THUMBS = 30;

interface Props {
  title: string;
  cards: LorcanaCard[];
  onSelect: (card: LorcanaCard) => void;
  onSeeAll: () => void;
}

export function RelatedCardStrip({ title, cards, onSelect, onSeeAll }: Props) {
  const ownedCards = useCollectionStore((s) => s.profiles[s.activeProfileId]?.cards ?? {});
  const showFullColor = useCollectionStore((s) => s.filters.showFullColor);

  if (!cards.length) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-wide text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{title}</span>
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="px-2.5 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20 hover:border-amber-400 whitespace-nowrap transition-all"
        >
          See all ({cards.length}) →
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-thin pb-2">
        {cards.slice(0, MAX_THUMBS).map((card) => {
          const owned = totalCopies(ownedCards[card.id]?.variants) > 0;
          const vivid = owned || showFullColor;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              title={cardDisplayName(card)}
              className={`shrink-0 w-[78px] rounded-xl border overflow-hidden bg-slate-950 transition-all hover:scale-105 hover:-translate-y-1 shadow-md ${
                owned
                  ? 'border-amber-500/50 shadow-amber-500/10'
                  : 'border-slate-800/90 hover:border-slate-600'
              }`}
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden">
                <img
                  src={resolveCardImageUrl(card.setCode, card.collectorNumber)}
                  alt={cardDisplayName(card)}
                  loading="lazy"
                  onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                  className={`w-full h-full ${card.layout === 'landscape' ? 'object-contain' : 'object-cover'} ${
                    vivid ? 'brightness-100' : 'grayscale opacity-50 hover:opacity-90 hover:grayscale-0'
                  }`}
                />
              </div>
              <p className="px-1.5 py-1 font-mono text-[9px] font-bold text-slate-400 truncate text-center bg-slate-900/90">
                {card.setCode}·{card.collectorNumber}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

