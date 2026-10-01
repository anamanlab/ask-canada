/**
 * Official page titles and the `sources` entries built from them. Used only where tool outputs are built
 * (build.ts: the tools on the server, the lab fixtures), so the titles stay out of the widgets' bundle.
 * Titles and "Date modified" values were read from each page on the `CHECKED` date (see data.ts).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { URLS, type Lang, type UrlKey } from './data';

export const CHECKED = '2026-09-30';

/** Official page titles (as published), for the Sources list. */
const TITLES: Partial<Record<UrlKey, { en: string; fr: string; updated?: string }>> = {
  expressEntry: { en: 'Immigrate through Express Entry', fr: 'Immigrer dans le cadre d’Entrée express', updated: '2026-06-22' },
  crsCriteria: { en: 'Express Entry: Comprehensive Ranking System (CRS) criteria', fr: 'Entrée express : Critères du Système de classement global (SCG)', updated: '2026-06-22' },
  crsTool: { en: 'Express Entry: Check your score', fr: 'Entrée express : Vérifier votre note', updated: '2026-06-22' },
  rounds: { en: 'Express Entry: Rounds of invitations', fr: 'Entrée express : Rondes d’invitations', updated: '2026-07-10' },
  whoCanApply: { en: 'Express Entry: Who can apply', fr: 'Entrée express : Qui peut présenter une demande', updated: '2026-06-22' },
  fsw: { en: 'Express Entry: Federal Skilled Worker Program', fr: 'Entrée express : Programme des travailleurs qualifiés (fédéral)', updated: '2026-09-24' },
  cec: { en: 'Express Entry: Canadian Experience Class', fr: 'Entrée express : Catégorie de l’expérience canadienne', updated: '2026-09-24' },
  fst: { en: 'Express Entry: Federal Skilled Trades Program', fr: 'Entrée express : Programme des travailleurs de métiers spécialisés (fédéral)', updated: '2026-06-22' },
  eeFunds: { en: 'Documents for Express Entry: Proof of funds', fr: 'Documents pour Entrée express : Preuve de fonds suffisants', updated: '2026-06-22' },
  comeToCanada: { en: 'Do you want to come to Canada as a skilled immigrant?', fr: 'Vous souhaitez venir au Canada à titre d’immigrant qualifié?', updated: '2025-02-10' },
  processing: { en: 'Check current IRCC processing times', fr: 'Vérifiez les délais de traitement actuels de l’IRCC', updated: '2026-09-24' },
  status: { en: 'How to check the status of your IRCC application', fr: 'Comment vérifier l’état de votre demande à IRCC', updated: '2026-08-25' },
  entryByCountry: { en: 'What you need to enter Canada', fr: 'Documents requis pour entrer au Canada', updated: '2026-07-31' },
  checkVisaEta: { en: 'Check if you need a visa or eTA to travel to Canada', fr: 'Vérifiez si vous avez besoin d’un visa ou d’une AVE pour vous rendre au Canada', updated: '2026-09-29' },
  etaX: { en: 'Electronic travel authorization (eTA): Citizens from some visa-required countries', fr: 'Autorisation de voyage électronique (AVE) : Citoyens de certains pays soumis à l’obligation de visa', updated: '2026-07-27' },
  eta: { en: 'Electronic travel authorization (eTA)', fr: 'Autorisation de voyage électronique (AVE)', updated: '2026-06-05' },
  etaFacts: { en: 'Find out about electronic travel authorization (eTA)', fr: 'Savoir ce qu’est une autorisation de voyage électronique (AVE)', updated: '2024-04-23' },
  visitorVisa: { en: 'Visitor visa (temporary resident visa)', fr: 'Visa de visiteur (visa de résident temporaire)', updated: '2026-09-02' },
  applyVisitorVisa: { en: 'How to apply for a visitor visa', fr: 'Comment présenter une demande de visa de visiteur', updated: '2026-08-28' },
  studyPermit: { en: 'Study permit', fr: 'Permis d’études', updated: '2026-04-24' },
  studyEligibility: { en: 'Study permit: Who can apply', fr: 'Permis d’études : Qui peut présenter une demande', updated: '2026-01-26' },
  studyDocs: { en: 'Study permit: Get the right documents', fr: 'Permis d’études : Obtenez les documents requis', updated: '2026-01-26' },
  studyFunds: { en: 'Study permit: Proof of financial support', fr: 'Permis d’études : Preuve de ressources financières', updated: '2026-08-28' },
  studyTool: { en: 'Find out if you need a study permit', fr: 'Vérifiez si vous avez besoin d’un permis d’études', updated: '2026-09-09' },
  offCampus: { en: 'Work off campus as an international student', fr: 'Travailler hors campus à titre d’étudiant étranger', updated: '2026-04-15' },
  pgwp: { en: 'About the post-graduation work permit (PGWP)', fr: 'Au sujet du permis de travail postdiplôme (PTPD)', updated: '2026-03-09' },
  workCanada: { en: 'Work in Canada', fr: 'Travailler au Canada', updated: '2026-06-01' },
  needWorkPermit: { en: 'Find out if you need a work permit', fr: 'Déterminer si vous avez besoin d’un permis de travail', updated: '2026-05-25' },
  fees: { en: 'Citizenship and immigration application fees: Fee list', fr: 'Frais de demande de citoyenneté et d’immigration : Liste des frais' },
  explore: { en: 'Explore immigration programs to live, work, or study in Canada', fr: 'Explorer les programmes d’immigration pour vivre, travailler ou étudier au Canada' },
  parents: { en: 'Sponsor your parents and grandparents', fr: 'Parrainer vos parents et vos grands-parents', updated: '2026-08-18' },
  superVisa: { en: 'Super visa for parents and grandparents', fr: 'Super visa pour parents et grands-parents', updated: '2026-07-06' },
  pnp: { en: 'Immigrate as a provincial nominee', fr: 'Immigrer en tant que candidat d’une province', updated: '2026-09-14' },
};

export function source(key: UrlKey, lang: Lang, extra: Partial<ToolSource> = {}): ToolSource {
  const t = TITLES[key];
  return {
    title: t ? t[lang] : URLS[key][lang],
    url: URLS[key][lang],
    checked: CHECKED,
    ...(t?.updated ? { updated: t.updated } : {}),
    ...extra,
  };
}
