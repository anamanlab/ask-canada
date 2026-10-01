'use client';
/**
 * Citizenship days calculator (citizenshipPresence): how many days count toward the 1,095, the earliest
 * date the person can apply, a 5-year window timeline and an editable trip list. The dates behind the
 * answer and the other requirements sit one tap away, so the card opens on the answer. Recomputed on the
 * device with the same pure function the tool uses; saved on the device only when the person asks.
 */
import { useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, CalendarDays, Info, Smartphone } from 'lucide-react';
import { Badge, Button, Disclosure, Notice, WidgetError, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { prefersReducedMotion, useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import messages from './messages';
import { URLS, presenceSources } from './data';
import { calcPresence, type PresenceInput, type PresenceOutput, type Trip } from './presence';
import { WindowChart } from './PresenceCharts';
import { Hero, changeBetween, type Change } from './PresenceHero';
import { AlsoNeeded, Setup } from './PresenceSetup';
import { DatesFields } from './PresenceDates';
import { Trips, type Details } from './PresenceTrips';
import { firstOf, formatDays as days, useLang } from './shared';
import { CzSkeleton } from './Skeletons';

export function CitizenshipPresence({ part }: WidgetProps<PresenceInput, PresenceOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.presence[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return (
      <CzSkeleton
        kind={part.input?.prDate ? 'presence' : 'presence-setup'}
        hints={{ trips: Array.isArray(part.input?.trips) ? part.input.trips.length : 0, temp: Boolean(part.input?.tempStart) }}
        title={t('presence.title')}
        subtitle={t('presence.subtitle')}
        icon={CalendarDays}
        tone="pine"
        label={t('presence.loading')}
      />
    );
  }
  return <Calculator output={part.output} />;
}

/** The result for these details, with the same pure function the tool uses (null until there is a PR date). */
const compute = (d: Details, today: string) =>
  d.prDate ? calcPresence({ prDate: d.prDate, applyDate: d.applyDate ?? today, tempStart: d.tempStart ?? undefined, trips: d.trips }, today) : null;

/** A ref callback with a stable identity: focuses the verdict it is given when that verdict mounts. */
const focusOnMount = (el: HTMLElement | null) => el?.focus();

/** Every row of the editable list needs a stable key: trips from the answer or an older save get one by position. */
const withIds = (trips: Trip[]): Trip[] => (trips.every((tr) => tr.id) ? trips : trips.map((tr, i) => (tr.id ? tr : { ...tr, id: `t${i}` })));

function Calculator({ output }: { output: PresenceOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const lang = useLang();
  // The trip list's rows by trip id, so a tap on the timeline can bring its row into view.
  const rowEls = useRef(new Map<string, HTMLLIElement>());
  const today = useToday(output.today);
  const [saved, save] = useDeviceItem<Details>('citizenship:presence', {
    label: t('presence.savedLabel'),
    kind: 'plan',
  });
  const [savedNow, setSavedNow] = useState(false);

  const fromOutput: Details = {
    prDate: output.input.prDate,
    applyDate: output.input.applyDate === output.today ? null : output.input.applyDate,
    tempStart: output.input.tempStart,
    trips: output.input.trips,
  };
  const [edits, setEdits] = useState<Details | null>(null);
  // The model's dates win; otherwise pick up what this person saved on this device last time.
  const base = edits ?? (fromOutput.prDate ? fromOutput : (saved ?? fromOutput));
  const details: Details = { ...base, trips: withIds(base.trips) };
  // A few thousand days of prefix sums; the compiler memoizes it on the details and today's date.
  const result = compute(details, today);
  // What the last edit did to the answer, shown in the hero until the next edit.
  const [change, setChange] = useState<Change | null>(null);
  // The trip under the pointer (or with focus), shared by the timeline and the list so each lights up the other.
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  // Counts the taps on "Enter the exact date": each one mounts the date fields afresh with the PR date focused.
  // Back to 0 when the person opens or closes "Your dates" themselves, so that never moves focus.
  const [prAsk, setPrAsk] = useState(0);
  // True once the answer came from the first-run form: the verdict takes focus when it replaces the form.
  const [fromSetup, setFromSetup] = useState(false);
  const short = (iso: string) => firstOf(fmt.date(iso, { month: 'short', day: 'numeric', year: 'numeric' }), lang);

  const detailFor = (d: Details) => {
    const r = compute(d, today);
    return t('presence.savedDetail', {
      total: days(fmt, r?.total ?? 0),
      need: fmt.number(r?.required ?? 1095),
      count: d.trips.length,
    });
  };
  const update = (patch: Partial<Details>) => {
    const next = { ...details, ...patch };
    setEdits(next);
    setChange(changeBetween(result, compute(next, today)));
    if (saved) save(next, { detail: detailFor(next) });
  };

  const rowRef = (id: string, el: HTMLLIElement | null) => {
    if (el) rowEls.current.set(id, el);
    else rowEls.current.delete(id);
  };
  const revealTrip = (id: string) => rowEls.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  const shell = {
    icon: CalendarDays,
    tone: 'pine' as const,
    title: t('presence.title'),
    subtitle: t('presence.subtitle'),
    badge: (
      <Badge icon={Smartphone} mono>
        {t('badge.device')}
      </Badge>
    ),
    // Sources and the official calculator follow the reader's language, even after a switch.
    sources: output.lang === lang ? output.sources : presenceSources(lang),
    className: '@container',
  };

  if (!result) {
    return (
      <WidgetShell {...shell}>
        <Setup
          today={today}
          onDone={(prDate, tempStart) => {
            setFromSetup(true);
            update({ prDate, tempStart });
          }}
        />
        <div className="mt-6 px-5 sm:px-6">
          <AlsoNeeded />
        </div>
        {/* No actions yet, so the privacy line gets the same rule and rhythm as the actions footer. */}
        <p className="m-0 mt-3 border-t border-hair px-5 py-4 text-[13px] leading-snug text-ink-3 sm:px-6">{t('presence.footnote')}</p>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      {...shell}
      handoff={{
        href: URLS.calculator[lang],
        label: t('presence.handoff'),
      }}
      secondaryAction={
        <>
          <Button
            icon={saved ? BookmarkCheck : Bookmark}
            size="lg"
            className="max-sm:w-full"
            onClick={() => {
              save(details, { detail: detailFor(details) });
              setSavedNow(true);
            }}
          >
            {saved ? t('presence.saved') : t('presence.save')}
          </Button>
          <span role="status" className="sr-only">
            {savedNow ? t('presence.savedStatus') : ''}
          </span>
        </>
      }
      // One block of small print under the buttons: what this number is, then the privacy line.
      footnote={
        <>
          <span className="block leading-snug text-pretty">{t('presence.estimate')}</span>
          <span className="mt-1.5 block leading-snug text-pretty">{t('presence.footnote')}</span>
        </>
      }
    >
      <Hero result={result} change={change} headingRef={fromSetup ? focusOnMount : undefined} />
      {output.input.prDateMonthOnly && details.prDate === output.input.prDate ? (
        <div className="px-5 pt-3 sm:px-6">
          <p className="m-0 flex gap-2 text-[13.5px] leading-snug text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
            <span>
              {t('presence.approx', {
                date: firstOf(
                  fmt.date(details.prDate!, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  lang,
                ),
              })}
            </span>
          </p>
          <button
            type="button"
            className="ms-6 inline-flex min-h-11 items-center text-[13.5px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink-2"
            onClick={() => {
              // The field lives in the "Your dates" disclosure: open it, and the field takes focus as it mounts.
              setDatesOpen(true);
              setPrAsk((n) => n + 1);
            }}
          >
            {t('presence.approxEdit')}
          </button>
        </div>
      ) : null}
      <WindowChart result={result} prDate={details.prDate!} tempStart={details.tempStart} active={activeTrip} onActive={setActiveTrip} onReveal={revealTrip} />

      {result.temp.capped || result.prAfterApply ? (
        <div className="px-5 pt-5 sm:px-6">
          {result.prAfterApply ? (
            <Notice tone="warn" title={t('presence.notice.prAfter')}>
              {t('presence.notice.prAfterBody')}
            </Notice>
          ) : (
            <Notice tone="info" title={t('presence.notice.capped')}>
              {t('presence.notice.cappedBody')}
            </Notice>
          )}
        </div>
      ) : null}

      <Trips result={result} trips={details.trips} onChange={(trips) => update({ trips })} active={activeTrip} onActive={setActiveTrip} rowRef={rowRef} />
      <div className="mt-6 px-5 sm:px-6">
        <Disclosure
          title={t('presence.details.title')}
          open={datesOpen}
          onOpenChange={(open) => {
            setDatesOpen(open);
            setPrAsk(0);
          }}
          summary={
            <bdi>
              {[
                t('presence.details.sumPr', { date: short(details.prDate!) }),
                details.applyDate ? t('presence.details.sumApply', { date: short(details.applyDate) }) : t('presence.details.sumToday'),
                details.tempStart ? t('presence.details.sumTemp', { date: short(details.tempStart) }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </bdi>
          }
        >
          {/* Mounted while open only, so the PR date can take focus on mount when "Enter the exact date" opened it. */}
          {datesOpen ? (
            <div className="pb-4">
              <DatesFields key={prAsk} details={details} today={today} onChange={update} focusPr={prAsk > 0} />
            </div>
          ) : null}
        </Disclosure>
        <AlsoNeeded />
      </div>
    </WidgetShell>
  );
}
