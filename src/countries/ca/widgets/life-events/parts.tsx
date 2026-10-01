'use client';
/** Small pieces shared by the picker, the plan and their skeleton: event icons, the tile, the meta line. */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Baby, BriefcaseBusiness, Flower2, HeartHandshake, Smartphone, Sunset, Truck } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Agency, EventId, Tone } from './facts';
import messages from './messages';
import { ordinalDay } from './model';

export const EVENT_ICONS: Record<EventId, LucideIcon> = {
  moving: Truck,
  baby: Baby,
  marriage: HeartHandshake,
  'job-loss': BriefcaseBusiness,
  retiring: Sunset,
  death: Flower2,
};

/** The locale's date formatter, with the first of the month as Canada.ca French writes it ("1er juin"). */
export function useDate() {
  const { fmt, intl } = useLocale();
  return (iso: string, opts: Intl.DateTimeFormatOptions) => ordinalDay(fmt.date(iso, opts), intl);
}

export function ToneTile({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-[12px]',
        tone === 'maple' && 'bg-maple-wash text-maple',
        tone === 'pine' && 'bg-pine-wash text-pine',
        tone === 'glacier' && 'bg-glacier-wash text-glacier',
        tone === 'amber' && 'bg-amber-wash text-amber',
      )}
    >
      {children}
    </span>
  );
}

/**
 * "5 federal organizations · 8 steps": organizations first (that's the point: they don't share information),
 * each phrase kept whole so a narrow column only wraps at the separator. One organization is named instead.
 */
export function MetaLine({ agencies, steps }: { agencies: Agency[]; steps: number }) {
  const t = useMessages(messages);
  const who = agencies.length === 1 ? t(`agency.${agencies[0]}`) : agencies.length > 1 ? t('picker.agencies', { count: agencies.length }) : null;
  return (
    <>
      {who ? (
        <>
          <bdi className="whitespace-nowrap">{who}</bdi>
          {t('meta.sep')}
        </>
      ) : null}
      <bdi className="whitespace-nowrap">{t('picker.steps', { count: steps })}</bdi>
    </>
  );
}

/** "Saved on this device only": the same badge on the picker, the plan and their skeleton. */
export function DeviceBadge() {
  const t = useMessages(messages);
  return (
    <Badge icon={Smartphone} mono>
      {t('badge.device')}
    </Badge>
  );
}
