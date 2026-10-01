/**
 * Prompt caching: where the two cache breakpoints go.
 *
 *   [tools][stable instructions ■1][date + language][…history…][latest question ■2][guidance for this turn]
 *
 * ■1 (set in `system-prompt.ts`) caches the tool catalogue and the instructions that are identical for
 *    everyone, so every request reads them instead of paying for them.
 * ■2 caches the conversation. It starts on the person's latest message and `moveBreakpointToTail` moves it to
 *    the newest message before each later step of a tool loop, so each step (and the next turn) reads
 *    everything before it from cache and only pays for what is new.
 *
 * Per-turn guidance is appended *after* ■2: it changes with the topic, and anything in front of a breakpoint
 * that changes makes the cache miss. Pure functions, no I/O (also used by scripts/check-prompt-cache.mjs).
 */
import type { ModelMessage } from 'ai';

type ProviderOptions = NonNullable<ModelMessage['providerOptions']>;
type Marked = { providerOptions?: ProviderOptions };

/** An explicit breakpoint for each provider that has them (others ignore unknown keys). */
export const CACHE_BREAKPOINT = {
  anthropic: { cacheControl: { type: 'ephemeral' } },
  bedrock: { cachePoint: { type: 'default' } },
} as const satisfies ProviderOptions;

const GUIDANCE_TAG = 'official-guidance';
const GUIDANCE_TAG_PATTERN = new RegExp(`</?${GUIDANCE_TAG}[^>]*>`, 'gi');

/** Removes guidance tags from text a person typed, so only this service can add an <official-guidance> block. */
export const stripGuidanceTags = (text: string) => text.replace(GUIDANCE_TAG_PATTERN, '');

const mark = <T extends Marked>(x: T): T => ({
  ...x,
  providerOptions: {
    ...x.providerOptions,
    anthropic: { ...x.providerOptions?.anthropic, ...CACHE_BREAKPOINT.anthropic },
    bedrock: { ...x.providerOptions?.bedrock, ...CACHE_BREAKPOINT.bedrock },
  },
});

const omit = <T extends Record<string, unknown>>(obj: T | undefined, key: string) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => k !== key));

/** Removes our breakpoint keys, keeping any other provider options. Parts without options pass through. */
function unmark<T extends object>(x: T): T {
  const options = (x as Marked).providerOptions;
  if (!options?.anthropic?.cacheControl && !options?.bedrock?.cachePoint) return x;
  const next = Object.fromEntries(
    Object.entries({ ...options, anthropic: omit(options.anthropic, 'cacheControl'), bedrock: omit(options.bedrock, 'cachePoint') }).filter(
      ([, value]) => Object.keys(value).length > 0,
    ),
  ) as ProviderOptions;
  return { ...x, providerOptions: Object.keys(next).length ? next : undefined };
}

/** Clears breakpoints from a message and, for multi-part content, from its parts. */
function unmarkMessage(message: ModelMessage): ModelMessage {
  const m = unmark(message);
  if (typeof m.content === 'string') return m;
  return { ...m, content: m.content.map((part) => unmark(part)) } as ModelMessage;
}

/**
 * First step of a turn: puts ■2 on the person's latest message and appends this turn's guidance after it.
 * If the conversation doesn't end with a user message, ■2 goes on the last message and guidance is skipped.
 */
export function withTurnContext(messages: ModelMessage[], guidance: string): ModelMessage[] {
  const last = messages.at(-1);
  if (!last) return messages;
  const head = messages.slice(0, -1).map(unmarkMessage);
  if (last.role !== 'user') return [...head, mark(unmarkMessage(last))];

  const parts = typeof last.content === 'string' ? [{ type: 'text' as const, text: last.content }] : last.content.map((p) => unmark(p));
  if (!parts.length) return [...head, mark(unmark(last))];
  const question = [...parts.slice(0, -1), mark(parts[parts.length - 1])];
  const notes = guidance.trim()
    ? [{ type: 'text' as const, text: `<${GUIDANCE_TAG}>\n${stripGuidanceTags(guidance).trim()}\n</${GUIDANCE_TAG}>` }]
    : [];
  return [...head, { ...unmark(last), content: [...question, ...notes] }];
}

/** Later steps of a tool loop: ■2 moves to the newest message (only one conversation breakpoint at a time). */
export function moveBreakpointToTail(messages: ModelMessage[]): ModelMessage[] {
  if (!messages.length) return messages;
  const clean = messages.map(unmarkMessage);
  return [...clean.slice(0, -1), mark(clean[clean.length - 1])];
}
