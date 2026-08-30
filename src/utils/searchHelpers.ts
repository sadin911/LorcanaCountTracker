/**
 * Card search helper with support for:
 * 1. Card Number + Set queries (e.g. "1-13", "13-1", "1/13", "s13 1", "P1-5")
 * 2. Standalone Card Numbers (e.g. "1", "#1", "001", "13") with automatic Set Filter awareness
 * 3. Text, character, story, classification, and ink searches
 */
import type { LorcanaCard } from '../types/card';

const CLEAN_CACHE_LIMIT = 5000;
const cleanCache = new Map<string, string>();

/** Lowercase, drop punctuation, collapse whitespace. */
export function cleanString(input: string): string {
  const cached = cleanCache.get(input);
  if (cached !== undefined) return cached;

  const out = (input || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[-.:_,!?/\\()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanCache.size >= CLEAN_CACHE_LIMIT) cleanCache.clear();
  cleanCache.set(input, out);
  return out;
}

/** Normalize card collector number (e.g. '#001' -> '1', '013' -> '13', '004a' -> '4a'). */
export function normalizeCollectorNum(str: string): string {
  if (!str) return '';
  const trimmed = str.trim().toLowerCase().replace(/^#/, '').replace(/^no\.?\s*/, '');
  return trimmed.replace(/^0+/, '') || '0';
}

/** Check if a card's set matches a candidate token (e.g. '13', 's13', 'set13', 'p1', etc.). */
export function matchesSetCode(card: LorcanaCard, candidate: string): boolean {
  if (!candidate) return false;
  const candLower = candidate.toLowerCase();
  const cardSetLower = card.setCode.toLowerCase();

  // Exact setCode match (e.g. '13' === '13', 'p1' === 'p1')
  if (cardSetLower === candLower) return true;

  // Strip 's' or 'set' prefix (e.g. 's13' -> '13', 'set1' -> '1')
  const stripped = candLower.replace(/^(?:set|s)/i, '');
  if (stripped && cardSetLower === stripped) return true;

  // If candidate is a longer word (e.g. 'chapter', 'floodborn', 'inklands', 'vine')
  if (candLower.length >= 4 && isNaN(Number(candLower))) {
    return card.setName.toLowerCase().includes(candLower);
  }

  return false;
}

export interface SetAndNumberQuery {
  setCode: string;
  collectorNum: string;
  isExplicitSet: boolean;
}

/**
 * Detect set + number search formats:
 * - '1-13', '13-1', '1/13', '13/1', 'p1-5', '5-p1'
 * - 'set 13 1', 's13 1', '13 1', 'p1 5', '1 s13', '1 set 13'
 */
export function parseSetAndNumberQuery(query: string): SetAndNumberQuery | null {
  const q = query.trim();

  // Prefix formats: 'set 13 1', 's13 1', 'set 13 #1', 's13 #1'
  const setPrefixMatch = q.match(/^(?:set|s)\s*([a-zA-Z0-9]+)\s+(?:#|no\.?|card)?\s*([a-zA-Z0-9]+)$/i);
  if (setPrefixMatch) {
    return { setCode: setPrefixMatch[1], collectorNum: setPrefixMatch[2], isExplicitSet: true };
  }

  // Suffix formats: '1 s13', '1 set 13', '#1 set 13'
  const numSetMatch = q.match(/^(?:#|no\.?|card)?\s*([a-zA-Z0-9]+)\s+(?:set|s)\s*([a-zA-Z0-9]+)$/i);
  if (numSetMatch) {
    return { setCode: numSetMatch[2], collectorNum: numSetMatch[1], isExplicitSet: true };
  }

  // Separator patterns: e.g. 1-13, 13-1, 1/13, 13/1, p1-5, s13-1, etc.
  const sepMatch = q.match(/^#?\s*([a-zA-Z0-9]+)\s*[-/:]\s*#?\s*([a-zA-Z0-9]+)$/);
  if (sepMatch) {
    const pA = sepMatch[1];
    const pB = sepMatch[2];
    const isALetter = /^[a-zA-Z]/.test(pA);
    const isBLetter = /^[a-zA-Z]/.test(pB);

    if (isALetter && !isBLetter) {
      return { setCode: pA, collectorNum: pB, isExplicitSet: true };
    }
    if (isBLetter && !isALetter) {
      return { setCode: pB, collectorNum: pA, isExplicitSet: true };
    }

    return { setCode: pA, collectorNum: pB, isExplicitSet: false };
  }

  // Space-separated tokens (e.g. '1 13', '13 1', 'p1 5', '5 p1')
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 2) {
    const t0 = tokens[0].replace(/^#/, '');
    const t1 = tokens[1].replace(/^#/, '');
    const isT0Letter = /^[a-zA-Z]/.test(t0);
    const isT1Letter = /^[a-zA-Z]/.test(t1);

    if (isT0Letter && /^\d+[a-z]?$/i.test(t1)) {
      return { setCode: t0, collectorNum: t1, isExplicitSet: true };
    }
    if (isT1Letter && /^\d+[a-z]?$/i.test(t0)) {
      return { setCode: t1, collectorNum: t0, isExplicitSet: true };
    }

    if (/^\d+$/i.test(t0) && /^\d+$/i.test(t1)) {
      return { setCode: t0, collectorNum: t1, isExplicitSet: false };
    }
  }

  return null;
}

// Keyed on the card object itself: the catalogue is a frozen static import, so
// these are computed at most once per card for the lifetime of the page.
const searchKeyCache = new WeakMap<LorcanaCard, string>();

/**
 * Everything about a card that search should match against, pre-cleaned.
 * Includes card.id, name, version, collectorNumber, setCode, setName, story, types, etc.
 */
export function getCardSearchKey(card: LorcanaCard): string {
  let key = searchKeyCache.get(card);
  if (key === undefined) {
    key = cleanString(
      [
        card.id,
        card.id.replace('-', ' '),
        card.name,
        card.version ?? '',
        card.collectorNumber,
        card.setCode,
        card.setName,
        card.story,
        card.types.join(' '),
        card.classifications.join(' '),
        card.inks.join(' '),
      ].join(' ')
    );
    searchKeyCache.set(card, key);
  }
  return key;
}

export type CardMatcher = (card: LorcanaCard) => boolean;

/**
 * Compile a query once, then test cards cheaply.
 *
 * Supports:
 * - Number-Set / Set-Number pairs: "1-13" (Card 1 in Set 13 or Set 1 Card 13), "P1-5", "s13 1"
 * - Card numbers: "1", "#1", "001" (if set is filtered, matches exact number in that set)
 * - Free text queries: "Elsa Queen", "Magic Broom"
 */
export function createCardMatcher(rawQuery: string, selectedSet?: string): CardMatcher {
  const trimmed = (rawQuery || '').trim();
  if (!trimmed) return () => true;

  // 1. Check if user typed a set + number pair (e.g. '1-13', '13-1', '1/13', 's13 1')
  const pair = parseSetAndNumberQuery(trimmed);
  if (pair) {
    const num1 = normalizeCollectorNum(pair.collectorNum);
    const set1 = pair.setCode;

    if (pair.isExplicitSet) {
      return (card: LorcanaCard) => {
        return normalizeCollectorNum(card.collectorNumber) === num1 && matchesSetCode(card, set1);
      };
    }

    // Ambiguous pair like '1-13' or '13-1': either can be set or collector number
    const num2 = normalizeCollectorNum(pair.setCode);
    const set2 = pair.collectorNum;

    return (card: LorcanaCard) => {
      const cardNum = normalizeCollectorNum(card.collectorNumber);
      if (cardNum === num1 && matchesSetCode(card, set1)) return true;
      if (cardNum === num2 && matchesSetCode(card, set2)) return true;
      return false;
    };
  }

  // 2. Check if user typed a pure card number (e.g. '1', '#1', '01', '001', '13', '#13')
  const pureNumMatch = trimmed.match(/^(?:#|no\.?\s*)?(\d+[a-z]?)$/i);
  if (pureNumMatch) {
    const targetNum = normalizeCollectorNum(pureNumMatch[1]);

    // If user filtered by a specific set (selectedSet !== 'ALL'), match exact collectorNumber in that set
    if (selectedSet && selectedSet !== 'ALL') {
      return (card: LorcanaCard) => {
        return normalizeCollectorNum(card.collectorNumber) === targetNum;
      };
    }

    // If 'ALL' sets or no set selected:
    // Match cards with this exact collectorNumber across sets, OR cards containing the number as a standalone word
    return (card: LorcanaCard) => {
      if (normalizeCollectorNum(card.collectorNumber) === targetNum) return true;
      const nameWords = (card.name + ' ' + (card.version || '') + ' ' + card.story).toLowerCase().split(/\s+/);
      return nameWords.includes(targetNum);
    };
  }

  // 3. General text & multi-token search
  const cleaned = cleanString(trimmed);
  const tokens = cleaned.split(' ').filter(Boolean);
  if (!tokens.length) return () => true;
  const phrase = tokens.join(' ');

  return (card: LorcanaCard) => {
    const key = getCardSearchKey(card);
    if (key.includes(phrase)) return true;

    for (const t of tokens) {
      if (normalizeCollectorNum(card.collectorNumber) === normalizeCollectorNum(t)) {
        continue;
      }
      if (!key.includes(t)) return false;
    }
    return true;
  };
}
