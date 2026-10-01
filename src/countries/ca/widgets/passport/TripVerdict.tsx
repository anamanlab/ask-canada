'use client';
/**
 * A trip that regular processing can't make is the answer, so it takes the verdict's place: what to ask for
 * at a passport office (express or urgent pick-up), or, when even urgent pick-up is ready only on or after
 * the departure, how to reach the Passport Program right now (its lines, or the leave-a-message call-back
 * canada.ca offers on weekends and on the evening before a holiday). The card holds that state's one primary
 * button: a link to the canada.ca section with the phone number (we never print the number), labelled as a
 * link, not as a call. The shell's own button steps back to secondary there (see handoff.ts).
 * "You can renew" moves down to the eligibility badge.
 */
import { Phone, Plane } from 'lucide-react';
import { ExternalLink, LinkButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { PlannerOutput, TripPlan } from './types';
import { AMBER, CARD, Fit, HEADING, isolate, MAPLE, nb, nbAfterWeekday, ordinal } from './shared';

const LINE = 'm-0 mt-2 text-pretty text-[14.5px] leading-snug text-ink-2';
// Icon beside the heading; on phones the body runs the card's full width (so the call button fits on one
// line), and from @md it lines up under the heading.
const BODY = 'col-span-2 min-w-0 @md:col-span-1 @md:col-start-2';

export function TripVerdict({ plan, trip }: { plan: PlannerOutput; trip: TripPlan }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const d = (iso: string, o: Intl.DateTimeFormatOptions) => nb(fmt.date(iso, o));
  const long = (iso: string) => d(iso, { month: 'long', day: 'numeric' });
  const weekday = (iso: string) => nbAfterWeekday(fmt.date(iso, { weekday: 'long', month: 'long', day: 'numeric' }));
  // "$50", "$125.75": canada.ca writes whole-dollar fees without cents.
  const money = (n: number) => nb(fmt.money(n));
  const emergency = trip.option === 'emergency';
  // Offices can't take an application today (weekend, holiday or late in the day): "the next business day"
  // would name the wrong day, so the card says when they open and counts from there.
  const later = plan.officeOpensOn !== plan.today;
  return (
    <div className={cn(CARD, emergency ? MAPLE : AMBER)} role="status" aria-live="polite">
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-3.5">
        <span
          className={cn(
            'mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-card',
            emergency ? 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]' : 'bg-amber shadow-[0_0_0_6px_var(--amber-wash)]',
          )}
          aria-hidden
        >
          <Plane className="size-[17px] flip-rtl" strokeWidth={2.2} />
        </span>
        <p className={HEADING}>{isolate(emergency ? t('trip.emergency.title', { date: long(trip.date) }) : t(`verdict.trip.${trip.option}`, { date: long(trip.date) }))}</p>
        {emergency ? (
          <div className={BODY}>
            <p className={cn(LINE, 'mt-3 text-[15px] text-ink @md:mt-1.5')}>{isolate(t(later ? 'trip.emergency.urgentFrom' : 'trip.emergency.urgent', { date: weekday(trip.urgentBy), open: weekday(plan.officeOpensOn) }))}</p>
            <p className={LINE}>{isolate(t(trip.offHours ? 'trip.emergency.askHoliday' : 'trip.emergency.ask'))}</p>
            <p className={cn(LINE, 'flex gap-2 font-medium text-ink')}>
              <Phone className="mt-[3px] size-3.5 shrink-0 text-maple" aria-hidden />
              <span>
                <bdi>
                  {ordinal(t(`trip.emergency.phone.${trip.phone}`, { date: weekday(trip.callsOn) }))}
                  {trip.phone !== 'open' ? null : trip.callbackTonight ? ` ${t('trip.emergency.tonight')}` : trip.offHours ? ` ${t('trip.emergency.weekend')}` : null}
                </bdi>
              </span>
            </p>
            {trip.phone === 'holiday' ? <p className={LINE}>{isolate(t('trip.emergency.holidayNote'))}</p> : null}
            {trip.offHours ? <p className={LINE}>{isolate(t('trip.emergency.fee', { fee: money(plan.fees.weekendHoliday), urgent: money(plan.fees.urgentPickup) }))}</p> : null}
            <p className={LINE}>{isolate(t('trip.emergency.proof'))}</p>
            <LinkButton href={trip.emergencyUrl} external size="md" className="mt-4 @max-md:w-full">
              {/* Phones get the short label, so the button stays one line (the arrow says it leaves the site). */}
              <Fit short={t('trip.contactShort')} full={t('trip.contact')} />
            </LinkButton>
          </div>
        ) : (
          <div className={BODY}>
            <p className={cn(LINE, 'mt-3 text-[15px] @md:mt-1.5')}>
              {isolate(
                t(trip.option === 'urgent' && later ? 'trip.urgentFrom' : `trip.${trip.option}`, {
                  open: weekday(plan.officeOpensOn),
                  date: weekday(trip.option === 'express' ? trip.expressBy : trip.urgentBy),
                  fee: money(trip.option === 'express' ? plan.fees.expressPickup : plan.fees.urgentPickup),
                }),
              )}
            </p>
            {trip.expressMayFit ? (
              // Urgent is the service sure to fit; express costs less and may be ready in time, so say so.
              <p className={LINE}>{isolate(t('trip.expressMaybe', { fee: money(plan.fees.expressPickup), date: long(trip.expressBy) }))}</p>
            ) : null}
            <p className={LINE}>{isolate(t('trip.proof'))}</p>
            <p className="m-0 mt-2.5 text-[14px]">
              <ExternalLink href={trip.urgentUrl}>{t('trip.link')}</ExternalLink>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
