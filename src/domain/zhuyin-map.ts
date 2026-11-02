import { Mode } from './types';

// Taiwan standard Daqian layout. 1st tone implicit; 2/3/4/light tones: 6/3/4/7
export const ZHUYIN_KEYS: Readonly<Record<string, string>> = Object.freeze({
  '1': 'ㄅ', 'q': 'ㄆ', 'a': 'ㄇ', 'z': 'ㄈ', '2': 'ㄉ', 'w': 'ㄊ', 's': 'ㄋ', 'x': 'ㄌ',
  'e': 'ㄍ', 'd': 'ㄎ', 'c': 'ㄏ', 'r': 'ㄐ', 'f': 'ㄑ', 'v': 'ㄒ', '5': 'ㄓ', 't': 'ㄔ',
  'g': 'ㄕ', 'b': 'ㄖ', 'y': 'ㄗ', 'h': 'ㄘ', 'n': 'ㄙ', 'u': 'ㄧ', 'j': 'ㄨ', 'm': 'ㄩ',
  '8': 'ㄚ', 'i': 'ㄛ', 'k': 'ㄜ', ',': 'ㄝ', '9': 'ㄞ', 'o': 'ㄟ', 'l': 'ㄠ', '.': 'ㄡ',
  '0': 'ㄢ', 'p': 'ㄣ', ';': 'ㄤ', '/': 'ㄥ', '-': 'ㄦ', '6': 'ˊ', '3': 'ˇ', '4': 'ˋ', '7': '˙',
});

export const ZHUYIN_KEY_ORDER = [
  '1', 'q', 'a', 'z', '2', 'w', 's', 'x', 'e', 'd', 'c', 'r', 'f', 'v',
  '5', 't', 'g', 'b', 'y', 'h', 'n', 'u', 'j', 'm', '8', 'i', 'k', ',',
  '9', 'o', 'l', '.', '0', 'p', ';', '/', '-', '6', '3', '4', '7',
].join('');

export const CODE_TO_PHYSICAL_KEY: Readonly<Record<string, string>> = Object.freeze({
  Digit1: '1', KeyQ: 'q', KeyA: 'a', KeyZ: 'z',
  Digit2: '2', KeyW: 'w', KeyS: 's', KeyX: 'x',
  KeyE: 'e', KeyD: 'd', KeyC: 'c',
  KeyR: 'r', KeyF: 'f', KeyV: 'v',
  Digit5: '5', KeyT: 't', KeyG: 'g', KeyB: 'b',
  KeyY: 'y', KeyH: 'h', KeyN: 'n',
  KeyU: 'u', KeyJ: 'j', KeyM: 'm',
  Digit8: '8', KeyI: 'i', KeyK: 'k', Comma: ',',
  Digit9: '9', KeyO: 'o', KeyL: 'l', Period: '.',
  Digit0: '0', KeyP: 'p', Semicolon: ';', Slash: '/',
  Minus: '-', Digit6: '6', Digit3: '3', Digit4: '4', Digit7: '7',
  Space: ' ',
});

export interface KeyInputEventLike {
  key: string;
  code?: string;
  isComposing?: boolean;
}

export const INVALID_KEY_NAMES = new Set(['Process', 'Dead', 'Unidentified']);

export function resolveKeyInput(e: KeyInputEventLike, mode: Mode): string | null {
  const isInvalidKey = Boolean(e.key && INVALID_KEY_NAMES.has(e.key));

  if (mode === 'zhuyin') {
    // 1. Direct Zhuyin symbol
    if (!isInvalidKey && e.key && e.key.length === 1 && !/^[a-zA-Z0-9,.;/\- ]$/.test(e.key)) {
      return e.key;
    }
    // 2. Physical key code resolution (e.g. 'KeyK' -> 'k' -> 'ㄜ')
    // Zhuyin Daqian layout relies primarily on physical key codes
    if (e.code && CODE_TO_PHYSICAL_KEY[e.code]) {
      const physical = CODE_TO_PHYSICAL_KEY[e.code];
      return ZHUYIN_KEYS[physical] ?? physical;
    }
    // 3. Fallback to single character key
    if (!isInvalidKey && e.key && e.key.length === 1) {
      const lower = e.key.toLowerCase();
      return ZHUYIN_KEYS[lower] ?? lower;
    }
    return null;
  }

  // Pinyin or English
  // Reject Dead, Process, Unidentified, or multi-character keys
  if (isInvalidKey) {
    return null;
  }
  if (e.key && e.key.length === 1) {
    return e.key;
  }
  return null;
}

export function normalizeInput(input: string, mode: Mode): string {
  if (mode === 'zhuyin') {
    return [...input.toLowerCase()].map((c) => ZHUYIN_KEYS[c] ?? c).join('');
  }
  if (mode === 'pinyin') {
    return input
      .replace(/[üǖǘǚǜ]/gi, 'v')
      .normalize('NFD')
      .replace(/u\u0308/gi, 'v')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\s']/g, '');
  }
  return input.toLowerCase();
}

export function evaluate(expected: string, typed: string) {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (expected[i] === typed[i]) correct++;
  }
  return {
    correct,
    errors: typed.length - correct,
    complete: typed === expected,
  };
}
