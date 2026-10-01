/**
 * Map: lightweight, dependency-free slippy map on the active country pack's basemap
 * (`src/countries/<cc>/map.ts` → Canada: Natural Resources Canada CBMT; no key, no cookies), served
 * through our own `/tiles` route when the pack proxies (see `src/lib/map/tiles.ts`).
 *
 * <Map center={[45.4215, -75.6972]} zoom={12} height={320}
 *   markers={[{ id: 'ottawa', lat: 45.42, lng: -75.69, label: 'Passport office — 22 De Varennes', tone: 'maple' }]}
 *   selectedId={id} onSelect={setId} label="Passport offices near K1A 0B1" />
 *
 * - Drag / touch to pan, +/− buttons or wheel (with Ctrl/⌘) to zoom, arrow keys to pan when focused.
 * - Zoom is clamped to the zoom levels the tile service really has (Canada: 3–15).
 * - Labels follow the UI language when the pack has a label overlay for it (Canada: EN / FR).
 * - Dark mode uses the pack's dark tiles, or its `filter.dark` on the light tiles.
 * - Markers are real buttons (keyboard + screen reader). Always pair the map with a text list.
 * - Attribution comes from the pack (required, rendered bottom-end).
 */
'use client';
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale, useT } from '@/lib/i18n/provider';
import { mapTiles } from '@/countries/active.map';
import { useElementSize, useResolvedTheme } from '@/lib/hooks';
import { project as projectAt, unproject as unprojectAt, worldSize } from '@/lib/map/mercator';
import { TILE_MAX_ZOOM, TILE_MIN_ZOOM, TILE_SIZE, layerKeys, tileSrc } from '@/lib/map/tiles';

export type MapMarker = { id: string; lat: number; lng: number; label: string; tone?: 'maple' | 'pine' | 'glacier' | 'ink' };

const TILE = TILE_SIZE;
const MIN_Z = TILE_MIN_ZOOM;
const MAX_Z = TILE_MAX_ZOOM;
const clampZ = (z: number) => Math.max(MIN_Z, Math.min(MAX_Z, z));

const project = (lat: number, lng: number, z: number) => projectAt(lat, lng, worldSize(z, TILE));
const unproject = (x: number, y: number, z: number) => unprojectAt(x, y, worldSize(z, TILE));

const toneCls = { maple: 'bg-maple', pine: 'bg-pine', glacier: 'bg-glacier', ink: 'bg-ink' };

export function Map({
  center,
  zoom: initialZoom = 11,
  markers = [],
  selectedId,
  onSelect,
  height = 320,
  label,
  className,
}: {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
  label: string;
  className?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [sizeRef, size] = useElementSize<HTMLDivElement>({ w: 600, h: height });
  const [zoom, setZoom] = useState(() => clampZ(initialZoom));
  const [c, setC] = useState({ lat: center[0], lng: center[1] });
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  // Re-centre when the `center` prop changes (render-phase update, no effect needed).
  const [prevCenter, setPrevCenter] = useState(center);
  if (prevCenter[0] !== center[0] || prevCenter[1] !== center[1]) {
    setPrevCenter(center);
    setC({ lat: center[0], lng: center[1] });
  }
  // The pan surface: measured, and Ctrl/⌘ + wheel zooms the map. React's wheel listeners are passive
  // (preventDefault would be ignored and the page would zoom too), so this one is attached natively.
  const surfaceRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const stopMeasuring = sizeRef(el);
      const onWheel = (e: WheelEvent) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        setZoom((z) => clampZ(z + (e.deltaY < 0 ? 1 : -1)));
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        stopMeasuring?.();
        el.removeEventListener('wheel', onWheel);
      };
    },
    [sizeRef],
  );
  // Only packs with dedicated dark tiles need the theme in JS; filters follow `dark:` in CSS.
  const dark = useResolvedTheme() === 'dark' && Boolean(mapTiles.base.dark);

  const centerPx = project(c.lat, c.lng, zoom);
  const originX = centerPx.x - size.w / 2;
  const originY = centerPx.y - size.h / 2;
  const tiles: { src: string; key: string; left: number; top: number; layer: number }[] = [];
  const max = 2 ** zoom;
  layerKeys(locale, dark).forEach((key, layer) => {
    for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + size.w) / TILE); tx++) {
      for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + size.h) / TILE); ty++) {
        if (ty < 0 || ty >= max) continue;
        const wx = ((tx % max) + max) % max;
        tiles.push({ src: tileSrc(key, zoom, wx, ty), key: `${layer}/${zoom}/${tx}/${ty}`, left: tx * TILE - originX, top: ty * TILE - originY, layer });
      }
    }
  });
  // Filters: light softening always; the dark filter only when the pack has no dark tiles.
  const filterVars = {
    '--map-filter': mapTiles.filter?.light ?? 'none',
    '--map-filter-dark': mapTiles.base.dark ? (mapTiles.filter?.light ?? 'none') : (mapTiles.filter?.dark ?? 'none'),
  } as CSSProperties;

  const pan = (dx: number, dy: number) => {
    const p = project(c.lat, c.lng, zoom);
    setC(unproject(p.x + dx, p.y + dy, zoom));
  };

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    // A pan starts on the surface itself (tiles don't take pointer events), not on a marker.
    if (e.target !== e.currentTarget) return;
    const p = project(c.lat, c.lng, zoom);
    drag.current = { x: e.clientX, y: e.clientY, cx: p.x, cy: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const rtlSafe = { x: d.cx - (e.clientX - d.x), y: d.cy - (e.clientY - d.y) };
    setC(unproject(rtlSafe.x, rtlSafe.y, zoom));
  }

  return (
    <div className={cn('relative overflow-hidden rounded-tile border border-hair bg-paper-2', className)} style={{ height }} dir="ltr">
      <div
        ref={surfaceRef}
        role="application"
        aria-label={label}
        aria-roledescription={t('map.role')}
        tabIndex={0}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          const step = 80;
          if (e.key === 'ArrowLeft') pan(-step, 0);
          else if (e.key === 'ArrowRight') pan(step, 0);
          else if (e.key === 'ArrowUp') pan(0, -step);
          else if (e.key === 'ArrowDown') pan(0, step);
          else if (e.key === '+' || e.key === '=') setZoom((z) => clampZ(z + 1));
          else if (e.key === '-') setZoom((z) => clampZ(z - 1));
          else return;
          e.preventDefault();
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 [filter:var(--map-filter)] dark:[filter:var(--map-filter-dark)]" style={filterVars}>
          {tiles.map((tl) => (
            <img
              key={tl.key}
              alt=""
              draggable={false}
              decoding="async"
              referrerPolicy="no-referrer"
              src={tl.src}
              // Outside the pack's coverage (or when the host is unreachable) show the paper background, not a
              // broken image. The ref catches tiles that already failed before hydration attached onError.
              onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
              ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0) el.style.visibility = 'hidden';
              }}
              className="absolute max-w-none"
              style={{ left: tl.left, top: tl.top, width: TILE, height: TILE, zIndex: tl.layer }}
            />
          ))}
        </div>
        {markers.map((m) => {
          const p = project(m.lat, m.lng, zoom);
          const on = m.id === selectedId;
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              aria-pressed={on}
              onClick={() => onSelect?.(m.id)}
              className="absolute z-10 -translate-x-1/2 -translate-y-full p-1"
              style={{ left: p.x - originX, top: p.y - originY }}
            >
              <span className={cn('block size-4 rounded-full border-2 border-white shadow-md transition-transform', toneCls[m.tone ?? 'maple'], on && 'scale-150')} />
            </button>
          );
        })}
      </div>
      <div className="absolute end-2 top-2 z-20 flex flex-col overflow-hidden rounded-[12px] border border-hair bg-card shadow-sm">
        <button
          type="button"
          aria-label={t('map.zoomIn')}
          disabled={zoom >= MAX_Z}
          onClick={() => setZoom((z) => clampZ(z + 1))}
          className="grid size-9 place-items-center text-ink-2 hover:bg-paper-2 disabled:text-ink-3/50 disabled:hover:bg-transparent"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={t('map.zoomOut')}
          disabled={zoom <= MIN_Z}
          onClick={() => setZoom((z) => clampZ(z - 1))}
          className="grid size-9 place-items-center border-t border-hair text-ink-2 hover:bg-paper-2 disabled:text-ink-3/50 disabled:hover:bg-transparent"
        >
          <Minus className="size-4" aria-hidden />
        </button>
      </div>
      <p className="absolute bottom-0 end-0 z-20 m-0 rounded-ss-[8px] bg-card/85 px-1.5 py-0.5 text-[10px] text-ink-3">
        <a href={mapTiles.attribution.href[locale] ?? mapTiles.attribution.href.en} target="_blank" rel="noopener noreferrer">
          {mapTiles.attribution.label[locale] ?? mapTiles.attribution.label.en}
        </a>
      </p>
    </div>
  );
}
