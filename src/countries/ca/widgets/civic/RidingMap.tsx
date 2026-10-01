'use client';
/**
 * The riding on a real map: its outline (pre-projected on the server) laid over the country pack's basemap
 * (Canada: Natural Resources Canada CBMT, through our own /tiles route), fitted to the riding, with a pin on
 * the postal code, a scale bar and the map credit. Outside the riding the map is dimmed, so the boundary reads
 * against the streets and water around it. A picture, not a control: pair it with the riding's name in text.
 * Without `shape.bounds` (or when tiles can't load) the outline stands alone on the dotted paper.
 */
import { useId, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { mapTiles } from '@/countries/active.map';
import { cn } from '@/lib/cn';
import { useElementSize, useResolvedTheme } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { layerKeys } from '@/lib/map/tiles';
import { frameRiding, scaleBar } from './mapFrame';
import { CardLink } from './shared';
import type { RidingShape } from './types';

/** Light softening always; the dark filter only when the pack has no dark tiles (then it derives dark mode). */
const FILTER_VARS = {
  '--rm-filter': mapTiles.filter?.light ?? 'none',
  '--rm-filter-dark': mapTiles.base.dark ? (mapTiles.filter?.light ?? 'none') : (mapTiles.filter?.dark ?? 'none'),
} as CSSProperties;

/** The scale bar never grows past this, so it shares the bottom edge with the map credit on a narrow map. */
const SCALE_MAX_PX = 48;
/** A pin this close to the top edge shows its tag below the dot instead of above. */
const TAG_ROOM = 44;

export function RidingMap({ shape, label, here, className }: { shape: RidingShape; label: string; here: string; className?: string }) {
  const reduce = useReducedMotion();
  const { locale, fmt } = useLocale();
  const maskId = useId();
  // Only packs with dedicated dark tiles need the theme in JS; filters follow `dark:` in CSS.
  const dark = useResolvedTheme() === 'dark' && Boolean(mapTiles.base.dark);
  const [ref, size] = useElementSize<HTMLDivElement>();
  const frame = size.w > 0 && size.h > 0 ? frameRiding(shape, size.w, size.h, layerKeys(locale, dark)) : null;
  const pin = frame && shape.pin ? { x: frame.x + shape.pin[0] * frame.k, y: frame.y + shape.pin[1] * frame.k } : null;
  const scale = frame?.metresPerPx ? scaleBar(frame.metresPerPx, SCALE_MAX_PX) : null;
  const outline = frame ? `translate(${frame.x} ${frame.y}) scale(${frame.k})` : undefined;

  return (
    <figure
      dir="ltr"
      className={cn(
        'relative m-0 overflow-hidden rounded-tile border border-hair bg-paper-2 bg-[radial-gradient(var(--hair-2)_1px,transparent_1.2px)] [background-size:12px_12px]',
        className,
      )}
    >
      <div ref={ref} role="img" aria-label={label} className="absolute inset-0">
        {frame ? (
          <>
            <div aria-hidden className="absolute inset-0 [filter:var(--rm-filter)] dark:[filter:var(--rm-filter-dark)]" style={FILTER_VARS}>
              {frame.tiles.map((tl) => (
                <div
                  key={tl.key}
                  className={cn('absolute bg-cover bg-no-repeat', tl.layer > 0 && 'opacity-85')}
                  style={{ left: tl.left, top: tl.top, width: tl.width, height: tl.height, zIndex: tl.layer, backgroundImage: `url("${tl.src}")` }}
                />
              ))}
            </div>
            <svg aria-hidden viewBox={`0 0 ${size.w} ${size.h}`} className="absolute inset-0 size-full">
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={size.w} height={size.h}>
                  <rect width={size.w} height={size.h} fill="white" />
                  <path d={shape.d} fillRule="evenodd" transform={outline} fill="black" />
                </mask>
              </defs>
              {frame.tiles.length ? <rect width={size.w} height={size.h} mask={`url(#${maskId})`} className="fill-paper/60" /> : null}
              <g transform={outline}>
                {/* A paper halo keeps the boundary legible where it runs along a road or a shoreline. */}
                <path d={shape.d} fill="none" className="stroke-paper/80" strokeWidth={5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <motion.path
                  d={shape.d}
                  fillRule="evenodd"
                  className={cn('stroke-maple', frame.tiles.length ? 'fill-maple/10' : 'fill-maple-wash')}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={reduce ? false : { pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </g>
              {pin ? (
                <g transform={`translate(${pin.x} ${pin.y})`}>
                  {reduce ? null : (
                    <motion.circle
                      r={7}
                      className="fill-maple/30"
                      initial={{ scale: 0.6, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.9 }}
                    />
                  )}
                  <circle r={6} className="fill-card stroke-maple" strokeWidth={2.4} />
                  <circle r={2.6} className="fill-maple" />
                </g>
              ) : null}
            </svg>
            {pin ? (
              <span
                aria-hidden
                className="absolute rounded-full bg-ink px-2 py-0.5 font-mono text-[10.5px] font-medium uppercase leading-[1.5] tracking-[.08em] text-paper shadow-sm"
                style={{ left: pin.x, top: pin.y, transform: pin.y < TAG_ROOM ? 'translate(-50%, 12px)' : 'translate(-50%, calc(-100% - 12px))' }}
              >
                {here}
              </span>
            ) : null}
            {scale ? (
              <span aria-hidden className="absolute bottom-1.5 start-2 flex flex-col items-start gap-0.5 font-mono text-[10px] font-medium leading-none text-ink [text-shadow:0_0_3px_var(--paper),0_0_3px_var(--paper)]">
                {fmt.number(scale.metres >= 1000 ? scale.metres / 1000 : scale.metres, { style: 'unit', unit: scale.metres >= 1000 ? 'kilometer' : 'meter', unitDisplay: 'short' })}
                <span className="h-[5px] border-x-[1.5px] border-b-[1.5px] border-ink" style={{ width: scale.px }} />
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      {frame?.tiles.length ? (
        <figcaption className="absolute bottom-0 end-0 m-0 rounded-ss-[8px] bg-card/85 px-1.5 py-0.5 text-[10px] leading-[1.4] text-ink-2">
          <CardLink href={mapTiles.attribution.href[locale] ?? mapTiles.attribution.href.en} className="text-inherit hover:underline">
            {mapTiles.attribution.label[locale] ?? mapTiles.attribution.label.en}
          </CardLink>
        </figcaption>
      ) : null}
    </figure>
  );
}
