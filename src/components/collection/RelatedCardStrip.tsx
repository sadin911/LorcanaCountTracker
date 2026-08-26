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
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-semibold text-sky-300 hover:bg-slate-800 hover:text-sky-200 whitespace-nowrap"
        >
          See all ({cards.length}) →
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {cards.slice(0, MAX_THUMBS).map((card) => {
          const owned = totalCopies(ownedCards[card.id]?.variants) > 0;
          /* Same desaturation rule as the grid: unowned cards are dimmed unless
             Vivid mode is on. */
          const vivid = owned || showFullColor;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              title={cardDisplayName(card)}
              className={`shrink-0 w-[74px] rounded-lg border overflow-hidden bg-slate-950 transition-colors ${
                owned ? 'border-sky-600/60 hover:border-sky-400' : 'border-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden">
                <img
                  src={resolveCardImageUrl(card.setCode, card.collectorNumber)}
                  alt={cardDisplayName(card)}
                  loading="lazy"
                  onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                  /* Locations are landscape; contain rather than crop them. */
                  className={`w-full h-full ${card.layout === 'landscape' ? 'object-contain' : 'object-cover'} ${
                    vivid ? '' : 'grayscale opacity-60'
                  }`}
                />
              </div>
              <p className="px-1 py-0.5 font-mono text-[9px] text-slate-500 truncate">
                {card.setCode}·{card.collectorNumber}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
