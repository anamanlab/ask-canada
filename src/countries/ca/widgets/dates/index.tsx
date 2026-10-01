'use client';
/**
 * Renderers for the `dates` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   datesCalendar -> KeyDates (benefit payments, tax deadlines, holidays, .ics)
 *   datesHolidays -> Holidays (statutory holidays by province, long weekends, .ics)
 */
import type { Renderers } from '@/lib/widgets/types';
import { Holidays } from './Holidays';
import { KeyDates } from './KeyDatesCalendar';

export const renderers: Renderers = {
  datesCalendar: KeyDates,
  datesHolidays: Holidays,
};
export default renderers;
