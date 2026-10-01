/**
 * CAF career matcher: builds the tool output (server, scripted answers and lab fixtures). Links and sources
 * come from the page catalogue in data.ts, in both official languages, so the widget never needs it.
 */
import { CAF } from './facts';
import { CHECKED, URLS, source, type Lang } from './data';
import { CATEGORIES, careerUrl, matchCareers, type Answers, type Career, type CareerRecord, type CareersInput, type CareersOutput, type CareersRefs, type Category, type Education } from './careers';

const EDUCATION: Record<NonNullable<CareersInput['education']>, Education> = { grade10: 1, 'high-school': 2, college: 3, bachelor: 4, graduate: 5 };

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[·•]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const STOP = new Set(['the', 'and', 'for', 'job', 'jobs', 'career', 'careers', 'work', 'military', 'forces', 'caf', 'les', 'des', 'une', 'emploi', 'emplois', 'carriere', 'carrieres', 'metier', 'metiers', 'dans', 'pour', 'armee', 'want', 'like', 'become', 'devenir']);

/** Careers whose name or related civilian job titles mention the words someone typed ("pilot", "cyber", "cuisinier"). */
function searchCareers(list: CareerRecord[], query: string | null | undefined): string[] {
  if (!query) return [];
  const words = fold(query)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(es|s)$/, '') : w));
  if (!words.length) return [];
  const hits: { slug: string; score: number }[] = [];
  for (const c of list) {
    const name = ` ${fold(c.name)} ${fold(c.nameFr)} `;
    const kw = ` ${fold(c.keywords ?? '')} ${fold(c.keywordsFr ?? '')} `;
    let score = 0;
    for (const w of words) {
      if (name.includes(` ${w}`)) score += 3;
      else if (kw.includes(` ${w}`)) score += 1;
    }
    if (score) hits.push({ slug: c.slug, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 12).map((h) => h.slug);
}

/** The career without its search keywords (they are only used on the server, by `searchCareers`). */
const strip = (c: CareerRecord): Career => ({
  slug: c.slug,
  slugFr: c.slugFr,
  name: c.name,
  nameFr: c.nameFr,
  envs: c.envs,
  fullTime: c.fullTime,
  partTime: c.partTime,
  officer: c.officer,
  minEd: c.minEd,
  paidEd: c.paidEd,
  categories: c.categories,
  signingBonus: c.signingBonus,
  recruitingAllowance: c.recruitingAllowance,
  priority: c.priority,
  priorityPaidEdOnly: c.priorityPaidEdOnly,
});

/** Everything in the output that depends on the language: official links and source titles. */
function careersRefs(lang: Lang, meta: { live: boolean; asOf: string }): CareersRefs {
  const careersSource = source('careers', lang, meta.live ? { live: true, checked: meta.asOf.slice(0, 10) } : { checked: meta.asOf.slice(0, 10) });
  return {
    lang,
    links: {
      apply: URLS.apply[lang],
      careers: URLS.careers[lang],
      howToJoin: URLS.howToJoin[lang],
      steps: URLS.steps[lang],
      recruitingCentre: URLS.recruitingCentre[lang],
      paidEducation: URLS.paidEducation[lang],
      reserve: URLS.reserve[lang],
      life: URLS.life[lang],
    },
    sources: [
      careersSource,
      source('howToJoin', lang, {
        quote: lang === 'fr' ? 'Vous êtes citoyen canadien ou résident permanent.' : 'You are a Canadian citizen or permanent resident.',
      }),
      source('life', lang, {
        quote:
          lang === 'fr'
            ? 'En tant que nouvelle recrue de la Force régulière du programme d’enrôlement direct, vous pourriez gagner entre 4 337 $ et 5 484 $ par mois pendant votre instruction de base.'
            : 'As a new direct entry recruit in the Regular Force, you could earn anywhere from $4,337 to $5,484 per month, while you complete basic training.',
      }),
    ],
  };
}

export function buildCareers(input: CareersInput, list: CareerRecord[], meta: { live: boolean; asOf: string }): CareersOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const interests = (input.interests ?? []).filter((k): k is Category => (CATEGORIES as readonly string[]).includes(k));
  const answers: Answers = {
    interests: [...new Set(interests)],
    env: input.environment ?? 'any',
    hours: input.hours ?? 'either',
    education: input.education ? EDUCATION[input.education] : undefined,
    path: input.path ?? 'either',
  };
  const query = input.query?.trim().slice(0, 60) || null;
  return {
    live: meta.live,
    asOf: meta.asOf,
    answers,
    query,
    queryHits: searchCareers(list, query),
    careers: list.map(strip),
    facts: CAF,
    ...careersRefs(lang, meta),
    alt: careersRefs(lang === 'fr' ? 'en' : 'fr', meta),
  };
}

/** What the model sees: the top matches only (the full catalogue is for the widget). */
export function careersForModel(o: CareersOutput) {
  const matches = matchCareers(o.careers, o.answers, o.queryHits);
  return {
    live: o.live,
    asOf: o.asOf,
    answers: o.answers,
    query: o.query,
    totalCareers: o.careers.length,
    matchCount: matches.length,
    topMatches: matches.slice(0, 8).map((m) => ({
      name: o.lang === 'fr' ? m.career.nameFr : m.career.name,
      url: careerUrl(m.career, o.lang),
      officer: m.career.officer,
      environments: m.career.envs,
      partTime: m.career.partTime,
      via: m.via,
      // Both are Regular Force only (forces.ca): never offer them to someone looking at the Reserve.
      recruitingAllowance50kRegularForceOnly: m.career.recruitingAllowance && o.answers.hours !== 'part-time',
      signingBonusRegularForceOnly: m.career.signingBonus && o.answers.hours !== 'part-time',
    })),
    facts: o.facts,
    links: o.links,
    sources: o.sources,
    checked: CHECKED,
  };
}
