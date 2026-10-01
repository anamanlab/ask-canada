/**
 * Shore: the phone hero's own landscape, not a crop of the desktop art. A Shield lake at golden hour (light
 * theme) or under the aurora and a low moon (dark theme): low hills stepping down toward the viewer, valley
 * mist, a far shore, stands of spruce on the near shore with open water between them, and a lake that
 * mirrors it all, with glitter on the path of the sun or the moon (drawn by scripts/build-art.mjs).
 *
 * On phones the question box and the trust line sit on open sky, and the waterline falls below them, so
 * the sun, its path, the canoe and the reeds of the near bank fill the band above the task tiles (see
 * `.l-lake__open` in landing.css). The still scene is a file; what moves on the water (the glitter and the
 * mist) is a set of small layers over it that only change opacity and position, so nothing is repainted.
 */
import type { CSSProperties } from 'react';
import { Aurora } from './Aurora';
import { canoeArt, foreArt, shoreArt } from './art';
import glints from './shore-glints.json';

/**
 * Glitter on the sun's path (or the moon's): short, soft ellipses in a narrow column, each with its own
 * brightness, period and phase, so the glitter never pulses in step. Placed in drawing units (see
 * `.l-shore__fx i`).
 */
const GLINTS = glints.map(({ cx, cy, rx, ry, o, dur, delay }) => ({ '--x': cx, '--y': cy, '--rx': rx, '--ry': ry, '--o': o, animationDuration: `${dur}s`, animationDelay: `${delay}s` }) as CSSProperties);

/**
 * `aurora`: the night aurora artwork. Under the dark theme it is mirrored into the lake, so the ribbon in the
 * sky reaches the water.
 */
export function Shore({ className, aurora }: { className?: string; aurora?: string }) {
  return (
    <div className={className} aria-hidden style={shoreArt}>
      <div className="l-shore__art" />
      <div className="l-shore__fx">
        {GLINTS.map((style, i) => (
          <i key={i} style={style} />
        ))}
        <div className="l-shore__mist" />
      </div>
      {aurora ? <Aurora src={aurora} className="l-shore__aurora" /> : null}
    </div>
  );
}

/**
 * A canoe with two paddlers heading west across the open water, with a short wake and a faint reflection. It
 * starts in the middle of the bay on first paint and drifts slowly west, fading out before the edge and back
 * in where it began (still under reduced motion).
 */
export function ShoreCanoe({ className }: { className?: string }) {
  return <div className={className} aria-hidden style={canoeArt} />;
}

/**
 * The near bank: granite and a stand of reeds in silhouette at the bay's bottom corner, in front of the canoe,
 * mirrored in the water under it, so the lake has a foreground (still; a file, like the scene).
 */
export function ShoreFore({ className }: { className?: string }) {
  return <div className={className} aria-hidden style={foreArt} />;
}
