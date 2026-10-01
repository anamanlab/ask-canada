/**
 * An aurora: the pack's artwork as its three ribbons (see `ribbons` in art.ts), stacked in a frame that
 * matches the combined file's cover crop, each drifting on its own clock in CSS. Only transforms animate, so
 * the compositor moves them without repainting anything (the combined file animates inside the image, which
 * re-rasterizes its blurred ribbons every frame). The block pauses while it is off-screen.
 *
 * `dark`: a night aurora shown instead under the dark theme (`.has-dark`). The ribbons are lazy images, so
 * only the theme on screen is fetched, and only once the block nears the viewport. They are plain `<img>`s:
 * the files are prebuilt SVGs with nothing for next/image to optimise, and its client runtime would ride in
 * the landing's first load for them alone. `priority`: an aurora
 * above the fold, painted as backgrounds instead: the theme on screen is fetched at once (the hidden set
 * never is), and the page preloads it from the <head> (see Hero).
 */
import { Animated } from './Animated';
import { ribbons } from './art';

function Ribbons({ src, dark, priority }: { src: string; dark?: boolean; priority?: boolean }) {
  return (
    <div className={dark ? 'l-ribbons l-ribbons--dark' : 'l-ribbons'}>
      {ribbons(src).map(({ n, src: file }) =>
        priority ? (
          <div key={n} className={`l-ribbon l-ribbon--${n}`} style={{ backgroundImage: `url(${file})` }} />
        ) : (
          <img key={n} className={`l-ribbon l-ribbon--${n}`} src={file} alt="" width={1680} height={600} loading="lazy" decoding="async" />
        ),
      )}
    </div>
  );
}

export function Aurora({ src, dark, priority, className = 'l-aurora' }: { src: string; dark?: string; priority?: boolean; className?: string }) {
  return (
    <Animated className={dark ? `${className} has-dark` : className} aria-hidden>
      <Ribbons src={src} priority={priority} />
      {dark ? <Ribbons src={dark} dark priority={priority} /> : null}
    </Animated>
  );
}
