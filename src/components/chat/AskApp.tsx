'use client';
/**
 * AskApp: the thin shell of the home page. It shows the server-rendered landing and, once a question is
 * asked, the chat, which lives in the lazily loaded `ChatRuntime` (useChat, the AI SDK, streamdown and
 * the widget registry never ship with the landing).
 *
 * - The runtime is fetched on the first sign of intent (focus, or a mouse press), never while the page is
 *   merely being read, so the first question usually switches to the chat without waiting.
 * - A question asked before the runtime is there is queued and sent as soon as it mounts. If the runtime
 *   can't be fetched (flaky network), the question goes back into the hero composer with a retry.
 * - `/?q=…` renders the chat directly (server-rendered) and asks right away.
 * - Keyboard: "/" focuses the composer.
 */
import { startTransition, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { FileUIPart } from 'ai';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/plain/Button';
import { Notice } from '@/components/ui/plain/Notice';
import { useLocale } from '@/lib/i18n/provider';
import { ChatActionsProvider, type ChatCommands } from './actions';
import type { AppView, ChatRequest, ChatRuntimeHandle, ChatRuntimeProps } from './ChatRuntime';
import { ComposerRegistryContext, createComposerRegistry, MaxInputCharsContext } from './composers';

type Runtime = ComponentType<ChatRuntimeProps>;

/** The next task, so the browser can paint and take input between two pieces of work. */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * The runtime is evaluated in two tasks, never one long one (it blocked a slow phone for a quarter of a
 * second): first the conversation engine (`./conversation`: the AI SDK and its schemas), then the chat screen.
 * Both loaders below spell the two imports out, because `next/dynamic` only preloads imports written inside its call.
 *
 * `/?q=…`: rendered on the server, with the runtime's chunks preloaded by the document (a plain `lazy`
 * re-renders the chat on the client and paints it ~0.7 s later on a phone). It has to be `next/dynamic` here:
 * a Client Component imported by the page itself, even one it only renders for `?q=`, ships with every load
 * of the landing (+140 KB gzipped, measured).
 * Known `next dev` artefact: Turbopack lists one chunk of this group in the preload manifest under a name it
 * never emits, so the dev console shows a 404 for that `<link rel="preload">` (nothing loads it as a script;
 * `scripts/shot.mjs` leaves it out of its report). Production builds list the right files.
 */
const ServerRenderedRuntime: Runtime = dynamic(() =>
  import('./conversation')
    .then(nextTask)
    .then(() => import('./ChatRuntime'))
    .then((m) => m.ChatRuntime),
);

/** The same modules on demand, for the landing: fetched on intent, and again after a failed attempt. */
const fetchRuntime = (): Promise<Runtime> =>
  import('./conversation')
    .then(nextTask)
    .then(() => import('./ChatRuntime'))
    .then((m) => m.ChatRuntime);

/** Whether a key press landed in something the user types into (so "/" is a character there, not a shortcut). */
const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

type Props = {
  initialQuery?: string;
  /** Characters allowed in one question (the server's limit, so the composer and the API agree). */
  maxInputChars: number;
  landing: ReactNode;
};

export function AskApp({ initialQuery, maxInputChars, landing }: Props) {
  const [view, setView] = useState<AppView>(initialQuery ? 'chat' : 'landing');
  const [Runtime, setRuntime] = useState<Runtime | null>(() => (initialQuery ? ServerRenderedRuntime : null));
  /** A question asked before the runtime was there: it sends it on mount. */
  const [queued, setQueued] = useState<ChatRequest>();
  /** A queued question the runtime couldn't be fetched for: shown with a retry. */
  const [lost, setLost] = useState<ChatRequest>();
  const [composers] = useState(createComposerRegistry);
  const runtime = useRef<ChatRuntimeHandle>(null);
  const loading = useRef(false);
  const waiting = useRef<ChatRequest>(undefined);

  /**
   * Fetch the runtime (once at a time). It mounts rendering nothing, and sends the queued question if there
   * is one. If it can't be fetched, that question goes back where it was typed and a notice offers a retry.
   */
  const load = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    fetchRuntime().then(
      (ChatRuntime) => startTransition(() => setRuntime(() => ChatRuntime)),
      (error: unknown) => {
        loading.current = false;
        console.error('[chat] the chat could not be loaded', error);
        const request = waiting.current;
        if (!request) return;
        waiting.current = undefined;
        setQueued(undefined);
        setLost(request);
        composers.get('hero')?.setText(request.text);
      },
    );
  }, [composers]);

  // Warm the runtime on the first sign of intent: focus (the composer, Tab) or a mouse press. A touch press
  // is most often a scroll; tapping the composer focuses it, and tapping a starter question loads it anyway.
  useEffect(() => {
    if (Runtime) return;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      window.removeEventListener('pointerdown', onPointer, true);
      load();
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('focusin', load, { capture: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('focusin', load, true);
    };
  }, [Runtime, load]);

  // On the landing, questions go to the runtime once it is there, else wait for it.
  const landingCommands = useMemo<ChatCommands>(
    () => ({
      send: (text: string, files?: FileUIPart[]) => {
        if (!text.trim() && !files?.length) return;
        if (runtime.current) return runtime.current.send(text, files);
        waiting.current = { text, files };
        setQueued(waiting.current);
        setLost(undefined);
        load();
      },
      stop: () => {},
      addToolOutput: () => {},
      reset: () => {},
      focusComposer: () => void composers.focusPrimary(),
      continueAnswer: () => {},
    }),
    [composers, load],
  );

  // "/" focuses the composer (the chat's dock, else the landing hero).
  const onSlash = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey) return;
    if (isEditable(e.target)) return;
    e.preventDefault();
    composers.focusPrimary();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onSlash(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ComposerRegistryContext value={composers}>
      <MaxInputCharsContext value={maxInputChars}>
        <ChatActionsProvider commands={landingCommands}>
          {view === 'landing' ? landing : null}
          {lost ? <LoadError onRetry={() => landingCommands.send(lost.text, lost.files)} /> : null}
          {Runtime ? <Runtime ref={runtime} view={view} onViewChange={setView} initialQuery={initialQuery} firstRequest={queued} /> : null}
        </ChatActionsProvider>
      </MaxInputCharsContext>
    </ComposerRegistryContext>
  );
}

/** Shown over the landing when a question couldn't be sent because the chat didn't load. */
function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLocale();
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[560px] flex-wrap items-center justify-end gap-3 rounded-[22px] border border-hair bg-card p-3 shadow-lg"
    >
      <Notice tone="warn" className="min-w-[240px] flex-1">
        {navigator.onLine === false ? t('error.offline') : t('error.generic')}
      </Notice>
      <Button size="sm" icon={RotateCcw} onClick={onRetry}>
        {t('widget.retry')}
      </Button>
    </div>
  );
}
