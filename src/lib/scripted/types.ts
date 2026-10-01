/**
 * Scripted scenarios: deterministic answers used when SCRIPTED_AI=1 or the model is unavailable.
 * Tool calls in a scenario are REAL: they run through the same tool registry as the model would.
 *
 *   export default [
 *     {
 *       id: 'passport-renew',
 *       match: [/renew.*passport/i, /renouvel.*passeport/i],
 *       reply: { en: '# Good news…\n\nBody [1](https://www.canada.ca/…)', fr: '# Bonne nouvelle…' },
 *       toolCalls: [{ toolName: 'passportPlanner', input: { expiryMonth: '2027-03' } }],
 *       followUps: { en: ['Find a passport office near me'], fr: ['Trouver un bureau des passeports'] },
 *     },
 *   ] satisfies Scenario[];
 */

export type Bilingual<T> = { en: T; fr: T };

export type ScenarioToolCall = {
  toolName: string;
  /** Input for the tool; may be a function of the matched user text + language. */
  input: unknown | ((ctx: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => unknown);
};

export type Scenario = {
  id: string;
  /** Any match (EN or FR patterns) selects the scenario. Test against the latest user message. */
  match: RegExp[];
  /**
   * Keyword patterns in other languages and scripts (Arabic, Punjabi, Chinese, Spanish…) that route to the
   * same intent. The answer then opens with a short note in the person's language and continues in
   * English (or French), so the widget and official sources still come through.
   */
  matchIntl?: RegExp[];
  /**
   * Guards: never select this scenario when any of these match, even if `match` does. Use them where a
   * confident answer would be wrong for part of the audience (e.g. payment dates for someone who just
   * arrived and still has to apply).
   */
  exclude?: RegExp[];
  /** Full replies in languages other than EN/FR, keyed by locale (used by the fallback). */
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
  vars?: (ctx: { text: string; lang: 'en' | 'fr' }) => Record<string, string> | Promise<Record<string, string>>;
};
