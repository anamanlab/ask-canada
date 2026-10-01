'use client';
/**
 * "See a travel health clinic about 6 weeks before you leave" as a countdown the person can set to their own
 * departure date. The reminder is saved on this device only, and only when they choose to.
 */
import { useState } from 'react';
import { Bookmark, BookmarkCheck, CalendarClock } from 'lucide-react';
import { Button, Field, Input, LiveRegion, WidgetSection } from '@/components/ui';
import { addDays, diffDays } from '@/lib/dates/business-days';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { DayLabel } from './shared';
import { CLINIC_LEAD_DAYS } from './travel';

type Reminder = { destination: string | null; trip: string; clinicBy: string };
const LONG = { month: 'long', day: 'numeric' } as const;
const HEAD = 'm-0 font-serif text-[24px] leading-tight tracking-[-.02em] text-ink [text-wrap:balance]';
const SUB = 'm-0 mt-1 text-[14px] leading-snug text-ink-2';
/** The advice beside the date field; shared with the loading state in ./TravelHealth.tsx. */
export const COUNTDOWN_GRID = 'grid gap-4 @xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @xl:items-end';

export function TravelCountdown({ destination, travelDate, today, day }: { destination: string | null; travelDate: string | null; today: string; day: DayLabel }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [saved, save] = useDeviceItem<Reminder>('health:travel-clinic', { label: t('travel.saved.label'), kind: 'reminder' });
  // The date typed here wins, then the one given in the question, then a trip saved for this destination that
  // is still ahead. Derived on every render: the saved value only arrives once the device has been read.
  const [edited, setEdited] = useState<string | null>(null);
  const remembered = saved && saved.destination === destination && saved.trip >= today ? saved.trip : '';
  const trip = edited ?? travelDate ?? remembered;
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(trip);
  // A date that has passed (typed, or given in the question) can't be planned for: say so at the field instead
  // of quietly showing the general advice next to it.
  const past = isDate && trip < today;
  const valid = isDate && !past;
  const clinicBy = valid ? addDays(trip, -CLINIC_LEAD_DAYS) : null;
  const left = clinicBy ? diffDays(today, clinicBy) : null;
  const isSaved = Boolean(saved && clinicBy && saved.clinicBy === clinicBy && saved.destination === destination);
  const saveLabel = isSaved ? t('travel.saved.done') : t('travel.saved.save');
  const remember = () => {
    if (!clinicBy) return;
    const date = fmt.date(clinicBy, LONG);
    save({ destination, trip, clinicBy }, { detail: destination ? t('travel.saved.detail', { place: destination, date }) : t('travel.saved.detailNoPlace', { date }) });
  };

  // The advice, worded once: shown beside the field, and read out once the date has settled (a native date
  // field changes on every keystroke), never while it is still being typed.
  const head = clinicBy == null || left == null ? t('travel.when.generic') : left > 0 ? t('travel.when.by', { date: fmt.date(clinicBy, LONG) }) : t('travel.when.now');
  const sub = clinicBy == null || left == null ? t('travel.when.genericSub') : left > 0 ? t('travel.when.left', { count: left, trip: day(trip, LONG) }) : t('travel.when.soon', { count: diffDays(today, trip) });

  return (
    <WidgetSection title={t('travel.when.title')}>
      <LiveRegion text={`${head}. ${sub}`} delay={700} />
      <div className={COUNTDOWN_GRID}>
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-field bg-glacier-wash text-glacier" aria-hidden>
            <CalendarClock className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className={HEAD}>{head}</p>
            {/* May start with a number: isolated, so a right-to-left page keeps "38 days left · you leave December 20" in order. */}
            <p className={SUB}>
              <bdi>{sub}</bdi>
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Field label={t('travel.when.label')} error={past ? t('travel.when.past') : undefined} className="min-w-0 flex-1">
            {(p) => <Input {...p} type="date" value={trip} min={today} onChange={(e) => setEdited(e.target.value)} className="tabular-nums" />}
          </Field>
          {clinicBy ? (
            <Button icon={isSaved ? BookmarkCheck : Bookmark} onClick={remember} aria-label={saveLabel} title={saveLabel}>
              <span className="@max-sm:sr-only">{isSaved ? t('travel.saved.doneShort') : t('travel.saved.saveShort')}</span>
            </Button>
          ) : null}
        </div>
      </div>
      {/* Only next to the Save button it is about. */}
      {clinicBy ? <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('travel.footnote')}</p> : null}
    </WidgetSection>
  );
}
