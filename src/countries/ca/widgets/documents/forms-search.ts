/**
 * Forms finder: pure search over the verified forms catalogue. The tool runs it on the server; the card loads
 * it (and the catalogue) only when someone types a new search, and re-runs it on the device as they type.
 * Form numbers match loosely ("t2201", "T 2201", "IMM5476"); words match names + keywords.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, otherLang, type Dept, type Lang } from './data';
import { FORMS, PASSPORT_WORDS, type FormDef } from './forms-catalogue';
import { url, type UrlKey } from './urls';

export type FormHit = {
  code: string;
  slug: string;
  dept: Dept;
  name: string;
  href: string;
  online: { key: UrlKey; href: string } | null;
  updated?: string;
  /** Title and form page in the other official language, for a card shown in that language. */
  alt: { name: string; href: string };
};

/** What a search returns: the tool adds the official search pages and the sources (see ./forms). */
export type FormSearch = {
  query: string;
  lang: Lang;
  dept: Dept | null;
  results: FormHit[];
  /** The person asked about passport forms: we route them to the passport pages instead of one form. */
  passport: boolean;
  /** No query: the most-used forms are shown instead. */
  popular: boolean;
  /** The words point to something provinces and territories issue (licences, permits, health cards…). */
  provincial: boolean;
};

export const formSlug = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, '');

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ');

const STOP = new Set(
  'a an and the for of to my i me is do does how what which where can get find form forms need apply application le la les de des du un une et pour mon ma mes je quel quelle formulaire formulaires demande ou où trouver obtenir besoin faut il please want would like help canada canadian government federal plait veux voudrais aimerais aide gouvernement canadien canadienne fédéral'.split(
    ' ',
  ),
);

function score(f: FormDef, q: string): number {
  const code = formSlug(f.code);
  const compact = formSlug(q);
  if (!compact) return 0;
  if (compact === code) return 100;
  // "form t2201 please" -> the code appears inside the query.
  if (code.length >= 4 && compact.includes(code)) return 90;
  if (compact.length >= 3 && code.startsWith(compact)) return 60;
  const hay = fold(`${f.code} ${f.name.en} ${f.name.fr} ${f.keywords}`);
  const words = fold(q)
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return 0;
  let s = 0;
  let hits = 0;
  for (const w of words) {
    if (new RegExp(`\\b${w.replace(/[-]/g, '\\-')}`).test(hay)) {
      s += w.length > 3 ? 12 : 6;
      hits++;
    }
  }
  // Several words must mostly match: "pleasure craft operator card" isn't the PR card form, and
  // "work permit" isn't the employment expenses form.
  if (words.length >= 2 && hits < Math.ceil(words.length * 0.6)) return 0;
  return s;
}

/**
 * Things people search for that provinces and territories issue, not the federal government: the finder
 * points to the official directory of provincial and territorial governments instead of a dead end.
 */
const PROVINCIAL_WORDS =
  /\b(licen[cs]es?|permits?|permis|driver|drivers|driving|conduire|health cards?|cartes? (d.)?assurance[- ]maladie|carte soleil|birth certificates?|acte de naissance|certificat de naissance|marriage certificates?|certificat de mariage|vehicle registration|immatriculation|plates?|plaques?)\b/i;

/** Federal licences and permits (IRCC work/study permits, RCMP firearms licences, Transport Canada drone and boating cards). */
const FEDERAL_PERMIT_WORDS = /\b(work|study|travail|etudes?|temporary|temporaire|firearms?|armes?|pal|possession|drones?|pilots?|pilotes?|boat|boating|embarcation|pleasure craft)\b/i;

/** Shown when there is nothing to search yet. */
const POPULAR = ['RC66', 'T1-ADJ', 'T2201', 'ISP1000', 'CIT 0002', 'IMM 5476'];

export function searchForms(query: string, lang: Lang, dept?: Dept | null, limit = 6): FormSearch {
  const q = query.trim().slice(0, 120);
  if (!q) {
    const results = FORMS.filter((f) => POPULAR.includes(f.code) && (!dept || f.dept === dept)).map((f) => hit(f, lang));
    return { query: '', lang, dept: dept ?? null, results, passport: false, popular: true, provincial: false };
  }
  const pool = dept ? FORMS.filter((f) => f.dept === dept) : FORMS;
  const scored = pool
    .map((f) => ({ f, s: score(f, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  // Keep only results close to the best match ("change my tax return" shouldn't list every tax form).
  const best = scored[0]?.s ?? 0;
  const results = scored
    .filter((x) => x.s >= Math.max(6, best * 0.6))
    .slice(0, limit)
    .map(({ f }) => hit(f, lang));
  return { query: q, lang, dept: dept ?? null, results, passport: PASSPORT_WORDS.test(q), popular: false, provincial: PROVINCIAL_WORDS.test(fold(q)) && !FEDERAL_PERMIT_WORDS.test(fold(q)) };
}

function hit(f: FormDef, lang: Lang): FormHit {
  return {
    code: f.code,
    slug: formSlug(f.code),
    dept: f.dept,
    name: f.name[lang],
    href: f.href[lang],
    online: f.online ? { key: f.online, href: url(f.online, lang) } : null,
    ...(f.updated ? { updated: f.updated } : {}),
    alt: { name: f.name[otherLang(lang)], href: f.href[otherLang(lang)] },
  };
}

/** The form pages a result list cites (the top three), in the search's language or the other official one. */
export function hitSources(results: FormHit[], alt = false): ToolSource[] {
  return results.slice(0, 3).map((r) => ({
    title: `${r.code} — ${alt ? r.alt.name : r.name}`,
    url: alt ? r.alt.href : r.href,
    checked: CHECKED,
    ...(r.updated ? { updated: r.updated } : {}),
  }));
}
