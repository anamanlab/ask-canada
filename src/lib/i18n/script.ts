/**
 * Writing-system detection (core, isomorphic). Used to answer in the language a person writes in and to
 * tag each block of an answer with the right `lang` + `dir`, so an English paragraph inside an Arabic page
 * keeps its Latin typography and an Arabic paragraph flows right-to-left.
 */
import { LOCALES, localeInfo, type Locale, type Script } from './config';

const RANGES: [Script, RegExp][] = [
  ['arabic', /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g],
  ['gurmukhi', /[਀-੿]/g],
  ['devanagari', /[ऀ-ॿ]/g],
  ['gujarati', /[઀-૿]/g],
  ['tamil', /[஀-௿]/g],
  ['hangul', /[가-힯ᄀ-ᇿ㄰-㆏]/g],
  ['hans', /[一-鿿㐀-䶿]/g],
  ['cyrillic', /[Ѐ-ӿ]/g],
  ['syllabics', /[᐀-ᙿᢰ-᣿]/g],
  ['latin', /[A-Za-zÀ-ɏ]/g],
];

/** Characters that only occur in Traditional Chinese (a small, high-frequency sample). */
const TRADITIONAL = /[護這個們麼請國發證體員會們題過關醫學點當後來與區]/;
/** Letters used in Urdu but not in Arabic or Persian. */
const URDU = /[ٹڈڑںےۓھ]/;
/** Letters used in Persian (and Urdu) but not in Arabic. */
const PERSIAN = /[پچژگکی]/;
/** Cyrillic letters used in Ukrainian but not Russian. */
const UKRAINIAN = /[іїєґІЇЄҐ]/;

/** Strip markdown links/URLs/code so they don't skew detection. */
const clean = (text: string) =>
  text
    .replace(/\[(\d{1,2})\]\([^)]*\)/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/`[^`]*`/g, '');

/** The dominant writing system of a text (null when it has no letters). */
export function scriptOf(text: string): Script | null {
  const t = clean(text);
  let best: Script | null = null;
  let max = 0;
  for (const [script, re] of RANGES) {
    const n = t.match(re)?.length ?? 0;
    // Non-Latin scripts win ties and near-ties: a few Latin letters (a program name, "CRA") shouldn't flip it.
    const weight = script === 'latin' ? n * 0.5 : n;
    if (weight > max) {
      max = weight;
      best = script;
    }
  }
  return best;
}

/**
 * Best locale for a text given the interface locale. Non-Latin scripts map to a language directly
 * (preferring the interface language when it uses the same script); Latin text keeps the interface
 * language when it is Latin, otherwise `latinFallback` (English by default).
 */
export function localeOfText(text: string, uiLocale: Locale, latinFallback: Locale = 'en'): Locale {
  const script = scriptOf(text);
  if (!script) return uiLocale;
  const ui = localeInfo(uiLocale);
  const sameScript = ui.script === script || (script === 'arabic' && ui.script === 'nastaliq') || (script === 'hans' && ui.script === 'hant');
  if (script === 'latin') return ui.script === 'latin' ? uiLocale : latinFallback;
  if (sameScript && script !== 'arabic' && script !== 'hans' && script !== 'cyrillic') return uiLocale;
  const t = clean(text);
  switch (script) {
    case 'arabic':
      if (URDU.test(t)) return 'ur';
      if (PERSIAN.test(t)) return uiLocale === 'ur' ? 'ur' : 'fa';
      return sameScript && (uiLocale === 'fa' || uiLocale === 'ur') && !/[ةى]/.test(t) ? uiLocale : 'ar';
    case 'hans':
      return TRADITIONAL.test(t) ? 'zh-Hant' : sameScript ? uiLocale : 'zh-Hans';
    case 'cyrillic':
      return UKRAINIAN.test(t) ? 'uk' : uiLocale === 'uk' && sameScript ? 'uk' : 'ru';
    case 'gurmukhi':
      return 'pa';
    case 'devanagari':
      return 'hi';
    case 'gujarati':
      return 'gu';
    case 'tamil':
      return 'ta';
    case 'hangul':
      return 'ko';
    case 'syllabics':
      return uiLocale === 'cr' ? 'cr' : 'iu';
    default:
      return uiLocale;
  }
}

export const dirOfLocale = (l: Locale) => LOCALES.find((x) => x.code === l)?.dir ?? 'ltr';
