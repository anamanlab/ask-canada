'use client';
/**
 * Chat actions available to any component inside the chat (including widgets).
 *
 *   const { send } = useChatActions();
 *   send('Find a passport office near K1A 0B1');     // posts a follow-up as the user
 *   const status = useChatStatus();                   // 'ready' | 'submitted' | 'streaming' | 'error'
 *
 * The actions are stable for the life of a conversation; the status lives in its own context, so a
 * component that only sends never re-renders when an answer starts or finishes.
 * Outside a chat (e.g. the lab), `send` is a no-op that logs, so widgets can render anywhere.
 */
import { createContext, use, useMemo, type ReactNode } from 'react';
import type { ChatStatus, FileUIPart } from 'ai';

export type ChatActions = {
  send: (text: string, files?: FileUIPart[]) => void;
  stop: () => void;
  /** @deprecated Read it with `useChatStatus()`, which re-renders only the components that need it. */
  status: ChatStatus;
  addToolOutput: (args: { tool: string; toolCallId: string; output: unknown }) => void;
  /** Start a new conversation (clears the thread, keeps history on this device). */
  reset: () => void;
  /** Focus the composer (e.g. after choosing an example). */
  focusComposer: () => void;
  /**
   * Ask for the rest of an answer that was cut short by the length limit. `prompt` is the follow-up shown
   * in the thread ("Please continue your answer."); the request tells the service it is a continuation.
   */
  continueAnswer: (prompt: string) => void;
};

/** The actions without the status: what a provider supplies. */
export type ChatCommands = Omit<ChatActions, 'status'>;

const noop: ChatCommands = {
  send: (text) => console.info('[chat] send (no chat mounted):', text),
  stop: () => {},
  addToolOutput: () => {},
  reset: () => {},
  focusComposer: () => {},
  continueAnswer: () => {},
};

const CommandsContext = createContext<ChatCommands>(noop);
const StatusContext = createContext<ChatStatus>('ready');

/**
 * `commands` should be referentially stable (memoize it); `status` changes a few times per answer.
 * A bare `value` (the previous API) is still accepted and split into the two.
 */
export function ChatActionsProvider({
  commands,
  status,
  value,
  children,
}: {
  commands?: ChatCommands;
  status?: ChatStatus;
  /** @deprecated Pass `commands` and `status` separately. */
  value?: ChatActions;
  children: ReactNode;
}) {
  return (
    <CommandsContext value={commands ?? value ?? noop}>
      <StatusContext value={status ?? value?.status ?? 'ready'}>{children}</StatusContext>
    </CommandsContext>
  );
}

/** The chat's status: only components that show it (the composer's send/stop button) should subscribe. */
export function useChatStatus(): ChatStatus {
  return use(StatusContext);
}

/** The stable chat actions, without subscribing to the status. */
export function useChatCommands(): ChatCommands {
  return use(CommandsContext);
}

/** Actions plus the status (kept for existing callers; prefer `useChatCommands` / `useChatStatus`). */
export function useChatActions(): ChatActions {
  const commands = use(CommandsContext);
  const status = use(StatusContext);
  return useMemo(() => ({ ...commands, status }), [commands, status]);
}
