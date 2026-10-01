'use client';
/** Small stateful helpers for the message action row: a self-clearing toast and read-aloud. */
import { useEffect, useRef, useState } from 'react';

export type Toast = { text: string; tone: 'ok' | 'warn' };

/**
 * A toast that clears itself after a moment. A new toast replaces the current one and restarts the
 * timer; nothing fires after unmount.
 */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => {
    if (!toast) return;
    const tm = setTimeout(() => setToast(null), toast.tone === 'warn' ? 4000 : 2400);
    return () => clearTimeout(tm);
  }, [toast]);
  const flash = (text: string, tone: Toast['tone'] = 'ok') => setToast({ text, tone });
  return { toast, flash };
}

/** `true` for `ms` after `trigger()`, then `false` again (e.g. the copy button's check mark). */
export function useBriefly(ms: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const tm = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(tm);
  }, [on, ms]);
  return [on, () => setOn(true)] as const;
}

/**
 * Read text aloud with the browser's speech synthesis. Reading stops when the message leaves the screen
 * (New chat, opening another conversation), not only when the button is pressed again.
 */
export function useReadAloud(lang: string) {
  const [speaking, setSpeaking] = useState(false);
  const mine = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(
    () => () => {
      if (mine.current) window.speechSynthesis.cancel();
    },
    [],
  );

  const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

  function stop() {
    mine.current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const done = () => {
      if (mine.current === u) mine.current = null;
      setSpeaking(false);
    };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.cancel();
    mine.current = u;
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  return { speaking, supported, speak, stop };
}
