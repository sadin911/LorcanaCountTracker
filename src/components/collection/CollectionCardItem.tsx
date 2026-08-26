import { INK_STYLES, RARITY_STYLES, FINISH_META } from '../../constants/lorcana';
import type { LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { FinishCount } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';

interface Props {
  card: LorcanaCard;
  variants: FinishCount;
  isWishlist?: boolean;
  showFullColor?: boolean;
  onSelect: (card: LorcanaCard) => void;
  onQuickAdd: (card: LorcanaCard) => void;
  onToggleWishlist: (cardId: string) => void;
}

export function CollectionCardItem({
  card,
  variants,
  isWishlist,
  showFullColor,
  onSelect,
  onQuickAdd,
  onToggleWishlist,
}: Props) {
  const count = totalCopies(variants);
  const owned = count > 0;
  const vivid = owned || showFullColor;
  const primaryInk = card.inks[0];

  return (
    <div
      onClick={() => onSelect(card)}
      className={`group relative rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.06] hover:-translate-y-1.5 hover:z-30 ${
        owned
          ? 'bg-slate-900 border-sky-600/60 ring-1 ring-sky-500/20'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
      }`}
    >
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-t-xl bg-slate-950">
        <img
          src={resolveCardImageUrl(card.setCode, card.collectorNumber)}
          alt={cardDisplayName(card)}
          loading="lazy"
          onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
          /* Locations are landscape, so contain rather than crop — a cover crop
             would slice the artwork in half. */
          className={`w-full h-full transition-all duration-300 ${
            card.layout === 'landscape' ? 'object-contain' : 'object-cover'
          } ${
            vivid
              ? 'brightness-100 contrast-[105%]'
              : 'grayscale-[85%] opacity-40 group-hover:opacity-85 group-hover:grayscale-[20%]'
          }`}
        />

        {count > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold shadow">
            ×{count}
          </span>
        )}

        <button
          type="button"
          aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(card.id);
          }}
          className={`absolute top-1 left-1 w-6 h-6 rounded-md flex items-center justify-center text-xs transition-colors ${
            isWishlist
              ? 'bg-amber-500 text-white'
              : 'bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 xl:opacity-0 hover:bg-black/80'
          }`}
        >
          ★
        </button>

        <button
          type="button"
          aria-label="Add one copy"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(card);
          }}
          className="absolute bottom-1 right-1 w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold flex items-center justify-center shadow-lg transition-opacity xl:opacity-0 xl:group-hover:opacity-100"
        >
          +
        </button>
      </div>

      <div className="p-1.5 space-y-1">
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-500">
          <span className="truncate">
            {card.setCode}·{card.collectorNumber}
          </span>
          <span className={RARITY_STYLES[card.rarity]}>{rarityLabel(card.rarity)}</span>
        </div>

        <div className="flex items-center gap-1">
          {primaryInk && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${INK_STYLES[primaryInk].dot}`} />}
          <p className={`truncate text-[11px] font-semibold ${owned ? 'text-slate-100' : 'text-slate-400'}`}>
            {card.name}
          </p>
        </div>
        {card.version && <p className="truncate text-[9px] text-slate-500">{card.version}</p>}

        {count > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {(Object.entries(variants) as [keyof typeof FINISH_META, number][])
              .filter(([, n]) => Number(n) > 0)
              .map(([finish, n]) => (
                <span
                  key={String(finish)}
                  className={`px-1 rounded bg-slate-800 text-[9px] font-bold ${FINISH_META[String(finish)]?.color ?? 'text-slate-300'}`}
                >
                  {String(finish).charAt(0).toUpperCase()}:{n}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
