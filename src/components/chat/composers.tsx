'use client';
/**
 * Composer registry: every mounted `Composer` registers a small handle under its variant, so the app can
 * focus "the" composer (the chat dock, else the landing hero) without reaching into the DOM. The hero
 * composer sits inside the server-rendered landing, so a ref can't be handed to it directly.
 *
 *   const composers = useComposers();
 *   composers?.focusPrimary();           // "/" shortcut, focusComposer()
 *   composers?.get('dock')?.setText(q);  // "Edit question"
 *
 * The landing's heading registers here too (`LandingTitle`): on touch, where focusing a question box would
 * raise the keyboard, it is where focus goes when the chat closes.
 *
 *   composers?.focusLanding({ preventScroll: true });
 *
 * It also carries a note from one composer to the next: a question sent from the landing unmounts the hero
 * composer as the chat opens, so what it had to say ("We removed a number that looked like a SIN…") is left
 * here and shown by the chat's dock composer.
 *
 *   composers?.leaveNote(text);          // hero / closing composer, on send
 *   useSyncExternalStore(registry.subscribeNote, registry.note)   // dock composer
 */
import { createContext, use } from 'react';
import { DEFAULT_MAX_INPUT_CHARS } from '@/lib/ai/limits.shared';
import { isFinePointer } from '@/lib/hooks';

export type ComposerVariant = 'hero' | 'closing' | 'dock';
export type ComposerHandle = { focus: (options?: FocusOptions) => void; setText: (text: string) => void };

export type ComposerRegistry = {
  /** Called by `Composer` when it mounts; returns the unregister function for its unmount. */
  register: (variant: ComposerVariant, handle: ComposerHandle) => () => void;
  get: (variant: ComposerVariant) => ComposerHandle | undefined;
  /** Focus the chat's dock composer, else the landing hero. Returns whether one was focused. */
  focusPrimary: (options?: FocusOptions) => boolean;
  /** Ref callback for the landing's heading (returns its cleanup). */
  registerLandingTitle: (el: HTMLElement | null) => () => void;
  /**
   * Put focus back on the landing: the hero's question box with a mouse or trackpad; on touch its heading,
   * so the keyboard stays down and a screen reader starts from the top of the page.
   */
  focusLanding: (options?: FocusOptions) => void;
  /** Leave a note for the chat's composer to show for a few seconds. */
  leaveNote: (text: string) => void;
  /** The note left for the chat's composer, or null (a `useSyncExternalStore` snapshot). */
  note: () => string | null;
  subscribeNote: (notify: () => void) => () => void;
};

/** Long enough to be read after the landing has turned into the chat. */
const NOTE_MS = 7000;

export function createComposerRegistry(): ComposerRegistry {
  const handles = new Map<ComposerVariant, ComposerHandle>();
  const get = (variant: ComposerVariant) => handles.get(variant);
  let landingTitle: HTMLElement | null = null;
  let note: string | null = null;
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  const noteListeners = new Set<() => void>();
  const setNote = (text: string | null) => {
    note = text;
    noteListeners.forEach((notify) => notify());
  };
  return {
    leaveNote: (text) => {
      clearTimeout(noteTimer);
      setNote(text);
      noteTimer = setTimeout(() => setNote(null), NOTE_MS);
    },
    note: () => note,
    subscribeNote: (notify) => {
      noteListeners.add(notify);
      return () => void noteListeners.delete(notify);
    },
    register: (variant, handle) => {
      handles.set(variant, handle);
      return () => {
        if (handles.get(variant) === handle) handles.delete(variant);
      };
    },
    get,
    focusPrimary: (options) => {
      const handle = get('dock') ?? get('hero');
      handle?.focus(options);
      return Boolean(handle);
    },
    registerLandingTitle: (el) => {
      landingTitle = el;
      return () => {
        if (landingTitle === el) landingTitle = null;
      };
    },
    focusLanding: (options) => {
      if (isFinePointer()) get('hero')?.focus(options);
      else landingTitle?.focus(options);
    },
  };
}

/** Provided by the app shell (`AskApp`) with one `createComposerRegistry()` for the page's lifetime. */
export const ComposerRegistryContext = createContext<ComposerRegistry | null>(null);

/**
 * Characters allowed in one question. The server enforces it (`AI_MAX_INPUT_CHARS`), so the page hands the
 * value down through the app shell; outside it (e.g. the lab) the default applies.
 */
export const MaxInputCharsContext = createContext(DEFAULT_MAX_INPUT_CHARS);

/** The registry, or `null` outside the app shell (e.g. the lab). */
export function useComposers(): ComposerRegistry | null {
  return use(ComposerRegistryContext);
}
