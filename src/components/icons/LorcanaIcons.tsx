import type { SVGProps } from 'react';
import type { Ink, Rarity } from '../../types/card';

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/** Official Disney Lorcana Amber Emblem (Warm Sunburst Drop) */
export function AmberInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F5B82A" />
          <stop offset="100%" stopColor="#C47E00" />
        </linearGradient>
        <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F5B82A" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M16 2.5 L26.5 13 C29 16 29 20.5 26 24 C23 27.5 19 29.5 16 29.5 C13 29.5 9 27.5 6 24 C3 20.5 3 16 5.5 13 Z"
        fill="url(#lorcana-amber-grad)"
        filter="url(#amber-glow)"
      />
      <path
        d="M16 6 L23.5 14.5 C25.5 17 25 20.5 23 23 C21 25.5 18 26.5 16 26.5 C14 26.5 11 25.5 9 23 C7 20.5 6.5 17 8.5 14.5 Z"
        fill="#FFE885"
        fillOpacity="0.4"
      />
      <circle cx="16" cy="19" r="4.5" fill="#FFF2B2" />
      <circle cx="14.5" cy="17.5" r="1.8" fill="#FFFFFF" />
    </svg>
  );
}

/** Official Disney Lorcana Amethyst Emblem (Sorcery Diamond Crest) */
export function AmethystInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-amethyst-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E286E2" />
          <stop offset="50%" stopColor="#A84CA8" />
          <stop offset="100%" stopColor="#5E1B64" />
        </linearGradient>
        <filter id="amethyst-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#A84CA8" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M16 2 L28 16 L16 30 L4 16 Z"
        fill="url(#lorcana-amethyst-grad)"
        filter="url(#amethyst-glow)"
      />
      <path
        d="M16 6 L24 16 L16 26 L8 16 Z"
        fill="#F5B2F5"
        fillOpacity="0.3"
      />
      <path d="M16 7 L16 25" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M7 16 L25 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

/** Official Disney Lorcana Emerald Emblem (Faceted Gem Kite) */
export function EmeraldInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#0B5C28" />
        </linearGradient>
        <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#16A34A" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M16 2.5 L28 10 L22 28.5 L10 28.5 L4 10 Z"
        fill="url(#lorcana-emerald-grad)"
        filter="url(#emerald-glow)"
      />
      <path
        d="M16 6 L24 12 L20 25 L12 25 L8 12 Z"
        fill="#86EFAC"
        fillOpacity="0.35"
      />
      <polygon points="16,8 21,13 16,23 11,13" fill="#BBF7D0" fillOpacity="0.7" />
      <polygon points="16,10 19,13 16,18 13,13" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
}

/** Official Disney Lorcana Ruby Emblem (Radiant Crimson Shield) */
export function RubyInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
        <filter id="ruby-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#DC2626" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M16 3 L27 7.5 L24 21 C22 26 18 28.5 16 29.5 C14 28.5 10 26 8 21 L5 7.5 Z"
        fill="url(#lorcana-ruby-grad)"
        filter="url(#ruby-glow)"
      />
      <path
        d="M16 6.5 L24 10 L21.5 20 C20 23.5 17.5 25.5 16 26 C14.5 25.5 12 23.5 10.5 20 L8 10 Z"
        fill="#FCA5A5"
        fillOpacity="0.3"
      />
      <polygon points="16,9 21,14 16,22 11,14" fill="#FECACA" fillOpacity="0.8" />
      <polygon points="16,11 19,14 16,18 13,14" fill="#FFFFFF" />
    </svg>
  );
}

/** Official Disney Lorcana Sapphire Emblem (Eye of Wisdom Teardrop) */
export function SapphireInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-sapphire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="sapphire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#2563EB" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M16 2 C16 2 28 14 28 20.5 C28 26 22.5 29.5 16 29.5 C9.5 29.5 4 26 4 20.5 C4 14 16 2 16 2 Z"
        fill="url(#lorcana-sapphire-grad)"
        filter="url(#sapphire-glow)"
      />
      <path
        d="M16 6 C16 6 24 15 24 20 C24 24 20 26.5 16 26.5 C12 26.5 8 24 8 20 C8 15 16 6 16 6 Z"
        fill="#93C5FD"
        fillOpacity="0.35"
      />
      <circle cx="16" cy="19.5" r="4.5" fill="#BFDBFE" />
      <circle cx="16" cy="19.5" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

/** Official Disney Lorcana Steel Emblem (Polished Steel Anvil & Shield) */
export function SteelInkIcon({ className = 'w-4 h-4', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lorcana-steel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <filter id="steel-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#94A3B8" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M6 5 L26 5 L28 11 L23 15 L23 25 L16 29 L9 25 L9 15 L4 11 Z"
        fill="url(#lorcana-steel-grad)"
        filter="url(#steel-glow)"
      />
      <path
        d="M9 8 L23 8 L24.5 12 L20.5 15 L20.5 23 L16 26 L11.5 23 L11.5 15 L7.5 12 Z"
        fill="#F8FAFC"
        fillOpacity="0.4"
      />
      <path d="M16 8 L16 24" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      <circle cx="16" cy="15" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

/** Master Ink Icon component mapping directly to Lorcana Inks */
export function LorcanaInkIcon({ ink, className = 'w-4 h-4', size, ...props }: IconProps & { ink: Ink | string }) {
  switch (ink) {
    case 'Amber':
      return <AmberInkIcon className={className} size={size} {...props} />;
    case 'Amethyst':
      return <AmethystInkIcon className={className} size={size} {...props} />;
    case 'Emerald':
      return <EmeraldInkIcon className={className} size={size} {...props} />;
    case 'Ruby':
      return <RubyInkIcon className={className} size={size} {...props} />;
    case 'Sapphire':
      return <SapphireInkIcon className={className} size={size} {...props} />;
    case 'Steel':
      return <SteelInkIcon className={className} size={size} {...props} />;
    default:
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <circle cx="16" cy="16" r="13" stroke="#C8B07B" strokeWidth="2" fill="#252A48" />
          <path d="M16 6 L19 13 L26 16 L19 19 L16 26 L13 19 L6 16 L13 13 Z" fill="#DFC792" />
        </svg>
      );
  }
}

/** Official Disney Lorcana Inkwell Emblem (Inkable Ornate Filigree Ring vs Uninkable Hexagon) */
export function LorcanaInkwellIcon({
  inkable,
  className = 'w-4 h-4',
  size,
  ...props
}: IconProps & { inkable?: boolean | 'ALL' | 'inkable' | 'uninkable' }) {
  const isInkable = inkable === true || inkable === 'inkable';
  const isUninkable = inkable === 'uninkable';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="gold-filigree-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E4BD" />
          <stop offset="50%" stopColor="#C8B07B" />
          <stop offset="100%" stopColor="#9C7F43" />
        </linearGradient>
        <linearGradient id="ink-hex-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A3052" />
          <stop offset="100%" stopColor="#131627" />
        </linearGradient>
      </defs>

      {/* Official Inkwell Ornate Filigree Swirl Ring (Shown only on Inkable cards) */}
      {isInkable && (
        <g stroke="url(#gold-filigree-grad)" strokeWidth="1.6" strokeLinecap="round">
          {/* Outer circular filigree ring */}
          <circle cx="18" cy="18" r="15" strokeDasharray="3 2" fill="none" opacity="0.9" />
          {/* Radial decorative notches */}
          <line x1="18" y1="1" x2="18" y2="4" />
          <line x1="18" y1="32" x2="18" y2="35" />
          <line x1="1" y1="18" x2="4" y2="18" />
          <line x1="32" y1="18" x2="35" y2="18" />
          <line x1="6" y1="6" x2="8.5" y2="8.5" />
          <line x1="27.5" y1="27.5" x2="30" y2="30" />
          <line x1="6" y1="30" x2="8.5" y2="27.5" />
          <line x1="27.5" y1="8.5" x2="30" y2="6" />
        </g>
      )}

      {/* Central Lorcana Ink Cost Hexagon */}
      <polygon
        points="18,6 27,11.5 27,24.5 18,30 9,24.5 9,11.5"
        fill="url(#ink-hex-fill)"
        stroke={isInkable ? 'url(#gold-filigree-grad)' : isUninkable ? '#EF4444' : '#C8B07B'}
        strokeWidth="1.8"
      />

      {/* Inner droplet / swirl */}
      <path
        d="M18 10 C18 10 22 16 22 19 C22 21.2 20.2 23 18 23 C15.8 23 14 21.2 14 19 C14 16 18 10 18 10 Z"
        fill={isInkable ? '#DFC792' : isUninkable ? '#F87171' : '#C8B07B'}
      />

      {/* Cross mark if explicitly uninkable */}
      {isUninkable && (
        <line x1="8" y1="8" x2="28" y2="28" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Official Disney Lorcana Lore Pip (4-Pointed Gold Diamond Star) */
export function LorcanaLoreIcon({ className = 'w-3.5 h-3.5', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="lore-diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2D1" />
          <stop offset="50%" stopColor="#DFC792" />
          <stop offset="100%" stopColor="#9C7F43" />
        </linearGradient>
      </defs>
      <polygon
        points="12,2 17.5,12 12,22 6.5,12"
        fill="url(#lore-diamond-grad)"
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
      <polygon points="12,5 15,12 12,19 9,12" fill="#FFFFFF" fillOpacity="0.4" />
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/** Official Strength Combat Shield Emblem */
export function LorcanaStrengthIcon({ className = 'w-3.5 h-3.5', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="strength-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      <polygon points="12,2 21,6 18,17 12,22 6,17 3,6" fill="url(#strength-grad)" stroke="#FFFFFF" strokeWidth="0.8" />
      <path d="M8 8 L16 16 M16 8 L8 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Official Willpower Shield Defense Emblem */
export function LorcanaWillpowerIcon({ className = 'w-3.5 h-3.5', size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="willpower-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L20 5.5 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V5.5 Z"
        fill="url(#willpower-grad)"
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
      <circle cx="12" cy="11" r="3.5" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/** Official Disney Lorcana Rarity Symbols */
export function LorcanaRarityIcon({
  rarity,
  className = 'w-3.5 h-3.5',
  size,
  ...props
}: IconProps & { rarity: Rarity | string }) {
  switch (rarity) {
    case 'Common':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <circle cx="10" cy="10" r="7" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" />
        </svg>
      );
    case 'Uncommon':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <rect x="10" y="2" width="11" height="11" transform="rotate(45 10 2)" fill="#10B981" stroke="#34D399" strokeWidth="1.5" />
        </svg>
      );
    case 'Rare':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <polygon points="10,3 18,17 2,17" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
        </svg>
      );
    case 'Super_rare':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <polygon points="10,2 18,10 10,18 2,10" fill="#9333EA" stroke="#C084FC" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="2" fill="#FFFFFF" />
        </svg>
      );
    case 'Legendary':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <polygon points="10,2 12.5,7 18,8 14,12.5 15,18 10,15.5 5,18 6,12.5 2,8 7.5,7" fill="#EAB308" stroke="#FDE047" strokeWidth="1.2" />
        </svg>
      );
    case 'Enchanted':
    case 'Epic':
    case 'Iconic':
    case 'Promo':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <defs>
            <linearGradient id="ench-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>
          <polygon points="10,1 12.5,6.5 18.5,7.5 14,12 15.5,18 10,15 4.5,18 6,12 1.5,7.5 7.5,6.5" fill="url(#ench-grad)" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} style={size ? { width: size, height: size } : undefined} {...props}>
          <circle cx="10" cy="10" r="6" fill="#94A3B8" />
        </svg>
      );
  }
}
