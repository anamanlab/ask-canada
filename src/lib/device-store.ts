/**
 * On-device storage for everything a person saves (plans, checklists, reminders, chat history).
 * Nothing here is ever sent to a server. All keys are namespaced `ac:` so the privacy card can list
 * them ("Saved on this device") and "Clear this device" can remove them all.
 *
 *   const [plan, setPlan] = useDeviceItem<Plan>('passport:plan', { label: 'Passport renewal plan' });
 *   setPlan(data, { detail: '3 of 5 ready' });
 *   const items = useDeviceItems();   // [{ key, label, detail, kind, updatedAt }]
 *   clearDevice();
 *
 * Reads are cached against a version counter that every write (here or in another tab) bumps, so
 * renders never touch localStorage and snapshots keep their identity until something really changes.
 */
import { useCallback, useSyncExternalStore } from 'react';

const PREFIX = 'ac:';
/** Where the language note's dismissal lived before it moved under the prefix (`pref:langnote`). */
const LEGACY_LANGNOTE_KEY = 'ac-langnote-dismissed';

export type SavedKind = 'plan' | 'checklist' | 'reminder' | 'chat' | 'preference';
/** `label` is how the entry reads under "Saved on this device". An empty label keeps it off that list (a dismissed note, say); it is still cleared with everything else. */
export type SavedMeta = { label: string; detail?: string; kind?: SavedKind };
export type SavedItem<T = unknown> = SavedMeta & { key: string; updatedAt: number; data: T };

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/* ---------- change tracking ---------- */

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((cb) => cb());
}

/** Another tab wrote to localStorage (a `null` key means it was cleared). */
function onStorage(e: StorageEvent) {
  if (e.key === null || e.key.startsWith(PREFIX)) emit();
}

let watching = false;
function subscribe(cb: () => void) {
  // Other tabs are watched from the first subscription on, so the caches never miss a change.
  if (!watching) {
    watching = true;
    window.addEventListener('storage', onStorage);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* ---------- reads and writes ---------- */

const parse = <T,>(raw: string | null): SavedItem<T> | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedItem<T>;
  } catch {
    return null;
  }
};

export function readItem<T>(key: string): SavedItem<T> | null {
  return parse<T>(storage()?.getItem(PREFIX + key) ?? null);
}

export function writeItem<T>(key: string, data: T, meta: SavedMeta) {
  const s = storage();
  if (!s) return false;
  try {
    const item: SavedItem<T> = { key, data, updatedAt: Date.now(), ...meta };
    s.setItem(PREFIX + key, JSON.stringify(item));
    emit();
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string) {
  storage()?.removeItem(PREFIX + key);
  emit();
}

function ownKeys(s: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  return keys;
}

let listed: { version: number; items: SavedItem[] } = { version: -1, items: [] };

/** Every saved item, newest first. The same array is returned until something is written. */
export function listItems(): SavedItem[] {
  if (listed.version === version) return listed.items;
  const s = storage();
  const items = s
    ? ownKeys(s)
        .map((k) => parse(s.getItem(k)))
        .filter((x): x is SavedItem => Boolean(x?.label))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : [];
  listed = { version, items };
  return items;
}

export function clearDevice() {
  const s = storage();
  if (!s) return;
  ownKeys(s).forEach((k) => s.removeItem(k));
  s.removeItem(LEGACY_LANGNOTE_KEY);
  try {
    document.cookie = 'lang=; path=/; max-age=0';
    document.cookie = 'theme=; path=/; max-age=0';
  } catch {}
  emit();
}

/* ---------- hooks ---------- */

const EMPTY: SavedItem[] = [];
export function useDeviceItems(): SavedItem[] {
  return useSyncExternalStore(subscribe, listItems, () => EMPTY);
}

/** One parsed entry per key, re-read only after a write and re-parsed only when its JSON changed. */
const entries = new Map<string, { version: number; raw: string | null; data: unknown }>();
function readData(key: string): unknown {
  const hit = entries.get(key);
  if (hit?.version === version) return hit.data;
  const raw = storage()?.getItem(PREFIX + key) ?? null;
  const data = hit && hit.raw === raw ? hit.data : parse(raw)?.data;
  entries.set(key, { version, raw, data });
  return data;
}

export function useDeviceItem<T>(key: string, { label, kind, detail }: SavedMeta) {
  const getSnapshot = useCallback(() => readData(key) as T | undefined, [key]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => undefined);
  const set = useCallback((data: T, extra?: Partial<SavedMeta>) => writeItem(key, data, { label, kind, detail, ...extra }), [key, label, kind, detail]);
  const clear = useCallback(() => removeItem(key), [key]);
  return [value, set, clear] as const;
}
