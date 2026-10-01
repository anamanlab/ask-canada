'use client';
/**
 * The "now" panel: a sky that matches the conditions (sun glow, cloud, rain, snow, stars, smoke), the
 * temperature set large in the serif, and the day's shape in one line. Decoration is aria-hidden and
 * static when the reader prefers reduced motion. Colours come from the --wx-* tokens: render it inside a shell
 * that has <WxTokens />.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SkyIcon } from './icons';
import type { Sky } from './types';

type Mood = 'sun' | 'soft' | 'grey' | 'rain' | 'snow' | 'smoke' | 'storm' | 'night' | 'night-grey';

function moodOf(sky: Sky, night: boolean): Mood {
  if (sky === 'thunder' || sky === 'tornado' || sky === 'hail') return 'storm';
  if (night) return sky === 'clear' || sky === 'mostly-clear' || sky === 'partly-cloudy' ? 'night' : 'night-grey';
  switch (sky) {
    case 'clear':
    case 'mostly-clear':
      return 'sun';
    case 'partly-cloudy':
      return 'soft';
    case 'drizzle':
    case 'showers':
    case 'rain':
    case 'freezing':
      return 'rain';
    case 'snow':
    case 'flurries':
    case 'mixed':
    case 'blowing-snow':
      return 'snow';
    case 'smoke':
    case 'haze':
    case 'dust':
      return 'smoke';
    default:
      return 'grey';
  }
}

/** Dark moods keep light text (--wx-on-dark) in both themes; the rest use ink (which turns light in dark mode). */
const darkMood = (m: Mood) => m === 'storm' || m === 'night' || m === 'night-grey';
/** Whether this sky's panel is one of the dark ones (for content placed on it, like the insight pill). */
export const darkSky = (sky: Sky, night: boolean) => darkMood(moodOf(sky, night));

/** Sky backgrounds come from the --wx-sky-* tokens (light + dark values defined once in tokens.tsx). */
const BG: Record<Mood, string> = {
  sun: '[background-image:var(--wx-sky-sun)]',
  soft: '[background-image:var(--wx-sky-soft)]',
  grey: '[background-image:var(--wx-sky-grey)]',
  rain: '[background-image:var(--wx-sky-rain)]',
  snow: '[background-image:var(--wx-sky-snow)]',
  smoke: '[background-image:var(--wx-sky-smoke)]',
  storm: '[background-image:var(--wx-sky-storm)]',
  night: '[background-image:var(--wx-sky-night)]',
  'night-grey': '[background-image:var(--wx-sky-night-grey)]',
};

const CSS = `
@keyframes wx-fall{0%{transform:translate3d(0,-40px,0)}100%{transform:translate3d(-14px,360px,0)}}
@keyframes wx-snow{0%{transform:translate3d(0,-20px,0)}50%{transform:translate3d(10px,170px,0)}100%{transform:translate3d(-6px,360px,0)}}
@keyframes wx-twinkle{0%,100%{opacity:.25}50%{opacity:.9}}
@keyframes wx-drift{0%{transform:translateX(0)}100%{transform:translateX(18px)}}
@keyframes wx-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
.wx-drop{animation:wx-fall 1.1s linear infinite}
.wx-flake{animation:wx-snow 6s linear infinite}
.wx-star{animation:wx-twinkle 3.2s ease-in-out infinite}
.wx-drift{animation:wx-drift 9s ease-in-out infinite alternate}
.wx-breathe{animation:wx-breathe 6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.wx-drop,.wx-flake,.wx-star,.wx-drift,.wx-breathe{animation:none}}
`;

// Deterministic "random" positions so server and client render the same sky.
const seq = (n: number, salt: number) => Array.from({ length: n }, (_, i) => ((i * 7919 + salt * 104_729) % 997) / 997);

function Particles({ mood, sky }: { mood: Mood; sky: Sky }) {
  const rain = mood === 'rain' || (mood === 'storm' && sky !== 'tornado') || (mood === 'night-grey' && ['rain', 'showers', 'drizzle', 'freezing'].includes(sky));
  const snow = mood === 'snow' || (mood === 'night-grey' && ['snow', 'flurries', 'mixed', 'blowing-snow'].includes(sky));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [clip-path:inset(0_round_22px)]" aria-hidden>
      {mood === 'sun' || mood === 'soft' ? (
        <span className="wx-breathe absolute -end-16 -top-20 size-64 rounded-full [background-image:var(--wx-glow)]" />
      ) : null}
      {mood === 'smoke' ? (
        <span className="wx-drift absolute -start-10 top-6 h-24 w-[130%] rounded-full [background-image:var(--wx-haze)] blur-md" />
      ) : null}
      {/* Stars, drops and flakes stay clear of the text column: they fade in from mid-panel toward the icon. */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_42%,black_72%)] rtl:[mask-image:linear-gradient(to_left,transparent_42%,black_72%)]">
      {mood === 'night'
        ? seq(18, 3).map((x, i) => (
            <span
              key={i}
              className="wx-star absolute size-[2px] rounded-full bg-(color:--wx-star)"
              style={{ insetInlineStart: `${(x * 100).toFixed(1)}%`, top: `${(seq(18, 11)[i] * 70).toFixed(1)}%`, animationDelay: `${(x * 3).toFixed(2)}s` }}
            />
          ))
        : null}
      {rain
        ? seq(16, 5).map((x, i) => (
            <span
              key={i}
              className={cn(
                'wx-drop absolute -top-8 w-px rotate-[12deg] rounded-full bg-gradient-to-b from-transparent',
                darkMood(mood) ? 'to-(--wx-drop-dark)' : 'to-(--wx-drop-light)',
              )}
              style={{ insetInlineStart: `${(x * 100).toFixed(1)}%`, animationDelay: `${(seq(16, 9)[i] * 1.1).toFixed(2)}s`, animationDuration: `${(0.8 + x * 0.6).toFixed(2)}s`, height: `${12 + Math.round(x * 14)}px` }}
            />
          ))
        : null}
      {snow
        ? seq(16, 7).map((x, i) => (
            <span
              key={i}
              className="wx-flake absolute -top-4 rounded-full bg-(color:--wx-flake) shadow-(--wx-flake-glow)"
              style={{ insetInlineStart: `${(x * 100).toFixed(1)}%`, animationDelay: `${(seq(16, 13)[i] * 6).toFixed(2)}s`, width: `${3 + Math.round(x * 3)}px`, height: `${3 + Math.round(x * 3)}px` }}
            />
          ))
        : null}
      </div>
    </div>
  );
}

export function SkyHero({
  sky,
  night,
  kicker,
  temp,
  condition,
  line,
  footer,
  label,
}: {
  sky: Sky;
  night: boolean;
  kicker: ReactNode;
  temp: ReactNode;
  condition: ReactNode;
  line?: ReactNode;
  footer?: ReactNode;
  /** One sentence for screen readers (the visual panel is decorative-heavy). */
  label: string;
}) {
  const mood = moodOf(sky, night);
  const dark = darkMood(mood);
  return (
    // isolate + clip-path: animated flakes and drops are composited on their own layers, which Chromium does not
    // clip to a border radius with overflow alone; the clip-path keeps them inside the rounded corners.
    <div className={cn('relative isolate mx-3 overflow-hidden rounded-[22px] px-5 pb-5 pt-4 [clip-path:inset(0_round_22px)] sm:mx-4', BG[mood], dark ? 'text-(color:--wx-on-dark)' : 'text-ink')}>
      {/* href + precedence: React hoists the keyframes to <head> once, however many forecasts are on the page. */}
      <style href="wx-sky" precedence="default">
        {CSS}
      </style>
      <Particles mood={mood} sky={sky} />
      <p className="sr-only">{label}</p>
      <div className="relative flex items-start justify-between gap-3" aria-hidden>
        <div className="min-w-0">
          <p className={cn('m-0 text-[13px] font-medium', dark ? 'text-(color:--wx-on-dark-2)' : 'text-ink-2')}>
            <bdi>{kicker}</bdi>
          </p>
          <p className="m-0 mt-3 font-serif text-[72px] leading-[.95] tracking-[-.045em] [font-variation-settings:'opsz'_72] @xl:text-[84px]">{temp}</p>
          <p className="m-0 mt-1 text-[18px] font-medium leading-snug tracking-[-.01em]">
            <bdi>{condition}</bdi>
          </p>
          {/* <bdi> (direction auto): "Wind chill −36° · L −26°" keeps its own order inside an RTL page. */}
          {line ? (
            <p className={cn('m-0 mt-1 text-[14.5px] leading-snug', dark ? 'text-(color:--wx-on-dark-2)' : 'text-ink-2')}>
              <bdi>{line}</bdi>
            </p>
          ) : null}
        </div>
        <SkyIcon sky={sky} night={night} className={cn('mt-3 size-[68px] drop-shadow-sm @xl:size-[84px]', dark && 'text-(color:--wx-on-dark)')} tint={!dark} />
      </div>
      {footer ? <div className="relative mt-4">{footer}</div> : null}
    </div>
  );
}
