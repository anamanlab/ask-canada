/**
 * Scripted scenarios: deterministic answers used when SCRIPTED_AI=1 or the model is unavailable.
 * Tool calls in a scenario are REAL: they run through the same tool registry as the model would.
 *
 *   export default [
 *     {
 *       id: 'passport-renew',
 *       match: [/renew.*passport/i, /renouvel.*passeport/i, /renovar.*passaporte/i],
 *       reply: { en: '# Good news…\n\nBody [1](https://www.canada.ca/…)', fr: '# Bonne nouvelle…', pt: '# Boa notícia…' },
 *       toolCalls: [{ toolName: 'passportPlanner', input: { expiryMonth: '2027-03' } }],
 *       followUps: { en: ['Find a passport office near me'], fr: ['Trouver un bureau des passeports'], pt: ['Onde fica um posto de passaporte?'] },
 *     },
 *   ] satisfies Scenario[];
 */
import type { Locale } from '@/lib/i18n/config';

/**
 * Copy in the pack's official languages. `en` is required (it is the source language and the fallback);
 * every other key is one of `pack.locales.official` (`fr` for Canada, `pt` for Brazil), typed as a plain
 * record so a pack can add or drop languages without touching core.
 */
export type Bilingual<T> = { en: T } & Partial<Record<string, T>>;

/** Read `copy` in `lang`, falling back to English. Returns undefined only when both are missing. */
export function pickCopy<T>(copy: Bilingual<T> | undefined, lang: string): T | undefined {
  return copy?.[lang] ?? copy?.en;
}

/** Apply `fn` to every language `copy` actually has, leaving it absent elsewhere. */
export function mapCopy<T>(copy: Bilingual<T>, fn: (value: T) => T): Bilingual<T> {
  const out: Record<string, T> = {};
  for (const [lang, value] of Object.entries(copy)) if (value !== undefined) out[lang] = fn(value as T);
  return out as Bilingual<T>;
}

export type ScenarioToolCall = {
  toolName: string;
  /** Input for the tool; may be a function of the matched user text + language. */
  input: unknown | ((ctx: ScenarioCtx) => unknown);
};

/**
 * What a scenario's `vars` / `input` callbacks receive.
 *
 * - `locale` is the language the scripted answer is being written in — always the real one.
 * - `lang` is that language narrowed to the historical EN/FR pair, kept so existing pack code that branches
 *   on `lang === 'fr'` keeps compiling untouched. A pack whose official languages are not English and
 *   French (`pt` for Brazil) reads `locale` instead; `lang` falls back to `'en'` for those.
 */
export type Lang = 'en' | 'fr';
export type ScenarioCtx = { text: string; locale: Locale; lang: Lang; timeZone?: string };

export type Scenario = {
  id: string;
  /** Any match (one pattern per language the pack is reviewed in) selects the scenario. Test against the latest user message. */
  match: RegExp[];
  /**
   * Keyword patterns in other languages and scripts (Arabic, Punjabi, Chinese, Spanish…) that route to the
   * same intent. The answer then opens with a short note in the person's language and continues in the
   * pack's official language, so the widget and official sources still come through.
   */
  matchIntl?: RegExp[];
  /**
   * Guards: never select this scenario when any of these match, even if `match` does. Use them where a
   * confident answer would be wrong for part of the audience (e.g. payment dates for someone who just
   * arrived and still has to apply).
   */
  exclude?: RegExp[];
  /** Full replies in languages other than the pack's official ones, keyed by locale (used by the fallback). */
  replyIntl?: Partial<Record<string, string>>;
  /** ISO date this scenario's facts were verified (defaults to the pack's `showcase.factsChecked`). */
  checked?: string;
  /** Higher wins when several scenarios match (default 0). */
  priority?: number;
  /**
   * Markdown answer. Start with a one-sentence verdict as `# Heading` (rendered as the serif lead;
   * wrap at most one phrase in *italics* for emphasis). Cite with numbered links: `[1](https://…)`.
   */
  reply: Bilingual<string>;
  /** Text streamed after the tool calls (optional). */
  after?: Bilingual<string>;
  toolCalls?: ScenarioToolCall[];
  followUps?: Bilingual<string[]>;
  /**
   * Values for `{placeholders}` in reply/after text, computed from the user's message. May be async
   * (e.g. to look up live data); keep it fast and never throw.
   */
  vars?: (ctx: ScenarioCtx) => Record<string, string> | Promise<Record<string, string>>;
};
