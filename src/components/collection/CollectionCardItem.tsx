import { RARITY_STYLES, FINISH_META, foilSheenDelay, isPremiumRarity } from '../../constants/lorcana';
import type { LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { FinishCount } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { useFoilTilt } from '../../hooks/useFoilTilt';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
import { LorcanaInkIcon, LorcanaRarityIcon } from '../icons/LorcanaIcons';
import { analytics } from '../../utils/analytics';

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
  /* Only on a card that is actually rendered in colour — a sheen riding a
     desaturated placeholder reads as a glitch, not as foil. */
  const showSheen = isPremiumRarity(card.rarity) && !!vivid;
  const tilt = useFoilTilt<HTMLDivElement>(showSheen);

  return (
    <div
      ref={tilt.ref}
      onClick={() => onSelect(card)}
      onPointerMove={showSheen ? tilt.onPointerMove : undefined}
      onPointerLeave={showSheen ? tilt.onPointerLeave : undefined}
      className={`group relative rounded-2xl border cursor-pointer hover:z-10 overflow-hidden ${
        owned
          ? 'border-[#c8b07b]/60 bg-[#1b2038]/95 ring-1 ring-[#c8b07b]/20'
          : 'bg-[#131627]/80 border-[#c8b07b]/20 hover:border-[#c8b07b]/60'
      } ${
        showSheen
          ? /* The 3D transform replaces the flat hover lift; an inline transform
               and a Tailwind hover:scale would otherwise overwrite each other. */
            'foil-3d border-[#dfc792]/50'
          : 'transition-all duration-200 hover:scale-[1.04] sm:hover:scale-[1.05] hover:-translate-y-1.5 active:scale-98 shadow-md shadow-[#c8b07b]/20'
      }`}
    >
      <div className="relative aspect-[2.5/3.5] overflow-hidden bg-[#0d0f1b]">
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

        {/* Top Right: Quantity Owned Badge */}
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] text-[10px] font-black shadow-md shadow-black/60">
            ×{count}
          </span>
        )}

        {/* Top Left: Wishlist Star (Touch friendly: visible on mobile, hover on desktop) */}
        <button
          type="button"
          aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation();
            analytics.trackWishlist(card.name, card.setCode, !isWishlist);
            onToggleWishlist(card.id);
          }}
          className={`absolute top-1.5 left-1.5 w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs transition-all active:scale-90 ${
            isWishlist
              ? 'bg-[#dfc792] text-[#131627] shadow-md shadow-[#dfc792]/40 font-black opacity-100'
              : 'bg-[#131627]/80 backdrop-blur-md text-slate-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[#1b2038] hover:text-[#dfc792]'
          }`}
        >
          ★
        </button>

        {/* Quick Add Button (Touch friendly: visible on mobile, hover on desktop) */}
        <button
          type="button"
          aria-label="Add one copy"
          onClick={(e) => {
            e.stopPropagation();
            const defaultFinish = card.finishes[0] || 'regular';
            analytics.trackCardAdded(card.name, card.setCode, defaultFinish, count + 1);
            onQuickAdd(card);
          }}
          className="absolute bottom-1.5 right-1.5 w-8 h-8 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 text-[#131627] text-base font-black flex items-center justify-center shadow-lg shadow-black/80 transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 active:scale-90"
        >
          +
        </button>
      </div>

      <div className="p-2 space-y-1 bg-[#1b2038]/80 backdrop-blur-md border-t border-[#c8b07b]/15">
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-400">
          <span className="truncate text-slate-300">
            {card.setCode}·{card.collectorNumber}
          </span>
          <span className={`inline-flex items-center gap-1 ${RARITY_STYLES[card.rarity]}`}>
            <LorcanaRarityIcon rarity={card.rarity} className="w-2.5 h-2.5 shrink-0" />
            {rarityLabel(card.rarity)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {primaryInk && <LorcanaInkIcon ink={primaryInk} className="w-3.5 h-3.5 shrink-0" />}
          <p className={`truncate text-xs font-bold ${owned ? 'text-[#f5e4bd]' : 'text-slate-300'}`}>
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
                  className={`px-1.5 py-0.2 rounded-md bg-[#131627] border border-[#c8b07b]/30 text-[9px] font-bold ${
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
