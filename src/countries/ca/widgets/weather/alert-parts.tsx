'use client';
/**
 * Colour-coded alert pieces: the banner (Environment Canada's diamond mark on the official yellow, orange or
 * red), the alert card with its full text, and the colour legend. The banner colours are official data
 * encodings, so they are fixed palette utilities with fixed text colours (near-black on yellow and orange,
 * white on red) and contrast holds in both themes.
 */
import { useId } from 'react';
import { Info } from 'lucide-react';
import { Disclosure, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { AlertColour } from './data';
import { capFirst, useLocalTime } from './format';
import messages from './messages';
import type { Alert } from './types';

export const ALERT_BANNER: Record<AlertColour, string> = {
  yellow: 'bg-yellow-300 text-neutral-950',
  orange: 'bg-orange-400 text-neutral-950',
  red: 'bg-red-700 text-white',
};
const MARK_INK: Record<AlertColour, string> = {
  yellow: '[--wx-mark-ink:var(--color-yellow-300)]',
  orange: '[--wx-mark-ink:var(--color-orange-400)]',
  red: '[--wx-mark-ink:var(--color-red-700)]',
};
export const ALERT_DOT: Record<AlertColour, string> = { yellow: 'bg-yellow-400', orange: 'bg-orange-500', red: 'bg-red-600' };

/** "Yellow advisory – Fog" / "Avis jaune – brouillard". */
export function useAlertTitle() {
  const t = useMessages(messages);
  return (a: { colour: AlertColour | null; type: Alert['type']; hazard: string; name: string }) =>
    a.colour && a.type !== 'other' && a.type !== 'statement'
      ? t('alert.title', { colour: a.colour, type: a.type, hazard: a.hazard, hazardLc: a.hazard.charAt(0).toLowerCase() + a.hazard.slice(1) })
      : a.name;
}

/** Warning-diamond mark used on alert banners (the shape Environment Canada uses). */
export function AlertMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('size-[18px] shrink-0', className)} aria-hidden>
      <path d="M10 1.8 18.2 10 10 18.2 1.8 10Z" fill="currentColor" />
      <path d="M10 5.8v5.3" stroke="var(--wx-mark-ink, white)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="13.9" r="1.15" fill="var(--wx-mark-ink, white)" />
    </svg>
  );
}

/**
 * The coloured title bar of an alert or a group of alerts. Statements and other uncoloured notices get a
 * neutral bar with an info icon. `headingLevel`: 4 directly under the widget title, 5 inside a titled section
 * (the section title is the h4), so heading navigation can tell a section from its alerts.
 */
export function AlertBanner({ colour, title, id, headingLevel = 4 }: { colour: AlertColour | null; title: string; id?: string; headingLevel?: 4 | 5 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-2.5', colour ? [ALERT_BANNER[colour], MARK_INK[colour]] : 'bg-paper-2 text-ink')}>
      {colour ? <AlertMark /> : <Info className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />}
      <Heading id={id} className="m-0 min-w-0 flex-1 text-[15px] font-semibold leading-snug">
        {title}
      </Heading>
    </div>
  );
}

/**
 * The level under an alert's title, for the toggle nested in its card. `Disclosure` renders `h${level}` and
 * types the level as 2 to 5; under an h5 title the toggle is an h6, which the kit's type doesn't list yet, so
 * that one value is narrowed here (the element it renders is a real h6).
 */
export const below = (level: 4 | 5) => (level + 1) as 5;

/**
 * Environment Canada opens some paragraphs of an alert with a short label ("Locations:", "Time span:",
 * "What:", "Régions :"). Splits a paragraph into that label (with its colon) and the rest; no label → ['', p].
 * A label is at most four words and starts with a capital, so an ordinary sentence with a colon is left alone.
 */
function leadLabel(p: string): [string, string] {
  const m = p.match(/^(\p{Lu}[\p{L}\d'’() -]{1,34}?\s?:)(\s+\S[\s\S]*)$/u);
  return m && m[1].trim().split(/\s+/).filter((w) => w !== ':').length <= 4 ? [m[1], m[2]] : ['', p];
}

/**
 * One alert with where, until when, impact and confidence. The official text opens in place (the shared
 * Disclosure), or links to the official report when the feed carries no text.
 */
export function AlertCard({
  alert,
  tz,
  defaultOpen = false,
  className,
  headingLevel = 4,
}: {
  alert: Alert;
  tz: string;
  defaultOpen?: boolean;
  className?: string;
  /** The alert title's level (see `AlertBanner`); its "Full alert text" toggle sits one level below. */
  headingLevel?: 4 | 5;
}) {
  const t = useMessages(messages);
  const title = useAlertTitle();
  const time = useLocalTime(tz);
  const { intl } = useLocale();
  const id = useId();
  const hasBody = alert.text.length > 0;
  return (
    <article className={cn('overflow-hidden rounded-[18px] border border-hair bg-card shadow-sm', className)} aria-labelledby={`${id}-t`}>
      <AlertBanner colour={alert.colour} title={title(alert)} id={`${id}-t`} headingLevel={headingLevel} />
      <div className="px-4 pb-3.5 pt-3">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px] leading-snug">
          {alert.area ? (
            <>
              <dt className="text-ink-3">{t('alert.where')}</dt>
              <dd className="m-0 text-ink">{capFirst(alert.area, intl)}</dd>
            </>
          ) : null}
          {alert.endsAt ? (
            <>
              <dt className="text-ink-3">{t('alert.until')}</dt>
              <dd className="m-0 text-ink">
                <bdi>{time.dayTimeTz(alert.endsAt)}</bdi>
              </dd>
            </>
          ) : alert.issuedAt ? (
            <>
              <dt className="text-ink-3">{t('alert.issued')}</dt>
              <dd className="m-0 text-ink">
                <bdi>{time.dayTimeTz(alert.issuedAt)}</bdi>
              </dd>
            </>
          ) : null}
          {alert.impact ? (
            <>
              <dt className="text-ink-3">{t('alert.impact')}</dt>
              <dd className="m-0 text-ink">{capFirst(alert.impact, intl)}</dd>
            </>
          ) : null}
          {alert.confidence ? (
            <>
              <dt className="text-ink-3">{t('alert.confidence')}</dt>
              <dd className="m-0 text-ink">{capFirst(alert.confidence, intl)}</dd>
            </>
          ) : null}
        </dl>
        {hasBody ? (
          <Disclosure title={t('alert.read')} defaultOpen={defaultOpen} headingLevel={below(headingLevel)} className="-mb-2 mt-3">
            {/* The feed's blank-line paragraphs keep real paragraph spacing, with their lead-in label set apart. */}
            <div className="grid gap-3 pb-2 text-[14px] leading-[1.55] text-ink-2">
              {alert.text.map((p, i) => {
                const [label, rest] = leadLabel(p);
                return (
                  <p key={i} className="m-0">
                    {label ? <strong className="font-semibold text-ink">{label}</strong> : null}
                    {rest}
                  </p>
                );
              })}
            </div>
          </Disclosure>
        ) : alert.url ? (
          <ExternalLink href={alert.url} standalone className="mt-2 text-[14px] underline-offset-4">
            <bdi>{t('alert.readOfficial')}</bdi>
          </ExternalLink>
        ) : null}
      </div>
    </article>
  );
}

/** Least to most serious, as Environment Canada presents them. */
const LEGEND_ORDER: readonly AlertColour[] = ['yellow', 'orange', 'red'];

/** "What the colours mean": the three official colours and how often each is issued, one tap away. */
export function ColourLegend() {
  const t = useMessages(messages);
  return (
    <div className="mx-5 mt-5 sm:mx-6">
      <Disclosure
        lazy
        title={
          <>
            <Info className="size-4 shrink-0 text-ink-3" aria-hidden />
            {t('legend.title')}
          </>
        }
      >
        <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-3">
          {LEGEND_ORDER.map((c) => (
            <li key={c} className="rounded-[14px] border border-hair bg-paper-2 p-3">
              <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] font-semibold', ALERT_BANNER[c])}>{t(`colour.${c}`)}</span>
              <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">{t(`legend.${c}`)}</p>
              <p className="m-0 mt-1 text-[12.5px] text-ink-3">{t(`legend.${c}.freq`)}</p>
            </li>
          ))}
        </ul>
        <p className="m-0 mb-2 mt-3 text-[13px] text-ink-3">{t('legend.always')}</p>
      </Disclosure>
    </div>
  );
}
