/**
 * CAF careers: the scripted answer, computed from the same live list the widget shows (a verdict for a named
 * job, the top matches for interests, or the general "how to join" answer).
 */
import { careerUrl, matchCareers } from '../careers';
import { buildCareers } from '../careers-build';
import { cite } from '../data';
import { liveCareers } from '../live';
import { careersInputOf } from './join-input';
import type { Ctx } from './shared';

const ENV_NAME = {
  en: { army: 'the Canadian Army', navy: 'the Royal Canadian Navy', air: 'the Royal Canadian Air Force' },
  fr: { army: 'l’Armée canadienne', navy: 'la Marine royale canadienne', air: 'l’Aviation royale canadienne' },
} as const;
const ENV_SHORT = { en: { army: 'the Army', navy: 'the Navy', air: 'the Air Force' }, fr: { army: 'l’Armée', navy: 'la Marine', air: 'l’Aviation' } } as const;
/** forces.ca "Minimum Required Education" levels, as a phrase. */
const ED = {
  en: ['', 'Grade 10 (Secondary IV in Quebec)', 'a high school diploma', 'a college diploma', 'a bachelor’s degree', 'a graduate degree'],
  fr: ['', 'une 10ᵉ année (4ᵉ secondaire au Québec)', 'un diplôme d’études secondaires', 'un diplôme d’études collégiales', 'un baccalauréat', 'un diplôme d’études supérieures'],
};
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[·•]/g, '');
const stemOf = (q: string) => {
  const w = fold(q).trim();
  // "nurses" → "nurs" (Nursing Officer), "pilotes" → "pilot", "cooks" → "cook".
  return w.length > 4 ? w.replace(/(es|s)$/, '').replace(/e$/, '') : w.replace(/s$/, '');
};
/** What people call a job, when forces.ca names the career differently. */
const ALIAS: Record<string, string> = {
  medic: 'combat medic',
  doctor: 'medical officer',
  physician: 'medical officer',
  medecin: 'medical officer',
  lawyer: 'legal officer',
  police: 'military police',
  pharmacist: 'pharmacy officer',
  electrician: 'electrical',
  electricien: 'electrical',
  mecanicien: 'mechanic',
  chef: 'cook',
};
/** Careers named after the job someone asked about ("pilot" → Pilot; "nurse" → the nursing careers). */
export function namedCareers(out: ReturnType<typeof buildCareers>) {
  if (!out.query) return [];
  const q = fold(out.query).trim();
  const phrase = ALIAS[q] ?? ALIAS[q.replace(/s$/, '')] ?? stemOf(q);
  const re = new RegExp(`(^|[^a-z])${phrase.replace(/[^a-z ]/g, '')}`);
  return out.careers.filter((c) => re.test(fold(`${c.name} ${c.nameFr}`)));
}
const list = (items: string[], lang: 'en' | 'fr') => new Intl.ListFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'long', type: 'conjunction' }).format(items);
export const link = (n: number, url: string, title: string) => `[${n}](${url} "${title.replace(/"/g, '')}")`;

export async function joinVars({ text, lang }: Ctx): Promise<Record<string, string>> {
  const fr = lang === 'fr';
  const input = careersInputOf(text, lang);
  const requirements = fr
    ? `Pour vous enrôler, vous devez avoir au moins 17 ans (avec le consentement d’un parent ou d’un tuteur si vous avez moins de 18 ans), être citoyen canadien ou résident permanent et avoir terminé la 10ᵉ année (4ᵉ secondaire au Québec). Les officiers doivent avoir terminé la 12ᵉ année et un baccalauréat, ou peuvent l’obtenir grâce à un programme d’études payées. ${cite(2, 'howToJoin', lang)}`
    : `To join, you must be at least 17 (with a parent’s or guardian’s consent if you’re under 18), a Canadian citizen or permanent resident, and have finished Grade 10 (Secondary IV in Quebec). Officers need Grade 12 and a bachelor’s degree, or can earn one through a paid education program. ${cite(2, 'howToJoin', lang)}`;
  const service = (n: number) =>
    input.hours === 'part-time'
      ? fr
        ? `Dans la Réserve, vous vous entraînez avec une unité près de chez vous, lors de soirées d’entraînement et d’au moins une fin de semaine par mois, et les postes offerts dépendent de votre région. ${cite(n, 'reserve', lang)} L’indemnité de recrutement de 50 000 $ et les primes à la signature sont réservées à la Force régulière. ${cite(n + 1, 'life', lang)}`
        : `In the Reserve, you train with a unit near home, on training nights and at least one weekend a month, and the jobs on offer depend on where you live. ${cite(n, 'reserve', lang)} The $50,000 recruiting allowance and signing bonuses are for the Regular Force only. ${cite(n + 1, 'life', lang)}`
      : fr
        ? `Vous pouvez servir à temps plein dans la Force régulière, ou à temps partiel dans la Réserve, près de chez vous. Comme nouvelle recrue de la Force régulière, vous pourriez gagner de 4 337 $ à 5 484 $ par mois pendant l’instruction de base. ${cite(n, 'life', lang)}`
        : `You can serve full-time in the Regular Force, or part-time in the Reserve close to home. As a new Regular Force recruit, you could earn $4,337 to $5,484 a month during basic training. ${cite(n, 'life', lang)}`;
  // The same memoized list the tool uses: the sentence says "live" only when the widget will show a live list.
  const got = await liveCareers().catch(() => null);
  const live = !!got?.live;
  const generic = {
    heading: fr
      ? 'Vous postulez en ligne sur *forces.ca*, et l’outil ci-dessous vous montre les carrières qui vous conviennent.'
      : 'You apply online at *forces.ca*, and the matcher below shows which careers fit you.',
    body: [
      fr
        ? `Choisissez ce qui vous plaît : l’outil trie ${live ? 'en direct ' : ''}toutes les carrières de forces.ca, et chacune mène à sa page officielle. ${cite(1, 'careers', lang)}`
        : `Pick what you enjoy: the matcher sorts every career on forces.ca${live ? ', live' : ''}, and each one links to its official page. ${cite(1, 'careers', lang)}`,
      requirements,
      service(3),
    ].join('\n\n'),
  };
  if (!got || !(input.interests?.length || input.environment || input.hours || input.query)) return generic;
  const out = buildCareers(input, got.careers, got);
  const matches = matchCareers(out.careers, out.answers, out.queryHits);

  // A named job ("Can I be a pilot?"): answer that question first, yes or no, from the career's own page.
  const named = namedCareers(out);
  if (named.length === 1) {
    const c = named[0];
    const name = fr ? c.nameFr : c.name;
    const envs = list(c.envs.map((e) => ENV_NAME[lang][e]), lang);
    const asked = input.environment && input.environment !== 'any' ? input.environment : null;
    const wrongEnv = asked && !c.envs.includes(asked);
    const wrongHours = (input.hours === 'part-time' && !c.partTime) || (input.hours === 'full-time' && !c.fullTime);
    const heading = wrongEnv
      ? fr
        ? `Pas dans ${ENV_SHORT.fr[asked]} : *${name}* est une carrière de ${envs}.`
        : `Not in ${ENV_SHORT.en[asked]}: *${name}* is a career in ${envs}.`
      : fr
        ? `Oui. *${name}* est une carrière ${c.officer ? 'd’officier' : 'de militaire du rang'} dans ${envs}.`
        : `Yes. *${name}* is ${c.officer ? 'an officer' : 'a non-commissioned'} career in ${envs}.`;
    let n = 1;
    const page = link(n++, careerUrl(c, lang), `${name} | ${fr ? 'Forces armées canadiennes' : 'Canadian Armed Forces'}`);
    const paid = c.paidEd ? cite(n++, 'paidEducation', lang) : '';
    const school = c.officer
      ? fr
        ? `Comme officier, il vous faut ${ED.fr[c.minEd]}. ${page}${c.paidEd ? ` Vous n’en avez pas encore? Les FAC peuvent payer vos études au complet et vous verser un salaire pendant que vous étudiez. ${paid}` : ''}`
        : `As an officer, you need ${ED.en[c.minEd]}. ${page}${c.paidEd ? ` Don’t have one yet? The Forces can pay for all of your school fees and pay you a salary while you study. ${paid}` : ''}`
      : fr
        ? `Vous pouvez postuler avec ${ED.fr[c.minEd]}. La formation, la solde et les exigences sont sur la page de la carrière. ${page}${c.paidEd ? ` Des études payées sont aussi offertes. ${paid}` : ''}`
        : `You can apply with ${ED.en[c.minEd]}. Training, pay and requirements are on the career page. ${page}${c.paidEd ? ` Paid education is also available. ${paid}` : ''}`;
    const lifeCite = cite(n++, 'life', lang);
    const hours = fr
      ? `${c.fullTime && c.partTime ? 'Vous pouvez l’exercer à temps plein dans la Force régulière ou à temps partiel dans la Réserve.' : c.fullTime ? `C’est une carrière à temps plein, dans la Force régulière${wrongHours ? ' seulement : elle n’est pas offerte dans la Réserve' : ''}.` : `C’est une carrière à temps partiel, dans la Réserve${wrongHours ? ' seulement' : ''}.`}${c.recruitingAllowance && c.fullTime && input.hours !== 'part-time' ? ' Dans la Force régulière, elle fait partie des carrières qui offrent une indemnité de recrutement de 50 000 $.' : ''} ${lifeCite}`
      : `${c.fullTime && c.partTime ? 'You can do it full-time in the Regular Force or part-time in the Reserve.' : c.fullTime ? `It’s a full-time, Regular Force career${wrongHours ? ' only: it isn’t offered in the Reserve' : ''}.` : `It’s a part-time Reserve career${wrongHours ? ' only' : ''}.`}${c.recruitingAllowance && c.fullTime && input.hours !== 'part-time' ? ' In the Regular Force, it’s one of the careers that offer a $50,000 recruiting allowance.' : ''} ${lifeCite}`;
    const next = fr
      ? `L’outil ci-dessous la place en tête, avec les autres carrières qui correspondent à votre demande. Quand vous êtes prêt, postulez sur forces.ca.`
      : `The matcher below lists it first, with other careers that fit what you asked. When you’re ready, apply on forces.ca.`;
    return { heading, body: [school, hours, next].join('\n\n') };
  }

  if (named.length > 1 && matches.length) {
    // Several careers carry that name ("engineer"): say yes, then name them.
    const ranked = matches.filter((m) => named.includes(m.career)).slice(0, 4);
    const all = list(ranked.map((m) => `**${fr ? m.career.nameFr : m.career.name}**`), lang);
    return fr
      ? {
          heading: `Oui. *${named.length} carrières des Forces armées canadiennes* correspondent à « ${input.query} ».`,
          body: [`Par exemple : ${all}. Chacune a sa page sur forces.ca, avec la formation, la solde et les exigences, et l’outil ci-dessous les place en tête. ${cite(1, 'careers', lang)}`, service(2)].join('\n\n'),
        }
      : {
          heading: `Yes. *${named.length} Canadian Armed Forces careers* match “${input.query}”.`,
          body: [`For example: ${all}. Each has its own page on forces.ca, with training, pay and requirements, and the matcher below lists them first. ${cite(1, 'careers', lang)}`, service(2)].join('\n\n'),
        };
  }

  if (!matches.length) return generic;
  const names = matches.slice(0, 3).map((m) => `**${fr ? m.career.nameFr : m.career.name}**`);
  const top = list(names, lang);
  const k = matches.length;
  const reserve = input.hours === 'part-time';
  const heading = fr
    ? k === 1
      ? `*Une carrière${reserve ? ' à temps partiel' : ''}* des Forces armées canadiennes correspond à votre demande.`
      : `*${k} carrières${reserve ? ' à temps partiel' : ''}* des Forces armées canadiennes correspondent à votre demande.`
    : k === 1
      ? `*One${reserve ? ' part-time' : ''} Canadian Armed Forces career* fits what you asked.`
      : `*${k}${reserve ? ' part-time' : ''} Canadian Armed Forces careers* fit what you asked.`;
  const lead = fr
    ? `En tête de liste : ${top}. Chacune mène à sa page officielle sur forces.ca, avec la formation, la solde et les exigences. Changez vos réponses ci-dessous pour en voir d’autres. ${cite(1, 'careers', lang)}`
    : `Top matches: ${top}. Each links to its official page on forces.ca, with training, pay and requirements. Change your answers below to see others. ${cite(1, 'careers', lang)}`;
  return { heading, body: [lead, requirements, service(3)].join('\n\n') };
}
