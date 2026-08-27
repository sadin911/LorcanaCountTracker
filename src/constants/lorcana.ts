import type { Ink, Rarity } from '../types/card';

/** Tailwind class bundles per ink colour matching official Disney Lorcana Card Gallery. */
export const INK_STYLES: Record<
  Ink,
  {
    chip: string;
    activeChip: string;
    dot: string;
    text: string;
    border: string;
    glow: string;
    badgeBg: string;
  }
> = {
  Amber: {
    chip: 'border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-950/40',
    activeChip: 'bg-gradient-to-r from-amber-500/35 to-amber-600/35 border-amber-400 text-amber-100 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50 font-extrabold',
    dot: 'bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm shadow-amber-500/60',
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/25',
    badgeBg: 'bg-[#2a2012]/90 border-amber-500/50 text-amber-200',
  },
  Amethyst: {
    chip: 'border-purple-500/40 text-purple-300 hover:border-purple-400 hover:bg-purple-950/40',
    activeChip: 'bg-gradient-to-r from-purple-600/35 to-fuchsia-600/35 border-purple-400 text-purple-100 shadow-sm shadow-purple-500/30 ring-1 ring-purple-400/50 font-extrabold',
    dot: 'bg-gradient-to-br from-purple-300 to-fuchsia-500 shadow-sm shadow-purple-500/60',
    text: 'text-purple-300',
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/25',
    badgeBg: 'bg-[#261530]/90 border-purple-500/50 text-purple-200',
  },
  Emerald: {
    chip: 'border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/40',
    activeChip: 'bg-gradient-to-r from-emerald-600/35 to-teal-600/35 border-emerald-400 text-emerald-100 shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/50 font-extrabold',
    dot: 'bg-gradient-to-br from-emerald-300 to-teal-500 shadow-sm shadow-emerald-500/60',
    text: 'text-emerald-300',
    border: 'border-emerald-500/50',
    glow: 'shadow-emerald-500/25',
    badgeBg: 'bg-[#0f281e]/90 border-emerald-500/50 text-emerald-200',
  },
  Ruby: {
    chip: 'border-rose-500/40 text-rose-300 hover:border-rose-400 hover:bg-rose-950/40',
    activeChip: 'bg-gradient-to-r from-rose-600/35 to-red-600/35 border-rose-400 text-rose-100 shadow-sm shadow-rose-500/30 ring-1 ring-rose-400/50 font-extrabold',
    dot: 'bg-gradient-to-br from-rose-300 to-red-500 shadow-sm shadow-rose-500/60',
    text: 'text-rose-300',
    border: 'border-rose-500/50',
    glow: 'shadow-rose-500/25',
    badgeBg: 'bg-[#2d1216]/90 border-rose-500/50 text-rose-200',
  },
  Sapphire: {
    chip: 'border-sky-500/40 text-sky-300 hover:border-sky-400 hover:bg-sky-950/40',
    activeChip: 'bg-gradient-to-r from-sky-600/35 to-blue-600/35 border-sky-400 text-sky-100 shadow-sm shadow-sky-500/30 ring-1 ring-sky-400/50 font-extrabold',
    dot: 'bg-gradient-to-br from-sky-300 to-blue-500 shadow-sm shadow-sky-500/60',
    text: 'text-sky-300',
    border: 'border-sky-500/50',
    glow: 'shadow-sky-500/25',
    badgeBg: 'bg-[#122338]/90 border-sky-500/50 text-sky-200',
  },
  Steel: {
    chip: 'border-slate-400/40 text-slate-300 hover:border-slate-300 hover:bg-slate-800/60',
    activeChip: 'bg-gradient-to-r from-slate-500/35 to-zinc-500/35 border-slate-300 text-slate-100 shadow-sm shadow-slate-400/30 ring-1 ring-slate-300/50 font-extrabold',
    dot: 'bg-gradient-to-br from-slate-200 to-slate-400 shadow-sm shadow-slate-400/60',
    text: 'text-slate-300',
    border: 'border-slate-400/50',
    glow: 'shadow-slate-400/25',
    badgeBg: 'bg-[#1b2230]/90 border-slate-400/50 text-slate-200',
  },
};

export const RARITY_STYLES: Record<Rarity, string> = {
  Common: 'text-slate-400',
  Uncommon: 'text-emerald-400',
  Rare: 'text-sky-400 font-medium',
  Super_rare: 'text-purple-300 font-medium',
  Legendary: 'text-amber-400 font-bold',
  Epic: 'text-rose-400 font-bold',
  Iconic: 'text-fuchsia-300 font-bold',
  Enchanted: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-purple-300 font-extrabold',
  Promo: 'text-orange-400 font-bold',
};

export const TYPE_ICONS: Record<string, string> = {
  Character: '🧝',
  Action: '⚡',
  Song: '🎵',
  Item: '🔮',
  Location: '🏰',
};

export const FINISH_META: Record<string, { label: string; icon: string; description: string; color: string }> = {
  normal: {
    label: 'Normal',
    icon: '▫️',
    description: 'Standard non-foil printing',
    color: 'text-slate-300',
  },
  foil: {
    label: 'Foil',
    icon: '✨',
    description: 'Cold-foil printing',
    color: 'text-cyan-300',
  },
};

export const CONDITIONS: { value: string; label: string }[] = [
  { value: 'NM', label: 'NM — Near Mint' },
  { value: 'LP', label: 'LP — Lightly Played' },
  { value: 'MP', label: 'MP — Moderately Played' },
  { value: 'HP', label: 'HP — Heavily Played' },
];

export const PROFILE_ICONS = ['📘', '📗', '📙', '⭐', '🔥', '💧', '🌿', '🔮', '🐉', '🏆', '💎', '📦'];

/**
 * Cards of these rarities exist only as foil prints, so they are the ones that
 * get the on-screen sheen — the effect mirrors what the physical card does in
 * the hand rather than being decoration bolted onto an arbitrary tier.
 */
const PREMIUM_RARITIES = new Set<string>(['Enchanted', 'Epic', 'Iconic']);

export function isPremiumRarity(rarity: string): boolean {
  return PREMIUM_RARITIES.has(rarity);
}

/**
 * Seconds of delay before this card's glint, derived from its id. Synchronized
 * glints across a grid of Enchanteds look mechanical, and Math.random() would
 * re-roll on every render, so the offset is a hash of the id instead.
 *
 * FNV-1a rather than the usual `h * 31 + c`: card ids run in runs of consecutive
 * numbers ("1-205", "1-206", "1-207"), and a weakly-mixing hash maps those to
 * adjacent delays — 5.15s, 5.16s, 5.17s down the row, which is no stagger at all.
 */
export function foilSheenDelay(cardId: string): number {
  let h = 2166136261;
  for (let i = 0; i < cardId.length; i++) {
    h ^= cardId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 550) / 100;
}
