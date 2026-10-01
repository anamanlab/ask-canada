'use client';
/**
 * CanadaMap: a quiet, theme-aware map of Canada in the Canada Atlas Lambert projection (EPSG:3978), drawn
 * from NRCan geometry (canada-map-data.ts). No tiles, no API key, no network. Pins are real buttons
 * (keyboard + screen reader); always pair the map with a text list.
 *
 * Pointer hits are resolved by distance, not by the DOM: where parks sit 10 to 20 px apart (the Rockies, the
 * Maritimes) 44px buttons would overlap and the later sibling would win, so a tap on Banff's dot would open
 * Elk Island. The frame takes the tap and picks the nearest dot within HIT_RADIUS; the buttons ignore the
 * pointer and stay for the keyboard and assistive technology. check-map-hits.mjs tests every pin.
 *
 * Keyboard: the pins are one tab stop (roving tabindex). Arrow keys walk the pins in view from west to east,
 * Home/End jump to the ends, Enter or Space selects; the pin with focus shows its name. Say so in `label`.
 *
 * <CanadaMap pins={[{ id, lat, lng, label, tone }]} selectedId onSelect origin={{ lat, lng, label }}
 *   focus="all|fit|selected" height={300} label="Map of national parks" />
 *
 * WHY NOT THE CORE `Map` (`@/components/ui`): two hard limits, not taste.
 *   1. Projection. The core map is Web Mercator tiles. These parks run from 41.9°N (Point Pelee) to 82°N
 *      (Quttinirpaaq); in Mercator the Arctic is stretched about six times wider than the south, so the
 *      whole-country view becomes mostly Nunavut and the southern parks collapse into a strip. This map
 *      uses the Canada Atlas Lambert projection (EPSG:3978), the one NRCan draws Canada in.
 *   2. Zoom range. The tile service starts at zoom 3 (2048px for the world): Canada alone is about 800px
 *      wide there, more than twice a phone's message column, so "all 48 parks at once" can't be shown.
 * It also needs no tile requests. What is shared is used: `useElementSize`, `useRovingFocus`. There is no free
 * pan or pinch: the views are the ones a person asks for (the country, the results, one park and its
 * neighbours), plus, on touch screens, a tap where dots crowd under a fingertip zooms into that region
 * instead of guessing which park was meant ("All of Canada" goes back).
 *
 * Geometry and the settled view are in map-geometry.ts, label layout in map-labels.ts, the glide between
 * views in use-glide.ts: the country is drawn once and moved with a CSS transform, and the pins travel with
 * it. Outlines are a second layer over the same shapes, hidden while the map moves (their width belongs to
 * the settled view), then faded in with the names. The map ships inside the lazily loaded Finder and NationalConditions chunks, so the
 * base map's geometry stays out of the cards that have no map.
 */
import { useCallback, useId, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useElementSize, useRovingFocus } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import { BORDERS, LAKES, LAND, MAP, NEIGHBOURS } from './canada-map-data';
import { NARROW_PX, project, settle, type XY } from './map-geometry';
import { canvasMeasure, estimateWidth, layoutMap, peekRect, type Measure } from './map-labels';
import { MapNames } from './MapNames';
import messages from './messages';
import { useLang } from './hooks';
import { GLIDE, glideStyle, useGlide, worldTransform } from './use-glide';

export type Pin = { id: string; lat: number; lng: number; label: string; /** Visible name chip for the selected pin (defaults to `label`). */ short?: string; tone?: 'pine' | 'maple' | 'amber' | 'glacier' | 'ink' | 'muted' };

export type CanadaMapProps = {
  pins: Pin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  origin?: { lat: number; lng: number; label: string } | null;
  /** all: whole country · fit: frame `focusIds` (or every pin) · selected: close-up of the selected pin. */
  focus?: 'all' | 'fit' | 'selected';
  focusIds?: string[];
  /** On a phone-width map, frame only the first `focusTight` of `focusIds` (list them nearest first). */
  focusTight?: number;
  /** Pixels, or 'auto' to follow the width (taller on wide screens so the whole country fits). */
  height?: number | 'auto';
  label: string;
  className?: string;
};

const TONE: Record<NonNullable<Pin['tone']>, string> = {
  pine: 'bg-pine',
  maple: 'bg-maple',
  amber: 'bg-amber',
  glacier: 'bg-glacier',
  ink: 'bg-ink',
  muted: 'bg-ink-3',
};

/** A tap this close to a dot (in px) selects it: half of a 44px target. */
const HIT_RADIUS = 22;
/** A touch lands "on several dots" when the runner-up is within this many px of the nearest: too close to call. */
const TOO_CLOSE = 9;
/** …and then the map zooms to the parks under the fingertip, when that view is at least this much closer than the one on screen. */
const ZOOM_GAIN = 1.25;
const WORLD = `0 0 ${MAP.w} ${MAP.h}`;

export default function CanadaMap({ pins, selectedId, onSelect, origin, focus = 'fit', focusIds, focusTight, height = 300, label, className }: CanadaMapProps) {
  const t = useMessages(messages);
  const lang = useLang();
  const [overview, setOverview] = useState(false);
  const [measure, setMeasure] = useState<Measure>(() => estimateWidth);
  const [sizeRef, size] = useElementSize<HTMLDivElement>({ w: 640, h: 0 });
  const shapes = useId();
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      setMeasure(() => canvasMeasure(getComputedStyle(el).fontFamily));
      return sizeRef(el);
    },
    [sizeRef],
  );

  const width = Math.max(200, size.w);
  const auto = Math.round(Math.min(440, Math.max(260, width / 1.55)));
  // The whole country needs the room: "All of Canada" on a wide card grows the map to the height it would
  // have with no park selected, instead of shrinking Canada into a short strip.
  const h = height === 'auto' ? auto : overview ? Math.max(height, auto) : height;

  const projected = pins.map((p) => ({ ...p, xy: project(p.lat, p.lng) }));
  const originAt = origin ? { xy: project(origin.lat, origin.lng), label: origin.label } : null;
  // A phone frames fewer neighbours, so the parks around the selected one stand apart instead of in a clump.
  const framed = focusIds && focusTight && width < NARROW_PX ? focusIds.slice(0, focusTight) : focusIds;

  // A region zoomed into by touch. It belongs to the view it was made in: a new selection or filter drops it.
  const baseKey = [focus, selectedId ?? '', pins.length, focusIds?.join(',') ?? ''].join('|');
  const [zoom, setZoom] = useState<{ ids: string[]; for: string } | null>(null);
  const region = zoom?.for === baseKey ? zoom.ids : null;
  const view = region ? { focus: 'fit' as const, focusIds: region, overview: false } : { focus, focusIds: framed, overview };

  // The view to settle on. A change of view glides; a change of size alone just reframes.
  const target = settle({ pins: projected, selectedId, origin: originAt?.xy, ...view, width, height: h });
  const viewKey = [view.focus, view.overview, selectedId ?? '', view.focusIds?.join(',') ?? '', origin ? `${origin.lat},${origin.lng}` : ''].join('|');
  const { gliding, onSettle } = useGlide(target, viewKey);
  /** Screen pixels per unit of the base map in the settled view. */
  const scale = width / target.w;
  /** A point's place in the settled view, as a whole-pixel offset from the frame's top left corner. */
  const at = ([x, y]: XY): CSSProperties => ({ transform: `translate(${Math.round((x - target.x) * scale)}px, ${Math.round((y - target.y) * scale)}px)` });

  const layout = layoutMap({
    box: target,
    width,
    height: h,
    pins: projected,
    selectedId,
    ...view,
    origin: originAt,
    lang,
    measure,
    text: {
      toggle: view.overview ? t('map.zoomBack') : t('map.canada'),
      attribution: t('map.attribution'),
      province: (id) => t(`prov.${id}`),
      cluster: (name, count) => t('map.cluster', { name, count }),
      clusterCount: (count) => t('map.clusterCount', { count }),
    },
  });

  // One tab stop for all the pins: the pin the arrow keys last reached, else the selected one, else the
  // westernmost. A new selection (from the list, a tap) takes the tab stop with it.
  const [cursor, setCursor] = useState<{ id: string | null; for: string | null }>({ id: null, for: selectedId ?? null });
  if (cursor.for !== (selectedId ?? null)) setCursor({ id: null, for: selectedId ?? null });
  const order = layout.order;
  const rank = new Map(order.map((id, i) => [id, i]));
  const roving = useRovingFocus({
    count: order.length,
    index: rank.get(cursor.id ?? selectedId ?? '') ?? -1,
    onMove: (i) => setCursor({ id: order[i], for: selectedId ?? null }),
    orientation: 'both',
  });

  /** The visible pins within `reach` px of a pointer position, nearest first, where they are on screen now (also mid-glide). */
  const pinsNear = (clientX: number, clientY: number, reach: number) =>
    order
      .flatMap((id, i) => {
        const r = roving.getItem(i)?.getBoundingClientRect();
        return r ? [{ id, d: Math.hypot(r.left + r.width / 2 - clientX, r.top + r.height / 2 - clientY) }] : [];
      })
      .filter((p) => p.d <= reach)
      .sort((a, b) => a.d - b.d);
  const pinAt = (clientX: number, clientY: number) => pinsNear(clientX, clientY, HIT_RADIUS)[0]?.id ?? null;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const onFrameClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    const hits = pinsNear(e.clientX, e.clientY, HIT_RADIUS);
    if (!hits.length) return;
    // A fingertip between dots, no clear winner: go closer rather than guess, while there is closer to go.
    const finger = 'pointerType' in e.nativeEvent && e.nativeEvent.pointerType !== 'mouse';
    if (finger && hits.length > 1 && hits[1].d - hits[0].d < TOO_CLOSE) {
      const ids = hits.map((p) => p.id);
      const closer = settle({ pins: projected, selectedId, focus: 'fit', focusIds: ids, overview: false, width, height: h });
      if (target.w >= closer.w * ZOOM_GAIN) return setZoom({ ids, for: baseKey });
    }
    onSelect(hits[0].id);
  };
  const onFrameMove = (e: PointerEvent<HTMLDivElement>) => {
    if (onSelect && e.pointerType === 'mouse') setHoverId(pinAt(e.clientX, e.clientY));
  };

  // The pin under the keyboard focus or the mouse shows its name, unless it is already written beside it.
  const peekPin = projected.find((p) => p.id === (focusId ?? hoverId) && p.id !== selectedId && layout.visible.has(p.id));
  const peekText = peekPin ? (peekPin.short ?? peekPin.label) : '';
  const peek =
    peekPin && !layout.chips.some((c) => c.id === peekPin.id && c.text === peekText)
      ? peekRect([((peekPin.xy[0] - target.x) / target.w) * width, ((peekPin.xy[1] - target.y) / target.h) * h], measure(peekText, 11.5, 600, 6.8) + 18, width)
      : null;

  return (
    <div
      ref={attach}
      dir="ltr"
      className={cn('relative overflow-hidden rounded-tile border border-hair bg-glacier-wash', hoverId && 'cursor-pointer', className)}
      style={{ height: h, ...glideStyle(gliding) }}
      role="group"
      aria-label={label}
      onClick={onFrameClick}
      onPointerMove={onFrameMove}
      onPointerLeave={() => setHoverId(null)}
    >
      {/* The whole country, drawn once and placed by a transform, so a glide repaints nothing. */}
      <div
        aria-hidden
        className={cn('absolute left-0 top-0 w-full origin-top-left', GLIDE)}
        style={{ aspectRatio: `${MAP.w} / ${MAP.h}`, transform: worldTransform(target) }}
        onTransitionEnd={onSettle}
        onTransitionCancel={onSettle}
      >
        <svg viewBox={WORLD} className="absolute inset-0 size-full overflow-visible" focusable="false">
          <defs>
            <path id={`${shapes}-land`} d={LAND} fillRule="evenodd" />
            <path id={`${shapes}-lakes`} d={LAKES} />
          </defs>
          <path d={NEIGHBOURS} className="fill-paper-3 stroke-paper-3" strokeWidth={1 / scale} fillRule="evenodd" />
          <use href={`#${shapes}-land`} className="fill-card" />
          <use href={`#${shapes}-lakes`} className="fill-glacier-wash" />
        </svg>
        {/* Outlines: widths are in map units, sized to be hairlines on screen in the settled view. */}
        <svg
          viewBox={WORLD}
          className={cn('absolute inset-0 size-full overflow-visible fill-none', gliding ? 'opacity-0' : 'opacity-100 transition-opacity duration-200 motion-reduce:transition-none')}
          focusable="false"
        >
          <use href={`#${shapes}-land`} className="stroke-hair-2" strokeWidth={0.9 / scale} />
          <use href={`#${shapes}-lakes`} className="stroke-hair" strokeWidth={0.6 / scale} />
          <path d={BORDERS} className="stroke-hair-2" strokeWidth={0.9 / scale} strokeDasharray={`${3 / scale} ${3 / scale}`} />
        </svg>
      </div>

      {originAt && layout.originInView ? (
        <span className={cn('pointer-events-none absolute left-0 top-0 z-10 -translate-x-1/2 -translate-y-1/2', GLIDE)} style={at(originAt.xy)}>
          <span className="block size-3 rounded-full border-2 border-card bg-ink shadow-md" />
        </span>
      ) : null}

      {/* Every pin stays mounted and follows the view; the ones outside this view fade out and can't take focus. */}
      {projected.map((p) => {
        const on = p.id === selectedId;
        const i = rank.get(p.id);
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.label}
            aria-pressed={onSelect ? on : undefined}
            {...(i === undefined ? { tabIndex: -1 } : roving.itemProps(i))}
            // Keyboard and assistive technology only: pointers go through the frame (see the file comment).
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(p.id);
            }}
            onFocus={(e) => setFocusId(e.currentTarget.matches(':focus-visible') ? p.id : null)}
            onBlur={() => setFocusId(null)}
            className={cn(
              'group pointer-events-none absolute left-0 top-0 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none focus-visible:z-[35] motion-reduce:transition-none',
              on ? 'z-20' : 'z-10',
              i !== undefined ? 'opacity-100 [transition:transform_var(--glide)_cubic-bezier(.33,1,.68,1),opacity_.2s]' : 'invisible opacity-0 [transition:transform_var(--glide)_cubic-bezier(.33,1,.68,1),opacity_.2s,visibility_0s_.2s]',
            )}
            style={at(p.xy)}
          >
            <span
              aria-hidden
              className={cn(
                'relative block rounded-full border-2 border-card shadow-md outline-offset-2 outline-ink transition-transform duration-200 group-focus-visible:scale-125 group-focus-visible:outline-2 motion-reduce:transition-none',
                p.id === hoverId && 'scale-125',
                on ? 'size-4 bg-maple ring-[5px] ring-maple/20' : cn('size-3', TONE[p.tone ?? 'pine']),
              )}
            />
          </button>
        );
      })}

      <MapNames layout={layout} hidden={gliding} origin={originAt?.label} peek={peek ? { r: peek, text: peekText } : null} />

      {layout.showToggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // From a touch-zoomed region the button leads back to the view the map had before.
            if (region) setZoom(null);
            else setOverview((o) => !o);
          }}
          aria-pressed={view.overview}
          className="absolute end-2 top-2 z-30 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-hair bg-card px-3.5 text-[13px] font-medium text-ink shadow-sm transition hover:bg-card"
        >
          <Maximize2 className="size-3.5" aria-hidden strokeWidth={2} />
          {view.overview ? t('map.zoomBack') : t('map.canada')}
        </button>
      ) : null}
      <p className="pointer-events-none absolute bottom-0 end-0 z-30 m-0 rounded-ss-[8px] bg-card/80 px-1.5 py-0.5 text-[10px] text-ink-3">{t('map.attribution')}</p>
    </div>
  );
}
