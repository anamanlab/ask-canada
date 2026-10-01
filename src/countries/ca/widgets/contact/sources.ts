/**
 * Official pages behind the contact cards, as `ToolSource`s in either language (isomorphic: the tools build
 * the first list on the server; the cards rebuild it for the interface language and the lines on screen).
 * Titles and "Date modified" values: see VERIFIED.md.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, craLeads, type Bi, type Lang, type LineId } from './data';
import { URLS } from './urls';
import type { UrgentSituation } from './types';

const T = {
  cra: { en: 'Contact the Canada Revenue Agency', fr: 'Coordonnées de l’Agence du revenu du Canada' },
  craFast: { en: 'Get faster help from the CRA', fr: 'L’ARC vous offre de l’aide plus rapidement' },
  ei: { en: 'Employment Insurance: contact us', fr: 'Assurance-emploi : nous joindre' },
  cpp: { en: 'Canada Pension Plan: contact us', fr: 'Régime de pensions du Canada : nous joindre' },
  dental: { en: 'Contact the Canadian Dental Care Plan', fr: 'Communiquer avec le Régime canadien de soins dentaires' },
  oCanada: { en: 'Contact 1 800 O-Canada', fr: 'Contactez 1 800 O-Canada' },
  passport: { en: 'Contact the Passport Program', fr: 'Communiquer avec le Programme de passeport' },
  craScam: { en: 'Report a scam or identity theft (CRA)', fr: 'Signaler une arnaque ou un vol d’identité (ARC)' },
  bureauFraud: { en: 'How to report fraud and scams in Canada', fr: 'Comment signaler les fraudes et les arnaques au Canada' },
  craRecognize: { en: 'Recognize a scam (CRA)', fr: 'Reconnaître une arnaque (ARC)' },
  mentalHealth: { en: 'Mental health support: get help', fr: 'Soutien en santé mentale : obtenir de l’aide' },
  crisis988: { en: '9-8-8: Suicide Crisis Helpline', fr: '9-8-8 : Ligne d’aide en cas de crise de suicide' },
};

const src = (key: keyof typeof T, url: Bi, updated: string | undefined, lang: Lang, quote?: Bi): ToolSource => ({
  title: T[key][lang],
  url: url[lang],
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...(quote ? { quote: quote[lang] } : {}),
});

const SOURCE = {
  cra: (l) => src('cra', URLS.cra, '2026-09-23', l),
  craFast: (l) => src('craFast', URLS.craFast, '2026-06-03', l),
  ei: (l) => src('ei', URLS.ei, '2026-06-03', l),
  cpp: (l) => src('cpp', URLS.cpp, '2026-07-23', l),
  dental: (l) => src('dental', URLS.dental, '2026-04-10', l),
  oCanada: (l) => src('oCanada', URLS.oCanada, '2026-09-09', l),
  passport: (l) => src('passport', URLS.passport, '2025-12-19', l),
  craScam: (l) => src('craScam', URLS.craScam, '2026-03-20', l),
  bureauFraud: (l) => src('bureauFraud', URLS.bureauFraud, '2022-01-19', l),
  craRecognize: (l) =>
    src('craRecognize', URLS.craRecognize, '2026-08-06', l, {
      en: 'Messages target individuals who have already lost funds to a scam, promising to help them recover it.',
      fr: 'Il s’agit de messages envoyés par des arnaqueurs qui ciblent des personnes qui ont déjà perdu de l’argent à cause d’une arnaque.',
    }),
  mentalHealth: (l) =>
    src('mentalHealth', URLS.mentalHealth, '2026-01-14', l, {
      en: 'If you’re in immediate danger or need urgent medical support, call 9-1-1.',
      fr: 'Si vous êtes en danger immédiat ou avez besoin d’un soutien médical d’urgence, composez le 911.',
    }),
  crisis988: (l) => src('crisis988', URLS.crisis988, undefined, l),
} satisfies Record<string, (lang: Lang) => ToolSource>;

/** Source key for each line. */
const LINE_SOURCE: Record<LineId, keyof typeof SOURCE> = {
  'cra-individuals': 'cra',
  'cra-benefits': 'cra',
  'cra-business': 'cra',
  ei: 'ei',
  'cpp-oas': 'cpp',
  dental: 'dental',
  'o-canada': 'oCanada',
  passport: 'passport',
  cafc: 'bureauFraud',
};

/** Pages behind a set of visible lines (CRA self-service right after the CRA page when a CRA line leads). */
export function sourcesFor(ids: LineId[], lang: Lang): ToolSource[] {
  const keys: (keyof typeof SOURCE)[] = Array.from(new Set(ids.map((id) => LINE_SOURCE[id])));
  if (craLeads(ids)) keys.splice(keys.indexOf('cra') + 1, 0, 'craFast');
  // The card's footer names its first source on one line: the Competition Bureau's long title follows the others.
  if (keys.length > 1 && keys[0] === 'bureauFraud') keys.push(keys.shift() as 'bureauFraud');
  return keys.map((k) => SOURCE[k](lang));
}

/** Pages behind the urgent card for a situation. */
export function sourcesForUrgent(situation: UrgentSituation, lang: Lang): ToolSource[] {
  switch (situation) {
    case 'fraud':
      return [SOURCE.craScam(lang), SOURCE.bureauFraud(lang), SOURCE.craRecognize(lang)];
    case 'suspected':
      // The CRA contact page is cited in the answer ([2]), so it rides along with its canonical title and date.
      return [SOURCE.craRecognize(lang), SOURCE.cra(lang), SOURCE.craScam(lang), SOURCE.bureauFraud(lang)];
    case 'all':
      return [SOURCE.mentalHealth(lang), SOURCE.crisis988(lang), SOURCE.bureauFraud(lang)];
    default:
      return [SOURCE.mentalHealth(lang), SOURCE.crisis988(lang)];
  }
}
