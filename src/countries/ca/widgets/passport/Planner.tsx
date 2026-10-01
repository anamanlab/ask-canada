'use client';
/**
 * The plan itself. Everything the person changes (expiry, trip date, checks, method, validity) re-runs the
 * same pure `planRenewal` the tool uses, so the verdict, labels, timeline and handoff can never disagree.
 *
 * Top to bottom: the answer card (Verdicts.tsx, TripVerdict.tsx), the timeline or the month picker
 * (Timeline.tsx, ExpiryPicker.tsx), the departure date (TripDate.tsx), the three figures for the chosen way to
 * apply (HowToApply.tsx), live notices (ServiceStatus.tsx), then three rows to open: the conditions
 * (Eligibility.tsx), the fine print (MethodNotes.tsx) and the checklist (Needs.tsx). handoff.ts says where
 * the main button goes. PlannerSkeleton.tsx renders this same component, hidden, to hold the plan's exact room.
 */
import { useState } from 'react';
import { Bookmark, BookmarkCheck, CalendarClock } from 'lucide-react';
import { Badge, Button, Disclosure, LinkButton, LiveRegion, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useNow, useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { Eligibility, type Criteria } from './Eligibility';
import { handoffFor } from './handoff';
import { ExpiryPicker } from './ExpiryPicker';
import { HowToApply } from './HowToApply';
import messages from './messages';
import { MethodNotes } from './MethodNotes';
import { Needs } from './Needs';
import { PassportCover } from './PassportCover';
import { planRenewal } from './plan';
import { ServiceStatus } from './ServiceStatus';
import { isolate, nb } from './shared';
import { Timeline } from './Timeline';
import { rushOf } from './timelineModel';
import { TripDate } from './TripDate';
import { TripVerdict } from './TripVerdict';
import type { Clock, Lang, Method, PlannerOutput } from './types';
import { FeeVerdict, OnlineVerdict, ProcessingVerdict, Verdict } from './Verdicts';

const expiryString = (e: PlannerOutput['expiry']) => (e ? (e.monthOnly ? e.start.slice(0, 7) : e.end) : undefined);

/**
 * The reader's clock (17.5 = 5:30 pm), unknown until the page is live in their browser. It decides whether a
 * passport office can still take an application today and whether the Passport Program's lines are open
 * (they close half an hour later on Newfoundland's clock).
 */
function useLocalClock(pinned?: Clock): Clock | undefined {
  const now = useNow(0, { tickMs: 5 * 60_000, pinned: !!pinned });
  if (pinned) return pinned;
  if (!now) return undefined;
  const at = new Date(now);
  return { hour: at.getHours() + at.getMinutes() / 60, newfoundland: new Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/St_Johns' };
}

export function Planner({ initial, placeholder }: { initial: PlannerOutput; /** The loading state's stand-in plan: the live notices aren't known yet. */ placeholder?: boolean }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  // URLs, source titles and notices follow the language the planner is shown in (see PassportPlanner).
  const lang: Lang = locale === 'fr' ? 'fr' : 'en';
  // The reader's own date: the server plans in the capital region's time, and a plan reopened next week
  // should count from that day, so the device's date always wins (no drift cap). Lab fixtures pin both clocks.
  const today = useToday(initial.today, { pinned: !!initial.pinned });
  const clock = useLocalClock(initial.pinned);

  const [expiry, setExpiry] = useState<string | undefined>(() => expiryString(initial.expiry));
  const [kept, setKept] = useState<string | undefined>();
  // The departure date: from the question, or added here ("I'm travelling before it arrives").
  const [travelDate, setTravelDate] = useState<string | undefined>(initial.travelDate ?? undefined);
  const [criteria, setCriteria] = useState<Criteria>(initial.eligibility);
  const [validity, setValidity] = useState<5 | 10>(initial.validityYears);
  const [methodChoice, setMethodChoice] = useState<Method | null>(null);
  // A fee, processing or trip answer leads with that answer; the expiry picker opens only when asked for.
  const [pickerOpen, setPickerOpen] = useState(false);
  // The picker and the timeline swap places. When the person caused the swap, the control they used is gone,
  // so the part that replaces it takes focus (the picker's question, then the timeline's "Change expiry month").
  const [moved, setMoved] = useState(false);

  const plan = planRenewal(
    {
      ...criteria,
      expiry,
      travelDate,
      livesInCanada: initial.methods.online.reason !== 'outside-canada',
      lang,
      validityYears: validity,
      focus: initial.focus ?? undefined,
    },
    today,
    initial.serviceNotices,
    clock,
  );

  // A new expiry (or new checks, or a trip) can change what we recommend: follow it until the person picks a method.
  const method = methodChoice ?? plan.recommended;
  const m = plan.methods[method];
  const canRenew = plan.canRenew;
  const trip = plan.trip;
  // A trip regular processing can't make is the answer: it takes the verdict's place.
  const tripRush = canRenew && trip && trip.option !== 'regular' ? trip : null;
  // In person, the trip decides the plan: express or urgent pick-up (or no standard service fits), and the
  // timeline, tiles, notes and handoff all follow it instead of regular processing.
  const rush = canRenew && method === 'in-person' ? rushOf(plan) : null;
  // A fee, processing-time or online question leads with its answer; planning is a follow-on step.
  const focusFirst = plan.focus && !plan.expiry && !tripRush ? plan.focus : null;

  const pickExpiry = (v: string | undefined) => {
    setExpiry(v);
    setKept(undefined);
    setMethodChoice(null);
    setMoved(true);
  };
  const changeExpiry = () => {
    setKept(expiry);
    setExpiry(undefined);
    setPickerOpen(true);
    setMoved(true);
  };
  const picker = <ExpiryPicker autoFocus={moved} today={plan.today} current={kept} onPick={pickExpiry} onKeep={() => pickExpiry(kept)} />;

  const [saved, save] = useDeviceItem<{ method: Method; validity: number; readyBy: string }>('passport:plan', { label: t('saved.label'), kind: 'plan' });
  const [savedNow, setSavedNow] = useState(false);

  // Saving needs a plan with dates: the Save button, the "Saved" badge and the saved footnote go together.
  const canSave = canRenew && !!plan.expiry;

  const link = handoffFor({ plan, method, focusFirst, tripRush: !!tripRush });
  const status = <ServiceStatus plan={plan} lang={lang} placeholder={placeholder} />;
  const toggle = (c: keyof Criteria) => {
    setCriteria((s) => ({ ...s, [c]: !s[c] }));
    setMethodChoice(null);
    setMoved(false);
  };

  /**
   * Under the answer: the three figures for the chosen way to apply, any live notice, then everything that
   * can wait (the four conditions, the fine print, the checklist) as one list of rows to open. Not eligible:
   * the conditions are the answer's reason, so they stay open and nothing else applies.
   */
  const details = (nested: boolean) =>
    canRenew ? (
      <>
        <HowToApply plan={plan} method={method} onMethod={setMethodChoice} validity={validity} onValidity={setValidity} rush={rush} />
        {nested ? null : status}
        <div className="mt-6 px-5 sm:px-6">
          <Eligibility criteria={criteria} canRenew onToggle={toggle} headingLevel={nested ? 5 : 4} />
          <MethodNotes plan={plan} method={method} rush={rush} headingLevel={nested ? 5 : 4} />
          <Needs plan={plan} method={method} headingLevel={nested ? 5 : 4} />
        </div>
      </>
    ) : (
      <>
        <Eligibility criteria={criteria} canRenew={false} onToggle={toggle} />
        {nested ? null : status}
      </>
    );

  return (
    <WidgetShell
      iconNode={<PassportCover />}
      title={t('title')}
      subtitle={t('subtitle')}
      badge={saved && canSave ? <Badge tone="ok" icon={BookmarkCheck} mono>{t('badge.saved')}</Badge> : undefined}
      sources={plan.sources}
      secondaryAction={
        // The main button, "Save plan", then what the button does on one line right under them.
        <>
          <LinkButton href={link.href} external variant={link.secondary ? 'secondary' : 'primary'} className="max-sm:w-full">
            {t(link.label)}
          </LinkButton>
          {canSave ? (
            <>
              <Button
                icon={saved ? BookmarkCheck : Bookmark}
                size="lg"
                className="max-sm:w-full"
                onClick={() => {
                  // With express/urgent pick-up, the saved date is the pick-up date the plan shows.
                  const readyBy = rush ? rush.readyBy : m.readyBy;
                  save({ method, validity, readyBy }, { detail: t('saved.detail', { date: nb(fmt.date(readyBy, { month: 'short', day: 'numeric' })), method: t(`method.${method}`) }) });
                  setSavedNow(true);
                }}
              >
                {saved ? t('action.saved') : t('action.save')}
              </Button>
              <LiveRegion text={savedNow ? t('action.savedStatus') : ''} delay={150} />
            </>
          ) : null}
          {link.note ? <p className="m-0 basis-full text-[14px] leading-snug text-ink-2">{isolate(t(link.note))}</p> : null}
        </>
      }
      footnote={!canRenew ? undefined : isolate(t(!plan.expiry ? 'footnote.private' : saved ? 'footnote.saved' : 'footnote.device'))}
      className="@container"
    >
      {tripRush ? (
        <TripVerdict plan={plan} trip={tripRush} />
      ) : focusFirst === 'fees' ? (
        <FeeVerdict plan={plan} />
      ) : focusFirst === 'processing' ? (
        <ProcessingVerdict plan={plan} />
      ) : focusFirst === 'online' ? (
        <OnlineVerdict plan={plan} />
      ) : (
        <Verdict plan={plan} canRenew={canRenew} />
      )}

      {focusFirst ? (
        // A two-number answer stays short: the planner itself (month, checks, ways to apply, checklist) is one tap away.
        <>
          {status}
          {/* The toggle row is inset like every section; the planner inside runs edge to edge again (its parts
              bring their own insets). The hairline above stays full width, so it sits on the wrapper. */}
          <div className="mt-5 border-t border-hair px-5 sm:px-6">
            <Disclosure lazy title={t('plan.title')} summary={isolate(t('plan.summary'))} open={pickerOpen} onOpenChange={setPickerOpen} className="border-t-0">
              <div className="-mx-5 sm:-mx-6">
                {canRenew ? picker : null}
                {details(true)}
              </div>
            </Disclosure>
          </div>
        </>
      ) : (
        <>
          {!canRenew ? null : !plan.expiry && (pickerOpen || !trip) ? (
            picker
          ) : (
            <>
              <Timeline plan={plan} method={method} rush={rush} onChange={plan.expiry ? changeExpiry : undefined} focusChange={moved} />
              <TripDate
                today={plan.today}
                value={travelDate}
                onChange={(v) => {
                  setTravelDate(v);
                  setMethodChoice(null);
                  // Without an expiry month, removing the trip brings the month picker back: it takes focus.
                  setMoved(!v && !plan.expiry);
                }}
              />
              {plan.expiry ? null : (
                // A trip answer doesn't need the expiry month; adding it is a small, optional next step.
                <div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-tile border border-dashed border-hair-2 px-4 py-3.5 sm:mx-6">
                  <div className="min-w-0 flex-1 basis-[240px]">
                    <p className="m-0 text-[15px] font-semibold text-ink">{isolate(t('trip.plan.title'))}</p>
                    <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-2">{isolate(t('trip.plan.sub'))}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={CalendarClock}
                    onClick={() => {
                      setPickerOpen(true);
                      setMoved(true);
                    }}
                  >
                    {t('trip.plan.cta')}
                  </Button>
                </div>
              )}
            </>
          )}
          {details(false)}
        </>
      )}
    </WidgetShell>
  );
}
