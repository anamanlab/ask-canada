/**
 * The words of the scripted jobs answers (EN + FR) that quote live Job Bank numbers: the same cached fetch
 * the tool makes (./live.ts), so the heading and the widget under it always agree. Falls back to plain
 * wording when Job Bank is unreachable. Server only (scenarios/jobs.ts).
 */
import { formatMoney, formatNumber } from '@/lib/i18n/format';
import { URLS, inLocation, inProvince, outlookUrl, wagesUrl, type Lang } from './data';
import { parseJobQuery, parseWageQuery } from './intent';
import { fetchOutlook, fetchWages, resolveLocation, resolveOccupation, searchJobBank } from './live';
import { canonicalQuery, occupationFromTitle } from './occupations';

const intl = (lang: Lang) => (lang === 'fr' ? 'fr-CA' : 'en-CA');
/** The same formatter as the widgets' `fmt.money` / `fmt.number` (useLocale isn't available on the server). */
export const money = (n: number, lang: Lang) => formatMoney(n, intl(lang), 'CAD', { cents: 'always' });
const num = (n: number, lang: Lang) => formatNumber(n, intl(lang));
export const link = (n: number, url: string, title: string) => `[${n}](${url} "${title.replace(/"/g, '')}")`;

const inPlace = inProvince;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const T = {
  jobBank: { en: 'Job Bank: find a job', fr: 'Guichet-Emplois : trouver un emploi' },
  gcJobs: { en: 'Government of Canada jobs', fr: 'Emplois au gouvernement du Canada' },
  wages: { en: 'Job Bank: wages', fr: 'Guichet-Emplois : salaires' },
  outlook: { en: 'Job Bank: job prospects', fr: 'Guichet-Emplois : perspectives d’emploi' },
  trends: { en: 'Job Bank: explore careers', fr: 'Guichet-Emplois : explorer les carrières' },
  resume: { en: 'Job Bank Resume Builder', fr: 'Concepteur de CV du Guichet-Emplois' },
  fswep: { en: 'Federal Student Work Experience Program', fr: 'Programme fédéral d’expérience de travail étudiant' },
  pay: { en: 'Student rates of pay', fr: 'Taux de rémunération des étudiants' },
  csj: { en: 'Canada Summer Jobs', fr: 'Emplois d’été Canada' },
  youth: { en: 'Job Bank: youth', fr: 'Guichet-Emplois : jeunesse' },
  yess: { en: 'Youth Employment and Skills Strategy', fr: 'Stratégie emploi et compétences jeunesse' },
};

/* ---------------------------------------------------------------- search */

export async function searchAnswer(text: string, lang: Lang): Promise<Record<string, string>> {
  const q = parseJobQuery(text);
  if (!q) return {};
  const query = canonicalQuery(q.query, lang);
  // Same cached lookups as the tool (live.ts), so the heading and the widget always agree.
  const { loc, unresolved } = await resolveLocation(q.location, lang);
  const live = await searchJobBank(lang, query, loc, { remote: q.remote, student: q.student, recent: q.recent });
  const where = inLocation(lang, loc);
  const occ = occupationFromTitle(query);
  // A filter-only search ("student jobs in Toronto") is named for what it is, never as a quoted keyword.
  const studentOnly = !query && !!q.student;
  const fr = lang === 'fr';
  const quoted = fr ? `« ${query} »` : `“${query}”`;
  const searchOf = studentOnly ? (fr ? 'd’emplois pour étudiants' : 'student job') : quoted;
  const n = live?.total ?? 0;
  // Never claim "across Canada" (or any other place) when the place that was asked for couldn't be searched.
  const placeMissed = !!unresolved || (!!q.location && loc.kind === 'canada');
  const headline = placeMissed
    ? fr
      ? `# Voici votre recherche ${searchOf} au *Guichet-Emplois*.`
      : `# Here’s your ${searchOf} search on *Job Bank*.`
    : live && n
      ? studentOnly
        ? fr
          ? `# Le Guichet-Emplois compte *${num(n, lang)} ${n === 1 ? 'offre ouverte' : 'offres ouvertes'} pour étudiants* ${where}.`
          : `# Job Bank has *${num(n, lang)} open student ${n === 1 ? 'job' : 'jobs'}* ${where} right now.`
        : fr
          ? `# Le Guichet-Emplois compte *${num(n, lang)} offres ouvertes* pour ${quoted} ${where}.`
          : `# Job Bank has *${num(n, lang)} open postings* for ${quoted} ${where} right now.`
      : live && live.total === 0
        ? fr
          ? `# Aucune offre ${studentOnly ? 'pour étudiants' : `pour ${quoted}`} ${where} *aujourd’hui*.`
          : `# There are no ${studentOnly ? 'student job' : quoted} postings ${where} *today*.`
        : fr
          ? `# Voici votre recherche ${searchOf} ${where} au *Guichet-Emplois*.`
          : `# Here’s your ${searchOf} search ${where} on *Job Bank*.`;
  const pay = occ
    ? lang === 'fr'
      ? `\n\nPour la profession ${occ.title.fr.toLowerCase()}, le salaire médian au Canada est de **${money(occ.wage.median, lang)} de l’heure**. ${link(3, wagesUrl(lang, occ.profileId), T.wages.fr)}`
      : `\n\nFor ${occ.title.en.toLowerCase()}s, the median wage in Canada is **${money(occ.wage.median, lang)} an hour**. ${link(3, wagesUrl(lang, occ.profileId), T.wages.en)}`
    : '';
  // The last line follows what the widget below really shows: postings, an empty state, or the deep link.
  const outro = !live
    ? fr
      ? 'Ouvrez la même recherche au Guichet-Emplois ci-dessous.'
      : 'Open the same search on Job Bank below.'
    : n === 0
      ? fr
        ? loc.kind === 'canada'
          ? 'Créez une alerte-emploi au Guichet-Emplois pour être avisé des nouvelles offres.'
          : 'Élargissez la recherche à tout le Canada ci-dessous ou créez une alerte-emploi au Guichet-Emplois.'
        : loc.kind === 'canada'
          ? 'Set up a Job Alert on Job Bank to hear about new postings.'
          : 'Widen the search to all of Canada below, or set up a Job Alert on Job Bank.'
      : fr
        ? 'Filtrez et triez les premières offres ci-dessous, sauvegardez celles qui vous plaisent sur cet appareil ou ouvrez la recherche complète au Guichet-Emplois.'
        : 'Filter and sort the top postings below, save the ones you like on this device, or open the full search on Job Bank.';
  return { headline, pay, outro };
}

/* ---------------------------------------------------------------- wages */

export async function wageAnswer(text: string, lang: Lang): Promise<Record<string, string>> {
  const w = parseWageQuery(text);
  if (!w) return {};
  const occ = await resolveOccupation(w.occupation, lang);
  const cat = occupationFromTitle(w.occupation);
  const title = (cat?.title[lang] ?? occ?.title ?? w.occupation).toLowerCase();
  if (!occ) {
    return {
      headline: lang === 'fr' ? `# Job Bank ne reconnaît pas encore *${w.occupation}*.` : `# Job Bank doesn’t recognise *${w.occupation}* as a job title.`,
      body:
        lang === 'fr'
          ? `Essayez un nom plus courant pour ce métier. Le Guichet-Emplois présente les salaires et les perspectives de chaque profession au Canada. ${link(1, URLS.trendAnalysis.fr, T.trends.fr)}`
          : `Try a more common name for the job. Job Bank shows wages and job prospects for every occupation in Canada. ${link(1, URLS.trendAnalysis.en, T.trends.en)}`,
    };
  }
  const [nat, reg, out] = await Promise.all([fetchWages(occ.profileId, 'ca'), w.province ? fetchWages(occ.profileId, w.province, lang) : null, fetchOutlook(occ.profileId)]);
  const row = w.province ? (reg?.provinces.find((p) => p.code === w.province) ?? nat?.provinces.find((p) => p.code === w.province)) : nat?.national;
  const fallback = !row?.median && cat ? cat.wage : null;
  const median = row?.median ?? fallback?.median;
  const low = row?.low ?? fallback?.low;
  const high = row?.high ?? fallback?.high;
  const place = w.province && row?.median ? w.province : undefined;
  const wUrl = wagesUrl(lang, occ.profileId, place ?? 'ca');
  if (median == null) {
    return {
      headline: lang === 'fr' ? `# Voici les salaires du Guichet-Emplois pour *${title}*.` : `# Here’s what Job Bank shows for *${title}* pay.`,
      body: lang === 'fr' ? `Le rapport complet présente les salaires par province et par région. ${link(1, wUrl, T.wages.fr)}` : `The full report shows wages by province and region. ${link(1, wUrl, T.wages.en)}`,
    };
  }
  const o = place ? out?.[place] : undefined;
  const outlookLabel = o ? (lang === 'fr' ? ['non évaluées', 'très limitées', 'limitées', 'modérées', 'bonnes', 'très bonnes'][o.stars] : o.label.toLowerCase()) : '';
  const headline =
    lang === 'fr'
      ? `# ${cap(title)} : le salaire médian ${inPlace(lang, place)} est de *${money(median, lang)} de l’heure*.`
      : `# The median wage for ${title}s ${inPlace(lang, place)} is *${money(median, lang)} an hour*.`;
  const range =
    low != null && high != null
      ? lang === 'fr'
        ? `L’écart publié par le Guichet-Emplois va de **${money(low, lang)}** (bas) à **${money(high, lang)}** (élevé) de l’heure. ${link(1, wUrl, T.wages.fr)}`
        : `Job Bank’s range for this job runs from **${money(low, lang)}** (low) to **${money(high, lang)}** (high) an hour. ${link(1, wUrl, T.wages.en)}`
      : link(1, wUrl, T.wages[lang]);
  const outlook = o
    ? lang === 'fr'
      ? `\n\nPour les 3 prochaines années, le Guichet-Emplois juge les perspectives d’emploi **${outlookLabel}** ${inPlace(lang, place)}. ${link(2, outlookUrl(lang, occ.profileId, place), T.outlook.fr)}`
      : `\n\nOver the next 3 years, Job Bank rates job prospects ${inPlace(lang, place)} as **${outlookLabel}**. ${link(2, outlookUrl(lang, occ.profileId, place), T.outlook.en)}`
    : '';
  const data =
    lang === 'fr'
      ? `Ces salaires proviennent surtout de l’Enquête sur la population active de Statistique Canada (${nat?.refPeriod ?? '2023-2024'}) et ont été mis à jour le 19 novembre 2025.`
      : `These wages come mostly from Statistics Canada’s Labour Force Survey (${nat?.refPeriod ?? '2023-2024'}) and were updated on November 19, 2025.`;
  return { headline, body: `${range}${outlook}\n\n${data}` };
}
