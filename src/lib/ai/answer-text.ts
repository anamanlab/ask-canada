/**
 * What counts as "the answer" in an assistant turn (isomorphic: the chat route and the chat UI must agree).
 *
 * Before it calls tools, the model writes one short sentence saying what it is checking ("Checking Environment
 * Canada's alerts for Halifax."). That status line is real model text and it reaches the screen first, but
 * it is not the answer: the UI shows it where "Checking official sources…" sits, and the route still owes
 * the person a verdict and prose.
 */

/** Core tools that close an answer (follow-up chips, the official button) rather than gather facts for it. */
export const CLOSING_TOOLS: readonly string[] = ['suggestFollowUps', 'officialHandoff'];

const STATUS_MAX_CHARS = 200;

/** One short line without a heading: what a status sentence looks like. */
export function isStatusLine(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && t.length <= STATUS_MAX_CHARS && !t.includes('\n') && !t.startsWith('#');
}

/**
 * Whether the text of one model step is only a status line: short, and written alongside a tool call that
 * gathers facts. A short reply with no tool call (or only the closing tools) is the answer itself.
 */
export function isStatusText(text: string, toolNames: readonly string[]): boolean {
  return isStatusLine(text) && toolNames.some((name) => !CLOSING_TOOLS.includes(name));
}
