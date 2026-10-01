/**
 * Rough text measuring for the phone hero, so short lines can be sized on the server to fit one line in
 * every language (no layout shift, no client measuring).
 */

/**
 * Rough width of a phrase in ems for the UI sans (Geist), erring slightly wide: narrow letters, capitals and
 * full-width (CJK, kana, Hangul) characters are weighed separately. Used only to size short phone lines.
 */
export function textEm(s: string) {
  let em = 0;
  for (const ch of s) {
    if (/[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch)) em += 1;
    else if (/[\s.,:;!|'’ijlft]/.test(ch)) em += 0.27;
    else if (ch === 'r') em += 0.4;
    else if (/[MWmw]/.test(ch)) em += 0.8;
    else if (ch !== ch.toLowerCase()) em += 0.66;
    else em += 0.56;
  }
  return em;
}

/**
 * A phone's hero box holds 290px on one line at 360px wide: 18.1em of its 16px text. `textEm` runs 2–5% wide,
 * so a phrase it puts at 18.05em is about 280px on screen.
 */
const ONE_LINE_EM = 18.05;

/**
 * The phone rotation of hero examples: only those that fit the box on one line, the full "Try “…”" form when
 * at least three do, otherwise the bare questions that fit, index-aligned with `examples`. The composer never
 * jumps between one and two lines.
 */
export function oneLineExamples(examples: string[]) {
  const fits = (s: string) => textEm(s) <= ONE_LINE_EM;
  let pick = examples.filter(fits);
  if (pick.length < 3) {
    // The question inside the quotation marks (“…”, « … », „…“, 「…」), without the "Try" around it.
    const bare = examples.map((e) => e.match(/[“«„「『"]\s*(.+?)\s*[”»“」』"]/)?.[1] ?? e).filter(fits);
    if (bare.length > pick.length) pick = bare;
  }
  if (!pick.length) return undefined;
  return examples.map((_, i) => pick[i % pick.length]);
}
