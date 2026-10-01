/** Sky glyphs: one Lucide icon per sky family (with night versions), tinted per theme. */
import { createElement, type ComponentType } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Cloudy, Haze, Moon, Snowflake, Sun, Tornado, Wind } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Sky } from './types';

type Glyph = ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;

/** Drifting smoke (Lucide has no smoke glyph): three soft plumes in Lucide's stroke style. */
function SmokeGlyph({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7c1.6-1.6 3.4-1.6 5 0s3.4 1.6 5 0 3.4-1.6 5 0" />
      <path d="M5 12c1.6-1.6 3.4-1.6 5 0s3.4 1.6 5 0 3.4-1.6 5 0" />
      <path d="M3 17c1.6-1.6 3.4-1.6 5 0s3.4 1.6 5 0 3.4-1.6 5 0" />
    </svg>
  );
}

const DAY: Record<Sky, Glyph> = {
  clear: Sun,
  'mostly-clear': Sun,
  'partly-cloudy': CloudSun,
  'mostly-cloudy': Cloudy,
  cloudy: Cloud,
  drizzle: CloudDrizzle,
  showers: CloudRain,
  rain: CloudRain,
  freezing: CloudHail,
  mixed: CloudSnow,
  flurries: CloudSnow,
  snow: Snowflake,
  'blowing-snow': Snowflake,
  thunder: CloudLightning,
  hail: CloudHail,
  fog: CloudFog,
  haze: Haze,
  smoke: SmokeGlyph,
  dust: Haze,
  wind: Wind,
  tornado: Tornado,
};
const NIGHT: Partial<Record<Sky, Glyph>> = { clear: Moon, 'mostly-clear': Moon, 'partly-cloudy': CloudMoon };

const skyIcon = (sky: Sky, night = false): Glyph => (night && NIGHT[sky]) || DAY[sky];

/** Accent colour for a sky glyph (sun gold, rain glacier, storm violet…), tuned per theme. */
function skyTint(sky: Sky, night = false) {
  if (night && (sky === 'clear' || sky === 'mostly-clear' || sky === 'partly-cloudy')) return 'text-[var(--wx-moon)]';
  switch (sky) {
    case 'clear':
    case 'mostly-clear':
    case 'partly-cloudy':
      return 'text-[var(--wx-sun)]';
    case 'drizzle':
    case 'showers':
    case 'rain':
    case 'freezing':
    case 'hail':
      return 'text-glacier';
    case 'thunder':
    case 'tornado':
      return 'text-[var(--wx-storm)]';
    case 'snow':
    case 'flurries':
    case 'mixed':
    case 'blowing-snow':
      return 'text-[var(--wx-snow)]';
    case 'smoke':
    case 'haze':
    case 'dust':
      return 'text-amber';
    default:
      return 'text-ink-3';
  }
}

/** The glyph for a sky, tinted from the --wx-* tokens (the shell renders <WxTokens /> once). */
export function SkyIcon({ sky, night, className, tint = true }: { sky: Sky; night?: boolean; className?: string; tint?: boolean }) {
  // Picked from a static table (not created during render).
  return createElement(skyIcon(sky, night), { className: cn('shrink-0', tint && skyTint(sky, night), className), strokeWidth: 1.7, 'aria-hidden': true });
}
