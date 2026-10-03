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

export type FlagProps = { className?: string; title?: string; style?: React.CSSProperties };

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

/**
 * A travel advisory in the pack's official languages (`{ en, fr }` for Canada, `{ en, pt }` for Brazil);
 * `en` is the source language. Same shape as `Holiday['name']`, which is why that type is defined the
 * same way.
 */
export type LocalizedText = { en: string } & Partial<Record<Locale, string>>;

export type Advisory = {
  country: LocalizedText;
  /** 0 normal precautions · 1 high degree of caution · 2 avoid non-essential travel · 3 avoid all travel */
  level: 0 | 1 | 2 | 3;
  text: LocalizedText;
  updated: string;
  url: LocalizedText;
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
    /**
     * The landing hero's greeting, keyed by locale: the line in the reader's own language comes first and
     * the pack's other official language follows (`Hello, Canada.` / `Bonjour, Canada.`). English is the
     * source language. Omitted falls back to the brand name.
     */
    greeting?: Partial<Record<Locale, string>> & { en: string };
    /** The single word set in the flag's vertical bands — the product's verb, as a person would say it. */
    ask?: Partial<Record<Locale, string>> & { en: string };
    Mark: ComponentType<MarkProps>;
    Flag?: ComponentType<FlagProps>;
    /** Standalone SVG markup of the mark in a given colour (icons, social cards). */
    markSvg: (color: string) => string;
    /** Official mode only: the government signature block rendered in the header slot. */
    OfficialSignature?: ComponentType<{ className?: string }>;
    themeColor: { light: string; dark: string };
    /**
     * The accent colour, overriding core's default (`--maple*`). A pack that does not set it keeps the
     * default red, which is Canada's and reads as Canadian everywhere it appears: the mark, the send
     * button, focus rings, the italic in a lead. `wash` is the tinted background.
     *
     * `dark` is the accent on a dark background, because core's own dark values are tuned for red: a
     * Brazilian green that reads well on paper is too dark on `#141e30`. Omitted, the light values are
     * used in both themes.
     */
    accent?: { base: string; ink: string; wash: string; dark?: { base: string; ink: string; wash: string } };
    /** Accent used for the flag-proportion band and the brand mark. */
    flagColor: string;
    /**
     * Optional diamond (losango) in the flag band's white field, in this colour.
     * A pack whose flag carries a rhombus sets it; a pack without one leaves it
     * unset and the band renders plain. Decorative only, never content.
     */
    flagDiamond?: string;
  /** Currency symbol (e.g. 'R$ ', '$ ') used in the system prompt for example fees. */
  currencySymbol?: string;
  /** Example fee amount as a string (e.g. '257,25') used in the system prompt. */
  exampleFee?: string;
  /** Three-letter ISO currency code (e.g. 'BRL', 'CAD'). */
  currency?: string;
  /** Official home page URL (English) for citation examples. */
  officialHomeUrl?: string;
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
  /**
   * The starter chips across the top of the landing hero. Each id needs `chip.<id>`, `chip.<id>.q` and
   * `chip.<id>.short` in the pack's catalogs; `chip.<id>.sub` and `chip.<id>.official` are optional.
   * `wideOnly` keeps a chip off the phone hero, which shows four. Omitted, the hero shows no chips.
   *
   * `icon` is the glyph in the chip (phones draw it in a tinted square, `tile`; wider layouts leave it
   * inline). Both live here, on the pack, because both are per-country: a chip id core has never heard of
   * must still arrive with its own glyph and hue rather than falling back to a generic globe.
   */
  chips?: { id: string; wideOnly?: boolean; official?: boolean; icon?: LucideIcon; tile?: { light: string; dark: string } }[];
  art: {
    hero: SceneArt;
    night: SceneArt;
    dusk: SceneArt;
  };
  /**
   * The remaining landing artwork, as themed pairs: the phone hero's shore, its mist, the boat on it and the
   * near bank, plus the closing panel's plain. Each key is a name the core CSS already knows (`shore`,
   * `shore-mist`, `shore-canoe`, `shore-fore`, `prairie`), so a pack replaces the drawing without a component
   * changing. Omitted keys fall back to Canada's, which is only ever right for Canada.
   */
  phoneArt?: Record<string, { light: string; dark: string }>;
  /** Country knowledge + tool usage guidance appended to the core system prompt (English). */
  systemPrompt: string;
  /**
   * Optional landing copy that overrides this pack's own `messages` for the keys it names. It lives with
   * the pack because it is the pack's presentation layer: Canada's refined English/French landing wording.
   * A pack with no override (Brazil) simply uses its own catalogs, so no other country's copy can leak in.
   */
  landing?: Partial<Record<Locale, () => Promise<{ default: Messages }>>> & {
    en: () => Promise<{ default: Messages }>;
  };
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
    /**
     * The figures the landing's flag demo shows inside its sample answer card. `amount` and `date` stay
     * numbers so they format per locale; a pack whose demoed thing costs nothing and takes no wait supplies
     * the `*Label` words instead (Brazil's CadÚnico is free and immediate).
     */
    demo?: {
      amount?: number;
      amountLabel?: string;
      unit?: string;
      unitLabel?: string;
      date?: string;
      dateLabel?: string;
    };
    /**
     * The annual personal tax filing deadline the landing counts down to, and the self-employed equivalent.
     * Optional: not every country has one (Brazil's Simples Nacional DAS is monthly and the IRPF due date is
     * re-announced every year), and the landing hides the card when it is absent rather than showing a
     * deadline nobody has verified. `source` is the label shown in the card footer.
     */
    taxDeadline?: { month: number; day: number; selfEmployedMonth: number; selfEmployedDay: number; url: string; source: string };
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
