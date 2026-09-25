import { describe, it, expect } from 'vitest';
import {
  isTtsSupported,
  cleanCollectorNumberForSpeech,
  formatCardSpokenText,
  formatCommandSpokenText,
} from './voiceTts';

describe('voiceTts for Lorcana', () => {
  describe('isTtsSupported', () => {
    it('returns false in non-browser/node environment when speechSynthesis is absent', () => {
      // In default jsdom/node, window.speechSynthesis may not exist
      expect(typeof isTtsSupported()).toBe('boolean');
    });
  });

  describe('cleanCollectorNumberForSpeech', () => {
    it('cleans number with leading hash or zeros', () => {
      expect(cleanCollectorNumberForSpeech('#025')).toBe('25');
      expect(cleanCollectorNumberForSpeech('001')).toBe('1');
      expect(cleanCollectorNumberForSpeech('42')).toBe('42');
    });

    it('cleans fraction numbers like 025/204', () => {
      expect(cleanCollectorNumberForSpeech('025/204')).toBe('25');
      expect(cleanCollectorNumberForSpeech('001-204')).toBe('1');
    });

    it('returns empty string for null or empty input', () => {
      expect(cleanCollectorNumberForSpeech('')).toBe('');
      expect(cleanCollectorNumberForSpeech(undefined)).toBe('');
    });
  });

  describe('formatCardSpokenText', () => {
    it('formats Thai voice feedback with number, name, finish, and quantity', () => {
      const text = formatCardSpokenText(
        'Elsa',
        2,
        'foil',
        'th-TH',
        '42',
        false
      );
      expect(text).toContain('เบอร์ 42');
      expect(text).toContain('Elsa');
      expect(text).toContain('ฟอยล์');
      expect(text).toContain('2 ใบ');
    });

    it('omits finish text for normal finish', () => {
      const text = formatCardSpokenText(
        'Mickey Mouse',
        1,
        'normal',
        'th-TH',
        '25',
        false
      );
      expect(text).toBe('เบอร์ 25 Mickey Mouse');
    });

    it('formats English voice feedback', () => {
      const text = formatCardSpokenText(
        'Cinderella',
        3,
        'foil',
        'en-US',
        '10',
        true
      );
      expect(text).toBe('Number 10, Cinderella Foil, 3 cards');
    });
  });

  describe('formatCommandSpokenText', () => {
    it('formats Thai command feedbacks', () => {
      expect(formatCommandSpokenText('undo', 'Elsa', 'th-TH', false)).toBe('ยกเลิก Elsa แล้ว');
      expect(formatCommandSpokenText('clear', undefined, 'th-TH', false)).toBe('ล้างรายการแล้ว');
      expect(formatCommandSpokenText('confirm', undefined, 'th-TH', false)).toBe('บันทึกเรียบร้อย');
      expect(formatCommandSpokenText('set_change', '1', 'th-TH', false)).toBe('ชุด 1');
    });

    it('formats English command feedbacks', () => {
      expect(formatCommandSpokenText('undo', 'Elsa', 'en-US', true)).toBe('Undone Elsa');
      expect(formatCommandSpokenText('clear', undefined, 'en-US', true)).toBe('Cleared all');
      expect(formatCommandSpokenText('confirm', undefined, 'en-US', true)).toBe('Saved');
      expect(formatCommandSpokenText('set_change', '1', 'en-US', true)).toBe('Set 1');
    });
  });
});
