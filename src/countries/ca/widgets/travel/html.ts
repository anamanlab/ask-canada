/**
 * HTML-to-text helpers shared by the feed parsers (parse-advisory.ts, parse-waits.ts). Pure, no DOM.
 * Server-side only in practice: nothing a renderer imports reaches this file.
 */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
  laquo: '«', raquo: '»', hellip: '…', szlig: 'ß', aelig: 'æ', oelig: 'œ', eth: 'ð', thorn: 'þ', deg: '°', middot: '·', bull: '•', euro: '€',
};
const MARKS: Record<string, string> = { acute: '\u0301', grave: '\u0300', circ: '\u0302', uml: '\u0308', tilde: '\u0303', cedil: '\u0327', ring: '\u030a' };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([A-Za-z])(acute|grave|circ|uml|tilde|cedil|ring);/g, (_, c: string, m: string) => (c + MARKS[m]).normalize('NFC'))
    .replace(/&([a-z]+);/gi, (all, n: string) => NAMED[n.toLowerCase()] ?? all);
}

/** Visible text of an HTML fragment, whitespace collapsed. */
export function textOf(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/\s+([,.;:!?)])/g, (m, p: string) => (p === ':' ? m.replace(/\s+/, ' ') : p))
    .trim();
}
