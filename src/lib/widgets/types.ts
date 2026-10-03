/**
 * The widget contract (core). Read docs/WIDGET_GUIDE.md for the full walkthrough.
 *
 * A widget is a React component that renders one AI SDK tool part:
 *   message.parts[i] = { type: 'tool-passportPlanner', toolCallId, state, input, output, errorText }
 *
 * Tool names MUST start with the widget's prefix (camelCase of the widget id, e.g. `passport` ->
 * `passportPlanner`, `life-events` -> `lifeEventsChecklist`). That is how the chat finds your
 * renderer without loading every widget up front.
 */
import type { ComponentType, ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';

export type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/** Structural subset of the AI SDK `ToolUIPart` that widgets receive. */
export type WidgetPart<I = unknown, O = unknown> = {
  type: `tool-${string}`;
  toolCallId: string;
  state: ToolPartState;
  /** Partial while streaming (`input-streaming`), complete afterwards. */
  input?: I extends object ? Partial<I> | I : I;
  output?: O;
  errorText?: string;
};

export type WidgetProps<I = unknown, O = unknown> = {
  part: WidgetPart<I, O>;
  locale: Locale;
};

/**
 * A renderer for any tool. Each widget types its own input and output; `never` here is the one props type
 * all of them accept, so the registry holds them without `any` (the chat casts the part where it renders).
 */
export type WidgetRenderer = ComponentType<WidgetProps<never, never>>;
export type Renderers = Record<string, WidgetRenderer>;

/** What `widgets/<id>/index.tsx` exports (named `renderers` and/or default). */
export type WidgetModule = { renderers?: Renderers; default?: Renderers };

/** A localized string: English required, other locales optional (falls back to English). */
export type LocalizedText = Partial<Record<Locale, string>> & { en: string };

/**
 * A tool's header, known before the widget's code has loaded: the chat's loading skeleton shows the real
 * title and icon from the first frame, so nothing swaps identity or shifts when the widget arrives.
 */
export type WidgetHead = {
  title: LocalizedText;
  subtitle?: LocalizedText;
  /** A Lucide icon (drawn in a tone tile) … */
  icon?: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  tone?: 'maple' | 'pine' | 'glacier' | 'amber';
  /** … or a custom illustration, exactly as the widget draws it. */
  iconNode?: () => ReactNode;
  /** Skeleton rows, matching the widget's own loading state (default 3). */
  rows?: number;
};

export type WidgetEntry = {
  id: string;
  /** Tool-name prefix owned by this widget. */
  prefix: string;
  load: () => Promise<WidgetModule>;
  /** Loading headers by tool name (optional; keep them in step with the widget's own header). */
  heads?: Record<string, WidgetHead>;
  /**
   * Locales the widget's own catalog covers (default `['en', 'fr']`). In any other interface language the
   * widget renders whole in English (text, dates, numbers, left-to-right) rather than half-translated.
   */
  locales?: readonly Locale[];
};

/** Lab fixture: one tool part in one state, rendered in a real message column. */
export type Fixture = {
  name: string;
  toolName: string;
  part: WidgetPart;
  /** Optional note shown in the lab (e.g. "Canada Post disruption banner"). */
  note?: string;
};

export type FixtureModule = { default: Fixture[] };

/** A widget's `messages/index.ts` (the lab reads its `title` key to name the page). */
export type WidgetCatalogModule = { default: Partial<Record<Locale, Record<string, string>>> };

/**
 * Every tool output should carry the official pages it relied on.
 * The chat collects these into the numbered SOURCES list under the answer.
 *
 * The fields past `live` exist so a source can be *audited*, not just linked: which authority
 * published it, which dataset within that authority, when the value was actually fetched, and
 * whether what the person is looking at came straight from the upstream or out of a cache.
 * A live feed that is four minutes stale and a live feed that is four hours stale must not look
 * the same, and neither may look the same as a page we verified last month.
 */
export type ToolSource = {
  title: string;
  url: string;
  /** ISO date we last verified the page (YYYY-MM-DD). */
  checked: string;
  /** ISO date shown as "Page updated" (the page's "Date modified"), when known. */
  updated?: string;
  /** Exact sentence quoted from the page, when useful as proof. */
  quote?: string;
  /** True for live data feeds (weather, advisories, recalls). */
  live?: boolean;
  /** The institution that published this, in its own words ("Banco Central do Brasil"). */
  authority?: string;
  /** ISO timestamp (not date) of the upstream fetch behind a live value. */
  fetchedAt?: string;
  /** The upstream dataset a value came from, when the authority runs several. */
  datasetId?: string;
  /** True when a live value was served from the pack's cache rather than fetched for this call. */
  fromCache?: boolean;
};

/** camelCase of a widget id: `life-events` -> `lifeEvents`. */
export const widgetPrefix = (id: string) => id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Tool name from a part type (`tool-passportPlanner` -> `passportPlanner`). */
export const toolNameOf = (partType: string) => partType.replace(/^tool-/, '');

/** Longest-prefix match of a tool name to a widget entry. */
export function findWidget(entries: readonly WidgetEntry[], toolName: string): WidgetEntry | undefined {
  let best: WidgetEntry | undefined;
  for (const e of entries) {
    if (!toolName.startsWith(e.prefix)) continue;
    const next = toolName.charAt(e.prefix.length);
    if (next && next !== next.toUpperCase()) continue; // must be a word boundary
    if (!best || e.prefix.length > best.prefix.length) best = e;
  }
  return best;
}
