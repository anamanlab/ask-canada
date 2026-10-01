'use client';
/**
 * Whether the basemap's tiles load here. One probe per page: a single world tile. Only when it loads do maps
 * request their tiles; if it fails (offline, a firewall, or a Content Security Policy without the tile host)
 * every map shows its fallback, so a blocked host costs a couple of failed requests per page, not dozens.
 * One failed request doesn't settle it: a second, different tile is tried after a short wait (a transient
 * HTTP 500 shouldn't cost the page its maps), and the probe runs again when the browser comes back online.
 */
import { useSyncExternalStore } from 'react';
import { mapTiles } from '@/countries/active.map';
import { tileX, tileY } from '@/lib/map/mercator';
import { probeTileSrc, tileSrc } from '@/lib/map/tiles';

type Health = 'unknown' | 'ok' | 'blocked';

/** Wait before the second try. */
const RETRY_MS = 1500;

/** A page-wide store: the answer is the same for every map, and it is asked for once. */
let health: Health = 'unknown';
let started = false;
let retry: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function settle(next: Health) {
  if (health === next) return;
  health = next;
  listeners.forEach((l) => l());
}

/** The tile one level deeper over the middle of the pack's coverage: a different URL than the first probe. */
function secondTileSrc() {
  const z = Math.min(mapTiles.minZoom + 1, mapTiles.maxZoom);
  const b = mapTiles.bounds;
  const [lng, lat] = b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [0, 0];
  return tileSrc('base', z, tileX(lng, z), tileY(lat, z));
}

function load(src: string, onFail: () => void) {
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = () => settle('ok');
  img.onerror = onFail;
  img.src = src;
}

/** First a tile at the shallowest zoom (cached for every map afterwards); if it fails, one more, later. */
function probe() {
  clearTimeout(retry);
  load(probeTileSrc(), () => {
    retry = setTimeout(() => load(secondTileSrc(), () => settle('blocked')), RETRY_MS);
  });
}

/** Back online after a failed probe: ask again (maps replace their fallback when it succeeds). */
function onOnline() {
  if (health !== 'ok') probe();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!started) {
    started = true;
    window.addEventListener('online', onOnline);
    if (health !== 'ok') probe();
  }
  return () => {
    listeners.delete(cb);
    // The last map is gone: stop listening and drop a pending second try. The next map starts over (a known
    // "ok" is kept; anything else is asked again).
    if (!listeners.size) {
      window.removeEventListener('online', onOnline);
      clearTimeout(retry);
      started = false;
    }
  };
}

export function useTileHealth(): Health {
  return useSyncExternalStore(subscribe, () => health, () => 'unknown');
}
