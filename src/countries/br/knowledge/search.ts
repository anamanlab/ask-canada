/**
 * Offline official-source search for the Brazil pack. Two indexes, one ranking:
 *
 *   1. `knowledge/pages.ts`     — the hand-verified core: the pages that carry most first questions.
 *   2. `servicos.index.ts`     — 1,600 entries from the Portal de Serviços' own export of every federal
 *                                 service (`scripts/fetch-servicos.mjs`). Names, catalogue keywords, the
 *                                 agency that publishes it, and whether it needs a gov.br account.
 *
 * Ranking is IDF-weighted keyword overlap. That matters more than it sounds: an unweighted count ranks
 * "segunda via do CNH" to a DARF receipt, because "segunda" and "via" appear on half the catalogue, while
 * "plano de saúde" should rank on the two words that are actually rare. Weighting each query term by how
 * rare it is in the index, and demanding that the entry match a real share of the query's weight, fixes both
 * the false positives and the wrong top hit.
 *
 * Deterministic and private — no third-party call — so `searchOfficialSources` always has something to return
 * before it reaches for a search engine, and a question can never cite a blog.
 */
import 'server-only';
import { MINISTRIES } from './index';
import { PAGES } from './pages';
import { SERVICES, serviceUrl } from './servicos.index';

type Entry = {
  url: string;
  /** The title to return, in the catalogue's language (Portuguese for services). */
  title: string;
  /** The same title in English, when the entry has one. */
  titleEn: string;
  /** Everything matchable, plus a title that may be in either language. */
  haystack: string;
  /** Text shown as the result's body: the page's keywords, or the service's agency and login requirement. */
  snippet: string;
  /** The body that publishes it: a name, not a domain. */
  source: string;
  /** True for the hand-verified core, which outranks the bulk catalogue at equal weight. */
  curated: boolean;
};

/**
 * Portuguese and English function words, so "qual é o prazo para declarar imposto de renda" matches on
 * "imposto" and not on every entry. Kept short: a Portuguese question carries its content words.
 */
const STOP = new Set(
  (
    'o a os as um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre ate entre ' +
    'como quando onde qual quais quanto eu meu minha ' +
    'voce pode posso preciso quero saber me diga ajuda favor obrigado obrigada ' +
    'the a an and or of to for in on my is are do does how what when where can i you your with from about ' +
    'need get new please tell help thanks thank'
  ).split(/\s+/),
);

/** Lowercase, strip diacritics, split to content words. Accents are optional in both the text and the index. */
const terms = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

/** A URL is worth more when it is the service's own page than when it is a ministry's home page. */
const slugOf = (url: string) => url.split('/').filter(Boolean).pop() ?? '';

/** The share of a query's weight an entry must match before it is worth showing at all. */
const MIN_SHARE = 0.5;
/**
 * A word in more than this share of the index is not evidence of anything, and is dropped before the query is
 * weighed. Measured on the 1,622-entry index: "solicitar" appears in 19.7% of it and "obter" in 16.3% — the
 * verbs the catalogue puts in front of almost every service name, so matching either says nothing about
 * which service is meant. Everything that carries meaning sits at or below 4% ("bolsa" 1.5%, "saude" 2.2%,
 * "imposto" 2.1%, "inss" 4.1%), which is why the cut is 6%.
 */
const RARE_ENOUGH = 0.06;

function build(): { entries: Entry[]; idf: Map<string, number>; df: Map<string, number>; size: number } {
  const pages: Entry[] = PAGES.map((p) => ({
    url: p.url,
    title: p.title.pt,
    titleEn: p.title.en,
    haystack: [p.title.pt, p.title.en, ...p.keywords, slugOf(p.url)].join(' '),
    snippet: p.keywords.join(', '),
    source: (p.ministry && MINISTRIES[p.ministry]?.name) ?? 'Governo Federal',
    curated: true,
  }));

  const services: Entry[] = SERVICES.map((s) => ({
    url: serviceUrl(s),
    title: s.name,
    // The catalogue is Portuguese-only, so it is matched in Portuguese whatever the interface language is —
    // a person who picked English and writes in Portuguese is still asking about "aposentadoria".
    titleEn: '',
    haystack: [s.name, s.keywords, s.agency, slugOf(s.slug).replace(/[-/_.]/g, ' ')].join(' '),
    snippet: [s.agency, s.keywords].join(' · '),
    source: s.agency,
    curated: false,
  }));

  const entries = [...pages, ...services];
  const docTerms = entries.map((e) => terms(e.haystack));
  // How many entries contain each word. A word in every entry is worthless as evidence.
  const df = new Map<string, number>();
  for (const list of docTerms) for (const t of new Set(list)) df.set(t, (df.get(t) ?? 0) + 1);
  const size = entries.length;
  const idf = new Map<string, number>();
  for (const [t, n] of df) idf.set(t, Math.log(1 + size / n));
  return { entries, idf, df, size };
}

type Built = ReturnType<typeof build>;
let index: Promise<Built> | null = null;

/**
 * `lang` is the language the person asked in, and decides which titles come back. Matching always folds
 * accents and always reads the Portuguese text too, because the service catalogue is pt-only.
 */
export async function searchLocalSources(query: string, lang = 'pt', limit = 6) {
  index ??= Promise.resolve(build());
  const { entries, idf, df, size } = await index;
  const maxWeight = Math.log(1 + size);
  const rareCap = size * RARE_ENOUGH;
  const q = [...new Set(terms(query))];
  if (!q.length) return [];

  // A term matches an entry when one contains the other, so "aposentadoria" finds "aposentar".
  // Short words are not allowed to prefix-match: "mei" must not find "meio" (Meio Ambiente) and
  // "casamento" must not find "casa" (Minha Casa). Exact matches always count; a prefix needs
  // enough letters to be evidence — 4 for the query term, 5 for the index term.
  const matched = (hay: string[], t: string) =>
    hay.some((h) => h === t || (t.length >= 4 && h.startsWith(t)) || (h.length >= 5 && t.startsWith(h)));

  // Weight the query over the words the index actually knows. A word that appears in no entry ("hoje",
  // "receber") carries no evidence that an entry lacks it, so letting it into the denominator would sink
  // every result for an otherwise exact question. Prefix-matched terms count as known, so "aposentar" finds
  // "aposentadoria".
  const present = new Set<string>();
  for (const e of entries) for (const h of terms(e.haystack)) present.add(h);
  // Keep a query word when the index knows it AND it is rare enough to mean something. Prefix matching counts,
  // so "aposentar" is known because "aposentadoria" is in the index.
  const known = q.filter((t) => {
    const dfMatched = [...present].some((h) => h.startsWith(t) || t.startsWith(h));
    if (!dfMatched) return false;
    const n = Math.min(...[...present].filter((h) => h.startsWith(t) || t.startsWith(h)).map((h) => df.get(h) ?? size));
    return n <= rareCap;
  });
  if (!known.length) return [];
  // A rare word the entry misses must still be able to sink it.
  const total = known.reduce((sum, t) => sum + (idf.get(t) ?? maxWeight), 0);

  return entries
    .map((e) => {
      const hay = terms(e.haystack);
      let got = 0;
      let inTitle = 0;
      let hits = 0;
      for (const t of known) {
        if (!matched(hay, t)) continue;
        const w = idf.get(t) ?? Math.log(1 + size);
        got += w;
        hits++;
        if (matched(terms(e.title), t) || matched(terms(e.titleEn), t)) inTitle += w;
      }
      const share = total > 0 ? got / total : 0;
      // A title match is stronger evidence than a keyword match, and a verified page beats the catalogue.
      const score = got + inTitle * 0.6 + (e.curated ? total * 0.08 : 0);
      return { e, share, score, hits };
    })
    // One word out of several is not enough; a single-word query needs only that word. A curated
    // page is the exception: it is hand-verified, so one strong term ("passaporte" in "passaporte
    // perdido") is enough — the modifier ("perdido", "menor", "idoso") does not name a second service,
    // and a rare modifier must not sink the page that owns the service.
    // Curated pages must have at least one hit; non-curated follow the standard share/hits rules.
    .filter((r) =>
      (r.e.curated && r.hits >= 1) || (r.share >= MIN_SHARE && (known.length < 2 || r.hits >= 2))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ e }) => ({
      url: e.url,
      title: (lang === 'en' && e.titleEn) || e.title,
      snippet: e.snippet.slice(0, 220),
      source: e.source,
    }));
}