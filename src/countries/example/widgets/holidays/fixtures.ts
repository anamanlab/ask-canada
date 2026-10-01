import type { Fixture } from '@/lib/widgets/types';

const fixtures: Fixture[] = [
  { name: 'Loading', toolName: 'holidaysNext', part: { type: 'tool-holidaysNext', toolCallId: 'x1', state: 'input-available', input: {} } },
  {
    name: 'Three holidays',
    toolName: 'holidaysNext',
    part: {
      type: 'tool-holidaysNext',
      toolCallId: 'x2',
      state: 'output-available',
      input: {},
      output: {
        holidays: [
          { date: '2026-10-12', name: { en: 'Harvest Day', fr: 'Jour des récoltes' } },
          { date: '2026-12-25', name: { en: 'Winter Holiday', fr: 'Fête d’hiver' } },
        ],
        sources: [{ title: 'Public holidays', url: 'https://example.org/holidays', checked: '2026-09-29' }],
      },
    },
  },
];
export default fixtures;
