'use client';
/**
 * The markdown renderer on demand: `Markdown` (streamdown and its parsers, the largest part of the chat) is
 * a chunk of its own, fetched once the chat runtime is on screen and evaluated apart from the chat's first
 * render, so opening the chat is never one long task.
 *
 *   preloadMarkdown();                 // start fetching (idempotent; a failed attempt is retried)
 *   const Markdown = useMarkdown();    // null until it is there
 *   {Markdown ? <Markdown text={…} /> : null}
 *
 * If the chunk can't be fetched (flaky network), the hook returns `PlainAnswer`, so an answer is still readable.
 */
import { memo, useEffect, useSyncExternalStore, type ComponentType } from 'react';

export type MarkdownProps = { text: string; streaming?: boolean; lang?: string; dir?: 'ltr' | 'rtl' | 'auto' };
type Renderer = ComponentType<MarkdownProps>;

/** The answer as written, line breaks kept: what is shown when the renderer couldn't be fetched. */
const PlainAnswer = memo(function PlainAnswer({ text, lang, dir = 'auto' }: MarkdownProps) {
  return (
    <div lang={lang} dir={dir} className="ac-answer-block">
      <div className="ac-answer">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
});

let renderer: Renderer | null = null;
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function settle(next: Renderer) {
  renderer = next;
  listeners.forEach((notify) => notify());
}

export function preloadMarkdown() {
  request ??= import('./Markdown').then(
    (m) => settle(m.Markdown),
    (error: unknown) => {
      console.error('[chat] the markdown renderer could not be loaded', error);
      request = null;
      settle(PlainAnswer);
    },
  );
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => void listeners.delete(notify);
}
const getRenderer = () => renderer;
const getServerRenderer = () => null;

export function useMarkdown(): Renderer | null {
  useEffect(preloadMarkdown, []);
  return useSyncExternalStore(subscribe, getRenderer, getServerRenderer);
}
