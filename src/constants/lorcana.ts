import type { Ink, Rarity } from '../types/card';

/** Tailwind class bundles per ink colour, used by filter chips and card badges. */
export const INK_STYLES: Record<Ink, { chip: string; activeChip: string; dot: string; text: string }> = {
  Amber: {
    chip: 'border-amber-700/40 text-amber-300/70 hover:bg-amber-900/30',
    activeChip: 'bg-amber-500/20 border-amber-500 text-amber-200',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  Amethyst: {
    chip: 'border-purple-700/40 text-purple-300/70 hover:bg-purple-900/30',
    activeChip: 'bg-purple-500/20 border-purple-500 text-purple-200',
    dot: 'bg-purple-400',
    text: 'text-purple-300',
  },
  Emerald: {
    chip: 'border-emerald-700/40 text-emerald-300/70 hover:bg-emerald-900/30',
    activeChip: 'bg-emerald-500/20 border-emerald-500 text-emerald-200',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  Ruby: {
    chip: 'border-red-700/40 text-red-300/70 hover:bg-red-900/30',
    activeChip: 'bg-red-500/20 border-red-500 text-red-200',
    dot: 'bg-red-400',
    text: 'text-red-300',
  },
  Sapphire: {
    chip: 'border-sky-700/40 text-sky-300/70 hover:bg-sky-900/30',
    activeChip: 'bg-sky-500/20 border-sky-500 text-sky-200',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
  },
  Steel: {
    chip: 'border-slate-600/40 text-slate-300/70 hover:bg-slate-800/50',
    activeChip: 'bg-slate-400/20 border-slate-400 text-slate-100',
    dot: 'bg-slate-300',
    text: 'text-slate-300',
  },
};

export const RARITY_STYLES: Record<Rarity, string> = {
  Common: 'text-slate-400',
  Uncommon: 'text-emerald-400',
  Rare: 'text-sky-400',
  Super_rare: 'text-purple-400',
  Legendary: 'text-amber-400',
  Epic: 'text-rose-400',
  Iconic: 'text-fuchsia-400',
  Enchanted: 'text-cyan-300',
  Promo: 'text-orange-400',
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
