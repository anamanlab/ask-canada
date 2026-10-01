'use client';
/** Landscape illustrations for the parks cards: one quiet vignette per landscape, and the small icon tile. */
import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { Landscape } from './data';

const SNOW_CSS =
  '.pk-snow{fill:var(--card);fill-opacity:.9}' +
  '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pk-snow{fill:var(--ink);fill-opacity:.72}}' +
  ':root[data-theme="dark"] .pk-snow{fill:var(--ink);fill-opacity:.72}';

/**
 * A quiet landscape vignette drawn from the design tokens (no images, no hex), one per landscape.
 * Decorative: always aria-hidden.
 */
export function ParkScene({ land, className, night, view }: { land: Landscape; className?: string; night?: boolean; /** A square part of the scene (SceneTile). */ view?: TileView }) {
  const id = useId().replace(/:/g, '');
  const sky = night || land === 'north';
  return (
    <svg
      viewBox={view ? `${view.x} 0 140 140` : '0 0 320 140'}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block', view?.flip && '-scale-x-100', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Snow, moon and stars stay light in both themes (the card colour would turn them into dark holes at night). */}
        <style>{SNOW_CSS}</style>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: sky ? 'var(--a-violet)' : 'var(--a-teal)', stopOpacity: sky ? 0.5 : 0.42 }} />
          <stop offset=".55" style={{ stopColor: sky ? 'var(--a-teal)' : 'var(--a-green)', stopOpacity: 0.3 }} />
          <stop offset="1" style={{ stopColor: sky ? 'var(--a-green)' : 'var(--a-rose)', stopOpacity: sky ? 0.4 : 0.26 }} />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop offset="0" style={{ stopColor: 'var(--amber)', stopOpacity: 0.34 }} />
          <stop offset=".45" style={{ stopColor: 'var(--amber)', stopOpacity: 0.12 }} />
          <stop offset="1" style={{ stopColor: 'var(--amber)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--glacier)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--glacier)', stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <rect width="320" height="140" className="fill-card" />
      <rect width="320" height="140" fill={`url(#${id}s)`} />
      {land === 'mountains' ? (
        <>
          <path d="M0 104 L52 52 L78 72 L118 26 L160 80 L196 44 L238 92 L276 58 L320 96 V140 H0Z" className="fill-glacier/35" />
          <path d="M118 26 L104 42 L116 40 L124 48 L132 36 Z M196 44 L186 56 L198 54 L206 60 Z" className="pk-snow" />
          <path d="M0 118 L40 88 L84 110 L130 74 L178 108 L222 82 L268 112 L320 90 V140 H0Z" className="fill-pine/55" />
          <path d="M0 128 Q80 112 160 124 T320 120 V140 H0Z" className="fill-pine/80" />
        </>
      ) : land === 'coast' ? (
        <>
          <circle cx="248" cy="44" r="16" className="pk-snow" style={{ fillOpacity: 0.8 }} />
          <path d="M0 76 Q40 60 86 70 L120 84 Q170 66 214 78 L320 72 V140 H0Z" className="fill-pine/50" />
          <rect y="92" width="320" height="48" fill={`url(#${id}w)`} />
          <path d="M0 104 Q20 98 40 104 T80 104 T120 104 T160 104 T200 104 T240 104 T280 104 T320 104" className="fill-none stroke-card/80" strokeWidth="2" />
          <path d="M0 120 Q20 114 40 120 T80 120 T120 120 T160 120 T200 120 T240 120 T280 120 T320 120" className="fill-none stroke-card/60" strokeWidth="2" />
          <path d="M40 92 L46 70 L52 92 Z" className="fill-ink/25" />
        </>
      ) : land === 'lakes' ? (
        <>
          <path d="M0 84 Q90 64 170 80 T320 74 V140 H0Z" className="fill-pine/40" />
          <ellipse cx="170" cy="112" rx="150" ry="18" fill={`url(#${id}w)`} />
          {[18, 40, 60, 250, 272, 296].map((x, i) => (
            <path key={x} d={`M${x} ${96 - (i % 2) * 8} l-10 22 h20 Z M${x} ${86 - (i % 2) * 8} l-8 18 h16 Z`} className="fill-pine/85" />
          ))}
        </>
      ) : land === 'prairie' ? (
        <>
          <circle cx="226" cy="50" r="30" fill={`url(#${id}sun)`} />
          <circle cx="226" cy="50" r="7" className="fill-amber/50" />
          <path d="M0 96 Q80 76 160 92 T320 86 V140 H0Z" className="fill-amber/25" />
          <path d="M0 112 Q90 96 180 110 T320 104 V140 H0Z" className="fill-pine/45" />
          <path d="M0 128 Q120 116 220 126 T320 124 V140 H0Z" className="fill-pine/70" />
        </>
      ) : (
        <>
          <path d="M-10 60 C60 20 120 70 180 34 S300 30 330 16" className="fill-none stroke-aurora-green/70" strokeWidth="10" strokeLinecap="round" />
          <path d="M-10 74 C70 40 140 84 200 50 S300 46 330 36" className="fill-none stroke-aurora-teal/50" strokeWidth="6" strokeLinecap="round" />
          {[30, 76, 140, 214, 262, 300].map((x, i) => (
            <circle key={x} cx={x} cy={14 + (i % 3) * 9} r="1.2" className="pk-snow" style={{ fillOpacity: 1 }} />
          ))}
          <path d="M0 108 L60 100 L120 106 L200 98 L260 104 L320 100 V140 H0Z" className="pk-snow" style={{ fillOpacity: 0.7 }} />
          <path d="M0 122 Q100 112 200 120 T320 118 V140 H0Z" className="fill-glacier/40" />
        </>
      )}
    </svg>
  );
}

type TileView = { x: number; flip: boolean };

/**
 * Which square of the 320-wide scene a park's tile shows: one of seven positions, mirrored or not, picked from
 * the park's id. Parks that share a landscape get different skylines, and a park keeps its own everywhere.
 */
function tileView(seed: string): TileView {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return { x: (h % 7) * 30, flip: Math.floor(h / 7) % 2 === 1 };
}

/**
 * Round icon tile with the park's landscape, sized like WidgetShell's icon. `seed` (the park's id) picks the
 * park's own part of the scene; without it the tile shows the middle.
 */
export function SceneTile({ land, size = 42, seed }: { land: Landscape; size?: number; seed?: string }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-[13px] border border-hair shadow-sm" style={{ width: size, height: size }}>
      <ParkScene land={land} className="size-full" view={seed ? tileView(seed) : undefined} />
    </span>
  );
}
