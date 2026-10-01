/**
 * Follow-up chips for the scripted jobs answers, worked out from the question (EN + FR). "Find … jobs" chips
 * are checked live: their Job Bank search starts while the answer streams, and one that would come back with
 * no postings is swapped for the next idea. Server only (scenarios/jobs.ts).
 */
import { frDe, inLocation, inProvince, provinceFrom, type Lang, type Province } from './data';
import { parseJobQuery, parseWageQuery, skillsFromText } from './intent';
import { resolveLocation, resolvedLocation, searchJobBank, settledSearchTotal } from './live';
import { scoreText, toMatches } from './match';
import { OCCUPATIONS, canonicalQuery, occupationFromTitle } from './occupations';
import { lcFirst as lc } from './text';

const inPlace = inProvince;
/** Chips longer than this would wrap badly: they are dropped. */
const MAX_CHIP = 90;

const wageQuestion = (lang: Lang, title: string, p?: Province) =>
  lang === 'fr' ? `Combien gagne-t-on comme ${lc(title)} ${inPlace('fr', p)}?` : `How much does ${/^[aeiou]/i.test(title) ? 'an' : 'a'} ${lc(title)} make ${inPlace('en', p)}?`;

export function searchFollowUps(text: string, lang: Lang): string[] {
  const q = parseJobQuery(text);
  if (!q) return [];
  const fr = lang === 'fr';
  const query = canonicalQuery(q.query, lang);
  const occ = occupationFromTitle(query);
  const loc = resolvedLocation(q.location, lang)?.loc;
  const prov = loc && 'province' in loc ? loc.province : provinceFrom(q.location?.split(/,\s*/).pop());
  const where = loc ? inLocation(lang, loc) : '';
  const out: string[] = [];
  out.push(
    occ
      ? wageQuestion(lang, fr ? occ.title.fr : occ.title.en, prov)
      : q.student
        ? fr ? 'Emplois d’été pour étudiants' : 'Summer jobs for students'
        : fr ? 'Quels emplois correspondent à mon CV?' : 'What jobs match my resume?',
  );
  if (q.student) out.push(fr ? 'Quels emplois correspondent à mon CV?' : 'What jobs match my resume?');
  else if (q.remote) out.push(fr ? `Trouver de nouveaux emplois ${frDe(query)} ${where}`.trim() : `Find new ${query} jobs ${where}`.trim());
  else out.push(fr ? `Trouver des emplois ${frDe(query)} en télétravail` : `Find remote ${query} jobs`);
  out.push(
    q.student
      ? fr ? 'Emplois au gouvernement du Canada pour étudiants' : 'Government of Canada jobs for students'
      : loc && loc.kind !== 'canada'
        ? fr ? `Trouver des emplois ${frDe(query)} partout au Canada` : `Find ${query} jobs across Canada`
        : fr ? 'Emplois au gouvernement du Canada' : 'Government of Canada jobs',
  );
  return out.filter((x) => x.length <= MAX_CHIP);
}

export function wageFollowUps(text: string, lang: Lang): string[] {
  const w = parseWageQuery(text);
  if (!w) return [];
  const fr = lang === 'fr';
  const cat = occupationFromTitle(w.occupation);
  const term = cat ? cat.search[lang] : w.occupation;
  return [
    fr ? `Trouver des emplois ${frDe(term)} ${inPlace('fr', w.province)}` : `Find ${term} jobs ${w.province ? inPlace('en', w.province) : 'across Canada'}`,
    w.province ? wageQuestion(lang, cat ? cat.title[lang] : w.occupation, undefined) : fr ? 'Quels emplois correspondent à mon CV?' : 'What jobs match my resume?',
    w.province ? (fr ? 'Quels emplois correspondent à mon CV?' : 'What jobs match my resume?') : fr ? 'Emplois au gouvernement du Canada' : 'Government of Canada jobs',
  ].filter((x) => x.length <= MAX_CHIP);
}

export function resumeFollowUps(text: string, lang: Lang): string[] {
  const fr = lang === 'fr';
  const { skills, titles, years } = skillsFromText(text);
  const prov = provinceFrom(text.match(/\b(?:in|en|au|à)\s+([A-ZÀ-Ý][\p{L}-]+(?:\s[A-ZÀ-Ý][\p{L}-]+)*)/u)?.[1]);
  // Same scoring and signals as the tool and the matcher widget, so the chips follow its cards.
  const signals = { years, named: skills };
  const matches = skills.length + titles.length ? toMatches(scoreText([...titles, ...skills].join(' | '), signals), lang, prov, 5, signals) : [];
  const top = matches[0];
  const occ = top && OCCUPATIONS.find((o) => o.key === top.key);
  // A path outside their field ("Excel" → administrative assistant) is worth asking about too.
  const other = matches.find((m) => m.sector !== top?.sector);
  const otherOcc = other && OCCUPATIONS.find((o) => o.key === other.key);
  if (!occ) {
    return fr
      ? ['Je connais le service à la clientèle, la vente et Excel. Quels emplois me conviennent?', 'Emplois d’été pour étudiants', 'Emplois au gouvernement du Canada']
      : ['I know customer service, sales and Excel. What jobs fit me?', 'Summer jobs for students', 'Government of Canada jobs'];
  }
  return [
    wageQuestion(lang, occ.title[lang], prov),
    fr ? `Trouver des emplois ${frDe(occ.search.fr)} ${inPlace('fr', prov)}` : `Find ${occ.search.en} jobs ${prov ? inPlace('en', prov) : 'across Canada'}`,
    otherOcc ? wageQuestion(lang, otherOcc.title[lang], prov) : fr ? 'Emplois au gouvernement du Canada' : 'Government of Canada jobs',
  ].filter((x) => x.length <= MAX_CHIP);
}

/* ---------------------------------------------------------------- live-checked search chips */

/** Only "Find … jobs" chips run a Job Bank search; the others open programs, wages or the matcher. */
const chipSearch = (chip: string) => {
  const q = /^(?:find|trouver)\s/i.test(chip) ? parseJobQuery(chip) : null;
  return q ? { q, filters: { remote: q.remote, student: q.student, recent: q.recent } } : null;
};

/**
 * Starts the Job Bank search behind every search chip (not awaited: it runs while the answer streams, and
 * it warms the cache for the click). Same cached lookups as the tool, so a chip and its answer agree.
 */
export function prefetchChips(chips: string[], lang: Lang) {
  for (const chip of chips) {
    const c = chipSearch(chip);
    if (!c) continue;
    resolveLocation(c.q.location, lang)
      .then(({ loc }) => searchJobBank(lang, canonicalQuery(c.q.query, lang), loc, c.filters, 8000))
      .catch(() => undefined);
  }
}

/** Job Bank's count for a search chip, once its prefetch has finished (undefined while unknown). */
function chipTotal(chip: string, lang: Lang): number | null | undefined {
  const c = chipSearch(chip);
  if (!c) return undefined;
  const loc = resolvedLocation(c.q.location, lang)?.loc;
  return loc ? settledSearchTotal(lang, canonicalQuery(c.q.query, lang), loc, c.filters) : undefined;
}

/** Never offer a search Job Bank would answer with "no postings": swap it for the next idea. */
export function liveChips(chips: string[], spares: string[], lang: Lang): string[] {
  const out = chips.filter((c) => chipTotal(c, lang) !== 0);
  for (const s of spares) if (out.length < 3 && !out.includes(s) && chipTotal(s, lang) !== 0) out.push(s);
  return out.slice(0, 3);
}

const SPARES = {
  en: ['What jobs match my resume?', 'Government of Canada jobs', 'Summer jobs for students'],
  fr: ['Quels emplois correspondent à mon CV?', 'Emplois au gouvernement du Canada', 'Emplois d’été pour étudiants'],
};

/**
 * A tool call that shows follow-up chips worked out from the question. It never comes back empty (the
 * spares fill it to three), and the chat shows the first suggestFollowUps call of an answer. The scripted
 * engine still appends each scenario's static `followUps` as a second call, which the coverage check
 * (scripts/check-scenarios.mjs) requires every scenario to keep.
 */
export const followUpsFor = (fn: (text: string, lang: Lang) => string[]) => ({
  toolName: 'suggestFollowUps',
  input: ({ text, lang }: { text: string; lang: Lang }) => ({ questions: liveChips(fn(text, lang), SPARES[lang], lang) }),
});

/** Government answer: a search that usually has postings in the capital (swapped out live when it has none today). */
export function governmentFollowUps(_text: string, lang: Lang): string[] {
  return lang === 'fr'
    ? ['Emplois d’été pour étudiants', 'Trouver des emplois d’adjoint administratif à Ottawa', 'Quels emplois correspondent à mon CV?']
    : ['Summer jobs for students', 'Find administrative assistant jobs in Ottawa', 'What jobs match my resume?'];
}
/** Answered by the jobs-student-pay scenario (Treasury Board student rates of pay). */
export const STUDENT_PAY_QUESTION = {
  en: 'How much do student jobs pay in the federal government?',
  fr: 'Combien paient les emplois étudiants au gouvernement fédéral?',
};
/** Never a question the government answer itself answers: that chip would lead straight back to it. */
export const GOV_SPARES = {
  en: [STUDENT_PAY_QUESTION.en, 'Find policy analyst jobs across Canada'],
  fr: [STUDENT_PAY_QUESTION.fr, 'Trouver des emplois d’analyste des politiques partout au Canada'],
};
