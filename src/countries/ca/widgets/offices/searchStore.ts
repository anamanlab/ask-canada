'use client';
/**
 * The searches made on this page (each one's area and candidate offices), kept in memory only: never written
 * to storage or sent anywhere, and gone on reload. A later "near me" question reuses the newest one: the
 * finder shows those results straight away, with one tap to change the place.
 * A page-wide store read with `useSyncExternalStore`, so what a card shows depends only on the searches and
 * their times, never on which card mounted first.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { FinderOutput } from './types';

/** Plenty for one conversation; older searches fall off. */
const MAX = 8;
const NONE: readonly FinderOutput[] = [];
let searches: readonly FinderOutput[] = NONE;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
const snapshot = () => searches;
const serverSnapshot = () => NONE;

/**
 * Add a located result (oldest first, by the time it was computed). Returns how to take it out again, or
 * nothing when it wasn't added (not a located result, or the same search is already there).
 */
function recordSearch(out: FinderOutput): (() => void) | undefined {
  if (out.status !== 'ok' || !out.origin || searches.some((s) => s.asOf === out.asOf)) return undefined;
  searches = [...searches, out].sort((a, b) => (a.asOf < b.asOf ? -1 : 1)).slice(-MAX);
  listeners.forEach((l) => l());
  return () => {
    if (!searches.includes(out)) return;
    searches = searches.filter((s) => s !== out);
    listeners.forEach((l) => l());
  };
}

/**
 * Keeps a card's located result in the store for as long as the card is on the page, and takes it out when
 * the card leaves (`null` registers nothing: lab fixtures, and results that are themselves reused). The store
 * lives outside React, so this is an effect with a cleanup; the card itself reads nothing back.
 */
export function useRememberSearch(out: FinderOutput | null) {
  useEffect(() => (out ? recordSearch(out) : undefined), [out]);
}

/**
 * The newest search made before a card was computed (`asOf`): a card that asked for a place keeps asking,
 * whatever is searched after it (often from that very card).
 */
export function useEarlierSearch(asOf: string): FinderOutput | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot).findLast((s) => s.asOf < asOf) ?? null;
}

/** The newest search on this page, for cards with no clock of their own (the appointment helper). */
export function useLatestSearch(): FinderOutput | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot).at(-1) ?? null;
}
