/** Example widget tool: the next public holidays. */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { HOLIDAYS } from '../pack.server';

export const tools = {
  holidaysNext: tool({
    description: 'The next public holidays in the Republic of Example.',
    inputSchema: z.object({ count: z.number().int().min(1).max(5).optional() }),
    execute: async ({ count = 3 }) => {
      const today = new Date().toISOString().slice(0, 10);
      return {
        holidays: HOLIDAYS.filter((h) => h.date >= today).slice(0, count),
        sources: [{ title: 'Public holidays', url: 'https://example.org/holidays', checked: '2026-09-29' }],
      };
    },
  }),
} satisfies ToolSet;
