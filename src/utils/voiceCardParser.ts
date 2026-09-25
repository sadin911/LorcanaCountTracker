import type { FinishKey, LorcanaCard } from '../types/card';
import { normalizeCollectorNum } from './searchHelpers';
import { createCardMatcher } from './searchHelpers';

export interface VoiceParsedCardMatch {
  card: LorcanaCard;
  quantity: number;
  finish: FinishKey;
  confidence: number;
}

export interface VoiceCardParseResult {
  type: 'card' | 'set_change' | 'command' | 'unknown';
  command?: 'undo' | 'clear' | 'increase_last' | 'decrease_last' | 'confirm';
  newActiveSet?: string;
  matchedCard?: LorcanaCard;
  candidates?: LorcanaCard[];
  quantity: number;
  finish: FinishKey;
  parsedInfo: {
    rawText: string;
    detectedSet?: string;
    detectedNumber?: string;
    detectedName?: string;
    detectedQty?: number;
    detectedFinish?: FinishKey;
  };
  feedbackMessage?: string;
}

// Thai word to number converter (0 - 999)
const THAI_DIGIT_WORDS: Record<string, number> = {
  ศูนย์: 0,
  หนึ่ง: 1,
  สอง: 2,
  สาม: 3,
  สี่: 4,
  ห้า: 5,
  หก: 6,
  เจ็ด: 7,
  แปด: 8,
  เก้า: 9,
};

/**
 * Converts Thai number phrase like 'ยี่สิบห้า', 'หนึ่งร้อยยี่สิบ', 'สิบสอง', 'สาม' into a number.
 * Returns null if the string is not a recognized Thai number phrase.
 */
export function parseThaiNumberWords(raw: string): number | null {
  const str = raw.trim().replace(/\s+/g, '');
  if (!str) return null;

  // Direct single digit
  if (THAI_DIGIT_WORDS[str] !== undefined) {
    return THAI_DIGIT_WORDS[str];
  }

  let total = 0;
  let remaining = str;

  // Hundred (ร้อย)
  const hundredIdx = remaining.indexOf('ร้อย');
  if (hundredIdx !== -1) {
    const hundredPart = remaining.slice(0, hundredIdx);
    const multiplier = THAI_DIGIT_WORDS[hundredPart] || (hundredPart === '' ? 1 : null);
    if (multiplier === null) return null;
    total += multiplier * 100;
    remaining = remaining.slice(hundredIdx + 4);
    if (!remaining) return total;
  }

  // Tens (สิบ)
  const tenIdx = remaining.indexOf('สิบ');
  if (tenIdx !== -1) {
    const tenPart = remaining.slice(0, tenIdx);
    let multiplier = 1;
    if (tenPart === 'ยี่') {
      multiplier = 2;
    } else if (tenPart === '' || tenPart === 'หนึ่ง') {
      multiplier = 1;
    } else if (THAI_DIGIT_WORDS[tenPart] !== undefined) {
      multiplier = THAI_DIGIT_WORDS[tenPart];
    } else {
      return null;
    }
    total += multiplier * 10;
    remaining = remaining.slice(tenIdx + 3);
    if (!remaining) return total;
  }

  // Units
  if (remaining === 'เอ็ด') {
    total += 1;
  } else if (THAI_DIGIT_WORDS[remaining] !== undefined) {
    total += THAI_DIGIT_WORDS[remaining];
  } else if (remaining !== '') {
    return null;
  }

  return total > 0 ? total : null;
}

/**
 * Normalizes speech text for Thai/English card recognition.
 */
export function normalizeSpeechText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[,.?!'"’`#()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Known phonetic mappings for Lorcana Set Codes from speech-to-text.
 */
const SET_SPEECH_MAPPINGS: Record<string, string> = {
  // Set 1 (The First Chapter)
  'ชุด 1': '1',
  'ชุด1': '1',
  'ชุดหนึ่ง': '1',
  'เซ็ต 1': '1',
  'เซ็ต1': '1',
  'เซ็ตหนึ่ง': '1',
  'เซต 1': '1',
  'เซตหนึ่ง': '1',
  'เฟิร์ส แชปเตอร์': '1',
  'เฟิร์สแชปเตอร์': '1',
  'first chapter': '1',
  'the first chapter': '1',

  // Set 2 (Rise of the Floodborn)
  'ชุด 2': '2',
  'ชุด2': '2',
  'ชุดสอง': '2',
  'เซ็ต 2': '2',
  'เซ็ตสอง': '2',
  'เซต 2': '2',
  'เซตสอง': '2',
  'ฟลัดบอร์น': '2',
  'ฟลัดบอน': '2',
  'floodborn': '2',
  'rise of the floodborn': '2',

  // Set 3 (Into the Inklands)
  'ชุด 3': '3',
  'ชุด3': '3',
  'ชุดสาม': '3',
  'เซ็ต 3': '3',
  'เซ็ตสาม': '3',
  'เซต 3': '3',
  'เซตสาม': '3',
  'อิงค์แลนด์': '3',
  'อิงค์แลนด์ส': '3',
  'inklands': '3',
  'into the inklands': '3',

  // Set 4 (Ursula's Return)
  'ชุด 4': '4',
  'ชุด4': '4',
  'ชุดสี่': '4',
  'เซ็ต 4': '4',
  'เซ็ตสี่': '4',
  'เซต 4': '4',
  'เซตสี่': '4',
  'เออร์ซูล่า รีเทิร์น': '4',
  'ursula return': '4',
  "ursula's return": '4',

  // Set 5 (Shimmering Skies)
  'ชุด 5': '5',
  'ชุด5': '5',
  'ชุดห้า': '5',
  'เซ็ต 5': '5',
  'เซ็ตห้า': '5',
  'เซต 5': '5',
  'เซตห้า': '5',
  'ชิมเมอร์ริ่ง สกายส์': '5',
  'shimmering skies': '5',

  // Set 6 (Azurite Sea)
  'ชุด 6': '6',
  'ชุด6': '6',
  'ชุดหก': '6',
  'เซ็ต 6': '6',
  'เซ็ตหก': '6',
  'เซต 6': '6',
  'เซตหก': '6',
  'อซูไรต์ ซี': '6',
  'azurite sea': '6',

  // Set 7
  'ชุด 7': '7',
  'ชุดเจ็ด': '7',
  'เซ็ต 7': '7',
  'เซต 7': '7',
  'archipelago': '7',

  // Set 8 - 13
  'ชุด 8': '8',
  'ชุดแปด': '8',
  'ชุด 9': '9',
  'ชุดเก้า': '9',
  'ชุด 10': '10',
  'ชุดสิบ': '10',
  'ชุด 11': '11',
  'ชุดสิบเอ็ด': '11',
  'ชุด 12': '12',
  'ชุดสิบสอง': '12',
  'ชุด 13': '13',
  'ชุดสิบสาม': '13',
  'ชุด 14': '14',
  'ชุดสิบสี่': '14',
  'เซ็ต 14': '14',
  'เซ็ตสิบสี่': '14',
  'เซต 14': '14',
  'เซตสิบสี่': '14',
  'ไฮพีเรีย': '14',
  'ไฮพีเรีย ซิตี้': '14',
  'hyperia': '14',
  'hyperia city': '14',

  // Promo / Special Sets
  'พี 1': 'P1',
  'พีหนึ่ง': 'P1',
  'p 1': 'P1',
  'p1': 'P1',
  'พี 2': 'P2',
  'พีสอง': 'P2',
  'p 2': 'P2',
  'p2': 'P2',
  'พี 3': 'P3',
  'พีสาม': 'P3',
  'p 3': 'P3',
  'p3': 'P3',
  'พี 4': 'P4',
  'พีสี่': 'P4',
  'p 4': 'P4',
  'p4': 'P4',
  'ดี 23': 'D23',
  'd 23': 'D23',
  'd23': 'D23',
  'ซีซี 1': 'CC1',
  'cc 1': 'CC1',
  'cc1': 'CC1',
  'curator': 'CC1',
  'ชาเลนจ์': 'cp',
  'challenge': 'cp',
};

/**
 * Phonetic Thai dictionary for common Disney / Lorcana characters
 */
const DISNEY_CHARACTER_PHONETIC_MAPPINGS: Record<string, string> = {
  เอลซ่า: 'Elsa',
  เอลซา: 'Elsa',
  มิกกี้: 'Mickey Mouse',
  'มิกกี้ เมาส์': 'Mickey Mouse',
  มิกกี้เมาส์: 'Mickey Mouse',
  สติทช์: 'Stitch',
  สติช: 'Stitch',
  มาเลฟิเซนต์: 'Maleficent',
  ทิงเกอร์เบลล์: 'Tinker Bell',
  ทิงเกอร์เบล: 'Tinker Bell',
  ซินเดอเรลล่า: 'Cinderella',
  ซินเดอเรลลา: 'Cinderella',
  อะลาดิน: 'Aladdin',
  อาลาดิน: 'Aladdin',
  'โรบิน ฮู้ด': 'Robin Hood',
  'โรบิน ฮูด': 'Robin Hood',
  โรบินฮู้ด: 'Robin Hood',
  โมอาน่า: 'Moana',
  โมอานา: 'Moana',
  เออร์ซูล่า: 'Ursula',
  เออซูล่า: 'Ursula',
  เบลล์: 'Belle',
  เบล: 'Belle',
  เมาอิ: 'Maui',
  ซิมบ้า: 'Simba',
  ซิมบา: 'Simba',
  แอเรียล: 'Ariel',
  เอเรียล: 'Ariel',
  คูซโก้: 'Kuzco',
  คุซโก้: 'Kuzco',
  มู่หลาน: 'Mulan',
  มู่ลาน: 'Mulan',
  กู๊ฟฟี่: 'Goofy',
  กูฟฟี่: 'Goofy',
  'โดนัลด์ ดั๊ก': 'Donald Duck',
  โดนัลด์: 'Donald Duck',
  ปีเตอร์แพน: 'Peter Pan',
  'ปีเตอร์ แพน': 'Peter Pan',
  จีนี่: 'Genie',
  จาฟาร์: 'Jafar',
  จาฟา: 'Jafar',
  ฮาเดส: 'Hades',
  เฮอร์คิวลิส: 'Hercules',
  เฮอร์คิวลีส: 'Hercules',
  ราพันเซล: 'Rapunzel',
  ฟลินน์: 'Flynn Rider',
  'ฟลินน์ ไรเดอร์': 'Flynn Rider',
  'มาดาม มิม': 'Madam Mim',
  มาดามมิม: 'Madam Mim',
  เมอร์ลิน: 'Merlin',
  พิกเล็ต: 'Piglet',
  หมีพูห์: 'Winnie the Pooh',
  พูห์: 'Winnie the Pooh',
  ทิกเกอร์: 'Tigger',
  บีสต์: 'Beast',
  ออโรร่า: 'Aurora',
  สโนว์ไวท์: 'Snow White',
  พาวเวอร์ไลน์: 'Powerline',
  นิค: 'Nick Wilde',
  'นิค ไวลด์': 'Nick Wilde',
  นิคไวลด์: 'Nick Wilde',
  จูดี้: 'Judy Hopps',
  'จูดี้ ฮอปส์': 'Judy Hopps',
  จูดี้ฮอปส์: 'Judy Hopps',
  เบย์แม็กซ์: 'Baymax',
  เบย์แมกซ์: 'Baymax',
  ฮิโระ: 'Hiro Hamada',
  ฮิโร่: 'Hiro Hamada',
  วาซาบิ: 'Wasabi',
  ฮันนี่เลมอน: 'Honey Lemon',
  'ฮันนี่ เลมอน': 'Honey Lemon',
};

/**
 * Detects if the utterance is a Voice Command.
 */
export function detectVoiceCommand(
  text: string
): 'undo' | 'clear' | 'increase_last' | 'decrease_last' | 'confirm' | null {
  const norm = normalizeSpeechText(text);

  // Undo
  if (
    /^(?:ลบ|ลบล่าสุด|ลบอันล่าสุด|ลบใบสุดท้าย|ยกเลิก|ย้อนกลับ|undo|remove last|delete last)$/.test(
      norm
    ) ||
    norm.includes('ลบอันล่าสุด') ||
    norm.includes('ลบใบสุดท้าย')
  ) {
    return 'undo';
  }

  // Clear
  if (
    /^(?:ล้าง|ล้างหมด|ล้างทั้งหมด|เคลียร์|เคลียร์ทั้งหมด|clear|clear all|reset)$/.test(
      norm
    ) ||
    norm.includes('ล้างทั้งหมด') ||
    norm.includes('ล้างข้อมูล')
  ) {
    return 'clear';
  }

  // Increase Last
  if (
    /^(?:เพิ่ม|เพิ่มอีกใบ|เพิ่ม 1|อีกใบ|บวกหนึ่ง|บวก 1|add more|plus one)$/.test(
      norm
    ) ||
    norm.includes('เพิ่มอีกใบ') ||
    norm.includes('บวกอีกใบ')
  ) {
    return 'increase_last';
  }

  // Decrease Last
  if (
    /^(?:ลด|ลดหนึ่งใบ|ลด 1|ลบหนึ่งใบ|ลบ 1 ใบ|minus one)$/.test(norm) ||
    norm.includes('ลดหนึ่งใบ')
  ) {
    return 'decrease_last';
  }

  // Confirm / Import
  if (
    /^(?:บันทึก|นำเข้า|เซฟ|ยืนยัน|เรียบร้อย|save|import|confirm|done)$/.test(norm) ||
    norm.includes('บันทึกการ์ด') ||
    norm.includes('ยืนยันนำเข้า')
  ) {
    return 'confirm';
  }

  return null;
}

/**
 * Detects Set code from utterance.
 */
export function detectSetFromSpeech(
  text: string,
  knownSets: Set<string>
): string | null {
  const norm = normalizeSpeechText(text);

  // 1. Direct phonetic dictionary match
  for (const [phrase, code] of Object.entries(SET_SPEECH_MAPPINGS)) {
    if (norm.includes(phrase.toLowerCase())) {
      // Return known set matching case
      for (const s of knownSets) {
        if (s.toLowerCase() === code.toLowerCase()) return s;
      }
      return code;
    }
  }

  // 2. Pattern: "ชุด [set]" or "เซ็ต [set]" or "set [set]"
  const setPrefixMatch = norm.match(/(?:ชุด|เซ็ต|เซต|set|s)\s*[:=-]?\s*([a-z0-9_-]+)/i);
  if (setPrefixMatch) {
    const rawCand = setPrefixMatch[1].toLowerCase();
    // Check if rawCand is a Thai number word (e.g. "หนึ่ง" -> "1", "สอง" -> "2", "สิบสาม" -> "13")
    const thaiNum = parseThaiNumberWords(rawCand);
    if (thaiNum !== null) {
      const numStr = String(thaiNum);
      for (const s of knownSets) {
        if (s.toLowerCase() === numStr) return s;
      }
    }

    for (const s of knownSets) {
      if (s.toLowerCase() === rawCand) {
        return s;
      }
    }
    // Handle without hyphen/spaces
    for (const s of knownSets) {
      if (s.toLowerCase().replace(/[-_\s]/g, '') === rawCand.replace(/[-_\s]/g, '')) {
        return s;
      }
    }
  }

  // 3. Check direct mention of known set in text (for non-pure digits or with word boundaries)
  for (const s of knownSets) {
    const sLower = s.toLowerCase();
    // For pure digit sets (1-9), require explicit 'set' or 'ชุด' context to avoid matching card numbers
    if (/^\d+$/.test(sLower)) continue;

    const regex = new RegExp(`\\b${sLower}\\b`, 'i');
    if (regex.test(norm)) {
      return s;
    }
  }

  return null;
}

/**
 * Detects quantity from speech utterance.
 * e.g. "สองใบ" -> 2, "3 ใบ" -> 3, "สี่แผ่น" -> 4, "x2" -> 2
 */
export function detectQuantityFromSpeech(text: string): {
  quantity: number;
  cleanedText: string;
} {
  let cleaned = text;

  // Pattern 1: Multiplier 'x<num>' or 'คูณ <num>' or '*<num>' (e.g. "x2", "คูณ 3")
  const xMatch = cleaned.match(/(?:x|คูณ|\*)\s*(\d+)/i);
  if (xMatch) {
    const qty = parseInt(xMatch[1], 10);
    cleaned = cleaned.replace(xMatch[0], ' ').trim();
    if (qty > 0 && qty <= 99) {
      return { quantity: qty, cleanedText: cleaned };
    }
  }

  // Pattern 2: Number + ใบ/แผ่น/copies/cards (e.g. "2 ใบ", "3 copies", "1 card")
  const numUnitMatch = cleaned.match(/(\d+)\s*(?:ใบ|แผ่น|copies|copy|cards|card)(?![a-zA-Z0-9])/i);
  if (numUnitMatch) {
    const qty = parseInt(numUnitMatch[1], 10);
    cleaned = cleaned.replace(numUnitMatch[0], ' ').trim();
    if (qty > 0 && qty <= 99) {
      return { quantity: qty, cleanedText: cleaned };
    }
  }

  // Pattern 3: Thai word + ใบ/แผ่น (e.g. "สองใบ", "สามใบ", "สี่ใบ", "หนึ่งใบ")
  const thaiWordMatch = cleaned.match(
    /(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|ยี่สิบ)\s*(?:ใบ|แผ่น)/
  );
  if (thaiWordMatch) {
    const num = parseThaiNumberWords(thaiWordMatch[1]);
    cleaned = cleaned.replace(thaiWordMatch[0], ' ').trim();
    if (num && num > 0) {
      return { quantity: num, cleanedText: cleaned };
    }
  }

  return { quantity: 1, cleanedText: cleaned };
}

/**
 * Detects Lorcana finish from speech utterance.
 * Lorcana has two finishes: 'normal' and 'foil'.
 */
export function detectFinishFromSpeech(text: string): {
  finish: FinishKey;
  cleanedText: string;
} {
  const norm = text.toLowerCase();
  let cleaned = text;

  // Foil / Holo matches
  if (/ฟอยล์|ฟอย|โฮโล|holo|foil|เงา|ชิมเมอร์/.test(norm)) {
    cleaned = cleaned
      .replace(/ฟอยล์|ฟอย|โฮโล|holo|foil|เงา|ชิมเมอร์/gi, ' ')
      .trim();
    return { finish: 'foil', cleanedText: cleaned };
  }

  // Explicit normal / non-foil
  if (/ธรรมดา|ไม่ฟอยล์|normal|non foil/.test(norm)) {
    cleaned = cleaned.replace(/ธรรมดา|ไม่ฟอยล์|normal|non foil/gi, ' ').trim();
    return { finish: 'normal', cleanedText: cleaned };
  }

  return { finish: 'normal', cleanedText: cleaned };
}

/**
 * Detects card number from speech text.
 * e.g. "เบอร์ 25", "เลข 025", "25/204", "เบอร์ยี่สิบห้า", "number 25"
 */
export function detectCardNumberFromSpeech(text: string): {
  number: string | null;
  cleanedText: string;
} {
  let cleaned = text;

  // 1. Explicit pattern: 'เบอร์ 25', 'หมายเลข 25', 'เลข 25', 'number 25', 'no. 25', '#25'
  const explicitMatch = cleaned.match(
    /(?:เบอร์|หมายเลข|เลข|ลำดับที่|number|no\.?|#)\s*([0-9]{1,4}(?:[-/][0-9]{1,4})?|[a-z0-9_-]+)/i
  );
  if (explicitMatch) {
    const rawNum = explicitMatch[1];
    cleaned = cleaned.replace(explicitMatch[0], ' ').trim();
    return { number: rawNum, cleanedText: cleaned };
  }

  // 2. Pattern: 'เบอร์ <คำอ่านไทย>' e.g. 'เบอร์ ยี่สิบห้า', 'เลข หนึ่งร้อย'
  const explicitThaiWordMatch = cleaned.match(
    /(?:เบอร์|หมายเลข|เลข)\s*([หนึ่งสองสามสี่ห้าหกเจ็ดแปดเก้าสิบเอ็ดยี่ร้อย]+)/
  );
  if (explicitThaiWordMatch) {
    const num = parseThaiNumberWords(explicitThaiWordMatch[1]);
    if (num !== null) {
      cleaned = cleaned.replace(explicitThaiWordMatch[0], ' ').trim();
      return { number: String(num), cleanedText: cleaned };
    }
  }

  // 3. Fraction collector number pattern: '025/204' or '025-204'
  const fractionMatch = cleaned.match(/\b([0-9]{1,4}[-/][0-9]{1,4})\b/);
  if (fractionMatch) {
    const rawNum = fractionMatch[1];
    cleaned = cleaned.replace(fractionMatch[0], ' ').trim();
    return { number: rawNum, cleanedText: cleaned };
  }

  // 4. Standalone digits in text e.g. '25' or '025'
  const standaloneDigits = cleaned.match(/\b([0-9]{1,4})\b/);
  if (standaloneDigits) {
    const rawNum = standaloneDigits[1];
    cleaned = cleaned.replace(standaloneDigits[0], ' ').trim();
    return { number: rawNum, cleanedText: cleaned };
  }

  // 5. Standalone Thai number word phrase e.g. 'ยี่สิบห้า', 'หนึ่งร้อยยี่สิบ', 'สิบสอง'
  const thaiWordTokens = cleaned.match(/([หนึ่งสองสามสี่ห้าหกเจ็ดแปดเก้าสิบเอ็ดยี่ร้อย]+)/);
  if (thaiWordTokens) {
    const num = parseThaiNumberWords(thaiWordTokens[1]);
    if (num !== null) {
      cleaned = cleaned.replace(thaiWordTokens[0], ' ').trim();
      return { number: String(num), cleanedText: cleaned };
    }
  }

  return { number: null, cleanedText: cleaned };
}

/**
 * Main Voice Card Parsing Engine for Lorcana.
 * Analyzes spoken text and extracts card matches, set context, or voice commands.
 */
export function parseVoiceInput(
  rawTranscript: string,
  catalog: LorcanaCard[],
  currentActiveSet?: string | null
): VoiceCardParseResult {
  const norm = normalizeSpeechText(rawTranscript);

  if (!norm) {
    return {
      type: 'unknown',
      quantity: 1,
      finish: 'normal',
      parsedInfo: { rawText: rawTranscript },
    };
  }

  // 1. Check if it is a Voice Command
  const command = detectVoiceCommand(norm);
  if (command) {
    let msg = '';
    switch (command) {
      case 'undo':
        msg = 'ยกเลิกการ์ดล่าสุดแล้ว';
        break;
      case 'clear':
        msg = 'ล้างรายการการ์ดทั้งหมดแล้ว';
        break;
      case 'increase_last':
        msg = 'เพิ่มจำนวนการ์ดล่าสุดแล้ว (+1)';
        break;
      case 'decrease_last':
        msg = 'ลดจำนวนการ์ดล่าสุดแล้ว (-1)';
        break;
      case 'confirm':
        msg = 'ยืนยันนำเข้าการ์ดเข้าสมุดสะสม';
        break;
    }
    return {
      type: 'command',
      command,
      quantity: 1,
      finish: 'normal',
      parsedInfo: { rawText: rawTranscript },
      feedbackMessage: msg,
    };
  }

  // Collect known sets from catalog
  const knownSets = new Set<string>();
  const cardLookupBySetAndNum = new Map<string, LorcanaCard>();

  for (const card of catalog) {
    knownSets.add(card.setCode);
    const sLower = card.setCode.toLowerCase();
    const rawCn = card.collectorNumber || '';
    const normCn = normalizeCollectorNum(rawCn);
    const prefix = normalizeCollectorNum(rawCn.split(/[-/]/)[0]);

    if (normCn) cardLookupBySetAndNum.set(`${sLower}:${normCn}`, card);
    if (prefix) cardLookupBySetAndNum.set(`${sLower}:${prefix}`, card);
  }

  // 2. Check Set detection
  const detectedSet = detectSetFromSpeech(norm, knownSets);
  const effectiveSet = detectedSet || currentActiveSet || null;

  // 3. Extract quantity & finish
  const { quantity, cleanedText: textAfterQty } = detectQuantityFromSpeech(norm);
  const { finish, cleanedText: textAfterFinish } = detectFinishFromSpeech(textAfterQty);

  // 4. Check if the utterance is purely a Set Change command (e.g. "ชุด 1", "เซ็ต 2", "set 3")
  const isPureSetChange =
    detectedSet &&
    (norm.startsWith('ชุด') || norm.startsWith('เซ็ต') || norm.startsWith('เซต') || norm.startsWith('set')) &&
    !/\d{1,4}/.test(textAfterFinish.replace(detectedSet.toLowerCase(), '')) &&
    textAfterFinish.replace(detectedSet.toLowerCase(), '').trim().length <= 4;

  if (isPureSetChange) {
    return {
      type: 'set_change',
      newActiveSet: detectedSet,
      quantity: 1,
      finish: 'normal',
      parsedInfo: {
        rawText: rawTranscript,
        detectedSet,
      },
      feedbackMessage: `สลับเป็นชุด ${detectedSet} แล้ว`,
    };
  }

  // 5. Extract Card Number
  // Remove detected set string from text to avoid false number matches (e.g. "set 1" -> card 1)
  let textForNum = textAfterFinish;
  if (detectedSet) {
    textForNum = textForNum.replace(new RegExp(`\\b${detectedSet}\\b`, 'i'), ' ');
  }

  const { number: detectedNumber, cleanedText: remainingText } =
    detectCardNumberFromSpeech(textForNum);

  // Case A: We have Set + Number
  if (effectiveSet && detectedNumber) {
    const normNum = normalizeCollectorNum(detectedNumber);
    const prefixNum = normalizeCollectorNum(detectedNumber.split(/[-/]/)[0]);
    const setKey = effectiveSet.toLowerCase();

    const matched =
      cardLookupBySetAndNum.get(`${setKey}:${normNum}`) ||
      cardLookupBySetAndNum.get(`${setKey}:${prefixNum}`);

    if (matched) {
      const displayName = matched.version ? `${matched.name} – ${matched.version}` : matched.name;
      const finishText = finish === 'foil' ? ' (Foil)' : '';
      return {
        type: 'card',
        matchedCard: matched,
        quantity,
        finish,
        parsedInfo: {
          rawText: rawTranscript,
          detectedSet: effectiveSet,
          detectedNumber,
          detectedQty: quantity,
          detectedFinish: finish,
        },
        feedbackMessage: `เพิ่ม ${displayName} #${detectedNumber} (${effectiveSet})${finishText} x${quantity}`,
      };
    }
  }

  // Case B: We have a Character / Card Name spoken (Thai or English)
  // Check Thai phonetic character replacement
  let searchPhrase = remainingText.trim() || norm;
  for (const [thaiWord, enName] of Object.entries(DISNEY_CHARACTER_PHONETIC_MAPPINGS)) {
    if (searchPhrase.includes(thaiWord)) {
      searchPhrase = searchPhrase.replace(thaiWord, enName);
    }
  }

  if (searchPhrase.length >= 2) {
    const matcher = createCardMatcher(searchPhrase);

    // If active set is present, search within active set first
    let matchingCards: LorcanaCard[] = [];
    if (effectiveSet) {
      matchingCards = catalog.filter(
        (c) => c.setCode.toLowerCase() === effectiveSet.toLowerCase() && matcher(c)
      );
    }

    // If nothing found in active set or no active set, search across all sets
    if (matchingCards.length === 0) {
      matchingCards = catalog.filter(matcher);
    }

    if (matchingCards.length > 0) {
      const primaryMatch = matchingCards[0];
      const candidates = matchingCards.length > 1 ? matchingCards.slice(0, 8) : undefined;
      const displayName = primaryMatch.version
        ? `${primaryMatch.name} – ${primaryMatch.version}`
        : primaryMatch.name;
      const finishText = finish === 'foil' ? ' (Foil)' : '';

      return {
        type: 'card',
        matchedCard: primaryMatch,
        candidates,
        quantity,
        finish,
        parsedInfo: {
          rawText: rawTranscript,
          detectedSet: effectiveSet || primaryMatch.setCode,
          detectedNumber: detectedNumber || primaryMatch.collectorNumber,
          detectedName: primaryMatch.name,
          detectedQty: quantity,
          detectedFinish: finish,
        },
        feedbackMessage: `เพิ่ม ${displayName} (${primaryMatch.setCode})${finishText} x${quantity}`,
      };
    }
  }

  // Case C: Utterance had a set change along with unrecognized card content
  if (detectedSet) {
    return {
      type: 'set_change',
      newActiveSet: detectedSet,
      quantity: 1,
      finish: 'normal',
      parsedInfo: {
        rawText: rawTranscript,
        detectedSet,
      },
      feedbackMessage: `สลับเป็นชุด ${detectedSet} แล้ว`,
    };
  }

  // Unrecognized input
  return {
    type: 'unknown',
    quantity,
    finish,
    parsedInfo: {
      rawText: rawTranscript,
      detectedNumber: detectedNumber || undefined,
      detectedQty: quantity,
      detectedFinish: finish,
    },
    feedbackMessage: `ไม่พบการ์ดที่ตรงกับ "${rawTranscript}"`,
  };
}
