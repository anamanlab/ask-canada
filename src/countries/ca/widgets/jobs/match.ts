/**
 * Resume / skills → occupation matching (isomorphic, pure). Runs on the server for the tool (from the
 * skills and job titles the person mentioned) and in the browser for an uploaded resume, which never
 * leaves the device.
 *
 * Scoring: each distinct job-title alias found counts 6, a line-of-work word ("retail") up to 6 for the
 * occupations it names, a title in the same field 1, and each distinct skill 1.5; the raw score maps to
 * 0–100 with a soft ceiling (1 − e^(−raw/9)), so a couple of strong signals read as a good match and
 * nothing claims certainty. Having held the job itself (a literal title match, or a line of work done for a
 * year or more: "I worked retail for 3 years") is a strong fit on its own: it scores at least 75, plus 3
 * per matching skill and 1 per year of experience (up to 5). A skill counts once: "reading blueprints" is
 * one skill, not that and "blueprints".
 */
import { fold, jobBankSearchUrl, wagesUrl, type Lang, type Province } from './data';
import { OCCUPATIONS, type Occupation } from './occupations';
import type { OccupationMatch } from './types';

const MIN_SKILL_LEN = 3;
/** A suggestion outside the person's field needs this score, or two distinct signals. */
const OFF_FIELD_FLOOR = 20;

/** Job-title aliases found in folded text (singular or plural). */
function hits(hay: string, terms: string[], minLen: number) {
  const out: string[] = [];
  for (const t of terms) {
    if (t.length < minLen || out.includes(t)) continue;
    if (hay.includes(` ${t} `) || hay.includes(` ${t}s `)) out.push(t);
  }
  return out;
}

/**
 * Skills found in folded text, each counted once: longer terms claim their words first, so "residential
 * wiring" isn't also "wiring" (unless wiring is listed apart). Returned in the catalog's order.
 */
function skillHits(hay: string, terms: string[]): string[] {
  let rest = hay;
  const found = new Set<string>();
  for (const t of terms.toSorted((a, b) => b.length - a.length)) {
    if (t.length < MIN_SKILL_LEN || found.has(t)) continue;
    const next = rest.replaceAll(` ${t}s `, ' | ').replaceAll(` ${t} `, ' | ');
    if (next === rest) continue;
    found.add(t);
    rest = next;
  }
  return terms.filter((t, i) => found.has(t) && terms.indexOf(t) === i);
}

/**
 * Everyday words for a line of work ("I worked retail", "j'ai travaillé en restauration") that aren't job
 * titles but point to a few occupations. Each counts like a title (up to 6) for the occupations it names.
 * Excel is a skill everywhere, with a small extra pull toward office roles.
 */
const WORK_WORDS: { terms: string[]; boost: Record<string, number>; title?: boolean }[] = [
  { terms: ['retail', 'commerce de detail', 'vente au detail'], boost: { 'retail-salesperson': 6, cashier: 4, 'retail-supervisor': 4 }, title: true },
  { terms: ['restaurant', 'restaurants', 'restauration', 'fast food', 'restauration rapide', 'hospitality', 'hotellerie'], boost: { server: 6, cook: 4, 'food-service-supervisor': 4, barista: 3 }, title: true },
  { terms: ['warehouse', 'entrepot', 'distribution centre', 'centre de distribution'], boost: { 'warehouse-worker': 6, 'delivery-driver': 3, 'truck-driver': 2 }, title: true },
  // Also part of other titles ("construction electrician"), so a lighter pull.
  { terms: ['construction', 'chantier'], boost: { 'construction-labourer': 4, carpenter: 2, 'heavy-equipment-operator': 2 }, title: true },
  { terms: ['call centre', 'call center', 'centre d appels'], boost: { 'customer-service': 6, receptionist: 2 }, title: true },
  { terms: ['excel'], boost: { 'administrative-assistant': 1.5, bookkeeper: 1, receptionist: 1, 'project-coordinator': 1 } },
];

/** Work words (see WORK_WORDS) mentioned in folded text, for chips and evidence. */
export function workWordsIn(hay: string): string[] {
  const out: string[] = [];
  for (const w of WORK_WORDS) if (w.title) for (const t of w.terms) if (hay.includes(` ${t} `) && !out.includes(t)) out.push(t);
  return out;
}

export type RawMatch = { occ: Occupation; score: number; titles: string[]; skills: string[]; /** Title-strength evidence (titles + work words). */ strong: number };

/** What the person told us beyond the words themselves (from the conversation, never from a resume). */
export type Signals = {
  /** Years in the work they named: a line of work ("retail") held a year or more counts as a held title. */
  years?: number;
  /** Skills in the person's own words: each can earn a card by itself, and one keeps a slot outside their field. */
  named?: string[];
  /** Skills, job titles and lines of work (folded) the person switched off: they count for no occupation. */
  omit?: Iterable<string>;
};

/** Score every occupation against free text (resume, or skills/titles joined). */
export function scoreText(text: string, signals: Signals = {}): RawMatch[] {
  const hay = ` ${fold(text)} `;
  if (hay.trim().length < 2) return [];
  const years = Math.max(0, Math.floor(signals.years ?? 0));
  const omit = new Set(signals.omit);
  const kept = (terms: string[]) => (omit.size ? terms.filter((t) => !omit.has(t)) : terms);
  // Switching "apprenti électricien" off also drops the "électricien" inside it (one chip stands for both).
  const within = [...omit].map((o) => ` ${o} `);
  const keptTitles = (terms: string[]) => (omit.size ? terms.filter((t) => !within.some((o) => o.includes(` ${t} `))) : terms);
  const titlesOf = (o: Occupation) => keptTitles(hits(hay, o.titles, 2));
  const words = WORK_WORDS.map((w) => ({ ...w, found: keptTitles(w.terms.filter((t) => hay.includes(` ${t} `))) })).filter((w) => w.found.length);
  // A past job title also suggests its neighbours in the same field (cashier → retail salesperson).
  const titledSectors = new Set(OCCUPATIONS.filter((o) => titlesOf(o).length).map((o) => o.sector));
  const res: RawMatch[] = [];
  for (const occ of OCCUPATIONS) {
    const titles = titlesOf(occ);
    const skills = kept(skillHits(hay, occ.skills));
    let heldTitle = titles.length > 0;
    let strong = titles.length * 6;
    for (const w of words) {
      const b = w.boost[occ.key];
      if (!b) continue;
      strong += b;
      if (!w.title) continue;
      // "retail" is evidence worth showing; Excel already shows as a skill.
      if (!titles.includes(w.found[0])) titles.push(w.found[0]);
      // Three years in retail is the job itself for the occupation that line of work names first.
      if (years >= 1 && b === Math.max(...Object.values(w.boost))) heldTitle = true;
    }
    if (!titles.length && titledSectors.has(occ.sector)) strong += 1;
    const raw = strong + skills.length * 1.5;
    if (!raw) continue;
    const curve = Math.round(100 * (1 - Math.exp(-raw / 9)));
    const score = Math.min(97, heldTitle ? Math.max(curve, 75 + skills.length * 3 + Math.min(5, years)) : curve);
    res.push({ occ, score, titles, skills, strong });
  }
  return res.sort((a, b) => b.score - a.score || b.occ.wage.median - a.occ.wage.median);
}

/**
 * The best matches as cards. Past the first three, a card needs real evidence of its own (a title or
 * line of work, two distinct skills, or one skill the person named), so one generic word ("plans") can't
 * fill the list with look-alikes. Strong fits (20+) lead; with fewer than three, the next-best fill in.
 * When the person named a skill, one slot goes to the best occupation outside the field their titles
 * point to that uses it: after three years in retail, "Excel" opens administrative work. That slot needs
 * a fit of its own (20+, or two distinct signals): "dépannage" on an electrician's list is electrical
 * troubleshooting, not a reason to suggest the IT help desk.
 */
export function toMatches(raw: RawMatch[], lang: Lang, province?: Province, limit = 5, signals: Signals = {}): OccupationMatch[] {
  const named = new Set((signals.named ?? []).map(fold));
  const usesNamed = (m: RawMatch) => m.skills.some((s) => named.has(s));
  const solid = raw.filter((m, i) => i < 3 || m.titles.length > 0 || new Set(m.skills).size >= 2 || usesNamed(m));
  const strong = solid.filter((m) => m.score >= 20);
  let picked = (strong.length >= 3 ? strong : solid.slice(0, 3)).slice(0, limit);
  const fields = new Set(picked.filter((m) => m.titles.length).map((m) => m.occ.sector));
  if (named.size && fields.size && !picked.some((m) => !fields.has(m.occ.sector) && usesNamed(m))) {
    const other = solid.find((m) => !fields.has(m.occ.sector) && usesNamed(m) && (m.score >= OFF_FIELD_FLOOR || new Set([...m.titles, ...m.skills]).size >= 2));
    if (other) picked = [...picked.slice(0, picked.length < limit ? limit : limit - 1), other];
  }
  const searchUrl = (l: Lang, occ: Occupation) => jobBankSearchUrl(l, occ.search[l], province ? { kind: 'province', province } : { kind: 'canada' });
  return picked.map(({ occ, score, titles, skills }) => ({
    key: occ.key,
    profileId: occ.profileId,
    noc: occ.noc,
    title: occ.title[lang],
    titles: occ.title,
    sector: occ.sector,
    score,
    matchedTitles: titles,
    matchedSkills: skills,
    median: occ.wage.median,
    searchUrl: searchUrl(lang, occ),
    searchUrls: { en: searchUrl('en', occ), fr: searchUrl('fr', occ) },
    wagesUrl: wagesUrl(lang, occ.profileId, province ?? 'ca'),
  }));
}

/** Distinct skills found across the top matches, strongest first (for the "we noticed" chips). */
export function detectedSkills(raw: RawMatch[], max = 14): string[] {
  const seen = new Map<string, number>();
  raw.slice(0, 6).forEach((m, i) => m.skills.forEach((s) => seen.set(s, Math.max(seen.get(s) ?? 0, 10 - i))));
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([s]) => s);
}

/**
 * Job titles and lines of work found, best match first (chips for a resume, so each can be switched off).
 * A title inside a longer one found ("électricien" in "apprenti électricien") is left to the longer chip.
 */
export function detectedTitles(raw: RawMatch[], max = 6): string[] {
  const out: string[] = [];
  for (const m of raw) for (const t of m.titles) if (!out.includes(t)) out.push(t);
  return out.filter((a) => !out.some((b) => b !== a && ` ${b} `.includes(` ${a} `))).slice(0, max);
}

/** Of the words the person gave, the ones (folded) some occupation recognises; the others show dimmed. */
export const knownTerms = (labels: string[], raw: RawMatch[]): string[] =>
  [...new Set(labels.map(fold))].filter((k) => raw.some((r) => r.skills.includes(k) || r.titles.includes(k)));

/** True when text looks like real prose (not binary junk from an unreadable PDF). */
export function looksReadable(text: string): boolean {
  const words = text.match(/[A-Za-zÀ-ÿ]{3,}/g) ?? [];
  if (words.length < 25) return false;
  const letters = (text.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  return letters / Math.max(1, text.replace(/\s/g, '').length) > 0.6;
}
