/**
 * Lab fixtures for the `holidays` widget: every state and the edge cases that matter.
 *
 * The outputs are built with the pack's own data (`data/holidays.ts`), so a fixture can never drift from
 * what the tool would return. Note `today` is pinned: `federalDaysOff()` is relative to the real date, and a
 * fixture that moved would show a different list every run.
 */
import { federalDaysOff, HOLIDAYS_URL, nationalHolidays, todayInBrazil } from '../../data/holidays';
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

/** The same shape the tool returns, for a given day and count. */
function outputFor(today: string, count: number): Output {
  // Two years, like the tool: the list spans the year boundary, so the kind must be classified across it.
  const year = Number(today.slice(0, 4));
  const national = new Set([...nationalHolidays(year), ...nationalHolidays(year + 1)].map((h) => h.date));
  const holidays = federalDaysOff()
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
    output: state === 'output-available' ? (opts.output ?? outputFor(opts.today ?? todayInBrazil(), input.count ?? 3)) : undefined,
    errorText: state === 'output-error' ? 'Upstream timeout' : undefined,
  };
};

const fixtures: Fixture[] = [
  { name: 'Streaming input', toolName: 'holidaysNext', part: part({}, { state: 'input-streaming' }) },
  { name: 'Input available, no output yet', toolName: 'holidaysNext', part: part({ count: 3 }, { state: 'input-available' }) },
  {
    name: 'Today (both kinds present)',
    toolName: 'holidaysNext',
    part: part({ count: 4 }),
    note: 'Live: whatever follows today in America/Sao_Paulo.',
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