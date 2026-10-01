/** Scripted scenario `dates-add-calendar` (EN + FR). "Add these to my calendar": points at the widget's own button. */
import type { Scenario } from '@/lib/scripted/types';
// The button's own label, so the answer names the control exactly as it reads on screen.
import widgetEn from '../messages/en.json';
import widgetFr from '../messages/fr.json';
import { programsIn, provinceIn, C, EXCLUDE_OTHER } from './shared';

export const addCalendarScenario: Scenario = {
  id: 'dates-add-calendar',
  priority: 9,
  checked: '2026-09-30',
  exclude: [EXCLUDE_OTHER],
  match: [
    /\b(add|put|save|export|sync|import|get)\b.*\b(to|in|into|on|onto)\b.*\b(my )?(calendar|google calendar|outlook|i?cal|phone)\b/i,
    /\bremind(er)?s?\b.*\b(payments?|deadlines?|holidays?|pay ?days?|CCB|OAS|CPP|GST)\b/i,
    /\b(\.ics|ics file|calendar file)\b/i,
    /\b(ajouter|mettre|exporter|enregistrer|importer)\b.*\b(calendrier|agenda)\b/i,
    /\brappels?\b.*(versement|paiement|échéance|jours férié)/i,
  ],
  reply: {
    en: `# Your key dates can go straight into *your own calendar*.

Choose what you follow below, then tap **${widgetEn['action.add']}**. You get a calendar file that works with Apple Calendar, Google Calendar and Outlook, with a reminder the day before each date. The file is made on your device: nothing is sent anywhere.

{what}`,
    fr: `# Vos dates clés peuvent aller directement dans *votre propre calendrier*.

Choisissez ci-dessous ce que vous suivez, puis touchez **${widgetFr['action.add']}**. Vous obtenez un fichier de calendrier compatible avec Apple Calendrier, Google Agenda et Outlook, avec un rappel la veille de chaque date. Le fichier est créé sur votre appareil : rien n’est envoyé.

{what}`,
  },
  vars: ({ text, lang }) => {
    const hol = /\b(holidays?|long weekends?|stat)\b|férié|longue fin de semaine/i.test(text);
    const tax = /\b(tax|taxes|deadlines?|RRSP|instalments?)\b|impôts?|échéances?|\bREER\b|acomptes?/i.test(text);
    if (hol)
      return {
        what:
          lang === 'fr'
            ? `Les jours fériés viennent de la liste officielle de chaque province et territoire. Les jours de congé déplacés (par exemple quand un jour férié tombe une fin de semaine) sont inclus. [1](${C.federal.fr})`
            : `Holidays come from each province and territory’s official list, including days off that move when a holiday falls on a weekend. [1](${C.federal.en})`,
      };
    if (tax)
      return {
        what:
          lang === 'fr'
            ? `Pour vos impôts de 2026 : cotisation au REER dans les 60 premiers jours de 2027 (soit au plus tard le 1er mars 2027, date que l’ARC confirme chaque année), production et paiement au plus tard le 30 avril 2027, et le 15 juin 2027 pour les travailleurs autonomes (le solde dû reste exigible le 30 avril). [1](${C.filing.fr}) [2](${C.rrspRule.fr})`
            : `For your 2026 taxes: contribute to your RRSP in the first 60 days of 2027 (March 1, 2027; the CRA confirms the date each year), file and pay by April 30, 2027, and file by June 15, 2027 if you’re self-employed (any balance is still due April 30). [1](${C.filing.en}) [2](${C.rrspRule.en})`,
      };
    return {
      what:
        lang === 'fr'
          ? `Les dates de versement viennent du calendrier officiel des prestations. Un versement peut prendre quelques jours à arriver. [1](${C.payCal.fr})`
          : `Payment dates come from the official benefits calendar. A payment can take a few days to arrive. [1](${C.payCal.en})`,
    };
  },
  toolCalls: [
    {
      toolName: 'datesCalendar',
      input: ({ text, lang, timeZone }: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => {
        const tax = /\b(tax|taxes|deadlines?|RRSP|instalments?)\b|impôts?|échéances?|\bREER\b|acomptes?/i.test(text);
        const hol = /\b(holidays?|long weekends?|stat)\b|férié|longue fin de semaine/i.test(text);
        const programs = programsIn(text);
        return {
          programs: programs.length ? programs : undefined,
          focus: hol && !tax && !programs.length ? 'holidays' : tax && !programs.length ? 'taxes' : programs.length ? 'payments' : 'all',
          province: provinceIn(text),
          lang,
          timeZone,
        };
      },
    },
  ],
  followUps: {
    en: ['Show me the 2026 benefit payment dates', 'What are the key tax dates?', 'When is the next long weekend?'],
    fr: ['Afficher les dates de versement des prestations de 2026', 'Quelles sont les dates clés pour les impôts?', 'À quand la prochaine longue fin de semaine?'],
  },
};
