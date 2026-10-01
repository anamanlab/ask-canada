/**
 * How much conversation reaches the model. A browser only sends back what this service produced, but a
 * script can post anything as "earlier answers", and every character is billed as input on every step of
 * the tool loop. So the history is cut to a character budget, newest first.
 */
import type { UIMessage } from 'ai';

/** What a message adds to the model's input, in characters (attachments are capped separately, in bytes). */
export const contextChars = (m: UIMessage) =>
  m.parts.reduce((n, p) => n + (p.type === 'file' ? 0 : p.type === 'text' || p.type === 'reasoning' ? p.text.length : JSON.stringify(p).length), 0);

/**
 * Keeps the newest messages that fit `maxChars`, starting on a question. The last message must be the
 * person's. Null when that message alone is too large.
 */
export function fitContext(messages: UIMessage[], maxChars: number): UIMessage[] | null {
  let total = 0;
  let start = messages.length;
  for (let i = messages.length - 1; i >= 0; i--) {
    total += contextChars(messages[i]);
    if (total > maxChars) break;
    start = i;
  }
  if (start === messages.length) return null;
  while (messages[start].role !== 'user') start++;
  return messages.slice(start);
}
