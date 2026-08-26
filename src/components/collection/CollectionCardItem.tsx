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
  const inkStyle = primaryInk ? INK_STYLES[primaryInk] : null;

  return (
    <div
      onClick={() => onSelect(card)}
      className={`group relative rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.05] hover:-translate-y-1.5 hover:z-10 overflow-hidden ${
        owned
          ? `${inkStyle ? inkStyle.border : 'border-amber-500/40'} bg-slate-900/90 shadow-md ${
              inkStyle ? inkStyle.glow : 'shadow-amber-500/20'
            } ring-1 ring-white/10`
          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-600/80'
      }`}
    >
      <div className="relative aspect-[2.5/3.5] overflow-hidden bg-slate-950">
        <img
          src={resolveCardImageUrl(card.setCode, card.collectorNumber)}
          alt={cardDisplayName(card)}
          loading="lazy"
          onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
          className={`w-full h-full transition-all duration-300 ${
            card.layout === 'landscape' ? 'object-contain' : 'object-cover'
          } ${
            vivid
              ? 'brightness-100 contrast-[105%]'
              : 'grayscale-[85%] opacity-40 group-hover:opacity-90 group-hover:grayscale-[15%]'
          }`}
        />

        {/* Top Right: Quantity Owned Badge */}
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-extrabold shadow-md shadow-black/60">
            ×{count}
          </span>
        )}

        {/* Top Left: Wishlist Star */}
        <button
          type="button"
          aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(card.id);
          }}
          className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all ${
            isWishlist
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40 font-bold'
              : 'bg-slate-950/80 backdrop-blur-md text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-900'
          }`}
        >
          ★
        </button>

        {/* Quick Add Button */}
        <button
          type="button"
          aria-label="Add one copy"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(card);
          }}
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-base font-black flex items-center justify-center shadow-lg shadow-black/80 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
        >
          +
        </button>
      </div>

      <div className="p-2 space-y-1 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-400">
          <span className="truncate">
            {card.setCode}·{card.collectorNumber}
          </span>
          <span className={RARITY_STYLES[card.rarity]}>{rarityLabel(card.rarity)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {inkStyle && <span className={`w-2 h-2 rounded-full shrink-0 ${inkStyle.dot}`} />}
          <p className={`truncate text-xs font-bold ${owned ? 'text-slate-100' : 'text-slate-400'}`}>
            {card.name}
          </p>
        </div>
        {card.version && <p className="truncate text-[10px] text-slate-400 italic">{card.version}</p>}

        {count > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {(Object.entries(variants) as [keyof typeof FINISH_META, number][])
              .filter(([, n]) => Number(n) > 0)
              .map(([finish, n]) => (
                <span
                  key={String(finish)}
                  className={`px-1.5 py-0.2 rounded-md bg-slate-800/90 border border-slate-700 text-[9px] font-bold ${
                    FINISH_META[String(finish)]?.color ?? 'text-slate-300'
                  }`}
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
