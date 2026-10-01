/**
 * The planner (plan.ts: every official page with its quote, and the checklist structure) downloaded on demand.
 * A checklist arrives already built by the tool, so the browser only needs the planner when someone switches
 * events, changes the date, or opens an answer that was planned for another day or language.
 *
 *   const { build, failed } = usePlanner(needsReplan);   // build is null until the planner has arrived
 *   <input onFocus={wantPlanner} />                       // start the download on intent, before the change lands
 *
 * `failed` is true when the download didn't arrive (offline, flaky network): the checklist says so and offers
 * "Try again", which is `wantPlanner` once more.
 */
import { useSyncExternalStore } from 'react';
import type { buildChecklist } from './plan';

type Build = typeof buildChecklist;
type Planner = { build: Build | null; failed: boolean };

const IDLE: Planner = { build: null, failed: false };
const FAILED: Planner = { build: null, failed: true };
let state = IDLE;
let loading = false;
const listeners = new Set<() => void>();
const set = (next: Planner) => {
  if (state === next) return;
  state = next;
  listeners.forEach((l) => l());
};

/** Start downloading the planner (once). A failed download is tried again on the next call. */
export function wantPlanner() {
  if (state.build || loading) return;
  loading = true;
  set(IDLE);
  import('./plan').then(
    (m) => {
      loading = false;
      set({ build: m.buildChecklist, failed: false });
    },
    () => {
      loading = false;
      set(FAILED);
    },
  );
}

const listen = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
/** For the answer reopened on another day or in another language: no handler ran, so subscribing starts the download. */
const listenAndLoad = (cb: () => void) => {
  const stop = listen(cb);
  if (!state.failed) wantPlanner();
  return stop;
};
const snapshot = () => state;
const serverSnapshot = () => IDLE;

/** The planner once it's here, or that it failed to arrive. `needed` starts the download when the store is subscribed to (no effect). */
export function usePlanner(needed: boolean): Planner {
  return useSyncExternalStore(needed ? listenAndLoad : listen, snapshot, serverSnapshot);
}
