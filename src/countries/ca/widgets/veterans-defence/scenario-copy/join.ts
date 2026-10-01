/** Scripted "join the Canadian Armed Forces" scenarios (EN + FR): general, Reserve, health care, named jobs, how to apply. */
import type { Scenario } from '@/lib/scripted/types';
import { careerUrl } from '../careers';
import { buildCareers } from '../careers-build';
import { cite } from '../data';
import { liveCareers } from '../live';
import { joinVars, link, namedCareers } from './join-answer';
import { careersInputOf } from './join-input';
import { MILITAIRE, MILITARY, type Ctx } from './shared';

/** Every "join the Forces" question, EN + FR. */
const JOIN_MATCH = [
  new RegExp(String.raw`\b(join|joining|enlist\w*|sign up for|apply to|get into)\b.*\b${MILITARY}\b`, 'i'),
  new RegExp(String.raw`\b(military|forces|army|navy|air force|reserves?|CAF)\b.*\b(jobs?|careers?|recruit\w*|occupations?|trades?)\b`, 'i'),
  new RegExp(String.raw`\b(jobs?|careers?|work)\b.*\b(in|with|for) the ${MILITARY}\b`, 'i'),
  new RegExp(String.raw`\bcan i be an? .+\b(in|with) the ${MILITARY}\b`, 'i'),
  /\bforces\.ca\b/i,
  new RegExp(String.raw`\b(joindre|rejoindre|enrôler|m['’]enrôler|s['’]enrôler|intégrer|entrer dans|postuler)\b.*\b${MILITAIRE}\b`, 'i'),
  new RegExp(String.raw`\b(emplois?|carrières?|métiers?|postes?)\b.*\b(forces armées|FAC|militaires?|dans l['’]armée|dans la marine|dans l['’]aviation|dans la réserve)\b`, 'i'),
  new RegExp(String.raw`\b(devenir|être)\b.+\b(dans|chez) (les forces|l['’]armée|la marine|l['’]aviation|la réserve|les FAC)\b`, 'i'),
];
const JOIN_EXCLUDE = [/\b(leav\w*|left|quit\w*|releas\w*|after (the )?(military|forces)|veterans?|quitt\w*|libér\w*|vétérans?)\b/i];
/** `base` only when `also` is somewhere in the text too (in any order). */
const both = (also: RegExp, base: RegExp) => new RegExp(String.raw`^(?=[\s\S]*${also.source})[\s\S]*?${base.source}`, 'i');

const CHIP = {
  health: { en: 'Military jobs in health care', fr: 'Emplois militaires en soins de santé' },
  reserve: { en: 'Part-time jobs in the Reserve', fr: 'Emplois à temps partiel dans la Réserve' },
  pilot: { en: 'Can I be a pilot in the Air Force?', fr: 'Puis-je devenir pilote dans l’Aviation?' },
  apply: { en: 'What are the steps to join the Forces?', fr: 'Quelles sont les étapes pour m’enrôler dans les Forces?' },
  leaving: { en: 'What support is there after I leave the Forces?', fr: 'Quel soutien existe-t-il après mon départ des Forces?' },
} as const;
type ChipKey = keyof typeof CHIP;
/** Follow-up chips, never repeating the question just asked. */
const chips = (keys: ChipKey[], extra?: { en: string; fr: string }) => ({
  en: [...(extra ? [extra.en] : []), ...keys.map((k) => CHIP[k].en)],
  fr: [...(extra ? [extra.fr] : []), ...keys.map((k) => CHIP[k].fr)],
});

const joinScenario = (id: string, priority: number, match: RegExp[], followUps: { en: string[]; fr: string[] }): Scenario => ({
  id,
  priority,
  match,
  exclude: JOIN_EXCLUDE,
  reply: { en: '# {heading}\n\n{body}', fr: '# {heading}\n\n{body}' },
  vars: joinVars,
  toolCalls: [{ toolName: 'veteransDefenceCareers', input: ({ text, lang }: Ctx) => careersInputOf(text, lang) }],
  followUps,
});

const RESERVE = /\b(part[- ]time|reserves?|reservists?|temps partiel|réserv\w*)\b/i;
const HEALTH = /\b(health|medical|santé|soins)\b/i;

/** Named jobs people ask about, with how they'd name them in the next question. */
const JOBS: { key: string; re: RegExp; en: string; fr: string }[] = [
  { key: 'pilot', re: /\b(pilots?|pilotes?)\b/i, en: 'a pilot', fr: 'pilote' },
  { key: 'cook', re: /\b(cooks?|chefs?|cuisinier\w*)\b/i, en: 'a cook', fr: 'cuisinier' },
  { key: 'nurse', re: /\b(nurses?|infirmi\w+)\b/i, en: 'a nurse', fr: 'infirmier' },
  { key: 'medic', re: /\b(medics?|paramedics?|technicien\w* médica\w*)\b/i, en: 'a medic', fr: 'technicien médical' },
  { key: 'firefighter', re: /\b(firefighters?|pompiers?)\b/i, en: 'a firefighter', fr: 'pompier' },
  { key: 'police', re: /\b(military police|police officers?|police militaire|policiers? militaires?)\b/i, en: 'a military police officer', fr: 'policier militaire' },
  { key: 'mechanic', re: /\b(mechanics?|mécanicien\w*)\b/i, en: 'a mechanic', fr: 'mécanicien' },
  { key: 'doctor', re: /\b(doctors?|physicians?|médecins?)\b/i, en: 'a doctor', fr: 'médecin' },
  { key: 'dentist', re: /\b(dentists?|dentistes?)\b/i, en: 'a dentist', fr: 'dentiste' },
  { key: 'pharmacist', re: /\b(pharmacists?|pharmaciens?)\b/i, en: 'a pharmacist', fr: 'pharmacien' },
  { key: 'chaplain', re: /\b(chaplains?|aumôniers?)\b/i, en: 'a chaplain', fr: 'aumônier' },
  { key: 'musician', re: /\b(musicians?|musiciens?)\b/i, en: 'a musician', fr: 'musicien' },
  { key: 'electrician', re: /\b(electricians?|électriciens?)\b/i, en: 'an electrician', fr: 'électricien' },
  { key: 'lawyer', re: /\b(lawyers?|avocats?|legal officers?)\b/i, en: 'a lawyer', fr: 'avocat' },
  { key: 'diver', re: /\b(divers?|plongeurs?)\b/i, en: 'a diver', fr: 'plongeur' },
  { key: 'cyber', re: /\b(cyber\w*)\b/i, en: 'a cyber operator', fr: 'opérateur cyber' },
];
const HEALTH_JOBS = new Set(['nurse', 'medic', 'doctor', 'dentist', 'pharmacist']);
/** Only with a military word: "Can I be a nurse?" alone may be about civilian work. */
const JOB_CONTEXT = new RegExp(String.raw`\b(${MILITARY}|${MILITAIRE})\b`, 'i');

export const joinScenarios: Scenario[] = [
  joinScenario('caf-join', 7, JOIN_MATCH, chips(['health', 'reserve', 'pilot', 'leaving'])),
  joinScenario('caf-join-reserve', 8, JOIN_MATCH.map((re) => both(RESERVE, re)), chips(['health', 'pilot', 'apply'])),
  joinScenario('caf-join-health', 8, JOIN_MATCH.map((re) => both(HEALTH, re)), chips(['reserve', 'apply'], { en: 'Can I be a nurse in the Forces?', fr: 'Puis-je devenir infirmier dans les Forces?' })),
  // A named job ("Can I be a pilot in the Air Force?"): a verdict first, then its own next step.
  ...JOBS.map((j) =>
    joinScenario(
      `caf-job-${j.key}`,
      9,
      [both(j.re, JOB_CONTEXT)],
      // The first chip already asks how to apply: the others go somewhere new (never a second caf-apply).
      chips(j.key === 'pilot' ? ['reserve', 'health'] : HEALTH_JOBS.has(j.key) ? ['pilot', 'reserve'] : ['pilot', 'health'], { en: `How do I apply to be ${j.en} in the Forces?`, fr: `Comment postuler pour devenir ${j.fr} dans les Forces?` }),
    ),
  ),
  {
    id: 'caf-apply',
    priority: 10,
    match: [
      both(JOB_CONTEXT, /\bhow (do|can|would) i (apply|sign up|enlist)\b/i),
      both(JOB_CONTEXT, /\b(steps|process)\b.*\b(join|enlist\w*|apply|applying)\b/i),
      both(JOB_CONTEXT, /\bcomment (postuler|m['’]enrôler|s['’]enrôler)\b/i),
      both(JOB_CONTEXT, /\b(étapes|processus)\b.*\b(enrôler|postuler|rejoindre)\b/i),
    ],
    exclude: [...JOIN_EXCLUDE, /\b(benefits?|VAC|prestations?|ACC|passports?|passeports?)\b/i],
    reply: {
      en: `# You apply online at *forces.ca*, then go through 5 steps with a recruiter.

Start your application online, with your birth certificate, photo ID, school transcripts and any professional licences. Then come a background check (reliability screening), an assessment (employment and personality tests), a medical exam, and an interview with a military career counsellor. ${cite(1, 'steps', 'en')}

You must be at least 17 (with a parent’s or guardian’s consent under 18), a Canadian citizen or permanent resident, and have finished Grade 10 (Secondary IV in Quebec). Officers need a degree, or can get one through paid education. ${cite(2, 'howToJoin', 'en')}

{job}A recruiter guides you from there, and a recruiting centre near you can answer questions first.`,
      fr: `# Vous postulez en ligne sur *forces.ca*, puis vous franchissez 5 étapes avec un recruteur.

Commencez votre demande en ligne, avec votre certificat de naissance, une pièce d’identité avec photo, vos relevés de notes et vos permis professionnels, s’il y a lieu. Suivent une vérification des antécédents (filtrage de sécurité), une évaluation (tests d’emploi et de personnalité), un examen médical et une entrevue avec un conseiller en carrières militaires. ${cite(1, 'steps', 'fr')}

Vous devez avoir au moins 17 ans (avec le consentement d’un parent ou d’un tuteur avant 18 ans), être citoyen canadien ou résident permanent et avoir terminé la 10ᵉ année (4ᵉ secondaire au Québec). Les officiers doivent avoir un diplôme universitaire, ou peuvent l’obtenir grâce aux études payées. ${cite(2, 'howToJoin', 'fr')}

{job}Un recruteur vous accompagne ensuite, et un centre de recrutement près de chez vous peut d’abord répondre à vos questions.`,
    },
    vars: async ({ text, lang }) => {
      const input = careersInputOf(text, lang);
      if (!input.query) return { job: '' };
      try {
        const got = await liveCareers();
        const out = buildCareers(input, got.careers, got);
        const named = namedCareers(out);
        if (named.length !== 1) return { job: '' };
        const c = named[0];
        const name = lang === 'fr' ? c.nameFr : c.name;
        const page = link(3, careerUrl(c, lang), `${name} | ${lang === 'fr' ? 'Forces armées canadiennes' : 'Canadian Armed Forces'}`);
        return {
          job:
            lang === 'fr'
              ? `Dans votre demande, vous choisissez la carrière qui vous intéresse, comme **${name}**, et fournissez les formulaires qu’elle exige. Sa page présente la formation et les exigences. ${page}\n\n`
              : `In your application, you choose the career you want, like **${name}**, and send any forms it needs. Its page has the training and requirements. ${page}\n\n`,
        };
      } catch {
        return { job: '' };
      }
    },
    toolCalls: [{ toolName: 'veteransDefenceCareers', input: ({ text, lang }: Ctx) => careersInputOf(text, lang) }],
    followUps: chips(['health', 'reserve', 'leaving']),
  },
];
