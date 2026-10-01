'use client';
/** Small shared pieces for the offices widget: clock settings, time formatting, status wording, tones. */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { OfficeStatus } from './hours';
import messages from './messages';
import type { FinderOutput, Lang, OfficeKind } from './types';

/** The finder's "open now" clock ticks every 30 s (`useNow(asOf, { tickMs })`: epoch ms, stable between ticks). */
export const CLOCK_TICK_MS = 30_000;

/**
 * `tel:` link for a North American number, with or without its leading 1 ("1-800-622-6232", "613-856-9022").
 * One contract for every phone link in the widget.
 */
export function telHref(number: string) {
  const digits = number.replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

/** Badge text keeps room for accents ("É") instead of the primitive's tight leading. */
export const BADGE_FIT = 'py-[3px] leading-[1.2]';

/** A searched area by name ("M5V", "Moncton, NB"); a shared location has no name. */
export const placeName = (search: FinderOutput | null): string | null => {
  const o = search?.origin;
  return o && o.precision !== 'coords' ? o.label : null;
};

/** The widget's content language for URLs and bilingual data (other locales fall back to English). */
export function useLang(): Lang {
  const { locale } = useLocale();
  return locale === 'fr' ? 'fr' : 'en';
}

/** "8:30 a.m." / "8 h 30" (non-breaking), from local "HH:MM". */
export function useTime() {
  const { intl } = useLocale();
  return (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Intl.DateTimeFormat(intl, { hour: 'numeric', minute: m ? '2-digit' : undefined, timeZone: 'UTC' })
      .format(new Date(Date.UTC(2026, 0, 1, h, m)))
      // Never break inside a time ("8 h / 30", "8:30 / a.m.").
      .replace(/[\s\u202f]/g, '\u00a0');
  };
}

/**
 * Pins, list numbers and legend marks share one neutral ink, so colour is left to status (open, closing,
 * closed) and to the one chosen office (maple). The office kind is told apart by shape: a rounded square for a passport office, a circle for a
 * Service Canada Centre, an outlined circle for an outreach site.
 */
export type PinShape = 'square' | 'circle' | 'ring';
export const KIND_SHAPE: Record<OfficeKind, PinShape> = {
  passport: 'square',
  'scc-passport': 'square',
  scc: 'circle',
  outreach: 'ring',
};
/** Numbered pin / list badge look for a shape (size set by the caller). */
export const PIN_CLS: Record<PinShape, string> = {
  square: 'rounded-[9px] bg-ink text-paper',
  circle: 'rounded-full bg-ink text-paper',
  ring: 'rounded-full bg-card text-ink ring-2 ring-inset ring-ink',
};
/** The chosen office's pin and list number: the one accent on the map (maple), same shapes. */
export const PIN_ON_CLS: Record<PinShape, string> = {
  square: 'rounded-[9px] bg-maple text-card',
  circle: 'rounded-full bg-maple text-card',
  ring: 'rounded-full bg-card text-maple-ink ring-2 ring-inset ring-maple',
};
/** Small legend mark for a shape. */
export const LEGEND_CLS: Record<PinShape, string> = {
  square: 'rounded-[3px] bg-ink',
  circle: 'rounded-full bg-ink',
  ring: 'rounded-full bg-card ring-2 ring-inset ring-ink',
};
/** Figures on a filled tone (the appointment card's lead icon): the card colour, light or dark. */
export const PIN_TEXT = 'text-card';

/** "1.3 km", "47.0 km", "402 km": one decimal under 100 km so neighbouring rows line up. */
export function useKm() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (km: number) => t('km', { km: fmt.number(km, km < 100 ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }) });
}

export type StatusTone = 'open' | 'soon' | 'closed' | 'alert';
export const statusTone = (s: OfficeStatus): StatusTone =>
  s.state === 'open' ? 'open' : s.state === 'closing-soon' || s.state === 'lunch' ? 'soon' : s.state === 'temp-closed' || s.state === 'holiday' ? 'alert' : 'closed';

export const STATUS_DOT: Record<StatusTone, string> = {
  open: 'bg-pine shadow-[0_0_0_3px_var(--pine-wash)]',
  soon: 'bg-amber shadow-[0_0_0_3px_var(--amber-wash)]',
  closed: 'bg-ink-3',
  alert: 'bg-maple shadow-[0_0_0_3px_var(--maple-wash)]',
};
export const STATUS_TEXT: Record<StatusTone, string> = {
  open: 'text-pine',
  soon: 'text-amber',
  closed: 'text-ink-2',
  alert: 'text-maple-ink',
};

/** "Open · until 4 p.m.", "Opens tomorrow at 8:30 a.m." and the estimated wait for a status. */
export function useStatusText() {
  const t = useMessages(messages);
  const time = useTime();
  const { fmt } = useLocale();
  const lang = useLang();
  const when = (next: NonNullable<OfficeStatus['next']>) =>
    next.inDays === 0
      ? t('when.today', { time: time(next.time) })
      : next.inDays === 1
        ? t('when.tomorrow', { time: time(next.time) })
        : t('when.day', {
            day: fmt.date(next.date, next.inDays < 7 ? { weekday: 'long' } : { weekday: 'long', month: 'long', day: 'numeric' }),
            time: time(next.time),
          });
  const main = (s: OfficeStatus) => {
    switch (s.state) {
      case 'open':
        return s.until ? t('status.open.until', { time: time(s.until) }) : t('status.open');
      case 'closing-soon':
        return t('status.closing-soon', { time: time(s.until ?? '16:00') });
      case 'lunch':
        return t('status.lunch', { time: time(s.until ?? '13:00') });
      case 'holiday':
        return t('status.holiday', { holiday: s.holiday?.name[lang] ?? '' });
      case 'temp-closed':
        return t('status.temp-closed');
      case 'no-schedule':
        return t('status.no-schedule');
      default:
        return t('status.closed');
    }
  };
  /**
   * The estimated wait in two parts, so the length can be the loudest thing on the row:
   * "1 h 30 min" + "estimated wait at 12 p.m." / "1 h 30 min" + "d’attente estimée à 12 h".
   * `short` is the same in fewer words for a phone-width row ("wait · 12 p.m."), so the chip stays one line.
   */
  const wait = ({ min, at }: NonNullable<OfficeStatus['wait']>) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const length = [h ? t('wait.hours', { h }) : '', m || !h ? t('wait.minutes', { m }) : ''].filter(Boolean).join('\u00a0');
    return {
      length,
      rest: at ? t('status.wait.at', { time: time(at) }) : t('status.wait'),
      short: at ? t('status.wait.at.short', { time: time(at) }) : t('status.wait.short'),
    };
  };
  return { main, when, wait };
}
