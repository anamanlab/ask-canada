/** Scripted answer for grants, loans and business support (EN + FR). Facts and URLs: ../data.ts. */
import { AGENCIES, PROVINCE } from '../data';
import { needIn, provinceIn } from '../parse';
import { c, type Lang } from './cite';

export const fundingReply = {
  en: `# {headEn}\n\n{p1En}\n\n{p2En}\n\n{p3En}\n\nThe tool below links your agency and the programs that fit what you need.`,
  fr: `# {headFr}\n\n{p1Fr}\n\n{p2Fr}\n\n{p3Fr}\n\nL’outil ci-dessous présente votre agence et les programmes qui correspondent à vos besoins.`,
};

export const fundingVars = ({ text }: { text: string }) => {
  const p = provinceIn(text);
  const need = needIn(text);
  const tariffs = need === 'tariffs';
  const agencies = p ? PROVINCE[p].agencies.map((k) => AGENCIES[k]) : [];
  const list = (lang: Lang) => agencies.map((a) => `**${a.short[lang]}**`).join(lang === 'fr' ? ' ou ' : ' or ');
  const bbf = {
    en: (n: number) =>
      tariffs
        ? `For any other help, the **Business Benefits Finder** gives you a personalized list of federal and provincial funding, loans and advice. ${c(n, 'bbf', 'en')}`
        : `Answer its questions about your business and it gives you a personalized list of federal and provincial funding, loans and support. ${c(n, 'bbf', 'en')}`,
    fr: (n: number) =>
      tariffs
        ? `Pour toute autre aide, l’**Outil de recherche d’aide aux entreprises** dresse une liste personnalisée de financement, de prêts et de conseils fédéraux et provinciaux. ${c(n, 'bbf', 'fr')}`
        : `Répondez à ses questions sur votre entreprise pour obtenir une liste personnalisée de financement, de prêts et de soutien fédéraux et provinciaux. ${c(n, 'bbf', 'fr')}`,
  };
  const strong = {
    en: (n: number) => `Answer four questions on the Canada Strong page to see the programs that fit your need, region, size and sector. ${c(n, 'canadaStrong', 'en')}`,
    fr: (n: number) => `Répondez à quatre questions sur la page Un Canada fort pour voir les programmes qui correspondent à votre besoin, à votre région, à votre taille et à votre secteur. ${c(n, 'canadaStrong', 'fr')}`,
  };
  const loan = {
    en: (n: number) => `Looking for a loan? The Canada Small Business Financing Program helps small businesses get loans from banks and credit unions by sharing the risk with lenders: ask your financial institution. ${c(n, 'csbfp', 'en')}`,
    fr: (n: number) => `Vous cherchez un prêt? Le Programme de financement des petites entreprises du Canada aide les petites entreprises à obtenir des prêts auprès des banques et des caisses en partageant le risque avec les prêteurs : renseignez-vous auprès de votre institution financière. ${c(n, 'csbfp', 'fr')}`,
  };
  const agency = {
    en: (n: number) =>
      (p
        ? `Your federal regional development agency, ${list('en')}, also offers advice and financing to businesses in ${agencies.length > 1 ? 'Ontario (by region)' : agencies[0].region.en}.`
        : 'Every region also has a federal regional development agency that offers advice and financing to local businesses.') + ` ${c(n, 'supportFinancing', 'en')}`,
    fr: (n: number) =>
      (p
        ? `Votre agence fédérale de développement régional, ${list('fr')}, offre aussi des conseils et du financement aux entreprises (${agencies.length > 1 ? 'selon votre région de l’Ontario' : agencies[0].region.fr}).`
        : 'Chaque région a aussi une agence fédérale de développement régional qui offre des conseils et du financement aux entreprises.') + ` ${c(n, 'supportFinancing', 'fr')}`,
  };
  const canexport = {
    en: (n: number) =>
      `To export, CanExport SMEs shares the costs of export activities to help businesses enter new international markets. Its last intake closed on August 31, 2026, so check the page for the next one. ${c(n, 'canexport', 'en')}`,
    fr: (n: number) =>
      `Pour exporter, CanExport PME partage les coûts des activités d’exportation pour aider les entreprises à percer de nouveaux marchés internationaux. Sa dernière période de réception des demandes a pris fin le 31 août 2026 : consultez la page pour la prochaine. ${c(n, 'canexport', 'fr')}`,
  };
  return tariffs
    ? {
        headEn: 'Tariff support starts with *four quick questions* about your business.',
        headFr: 'Le soutien lié aux tarifs commence par *quatre questions rapides* sur votre entreprise.',
        p1En: strong.en(1),
        p1Fr: strong.fr(1),
        p2En: bbf.en(2),
        p2Fr: bbf.fr(2),
        p3En: agency.en(3),
        p3Fr: agency.fr(3),
      }
    : {
        headEn: 'Start with the *Business Benefits Finder* for grants, loans and advice.',
        headFr: 'Commencez par l’*Outil de recherche d’aide aux entreprises* pour les subventions, les prêts et les conseils.',
        p1En: bbf.en(1),
        p1Fr: bbf.fr(1),
        p2En: agency.en(2),
        p2Fr: agency.fr(2),
        p3En: need === 'export' ? canexport.en(3) : loan.en(3),
        p3Fr: need === 'export' ? canexport.fr(3) : loan.fr(3),
      };
};
