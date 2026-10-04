/**
 * Lab fixtures for the `holidays` widget: every state and the edge cases that matter.
 *
 * The outputs are built with the pack's own data (`data/holidays.ts`), so a fixture can never drift from
 * what the tool would return. Every fixture is pinned to an explicit date: the outputs must never depend on
 * the clock at module load, because Workers evaluate modules with the clock at the Unix epoch and a
 * `todayInBrazil()` call there would freeze every list on 1969-1970.
 */
import { HOLIDAYS_URL, nationalHolidays, PONTOS_FACULTATIVOS } from '../../data/holidays';
import type { Holiday } from '@/lib/dates/business-days';
import type { Fixture, ToolSource, WidgetPart } from '@/lib/widgets/types';

const CHECKED = '2026-10-02';
const SOURCE: ToolSource = {
  title: 'Feriados nacionais e pontos facultativos',
  url: HOLIDAYS_URL,
  checked: CHECKED,
};

type Day = { date: string; name: Holiday['name']; kind: 'feriado' | 'ponto' };
type Output = { today: string; holidays: Day[]; sources: ToolSource[] };

/** The same shape the tool returns, for a given day and count. Years are derived from `today`, never read
 * from the clock, so the fixture is identical in tests, local dev and Workers (see the header note). */
function outputFor(today: string, count: number): Output {
  // Two years, like the tool: the list spans the year boundary, so the kind must be classified across it.
  const year = Number(today.slice(0, 4));
  const days: Holiday[] = [...nationalHolidays(year), ...nationalHolidays(year + 1), ...(PONTOS_FACULTATIVOS[year] ?? []), ...(PONTOS_FACULTATIVOS[year + 1] ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const national = new Set([...nationalHolidays(year), ...nationalHolidays(year + 1)].map((h) => h.date));
  const holidays = days
    .filter((d) => d.date >= today)
    .slice(0, count)
    .map((d) => ({ date: d.date, name: d.name, kind: (national.has(d.date) ? 'feriado' : 'ponto') as Day['kind'] }));
  return { today, holidays, sources: [SOURCE] };
}

let n = 0;
const part = (input: { count?: number }, opts: { today?: string; state?: WidgetPart['state']; output?: Output } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-holidaysNext',
    toolCallId: `fx-holidays-${++n}`,
    state,
    input,
    output: state === 'output-available' ? (opts.output ?? outputFor(opts.today ?? CHECKED, input.count ?? 3)) : undefined,
    errorText: state === 'output-error' ? 'Upstream timeout' : undefined,
  };
};

const fixtures: Fixture[] = [
  { name: 'Streaming input', toolName: 'holidaysNext', part: part({}, { state: 'input-streaming' }) },
  { name: 'Input available, no output yet', toolName: 'holidaysNext', part: part({ count: 3 }, { state: 'input-available' }) },
  {
    name: 'Early October 2026 (both kinds present)',
    toolName: 'holidaysNext',
    part: part({ count: 4 }, { today: '2026-10-02' }),
    note: 'Pinned to the verification date: Nossa Senhora Aparecida (feriado) followed by Dia do Servidor Público (ponto).',
  },
  {
    name: 'Carnaval: ponto facultativo, not a feriado',
    toolName: 'holidaysNext',
    part: part({ count: 6 }, { today: '2026-02-10', output: outputFor('2026-02-10', 6) }),
    note: 'The distinction this widget exists for: Carnaval rows are labelled "ponto facultativo".',
  },
  {
    name: 'Longest list asked for',
    toolName: 'holidaysNext',
    part: part({ count: 6 }, { output: outputFor('2026-12-01', 6) }),
  },
  {
    name: 'December: year rolls over',
    toolName: 'holidaysNext',
    part: part({ count: 4 }, { output: outputFor('2026-12-20', 4) }),
    note: 'Shows the statutory holidays of the following year, so no invented 2027 ponto facultativo appears.',
  },
  {
    name: 'Empty',
    toolName: 'holidaysNext',
    part: part({ count: 3 }, { output: { today: '2035-01-01', holidays: [], sources: [SOURCE] } }),
  },
  { name: 'Error', toolName: 'holidaysNext', part: part({}, { state: 'output-error' }) },
];

export default fixtures;