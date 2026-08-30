import type { LorcanaCard } from '../types/card';

export interface ParsedCollectionCard {
  cardId: string;
  setCode: string;
  collectorNumber: string;
  quantity: number;
  card: LorcanaCard;
}

export interface CollectionTextParseResult {
  cards: ParsedCollectionCard[];
  totalQuantity: number;
  distinctCardsCount: number;
  unmatchedLines: string[];
  setsFound: string[];
}

/**
 * Normalizes collector numbers by stripping leading zeros and hashes.
 * e.g. '#001' -> '1', '020' -> '20', '004a' -> '4a'
 */
function normalizeCollectorNum(str: string): string {
  if (!str) return '';
  const trimmed = str.trim().toLowerCase().replace(/^#/, '').replace(/^no\.?\s*/, '');
  return trimmed.replace(/^0+/, '') || '0';
}

/**
 * Check if a line is a Set header (e.g. 'Set13', 'Set 13', 'set13', 's13', '[Set 13]', 'Set: 13', 'P1').
 * Note: Pure numbers (e.g. '1', '13') without 'Set' or 'S' prefix are card numbers, not set headers.
 */
export function extractSetHeader(line: string, knownSets: Set<string>): string | null {
  const trimmed = line.trim().replace(/^\[|\]$/g, '').trim();
  if (!trimmed) return null;

  // Pattern 1: Explicit 'set' or 's' prefix, e.g. 'Set13', 'Set 13', 'set13', 's13', 'set: 13', 'Set-13'
  const setPrefixMatch = trimmed.match(/^(?:set|s)\s*[:=-]?\s*([a-zA-Z0-9]+)$/i);
  if (setPrefixMatch) {
    const cand = setPrefixMatch[1].toLowerCase();
    for (const s of knownSets) {
      if (s.toLowerCase() === cand) return s;
    }
  }

  // Pattern 2: Alphanumeric set code that starts with letters (e.g. 'P1', 'P2', 'CP', 'D23', 'DIS')
  // Pure numbers (like '1', '13') must NOT match here so they can be parsed as card numbers.
  if (/^[a-zA-Z]/.test(trimmed)) {
    for (const s of knownSets) {
      if (s.toLowerCase() === trimmed.toLowerCase()) {
        return s;
      }
    }
  }

  return null;
}

/**
 * Parses collection text in the format:
 * Set13
 * 1,3
 * 20,5
 * 21
 *
 * Supports:
 * - First value: card collector number
 * - Second value: quantity (default is 1 if omitted)
 * - Multiple sets in one text block (e.g. Set13 followed by Set1)
 * - Flexible separators: comma (,), 'x', space, colon
 */
export function parseCollectionText(
  text: string,
  catalog: LorcanaCard[]
): CollectionTextParseResult {
  // Build lookup index for cards by `${setCodeLower}:${collectorNumberLower}`
  const cardLookup = new Map<string, LorcanaCard>();
  const knownSets = new Set<string>();

  for (const card of catalog) {
    knownSets.add(card.setCode);
    const key = `${card.setCode.toLowerCase()}:${normalizeCollectorNum(card.collectorNumber)}`;
    cardLookup.set(key, card);
  }

  const lines = text.split(/\r?\n/);
  let currentSet: string | null = null;
  const cardsMap = new Map<string, ParsedCollectionCard>();
  const unmatchedLines: string[] = [];
  const setsFound = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and comment lines (e.g. "// comment" or "# comment")
    // Do NOT skip "#1" or "#001" which are card numbers!
    if (!trimmed || trimmed.startsWith('//') || /^#(?:[\s\t]|[a-zA-Z])/.test(trimmed)) {
      continue;
    }

    // Check if line is a Set Header
    const detectedSet = extractSetHeader(trimmed, knownSets);
    if (detectedSet) {
      currentSet = detectedSet;
      setsFound.add(detectedSet);
      continue;
    }

    // If we haven't seen a set header yet
    if (!currentSet) {
      unmatchedLines.push(`Line ${i + 1}: "${trimmed}" (No Set specified yet. Add "SetXX" above this line)`);
      continue;
    }

    // Try to parse card entry: "<num>,<qty>" or "<num> x <qty>" or "<num>"
    // Supports: "1,3", "20,5", "21", "1, 3", "20 x 5", "21: 1", "001, 3", "#21"
    const entryMatch = trimmed.match(/^#?\s*([a-zA-Z0-9]+)\s*(?:[,x:\s]\s*(\d+))?$/i);
    if (!entryMatch) {
      unmatchedLines.push(`Line ${i + 1}: "${trimmed}" (Invalid card format. Expected "<card_num>,<count>" or "<card_num>")`);
      continue;
    }

    const rawNum = entryMatch[1];
    const rawQty = entryMatch[2];
    const cardNum = normalizeCollectorNum(rawNum);
    const qty = rawQty !== undefined ? parseInt(rawQty, 10) : 1;

    if (isNaN(qty) || qty <= 0) {
      unmatchedLines.push(`Line ${i + 1}: "${trimmed}" (Quantity must be at least 1)`);
      continue;
    }

    const cardKey = `${currentSet.toLowerCase()}:${cardNum}`;
    const matchedCard = cardLookup.get(cardKey);

    if (!matchedCard) {
      unmatchedLines.push(
        `Line ${i + 1}: "${trimmed}" (Card #${cardNum} was not found in Set ${currentSet})`
      );
      continue;
    }

    // Aggregate counts if the same card is listed multiple times in the text
    const existing = cardsMap.get(matchedCard.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cardsMap.set(matchedCard.id, {
        cardId: matchedCard.id,
        setCode: matchedCard.setCode,
        collectorNumber: matchedCard.collectorNumber,
        quantity: qty,
        card: matchedCard,
      });
    }
  }

  const cards = Array.from(cardsMap.values());
  const totalQuantity = cards.reduce((acc, c) => acc + c.quantity, 0);

  return {
    cards,
    totalQuantity,
    distinctCardsCount: cards.length,
    unmatchedLines,
    setsFound: Array.from(setsFound),
  };
}
