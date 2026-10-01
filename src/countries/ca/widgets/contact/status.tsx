'use client';
/**
 * A line's open/closed status as words and as a pill: "Open now" + "Closes at 5 p.m.", "Closes in 25 min",
 * "Closed today" + "Opens tomorrow at 8:30 a.m.". One wording for pills, notices and the header badge.
 */
import type { ReactNode } from 'react';
import { Globe2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useTimeFmt } from './clock';
import { dayOffset, type Status } from './hours';
import messages from './messages';

export type StatusTone = 'open' | 'closing' | 'closed' | 'web';

export function statusTone(s: Status | null): StatusTone {
  if (!s) return 'web';
  if (s.state === 'closing') return 'closing';
  if (s.state === 'closed') return 'closed';
  return 'open';
}

/** A line's status, split in two: a short state for the pill and a plain-text detail beside it. */
export type StatusText = { main: string; sub?: string };
export const statusSentence = (x: StatusText) => (x.sub ? `${x.main}. ${x.sub}` : x.main);

/** Closed on a holiday: the notice says why, so the row just says when it reopens. */
export function quietStatus(x: StatusText, s: Status | null, quiet: boolean): StatusText {
  return quiet && s?.state === 'closed' && x.sub ? { main: x.sub } : x;
}

/** Relative wording for a moment, shared by pills, notices and their skeletons: "at 8 a.m.", "tomorrow at 8 a.m.", "Monday at 8 a.m.". */
export function useWhenText(tz: string) {
  const t = useMessages(messages);
  const { time, weekday } = useTimeFmt(tz);
  return (now: number, at: number) => {
    const days = dayOffset(now, at, tz);
    return days <= 0 ? t('when.today', { time: time(at) }) : days === 1 ? t('when.tomorrow', { time: time(at) }) : t('when.day', { day: weekday(at), time: time(at) });
  };
}

export function useStatusText(tz: string) {
  const t = useMessages(messages);
  const { time } = useTimeFmt(tz);
  const whenText = useWhenText(tz);
  return (s: Status | null, now: number): StatusText => {
    if (!s) return { main: t('status.online') };
    if (s.state === 'always') return { main: t('status.always') };
    if (s.state === 'open') return { main: t('status.open'), sub: t('status.closesAt', { time: time(s.closesAt) }) };
    if (s.state === 'closing') return { main: t('status.closingIn', { minutes: s.minutesLeft }) };
    const main = s.holiday ? t('status.closedToday') : t('status.closed');
    if (!s.opensAt) return { main };
    return { main, sub: t('status.opens', { when: whenText(now, s.opensAt) }) };
  };
}

const pillCls: Record<StatusTone, string> = {
  open: 'bg-pine-wash text-pine',
  closing: 'bg-amber-wash text-amber',
  closed: 'bg-paper-2 text-ink-2',
  web: 'bg-glacier-wash text-glacier',
};
const dotCls: Record<StatusTone, string> = {
  open: 'bg-pine',
  closing: 'bg-amber',
  closed: 'bg-ink-3',
  web: 'bg-glacier',
};

export function StatusPill({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-start gap-1.5 rounded-chip px-2.5 py-1 text-[12.5px] font-medium leading-tight', pillCls[tone], className)}>
      {tone === 'web' ? (
        <Globe2 className="mt-px size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <span className="relative mt-[4px] grid size-2 shrink-0 place-items-center" aria-hidden>
          {tone === 'open' ? <span className="absolute inset-0 animate-ping rounded-full bg-pine opacity-40 motion-reduce:hidden" /> : null}
          <span className={cn('relative size-1.5 rounded-full', dotCls[tone])} />
        </span>
      )}
      <bdi className="min-w-0">{children}</bdi>
    </span>
  );
}

/**
 * Pill + detail ("Closed" · "Opens tomorrow at 8:30 a.m."). `stacked` always puts the detail on its own line
 * (overview cards), so every card in a grid reads the same way; otherwise it sits beside the pill and wraps.
 */
export function StatusLine({ tone, status, className, stacked }: { tone: StatusTone; status: StatusText; className?: string; stacked?: boolean }) {
  return (
    <span className={cn('max-w-full', stacked ? 'flex flex-col items-start gap-1' : 'inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <StatusPill tone={tone} className="whitespace-nowrap">
        {status.main}
      </StatusPill>
      {status.sub ? <bdi className={cn('text-[12.5px] font-medium leading-tight text-ink-2', stacked && 'ps-0.5')}>{status.sub}</bdi> : null}
    </span>
  );
}
