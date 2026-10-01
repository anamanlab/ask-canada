/**
 * CountryPack: everything country-specific lives behind this type.
 * Core code (app shell, chat, UI kit, AI runtime) reads the active pack through
 * `src/countries/active.ts` and never imports a pack folder directly.
 * See docs/NEW_COUNTRY.md for a walkthrough.
 */
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/format';
import type { Holiday } from '@/lib/dates/business-days';

export type BrandMode = 'independent' | 'official';

export type MarkProps = { className?: string; title?: string };

export type ServiceArea = {
  /** Stable id; strings live in pack messages as `services.<id>.name|desc|starter|example`. */
  id: string;
  icon: LucideIcon;
  /** Show on the landing directory (the Menu always lists every area). */
  featured?: boolean;
};

export type SceneArt = {
  /** Landscape (lake + treeline). The file must contain a `<view id="m">` mobile crop. */
  land: { light: string; dark: string };
  aurora: string;
  auroraDark?: string;
};

export type Advisory = {
  country: { en: string; fr: string };
  /** 0 normal precautions · 1 high degree of caution · 2 avoid non-essential travel · 3 avoid all travel */
  level: 0 | 1 | 2 | 3;
  text: { en: string; fr: string };
  updated: string;
  url: { en: string; fr: string };
};

export type CountryPack = {
  id: string;
  /** ISO 3166-1 alpha-2 region, used for Intl (`fr` + `CA` -> `fr-CA`). */
  region: string;
  currency: string;
  /** Time zone used when a date must be shown without the viewer's zone (e.g. "today"). */
  timeZone: string;
  locales: {
    supported: Locale[];
    /** Official languages: the UI must be at full human-reviewed parity in these. */
    official: Locale[];
    default: Locale;
  };
  brand: {
    mode: BrandMode;
    /** Product name. Kept identical across languages unless messages override `brand.name`. */
    name: string;
    domain: string;
    url: string;
    /** Where people can send feedback or report an accessibility barrier (mailto: or https:). */
    contact?: string;
    /** Public source code repository, if open source. */
    repository?: string;
    Mark: ComponentType<MarkProps>;
    /** Standalone SVG markup of the mark in a given colour (icons, social cards). */
    markSvg: (color: string) => string;
    /** Official mode only: the government signature block rendered in the header slot. */
    OfficialSignature?: ComponentType<{ className?: string }>;
    themeColor: { light: string; dark: string };
    /** Accent used for the flag-proportion band and the brand mark. */
    flagColor: string;
  };
  emergency: {
    /** Police, fire, ambulance. */
    number: string;
    /** Suicide and mental health crisis line (call or text). */
    crisis: string;
    crisisTel: string;
  };
  sources: {
    /** Hostname suffixes considered official. Citations outside this list are flagged. */
    allowlist: string[];
    /** Marquee on the landing page: domains answers are drawn from. */
    showcase: string[];
  };
  /** The official front door, per language (used by "Continue on …" fallbacks). */
  officialHome: Partial<Record<Locale, string>> & { en: string };
  officialHomeLabel: string;
  services: ServiceArea[];
  art: {
    hero: SceneArt;
    night: SceneArt;
    dusk: SceneArt;
  };
  /** Country knowledge + tool usage guidance appended to the core system prompt (English). */
  systemPrompt: string;
  /** Country-level UI strings (hero copy, menu, footer). English is required. */
  messages: Partial<Record<Locale, () => Promise<{ default: Messages }>>> & {
    en: () => Promise<{ default: Messages }>;
  };
  /** Live, dated examples on the landing page. */
  showcase: {
    /** ISO date the pack's static facts were last verified against official pages. */
    factsChecked: string;
    holidays: Holiday[];
    holidaysUrl: string;
    taxDeadline: { month: number; day: number; selfEmployedMonth: number; selfEmployedDay: number; url: string };
    advisory?: () => Promise<Advisory | null>;
    /**
     * The passport product glyph, so the landing page shows the same mark as the live passport widget.
     * Optional: without it the landing falls back to a generic icon tile.
     */
    passportIcon?: ComponentType;
  };
  /** Tools that ground the model but render nothing in the chat. */
  silentTools?: string[];
  /** Widget ids in this pack, in Menu/Lab order. */
  widgetIds: readonly string[];
};

/**
 * MapTiles: the basemap a pack's maps draw on (`src/countries/<cc>/map.ts`, imported through
 * `src/countries/active.map.ts`). Plain data, no React, so the CSP in `src/proxy.ts` can read `hosts`.
 * URL templates use `{z}`, `{x}`, `{y}` and an optional `{s}` (one of `subdomains`).
 */
export type MapTiles = {
  /** Base layer. `dark` is optional: without it, dark mode applies `filter.dark` to the light tiles. */
  base: { light: string; dark?: string };
  /** Optional label overlay per locale; missing locales use `en`. */
  labels?: Partial<Record<Locale, string>> & { en: string };
  subdomains?: string;
  /** Tiles are served at this pixel size; `@2x`-style URLs can still use 256 with `retina: true`. */
  tileSize: 256;
  minZoom: number;
  /** Deepest zoom that actually has tiles (the UI never zooms past it). */
  maxZoom: number;
  /** CSS filters: soften tiles so markers stay loudest, and derive dark mode when there are no dark tiles. */
  filter?: { light?: string; dark?: string };
  /**
   * Serve tiles through our own origin (`/tiles/...`, CDN + data cache) instead of the browser calling the
   * tile host directly. Default `true`: visitors' IPs stay with us and the host sees a fraction of the load.
   * Set `false` when the provider's terms don't allow proxying (e.g. CARTO).
   */
  proxy?: boolean;
  /** `[west, south, east, north]` in degrees. The tile proxy refuses tiles outside it (no upstream call). */
  bounds?: [number, number, number, number];
  /** Upstream origins. Added to the CSP `img-src` only when `proxy` is `false`. */
  hosts: string[];
  attribution: { label: Partial<Record<Locale, string>> & { en: string }; href: Partial<Record<Locale, string>> & { en: string } };
};
