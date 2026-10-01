'use client';
/**
 * Chat layout context: the geometry of the reading area, so parts of the thread can bring themselves
 * into view without knowing how the header and the docked composer are built (no class-name queries).
 *
 *   const layout = useChatLayout();
 *   const { top, bottom } = layout.band();      // visible band between the sticky header and the dock
 *   layout.scrollIntoBand(el);                   // scroll `el` to the top of the band
 */
import { createContext, use } from 'react';
import { prefersReducedMotion } from '@/lib/hooks';

export type ChatLayout = {
  /** The visible band between the sticky header and the docked composer, in viewport px. */
  band: () => { top: number; bottom: number };
  /** Scroll so `el` starts just under the header (the page's scroll padding keeps it clear). */
  scrollIntoBand: (el: Element) => void;
  /** Scroll the page by `top` px. */
  scrollBy: (top: number) => void;
};

export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

/** Fallback when rendered outside the chat (e.g. the lab): the whole viewport is the band. */
const viewport: ChatLayout = {
  band: () => ({ top: 0, bottom: window.innerHeight }),
  scrollIntoBand: (el) => el.scrollIntoView({ block: 'start', behavior: scrollBehavior() }),
  scrollBy: (top) => window.scrollBy({ top, behavior: scrollBehavior() }),
};

export const ChatLayoutContext = createContext<ChatLayout>(viewport);

export function useChatLayout(): ChatLayout {
  return use(ChatLayoutContext);
}

/** Runs `fn` two frames on: by then a view change has committed and painted (also without a view transition). */
export const afterPaint = (fn: () => void) => void requestAnimationFrame(() => requestAnimationFrame(fn));
