'use client';
/** Fire danger and bulletins, as the parks cards show them: the five-step gauge, the danger badge, the bulletin list and the "Live at" badge. */
import { AlertTriangle, Ban, Flame, Info, PawPrint, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Badge, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useClockText, useDateText, useTimeZone } from './hooks';
import messages from './messages';
import { DANGER_KEYS, dangerKey, dangerTone, type Bulletin, type BulletinKind, type Danger } from './model';

const DANGER_BAR = ['bg-pine/60', 'bg-pine', 'bg-amber', 'bg-maple/80', 'bg-maple'];

/** Five-step fire-danger scale (Low → Extreme) with the current class highlighted. */
export function DangerGauge({ danger, className }: { danger: Danger | null; className?: string }) {
  const t = useMessages(messages);
  return (
    <div className={className}>
      <div className="flex gap-1" aria-hidden>
        {DANGER_KEYS.map((k, i) => (
          <span
            key={k}
            className={cn(
              'h-2 flex-1 rounded-full transition-all duration-500 motion-reduce:transition-none',
              danger != null && i <= danger ? DANGER_BAR[danger] : 'bg-paper-3',
              danger === i && 'h-3 -translate-y-0.5 shadow-sm',
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[.08em] text-ink-3" aria-hidden>
        <span>{t('danger.low')}</span>
        <span>{t('danger.extreme')}</span>
      </div>
    </div>
  );
}

/** Fixed height, so badges with and without the flame icon line up in a wrapped row. */
export function DangerBadge({ danger, count, className }: { danger: Danger | null; /** Shown inside the badge: "Extreme · 1". */ count?: string; className?: string }) {
  const t = useMessages(messages);
  return (
    <Badge tone={dangerTone(danger)} icon={danger != null && danger >= 2 ? Flame : undefined} className={cn('h-6', className)}>
      {t(`danger.${dangerKey(danger)}`)}
      {count != null ? <span className="tabular-nums"> · {count}</span> : null}
    </Badge>
  );
}

const KIND_ICON: Record<BulletinKind, LucideIcon> = {
  fireBan: Ban,
  fire: Flame,
  closure: TriangleAlert,
  wildlife: PawPrint,
  restricted: AlertTriangle,
  info: Info,
};
const KIND_TONE: Record<BulletinKind, string> = {
  fireBan: 'bg-maple-wash text-maple-ink',
  fire: 'bg-amber-wash text-amber',
  closure: 'bg-amber-wash text-amber',
  wildlife: 'bg-pine-wash text-pine',
  restricted: 'bg-glacier-wash text-glacier',
  info: 'bg-paper-2 text-ink-2',
};

export function BulletinList({ items, className }: { items: Bulletin[]; className?: string }) {
  const t = useMessages(messages);
  const date = useDateText();
  return (
    <ul className={cn('m-0 grid list-none gap-1 p-0', className)}>
      {items.map((b) => {
        const Icon = KIND_ICON[b.kind];
        return (
          <li key={b.url} className="group relative -mx-2 flex min-h-11 items-start gap-3 rounded-field px-2 py-2.5 transition-colors hover:bg-paper-2">
            <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full', KIND_TONE[b.kind])} aria-hidden>
              <Icon className="size-[15px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              {/* The title is the link (with the new-tab arrow); it stretches over the whole row, which gives the
                  44px target. The line height is set on this block: an inline link can't tighten its parent's lines. */}
              <span className="block text-[14.5px] leading-snug text-balance">
                <ExternalLink
                  href={b.url}
                  className="static py-0 no-underline after:absolute after:inset-0 after:rounded-field group-hover:underline group-hover:decoration-hair-2 group-hover:underline-offset-[3px]"
                >
                  {b.title}
                </ExternalLink>
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">
                {t(`bulletin.kind.${b.kind}`)}
                {b.date ? ` · ${t('bulletin.posted', { date: date(b.date, { month: 'short', day: 'numeric', year: 'numeric' }) })}` : ''}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Live · 10:05 am EDT": when the live data was read, on the reader's own clock. */
export function FetchedBadge({ at }: { at: string }) {
  const t = useMessages(messages);
  const clock = useClockText();
  const timeZone = useTimeZone();
  // With the time zone: a Pacific-time reader looking at an Alberta park should know whose clock this is.
  return <Badge tone="live">{t('live.at', { time: clock(new Date(at), timeZone) })}</Badge>;
}
