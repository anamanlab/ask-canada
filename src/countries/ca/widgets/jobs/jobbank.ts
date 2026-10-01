/**
 * Pure parsers for Job Bank pages (isomorphic, no network). The markup was checked on 2026-09-30:
 *   search results  <article …><a href="/jobsearch/jobposting/<id>…" class="resultJobItem"> … <li class="date|business|location|salary">
 *   result count    <span class="found" id="results-count">1,144</span>
 *   province facet  <label for="provitem_AB">Alberta <span class="badge">50…
 *   wages table     <th …>Region</th> <td headers="… header_min|header_avg|header_max">30.00
 *   outlook table   <th id="header_ON">…</th> … <span class="star-rating-5"></span>
 * Every parser tolerates missing pieces and returns empty data rather than throwing.
 */
import { PROVINCE_CODES, jobPostingUrl, type Lang, type Province } from './data';
import { mendApostrophes } from './text';
import type { JobPosting, Outlook, Salary, SalaryPeriod, WageRow } from './types';

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', eacute: 'é', egrave: 'è', agrave: 'à', ecirc: 'ê', ccedil: 'ç', ocirc: 'ô', icirc: 'î', ndash: '–', mdash: '—' };
export function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENT[n.toLowerCase()] ?? m);
}
const text = (html: string) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------------------- dates */

const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "September 21, 2026" | "25 septembre 2026" | "1er octobre 2026" → "2026-09-21". */
export function parseJobBankDate(s: string): string | undefined {
  const t = s.toLowerCase().replace(/\s+/g, ' ').trim();
  let m = t.match(/^([a-zéû]+) (\d{1,2}), (\d{4})$/);
  if (m) {
    const mo = MONTHS_EN.indexOf(m[1]);
    if (mo >= 0) return `${m[3]}-${pad(mo + 1)}-${pad(Number(m[2]))}`;
  }
  m = t.match(/^(\d{1,2})(?:er)? ([a-zéû]+) (\d{4})$/);
  if (m) {
    const mo = MONTHS_FR.indexOf(m[2]);
    if (mo >= 0) return `${m[3]}-${pad(mo + 1)}-${pad(Number(m[1]))}`;
  }
  return undefined;
}

/* ---------------------------------------------------------------- salary */

const num = (s: string, lang: Lang) => {
  const clean = lang === 'fr' ? s.replace(/[\s  ]/g, '').replace(',', '.') : s.replace(/,/g, '');
  const n = Number(clean);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** "$33.00 to $42.00 hourly (to be negotiated)" | "33,00 $ à 42,00 $ de l'heure (à négocier)". */
export function parseSalary(raw: string, lang: Lang): Salary | undefined {
  const s = raw.replace(/^(salary|salaire)\s*:?\s*/i, '').trim();
  if (!s) return undefined;
  const amounts = lang === 'fr'
    ? [...s.matchAll(/(\d[\d\s  ]*(?:,\d+)?)\s*\$/g)].map((m) => num(m[1], 'fr'))
    : [...s.matchAll(/\$\s*(\d[\d,]*(?:\.\d+)?)/g)].map((m) => num(m[1], 'en'));
  const vals = amounts.filter((n): n is number => n != null);
  const period: SalaryPeriod | undefined = /hour|heure/i.test(s)
    ? 'hour'
    : /annual|year|année|annee|\ban\b/i.test(s)
      ? 'year'
      : /week|semaine/i.test(s)
        ? 'week'
        : /month|mois/i.test(s)
          ? 'month'
          : undefined;
  const negotiable = /negotiat|négoci|negoci/i.test(s);
  // Only structure it when we understood both the amount and the period; otherwise show Job Bank's words.
  if (!vals.length || !period || /band|step|échelon|echelon/i.test(s)) return { raw: s, negotiable };
  const min = vals[0];
  const max = vals[1] && vals[1] !== vals[0] ? vals[1] : undefined;
  const top = max ?? min;
  // Amounts we can't trust at all: show Job Bank's own words.
  if ((period === 'hour' && min < 1) || (max != null && max < min)) return { raw: s, negotiable };
  // The wrong period on real amounts ("$26 to $30 a year", "$4,500 an hour"): keep the amounts, drop the
  // period (a $26-a-year job would read as our mistake), and sort them last.
  const wrongPeriod = (period === 'year' && top < 1000) || (period === 'hour' && top > 500) || (period === 'month' && top < 100) || (period === 'week' && top < 50);
  if (wrongPeriod) return { min, max, negotiable, raw: s };
  return { min, max, period, negotiable, raw: s };
}

/* ---------------------------------------------------------------- search results */

/**
 * One place format per page: Job Bank writes most places "Halifax (NS)" but some partner postings
 * "Moncton, NB". Both languages use the same two-letter codes, so everything becomes "City (PR)".
 */
export function normalizeLocation(loc: string): string {
  const m = loc.match(/^(.+?),\s*([A-Z]{2})$/);
  return m && (PROVINCE_CODES as string[]).includes(m[2]) ? `${m[1]} (${m[2]})` : loc;
}

/**
 * Same posting listed twice (reposted, or from two job boards): same employer, place and title words
 * ("L.P.N. (licensed practical nurse)" = "Licensed practical nurse (L.P.N.)").
 */
const words = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const postingKey = (j: Pick<JobPosting, 'title' | 'employer' | 'location'>) =>
  [words(j.title).split(' ').sort().join(' '), words(j.employer), words(j.location)].join('|');

/** Drops exact duplicates, keeping the newest copy in the place of the first one listed. */
export function dedupePostings(jobs: JobPosting[]): JobPosting[] {
  const out: JobPosting[] = [];
  const at = new Map<string, number>();
  for (const j of jobs) {
    const k = postingKey(j);
    const i = at.get(k);
    if (i == null) {
      at.set(k, out.length);
      out.push(j);
    } else if ((j.date ?? '') > (out[i].date ?? '')) out[i] = j;
  }
  return out;
}

const provinceIn = (loc: string): Province | undefined => {
  const m = loc.match(/\(([A-Z]{2})\)\s*$/);
  return m && (PROVINCE_CODES as string[]).includes(m[1]) ? (m[1] as Province) : undefined;
};

export function parseSearchResults(html: string, lang: Lang, limit = 25): { total: number | null; jobs: JobPosting[]; duplicates: number; byProvince: { code: Province; count: number }[] } {
  const totalM = html.match(/id="results-count">\s*([\d\s,.  ]+)</);
  const total = totalM ? Number(totalM[1].replace(/[^\d]/g, '')) : null;
  const jobs: JobPosting[] = [];
  const articles = html.split(/<article id="article-/).slice(1);
  for (const a of articles) {
    if (jobs.length >= limit * 2) break;
    const id = a.match(/^(\d+)/)?.[1];
    if (!id) continue;
    const title = mendApostrophes(text(a.match(/<span class="noctitle">([\s\S]*?)<\/span>/)?.[1] ?? ''));
    if (!title) continue;
    const li = (cls: string) => a.match(new RegExp(`<li class="${cls}">([\\s\\S]*?)</li>`))?.[1] ?? '';
    const location = normalizeLocation(text(li('location').replace(/<span class="wb-inv">[^<]*<\/span>/g, '')));
    const salaryRaw = text(li('salary'));
    const tele = text(a.match(/<span class="telework">([^<]*)<\/span>/)?.[1] ?? '').toLowerCase();
    const workplace = /remote|distance|télétravail|teletravail/.test(tele)
      ? 'remote'
      : /hybrid|hybride/.test(tele)
        ? 'hybrid'
        : /road|route/.test(tele)
          ? 'road'
          : /site|place/.test(tele)
            ? 'onsite'
            : undefined;
    jobs.push({
      id,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      employer: mendApostrophes(text(li('business'))),
      location,
      province: provinceIn(location),
      date: parseJobBankDate(text(li('date'))),
      salary: salaryRaw ? parseSalary(salaryRaw, lang) : undefined,
      workplace,
      postedOnJobBank: /class="postedonJB"/.test(a),
      isNew: /<span class="new">/.test(a),
      directApply: /<span class="appmethod">/.test(a),
      url: jobPostingUrl(lang, id),
    });
  }
  const byProvince: { code: Province; count: number }[] = [];
  for (const m of html.matchAll(/for="provitem_([A-Z]{2})">[^<]*<span class="badge">\s*([\d\s,  ]+)/g)) {
    const code = m[1] as Province;
    const count = Number(m[2].replace(/[^\d]/g, ''));
    if ((PROVINCE_CODES as string[]).includes(code) && !byProvince.some((p) => p.code === code)) byProvince.push({ code, count });
  }
  const unique = dedupePostings(jobs);
  // Reposts folded into one card, among the postings read (so the widget can say why the list is shorter).
  const duplicates = Math.max(0, Math.min(jobs.length, limit) - Math.min(unique.length, limit));
  return { total: total != null && Number.isFinite(total) ? total : null, jobs: unique.slice(0, limit), duplicates, byProvince };
}

/* ---------------------------------------------------------------- wages */

const wageNum = (s: string | undefined) => {
  if (!s) return null;
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const PROVINCE_BY_NAME: Record<string, Province> = {
  alberta: 'AB', 'british columbia': 'BC', manitoba: 'MB', 'new brunswick': 'NB', 'newfoundland and labrador': 'NL',
  'nova scotia': 'NS', 'northwest territories': 'NT', nunavut: 'NU', ontario: 'ON', 'prince edward island': 'PE',
  quebec: 'QC', saskatchewan: 'SK', yukon: 'YT', 'yukon territory': 'YT',
};

export type ParsedWages = {
  unit: 'hour' | 'year';
  updated?: string;
  refPeriod?: string;
  national?: WageRow;
  provinces: (WageRow & { code: Province })[];
  regions: (WageRow & { name: string; geo?: string; names?: { en?: string; fr?: string } })[];
};

/**
 * Region label as people say it: "Northeast Region" → "Northeast", "Région du Nord-Est" → "Nord-Est",
 * "Région de la Capitale-Nationale" → "Capitale-Nationale", "Région d'Ottawa" → "Ottawa".
 */
export function regionLabel(name: string): string {
  return name
    .replace(/\s+Region$/i, '')
    .replace(/^Région\s+(?:de\s+la\s+|de\s+l['’]\s*|des\s+|du\s+|de\s+|d['’]\s*)/i, '')
    // Job Bank writes this one region "Windsor-Sarnia" in English and "Windsor et Sarnia" in French; its
    // neighbours ("Kingston–Pembroke") and Statistics Canada's own name for it use the en dash.
    .replace(/^Windsor(?:-|\s+et\s+)Sarnia$/i, 'Windsor–Sarnia')
    .trim();
}

/** Economic region names from a Job Bank wages page (either language), keyed by Job Bank's geo id. */
export function parseRegionNames(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<tr class="areaGroup[^"]*">([\s\S]*?)<\/tr>/g)) {
    const th = m[1].match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? '';
    const geo = th.match(/\/(geo\d+)[;"?]/)?.[1];
    const name = text(th);
    if (geo && name) out[geo] = regionLabel(name);
  }
  return out;
}

/** Parses an English Job Bank wages page (national or provincial). */
export function parseWages(html: string): ParsedWages {
  const caption = text(html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1] ?? '');
  const unit = /annual/i.test(caption) ? 'year' : 'hour';
  const upd = html.match(/These wages were updated on ([A-Za-z]+ \d{1,2}, \d{4})/)?.[1];
  const refPeriod = html.match(/Reference period:\s*([\d-]+)/)?.[1];
  const out: ParsedWages = { unit, updated: upd ? parseJobBankDate(upd) : undefined, refPeriod, provinces: [], regions: [] };
  for (const m of html.matchAll(/<tr class="areaGroup[^"]*">([\s\S]*?)<\/tr>/g)) {
    const row = m[1];
    const name = text(row.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? '');
    const v = (h: string) => wageNum(row.match(new RegExp(`header_${h}">\\s*([^<\\s]*)`))?.[1]);
    const w: WageRow = { low: v('min'), median: v('avg'), high: v('max') };
    const code = PROVINCE_BY_NAME[name.toLowerCase()];
    const geo = row.match(/<th[^>]*>[\s\S]*?\/(geo\d+)[;"?]/)?.[1];
    if (/^canada$/i.test(name)) out.national = w;
    else if (code) out.provinces.push({ code, ...w });
    else if (name) out.regions.push({ name: regionLabel(name), geo, ...w });
  }
  return out;
}

const OUTLOOK_EN = ['Undetermined', 'Very limited', 'Limited', 'Moderate', 'Good', 'Very good'];

/** Parses the national outlook page: stars (0–5) by province. */
export function parseOutlook(html: string): Partial<Record<Province, Outlook>> {
  const out: Partial<Record<Province, Outlook>> = {};
  for (const row of html.split(/<tr[\s>]/).slice(1)) {
    const code = row.match(/id="header_([A-Z]{2})"/)?.[1] as Province | undefined;
    const stars = row.match(/star-rating-(\d)/)?.[1];
    if (code && stars != null && (PROVINCE_CODES as string[]).includes(code) && !out[code]) out[code] = { stars: Number(stars), label: OUTLOOK_EN[Number(stars)] ?? '' };
  }
  return out;
}
