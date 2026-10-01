/**
 * What the person already told another immigration widget in this conversation, so the next one can offer it
 * back instead of asking again ("Use my earlier answers", "Use Mexico").
 *
 * The memory is made of what the widgets on screen are showing right now: each one shares its answers (or its
 * country) while it is mounted and takes them back when it leaves. "New chat" or opening another conversation
 * unmounts every widget, so nothing carries over from one conversation to the next. Kept in memory only: never
 * written to the device or sent anywhere.
 */
import { useEffect, useId, useSyncExternalStore } from 'react';
import type { Profile } from './crs';

export type EarlierAnswers = { profile: Profile; given: (keyof Profile)[] };
/**
 * Lab fixtures only (`output.pinned`): a fixed state that neither feeds nor reads the conversation's memory or
 * the device, so every fixture on the lab page stands alone. `earlier` / `country` stand in for the memory.
 */
export type Pinned = { earlier?: EarlierAnswers; country?: string };

/** One shared value per mounted widget, oldest first: the most recent one is what the next widget is offered. */
function createMemory<T>() {
  const shared = new Map<string, T>();
  const listeners = new Set<() => void>();
  let latest: T | null = null;
  const settle = () => {
    let next: T | null = null;
    for (const v of shared.values()) next = v;
    if (next === latest) return;
    latest = next;
    listeners.forEach((l) => l());
  };
  return {
    share(id: string, value: T) {
      if (shared.get(id) === value) return;
      // Re-inserted, so the widget that spoke last comes last.
      shared.delete(id);
      shared.set(id, value);
      settle();
    },
    withdraw(id: string) {
      if (shared.delete(id)) settle();
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    latest: () => latest,
  };
}

const answers = createMemory<EarlierAnswers>();
const countries = createMemory<string>();
const none = () => null;

/**
 * Shares this widget's answers while they are complete (`null` until then) and takes them back when the widget
 * leaves the conversation. The answers change as the person edits them, so this is an effect: the memory is a
 * store outside React kept in step with the widget's state.
 */
export function useShareAnswers(value: EarlierAnswers | null) {
  const id = useId();
  useEffect(() => {
    if (value) answers.share(id, value);
    else answers.withdraw(id);
  }, [id, value]);
  useEffect(() => () => answers.withdraw(id), [id]);
}
export const useRememberedAnswers = () => useSyncExternalStore(answers.subscribe, answers.latest, none);

/**
 * Shares this widget's country (the passport country of a visa check, the country of a processing-time
 * question). The country that arrived with the answer is shared on mount; after that it only changes when the
 * person picks one, so the widget calls the returned function from that handler. `off`: lab fixtures.
 */
export function useShareCountry(initial: string | null | undefined, off: boolean) {
  const id = useId();
  useEffect(() => {
    if (initial && !off) countries.share(id, initial);
    return () => countries.withdraw(id);
  }, [id, initial, off]);
  return (code: string | null | undefined) => {
    if (code && !off) countries.share(id, code);
  };
}
export const useRememberedCountry = () => useSyncExternalStore(countries.subscribe, countries.latest, none);
