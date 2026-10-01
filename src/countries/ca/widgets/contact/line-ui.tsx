'use client';
/** Per-line presentation shared by the full row and the overview card: icon, tone, call labels and hours wording. */
import type { LucideIcon } from 'lucide-react';
import { BookUser, BriefcaseBusiness, Building2, HandCoins, Info, Receipt, ShieldAlert, Smile, Sunrise } from 'lucide-react';
import type { WidgetTone } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { useTimeFmt } from './clock';
import { LINES, type Hours, type Lang, type Line, type LineId } from './data';
import { formatDays, formatTime, OTTAWA, typicalWindow } from './hours';
import messages from './messages';
import type { LineView, Viewer } from './pick';

export const LINE_ICON: Record<LineId, LucideIcon> = {
  'cra-individuals': Receipt,
  'cra-benefits': HandCoins,
  'cra-business': Building2,
  ei: BriefcaseBusiness,
  'cpp-oas': Sunrise,
  dental: Smile,
  'o-canada': Info,
  passport: BookUser,
  cafc: ShieldAlert,
};
/** One accent for the directory's lines; amber is kept for the Anti-Fraud Centre, where it means "warning". */
export const ORG_TONE: Record<Line['org'], WidgetTone> = { cra: 'pine', esdc: 'pine', gc: 'pine', ircc: 'pine', cafc: 'amber' };

/** The chip beside a number that isn't the main line ("TTY", "International · call collect") and the Call button's label. */
export function useCallLabels({ line, pick }: LineView, lang: Lang) {
  const t = useMessages(messages);
  const kindLabel =
    pick.kind === 'abroad'
      ? t(pick.collect ? 'kind.abroadCollect' : pick.outside === 'canada' ? 'kind.outsideCanada' : 'kind.abroad')
      : pick.kind !== 'main' && pick.kind !== 'fr'
        ? t(`kind.${pick.kind}`)
        : null;
  const callAria = !pick.number
    ? ''
    : kindLabel
      ? t('call.ariaKind', { name: line.name[lang], number: pick.number, kind: kindLabel })
      : t('call.aria', { name: line.name[lang], number: pick.number });
  return { kindLabel, callAria };
}

/** With TTY first, the note on a row that leads with a voice number: where its TTY line is, or that it has none. */
export function useTtyNote({ line, ttyNote }: LineView, lang: Lang) {
  const t = useMessages(messages);
  if (!ttyNote) return null;
  if ('with' in ttyNote) return t('tty.sameAs', { name: LINES[ttyNote.with].name[lang] });
  return t(line.org === 'cafc' ? 'tty.noneReport' : 'tty.none');
}

const allDay = (h: Hours) => h.open === 0 && h.close >= 1440;

/** A rule's hours in the viewer's own time, as a sentence, as inline markup, and the "(… Eastern)" aside. */
export function useHoursText({ now, tz }: Pick<Viewer, 'now' | 'tz'>) {
  const t = useMessages(messages);
  const { time, intl } = useTimeFmt(tz);
  return {
    /** "Mon–Fri · 5 a.m.–5 p.m." */
    line: (h: Hours) => {
      if (allDay(h)) return t('hours.allDay');
      const w = typicalWindow(h, now, tz);
      const days = h.days.length === 7 ? t('hours.everyDay') : formatDays(h.days, intl);
      return t('hours.line', { days, from: time(w.start), to: time(w.end) });
    },
    /** The same after a label ("Agents: Mon–Fri · 5 a.m.–5 p.m."), with the time range kept left-to-right. */
    node: (h: Hours) => {
      if (allDay(h)) return <span>{t('hours.allDay')}</span>;
      const w = typicalWindow(h, now, tz);
      const days = h.days.length === 7 ? t('hours.everyDayInline') : formatDays(h.days, intl);
      return (
        <span className="whitespace-nowrap">
          {days} · <bdi dir="ltr">{t('hours.range', { from: time(w.start), to: time(w.end) })}</bdi>
        </span>
      );
    },
    /** "(8 a.m.–8 p.m. Eastern)" when the rule runs on Ottawa time and the viewer's clock reads differently. */
    eastern: (h: Hours) => {
      if (h.zone !== 'ET') return null;
      const w = typicalWindow(h, now, OTTAWA);
      const from = formatTime(w.start, OTTAWA, intl);
      const to = formatTime(w.end, OTTAWA, intl);
      // Any zone on Eastern time today (Iqaluit, Thunder Bay, New York…) reads the same clock: no aside.
      if (from === time(w.start) && to === time(w.end)) return null;
      return t('hours.eastern', { from, to });
    },
  };
}
