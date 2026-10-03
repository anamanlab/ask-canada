/** Example widget tool, Brazil pack: the next days the federal administration is closed. */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { federalDaysOff, HOLIDAYS_URL, nationalHolidays, todayInBrazil } from '../data/holidays';

/** Read 2026-10-02. The statutory ten are law and hold for any year; the pontos facultativos are per-year. */
const CHECKED = '2026-10-02';

export const tools = {
  holidaysNext: tool({
    description:
      'The next days the federal Brazilian administration has no service, and which of them are actually national public holidays ("feriado nacional") versus optional non-service days ("ponto facultativo"). Carnaval and Corpus Christi are pontos facultativos, not feriados nacionais; Good Friday is a feriado nacional. Call it when someone asks which day is next, whether they can go to a federal office, or how long until the next holiday.',
    inputSchema: z.object({
      count: z.number().int().min(1).max(6).optional().describe('How many days to list. Defaults to 3.'),
      timeZone: z.string().optional().describe("The person's IANA time zone, e.g. America/Manaus. Used only for 'today'."),
    }),
    execute: async ({ count = 3, timeZone }) => {
      // "Today" is resolved in the person's own zone, so a late-evening question from Manaus is not
      // answered from tomorrow's date in Brasília. The list spans two years, so the classification covers
      // both: a statutory holiday of next January is a feriado, not a ponto.
      const today = todayInBrazil(timeZone);
      const year = Number(today.slice(0, 4));
      const national = new Set([...nationalHolidays(year), ...nationalHolidays(year + 1)].map((h) => h.date));
      const upcoming = federalDaysOff(timeZone)
        .filter((d) => d.date >= today)
        .slice(0, count)
        .map((d) => ({ date: d.date, name: d.name, kind: national.has(d.date) ? ('feriado' as const) : ('ponto' as const) }));
      return {
        today,
        holidays: upcoming,
        sources: [{ title: 'Feriados nacionais e pontos facultativos', url: HOLIDAYS_URL, checked: CHECKED }],
      };
    },
  }),
} satisfies ToolSet;