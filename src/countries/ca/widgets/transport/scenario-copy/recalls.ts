/** Scripted answer for vehicle recalls: the heading carries the live count the widget shows. */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../data';
import { liveRecallCount } from '../live';
import { MAKES_PATTERN, vehicleOf } from '../parse';
import { titleCase } from '../recalls-parse';
import { Le, du, elides, le, type Ctx } from './text';

const MAKES = MAKES_PATTERN.replace(/^\\b\(|\)\\b$/g, '');

const vehicleLabel = (text: string, lang: 'en' | 'fr') => {
  const v = vehicleOf(text);
  if (!v.make || !v.model) return null;
  const mm = `${titleCase(v.make.replace(/^chevy$/i, 'Chevrolet').replace(/^vw$/i, 'Volkswagen'))} ${titleCase(v.model)}`;
  return v.year ? (lang === 'fr' ? `${mm} ${v.year}` : `${v.year} ${mm}`) : mm;
};

export const recallsScenario: Scenario = {
  id: 'transport-recalls',
  priority: 10,
  match: [
    new RegExp(`\\brecall(s|ed)?\\b.*\\b(${MAKES}|car|truck|suv|van|minivan|vehicle|motorcycle|vin)\\b`, 'i'),
    new RegExp(`\\b(${MAKES}|car|truck|suv|vehicle)\\b.*\\brecall(s|ed)?\\b`, 'i'),
    new RegExp(`\\brappel(s|é|ée|és)?\\b.*\\b(${MAKES}|voiture|auto|automobile|camion|vus|fourgonnette|véhicule|moto|niv)\\b`, 'i'),
    new RegExp(`\\b(${MAKES}|voiture|véhicule|camion)\\b.*\\brappel(s|é|ée|és)?\\b`, 'i'),
  ],
  exclude: [/\b(car seats?|child seats?|booster|si[èe]ges? d['’]auto|si[èe]ges? pour enfants?|tires?|pneus?)\b/i],
  reply: {
    en: `# {headEn}

Transport Canada keeps every vehicle safety recall issued in Canada in its Motor Vehicle Safety Recalls Database, with what can go wrong and what the company will do about it. [1](${URLS.recallsDb.en})

A recall covers a model, not your specific car. To know if yours still needs the repair, check your 17-character VIN with the manufacturer’s recall lookup or a dealer: Transport Canada lists each manufacturer’s lookup and phone line. [2](${URLS.manufacturers.en}) The manufacturer will almost always make the repair free of charge. [3](${URLS.recallRepair.en})

{bodyEn}`,
    fr: `# {headFr}

Transports Canada répertorie tous les rappels de sécurité de véhicules émis au Canada dans sa Base de données sur les rappels de sécurité des véhicules automobiles, avec le problème en cause et ce que l’entreprise fera pour le corriger. [1](${URLS.recallsDb.fr})

Un rappel vise un modèle, pas votre véhicule en particulier. Pour savoir si le vôtre doit encore être réparé, vérifiez votre NIV de 17 caractères avec l’outil de recherche du fabricant ou auprès d’un concessionnaire : Transports Canada répertorie l’outil et le numéro de téléphone de chaque fabricant. [2](${URLS.manufacturers.fr}) Le fabricant effectue presque toujours la réparation gratuitement. [3](${URLS.recallRepair.fr})

{bodyFr}`,
  },
  vars: async ({ text }) => {
    const v = vehicleOf(text);
    const en = vehicleLabel(text, 'en');
    const fr = vehicleLabel(text, 'fr') ?? '';
    // The live count, so the heading and the widget say the same number (cached: the widget's call reuses it).
    const count = en && v.year ? await liveRecallCount(v.make, v.model, v.year, AbortSignal.timeout(3500)) : null;
    if (en && v.year && count === 0)
      return {
        headEn: `No recalls are *on file* for the ${en}.`,
        headFr: `Aucun rappel n’est *au dossier* pour ${le(fr)}.`,
        bodyEn: 'That doesn’t prove the vehicle is safe: check the model name and your VIN below.',
        bodyFr: 'Cela ne prouve pas que le véhicule est sécuritaire : vérifiez le nom du modèle et votre NIV ci-dessous.',
      };
    if (en && v.year && count)
      return {
        headEn: `The ${en} has *${count === 1 ? '1 recall' : `${count} recalls`}* on file.`,
        headFr: `${Le(fr)} compte *${count === 1 ? '1 rappel' : `${count} rappels`}* au dossier.`,
        bodyEn: 'The newest recalls are first. Open one to see the issue, the safety risk and the fix.',
        bodyFr: 'Les rappels les plus récents sont en premier. Ouvrez-en un pour voir le problème, le risque et la correction.',
      };
    if (en && v.year)
      return {
        headEn: `Here are the safety recalls on file for the *${en}*.`,
        headFr: `Voici les rappels de sécurité au dossier pour ${elides(fr) ? 'l’' : 'le '}*${fr}*.`,
        bodyEn: 'The newest recalls are first. Open one to see the issue, the safety risk and the fix.',
        bodyFr: 'Les rappels les plus récents sont en premier. Ouvrez-en un pour voir le problème, le risque et la correction.',
      };
    if (en)
      return {
        headEn: `${en} recalls are listed *by model year*.`,
        headFr: `Les rappels ${du(fr)} sont classés *par année-modèle*.`,
        bodyEn: 'Tap your model year below to see its recalls. It’s on your registration.',
        bodyFr: 'Touchez votre année-modèle ci-dessous pour voir ses rappels. Elle figure sur votre certificat d’immatriculation.',
      };
    return {
      headEn: 'Let’s check your vehicle for *safety recalls*.',
      headFr: 'Vérifions les *rappels de sécurité* de votre véhicule.',
      bodyEn: 'Tell me the make, model and model year, like “2019 Toyota RAV4”.',
      bodyFr: 'Indiquez-moi la marque, le modèle et l’année-modèle, par exemple « Toyota RAV4 2019 ».',
    };
  },
  toolCalls: [
    {
      toolName: 'transportRecalls',
      input: ({ text, lang, timeZone }: Ctx) => {
        const v = vehicleOf(text);
        return { make: v.make, model: v.model, year: v.year, lang, timeZone };
      },
    },
  ],
};
