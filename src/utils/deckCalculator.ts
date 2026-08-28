import type { LorcanaCard, Ink } from '../types/card';
import type { Deck, DeckStats, DeckMissingReport, MissingCardInfo, DeckCostCurveItem } from '../types/deck';
import type { CollectionCardEntry } from '../types/collection';
import { totalCopies } from '../types/collection';
import { cardDisplayName } from '../types/card';

const ALL_INKS: Ink[] = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

export function calculateDeckStats(
  deck: Deck,
  cardDataMap: Map<string, LorcanaCard>
): DeckStats {
  let totalCards = 0;
  let inkableCount = 0;
  let uninkableCount = 0;

  let characterCount = 0;
  let actionCount = 0;
  let songCount = 0;
  let itemCount = 0;
  let locationCount = 0;

  let totalLore = 0;
  let charactersWithLoreCount = 0;
  let sumCost = 0;
  let cardsWithCostCount = 0;

  const inkCounts: Record<Ink, number> = {
    Amber: 0,
    Amethyst: 0,
    Emerald: 0,
    Ruby: 0,
    Sapphire: 0,
    Steel: 0,
  };

  const costBuckets: Record<number, { count: number; inkable: number; uninkable: number }> = {};
  for (let i = 1; i <= 8; i++) {
    costBuckets[i] = { count: 0, inkable: 0, uninkable: 0 };
  }

  const nameCounts: Record<string, number> = {};
  const ruleViolations: string[] = [];

  for (const [cardId, entry] of Object.entries(deck.cards)) {
    const count = entry.count || 0;
    if (count <= 0) continue;

    totalCards += count;
    const card = cardDataMap.get(cardId);

    if (!card) {
      // Unknown card ID fallback
      continue;
    }

    // Full display name for copy limits (Rule: Max 4 copies of a card with the same full name e.g. "Elsa - Spirit of Winter")
    const fullName = cardDisplayName(card);
    nameCounts[fullName] = (nameCounts[fullName] || 0) + count;
    if (nameCounts[fullName] > 4) {
      ruleViolations.push(`การ์ด "${fullName}" เกิน 4 ใบ (ปัจจุบันมี ${nameCounts[fullName]} ใบ)`);
    }

    // Inkable vs Uninkable
    if (card.inkwell) {
      inkableCount += count;
    } else {
      uninkableCount += count;
    }

    // Inks breakdown
    if (card.inks && Array.isArray(card.inks)) {
      card.inks.forEach((ink) => {
        if (inkCounts[ink] !== undefined) {
          inkCounts[ink] += count;
        }
      });
    }

    // Types breakdown
    const isSong = card.text && (card.text.toLowerCase().includes('a character with cost') || card.text.toLowerCase().includes('sing together') || card.types.includes('Song'));
    if (card.types.includes('Character')) {
      characterCount += count;
      if (card.lore !== null && card.lore > 0) {
        totalLore += card.lore * count;
        charactersWithLoreCount += count;
      }
    } else if (card.types.includes('Location')) {
      locationCount += count;
      if (card.lore !== null && card.lore > 0) {
        totalLore += card.lore * count;
      }
    } else if (card.types.includes('Item')) {
      itemCount += count;
    } else if (card.types.includes('Song') || isSong) {
      songCount += count;
    } else if (card.types.includes('Action')) {
      actionCount += count;
    }

    // Cost curve
    if (card.cost !== null && card.cost !== undefined) {
      sumCost += card.cost * count;
      cardsWithCostCount += count;

      const bucket = Math.min(8, Math.max(1, card.cost));
      if (costBuckets[bucket]) {
        costBuckets[bucket].count += count;
        if (card.inkwell) costBuckets[bucket].inkable += count;
        else costBuckets[bucket].uninkable += count;
      }
    }
  }

  // Active Inks & Ink Legality (Max 2 inks in Lorcana)
  const activeInks = ALL_INKS.filter((ink) => inkCounts[ink] > 0);
  const isInkLegal = activeInks.length <= 2;
  if (activeInks.length > 2) {
    ruleViolations.push(`เด็คมีหมึกเกิน 2 สี (${activeInks.join(', ')}) กติกาอนุญาตให้ใส่ได้สูงสุด 2 สี`);
  }

  // Deck size legality (Lorcana standard constructed deck is minimum 60 cards)
  if (totalCards < 60) {
    ruleViolations.push(`จำนวนการ์ดยังไม่ครบ 60 ใบ (ปัจจุบันมี ${totalCards} ใบ, ขาดอีก ${60 - totalCards} ใบ)`);
  }

  const costCurve: DeckCostCurveItem[] = Object.entries(costBuckets).map(([costStr, data]) => ({
    cost: Number(costStr),
    count: data.count,
    inkableCount: data.inkable,
    uninkableCount: data.uninkable,
  }));

  const inkablePercentage = totalCards > 0 ? Math.round((inkableCount / totalCards) * 100) : 0;
  const averageCost = cardsWithCostCount > 0 ? Number((sumCost / cardsWithCostCount).toFixed(1)) : 0;
  const averageLore = charactersWithLoreCount > 0 ? Number((totalLore / charactersWithLoreCount).toFixed(1)) : 0;

  return {
    totalCards,
    inkableCount,
    uninkableCount,
    inkablePercentage,
    inkCounts,
    activeInks,
    isInkLegal,
    characterCount,
    actionCount,
    songCount,
    itemCount,
    locationCount,
    totalLore,
    charactersWithLoreCount,
    averageLore,
    costCurve,
    averageCost,
    isLegal60: ruleViolations.length === 0,
    ruleViolations,
  };
}

export function calculateMissingCards(
  deck: Deck,
  cardDataMap: Map<string, LorcanaCard>,
  userCollectionCards: Record<string, CollectionCardEntry> = {}
): DeckMissingReport {
  let totalCardsNeeded = 0;
  let totalCardsOwned = 0;
  let totalCardsMissing = 0;

  const missingItems: MissingCardInfo[] = [];
  const completeItems: MissingCardInfo[] = [];

  for (const [cardId, entry] of Object.entries(deck.cards)) {
    const countNeeded = entry.count || 0;
    if (countNeeded <= 0) continue;

    totalCardsNeeded += countNeeded;
    const card = cardDataMap.get(cardId);
    if (!card) continue;

    const fullName = cardDisplayName(card);
    const ownedEntry = userCollectionCards[cardId];
    const countOwned = totalCopies(ownedEntry?.variants);

    const countCredited = Math.min(countNeeded, countOwned);
    totalCardsOwned += countCredited;

    const missingCount = Math.max(0, countNeeded - countOwned);
    totalCardsMissing += missingCount;

    const info: MissingCardInfo = {
      cardId,
      name: card.name,
      version: card.version,
      fullName,
      setCode: card.setCode,
      setName: card.setName,
      collectorNumber: card.collectorNumber,
      inks: card.inks || [],
      types: card.types || [],
      inkwell: card.inkwell,
      cost: card.cost,
      countNeeded,
      countOwned,
      missingCount,
    };

    if (missingCount > 0) {
      missingItems.push(info);
    } else {
      completeItems.push(info);
    }
  }

  // Sort missing items by Inks, then Cost, then Name
  missingItems.sort((a, b) => {
    const inkA = a.inks[0] || '';
    const inkB = b.inks[0] || '';
    if (inkA !== inkB) return inkA.localeCompare(inkB);
    if ((a.cost ?? 0) !== (b.cost ?? 0)) return (a.cost ?? 0) - (b.cost ?? 0);
    return a.fullName.localeCompare(b.fullName);
  });

  const completionPercentage =
    totalCardsNeeded > 0
      ? Math.min(100, Math.round((totalCardsOwned / totalCardsNeeded) * 100))
      : 100;

  return {
    totalCardsNeeded,
    totalCardsOwned,
    totalCardsMissing,
    missingItems,
    completeItems,
    isComplete: totalCardsMissing === 0 && totalCardsNeeded > 0,
    completionPercentage,
  };
}

export function generateShoppingListText(deckName: string, report: DeckMissingReport): string {
  if (report.missingItems.length === 0) {
    return `🎉 เด็ค "${deckName}" มีการ์ดครบทั้งหมดแล้ว (100%) ไม่มีการ์ดที่ต้องหาเพิ่ม`;
  }

  const lines = [
    `📋 [รายการการ์ดที่ยังขาด] สำหรับเด็ค: ${deckName}`,
    `📊 ขาดทั้งหมด ${report.totalCardsMissing} ใบ (มีแล้ว ${report.totalCardsOwned}/${report.totalCardsNeeded} ใบ - ${report.completionPercentage}%)`,
    `----------------------------------------`,
  ];

  // Group by Ink color
  const inkGroups: Record<string, MissingCardInfo[]> = {};
  report.missingItems.forEach((item) => {
    const inkKey = item.inks.length > 0 ? item.inks.join('/') : 'Other';
    if (!inkGroups[inkKey]) inkGroups[inkKey] = [];
    inkGroups[inkKey].push(item);
  });

  for (const [ink, items] of Object.entries(inkGroups)) {
    lines.push(`\n✨ หมึก ${ink}:`);
    items.forEach((item) => {
      const costBadge = item.cost !== null ? `(Cost ${item.cost})` : '';
      const setTag = `[${item.setCode} #${item.collectorNumber}]`;
      lines.push(
        ` • ${item.fullName} ${costBadge} ${setTag} - ขาด ${item.missingCount} ใบ (ต้องการ ${item.countNeeded}, มีแล้ว ${item.countOwned})`
      );
    });
  }

  lines.push(`\n----------------------------------------`);
  lines.push(`✨ สร้างจาก Lorcana Count Tracker Deck Builder`);
  return lines.join('\n');
}

/**
 * Parses Dreamborn / Pixelborn / Plain Text Lorcana Deck lists into DeckCardEntries
 */
export function parseLorcanaDeckText(
  text: string,
  allCards: LorcanaCard[]
): {
  cards: Record<string, { cardId: string; count: number }>;
  unmatched: string[];
  parsedCount: number;
} {
  const lines = text.split('\n');
  const cards: Record<string, { cardId: string; count: number }> = {};
  const unmatched: string[] = [];
  let parsedCount = 0;

  // Build lookup index:
  // 1. Exact full name lower: "elsa - spirit of winter" -> card
  // 2. Card ID lower: "1-42" -> card
  // 3. Name without subtitle if unique: "friends on the other side" -> card
  const byFullName = new Map<string, LorcanaCard>();
  const byCardId = new Map<string, LorcanaCard>();
  const bySimpleName = new Map<string, LorcanaCard[]>();

  allCards.forEach((c) => {
    const full = cardDisplayName(c).toLowerCase().trim();
    byFullName.set(full, c);
    byCardId.set(c.id.toLowerCase().trim(), c);

    const sName = c.name.toLowerCase().trim();
    if (!bySimpleName.has(sName)) {
      bySimpleName.set(sName, []);
    }
    bySimpleName.get(sName)!.push(c);
  });

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('---')) {
      continue;
    }

    // Pattern examples:
    // "4 Elsa - Spirit of Winter"
    // "4x Elsa - Spirit of Winter"
    // "4 Elsa - Spirit of Winter (1-42)"
    // "4 1-42"
    // "Elsa - Spirit of Winter x4"
    const countMatch = line.match(/^(\d+)[xX\s]+(.*)$/) || line.match(/^(.*?)\s+[xX](\d+)$/);
    let count = 1;
    let cardIdentifier = line;

    if (countMatch) {
      if (/^\d+$/.test(countMatch[1])) {
        count = parseInt(countMatch[1], 10);
        cardIdentifier = countMatch[2].trim();
      } else {
        cardIdentifier = countMatch[1].trim();
        count = parseInt(countMatch[2], 10);
      }
    }

    // Remove trailing set/number if formatted like "Elsa - Spirit of Winter (1-42)" or "[Set 1 #42]"
    const idExtractMatch = cardIdentifier.match(/[([\]]\s*([a-zA-Z0-9]+[-_][a-zA-Z0-9]+)\s*[)\]]/);
    let matchedCard: LorcanaCard | undefined;

    if (idExtractMatch) {
      const possibleId = idExtractMatch[1].toLowerCase().replace('_', '-');
      matchedCard = byCardId.get(possibleId);
    }

    if (!matchedCard) {
      // Clean identifier by removing parenthetical suffixes
      const cleanIdent = cardIdentifier
        .replace(/[([\]].*?[)\]]/g, '')
        .replace(/–/g, '-')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();

      // Try exact ID match
      if (byCardId.has(cleanIdent)) {
        matchedCard = byCardId.get(cleanIdent);
      } else if (byFullName.has(cleanIdent)) {
        // Try exact full name
        matchedCard = byFullName.get(cleanIdent);
      } else if (bySimpleName.has(cleanIdent) && bySimpleName.get(cleanIdent)!.length === 1) {
        // Unique simple name (like Action cards with no version)
        matchedCard = bySimpleName.get(cleanIdent)![0];
      } else {
        // Fuzzy match: match name and version if separated by -
        const parts = cleanIdent.split('-').map((p) => p.trim());
        if (parts.length >= 2) {
          const cName = parts[0];
          const cVer = parts.slice(1).join(' ');
          matchedCard = allCards.find(
            (c) =>
              c.name.toLowerCase() === cName &&
              c.version &&
              c.version.toLowerCase().includes(cVer)
          );
        }
      }
    }

    if (matchedCard) {
      const existing = cards[matchedCard.id]?.count || 0;
      cards[matchedCard.id] = {
        cardId: matchedCard.id,
        count: Math.min(60, existing + count),
      };
      parsedCount += count;
    } else {
      unmatched.push(line);
    }
  }

  return { cards, unmatched, parsedCount };
}

/**
 * Formats a deck into Dreamborn / Standard text export format
 */
export function formatLorcanaDeckText(
  deck: Deck,
  cardDataMap: Map<string, LorcanaCard>
): string {
  const characters: string[] = [];
  const actions: string[] = [];
  const items: string[] = [];
  const locations: string[] = [];

  for (const [cardId, entry] of Object.entries(deck.cards)) {
    if (entry.count <= 0) continue;
    const card = cardDataMap.get(cardId);
    const displayName = card ? cardDisplayName(card) : cardId;
    const line = `${entry.count} ${displayName}`;

    if (card?.types.includes('Character')) {
      characters.push(line);
    } else if (card?.types.includes('Location')) {
      locations.push(line);
    } else if (card?.types.includes('Item')) {
      items.push(line);
    } else {
      actions.push(line);
    }
  }

  const sections: string[] = [`// Disney Lorcana Deck: ${deck.name}`];
  if (deck.description) sections.push(`// ${deck.description}`);
  sections.push('');

  if (characters.length > 0) {
    sections.push(`--- Characters (${characters.reduce((acc, l) => acc + parseInt(l, 10), 0)}) ---`);
    sections.push(...characters.sort());
    sections.push('');
  }
  if (actions.length > 0) {
    sections.push(`--- Actions / Songs (${actions.reduce((acc, l) => acc + parseInt(l, 10), 0)}) ---`);
    sections.push(...actions.sort());
    sections.push('');
  }
  if (items.length > 0) {
    sections.push(`--- Items (${items.reduce((acc, l) => acc + parseInt(l, 10), 0)}) ---`);
    sections.push(...items.sort());
    sections.push('');
  }
  if (locations.length > 0) {
    sections.push(`--- Locations (${locations.reduce((acc, l) => acc + parseInt(l, 10), 0)}) ---`);
    sections.push(...locations.sort());
    sections.push('');
  }

  return sections.join('\n').trim();
}
