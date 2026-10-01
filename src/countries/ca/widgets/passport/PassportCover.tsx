/**
 * Small passport-cover illustration used as the planner's icon (navy cover, gold leaf, chip line).
 * Its colours are the widget's own custom properties (--pp-*), each mixed from the design tokens: the cover
 * from ink and glacier, the gold from amber. The tokens flip with the theme (ink turns light), so the dark
 * theme names its own mixes: a cover lifted a step off the dark card, with a gold rim so it still reads as an
 * object.
 */
import { useId } from 'react';
import { LEAF_PATH, LEAF_VIEWBOX } from '../../brand/leaf';

const TOKENS = [
  '[--pp-navy:color-mix(in_oklab,var(--ink)_80%,var(--glacier))] [--pp-navy-deep:var(--ink)] [--pp-spine:var(--ink)]',
  '[--pp-gold:color-mix(in_oklab,var(--amber)_45%,var(--sky-glow))] [--pp-rim:color-mix(in_oklab,var(--card)_16%,transparent)] [--pp-shadow:color-mix(in_oklab,var(--ink)_25%,transparent)]',
  'dark:[--pp-navy:color-mix(in_oklab,var(--glacier)_30%,var(--paper-3))] dark:[--pp-navy-deep:color-mix(in_oklab,var(--glacier)_12%,var(--paper-3))] dark:[--pp-spine:var(--paper-2)]',
  'dark:[--pp-gold:var(--amber)] dark:[--pp-rim:color-mix(in_oklab,var(--amber)_55%,transparent)] dark:[--pp-shadow:color-mix(in_oklab,var(--paper)_80%,transparent)]',
].join(' ');

/**
 * <PassportCover />            the planner's icon (36 x 44)
 * <PassportCover size="lg" />  the answer card's illustration: the same cover, larger, with the fine detail a
 *                              bigger drawing can carry (a tooled border, a sheen across the cloth)
 */
export function PassportCover({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  // A per-instance gradient id: the same glyph appears several times on a page (landing showcase, widget),
  // and a gradient defined inside a hidden copy would leave the visible copies without a fill.
  const id = useId().replace(/[^\w-]/g, '');
  const grad = `pc-cover-${id}`;
  const sheen = `pc-sheen-${id}`;
  const gold = { fill: 'var(--pp-gold)' };
  const lg = size === 'lg';
  return (
    <svg
      width={lg ? 100 : 36}
      height={lg ? 122 : 44}
      viewBox="0 0 36 44"
      aria-hidden
      className={`${lg ? 'drop-shadow-[0_14px_18px_var(--pp-shadow)]' : '-rotate-[4deg] drop-shadow-[0_6px_10px_var(--pp-shadow)]'} ${TOKENS} ${className ?? ''}`}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--pp-navy)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pp-navy-deep)' }} />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0.25" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0" />
          <stop offset="0.5" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0.16" />
          <stop offset="0.75" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="34" height="42" rx={lg ? 3 : 4.5} fill={`url(#${grad})`} style={{ stroke: 'var(--pp-rim)' }} strokeWidth={lg ? 0.5 : 1} />
      {lg ? <rect x="1" y="1" width="34" height="42" rx="3" fill={`url(#${sheen})`} /> : null}
      <rect x="1" y="1" width="3.5" height="42" rx="1.5" style={{ fill: 'var(--pp-spine)' }} opacity=".7" />
      {lg ? <rect x="7" y="4.5" width="25" height="35" rx="1.2" fill="none" style={{ stroke: 'var(--pp-gold)' }} strokeWidth=".35" opacity=".5" /> : null}
      <svg x="10" y="8" width="16" height="16" viewBox={LEAF_VIEWBOX}>
        <path d={LEAF_PATH} style={gold} />
      </svg>
      <rect x="11" y="28" width="14" height="1.6" rx=".8" style={gold} opacity=".85" />
      <rect x="13" y="32" width="10" height="1.2" rx=".6" style={gold} opacity=".55" />
      <rect x="15" y="36" width="6" height="3.4" rx="1" fill="none" style={{ stroke: 'var(--pp-gold)' }} strokeWidth=".9" opacity=".7" />
    </svg>
  );
}
