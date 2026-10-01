'use client';
/**
 * A sheet of paper with numbered zones: "where to look" on a government notice.
 * Deliberately abstract (grey text bars, no logos or real layouts) so it can never pass for the real thing.
 * Tokens only; the picture is decorative (aria-hidden) and always paired with a numbered text list.
 *  - `lg`: the guide, with a numbered marker on every zone
 *  - `sm`: the letter in the verdict, as an object: a second page behind it, the creases from its envelope,
 *    plain lines of text, and the one place to look marked like a highlighter with its figure in bold
 */
import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { DocId } from './data';

type Zone = { x: number; y: number; w: number; h: number; lines?: number };

/** Zones in the order of the `doc.<id>.look.<n>` callouts. */
const ZONES: Partial<Record<DocId, Zone[]>> = {
  'cra-noa': [
    { x: 16, y: 40, w: 104, h: 28, lines: 2 },
    { x: 16, y: 78, w: 168, h: 32, lines: 1 },
    { x: 16, y: 120, w: 168, h: 52, lines: 4 },
    { x: 16, y: 182, w: 168, h: 28, lines: 2 },
    { x: 16, y: 220, w: 168, h: 26, lines: 2 },
    { x: 132, y: 40, w: 52, h: 28, lines: 1 },
  ],
  'cra-nor': [
    { x: 16, y: 40, w: 104, h: 28, lines: 2 },
    { x: 16, y: 78, w: 168, h: 32, lines: 1 },
    { x: 16, y: 120, w: 168, h: 88, lines: 6 },
  ],
  'cra-review': [
    { x: 124, y: 40, w: 60, h: 22, lines: 1 },
    { x: 16, y: 92, w: 168, h: 100, lines: 7 },
    { x: 16, y: 214, w: 168, h: 30, lines: 2 },
  ],
  'ircc-biometrics': [
    { x: 16, y: 84, w: 168, h: 64, lines: 4 },
    { x: 16, y: 160, w: 168, h: 76, lines: 5 },
  ],
};

export const hasZones = (id: DocId | 'other' | null): id is DocId => !!id && id !== 'other' && !!ZONES[id];

export function LetterArt({
  doc,
  active,
  onZone,
  size = 'lg',
  highlight,
  className,
}: {
  doc: DocId | 'other' | null;
  /** 1-based zone to emphasize (hover/focus from the list). */
  active?: number | null;
  onZone?: (n: number | null) => void;
  size?: 'sm' | 'lg';
  /** Mini version: which zone to tint (e.g. the account summary). */
  highlight?: number;
  className?: string;
}) {
  const fid = `ac-doc-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const zones = (doc && doc !== 'other' ? ZONES[doc] : undefined) ?? [];
  const bars = (z: Zone, key: string) =>
    Array.from({ length: z.lines ?? 0 }, (_, i) => {
      const lh = Math.min(8, (z.h - 8) / Math.max(1, z.lines ?? 1));
      const w = (z.w - 16) * (i === (z.lines ?? 1) - 1 && (z.lines ?? 1) > 1 ? 0.6 : 0.92 - (i % 3) * 0.08);
      return <rect key={`${key}-${i}`} x={z.x + 8} y={z.y + 6 + i * lh + (lh - 3) / 2} width={w} height={3} rx={1.5} className="fill-ink-3/25" />;
    });
  return (
    <svg
      viewBox="0 0 200 262"
      className={cn(size === 'sm' ? 'w-[124px]' : 'w-full max-w-[220px]', 'h-auto overflow-visible', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <filter id={fid} x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodOpacity=".12" />
        </filter>
      </defs>
      {/* The page behind, peeking out */}
      {size === 'sm' ? <rect x="6" y="6" width="192" height="254" rx="10" className="fill-card stroke-hair-2" strokeWidth="1.2" transform="rotate(5 100 131)" filter={`url(#${fid})`} /> : null}
      {/* Sheet with a folded corner */}
      <path d="M12 2h156l30 30v218a10 10 0 0 1-10 10H12A10 10 0 0 1 2 250V12A10 10 0 0 1 12 2Z" className="fill-card stroke-hair-2" strokeWidth="1.2" filter={`url(#${fid})`} />
      <path d="M168 2v22a8 8 0 0 0 8 8h22" className="fill-paper-2 stroke-hair-2" strokeWidth="1.2" />
      {/* Letterhead: a neutral mark + two bars (no real branding) */}
      <rect x="16" y="14" width="14" height="14" rx="4" className="fill-maple/80" />
      <rect x="36" y="16" width="62" height="4" rx="2" className="fill-ink-3/40" />
      <rect x="36" y="24" width="40" height="3" rx="1.5" className="fill-ink-3/25" />
      {/* Creases from being folded in three for the envelope */}
      {size === 'sm'
        ? [89, 176].map((y) => (
            <g key={y}>
              <rect x="3" y={y} width="194" height="7" className="fill-ink/[.035]" />
              <line x1="3" x2="197" y1={y} y2={y} className="stroke-hair-2" strokeWidth="1" />
            </g>
          ))
        : null}
      {zones.length === 0
        ? Array.from({ length: 16 }, (_, i) => <rect key={i} x={16} y={44 + i * 13} width={i % 5 === 4 ? 96 : 168 - (i % 3) * 14} height={3.5} rx={1.75} className="fill-ink-3/20" />)
        : zones.map((z, i) => {
            const n = i + 1;
            const on = active === n || highlight === n;
            return (
              <g
                key={n}
                onMouseEnter={onZone ? () => onZone(n) : undefined}
                onMouseLeave={onZone ? () => onZone(null) : undefined}
                className="transition-opacity duration-200"
                opacity={active && active !== n ? 0.45 : 1}
              >
                {size === 'lg' || on ? (
                  <rect
                    x={z.x}
                    y={z.y}
                    width={z.w}
                    height={z.h}
                    rx={6}
                    className={cn(on ? 'fill-glacier/15 stroke-glacier' : 'fill-paper-2/70 stroke-hair-2')}
                    strokeWidth={on ? 1.6 : 1}
                    strokeDasharray={on ? undefined : '3 3'}
                  />
                ) : null}
                {size === 'sm' && on ? (
                  <>
                    <rect x={z.x + 8} y={z.y + z.h / 2 - 2.5} width={z.w * 0.34} height={5} rx={2.5} className="fill-ink-3/45" />
                    <rect x={z.x + z.w - 8 - z.w * 0.3} y={z.y + z.h / 2 - 4} width={z.w * 0.3} height={8} rx={3} className="fill-glacier" />
                  </>
                ) : (
                  bars(z, `z${n}`)
                )}
                {size === 'lg' ? (
                  <g transform={`translate(${z.x + z.w - 2} ${z.y - 2})`}>
                    <circle r="9" className={cn(on ? 'fill-glacier' : 'fill-ink')} />
                    <text textAnchor="middle" dy="3.6" className="fill-paper font-sans text-[10.5px] font-semibold">
                      {n}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
    </svg>
  );
}
