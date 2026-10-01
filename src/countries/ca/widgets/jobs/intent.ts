/**
 * Reads a jobs question in plain words (EN/FR) for the scripted answers: "nursing jobs in Halifax",
 * "remote data analyst jobs", "emplois de soudeur à Québec", "how much does a welder make in Alberta".
 * Isomorphic and pure.
 */
import { fold, provinceFrom, type Province } from './data';
import { OCCUPATIONS, occupationFromTitle } from './occupations';
import { workWordsIn } from './match';
import type { Stage } from './types';

/** `query` is empty for a filter-only search ("student jobs in Toronto"). */
export type JobQuery = { query: string; location?: string; remote?: boolean; student?: boolean; recent?: boolean };

const STRIP = /^(?:(?:some|any|good|new|the|a|an|me|des|les|un|une|de|d’|d'|du|la|le|l’|l')\s+)+/i;
const GENERIC = /^(?:jobs?|work|travail|emplois?|postes?|job|something|anything|quelque chose|a job|un emploi)$/i;
const CANADA = /^(?:canada|all of canada|across canada|tout le canada|partout au canada|le canada)$/i;

function clean(q: string | undefined) {
  if (!q) return '';
  return q
    .replace(/[“”"«»]/g, '')
    .replace(/(?<!\p{L})(?:remote|work from home|à distance|en télétravail|students?|étudiants?|étudiantes?|part[- ]time|full[- ]time|à temps (?:plein|partiel)|new|recent|nouveaux|nouvelles)(?!\p{L})/giu, ' ')
    .replace(STRIP, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Québec City in any wording: "Quebec City", "ville de Québec", "Québec (ville)". */
const QUEBEC_CITY = /^(?:qu[ée]bec city|city of qu[ée]bec|(?:la )?ville de qu[ée]bec|qu[ée]bec \(ville\)|qu[ée]bec ville)$/i;
const QUEBEC = /^qu[ée]bec$/i;

/**
 * The place, as Job Bank's location box would take it. French "à Québec" is Québec City, while "au Québec",
 * "province de Québec" or a bare "Québec" is the province.
 */
function place(p: string | undefined, text: string) {
  const s = p?.replace(/[?.!]+$/, '').replace(/^(?:the|la|le)\s+/i, '').trim();
  if (!s || CANADA.test(s)) return undefined;
  if (QUEBEC_CITY.test(s)) return 'Québec, QC';
  if (QUEBEC.test(s) && /(?<!\p{L})(?:à|a|near|près de)\s+qu[ée]bec(?!\p{L})(?!\s*\()/iu.test(text)) return 'Québec, QC';
  return s;
}

const PATTERNS: RegExp[] = [
  // "jobs as a welder in Calgary" / "jobs for an electrician"
  /\bjobs?\s+(?:as|for)\s+(?:an?\s+)?(.+?)(?:\s+(?:in|near|around|across)\s+(.+?))?\s*[?.!]*$/i,
  // "show me nurse jobs in Ontario" / "find remote data analyst jobs"
  /\b(?:show|find|search(?:\s+for)?|look(?:ing)?\s+for|list|browse|see|get|any)\s+(?:me\s+)?(.+?)\s+(?:jobs?|positions?|openings?|postings?|vacancies)\b(?:\s+(?:in|near|around|across)\s+(.+?))?\s*[?.!]*$/i,
  // "welding jobs in Hamilton" / "Registered nurse jobs near K1A 0B1"
  /^(?:are there\s+(?:any\s+)?)?(.+?)\s+(?:jobs?|positions?|openings?|postings?|vacancies)\s+(?:in|near|around|across)\s+(.+?)\s*[?.!]*$/i,
  /^(.+?)\s+(?:jobs?|positions?|openings?|postings?|vacancies)\s*[?.!]*$/i,
  // "who is hiring electricians in Regina"
  /\bhiring\s+(.+?)(?:\s+(?:in|near|around)\s+(.+?))?\s*[?.!]*$/i,
  // FR: "emplois de soudeur à Québec", "postes d'infirmière en Ontario", "emplois de X (Ontario)"
  /\b(?:emplois?|postes?|offres(?:\s+d[’']emploi)?)\s+(?:de|d[’']|comme|en tant que|pour)\s*(.+?)(?:\s+(?:à|au|aux|en|dans|près de|partout au)\s+(.+?)|\s*\((.+?)\))?\s*[?.!]*$/i,
  /\b(?:cherche|chercher|trouver|trouve)\s+(?:un\s+|des\s+)?(?:emplois?|travail|job|postes?)\s+(?:de|d[’']|comme|en tant que)\s*(.+?)(?:\s+(?:à|au|aux|en|dans|près de)\s+(.+?))?\s*[?.!]*$/i,
];

/** Kind of work + place from a search question, or null when it isn't specific enough to search. */
export function parseJobQuery(text: string): JobQuery | null {
  const t = text.trim();
  const flags = {
    remote: /\b(remote|work from home|wfh|à distance|télétravail)\b/i.test(t) || undefined,
    student: /(?<!\p{L})(students?|étudiants?|étudiantes?)(?!\p{L})/iu.test(t) || undefined,
    recent: /\b(new|newest|latest|recent|nouveaux|nouvelles|récent(?:e)?s?)\b/i.test(t) || undefined,
  };
  // "à distance" / "en télétravail" are filters, not places: drop them before reading the place.
  const bare = t.replace(/\s+(?:à distance|en télétravail|(?:en|au) mode hybride)(?!\p{L})/giu, '').replace(/\s+(?:qu[ée]bec)\s+\((?:ville|city)\)/giu, ' Québec City');
  for (const re of PATTERNS) {
    const m = bare.match(re);
    if (!m) continue;
    let q = clean(m[1]);
    const loc = place(m[2] ?? m[3], bare);
    // "student jobs in Toronto": the only words were the student filter. Search every student-flagged
    // posting (no keyword), rather than postings that contain the word "student".
    if (!q && flags.student && /(?<!\p{L})(students?|étudiants?|étudiantes?)(?!\p{L})/iu.test(m[1])) return { query: '', location: loc, ...flags };
    // "Show nurse jobs in Ontario": drop verbs the broad patterns can swallow.
    q = q.replace(/^(?:show|find|search|see|get|list|me)\s+/i, '').replace(/^(?:me\s+)/i, '');
    if (!q || q.length < 3 || GENERIC.test(q) || provinceFrom(q) || /\b(i|need|want|my|me|get|looking)\b/i.test(q) || q.split(' ').length > 6) continue;
    // Prefer Job Bank's usual keyword when we know the occupation ("nursing" stays as typed).
    return { query: q, location: loc, ...flags };
  }
  return null;
}

/** Occupation (catalog, else the words) + province from a pay question. */
export function parseWageQuery(text: string): { occupation: string; province?: Province } | null {
  const t = text.trim();
  const occ = occupationFromTitle(t);
  const provM = t.match(/\b(?:in|en|au|à|dans|across|for)\s+(?:the\s+|la\s+|le\s+|l[’'])?([A-ZÀ-Ý][\p{L}.’' -]+?)\s*[?.!)]*$/u) ?? t.match(/\(([^)]+)\)\s*[?.!]*$/);
  const province = provinceFrom(provM?.[1]) ?? provinceWord(t);
  if (occ) return { occupation: occ.search.en, province };
  const m =
    t.match(/\b(?:does|do)\s+(?:an?\s+)?(.+?)\s+(?:make|earn|get paid|jobs? pay)\b/i) ??
    t.match(/\b(?:salary|salaries|wages?|pay)\s+(?:of|for)\s+(?:an?\s+)?(.+?)(?:\s+(?:in|across)\s+.+)?\s*[?.!]*$/i) ??
    t.match(/\bcombien\s+(?:gagne(?:nt)?(?:-t-(?:on|il|elle))?|paie-t-on|est payée?)\s+(?:comme\s+)?(?:un|une|les|des)?\s*(.+?)(?:\s+(?:au|en|à|dans|selon)\s+.+)?\s*[?.!]*$/i) ??
    t.match(/\bsalaires?\s+(?:d[’']un|d[’']une|des|du|de)\s*(.+?)(?:\s+(?:au|en|à|dans)\s+.+)?\s*[?.!]*$/i);
  const q = clean(m?.[1]);
  if (!q || q.length < 3 || GENERIC.test(q) || /\b(i|my|me|we|you|our|your|they|benefits?|prestations?|pension|cheque|payment)\b/i.test(q)) return null;
  return { occupation: q, province };
}

const PROVINCE_WORDS = /(?<![\p{L}])(alberta|british columbia|colombie-britannique|manitoba|new brunswick|nouveau-brunswick|newfoundland|terre-neuve|nova scotia|nouvelle-écosse|ontario|prince edward island|île-du-prince-édouard|quebec|québec|saskatchewan|yukon|nunavut|northwest territories|territoires du nord-ouest|pei|bc|b\.c\.)(?![\p{L}])/iu;
function provinceWord(t: string): Province | undefined {
  const m = t.match(PROVINCE_WORDS);
  // "Quebec City" is a city in Quebec: still Quebec for wages.
  return provinceFrom(m?.[1]);
}

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10 };

/**
 * Years of experience in a sentence: "worked retail for 3 years", "5+ yrs in construction",
 * "j'ai travaillé trois ans en restauration". Ages ("17 years old", "j'ai 17 ans") don't count.
 */
function yearsFromText(text: string): number | undefined {
  const m = text.match(/(?<!\p{L})(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|deux|trois|quatre|cinq|sept|huit|neuf|dix)\+?\s*(years?|yrs?|ans?|années?)(?!\p{L})(?!\s+(?:old|d[’']âge))/iu);
  if (!m || m.index == null) return undefined;
  const before = text.slice(Math.max(0, m.index - 12), m.index);
  if (/(?:i['’]?m|i am|aged?|j['’]ai|âgée?s? de)\s*$/i.test(before)) return undefined;
  const n = Number(m[1]) || NUMBER_WORDS[m[1].toLowerCase()];
  return n >= 1 && n <= 50 ? n : undefined;
}

/** Skills, past job titles and years of experience someone listed ("I worked retail for 3 years and know Excel"). */
export function skillsFromText(text: string): { skills: string[]; titles: string[]; years?: number } {
  const hay = ` ${fold(text)} `;
  const skills = new Set<string>();
  const titles = new Set<string>();
  for (const o of OCCUPATIONS) {
    for (const s of o.skills) if (s.length >= 3 && hay.includes(` ${s} `)) skills.add(s);
    for (const tt of o.titles) if (tt.length >= 4 && hay.includes(` ${tt} `)) titles.add(tt);
  }
  // "I worked retail" / "en restauration": a line of work, treated like a past job title.
  for (const w of workWordsIn(hay)) titles.add(w);
  // Drop terms contained in longer ones ("sales" inside "retail sales associate").
  const prune = (set: Set<string>, also: string[] = []) =>
    [...set].filter((a) => ![...set, ...also].some((b) => b !== a && ` ${b} `.includes(` ${a} `)));
  const tl = prune(titles);
  return { titles: tl.slice(0, 6), skills: prune(skills, tl).filter((k) => !tl.includes(k)).slice(0, 20), years: tl.length ? yearsFromText(text) : undefined };
}

/** Age and school stage from "I'm 17 and in high school" / "j'ai 20 ans, à l'université". */
export function youthFromText(text: string): { age?: number; stage?: Stage } {
  const a = text.match(/\b(?:i['’]?m|i am|age[d]?|j['’]ai)\s*(\d{2})\b/i) ?? text.match(/\b(\d{2})\s*(?:years? old|yo|ans)\b/i);
  const age = a ? Number(a[1]) : undefined;
  const stage: Stage | undefined = /(?<![\p{L}])(high school|grade 1[0-2]|secondaire)(?![\p{L}])/iu.test(text)
    ? 'high-school'
    : /(?<![\p{L}])(university|college|cegep|cégep|université|collège|undergrad|post-?secondary|postsecondaire)(?![\p{L}])/iu.test(text)
      ? 'post-secondary'
      : /(?<![\p{L}])(graduat\p{L}*|diplômé\p{L}*|just finished school)(?![\p{L}])/iu.test(text)
        ? 'graduate'
        : undefined;
  return { age: age && age >= 12 && age <= 80 ? age : undefined, stage };
}
