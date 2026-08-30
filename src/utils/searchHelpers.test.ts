import { describe, it, expect } from 'vitest';
import {
  normalizeCollectorNum,
  parseSetAndNumberQuery,
  matchesSetCode,
  createCardMatcher,
} from './searchHelpers';
import type { LorcanaCard } from '../types/card';

describe('searchHelpers', () => {
  describe('normalizeCollectorNum', () => {
    it('normalizes numbers with leading zeroes and hashes', () => {
      expect(normalizeCollectorNum('#001')).toBe('1');
      expect(normalizeCollectorNum('013')).toBe('13');
      expect(normalizeCollectorNum('#13')).toBe('13');
      expect(normalizeCollectorNum('004a')).toBe('4a');
      expect(normalizeCollectorNum('#000')).toBe('0');
      expect(normalizeCollectorNum('1')).toBe('1');
    });
  });

  describe('parseSetAndNumberQuery', () => {
    it('parses dash and slash separated set and number pairs', () => {
      expect(parseSetAndNumberQuery('1-13')).toEqual({ setCode: '1', collectorNum: '13', isExplicitSet: false });
      expect(parseSetAndNumberQuery('13-1')).toEqual({ setCode: '13', collectorNum: '1', isExplicitSet: false });
      expect(parseSetAndNumberQuery('1/13')).toEqual({ setCode: '1', collectorNum: '13', isExplicitSet: false });
      expect(parseSetAndNumberQuery('p1-5')).toEqual({ setCode: 'p1', collectorNum: '5', isExplicitSet: true });
    });

    it('parses prefixed set and number expressions', () => {
      expect(parseSetAndNumberQuery('s13 1')).toEqual({ setCode: '13', collectorNum: '1', isExplicitSet: true });
      expect(parseSetAndNumberQuery('set 13 1')).toEqual({ setCode: '13', collectorNum: '1', isExplicitSet: true });
      expect(parseSetAndNumberQuery('1 s13')).toEqual({ setCode: '13', collectorNum: '1', isExplicitSet: true });
      expect(parseSetAndNumberQuery('#1 set 13')).toEqual({ setCode: '13', collectorNum: '1', isExplicitSet: true });
    });

    it('returns null for single tokens or standard search words', () => {
      expect(parseSetAndNumberQuery('1')).toBeNull();
      expect(parseSetAndNumberQuery('mickey')).toBeNull();
      expect(parseSetAndNumberQuery('elsa queen')).toBeNull();
    });
  });

  const mockCard = (partial: Partial<LorcanaCard>): LorcanaCard =>
    ({
      id: '1-1',
      name: 'Test Card',
      version: null,
      setCode: '1',
      setName: 'The First Chapter',
      collectorNumber: '1',
      story: 'Test Story',
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

  describe('matchesSetCode', () => {
    const testCard = mockCard({
      id: '13-1',
      name: 'Woody',
      version: 'Cowboy',
      setCode: '13',
      setName: 'Set 13 Test',
      collectorNumber: '1',
      story: 'Toy Story',
    });

    it('matches exact setCode', () => {
      expect(matchesSetCode(testCard, '13')).toBe(true);
      expect(matchesSetCode(testCard, 's13')).toBe(true);
      expect(matchesSetCode(testCard, 'set13')).toBe(true);
      expect(matchesSetCode(testCard, '1')).toBe(false);
    });
  });

  describe('createCardMatcher', () => {
    const woody = mockCard({
      id: '13-1',
      name: 'Woody',
      version: 'Cowboy',
      setCode: '13',
      setName: 'Set 13 Test',
      collectorNumber: '1',
      story: 'Toy Story',
    });

    const minnie = mockCard({
      id: '1-13',
      name: 'Minnie Mouse',
      version: 'Beloved Friend',
      setCode: '1',
      setName: 'The First Chapter',
      collectorNumber: '13',
      story: 'Mickey & Friends',
    });

    const ariel = mockCard({
      id: '1-1',
      name: 'Ariel',
      version: 'On Human Legs',
      setCode: '1',
      setName: 'The First Chapter',
      collectorNumber: '1',
      story: 'The Little Mermaid',
    });

    it('matches set + number queries (1-13) for both card 1 set 13 and card 13 set 1', () => {
      const matcher = createCardMatcher('1-13');
      expect(matcher(woody)).toBe(true); // Card 1 of Set 13
      expect(matcher(minnie)).toBe(true); // Card 13 of Set 1
      expect(matcher(ariel)).toBe(false); // Card 1 of Set 1
    });

    it('matches "s13 1" specifically for set 13 card 1', () => {
      const matcher = createCardMatcher('s13 1');
      expect(matcher(woody)).toBe(true);
      expect(matcher(minnie)).toBe(false);
      expect(matcher(ariel)).toBe(false);
    });

    it('matches exact card number when set filter is active (e.g. selectedSet="13" & query="1")', () => {
      const matcherSet13 = createCardMatcher('1', '13');
      expect(matcherSet13(woody)).toBe(true); // Card 1
      expect(matcherSet13(minnie)).toBe(false); // Card 13

      const matcherSet1 = createCardMatcher('1', '1');
      expect(matcherSet1(ariel)).toBe(true); // Card 1
      expect(matcherSet1(minnie)).toBe(false); // Card 13
    });

    it('supports #001 format with set filter active', () => {
      const matcher = createCardMatcher('#001', '13');
      expect(matcher(woody)).toBe(true);
      expect(matcher(minnie)).toBe(false);
    });

    it('falls back to multi-token text search for character names', () => {
      const matcher = createCardMatcher('Woody Cowboy');
      expect(matcher(woody)).toBe(true);
      expect(matcher(minnie)).toBe(false);
    });
  });
});
