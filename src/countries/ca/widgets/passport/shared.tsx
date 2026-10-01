'use client';
/** Small pieces shared by the planner's parts: date/number typography, the answer card and its washes. */
import { Fragment, type ReactNode } from 'react';

/**
 * Warn notices on the dark theme: a faint amber tint over the card with a hairline amber edge, so the banner
 * reads as a tinted card (the token wash goes flat grey there, and a heavier mix turns brown on navy).
 */
export const WARN_DARK = 'dark:bg-[color-mix(in_oklab,var(--amber)_14%,var(--card))] dark:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--amber)_40%,transparent)]';

/**
 * The room one canada.ca service notice takes, on phones and on wide columns: the size of the notice the page
 * carries most of the year (a title, a sentence, two list items, the source line), which runs longer in
 * French. What the page will say can't be known before it is read, so this is the one height the loading
 * state reserves by convention: it holds this room, and a notice block is never shorter, so the plan below
 * a notice of the usual size doesn't move when it arrives.
 */
export const NOTICE_SLOT = { en: 'min-h-[264px] @xl:min-h-[186px]', fr: 'min-h-[384px] @xl:min-h-[206px]' };

/** The answer card at the top of the planner, and its washes. */
export const CARD = 'relative mx-3 overflow-hidden rounded-card border px-5 py-5 sm:mx-4';
export const PINE =
  'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--a-green)_22%,transparent),color-mix(in_oklab,var(--a-teal)_16%,transparent)_45%,color-mix(in_oklab,var(--a-violet)_14%,transparent))]';
export const MAPLE = 'border-maple/20 bg-[linear-gradient(135deg,var(--maple-wash),color-mix(in_oklab,var(--a-rose)_16%,transparent))]';
export const AMBER =
  'border-amber/25 bg-[linear-gradient(135deg,var(--amber-wash),color-mix(in_oklab,var(--a-rose)_12%,transparent))] dark:border-amber/35 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_26%,var(--card)),color-mix(in_oklab,var(--amber)_10%,var(--card)))]';
export const HEADING = "m-0 text-balance font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]";

/**
 * Keep dates and form numbers on one line ("Oct 22", "PPTC 054"); French writes the first of a month "1er"
 * (also after a weekday: « jeudi 1er octobre »).
 */
export const nb = (s: string) =>
  s.replace(/(^|\s)1 (?=(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc))/, (_m, pre: string) => `${pre}1er `).replace(/ /g, '\u00a0');

/**
 * A date written with its weekday ("Friday, October 2", « vendredi 2 octobre »): the day and month stay
 * together and the line may break after the weekday, so a long date never leaves a short ragged line.
 */
export const nbAfterWeekday = (s: string) => nb(s).replace('\u00a0', ' ');

/**
 * Canada.ca French sets the ordinal of the first of a month as a superscript (« le 1ᵉʳ octobre »). `nb` writes
 * it as plain "1er"; this raises the "er" wherever the text is shown (a real <sup>, so any font can draw it).
 * `isolate` and `isolateItem` do it for every line they wrap; call it directly for a bare date (a Stat value).
 */
export function ordinal(s: ReactNode): ReactNode {
  if (typeof s !== 'string') return s;
  const parts = s.split(/\b1er\b/);
  if (parts.length === 1) return s;
  return parts.map((part, i) => (
    // The pieces of one sentence, in order: their position is their identity.
    <Fragment key={i}>
      {i ? (
        <>
          1<sup className="text-[.62em]">er</sup>
        </>
      ) : null}
      {part}
    </Fragment>
  ));
}

/** The short label below the `@md` container width, the full one above (only the visible one is read out). */
export function Fit({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span className="whitespace-nowrap @md:hidden">{short}</span>
      <span className="hidden @md:inline">{full}</span>
    </>
  );
}

/**
 * A line of text keeps its own direction on a right-to-left page: until a locale ships, Arabic, Farsi and Urdu
 * readers see the English fallback, and without isolation a leading number or a closing full stop or question
 * mark jumps to the other end ("year adult passport-10", "?Can you renew"). The block around it still follows
 * the page, so the text stays aligned with the mirrored layout. Wrap a whole line, not its pieces: two
 * isolated sentences side by side would swap places.
 */
export const isolate = (s: ReactNode) => <bdi>{ordinal(s)}</bdi>;

/**
 * The same for a line that is a flex or grid item (text beside an icon or a bullet): the item stays in the
 * layout's direction, so a wrapped line keeps the mirrored alignment, and the text inside it is isolated.
 */
export const isolateItem = (s: ReactNode) => (
  <span className="min-w-0">
    <bdi>{ordinal(s)}</bdi>
  </span>
);

/**
 * A Notice whose bold lead and body run on as one line of text: passed as the Notice's children in a single
 * isolate (as two, a right-to-left page would put the body before the lead).
 */
export const leadAndBody = (lead: ReactNode, body?: ReactNode) => (
  <bdi>
    <strong className="font-semibold text-ink">{lead}</strong>
    {body ? <> {body}</> : null}
  </bdi>
);

/**
 * A formatted date that opens a line or stands as a title: French months are lowercase (« mars 2027 »), and a
 * title starts with a capital like its neighbours (« Aujourd’hui », « Reçu vers le 5 nov. »).
 */
export const sentenceCase = (s: string, locale: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/**
 * Callback ref for a part that replaces the control the person just used ("Change expiry month" swaps the timeline
 * for the month picker, and back): focus moves to it as it mounts, so keyboard and screen-reader users carry
 * on from there. `ref={moved ? focusOnMount : undefined}`.
 */
export const focusOnMount = (el: HTMLElement | null) => el?.focus();
