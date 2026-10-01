'use client';
/**
 * The chat runtime (loaded lazily by `AskApp`): owns the conversation (`useChat` over a `Chat` per
 * conversation, streaming from /api/chat) and renders the chat screen while the view is 'chat'.
 * The markdown renderer is a further chunk (`./useMarkdown`), fetched once the runtime is on screen.
 *
 * - The first question switches from the landing with a shared-element transition (the composer morphs into the dock).
 * - `/?q=…` auto-submits once.
 * - History is saved on this device only, as answers finish (`./conversation`); opening an old conversation
 *   doesn't touch it.
 * - Keyboard: Esc stops a streaming answer.
 */
import './chat.css';
import { useCallback, useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { flushSync } from 'react-dom';
import { useChat } from '@ai-sdk/react';
import type { FileUIPart, UIMessage } from 'ai';
import type { SavedItem } from '@/lib/device-store';
import { isScrollLocked, prefersReducedMotion } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { ChatActionsProvider, type ChatCommands } from './actions';
import { afterPaint } from './ChatLayout';
import { ChatView, type ChatViewHandle } from './ChatView';
import { useComposers } from './composers';
import { createConversation, markStopped, saveConversation, type RequestBody } from './conversation';
import { preloadMarkdown } from './useMarkdown';

export type AppView = 'landing' | 'chat';
export type ChatRequest = { text: string; files?: FileUIPart[] };
export type ChatRuntimeHandle = { send: (text: string, files?: FileUIPart[]) => void };

/** Chunks reach the screen at most every 100 ms: smooth to read, and a fraction of the render work. */
const THROTTLE_MS = 100;

/** Runs `update` inside a view transition when available; resolves once the new view is in the DOM. */
function withViewTransition(update: () => void): Promise<void> {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { updateCallbackDone: Promise<void> } };
  if (doc.startViewTransition && !prefersReducedMotion()) {
    return doc.startViewTransition(() => flushSync(update)).updateCallbackDone.catch(() => undefined);
  }
  update();
  return Promise.resolve();
}

export type ChatRuntimeProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  /** `/?q=…`: the chat is already on screen (server-rendered) and asks this once. */
  initialQuery?: string;
  /** A question asked on the landing before the runtime had loaded: sent once, on mount. */
  firstRequest?: ChatRequest;
  ref?: Ref<ChatRuntimeHandle>;
};

export function ChatRuntime({ view, onViewChange, initialQuery, firstRequest, ref }: ChatRuntimeProps) {
  const { locale } = useLocale();
  const composers = useComposers();
  const [conversation, setConversation] = useState(createConversation);
  const { messages, status, error, setMessages } = useChat({ chat: conversation, throttle: THROTTLE_MS });
  const [pending, setPending] = useState(initialQuery);
  const chatView = useRef<ChatViewHandle>(null);
  const started = useRef(false);

  const requestBody = useCallback((extra?: Omit<RequestBody, 'locale'>): RequestBody => ({ locale, ...extra }), [locale]);

  // An external Chat isn't stopped by useChat on unmount.
  useEffect(() => () => void conversation.stop(), [conversation]);

  /** Stop the answer in progress (button or Esc), mark it as stopped and save it. */
  const stop = useCallback(async () => {
    const active = conversation.status === 'streaming' || conversation.status === 'submitted';
    await conversation.stop();
    if (!active) return;
    // Read the messages only after the abort settles, so a first chunk that raced the abort is the one marked.
    const marked = markStopped(conversation.messages);
    setMessages(marked);
    saveConversation(conversation.id, marked);
  }, [conversation, setMessages]);

  const enterChat = useCallback((): Promise<void> => {
    if (view === 'chat') return Promise.resolve();
    const done = withViewTransition(() => onViewChange('chat'));
    window.scrollTo({ top: 0 });
    return done;
  }, [view, onViewChange]);

  const ask = useCallback(
    (text: string, files?: FileUIPart[], extra?: Omit<RequestBody, 'locale'>) => {
      if (!text.trim() && !files?.length) return;
      conversation.clearError();
      if (view === 'chat' && conversation.messages.length) chatView.current?.revealNextTurn();
      // The control that sent (hero composer, a chip, an "Ask next" follow-up) unmounts: keep focus in the chat.
      void enterChat().then(() => chatView.current?.focusAfterSend());
      setPending(undefined);
      void conversation.sendMessage({ text, files }, { body: requestBody(extra) });
    },
    [conversation, view, enterChat, requestBody],
  );
  const send = useCallback((text: string, files?: FileUIPart[]) => ask(text, files), [ask]);
  useImperativeHandle(ref, () => ({ send }), [send]);

  const reset = useCallback(() => {
    void stop();
    // "New chat" unmounts with the chat header: focus moves to the landing (its question box, or on touch its heading).
    void withViewTransition(() => {
      setConversation(createConversation());
      setPending(undefined);
      onViewChange('landing');
    }).then(() =>
      afterPaint(() => {
        const active = document.activeElement;
        if (!active || active === document.body) composers?.focusLanding({ preventScroll: true });
      }),
    );
    const url = new URL(window.location.href);
    if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      window.history.replaceState(window.history.state, '', url);
    }
    window.scrollTo({ top: 0 });
  }, [stop, onViewChange, composers]);

  const openHistory = useCallback(
    (item: SavedItem) => {
      void stop();
      setConversation(createConversation({ id: item.key.replace(/^chat:/, ''), messages: item.data as UIMessage[] }));
      // A reopened conversation starts at its first question, wherever the one before it was scrolled to.
      window.scrollTo({ top: 0 });
      void enterChat().then(() => chatView.current?.focusAfterSend());
    },
    [stop, enterChat],
  );

  const regenerate = useCallback(
    (messageId: string, answerLocale?: string) => void conversation.regenerate({ messageId, body: requestBody(answerLocale ? { answerLocale } : undefined) }),
    [conversation, requestBody],
  );
  const retry = useCallback(() => void conversation.regenerate({ body: requestBody() }), [conversation, requestBody]);

  // Send the question that brought the runtime in (once, StrictMode-safe), in a task of its own after the
  // first render; the markdown renderer follows in another (its chunk is fetched while the request is out).
  const start = useEffectEvent(() => {
    if (initialQuery) {
      void conversation.sendMessage({ text: initialQuery }, { body: requestBody() });
      setPending(undefined);
    } else if (firstRequest) {
      send(firstRequest.text, firstRequest.files);
    }
  });
  useEffect(() => {
    if (started.current) return;
    const tm = setTimeout(() => {
      started.current = true;
      start();
      preloadMarkdown();
    }, 0);
    return () => clearTimeout(tm);
  }, []);

  // Esc stops a streaming answer (unless a sheet or dialog is open: there it closes that).
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Escape' || (status !== 'streaming' && status !== 'submitted')) return;
    if (isScrollLocked()) return;
    void stop();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<ChatCommands>(
    () => ({
      send,
      stop: () => void stop(),
      addToolOutput: async ({ tool, toolCallId, output }) => {
        await conversation.addToolOutput({ tool, toolCallId, output } as Parameters<typeof conversation.addToolOutput>[0]);
        if (conversation.status === 'ready') saveConversation(conversation.id, conversation.messages);
      },
      reset,
      focusComposer: () => void composers?.focusPrimary(),
      continueAnswer: (prompt) => ask(prompt, undefined, { resume: true }),
    }),
    [send, ask, stop, conversation, reset, composers],
  );

  if (view !== 'chat') return null;
  return (
    <ChatActionsProvider commands={commands} status={status}>
      <ChatView
        ref={chatView}
        messages={messages}
        status={status}
        error={error}
        pending={pending}
        onReset={reset}
        onOpenHistory={openHistory}
        currentKey={`chat:${conversation.id}`}
        onRegenerate={regenerate}
        onRetry={retry}
      />
    </ChatActionsProvider>
  );
}
