/**
 * Scripted scenarios for the `dates` widget (EN + FR). Facts: widgets/dates/data.ts (verified 2026-09-30).
 * Headlines are computed from the same live feeds the tools read (canada.ca benefits calendar,
 * canada-holidays.ca), falling back to the verified data, so the answer and the widget always agree.
 */
import type { Scenario } from '@/lib/scripted/types';
import { PROVINCES } from '../widgets/dates/data';
import { addCalendarScenario } from '../widgets/dates/scenario/add-calendar';
import { holidaysScenario } from '../widgets/dates/scenario/holidays';
import { keyDatesScenario } from '../widgets/dates/scenario/key-dates';
import { paymentCalendarScenario } from '../widgets/dates/scenario/payments';
import { PROV_NAME, When, provinceIn } from '../widgets/dates/scenario/shared';
import { todayScenario } from '../widgets/dates/scenario/today';

const dates: Scenario[] = [paymentCalendarScenario, holidaysScenario, todayScenario, addCalendarScenario, keyDatesScenario];

/** The holidays answer, once for questions without a place and once per province (follow-ups that keep it). */
const i = dates.findIndex((x) => x.id === 'dates-holidays');
const base = dates[i];
const perProvince: Scenario[] = PROVINCES.map((p) => ({
  ...base,
  id: `dates-holidays-${p}`,
  exclude: [...(base.exclude ?? []), new When((text) => provinceIn(text) !== p)],
  followUps: {
    en: [`Is today a holiday ${PROV_NAME[p].in.en}?`, `Add the holidays ${PROV_NAME[p].in.en} to my calendar`, `Show me the 2026 benefit payment dates ${PROV_NAME[p].in.en}`],
    fr: [`Est-ce férié aujourd’hui ${PROV_NAME[p].in.fr}?`, `Ajouter les jours fériés ${PROV_NAME[p].of} à mon calendrier`, `Afficher les dates de versement des prestations de 2026 ${PROV_NAME[p].in.fr}`],
  },
}));
dates.splice(i, 1, { ...base, exclude: [...(base.exclude ?? []), new When((text) => provinceIn(text) != null)] }, ...perProvince);

export default dates;
