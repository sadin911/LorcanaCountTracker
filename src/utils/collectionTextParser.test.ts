import { describe, it, expect } from 'vitest';
import { parseCollectionText, extractSetHeader } from './collectionTextParser';
import type { LorcanaCard } from '../types/card';

describe('collectionTextParser', () => {
  const mockCard = (partial: Partial<LorcanaCard>): LorcanaCard =>
    ({
      id: `${partial.setCode}-${partial.collectorNumber}`,
      name: 'Test Card',
      version: null,
      setCode: '1',
      setName: 'Set 1',
      collectorNumber: '1',
      story: 'Story',
      types: ['Character'],
      classifications: [],
      inks: ['Amber'],
      cost: 1,
      rarity: 'Common',
      sortNum: 1,
      sortSuffix: '',
      inkwell: true,
      strength: 1,
      willpower: 1,
      lore: 1,
      images: { full: '', foilMask: null },
      finishes: ['normal'],
      prices: { usd: null, usdFoil: null, eur: null, eurFoil: null, updatedAt: '' },
      ...partial,
    } as LorcanaCard);

  const mockCatalog: LorcanaCard[] = [
    mockCard({ setCode: '13', collectorNumber: '1', name: 'Woody' }),
    mockCard({ setCode: '13', collectorNumber: '20', name: 'Rex' }),
    mockCard({ setCode: '13', collectorNumber: '21', name: 'Hamm' }),
    mockCard({ setCode: '1', collectorNumber: '1', name: 'Ariel' }),
    mockCard({ setCode: '1', collectorNumber: '13', name: 'Minnie Mouse' }),
    mockCard({ setCode: 'P1', collectorNumber: '5', name: 'Mickey Mouse Promo' }),
  ];

  describe('extractSetHeader', () => {
    const knownSets = new Set(['1', '13', 'P1']);

    it('identifies valid set headers with various prefixes', () => {
      expect(extractSetHeader('Set13', knownSets)).toBe('13');
      expect(extractSetHeader('Set 13', knownSets)).toBe('13');
      expect(extractSetHeader('set13', knownSets)).toBe('13');
      expect(extractSetHeader('s13', knownSets)).toBe('13');
      expect(extractSetHeader('[Set 13]', knownSets)).toBe('13');
      expect(extractSetHeader('Set: 13', knownSets)).toBe('13');
      expect(extractSetHeader('SetP1', knownSets)).toBe('P1');
      expect(extractSetHeader('P1', knownSets)).toBe('P1');
    });

    it('returns null for card lines or unknown words', () => {
      expect(extractSetHeader('1,3', knownSets)).toBeNull();
      expect(extractSetHeader('21', knownSets)).toBeNull();
      expect(extractSetHeader('Set999', knownSets)).toBeNull();
    });
  });

  describe('parseCollectionText', () => {
    it('parses the user format correctly: Set13 followed by 1,3 and 20,5 and 21', () => {
      const input = `
Set13
1,3
20,5
21
`;
      const result = parseCollectionText(input, mockCatalog);

      expect(result.unmatchedLines).toHaveLength(0);
      expect(result.setsFound).toEqual(['13']);
      expect(result.distinctCardsCount).toBe(3);
      expect(result.totalQuantity).toBe(9); // 3 + 5 + 1

      const c1 = result.cards.find((c) => c.cardId === '13-1');
      expect(c1).toBeDefined();
      expect(c1?.quantity).toBe(3);

      const c20 = result.cards.find((c) => c.cardId === '13-20');
      expect(c20).toBeDefined();
      expect(c20?.quantity).toBe(5);

      const c21 = result.cards.find((c) => c.cardId === '13-21');
      expect(c21).toBeDefined();
      expect(c21?.quantity).toBe(1); // default 1
    });

    it('supports multiple sets in the same text input', () => {
      const input = `
Set13
1,3

Set 1
13,2
1
`;
      const result = parseCollectionText(input, mockCatalog);

      expect(result.unmatchedLines).toHaveLength(0);
      expect(result.setsFound).toContain('13');
      expect(result.setsFound).toContain('1');
      expect(result.distinctCardsCount).toBe(3);
      expect(result.totalQuantity).toBe(6); // 3 + 2 + 1

      expect(result.cards.find((c) => c.cardId === '13-1')?.quantity).toBe(3);
      expect(result.cards.find((c) => c.cardId === '1-13')?.quantity).toBe(2);
      expect(result.cards.find((c) => c.cardId === '1-1')?.quantity).toBe(1);
    });

    it('normalizes card numbers with leading zeros and hashes', () => {
      const input = `
Set13
#001, 3
020, 5
#21
`;
      const result = parseCollectionText(input, mockCatalog);
      expect(result.unmatchedLines).toHaveLength(0);
      expect(result.totalQuantity).toBe(9);
      expect(result.cards.find((c) => c.cardId === '13-1')?.quantity).toBe(3);
      expect(result.cards.find((c) => c.cardId === '13-20')?.quantity).toBe(5);
      expect(result.cards.find((c) => c.cardId === '13-21')?.quantity).toBe(1);
    });

    it('reports unmatched lines with clear line numbers and reasons', () => {
      const input = `
1,3
Set13
999,2
invalid_line
`;
      const result = parseCollectionText(input, mockCatalog);
      expect(result.unmatchedLines.length).toBe(3);
      expect(result.unmatchedLines[0]).toContain('No Set specified yet');
      expect(result.unmatchedLines[1]).toContain('Card #999 was not found');
      expect(result.unmatchedLines[2]).toContain('Invalid card format');
    });
  });
});
