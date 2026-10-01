/** CAF careers: what the person said, as matcher answers (the input of `veteransDefenceCareers`). */
import type { Category, CareersInput } from '../careers';
import { uni } from './shared';

const INTERESTS: [Category, RegExp][] = [
  ['health', /\b(health|medic(al|ine)?|nurs\w*|doctors?|dental|dentists?|pharmac\w*|paramedics?|physio\w*|santé|infirmi\w*|médec\w*|soins|dentaires?)\b/i],
  ['computing', /\b(cyber\w*|comput\w*|IT|tech|technology|intelligence|signals?|informatique|renseignement|numérique)\b/i],
  ['engineering', /\b(engineer\w*|construction|electric\w*|plumb\w*|trades?|génie|ingénie\w*|électri\w*)\b/i],
  ['maintenance', /\b(mechanics?|mechanical|vehicles?|repair\w*|maintenance|mécani\w*|véhicules?|entretien)\b/i],
  ['aviation', /\b(pilots?|aviation|aircraft|fly|flying|planes?|pilote|avions?|aéronefs?)\b/i],
  ['naval', /\b(ships?|sailors?|naval|submarines?|navires?|sous-marins?|marins?)\b/i],
  ['combat', /\b(combat|infantry|infanterie|armou?r|artillery|artillerie|soldiers?|soldats?)\b/i],
  ['safety', /\b(police|firefight\w*|pompiers?|first responders?|premiers? répondants?)\b/i],
  ['logistics', /\b(logisti\w*|drivers?|trucks?|supply|chauffeurs?|camions?|approvisionnement)\b/i],
  ['administration', /\b(admin\w*|finance|HR|human resources|legal|lawyers?|avocats?|ressources humaines|juridiques?)\b/i],
  ['hospitality', /\b(cooks?|chefs?|cuisin\w*|chaplains?|aumôniers?|musicians?|musiciens?)\b/i],
  ['public-relations', /\b(public relations|communications|relations publiques|journalis\w*)\b/i],
];
const NAMED_JOB = uni(
  /\b(pilots?|pilote|cooks?|cuisini\w+|nurses?|infirmi\w+|paramedics?|medics?|firefighters?|pompiers?|mechanics?|mécanicien\w*|engineers?|ingénieur\w*|cyber|doctors?|médecins?|chaplains?|aumôniers?|musicians?|musiciens?|dentists?|dentistes?|pharmacists?|pharmaciens?|lawyers?|avocats?|police|electricians?|électriciens?|plumbers?|plombiers?|sonar|divers?|plongeurs?)\b/i,
);

export function careersInputOf(text: string, lang: 'en' | 'fr'): CareersInput {
  const interests = INTERESTS.filter(([, re]) => uni(re).test(text)).map(([k]) => k);
  const environment = /\b(navy|RCN|marine royale|la marine)\b/i.test(text)
    ? 'navy'
    : /\b(air force|RCAF|aviation royale)\b/i.test(text)
      ? 'air'
      : /\b(army|armée de terre|l['’]armée)\b/i.test(text)
        ? 'army'
        : undefined;
  const hours = /\b(part[- ]time|reserves?|reservist|temps partiel|réserv\w*)\b/i.test(text)
    ? 'part-time'
    : /\b(full[- ]time|regular force|temps plein|force régulière)\b/i.test(text)
      ? 'full-time'
      : undefined;
  const query = text.match(NAMED_JOB)?.[1];
  return {
    ...(interests.length ? { interests } : {}),
    ...(environment ? { environment } : {}),
    ...(hours ? { hours } : {}),
    ...(query ? { query: query.toLowerCase() } : {}),
    lang,
  };
}
