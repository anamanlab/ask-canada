'use client';
/**
 * Sending a follow-up from the widget, guarded: nothing is sent while an answer is being written (a second
 * message mid-stream would interleave two answers in the thread), and a double tap sends once.
 *
 *   const { send, busy } = useGuardedSend();
 *   <Button disabled={busy} onClick={() => send('…')}>
 * send() answers 'sent', 'busy' (an answer is in flight: tell the person) or 'repeat' (a double tap: say nothing).
 * `send` reads the status of the render it came from, so call it from an event handler, or (for something
 * that answers later, like a location fix) from a `useEffectEvent`, which always runs the latest one.
 */
import { useRef } from 'react';
import { useChatActions, useChatStatus } from '@/components/chat/actions';

/** Two sends closer together than this are one tap repeated (the status has not reached the widget yet). */
const DOUBLE_TAP_MS = 1000;

export function useGuardedSend(): { send: (text: string) => 'sent' | 'busy' | 'repeat'; busy: boolean } {
  const { send: post } = useChatActions();
  const status = useChatStatus();
  const busy = status === 'submitted' || status === 'streaming';
  const last = useRef(0);

  function send(text: string) {
    const at = Date.now();
    if (at - last.current < DOUBLE_TAP_MS) return 'repeat';
    if (busy) return 'busy';
    last.current = at;
    post(text);
    return 'sent';
  }
  return { send, busy };
}
