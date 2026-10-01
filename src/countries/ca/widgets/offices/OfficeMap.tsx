'use client';
/**
 * OfficeMap: a real street map framed to fit "you" and the listed offices. Tiles, label overlay (English or
 * French, following the UI language), zoom range, CSS filters and attribution all come from the country
 * pack's basemap config (`@/countries/active.map`; Canada: Natural Resources Canada CBMT, Open Government
 * Licence – Canada, no key, no cookies), the same config the core `Map` primitive and the CSP read. It adds
 * what the core primitive doesn't do: fit-to-pins framing, numbered pins, and a fallback when tiles are
 * blocked. Numbered pins match the list and show the office kind by shape (the chosen one in maple, with a
 * dotted line from "you" to the office's true spot, so the line's length is the real distance at this zoom); a pin that would touch another pin, the "you" dot or its tag, the map's edge, or
 * sit under the selected-office chip, the zoom controls or the credit moves to the nearest clear spot, with a
 * hairline leader back to its true spot.
 * Keyboard: arrows pan, + and − zoom; pins are real buttons (gestures: ./useMapGestures). If tiles can't load
 * (offline, a firewall or VPN the tile host refuses — NRCan's host answered HTTP 403 from some networks on
 * 2026-09-30 — or a Content Security Policy that doesn't list it), `fallback` renders instead, at the same size.
 * The frame fits "you" and the first `listed` pins (the rows the list shows) at every width, so the map stays
 * zoomed in on what is listed; "Show more" re-fits and adds the other pins. A listed office that is a far
 * outlier, that the person panned away from, or whose spot is under the zoom controls waits at the nearest
 * clear spot with an arrow towards it: every listed row has a pin, and only listed rows do. The
 * overlays (selected office, zoom controls, credit) follow the page's direction; only the map surface itself
 * is pinned left-to-right.
 * A new `viewKey` (the filter changed) drops the person's own pan and zoom and re-fits, without remounting.
 * Layout maths live in ./mapLayout, the tile layers in ./MapTiles.
 * Always pair it with the text list.
 *
 * Why not the core `Map` (@/components/ui): it draws plain markers at their true spots in a view the caller
 * sets. This card needs numbered pins laid out by its own collision pass (with leaders and edge arrows), a
 * frame fitted to "you" plus the listed rows, the origin dot and its tag, the dotted line to the chosen
 * office, and a no-tiles fallback. Core Map has no marker render prop, no `fit` and no `fallback` yet, so
 * the pan/zoom, tile and control layers here (MapTiles, MapControls, useMapGestures, tileHealth) are a
 * second implementation on the shared projection and tile config. Once core Map gains `renderMarker`,
 * `fit` and `fallback`, and the tile-health store moves to @/lib/map, those four files go and this
 * component keeps only the layout and the overlays.
 */
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDir, useElementSize, useResolvedTheme } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { mapTiles } from '@/countries/active.map';
import { layerKeys } from '@/lib/map/tiles';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { useTileHealth } from './tileHealth';
import { fit, framedPins, layoutPins, MAX_Z, MIN_Z, PIN, type Rect } from './mapLayout';
import messages from './messages';
import { KIND_SHAPE, PIN_CLS, PIN_ON_CLS } from './shared';
import type { OfficeKind } from './types';
import { useMapGestures } from './useMapGestures';

export type MapPin = { id: string; lat: number; lng: number; km: number; index: number; kind: OfficeKind; label: string; short: string };

/** Maps narrower than this soften the vignette (it would wash out the streets). */
const NARROW = 480;
/** The overlays' inset from the map's edges (`start-2.5`, `top-2.5`, `bottom-2.5`, `end-2.5`). */
const INSET = 10;
/** The selected-office chip: its height, and its width around the text (number badge, gaps, padding, border). */
const CHIP = { h: 34, chrome: 50, char: 7.3 };
/** The zoom controls: three 44px buttons with hairlines between and around them. */
const CONTROLS = { w: 136, h: 46 };
/** The credit in the bottom start corner: its height, and its width around the text (padding, arrow). */
const CREDIT = { h: 26, chrome: 38, char: 6.4 };
/** An edge marker's arrow: how far from the pin's centre it sits. */
const ARROW_R = PIN / 2 + 5;

/** Light softening always; the dark filter only when the pack has no dark tiles (then it derives dark mode). */
const FILTER_VARS = {
  '--om-filter': mapTiles.filter?.light ?? 'none',
  '--om-filter-dark': mapTiles.base.dark ? (mapTiles.filter?.light ?? 'none') : (mapTiles.filter?.dark ?? 'none'),
} as CSSProperties;
export function OfficeMap({
  origin,
  pins,
  selectedId,
  onSelect,
  label,
  youLabel,
  listed,
  viewKey,
  fallback,
  className,
}: {
  origin: { lat: number; lng: number };
  pins: MapPin[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  label: string;
  youLabel: string;
  /** How many rows the list shows: pins numbered up to this are framed (far outliers aside) and always drawn. */
  listed: number;
  /** When this changes (a different set of pins), the person's pan and zoom are dropped and the map re-fits. */
  viewKey?: string;
  /** Rendered instead when the map tiles can't load (offline, blocked). */
  fallback?: ReactNode;
  className?: string;
}) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const reduce = useReducedMotion();
  const hintId = useId();
  // Only packs with dedicated dark tiles need the theme in JS; filters follow `dark:` in CSS.
  const dark = useResolvedTheme() === 'dark' && Boolean(mapTiles.base.dark);
  // Tiles come from our own /tiles route (see src/lib/map/tiles.ts): base + labels in the UI language.
  const layers = layerKeys(locale, dark);
  const attribution = { label: mapTiles.attribution.label[locale] ?? mapTiles.attribution.label.en, href: mapTiles.attribution.href[locale] ?? mapTiles.attribution.href.en };
  const [ref, size] = useElementSize<HTMLDivElement>();
  const measured = size.w > 0;
  const health = useTileHealth();

  const w = measured ? size.w : 600;
  const h = measured ? size.h : 280;
  const narrow = w < NARROW;
  const fitted = fit([origin, ...framedPins(pins, listed)], w, h);
  const { view, frameRef, surface, zoomBy, recentre } = useMapGestures(fitted, viewKey);
  // The "you" tag's width, estimated from its text (13px semibold + padding) to keep it inside the map.
  const tagW = youLabel.length * 7.6 + 18;
  // The overlays sit at the page's start and end, so their boxes swap sides in a right-to-left page. The chip
  // is sized for the longest office name, so pins don't move when the selection changes.
  const [dirRef, dir] = useDir<HTMLDivElement>();
  const chipW = Math.min(w - 2 * INSET, Math.max(0, ...pins.map((p) => p.short.length)) * CHIP.char + CHIP.chrome);
  const creditW = attribution.label.length * CREDIT.char + CREDIT.chrome;
  // The one manual memo here: the collision layout is the expensive step, and a pan re-renders every frame.
  const layout = useMemo(() => {
    const atStart = (width: number, y0: number, y1: number): Rect => (dir === 'rtl' ? { x0: w - width, x1: w, y0, y1 } : { x0: 0, x1: width, y0, y1 });
    const atEnd = (width: number, y0: number, y1: number): Rect => (dir === 'rtl' ? { x0: 0, x1: width, y0, y1 } : { x0: w - width, x1: w, y0, y1 });
    const blocked = [atStart(INSET + chipW, 0, INSET + CHIP.h), atEnd(INSET + CONTROLS.w, h - INSET - CONTROLS.h, h), atStart(creditW, h - CREDIT.h, h)];
    return layoutPins(origin, pins, view, w, h, tagW, blocked, listed);
  }, [origin, pins, view, w, h, tagW, chipW, creditW, dir, listed]);

  if (health === 'blocked' && fallback) return <>{fallback}</>;

  const sel = layout.placed.find((p) => p.id === selectedId);
  const displaced = layout.placed.filter((p) => p.edge === undefined && Math.hypot(p.x - p.tx, p.y - p.ty) > 6);
  const edged = layout.placed.flatMap((p) => (p.edge === undefined ? [] : [{ id: p.id, x: p.x, y: p.y, angle: p.edge }]));

  return (
    <div ref={frameRef} className={cn('relative isolate overflow-hidden rounded-tile border border-hair bg-paper-2 shadow-sm', className)}>
      <p id={hintId} className="sr-only">
        {t('map.hint')}
      </p>
      <div
        ref={ref}
        dir="ltr"
        role="group"
        aria-roledescription={t('map.role')}
        aria-label={label}
        aria-describedby={hintId}
        tabIndex={0}
        {...surface}
        className="absolute inset-0 cursor-grab touch-pan-y select-none outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-ink active:cursor-grabbing"
      >
        {/* Softened for calm (light) and inverted for dark mode, so pins stay the loudest thing on the map. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [filter:var(--om-filter)] dark:[filter:var(--om-filter-dark)]"
          style={FILTER_VARS}
        >
          {health === 'ok' && measured ? <MapTiles layers={layers} view={view} w={w} h={h} holes={[layout.you, ...layout.placed]} /> : null}
        </div>
        {/* A soft vignette (lighter on small maps, where it would wash out the streets) frames the chips. */}
        <div
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,var(--paper-2)_140%)]', narrow && 'opacity-50')}
        />

        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {displaced.map((p) => (
            <g key={p.id} className="text-ink-2">
              <line x1={p.tx} y1={p.ty} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} />
              <circle cx={p.tx} cy={p.ty} r={3} fill="currentColor" />
            </g>
          ))}
          {edged.map((p) => (
            <path
              key={p.id}
              d="M-3.5 -4.5 L4 0 L-3.5 4.5 Z"
              className={p.id === selectedId ? 'text-maple' : 'text-ink'}
              fill="currentColor"
              transform={`translate(${p.x + Math.cos(p.angle) * ARROW_R} ${p.y + Math.sin(p.angle) * ARROW_R}) rotate(${(p.angle * 180) / Math.PI})`}
            />
          ))}
          {sel ? (
            <motion.line
              key={sel.id}
              x1={layout.you.x}
              y1={layout.you.y}
              x2={sel.tx}
              y2={sel.ty}
              className="text-maple"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="1 6"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          ) : null}
        </svg>

        {/* You are here. */}
        <span aria-hidden className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: layout.you.x, top: layout.you.y }}>
          {!reduce ? <span className="absolute -inset-3 animate-ping rounded-full bg-ink/20 [animation-duration:2.4s]" /> : null}
          <span className="relative block size-4 rounded-full border-[3px] border-card bg-ink shadow-md" />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-chip bg-card/95 px-2 py-0.5 text-[13px] font-semibold text-ink shadow-sm"
          style={{ left: layout.you.x + layout.tag.dx, top: layout.you.y + layout.tag.dy, transform: `translate(${layout.tag.tx}, ${layout.tag.ty})` }}
        >
          {youLabel}
        </span>

        {layout.placed.map((p, i) => {
          const on = p.id === selectedId;
          return (
            <motion.button
              key={p.id}
              type="button"
              aria-label={p.label}
              aria-pressed={on}
              onClick={() => onSelect(p.id)}
              // A press on a pin is a press on the pin: it never starts a drag of the map underneath.
              onPointerDown={(e) => e.stopPropagation()}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: on ? 1.14 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26, delay: reduce ? 0 : 0.04 * i }}
              className={cn(
                // Drawn at 28px (what the collision layout spaces), pressed at 44px: the ::before is the hit area.
                "absolute grid place-items-center before:absolute before:-inset-2 before:content-[''] text-[13px] font-bold tabular-nums outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink",
                (on ? PIN_ON_CLS : PIN_CLS)[KIND_SHAPE[p.kind]],
                on ? 'z-30 shadow-[0_0_0_3px_var(--card),var(--sh-lg)]' : 'z-20 shadow-[0_0_0_2px_var(--card),var(--sh-md)]',
              )}
              style={{ width: PIN, height: PIN, left: p.x - PIN / 2, top: p.y - PIN / 2 }}
            >
              {p.index}
            </motion.button>
          );
        })}
      </div>

      {sel ? (
        <span
          aria-hidden
          className="pointer-events-none absolute start-2.5 top-2.5 z-40 flex max-w-[calc(100%-1.25rem)] items-center gap-2 rounded-chip border border-hair bg-card/95 py-1 pe-3 ps-1 text-[13px] font-semibold text-ink shadow-md backdrop-blur-sm"
        >
          <span className={cn('grid size-6 shrink-0 place-items-center text-[12px] font-bold tabular-nums', PIN_ON_CLS[KIND_SHAPE[sel.kind]], KIND_SHAPE[sel.kind] === 'square' && 'rounded-[7px]')}>
            {sel.index}
          </span>
          <bdi className="truncate">{sel.short}</bdi>
        </span>
      ) : null}

      <MapControls ref={dirRef} onZoom={zoomBy} canZoomOut={view.z > MIN_Z} canZoomIn={view.z < MAX_Z} onRecentre={recentre} />

      {/* Opaque, so no half place name shows through or pokes out beside the credit. */}
      <p className="absolute bottom-0 start-0 z-40 m-0 whitespace-nowrap rounded-se-[10px] border-e border-t border-hair bg-card px-2.5 py-[3px] text-[12px] leading-5 text-ink-2">
        <ExternalLink href={attribution.href} className="font-normal text-ink-2 [&_svg]:ms-0.5 [&_svg]:size-3">
          {attribution.label}
        </ExternalLink>
      </p>
    </div>
  );
}
