/**
 * Offline official-source search for the Canada pack: an index of every canada.ca / gc.ca URL in the
 * CDS AI Answers department guidance (curated, verified pages), scored by keyword overlap with the query.
 * Deterministic, private (no third-party calls) and always available; used by `searchOfficialSources`.
 */
import 'server-only';
import { DEPARTMENTS } from './index';

type Entry = { url: string; text: string; dept: string };
let index: Promise<Entry[]> | null = null;

const STOP = new Set(
  'the a an and or of to for in on my is are do does how what when where can i you your with from about get new need le la les de des du un une et ou pour dans sur mon ma mes est comment quoi quand où puis je vous votre avec'.split(
    ' ',
  ),
);
const terms = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

function build(): Promise<Entry[]> {
  return Promise.all(
    Object.entries(DEPARTMENTS).map(async ([dept, d]) => {
      const text = await d.load().catch(() => '');
      const out: Entry[] = [];
      for (const line of text.split('\n')) {
        for (const m of line.matchAll(/https?:\/\/[^\s)<>"'`,]+/g)) {
          out.push({ url: m[0].replace(/[.;:]+$/, ''), text: line.replace(/https?:\/\/\S+/g, '').replace(/[*#>`]/g, '').trim(), dept });
        }
      }
      return out;
    }),
  ).then((all) => {
    const seen = new Set<string>();
    return all.flat().filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
  });
}

export async function searchLocalSources(query: string, lang: 'en' | 'fr' = 'en', limit = 6) {
  index ??= build();
  const entries = await index;
  const q = terms(query);
  if (!q.length) return [];
  return entries
    .map((e) => {
      const hay = terms(`${e.text} ${decodeURIComponent(e.url).replace(/[-/_.]/g, ' ')}`);
      let score = 0;
      for (const t of q) if (hay.some((h) => h.startsWith(t) || t.startsWith(h))) score++;
      if (lang === 'fr' ? /\/fr[/.]/.test(e.url) : /\/en[/.]/.test(e.url)) score += 0.5;
      return { e, score };
    })
    .filter((r) => r.score >= Math.min(2, q.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ e }) => ({ url: e.url, title: e.text.slice(0, 120) || e.url, snippet: e.text.slice(0, 240), source: `CDS AI Answers · ${e.dept}` }));
}
