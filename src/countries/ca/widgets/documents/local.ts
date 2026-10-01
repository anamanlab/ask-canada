/** Small helpers the cards' parts share: the card's language, its sources, its date formats and its live day counts. */
import { diffDays } from '@/lib/dates/business-days';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import type { ToolSource } from '@/lib/widgets/types';
import { countdown, nextOnOrAfter } from './countdown';
import type { Lang } from './data';
import type { ExplainOutput } from './explain';

export const useLang = (): Lang => (useLocale().locale === 'fr' ? 'fr' : 'en');

/**
 * The card's sources in the card's language. The tool answers in the language it was given; if it was called
 * without one (or the card is shown in the other official language), the footer still names the page in the
 * language the card is in, so a French card never cites an English page title.
 */
export function pickSources(data: { lang: Lang; sources: ToolSource[]; altSources?: ToolSource[] }, lang: Lang): ToolSource[] {
  return data.lang === lang ? data.sources : (data.altSources ?? data.sources);
}

/** `auto`: dates in the year of `today` read best without it ("Monday, October 12"); later ones keep it. */
type Year = 'auto' | 'always' | 'never';

/** The card's date formats, in one place. */
export function useDates(today: string) {
  const { fmt } = useLocale();
  const year = (iso: string, y: Year) => (y === 'always' || (y === 'auto' && iso.slice(0, 4) !== today.slice(0, 4)) ? ({ year: 'numeric' } as const) : {});
  return {
    /** "April 30, 2026" */
    long: (iso: string) => fmt.date(iso, { month: 'long', day: 'numeric', year: 'numeric' }),
    /** "Oct 12" / "Oct 12, 2027" */
    short: (iso: string, y: Year = 'auto') => fmt.date(iso, { month: 'short', day: 'numeric', ...year(iso, y) }),
    /** "Monday, October 12" */
    day: (iso: string, y: Year = 'auto') => fmt.date(iso, { weekday: 'long', month: 'long', day: 'numeric', ...year(iso, y) }),
  };
}

/**
 * Status badges hold words that can start with a capital accent ("Échue depuis 12 jours"). The core badge
 * sets its line box to the font size and truncates, which clips the accent: give the line room for it.
 */
export const BADGE_TEXT = 'leading-[1.25] py-[3px]';

/** Labels that read as the start of a sentence: "Send your documents by" + date. */
export const LEADS_INTO_DATE = /(\bby|\bbefore|\bon|\bexpires?|\bdue|\bpar|\bavant|\bexpire|\bd’ici le|\bd'ici le|\bau plus tard le|\ble)$/i;

/**
 * The tool's answer, re-dated to the reader's own "today": every day count and status, the next payment and
 * the date the verdict leads with. The tool computed them for the moment it ran; a conversation reopened from
 * history a week later must not still say "12 days left" or offer a reminder for a date that has passed.
 */
export function useLiveDates(data: ExplainOutput): ExplainOutput {
  const today = useToday(data.today, { pinned: data.pinned });
  if (today === data.today) return data;
  const deadlines = data.deadlines.map((d) => ({ ...d, ...countdown(today, d.date, d.onTimeBy) }));
  const p = data.nextPayment;
  const payDate = p ? nextOnOrAfter(p.upcoming ?? [p.date], today) : null;
  const nextPayment = p && payDate ? { ...p, date: payDate, days: diffDays(today, payDate) } : null;
  // A verdict that leads with a date moves on to the next one still ahead (or stays on the last, as passed).
  const ahead = deadlines.find((d) => d.days >= 0);
  const headline = data.headline.kind === 'deadline' && ahead ? { kind: 'deadline' as const, date: ahead.date } : data.headline;
  return { ...data, today, deadlines, nextPayment, headline };
}
