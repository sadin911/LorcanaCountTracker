import { describe, it, expect } from 'vitest';
import {
  parseThaiNumberWords,
  normalizeSpeechText,
  detectVoiceCommand,
  detectSetFromSpeech,
  detectQuantityFromSpeech,
  detectFinishFromSpeech,
  detectCardNumberFromSpeech,
  parseVoiceInput,
} from './voiceCardParser';
import type { LorcanaCard } from '../types/card';

// Mock minimal LorcanaCard catalog
const mockCatalog: LorcanaCard[] = [
  {
    id: '1-1',
    name: 'Ariel',
    version: 'On Human Legs',
    setCode: '1',
    setName: 'The First Chapter',
    story: 'The Little Mermaid',
    collectorNumber: '1',
    sortNum: 1,
    sortSuffix: '',
    rarity: 'Uncommon',
    inks: ['Amber'],
    inkwell: true,
    cost: 4,
    types: ['Character'],
    classifications: ['Storyborn', 'Hero', 'Princess'],
    strength: 3,
    willpower: 4,
    lore: 2,
    moveCost: null,
    text: '',
    keywords: [],
    illustrators: ['Matthew Robert Davies'],
    layout: 'normal',
    finishes: ['normal', 'foil'],
  },
  {
    id: '1-25',
    name: 'Mickey Mouse',
    version: 'True Friend',
    setCode: '1',
    setName: 'The First Chapter',
    story: 'Mickey Mouse & Friends',
    collectorNumber: '25',
    sortNum: 25,
    sortSuffix: '',
    rarity: 'Uncommon',
    inks: ['Amber'],
    inkwell: true,
    cost: 3,
    types: ['Character'],
    classifications: ['Storyborn', 'Hero'],
    strength: 3,
    willpower: 3,
    lore: 2,
    moveCost: null,
    text: '',
    keywords: [],
    illustrators: ['Dave Alvarez'],
    layout: 'normal',
    finishes: ['normal', 'foil'],
  },
  {
    id: '1-42',
    name: 'Elsa',
    version: 'Snow Queen',
    setCode: '1',
    setName: 'The First Chapter',
    story: 'Frozen',
    collectorNumber: '42',
    sortNum: 42,
    sortSuffix: '',
    rarity: 'Common',
    inks: ['Amethyst'],
    inkwell: true,
    cost: 3,
    types: ['Character'],
    classifications: ['Storyborn', 'Hero', 'Queen', 'Sorcerer'],
    strength: 2,
    willpower: 3,
    lore: 1,
    moveCost: null,
    text: '',
    keywords: ['Challenger'],
    illustrators: ['Nicholas Kole'],
    layout: 'normal',
    finishes: ['normal', 'foil'],
  },
  {
    id: '2-10',
    name: 'Cinderella',
    version: 'Ballroom Sensation',
    setCode: '2',
    setName: 'Rise of the Floodborn',
    story: 'Cinderella',
    collectorNumber: '10',
    sortNum: 10,
    sortSuffix: '',
    rarity: 'Common',
    inks: ['Amber'],
    inkwell: true,
    cost: 1,
    types: ['Character'],
    classifications: ['Storyborn', 'Hero', 'Princess'],
    strength: 1,
    willpower: 2,
    lore: 1,
    moveCost: null,
    text: '',
    keywords: ['Singer'],
    illustrators: ['Casey Robin'],
    layout: 'normal',
    finishes: ['normal', 'foil'],
  },
  {
    id: 'P1-1',
    name: 'Mickey Mouse',
    version: 'Brave Little Tailor',
    setCode: 'P1',
    setName: 'Promos Set 1',
    story: 'Mickey Mouse & Friends',
    collectorNumber: '1',
    sortNum: 1,
    sortSuffix: '',
    rarity: 'Promo',
    inks: ['Ruby'],
    inkwell: true,
    cost: 8,
    types: ['Character'],
    classifications: ['Storyborn', 'Hero'],
    strength: 5,
    willpower: 5,
    lore: 4,
    moveCost: null,
    text: '',
    keywords: ['Evasive'],
    illustrators: ['Nicholas Kole'],
    layout: 'normal',
    finishes: ['foil'],
  },
];

describe('voiceCardParser for Lorcana', () => {
  describe('parseThaiNumberWords', () => {
    it('converts basic Thai digits', () => {
      expect(parseThaiNumberWords('หนึ่ง')).toBe(1);
      expect(parseThaiNumberWords('สอง')).toBe(2);
      expect(parseThaiNumberWords('แปด')).toBe(8);
      expect(parseThaiNumberWords('เก้า')).toBe(9);
    });

    it('converts compound Thai numbers', () => {
      expect(parseThaiNumberWords('สิบสอง')).toBe(12);
      expect(parseThaiNumberWords('ยี่สิบห้า')).toBe(25);
      expect(parseThaiNumberWords('สี่สิบสอง')).toBe(42);
      expect(parseThaiNumberWords('หนึ่งร้อยสิบ')).toBe(110);
      expect(parseThaiNumberWords('สองร้อยสี่')).toBe(204);
    });

    it('returns null for non-number words', () => {
      expect(parseThaiNumberWords('มิกกี้')).toBeNull();
      expect(parseThaiNumberWords('เอลซ่า')).toBeNull();
    });
  });

  describe('normalizeSpeechText', () => {
    it('lowercases and strips punctuation', () => {
      expect(normalizeSpeechText('Set 1, Number #25! (Foil)')).toBe('set 1 number 25 foil');
    });
  });

  describe('detectVoiceCommand', () => {
    it('detects undo commands', () => {
      expect(detectVoiceCommand('ลบล่าสุด')).toBe('undo');
      expect(detectVoiceCommand('ลบใบสุดท้าย')).toBe('undo');
      expect(detectVoiceCommand('ยกเลิก')).toBe('undo');
      expect(detectVoiceCommand('undo')).toBe('undo');
    });

    it('detects clear commands', () => {
      expect(detectVoiceCommand('ล้างทั้งหมด')).toBe('clear');
      expect(detectVoiceCommand('เคลียร์')).toBe('clear');
      expect(detectVoiceCommand('clear all')).toBe('clear');
    });

    it('detects quantity adjustments', () => {
      expect(detectVoiceCommand('เพิ่มอีกใบ')).toBe('increase_last');
      expect(detectVoiceCommand('บวก 1')).toBe('increase_last');
      expect(detectVoiceCommand('ลดหนึ่งใบ')).toBe('decrease_last');
      expect(detectVoiceCommand('minus one')).toBe('decrease_last');
    });

    it('detects confirm commands', () => {
      expect(detectVoiceCommand('บันทึก')).toBe('confirm');
      expect(detectVoiceCommand('ยืนยัน')).toBe('confirm');
      expect(detectVoiceCommand('save')).toBe('confirm');
    });
  });

  describe('detectSetFromSpeech', () => {
    const knownSets = new Set(['1', '2', '3', '4', '5', '6', 'P1', 'CC1', 'D23']);

    it('detects numbered sets with Thai prefix', () => {
      expect(detectSetFromSpeech('ชุด 1 เบอร์ 25', knownSets)).toBe('1');
      expect(detectSetFromSpeech('เซ็ต 2 เบอร์ 10', knownSets)).toBe('2');
      expect(detectSetFromSpeech('เซต 3 เบอร์ 5', knownSets)).toBe('3');
      expect(detectSetFromSpeech('ชุดหนึ่ง', knownSets)).toBe('1');
      expect(detectSetFromSpeech('ชุดสอง', knownSets)).toBe('2');
    });

    it('detects set names', () => {
      expect(detectSetFromSpeech('the first chapter', knownSets)).toBe('1');
      expect(detectSetFromSpeech('rise of the floodborn', knownSets)).toBe('2');
      expect(detectSetFromSpeech('into the inklands', knownSets)).toBe('3');
    });

    it('detects promo sets', () => {
      expect(detectSetFromSpeech('ชุด P1 เบอร์ 1', knownSets)).toBe('P1');
      expect(detectSetFromSpeech('เซ็ต ดี 23', knownSets)).toBe('D23');
      expect(detectSetFromSpeech('ชุด ซีซี 1', knownSets)).toBe('CC1');
    });
  });

  describe('detectQuantityFromSpeech', () => {
    it('detects numbers with Thai classifier', () => {
      expect(detectQuantityFromSpeech('เบอร์ 25 สองใบ')).toEqual({
        quantity: 2,
        cleanedText: 'เบอร์ 25',
      });
      expect(detectQuantityFromSpeech('เบอร์ 25 3 ใบ')).toEqual({
        quantity: 3,
        cleanedText: 'เบอร์ 25',
      });
      expect(detectQuantityFromSpeech('เอลซ่า สี่ใบ')).toEqual({
        quantity: 4,
        cleanedText: 'เอลซ่า',
      });
    });

    it('detects trailing multiplier', () => {
      expect(detectQuantityFromSpeech('เบอร์ 25 x2')).toEqual({
        quantity: 2,
        cleanedText: 'เบอร์ 25',
      });
    });

    it('defaults to 1 if no quantity specified', () => {
      expect(detectQuantityFromSpeech('เบอร์ 25')).toEqual({
        quantity: 1,
        cleanedText: 'เบอร์ 25',
      });
    });
  });

  describe('detectFinishFromSpeech', () => {
    it('detects foil in Thai and English', () => {
      expect(detectFinishFromSpeech('เบอร์ 25 ฟอยล์')).toEqual({
        finish: 'foil',
        cleanedText: 'เบอร์ 25',
      });
      expect(detectFinishFromSpeech('Elsa foil')).toEqual({
        finish: 'foil',
        cleanedText: 'Elsa',
      });
      expect(detectFinishFromSpeech('เบอร์ 25 โฮโล')).toEqual({
        finish: 'foil',
        cleanedText: 'เบอร์ 25',
      });
    });

    it('defaults to normal', () => {
      expect(detectFinishFromSpeech('เบอร์ 25')).toEqual({
        finish: 'normal',
        cleanedText: 'เบอร์ 25',
      });
    });
  });

  describe('detectCardNumberFromSpeech', () => {
    it('detects explicit number prefix', () => {
      expect(detectCardNumberFromSpeech('เบอร์ 25').number).toBe('25');
      expect(detectCardNumberFromSpeech('หมายเลข 42').number).toBe('42');
      expect(detectCardNumberFromSpeech('number 1').number).toBe('1');
      expect(detectCardNumberFromSpeech('#10').number).toBe('10');
    });

    it('detects Thai word number', () => {
      expect(detectCardNumberFromSpeech('เบอร์ ยี่สิบห้า').number).toBe('25');
      expect(detectCardNumberFromSpeech('เลข สิบ').number).toBe('10');
    });

    it('detects standalone digits', () => {
      expect(detectCardNumberFromSpeech('25').number).toBe('25');
    });
  });

  describe('parseVoiceInput integration', () => {
    it('parses set + number + quantity + finish', () => {
      const res = parseVoiceInput('ชุด 1 เบอร์ 25 สองใบ ฟอยล์', mockCatalog);
      expect(res.type).toBe('card');
      expect(res.matchedCard?.id).toBe('1-25');
      expect(res.quantity).toBe(2);
      expect(res.finish).toBe('foil');
    });

    it('parses card number within current active set', () => {
      const res = parseVoiceInput('เบอร์ 42 หนึ่งใบ', mockCatalog, '1');
      expect(res.type).toBe('card');
      expect(res.matchedCard?.id).toBe('1-42');
      expect(res.matchedCard?.name).toBe('Elsa');
      expect(res.quantity).toBe(1);
      expect(res.finish).toBe('normal');
    });

    it('parses Disney character name in Thai (e.g. เอลซ่า -> Elsa)', () => {
      const res = parseVoiceInput('เอลซ่า ฟอยล์', mockCatalog, '1');
      expect(res.type).toBe('card');
      expect(res.matchedCard?.name).toBe('Elsa');
      expect(res.finish).toBe('foil');
    });

    it('parses Disney character name in English', () => {
      const res = parseVoiceInput('Cinderella 2 cards', mockCatalog);
      expect(res.type).toBe('card');
      expect(res.matchedCard?.name).toBe('Cinderella');
      expect(res.quantity).toBe(2);
    });

    it('parses pure set change command', () => {
      const res = parseVoiceInput('ชุด 2', mockCatalog);
      expect(res.type).toBe('set_change');
      expect(res.newActiveSet).toBe('2');
    });

    it('parses voice commands (undo, clear, confirm)', () => {
      expect(parseVoiceInput('ลบล่าสุด', mockCatalog).type).toBe('command');
      expect(parseVoiceInput('ล้างทั้งหมด', mockCatalog).type).toBe('command');
      expect(parseVoiceInput('บันทึก', mockCatalog).type).toBe('command');
    });
  });
});
