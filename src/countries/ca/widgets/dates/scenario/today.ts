/** Scripted scenario `dates-today` (EN + FR). "Is today a holiday?" and questions about one day. */
import type { Scenario } from '@/lib/scripted/types';
import { addDays } from '@/lib/dates/business-days';
import { todayInCanada } from '../../../data/holidays';
import { HOLIDAYS_SITE, isChoiceIn } from '../data';
import { CRA_HOLIDAYS_2026 } from '../fallback';
import { dayOff, nextHoliday } from '../select';
import { holidayName, inSentence } from '../names';
import { provinceIn, fmt, PROV_NAME, em, cap, the, type Ctx, guessed, basedOnZone, listFor, names, holidays, C } from './shared';

// One copy per province (below): the follow-ups keep the place, so "Is today a holiday in Ontario?" never
// falls back to a federal answer one turn after an Ontario list.
export const todayScenario: Scenario = {
  id: 'dates-today',
  priority: 9,
  checked: '2026-09-30',
  match: [
    /\bis (it )?(today|tomorrow) a (stat(utory)? |public |bank |federal )?holiday\b/i,
    /\b(today|tomorrow)\b.*\b(stat(utory)?|public|bank) holiday\b/i,
    /\bis today a holiday\b/i,
    /\b(aujourd[’']hui|demain)\b.*\bférié/i,
    /férié.*\b(aujourd[’']hui|demain)\b/i,
  ],
  reply: {
    en: `# {head}

{body}

{outro}`,
    fr: `# {head}

{body}

{outro}`,
  },
  vars: async ({ text, lang, timeZone }: Ctx) => {
    const tomorrow = /\b(tomorrow|demain)\b/i.test(text);
    const day = tomorrow ? addDays(todayInCanada(), 1) : todayInCanada();
    const all = await holidays();
    const p = provinceIn(text);
    const on = all.filter((h) => dayOff(h) === day);
    const when = lang === 'fr' ? (tomorrow ? 'demain' : 'aujourd’hui') : tomorrow ? 'tomorrow' : 'today';
    const When = when.charAt(0).toUpperCase() + when.slice(1);
    const nx = nextHoliday(all, p ?? null, addDays(day, 1));
    const nextLine = nx
      ? lang === 'fr'
        ? `Le prochain jour férié ${p ? PROV_NAME[p].in.fr : 'fédéral'} est ${inSentence(holidayName(nx, p ?? null, 'fr'), 'fr')}, le ${fmt(dayOff(nx), 'fr')}.`
        : `The next ${p ? `statutory holiday ${PROV_NAME[p].in.en}` : 'federal holiday'} is ${inSentence(holidayName(nx, p ?? null, 'en'), 'en')}, on ${fmt(dayOff(nx), 'en')}.`
      : '';
    // The next federal holiday's date is on the CRA's public holidays page (this year's list); otherwise the feed.
    const nextCite = !p && nx && CRA_HOLIDAYS_2026.includes(dayOff(nx)) ? C.cra[lang] : HOLIDAYS_SITE[lang];
    // The widget opens on a province guessed from the time zone: say what applies there.
    const g = guessed(text, timeZone);
    const gHere = g ? on.find((h) => h.provinces.includes(g)) : undefined;
    const gLine = g
      ? lang === 'fr'
        ? gHere
          ? ` ${basedOnZone(g, 'fr')}, c’est ${inSentence(holidayName(gHere, g, 'fr'), 'fr')}, un jour férié.`
          : ` ${basedOnZone(g, 'fr')}, ce n’est pas un jour férié ${when}.`
        : gHere
          ? ` ${basedOnZone(g, 'en')}, it’s ${the(holidayName(gHere, g, 'en'))}${holidayName(gHere, g, 'en')}, a statutory holiday.`
          : ` ${basedOnZone(g, 'en')}, it isn’t a statutory holiday ${when}.`
      : '';
    // A province they named, or one guessed from the time zone: its list is already below, so don't ask them to pick it.
    const known = p ?? g;
    const outro = known
      ? listFor(known, lang)
      : lang === 'fr'
        ? 'Vérifiez votre province ou territoire ci-dessous pour voir le reste de l’année.'
        : 'Check your province or territory below to see the rest of the year.';
    if (!on.length) {
      return lang === 'fr'
        ? { head: `Non, ${when} n’est un jour férié *nulle part au Canada*.`, body: `${nextLine} [1](${nextCite})`, outro }
        : { head: `No, ${when} isn’t a statutory holiday *anywhere in Canada*.`, body: `${nextLine} [1](${nextCite})`, outro };
    }
    const main = on.find((h) => h.clc) ?? on.find((h) => h.federal) ?? on[0];
    // Easter Monday and Civic Holiday: federal public-service days, not Canada Labour Code holidays.
    const psOnly = main.federal && !main.clc;
    const here = p ? on.find((h) => h.provinces.includes(p)) : undefined;
    const others = on.filter((h) => h !== main && h.provinces.length);
    // Without a province the heading already says what kind of day it is (never a bare "Yes"): this line only
    // lists where it's a statutory holiday.
    const where = !p && main.provinces.length && main.federal
      ? lang === 'fr'
        ? `C’est aussi un jour férié dans ces provinces et territoires\u00a0: ${names(main.provinces, 'fr')}.`
        : `It’s also a statutory holiday in ${names(main.provinces, 'en')}.`
      : main.provinces.length
      ? lang === 'fr'
        ? `C’est ${main.clc ? 'un jour férié fédéral, et ' : psOnly ? 'un congé pour la fonction publique fédérale, et ' : ''}un jour férié dans ces provinces et territoires\u00a0: ${names(main.provinces, 'fr')}.`
        : `It’s ${main.clc ? 'a federal holiday, and ' : psOnly ? 'a day off for the federal public service, and ' : ''}a statutory holiday in ${names(main.provinces, 'en')}.`
      : main.clc
        ? p
          ? lang === 'fr'
            ? 'C’est un jour férié fédéral.'
            : 'It’s a federal holiday.'
          : ''
        : lang === 'fr'
          ? 'C’est un congé pour la fonction publique fédérale, mais pas un jour férié au sens du Code canadien du travail.'
          : 'It’s a day off for the federal public service, but not a general holiday under the Canada Labour Code.';
    const alsoLine = others
      .map((h) =>
        lang === 'fr'
          ? h.provinces.length === 1
            ? ` ${cap(PROV_NAME[h.provinces[0]].in.fr)}, c’est ${inSentence(h.name.fr, 'fr')}.`
            : ` Dans ces provinces et territoires, c’est ${inSentence(h.name.fr, 'fr')}\u00a0: ${names(h.provinces, 'fr')}.`
          : ` In ${names(h.provinces, 'en')}, it’s ${inSentence(h.name.en, 'en')}.`,
      )
      .join('');
    // Quebec, Good Friday or Easter Monday: a day off only if the employer chose this one (CNESST).
    const choice = p && !here ? on.find((h) => isChoiceIn(h, p)) : undefined;
    const head = choice
      ? lang === 'fr'
        ? `${When}, c’est ${em(choice.name.fr, 'fr')} : au Québec, c’est un jour férié *si votre employeur l’a choisi* plutôt que l’autre jour de Pâques.`
        : `${When} is ${choice.name.en}: in Quebec, it’s a holiday *if your employer chose it* over the other Easter day.`
      : p
      ? here
        ? lang === 'fr'
          ? `Oui, ${when}, c’est ${em(here.name.fr, 'fr')}, un jour férié ${PROV_NAME[p].in.fr}.`
          : `Yes, ${when} is ${the(here.name.en)}*${here.name.en}*, a statutory holiday ${PROV_NAME[p].in.en}.`
        : lang === 'fr'
          ? `${When}, c’est ${em(main.name.fr, 'fr')}, mais ce n’est pas un jour férié ${PROV_NAME[p].in.fr}.`
          : `${When} is ${the(main.name.en)}*${main.name.en}*, but it isn’t a statutory holiday ${PROV_NAME[p].in.en}.`
      : psOnly && !main.provinces.length
        ? lang === 'fr'
          ? `${When}, c’est ${em(main.name.fr, 'fr')}, mais ce n’est un jour férié dans aucune province ni aucun territoire.`
          : `${When} is ${the(main.name.en)}*${main.name.en}*, but it isn’t a statutory holiday in any province or territory.`
        : main.clc
          ? lang === 'fr'
            ? `${When}, c’est ${em(main.name.fr, 'fr')}, un jour férié fédéral.`
            : `${When} is ${the(main.name.en)}*${main.name.en}*, a federal holiday.`
          : psOnly
            ? lang === 'fr'
              ? `${When}, c’est ${em(main.name.fr, 'fr')}, un congé pour la fonction publique fédérale.`
              : `${When} is ${the(main.name.en)}*${main.name.en}*, a day off for the federal public service.`
            : lang === 'fr'
              ? `${When}, c’est ${em(main.name.fr, 'fr')}, un jour férié dans certaines provinces et certains territoires.`
              : `${When} is ${the(main.name.en)}*${main.name.en}*, a statutory holiday in some provinces and territories.`;
    const cnesst = choice
      ? lang === 'fr'
        ? ` Au Québec, le congé est « le Vendredi saint ou le lundi de Pâques, au choix de l’employeur » (CNESST, lien ci-dessous).`
        : ` In Quebec, the holiday is “Good Friday or Easter Monday, at the employer’s option” (CNESST, linked below).`
      : '';
    return { head, body: `${where}${alsoLine} [1](${psOnly ? C.cra[lang] : C.federal[lang]}) [2](${HOLIDAYS_SITE[lang]})${cnesst}${gLine}\n\n${nextLine}`, outro };
  },
  toolCalls: [
    {
      toolName: 'datesHolidays',
      // The time zone lets the widget open on a guessed province (marked as a guess); the answer stays federal.
      input: ({ text, lang, timeZone }: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => ({ province: provinceIn(text), lang, timeZone }),
    },
  ],
  followUps: {
    en: ['When is the next long weekend?', 'Show me the 2026 benefit payment dates', 'What are the key tax dates?'],
    fr: ['À quand la prochaine longue fin de semaine?', 'Afficher les dates de versement des prestations de 2026', 'Quelles sont les dates clés pour les impôts?'],
  },
};
