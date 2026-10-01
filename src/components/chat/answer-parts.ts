/**
 * Which text of an assistant message is the answer, and which is a status line.
 *
 * The model opens a turn that needs tools with one short sentence saying what it is checking, then calls
 * them; the verdict and the prose come once the results are in (`@/lib/ai/answer-text`). The status line is
 * shown where "Checking official sources…" sits while the answer is on its way, and is not part of the
 * answer afterwards (not rendered, copied, read aloud or searched for citations).
 */
import type { UIMessage } from 'ai';
import { CLOSING_TOOLS, isStatusLine } from '@/lib/ai/answer-text';

type Part = UIMessage['parts'][number];

export type AnswerText = {
  /** Indexes (into `message.parts`) of the text parts that make up the answer, in order. */
  prose: number[];
  /** The latest status line, while no prose has arrived yet. */
  status?: string;
};

const gathers = (part: Part) => part.type.startsWith('tool-') && !CLOSING_TOOLS.includes(part.type.slice(5));

/**
 * @param live The answer is streaming from the model right now: a short first line is then held as a status
 *   line as it arrives (before its tool call shows up), so it never flashes as prose first.
 */
export function answerText(parts: readonly Part[], live = false): AnswerText {
  const texts: { i: number; status: boolean }[] = [];
  let stepStart = 0;
  const closeStep = (end: number) => {
    const gathering = parts.slice(stepStart, end).some(gathers);
    for (let i = stepStart; i < end; i++) {
      const part = parts[i];
      if (part.type !== 'text' || !part.text.trim()) continue;
      texts.push({ i, status: isStatusLine(part.text) && (gathering || (live && i === parts.length - 1)) });
    }
    stepStart = end;
  };
  parts.forEach((part, i) => {
    if (part.type === 'step-start') closeStep(i);
  });
  closeStep(parts.length);

  const prose = texts.filter((t) => !t.status).map((t) => t.i);
  if (prose.length) return { prose };
  // Only status lines so far. Once the answer is over (stopped early), they are all there is to show.
  if (!live) return { prose: texts.map((t) => t.i) };
  const last = texts.at(-1);
  return { prose: [], status: last ? (parts[last.i] as { text: string }).text.trim() : undefined };
}

/** The answer's prose as one markdown string. */
export function proseOf(message: UIMessage): string {
  return answerText(message.parts)
    .prose.map((i) => (message.parts[i] as { text: string }).text)
    .join('\n\n');
}
