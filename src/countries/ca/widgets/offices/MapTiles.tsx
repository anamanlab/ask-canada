'use client';
/**
 * The basemap's tiles for one view: the base layer, then the label overlay in the UI language.
 * After a zoom change the previous zoom's base tiles (only those already loaded, scaled to the new view) stay
 * underneath until every tile of the new zoom has arrived, so the streets never blink out. The previous
 * zoom's labels are not kept: scaled up they would be blurry, oversized place names. The new labels fade in
 * together once they have all arrived. A tile that fails is asked for once more;
 * if it fails again it is left out, and the previous zoom keeps showing through, or the paper background.
 * Tiles are `next/image` with `unoptimized`: already small, cacheable PNGs from the tile route, placed by hand.
 * `holes` (the pins and the "you" dot) dim the labels around each marker with a long, soft falloff: a place
 * name next to a pin goes quiet as a whole word instead of being cut off mid-word. The same mask fades the
 * labels out at the map's edges, where the frame would otherwise cut a name in half.
 */
import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import { TILE, tilesFor, type MapTile, type View } from './mapLayout';

/** Previous-zoom tiles are only worth scaling across a step or two. */
const GHOST_STEPS = 2;
const NONE: ReadonlySet<string> = new Set();
/** Labels are invisible under the marker (`clear`, px) and come back gradually, full strength at `full`. */
const HOLE = { clear: 15, full: 96 };

export type Hole = { x: number; y: number };

/** Labels dissolve over this many px at the map's edges, so a place name the frame cuts through fades out instead of ending mid-letter. */
const EDGE_FADE = 14;
const EDGES = ['to right', 'to bottom'].map((to) => `linear-gradient(${to}, transparent, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), transparent)`);

/** The label layer's mask: the two edge fades, and one layer per hole that is opaque except around its marker; all intersected. */
function labelMask(holes: Hole[]): CSSProperties {
  const image = [...EDGES, ...holes.map((p) => `radial-gradient(circle at ${Math.round(p.x)}px ${Math.round(p.y)}px, transparent ${HOLE.clear}px, rgb(0 0 0 / 0.38) ${HOLE.clear + 12}px, black ${HOLE.full}px)`)].join(', ');
  return { maskImage: image, WebkitMaskImage: image, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' };
}

export function MapTiles({ layers, view, w, h, holes }: { layers: string[]; view: View; w: number; h: number; holes: Hole[] }) {
  const [loaded, setLoaded] = useState(NONE);
  const [retried, setRetried] = useState(NONE);
  const [failed, setFailed] = useState(NONE);
  const [zoom, setZoom] = useState<{ z: number; from: number | null }>({ z: view.z, from: null });
  if (zoom.z !== view.z) setZoom({ z: view.z, from: Math.abs(view.z - zoom.z) <= GHOST_STEPS ? zoom.z : null });

  const tiles = tilesFor(layers, view, w, h);
  const k = zoom.from === null ? 1 : 2 ** (view.z - zoom.from);
  const ghosts = zoom.from === null ? [] : tilesFor(layers, { z: zoom.from, cx: view.cx / k, cy: view.cy / k }, w / k, h / k).filter((t) => loaded.has(t.src));
  const ready = (layer: number) => tiles.every((t) => t.layer !== layer || loaded.has(t.src));
  // The new zoom is complete: the previous one can go.
  if (zoom.from !== null && zoom.z === view.z && tiles.every((t) => loaded.has(t.src))) setZoom({ z: zoom.z, from: null });
  const add = (src: string) => (set: ReadonlySet<string>) => (set.has(src) ? set : new Set(set).add(src));

  const img = (t: MapTile, ghost: boolean) =>
    failed.has(t.src) ? null : (
      <Image
        key={`${ghost ? 'g' : 't'}:${t.key}${retried.has(t.src) ? ':r' : ''}`}
        alt=""
        unoptimized
        loading="eager"
        draggable={false}
        referrerPolicy="no-referrer"
        src={t.src}
        width={TILE}
        height={TILE}
        onLoad={ghost ? undefined : () => setLoaded(add(t.src))}
        // Once more (a transient upstream error); after that the tile is left out and the layer underneath shows.
        onError={() => (ghost || retried.has(t.src) ? setFailed(add(t.src)) : setRetried(add(t.src)))}
        className={cn('absolute max-w-none', t.layer > 0 && 'opacity-80')}
        style={ghost ? { left: t.left * k, top: t.top * k, width: TILE * k, height: TILE * k } : { left: t.left, top: t.top, width: TILE, height: TILE }}
      />
    );

  return (
    <>
      {layers.map((key, layer) => {
        // Still arriving after a zoom: the base layer keeps the previous zoom underneath, the labels wait.
        const waiting = zoom.from !== null && !ready(layer);
        return (
          <div key={key} className="absolute inset-0" style={layer > 0 ? labelMask(holes) : undefined}>
            {waiting && layer === 0 ? ghosts.filter((t) => t.layer === 0).map((t) => img(t, true)) : null}
            {/* Labels come in whole; base tiles simply cover the previous zoom as they arrive. */}
            <div className={cn('absolute inset-0', layer > 0 && 'transition-opacity duration-300 motion-reduce:transition-none', waiting && layer > 0 && 'opacity-0 duration-0')}>
              {tiles.filter((t) => t.layer === layer).map((t) => img(t, false))}
            </div>
          </div>
        );
      })}
    </>
  );
}
