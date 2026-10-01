'use client';
/**
 * OfficeRadar: compact fallback for OfficeMap when map tiles can't load (offline, blocked network).
 * You sit in the middle; each office sits at its true compass bearing, at a distance on a square-root scale,
 * with labelled distance rings. No tiles and no third-party requests. A caption says plainly that this is a
 * distance-and-direction view, not a street map. Pins are real buttons; always pair it with the text list.
 */
import { motion, useReducedMotion } from 'motion/react';
import { Compass } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GAP, PIN, pushApart, YOU_R } from './mapLayout';
import type { MapPin } from './OfficeMap';
import { KIND_SHAPE, PIN_CLS } from './shared';

const NICE = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
const R = 90; // px radius for the farthest office
/** The dial sits this far above centre, leaving the bottom edge for the caption. */
const LIFT = 10;
/** Ring labels keep this far from each other; rings closer than MIN_RING_GAP collapse to the outer one. */
const LABEL_GAP = 40;
const MIN_RING_GAP = 24;

/** Local east/north offsets in km (equirectangular; fine at city and regional scale). */
function offset(o: { lat: number; lng: number }, p: { lat: number; lng: number }) {
  const x = (p.lng - o.lng) * Math.cos((o.lat * Math.PI) / 180) * 111.32;
  const y = (p.lat - o.lat) * 110.57;
  return { x, y, d: Math.hypot(x, y) };
}

/** Where each pin and each distance ring's label sit, in px from the dial's centre. */
function radarLayout(origin: { lat: number; lng: number }, pins: MapPin[]) {
  const raw = pins.map((p) => ({ ...p, ...offset(origin, p) }));
  const maxD = Math.max(0.3, ...raw.map((p) => p.d));
  const scale = (d: number) => Math.sqrt(d / maxD) * R;
  const placed = raw.map((p) => {
    const r = Math.max(YOU_R, scale(p.d));
    const a = p.d ? Math.atan2(p.y, p.x) : Math.PI / 2;
    return { ...p, px: Math.cos(a) * r, py: -Math.sin(a) * r };
  });
  // Keep pins off the "you" dot and at least GAP apart.
  for (let i = 0; i < placed.length; i++) {
    const obstacles = [{ x: 0, y: 0, r: YOU_R }, ...placed.slice(0, i).map((q) => ({ x: q.px, y: q.py, r: GAP }))];
    const free = pushApart({ x: placed[i].px, y: placed[i].py }, obstacles, (k) => (Math.PI / 3) * (i + k), 24);
    placed[i].px = free.x;
    placed[i].py = free.y;
  }
  const outer = [...NICE].reverse().find((n) => n <= maxD * 0.98);
  const inner = [...NICE].reverse().find((n) => n <= maxD / 4);
  let ringKm = [inner, outer].filter((n, i, a): n is number => n != null && a.indexOf(n) === i);
  if (ringKm.length === 2 && scale(ringKm[1]) - scale(ringKm[0]) < MIN_RING_GAP) ringKm = [ringKm[1]];
  // Ring labels go where pins are farthest away (diagonals first, then every 22.5°).
  const angles = [-Math.PI / 4, (-3 * Math.PI) / 4, Math.PI / 4, (3 * Math.PI) / 4, ...Array.from({ length: 16 }, (_, k) => (k * Math.PI) / 8)];
  // Outer ring first (it has the most room); labels already placed count as obstacles too.
  const labels: { x: number; y: number }[] = [];
  const rings = [...ringKm].reverse().map((km) => {
    const r = scale(km);
    const at = (ang: number) => ({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    const room = (ang: number) => {
      const q = at(ang);
      return Math.min(Infinity, ...placed.map((p) => Math.hypot(p.px - q.x, p.py - q.y)));
    };
    const apart = (ang: number) => labels.every((l) => Math.hypot(l.x - at(ang).x, l.y - at(ang).y) >= LABEL_GAP);
    const free = angles.filter(apart);
    const pool = free.length ? free : angles;
    const a = pool.find((ang) => room(ang) >= 42) ?? pool.reduce((best, ang) => (room(ang) > room(best) ? ang : best), pool[0]);
    labels.push(at(a));
    return { km, r, ...at(a) };
  });
  return { placed, rings };
}

export function OfficeRadar({
  origin,
  pins,
  selectedId,
  onSelect,
  label,
  youLabel,
  northLabel,
  kmLabel,
  caption,
  captionShort,
  className,
}: {
  origin: { lat: number; lng: number };
  pins: MapPin[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  label: string;
  youLabel: string;
  northLabel: string;
  kmLabel: (km: number) => string;
  /** "No street map here · distance and direction" (bottom centre); `captionShort` replaces it in narrow boxes. */
  caption?: string;
  captionShort?: string;
  /** Sets the height (same box as the map it replaces). */
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { placed, rings } = radarLayout(origin, pins);

  const sel = placed.find((p) => p.id === selectedId);

  return (
    <div role="group" aria-label={label} className={cn('relative overflow-hidden rounded-tile border border-hair bg-paper-2', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--pine-wash),transparent)]" />
      <svg aria-hidden className="absolute inset-x-0 size-full text-hair-2" style={{ top: -LIFT }}>
        <svg x="50%" y="50%" overflow="visible">
          {[1.45, 1.95, 2.6, 3.4].map((k) => (
            <circle key={k} r={R * k} fill="none" stroke="currentColor" strokeOpacity={0.55 / k} strokeWidth={1} />
          ))}
          <line x1={-R * 3.6} x2={R * 3.6} y1={0} y2={0} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="2 5" />
          <line x1={0} x2={0} y1={-R * 1.4} y2={R * 1.4} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="2 5" />
          {rings.map(({ km, r }) => (
            <circle key={km} r={r} fill="none" stroke="currentColor" strokeWidth={1.25} />
          ))}
          {sel ? (
            <motion.line
              key={sel.id}
              x1={0}
              y1={0}
              x2={sel.px}
              y2={sel.py}
              className="text-ink-2"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ) : null}
        </svg>
      </svg>

      {rings.map(({ km, x, y }) => (
        <span
          key={km}
          aria-hidden
          className="absolute z-[5] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-chip bg-card/90 px-1.5 text-[12px] font-medium tabular-nums leading-4 text-ink-3"
          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y - LIFT}px)` }}
        >
          {kmLabel(km)}
        </span>
      ))}
      <span aria-hidden className="absolute left-1/2 z-[5] -translate-x-1/2 text-[12px] font-semibold text-ink-3" style={{ top: `max(4px, calc(50% - ${R + 34 + LIFT}px))` }}>
        {northLabel}
      </span>

      <span aria-hidden className="absolute left-1/2 z-[6] -translate-x-1/2 -translate-y-1/2" style={{ top: `calc(50% - ${LIFT}px)` }}>
        {!reduce ? <span className="absolute -inset-3 animate-ping rounded-full bg-ink/15 [animation-duration:2.4s]" /> : null}
        <span className="relative block size-3.5 rounded-full border-[2.5px] border-card bg-ink shadow-[0_0_0_4px_var(--hair)]" />
      </span>
      <span aria-hidden className="absolute start-2.5 top-2.5 z-[6] whitespace-nowrap rounded-chip bg-card/90 px-2 py-0.5 text-[12.5px] font-medium text-ink-2 shadow-sm">
        {youLabel}
      </span>

      {caption ? (
        <p className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-[6] m-0 flex max-w-none justify-center">
          <span className="flex items-center gap-1.5 rounded-chip bg-card/90 px-2.5 py-1 text-[12.5px] font-medium leading-tight text-ink-2 shadow-sm backdrop-blur-sm">
            <Compass className="size-3.5 shrink-0 text-ink-3" aria-hidden />
            {captionShort ? (
              <>
                <span className="@md:hidden">{captionShort}</span>
                <span className="hidden @md:inline">{caption}</span>
              </>
            ) : (
              <span>{caption}</span>
            )}
          </span>
        </p>
      ) : null}

      {placed.map((p, i) => {
        const on = p.id === selectedId;
        return (
          <motion.button
            key={p.id}
            type="button"
            aria-label={p.label}
            aria-pressed={on}
            onClick={() => onSelect(p.id)}
            initial={reduce ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: on ? 1.14 : 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24, delay: reduce ? 0 : 0.05 * i }}
            className={cn(
              'absolute grid place-items-center text-[13px] font-bold tabular-nums outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink',
              PIN_CLS[KIND_SHAPE[p.kind]],
              on ? 'z-20 shadow-[0_0_0_3px_var(--card),0_0_0_5px_var(--ink),var(--sh-lg)]' : 'z-10 shadow-[0_0_0_2px_var(--card),var(--sh-md)]',
            )}
            style={{ width: PIN, height: PIN, left: `calc(50% + ${p.px - PIN / 2}px)`, top: `calc(50% + ${p.py - PIN / 2 - LIFT}px)` }}
          >
            {p.index}
            <span aria-hidden className="absolute -inset-2" />
          </motion.button>
        );
      })}
    </div>
  );
}
