/**
 * The conversation outside React: the transport to /api/chat, the stopped-answer marker, and on-device
 * history (device-store `chat:<id>`, never a server). Part of the lazily loaded chat runtime.
 */
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { listItems, removeItem, writeItem } from '@/lib/device-store';

const MAX_CHATS = 20;

/** What every request carries besides the messages (`sendMessage(…, { body })`). */
export type RequestBody = { locale: string; answerLocale?: string; /** This message continues an answer that was cut short. */ resume?: boolean };

const newConversationId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Keep attachments only on the latest user message to cap request size, and drop answers that were
 * stopped before their first token (they have no content to send back to the model).
 */
function slim(all: UIMessage[]): UIMessage[] {
  const messages = all.filter((m) => m.role !== 'assistant' || m.parts.length > 0);
  const lastUser = messages.map((m) => m.role).lastIndexOf('user');
  return messages.map((m, i) =>
    i === lastUser || m.role !== 'user'
      ? m
      : {
          ...m,
          parts: m.parts.map((p) => (p.type === 'file' ? { type: 'text' as const, text: `[attachment: ${p.filename ?? p.mediaType}]` } : p)),
        },
  );
}

const transport = new DefaultChatTransport<UIMessage>({
  api: '/api/chat',
  prepareSendMessagesRequest: ({ id, messages, body }) => {
    const { locale, answerLocale, resume } = (body ?? {}) as Partial<RequestBody>;
    return {
      body: {
        id,
        messages: slim(messages),
        locale,
        answerLocale,
        resume,
        // The person's own time zone, so "today" (and business-day counts) match their calendar.
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  },
});

/** Save a conversation on this device (after an answer completes or is stopped), keeping the newest 20. */
export function saveConversation(id: string, messages: UIMessage[]) {
  if (messages.length < 2) return;
  const first = messages.find((m) => m.role === 'user');
  const label = first?.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ').trim().slice(0, 90) || '…';
  const data = slim(messages).map((m) => ({ ...m, parts: m.parts.filter((p) => p.type !== 'file') }));
  if (!writeItem(`chat:${id}`, data, { label, kind: 'chat' })) return;
  listItems()
    .filter((s) => s.kind === 'chat')
    .slice(MAX_CHATS)
    .forEach((c) => removeItem(c.key));
}

/**
 * A conversation: new, or reopened from history under its saved id (so it keeps its place there).
 * Completed answers are saved as they finish; aborted and failed requests are not (a stop saves itself).
 */
export function createConversation(saved?: { id: string; messages: UIMessage[] }): Chat<UIMessage> {
  const id = saved?.id ?? newConversationId();
  return new Chat<UIMessage>({
    id,
    messages: saved?.messages,
    transport,
    onFinish: ({ messages, isAbort, isError }) => {
      if (!isAbort && !isError) saveConversation(id, messages);
    },
  });
}

/**
 * Mark the answer in progress as stopped, so it reads as interrupted, not as a complete answer (trimmed to
 * its last full sentence, with "Stopped · Continue answering"). Stopped before the first token (still
 * "Checking official sources…")? Add an empty stopped answer, so the question still gets its actions.
 */
export function markStopped(messages: UIMessage[]): UIMessage[] {
  const last = messages[messages.length - 1];
  if (!last) return messages;
  if (last.role === 'user') return [...messages, { id: newConversationId(), role: 'assistant', parts: [], metadata: { stopped: true } }];
  if (last.role !== 'assistant') return messages;
  return [...messages.slice(0, -1), { ...last, metadata: { ...(last.metadata as object | undefined), stopped: true } }];
}
