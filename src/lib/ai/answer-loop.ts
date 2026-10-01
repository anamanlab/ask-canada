/**
 * The rules of the answer loop (pure, no I/O; checked by scripts/check-abuse-guards.mjs).
 *
 * One answer is a short tool loop: [status line + tool calls] → [more tool calls]* → [verdict + prose,
 * official button, follow-ups]. These rules decide when it ends and what each step is told:
 *
 * - `suggestFollowUps` is always the model's last act, so the loop ends when it has been called (no extra
 *   step that would repeat the answer or return nothing).
 * - The loop also ends at the step limit, when the turn's output-token budget is spent, and at the soft
 *   deadline, which leaves time to write with what the tools already returned.
 * - A turn never ends without prose: `hasAnswer` says whether the model has written its answer, and when
 *   it has not, the route runs one last step with `stepNote('final')`.
 * - Text never directly follows a tool result. Claude 5.5 models treat what they write right after a tool
 *   result as a possible progress note: it is held back until the step is complete, and when a tool call
 *   follows it (the official button, the follow-ups) it is returned as a hidden thinking block instead of
 *   text. That is how an answer went missing: written, hidden, and never repeated. So every step after a
 *   tool result is opened as a new turn (`afterTools`), and in the history every answer that ended on a tool
 *   result is closed before the next question (`closeToolTurns`). The text then streams word by word.
 */
import type { ModelMessage } from 'ai';
import { localeInfo, type Locale } from '@/lib/i18n/config';
import { isStatusText } from './answer-text';

export const FOLLOW_UPS_TOOL = 'suggestFollowUps';

/** The part of an AI SDK step these rules read. */
export type LoopStep = {
  text: string;
  toolCalls: ReadonlyArray<{ toolName: string }>;
  usage: { outputTokens?: number };
};

const toolNames = (step: LoopStep) => step.toolCalls.map((call) => call.toolName);

/** The model has written its answer (not only a status line before a tool call). */
export const hasAnswer = (steps: readonly LoopStep[]) => steps.some((step) => step.text.trim() !== '' && !isStatusText(step.text, toolNames(step)));

export const outputTokens = (steps: readonly LoopStep[]) => steps.reduce((n, step) => n + (step.usage.outputTokens ?? 0), 0);

export type LoopLimits = {
  maxSteps: number;
  /** Output tokens for the whole turn (all steps). */
  maxTurnOutputTokens: number;
  /** Milliseconds after which no new step starts (the answer is written with what is there). */
  softDeadlineMs: number;
};

export type StopReason = 'follow-ups' | 'steps' | 'tokens' | 'deadline';

/** Why the loop should stop after the steps so far, or undefined to go on. Asked only after a step that called tools. */
export function stopReason(steps: readonly LoopStep[], elapsedMs: number, limits: LoopLimits): StopReason | undefined {
  const last = steps.at(-1);
  if (last && toolNames(last).includes(FOLLOW_UPS_TOOL)) return 'follow-ups';
  if (steps.length >= limits.maxSteps) return 'steps';
  if (outputTokens(steps) >= limits.maxTurnOutputTokens) return 'tokens';
  if (elapsedMs >= limits.softDeadlineMs) return 'deadline';
  return undefined;
}

/** The step about to run is the last one the loop allows: it must write, not look up more. */
export const isLastStep = (stepNumber: number, elapsedMs: number, limits: LoopLimits) =>
  stepNumber >= limits.maxSteps - 1 || elapsedMs >= limits.softDeadlineMs;

const NOTES = {
  /** After tool results, while the loop may still go on. */
  write:
    'The tool results are above. Unless you truly cannot answer without another lookup, write the answer now, once: the verdict heading, then the short answer. Then call officialHandoff if the person has to continue on an official site, and suggestFollowUps last.',
  /** The last step: no more lookups. */
  final:
    'Write the answer now with what you already have: the verdict heading, then the short answer. Do not call any more tools. If something could not be checked, say so in one sentence and link the official page instead.',
  /** The answer is written but the model called another tool: only the closing calls are left. */
  close:
    'Your answer is already written and on screen. Do not write it again and add no more text. If the person has to continue on an official site, call officialHandoff; then call suggestFollowUps.',
} as const;

/** What the assistant "says" to close a tool result (never shown to the person). */
const ACK: ModelMessage = { role: 'assistant', content: 'Results received.' };

/**
 * Opens the next step as a new turn: a one-line acknowledgement from the assistant, then a service note in
 * the same `<official-guidance>` block the system prompt already describes (the person never sees either).
 */
export function afterTools(messages: ModelMessage[], kind: keyof typeof NOTES): ModelMessage[] {
  return [
    ...messages,
    ACK,
    { role: 'user', content: `<official-guidance>\n${NOTES[kind]}\n</official-guidance>` },
  ];
}

/**
 * The conversation so far, with every earlier answer that ended on a tool result (they all do: the follow-ups
 * are a tool call) closed by the acknowledgement, so the next question never sits in the same message as a
 * tool result.
 */
export function closeToolTurns(messages: ModelMessage[]): ModelMessage[] {
  return messages.flatMap((message, i) => (message.role === 'tool' && messages[i + 1]?.role === 'user' ? [message, ACK] : [message]));
}

/** Guidance for a turn that continues an answer cut short by the length limit (the "Continue" button). */
export const RESUME_NOTE =
  'Your previous answer was cut off by the length limit. Continue it from exactly where it stopped, in the same language, without repeating what is already written. Begin with a short verdict heading that names what this part covers, and keep it brief.';

/**
 * Output tokens one step may produce, for the language of the answer. Scripts outside Latin and CJK cost
 * several tokens per word (a Punjabi answer needs about four times the tokens of the same answer in
 * English), so they get twice the room for an answer of the same length. Never above `ceiling`.
 */
export function outputBudget(locale: Locale, base: number, ceiling = 16_000): number {
  const script = localeInfo(locale).script;
  const dense = script === 'latin' || script === 'hans' || script === 'hant' || script === 'hangul';
  return Math.min(ceiling, dense ? base : base * 2);
}
