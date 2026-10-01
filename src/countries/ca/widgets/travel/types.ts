/** Shapes shared by the travel tools (server) and renderers (client). All JSON-serializable. */
import type { ToolSource } from '@/lib/widgets/types';

export type Lang = 'en' | 'fr';

/**
 * Every output carries `sources` in the answer's language (what the chat cites) and, in `sourcesIn`, the
 * same list in both official languages, so a card's footer follows the UI's language without the client
 * needing the source tables. Optional: answers saved before this field existed only have `sources`.
 */
export type SourcesIn = Partial<Record<Lang, ToolSource[]>>;

/** Global Affairs Canada's four risk levels (feed `advisory-state` 0–3 → level 1–4). */
export type RiskLevel = 1 | 2 | 3 | 4;

export type RegionArea = { text: string; except?: string[] };

export type RegionalAdvisory = {
  /** "Baja California Sur and northwestern coast of mainland Mexico" */
  title: string;
  level: RiskLevel;
  /** Official level wording ("Avoid non-essential travel"). */
  levelText: string;
  /** "Avoid non-essential travel to the following areas due to Hurricane Polo" */
  reason: string;
  areas: RegionArea[];
};

export type Office = {
  city: string;
  /** "Embassy of Canada", "Consulate General of Canada", "Consular Agency of Canada"… */
  type: string;
  phone?: string;
  email?: string;
  address?: string;
  lat?: number;
  lng?: number;
  url?: string;
  passportServices: boolean;
};

export type LocalEmergency = {
  /** Main number when the page gives one ("911", "112 or 999"). */
  primary?: string;
  /** The page's own sentence ("Dial 911 for emergency assistance."). */
  lead?: string;
  /** Service-specific numbers ("police: 110"). */
  numbers: { label: string; number: string }[];
};

/** A destination's name in both languages, so a card never mixes languages (e.g. a French feed in an English UI). */
export type Names = Record<Lang, string>;
/** A destination's official page in both languages (travel.gc.ca / voyage.gc.ca), so links follow the UI. */
export type Urls = Record<Lang, string>;

export type CountryAdvisory = {
  iso: string;
  name: string;
  names?: Names;
  urls?: Urls;
  level: RiskLevel;
  /** Official national advisory wording for this language. */
  levelText: string;
  /** The national advisory sentence ("Exercise a high degree of caution in Mexico due to …"). */
  summary: string;
  /** Further paragraphs of the national advisory (what it means for you), in order. */
  points: string[];
  regions: RegionalAdvisory[];
  /** Last update, ISO with offset (e.g. 2026-09-29T14:42:49-04:00). */
  updated: string;
  /** What changed in the last update ("Natural disasters and climate section – updated …"). */
  change?: string;
  entry: {
    /** "Your passport must be valid for the expected duration of your stay in Mexico." */
    passport?: string;
    visas: { label: string; value: string }[];
    /** Notices the official page puts above the passport rules (an outbreak's entry restrictions, ETIAS), word for word. */
    notices?: EntryNotice[];
  };
  help: {
    emergency: LocalEmergency;
    /** Toll-free number to the Emergency Watch and Response Centre from this country, if any. */
    tollFree?: string;
    offices: Office[];
  };
  url: string;
  /**
   * The same prose in the other official language. The feed publishes every destination in English and
   * French, so a card follows the UI's language even when the question (and so the tool) used the other.
   */
  prose?: Partial<Record<Lang, AdvisoryProse>>;
};

/** `more`: the official notice continues past the paragraphs kept here. */
export type EntryNotice = { title?: string; body: string[]; more?: boolean };

/** The feed's own words for one language: everything on the card that isn't our interface. */
export type AdvisoryProse = Pick<CountryAdvisory, 'summary' | 'points' | 'regions' | 'change' | 'entry' | 'help'>;

export type AdvisoryOutput =
  | {
      kind: 'advisory';
      lang: Lang;
      live: true;
      focus: AdvisoryFocus;
      /** When the feed was generated (ISO). */
      fetchedAt: string;
      country: CountryAdvisory;
      sources: ToolSource[];
      sourcesIn?: SourcesIn;
    }
  | {
      /** Feed unreachable: official link only. */
      kind: 'offline';
      lang: Lang;
      live: false;
      focus: AdvisoryFocus;
      country?: { iso: string; name: string; names?: Names; urls?: Urls; url: string };
      sources: ToolSource[];
      sourcesIn?: SourcesIn;
    }
  | {
      /** No destination given ("How do I register my trip?"): registration first, then pick a destination. */
      kind: 'start';
      lang: Lang;
      live: false;
      focus: AdvisoryFocus;
      suggestions: { iso: string; name: string; names?: Names }[];
      sources: ToolSource[];
      sourcesIn?: SourcesIn;
    }
  | {
      kind: 'not-found';
      lang: Lang;
      live: false;
      focus: AdvisoryFocus;
      query: string;
      suggestions: { iso: string; name: string; names?: Names }[];
      sources: ToolSource[];
      sourcesIn?: SourcesIn;
    };

export type AdvisoryFocus = 'safety' | 'entry' | 'help' | 'prepare';

/* ---------- Duty-free (personal exemptions) ---------- */

export type AbsenceTier = 'under24' | 'h24' | 'h48' | 'd7';

export type ExemptionInput = {
  tier: AbsenceTier;
  /** Value of goods bought or received abroad, in Canadian dollars. */
  spent: number;
  alcohol: boolean;
  tobacco: boolean;
};

export type ExemptionResult = ExemptionInput & {
  /** Personal exemption for this absence, CAN$ (0 under 24 hours). */
  allowance: number;
  /** Value on which duty and taxes apply (the whole amount on a 24-hour trip over $200). */
  dutiable: number;
  /** 'free' | 'over' (48 h+: only the excess) | 'cliff' (24 h: all of it) | 'none' (same-day) */
  outcome: 'free' | 'over' | 'cliff' | 'none';
  /** Alcohol/tobacco can be included in the exemption (48 hours or more). */
  alcoholTobaccoIncluded: boolean;
  /** Goods other than alcohol and tobacco may follow by mail or courier (7 days or more). */
  canShipLater: boolean;
};

export type DutyFreeOutput = {
  lang: Lang;
  result: ExemptionResult;
  sources: ToolSource[];
  sourcesIn?: SourcesIn;
};

/* ---------- Border wait times ---------- */

export type Province = 'NB' | 'QC' | 'ON' | 'MB' | 'SK' | 'AB' | 'BC';

/** Minutes, or null when the lane doesn't apply ("Not Applicable") or isn't reported. */
export type Wait = { minutes: number | null; label: 'none' | 'minutes' | 'na' | 'closed' | 'unknown' };

export type Crossing = {
  id: string;
  /** CBSA's office name in the answer's language. */
  name: string;
  /** The same name in both official languages (CBSA publishes an English and a French CSV), so a row follows the UI. */
  names?: Names;
  /** "Fort Erie, ON/Buffalo, NY" split into both sides. */
  canada: string;
  us: string;
  province: Province | null;
  /** As published, local time with zone ("2026-09-30 06:40 EDT"). */
  updated: string;
  travellers: Wait;
  commercial: Wait;
};

export type BorderWaitsOutput =
  | {
      live: true;
      lang: Lang;
      /** When the tool read the feed (ISO): the reference for "updated 4 min ago" until the reader's clock takes over. */
      asOf?: string;
      /** A saved snapshot shown at its own moment (lab fixtures): the board's clock stays at `asOf`. */
      pinned?: boolean;
      province: Province | null;
      /** Crossing matched by name, highlighted first. */
      highlight: string | null;
      crossings: Crossing[];
      /**
       * From the CBSA wait-times page, in the answer's language. `crossing` is the id it names, or "" when it
       * applies to all. `text` is the same notice in both official languages when CBSA's two pages carry it.
       */
      notices: { id: string; crossing: string; title: string; body: string; text?: Record<Lang, { title: string; body: string }> }[];
      sources: ToolSource[];
      sourcesIn?: SourcesIn;
    }
  | { live: false; lang: Lang; province: Province | null; highlight: string | null; crossings: []; notices: []; sources: ToolSource[]; sourcesIn?: SourcesIn };

/* ---------- Emergency help abroad ---------- */

export type EmergencyOutput = {
  lang: Lang;
  /** Present when a destination was named and the live feed answered. */
  country: null | {
    iso: string;
    name: string;
    names?: Names;
    urls?: Urls;
    url: string;
    emergency: LocalEmergency;
    tollFree?: string;
    offices: Office[];
    /** Numbers' labels and offices in the other official language (see CountryAdvisory.prose). */
    prose?: Partial<Record<Lang, CountryAdvisory['help']>>;
  };
  /** A destination was named but its details couldn't be loaded (or wasn't recognised). */
  countryMissing: null | { query: string; url?: string; names?: Names; urls?: Urls };
  sources: ToolSource[];
  sourcesIn?: SourcesIn;
};
