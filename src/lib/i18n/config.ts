/**
 * Locale registry (core, country-agnostic).
 *
 * - `LOCALES` lists every language the platform knows about, with its endonym (name in its own
 *   script), writing direction and script (used to load the right font only when needed).
 * - A country pack decides which of these it offers (`pack.locales.supported`) and which are official.
 * - `ui: true` means the interface ships a catalog in that language (core `messages/<locale>.json` + the
 *   pack's). `ui: false` means answers come in that language while menus stay in English (with an honest
 *   note in that language, `answerNote`) until a catalog exists.
 * - `reviewed`: the catalog has been reviewed by native speakers (official languages always are).
 */

export type Locale =
  | 'en' | 'fr' | 'zh-Hans' | 'zh-Hant' | 'pa' | 'es' | 'ar' | 'tl' | 'ur' | 'fa' | 'hi'
  | 'pt' | 'it' | 'vi' | 'ko' | 'ta' | 'uk' | 'ru' | 'gu' | 'de' | 'iu' | 'cr';

export type Script =
  | 'latin' | 'arabic' | 'nastaliq' | 'gurmukhi' | 'devanagari' | 'tamil' | 'gujarati'
  | 'hans' | 'hant' | 'hangul' | 'cyrillic' | 'syllabics';

export type LocaleInfo = {
  code: Locale;
  /** Name of the language in that language. */
  endonym: string;
  /** English name, used for search and for the AI instruction. */
  english: string;
  dir: 'ltr' | 'rtl';
  script: Script;
  /** Intl base tag; the pack region is appended (e.g. `fr` + `CA` = `fr-CA`). May carry a `-u-` extension. */
  intl: string;
  /** True when the UI has a catalog. Otherwise UI text falls back to English. */
  ui: boolean;
  /** True when native speakers have reviewed the UI catalog (official languages always are). */
  reviewed?: boolean;
  /**
   * Answer-only languages (`ui: false`): "Answers in <language> · menus in English for now", written in
   * the language itself, shown under the header. Omitted where no reviewed wording exists yet (the English
   * line still shows).
   */
  answerNote?: string;
};

export const LOCALES: readonly LocaleInfo[] = [
  { code: 'en', endonym: 'English', english: 'English', dir: 'ltr', script: 'latin', intl: 'en', ui: true, reviewed: true },
  { code: 'fr', endonym: 'Français', english: 'French', dir: 'ltr', script: 'latin', intl: 'fr', ui: true, reviewed: true },
  { code: 'zh-Hans', endonym: '简体中文', english: 'Chinese (Simplified, Mandarin)', dir: 'ltr', script: 'hans', intl: 'zh-Hans', ui: true },
  { code: 'zh-Hant', endonym: '繁體中文', english: 'Chinese (Traditional, Cantonese)', dir: 'ltr', script: 'hant', intl: 'zh-Hant', ui: true },
  { code: 'pa', endonym: 'ਪੰਜਾਬੀ', english: 'Punjabi', dir: 'ltr', script: 'gurmukhi', intl: 'pa', ui: true },
  { code: 'es', endonym: 'Español', english: 'Spanish', dir: 'ltr', script: 'latin', intl: 'es', ui: false, answerNote: 'Respuestas en español · por ahora, menús en inglés' },
  { code: 'ar', endonym: 'العربية', english: 'Arabic', dir: 'rtl', script: 'arabic', intl: 'ar', ui: true },
  { code: 'tl', endonym: 'Tagalog', english: 'Tagalog (Filipino)', dir: 'ltr', script: 'latin', intl: 'fil', ui: false, answerNote: 'Mga sagot sa Tagalog · nasa Ingles muna ang mga menu' },
  { code: 'ur', endonym: 'اردو', english: 'Urdu', dir: 'rtl', script: 'nastaliq', intl: 'ur', ui: true },
  { code: 'fa', endonym: 'فارسی', english: 'Persian (Farsi)', dir: 'rtl', script: 'arabic', intl: 'fa-u-ca-gregory', ui: true },
  { code: 'hi', endonym: 'हिन्दी', english: 'Hindi', dir: 'ltr', script: 'devanagari', intl: 'hi', ui: false, answerNote: 'उत्तर हिन्दी में · मेनू अभी अंग्रेज़ी में हैं' },
  { code: 'pt', endonym: 'Português', english: 'Portuguese', dir: 'ltr', script: 'latin', intl: 'pt-BR', ui: true, reviewed: true },
  { code: 'it', endonym: 'Italiano', english: 'Italian', dir: 'ltr', script: 'latin', intl: 'it', ui: false, answerNote: 'Risposte in italiano · per ora, menu in inglese' },
  { code: 'vi', endonym: 'Tiếng Việt', english: 'Vietnamese', dir: 'ltr', script: 'latin', intl: 'vi', ui: false, answerNote: 'Trả lời bằng tiếng Việt · hiện tại menu bằng tiếng Anh' },
  { code: 'ko', endonym: '한국어', english: 'Korean', dir: 'ltr', script: 'hangul', intl: 'ko', ui: false, answerNote: '한국어로 답변 · 메뉴는 당분간 영어로 제공' },
  { code: 'ta', endonym: 'தமிழ்', english: 'Tamil', dir: 'ltr', script: 'tamil', intl: 'ta', ui: false, answerNote: 'பதில்கள் தமிழில் · மெனுக்கள் தற்போது ஆங்கிலத்தில்' },
  { code: 'uk', endonym: 'Українська', english: 'Ukrainian', dir: 'ltr', script: 'cyrillic', intl: 'uk', ui: false, answerNote: 'Відповіді українською · меню поки що англійською' },
  { code: 'ru', endonym: 'Русский', english: 'Russian', dir: 'ltr', script: 'cyrillic', intl: 'ru', ui: false, answerNote: 'Ответы на русском · меню пока на английском' },
  { code: 'gu', endonym: 'ગુજરાતી', english: 'Gujarati', dir: 'ltr', script: 'gujarati', intl: 'gu', ui: false, answerNote: 'જવાબો ગુજરાતીમાં · મેનુ હાલમાં અંગ્રેજીમાં' },
  { code: 'de', endonym: 'Deutsch', english: 'German', dir: 'ltr', script: 'latin', intl: 'de', ui: false, answerNote: 'Antworten auf Deutsch · Menüs vorerst auf Englisch' },
  { code: 'iu', endonym: 'ᐃᓄᒃᑎᑐᑦ', english: 'Inuktitut', dir: 'ltr', script: 'syllabics', intl: 'iu', ui: false },
  { code: 'cr', endonym: 'ᓀᐦᐃᔭᐍᐏᐣ', english: 'Plains Cree', dir: 'ltr', script: 'syllabics', intl: 'cr', ui: false },
] as const;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'lang';
export const THEME_COOKIE = 'theme';

const byCode = new Map(LOCALES.map((l) => [l.code, l]));

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && byCode.has(value as Locale);
}

export function localeInfo(locale: Locale): LocaleInfo {
  return byCode.get(locale) ?? byCode.get(DEFAULT_LOCALE)!;
}

export const dirOf = (locale: Locale) => localeInfo(locale).dir;

/** Base language of a locale (`zh-Hans` -> `zh`). */
export const baseOf = (locale: string) => locale.split('-')[0].toLowerCase();

/** Normalise a free-form tag (`fr-CA`, `zh-TW`, `pa-IN`) to a supported locale, or null. */
export function normalizeLocale(tag: string | null | undefined, supported: readonly Locale[]): Locale | null {
  if (!tag) return null;
  const t = tag.trim();
  const exact = supported.find((l) => l.toLowerCase() === t.toLowerCase());
  if (exact) return exact;
  const lower = t.toLowerCase();
  if (lower.startsWith('zh')) {
    const trad = /hant|tw|hk|mo|yue/.test(lower);
    const want: Locale = trad ? 'zh-Hant' : 'zh-Hans';
    return supported.includes(want) ? want : null;
  }
  if (lower.startsWith('fil')) return supported.includes('tl') ? 'tl' : null;
  const base = baseOf(t);
  return supported.find((l) => baseOf(l) === base) ?? null;
}

/** Pick the best supported locale from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null, supported: readonly Locale[]): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag, q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const hit = normalizeLocale(tag, supported);
    if (hit) return hit;
  }
  return null;
}

/** Full Intl tag for formatting (`fr` + `CA` -> `fr-CA`). */
export function intlTag(locale: Locale, region: string): string {
  const [base, ext] = localeInfo(locale).intl.split('-u-');
  // Government dates are Gregorian everywhere (`fa-u-ca-gregory`: Persian digits and month names, Gregorian calendar).
  const withExt = (tag: string) => (ext ? `${tag}-u-${ext}` : tag);
  if (base.includes('-')) return withExt(base); // zh-Hans etc. keep script subtag
  return withExt(`${base}-${region}`);
}
