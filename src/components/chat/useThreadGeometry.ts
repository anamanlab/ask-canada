'use client';
/**
 * Everything the chat screen measures, from refs it owns (never class-name queries):
 *
 * - `layout`: the reading band between the sticky header and the docked composer (`ChatLayout` context).
 * - `scrim`: whether any of the thread sits under the dock (the dock then shows its fade).
 * - `jump`: which pill (if any) to offer above the dock:
 *     'latest'   the reader is above the latest answer (its top is below the fold): "Jump to latest".
 *     'continue' the reader is inside the latest answer while more of it streams in below: "Continue reading".
 *     null       the latest answer's top is on screen, or nothing is below. The pill never covers an answer
 *                the reader has just been handed.
 * - `titleShown`: the header title fades in once the first question has scrolled under the header (Apple's
 *   large-title to inline-title), so it never repeats the bubble right below it.
 *
 * Only booleans and the discrete jump mode are state, so scrolling and streaming re-render the chat only
 * when one of them actually flips.
 */
import { useCallback, useEffect, useEffectEvent, useMemo, useState, type RefObject } from 'react';
import { scrollBehavior, type ChatLayout } from './ChatLayout';

export type JumpMode = 'latest' | 'continue' | null;

type Refs = {
  /** The sticky site header (its bottom edge is the top of the reading band). */
  header: RefObject<HTMLElement | null>;
  /** The dock's inner column (its top edge is the bottom of the reading band). */
  dockInner: RefObject<HTMLElement | null>;
  /** The thread (observed for growth). */
  thread: RefObject<HTMLElement | null>;
  /** A marker after the last turn. */
  end: RefObject<HTMLElement | null>;
  /** The latest answer (or its "Checking official sources…" placeholder). */
  latestAnswer: RefObject<HTMLElement | null>;
  /** The first question's bubble. */
  firstBubble: RefObject<HTMLElement | null>;
};

const HEADER_FALLBACK = 64;

export function useThreadGeometry(refs: Refs, { streaming, firstUserId }: { streaming: boolean; firstUserId?: string }) {
  const { header, dockInner, thread, end, latestAnswer, firstBubble } = refs;
  const [scrim, setScrim] = useState(false);
  const [jump, setJump] = useState<JumpMode>(null);
  // Which first question the title state belongs to, so another conversation starts hidden.
  const [title, setTitle] = useState<{ for?: string; shown: boolean }>({ shown: false });

  const layout = useMemo<ChatLayout>(
    () => ({
      band: () => ({
        top: header.current?.getBoundingClientRect().bottom ?? HEADER_FALLBACK,
        bottom: dockInner.current?.getBoundingClientRect().top ?? window.innerHeight,
      }),
      scrollIntoBand: (el) => el.scrollIntoView({ block: 'start', behavior: scrollBehavior() }),
      scrollBy: (top) => window.scrollBy({ top, behavior: scrollBehavior() }),
    }),
    [header, dockInner],
  );

  const measure = useEffectEvent(() => {
    const endEl = end.current;
    if (!endEl || !dockInner.current) return;
    const { top: headerBottom, bottom: dockTop } = layout.band();
    const below = Math.max(0, Math.round(endEl.getBoundingClientRect().top - dockTop));
    setScrim(below > 4);
    let mode: JumpMode = null;
    const latest = latestAnswer.current;
    if (latest && below > 120) {
      const top = latest.getBoundingClientRect().top;
      if (top > dockTop - 24) mode = 'latest';
      else if (top < headerBottom && streaming) mode = 'continue';
    }
    setJump(mode);
  });

  // Re-measure on scroll, resize and whenever the thread grows (streamed text, a widget loading).
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const ro = new ResizeObserver(schedule);
    if (thread.current) ro.observe(thread.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [thread]);

  // Streaming started or stopped: the "Continue reading" pill depends on it.
  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [streaming]);

  useEffect(() => {
    const el = firstUserId ? firstBubble.current : null;
    if (!el) return;
    const top = header.current ? Math.round(header.current.getBoundingClientRect().height) : HEADER_FALLBACK;
    const io = new IntersectionObserver(([e]) => setTitle({ for: firstUserId, shown: !e.isIntersecting && e.boundingClientRect.top < top }), {
      rootMargin: `-${top}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [firstUserId, firstBubble, header]);

  const onJump = useCallback(() => {
    if (jump === 'continue') return layout.scrollBy(Math.round(window.innerHeight * 0.6));
    if (latestAnswer.current) layout.scrollIntoBand(latestAnswer.current);
  }, [jump, layout, latestAnswer]);

  const titleShown = Boolean(firstUserId) && title.for === firstUserId && title.shown;
  return { layout, scrim, jump, titleShown, onJump };
}
