/** Lab fixtures for the `dates` widget: every state and edge case (built with the tools' own functions). */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildCalendar, buildHolidays } from './build';
import { HOLIDAYS_FALLBACK, PAYMENTS_FALLBACK } from './fallback';
import type { CalendarInput, CalendarOutput, HolidaysInput, HolidaysOutput, LiveNotice } from './types';

const TODAY = '2026-09-30';
const LIVE = { payments: PAYMENTS_FALLBACK, holidays: HOLIDAYS_FALLBACK };
/**
 * The alert shown on the CRA payment-dates page on 2026-09-30 [date modified 2026-07-31], in English and French,
 * every paragraph (the tool reads both; the widget shows the reader's language).
 */
const WILDFIRE: LiveNotice = {
  tone: 'info',
  title: 'Wildfires impact payments',
  body: 'Wildfires have delayed the delivery of a small number of benefit and credit cheques. If you are unable to access your benefit or credit cheques and require immediate assistance call us at 1-800-387-1193 or visit the delivery service alerts on the Canada Post website for updates on mail delivery. Payments by direct deposit will be issued as scheduled.',
  url: 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/benefit-payment-dates.html',
  lang: 'en',
};
const WILDFIRE_FR: LiveNotice = {
  tone: 'info',
  title: 'Incidence des feux de forêt sur les versements de prestations et de crédits',
  body: 'Les feux de forêt ont retardé la livraison d’un petit nombre de chèques de prestations et de crédits. Si vous n’êtes pas en mesure d’accéder à vos chèques de prestations ou de crédits et que vous avez besoin d’aide immédiatement, appelez-nous au 1-800-387-1193 ou consultez les alertes sur le service de livraison sur le site Web de Postes Canada pour obtenir des mises à jour. Les versements par dépôt direct seront effectués comme prévu.',
  url: 'https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/dates-versement-prestations.html',
  lang: 'fr',
};

let n = 0;
const cal = (
  input: CalendarInput & { provinceGuessed?: boolean },
  opts: { today?: string; live?: boolean; notices?: LiveNotice[]; state?: WidgetPart['state'] } = {},
): WidgetPart => {
  const state = opts.state ?? 'output-available';
  const output: CalendarOutput | undefined =
    state === 'output-available'
      ? { ...buildCalendar(input, opts.today ?? TODAY, opts.live === false ? { payments: null, holidays: null } : { ...LIVE, notices: opts.notices }), pinToday: true }
      : undefined;
  return { type: 'tool-datesCalendar', toolCallId: `fx-cal-${++n}`, state, input, output, errorText: state === 'output-error' ? 'Upstream timeout' : undefined };
};
const hol = (input: HolidaysInput & { provinceGuessed?: boolean }, opts: { today?: string; live?: boolean; state?: WidgetPart['state'] } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  const output: HolidaysOutput | undefined =
    state === 'output-available'
      ? { ...buildHolidays(input, opts.today ?? TODAY, opts.live === false ? { holidays: null } : { holidays: HOLIDAYS_FALLBACK }), pinToday: true }
      : undefined;
  return { type: 'tool-datesHolidays', toolCallId: `fx-hol-${++n}`, state, input, output, errorText: state === 'output-error' ? 'Upstream timeout' : undefined };
};

const fixtures: Fixture[] = [
  { name: 'Calendar: streaming input (skeleton)', toolName: 'datesCalendar', part: cal({ lang: 'en' }, { state: 'input-streaming' }) },
  { name: 'Calendar: running (skeleton)', toolName: 'datesCalendar', part: cal({ lang: 'en' }, { state: 'input-available' }) },
  {
    name: 'Calendar: everything, Ontario (hero case, live + CRA alert)',
    toolName: 'datesCalendar',
    part: cal({ province: 'ON', lang: 'en' }, { notices: [WILDFIRE, WILDFIRE_FR] }),
    note: 'Payment dates read live from canada.ca/en/services/benefits/calendar.html; the wildfire alert is read live (EN + FR) from the CRA payment-dates page, with every paragraph, including “direct deposit on schedule”. Ontario adds the Ontario trillium benefit.',
  },
  {
    name: 'Calendar: OAS + CPP only (retiree), November',
    toolName: 'datesCalendar',
    part: cal({ programs: ['oas', 'cpp'], focus: 'payments', month: '2026-11', lang: 'en' }),
  },
  {
    name: 'Calendar: CCB + OAS (one other date: “Then Old Age Security” in the hero, no lone tile)',
    toolName: 'datesCalendar',
    part: cal({ programs: ['ccb', 'oas'], focus: 'payments', lang: 'en' }),
  },
  {
    name: 'Calendar: tax deadlines only, April 2027',
    toolName: 'datesCalendar',
    part: cal({ focus: 'taxes', month: '2027-04', lang: 'en' }),
  },
  {
    name: 'Calendar: Dec 27, nothing left published (fallback data)',
    toolName: 'datesCalendar',
    part: cal({ programs: ['ccb', 'cgeb'], lang: 'en' }, { today: '2026-12-27', live: false }),
    note: 'After the last published 2026 payment: the hero says 2027 dates aren’t out yet; months in 2027 show the “not published” notice.',
  },
  {
    name: 'Calendar: Québec, all programs incl. veterans (long strings: view with ?lang=fr)',
    toolName: 'datesCalendar',
    part: cal({ province: 'QC', programs: ['ccb', 'cgeb', 'oas', 'cpp', 'cwb', 'cdb', 'vdp'], lang: 'fr' }, { notices: [WILDFIRE, WILDFIRE_FR] }),
    note: 'The model passed lang=fr: every visible string, source and notice still follows the UI language (EN here, FR with ?lang=fr). Quebec’s Good Friday reads “Good Friday or Easter Monday”. CPP is followed, so the Quebec Pension Plan note says these CPP dates may not apply.',
  },
  {
    name: 'Calendar: Québec, default programs (CPP off, Quebec Pension Plan note)',
    toolName: 'datesCalendar',
    part: cal({ province: 'QC', lang: 'en' }),
    note: 'CPP eligibility (canada.ca): people who worked only in Quebec, or in Quebec and elsewhere and live there, contact Retraite Québec. The CPP chip starts off; the note under the next dates says why.',
  },
  {
    name: 'Calendar: tax deadlines only, today (instalment hero: “if you pay by instalments”)',
    toolName: 'datesCalendar',
    part: cal({ focus: 'taxes', lang: 'en' }),
    note: 'The RRSP deadline for 2026 taxes (March 1, 2027) is derived from the 60-day rule and marked as expected.',
  },
  {
    name: 'Calendar: Alberta guessed from time zone (ACFB appears)',
    toolName: 'datesCalendar',
    part: cal({ province: 'AB', provinceGuessed: true, lang: 'en' }),
  },
  { name: 'Calendar: error', toolName: 'datesCalendar', part: cal({ lang: 'en' }, { state: 'output-error' }) },

  { name: 'Holidays: running (skeleton)', toolName: 'datesHolidays', part: hol({ province: 'ON' }, { state: 'input-available' }) },
  {
    name: 'Holidays: Ontario (Thanksgiving long weekend next)',
    toolName: 'datesHolidays',
    part: hol({ province: 'ON', lang: 'en' }),
    note: 'Today (Sep 30) is the National Day for Truth and Reconciliation: federal, but not a statutory holiday in Ontario.',
  },
  { name: 'Holidays: British Columbia, today is a holiday', toolName: 'datesHolidays', part: hol({ province: 'BC', lang: 'en' }) },
  {
    name: 'Holidays: “Is Remembrance Day a stat in Ontario?” (no)',
    toolName: 'datesHolidays',
    part: hol({ province: 'ON', holiday: 'Remembrance Day', lang: 'en' }),
  },
  {
    name: 'Holidays: “Is Easter Monday a stat in Ontario?” (no: federal public service only)',
    toolName: 'datesHolidays',
    part: hol({ province: 'ON', holiday: 'Easter Monday', lang: 'en' }),
    note: 'Easter Monday and Civic Holiday are federal public-service days, not Canada Labour Code general holidays: no “federally regulated workplaces observe it” claim.',
  },
  {
    name: 'Holidays: “Is Easter Monday a stat holiday in Quebec?” (it depends: employer’s choice)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', holiday: 'Easter Monday', lang: 'en' }),
    note: 'CNESST: “le Vendredi saint ou le lundi de Pâques, au choix de l’employeur”. canada-holidays.ca lists Easter Monday nowhere; the widget adds the rule.',
  },
  {
    name: 'Holidays: « Le lundi de Pâques est-il férié au Québec? » (ça dépend, French input)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', holiday: 'Lundi de Pâques', lang: 'fr' }),
  },
  {
    name: 'Holidays: “Is Good Friday a stat holiday in Quebec?” (employer’s choice, same as Easter Monday)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', holiday: 'Good Friday', lang: 'en' }),
  },
  {
    name: 'Holidays: « Le Vendredi saint est-il férié au Québec? » (au choix de l’employeur)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', holiday: 'Vendredi saint', lang: 'fr' }),
  },
  {
    name: 'Holidays: “Is Easter Monday a stat holiday?” (no province: not a Canada Labour Code holiday; federal public servants get it)',
    toolName: 'datesHolidays',
    part: hol({ holiday: 'Easter Monday', lang: 'en' }),
    note: 'CRA public-holidays.html lists “Easter Monday – Monday, April 6, 2026”: a day off for the federal public service, so the card never says “isn’t a federal holiday”.',
  },
  {
    name: 'Holidays: Newfoundland and Labrador (6 statutory; the government’s own days in a disclosure)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', lang: 'en' }, { today: '2026-03-10' }),
    note: 'N.L. Labour Standards (“Your Rights at Work”): six paid public holidays. St. Patrick’s Day, St. George’s Day, Victoria Day, the June Holiday, Orangemen’s Day, the National Day for Truth and Reconciliation, Thanksgiving and Boxing Day are the provincial government’s own employee holidays (Treasury Board Secretariat, 2026 Paid Holidays: 14 named days, 8 beyond the statutory 6), listed apart; Regatta Day is a St. John’s civic holiday and isn’t listed.',
  },
  {
    name: 'Holidays: Newfoundland and Labrador, 2027 (government days by name only: no schedule published yet)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', year: 2027, lang: 'en' }),
  },
  {
    name: 'Holidays: “Is St. Patrick’s Day a stat in Newfoundland?” (no: provincial government employees only)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', holiday: 'Saint Patrick’s Day', lang: 'en' }),
    note: 'Next is March 17, 2027, and the Treasury Board Secretariat has published its 2026 schedule only: the calendar date, no day off (the feed’s observed Monday is unofficial), and a line saying the 2027 schedule isn’t out.',
  },
  {
    name: 'Holidays: “Is the June Holiday a stat in Newfoundland?” (no; no 2027 schedule, so no date at all)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', holiday: 'June Holiday', lang: 'en' }),
    note: 'The June Holiday has no calendar date of its own (2026: Monday, June 22, set by the schedule), so without a 2027 schedule the card gives none.',
  },
  {
    name: 'Holidays: “Is Boxing Day a stat in Newfoundland?” (no; the 2026 schedule gives government employees Monday, Dec 28)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', holiday: 'Boxing Day', lang: 'en' }),
  },
  {
    name: 'Holidays: “Is Thanksgiving a stat in Newfoundland?” (no: federal holiday + provincial government employees)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NL', holiday: 'Thanksgiving', lang: 'en' }),
    note: 'Not one of N.L.’s six paid public holidays, but a Canada Labour Code holiday and on the Treasury Board Secretariat’s 2026 Paid Holidays (Monday, October 12, 2026): the answer names both groups who get it.',
  },
  {
    name: 'Holidays: “When is the next long weekend?” (federal, today is a midweek holiday)',
    toolName: 'datesHolidays',
    part: hol({ longWeekend: true, lang: 'en' }),
    note: 'Today (Sep 30) is a midweek federal holiday: never “next”. The hero leads with Thanksgiving, Sat Oct 10 to Mon Oct 12.',
  },
  {
    name: 'Holidays: Quebec list (Good Friday or Easter Monday, employer’s choice)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', year: 2027, lang: 'en' }),
  },
  {
    name: 'Holidays: « La Saint-Jean est-elle fériée au Québec? » (oui, French)',
    toolName: 'datesHolidays',
    part: hol({ province: 'QC', holiday: 'Saint-Jean-Baptiste', lang: 'fr' }),
  },
  {
    name: 'Holidays: Christmas long weekend, Boxing Day on a Saturday (Dec 20, Ontario)',
    toolName: 'datesHolidays',
    part: hol({ province: 'ON', lang: 'en' }, { today: '2026-12-20' }),
  },
  {
    name: 'Holidays: “Is Boxing Day a stat holiday in Ontario?” (yes, on a Saturday: substitute day)',
    toolName: 'datesHolidays',
    part: hol({ province: 'ON', holiday: 'Boxing Day', lang: 'en' }),
    note: 'Ontario ESA: a public holiday on a non-working day gives a substitute day off with pay (or holiday pay by written agreement). The date stays Saturday, Dec 26; Monday, Dec 28 is named only as the federal public service’s day off.',
  },
  { name: 'Holidays: federal (no province yet)', toolName: 'datesHolidays', part: hol({ lang: 'en' }) },
  {
    name: 'Holidays: Nova Scotia, guessed, fallback data (API down)',
    toolName: 'datesHolidays',
    part: hol({ province: 'NS', provinceGuessed: true, lang: 'en' }, { live: false }),
    note: 'canada-holidays.ca unreachable: verified list from data.ts, “Checked” badge instead of “Live”. Nova Scotia has only 6 statutory holidays.',
  },
  { name: 'Holidays: error, Ontario (Ontario’s official list + Try again)', toolName: 'datesHolidays', part: hol({ province: 'ON' }, { state: 'output-error' }) },
  { name: 'Holidays: error, no province (federal page + Try again)', toolName: 'datesHolidays', part: hol({ holiday: 'Easter Monday' }, { state: 'output-error' }) },
];

export default fixtures;
