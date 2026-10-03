/**
 * Core tools available in every country pack. Rendered by core (not by a widget):
 *   suggestFollowUps       -> the "Ask next" chips under an answer.
 *   officialHandoff        -> one primary "Continue on <official site> ↗" button under the answer.
 *   fetchOfficialPage      -> silent; its page becomes a numbered source.
 *   searchOfficialSources  -> silent.
 */
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { pack } from '@/countries/active';
import { officialSourceTools } from './official-sources';

const isAllowlisted = (u: string) => {
  try {
    const url = new URL(u);
    const h = url.hostname.replace(/^www\./, '');
    return url.protocol === 'https:' && pack.sources.allowlist.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

export const coreTools = {
  suggestFollowUps: tool({
    description:
      'Call once at the very end of every answer with 2-4 short follow-up questions the person is likely to ask next, written in their language, in the first person ("Who can be my reference?"). Never repeat the question they just asked.',
    inputSchema: z.object({
      questions: z.array(z.string().min(3).max(90)).min(1).max(4),
    }),
    execute: async ({ questions }) => ({ questions }),
  }),
  officialHandoff: tool({
    description:
      `Show ONE primary button that takes the person to the official page where they finish the task you cannot do for them: sign in, apply, pay, book, or search an official finder (for example a passport office locator by postal code). Use it when the next step happens on the official site. The label is a short verb phrase in their language naming the site ("Find an office on ${pack.officialHomeLabel}"). Official domains only.`,
    inputSchema: z.object({
      url: z.string().url(),
      label: z.string().min(3).max(60),
      note: z.string().max(140).optional(),
      search: z
        .object({ label: z.string().min(3).max(40), placeholder: z.string().max(40).optional() })
        .optional()
        .describe('When the official page is a finder searched by location (postal code or city): the field label, in their language. The person types it here and it is copied for them to paste there.'),
    }),
    execute: async ({ url, label, note, search }) => {
      if (!isAllowlisted(url)) throw new Error('Only official pages can be linked.');
      return { url, label, note, search, host: new URL(url).hostname.replace(/^www\./, '') };
    },
  }),
  ...officialSourceTools,
};

export const CORE_TOOL_NAMES = new Set(Object.keys(coreTools));
