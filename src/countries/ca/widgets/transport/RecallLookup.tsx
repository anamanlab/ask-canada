'use client';
/**
 * Vehicle recall lookup (transportRecalls): live Transport Canada recalls for one make/model/year, a per-year
 * chart when the year is missing, and the VIN check the person must do on the manufacturer's own lookup.
 */
import { AlertTriangle, CarFront, CircleCheck, Hash, Phone, SearchX } from 'lucide-react';
import { Badge, Chip, Disclosure, ExternalLink, LinkButton, Notice, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useNow, useToday } from '@/lib/hooks';
import { dateFormat } from '@/lib/i18n/format';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { cn } from '@/lib/cn';
import type { WidgetProps } from '@/lib/widgets/types';
import { OFFICIAL } from './constants';
import { Hero } from './hero';
import { TelLink } from './links';
import messages from './messages';
import { RecallCard } from './recall-card';
import { Years } from './recall-years';
import { isRecent, type Recall, type RecallsInput, type RecallsOutput } from './recalls';
import { Bullets, SLOT, ordinals, rich, useDay } from './shared';
import { ToolSkeleton } from './skeleton';

const INITIAL = 4;

/**
 * "Read at 10:02 a.m. EDT" is a clock time, so it depends on the time zone. The server render and hydration use
 * the capital's zone; once the reader's clock takes over, so does the reader's own zone (no mismatch).
 */
const SERVER_ZONE = 'America/Toronto';
/** The calendar day (YYYY-MM-DD) an instant falls on in `timeZone` (the device's when undefined). */
const dayOf = (instant: number, timeZone?: string) => dateFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(instant);

/**
 * When the database was read, against the reader's own date. An answer reopened days later is no longer "live":
 * the badge and the freshness line then name the day, and "New" / "in the last 12 months" count back from today.
 */
function useFreshness(fetchedAt: string) {
  const read = Date.parse(fetchedAt);
  // `useNow` answers with the reading's own instant on the server and during hydration, then with the device's clock.
  const onDevice = useNow(read) !== read;
  const timeZone = onDevice ? undefined : SERVER_ZONE;
  const today = useToday(dayOf(read, SERVER_ZONE));
  const fetchedOn = dayOf(read, timeZone);
  return { today, fetchedOn, stale: today !== fetchedOn, timeZone };
}
type Freshness = ReturnType<typeof useFreshness>;

export function RecallLookup({ part }: WidgetProps<RecallsInput, RecallsOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('recalls.error.title')} message={t('recalls.error.body')} fallback={{ href: OFFICIAL.recallsDb[locale === 'fr' ? 'fr' : 'en'], label: t('recalls.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ToolSkeleton title={t('recalls.title')} subtitle={t('recalls.loading')} icon={CarFront} tone="maple" label={t('recalls.loading')} blocks={['heroTall', 'cards', 'tiles3', 'actions', 'footer']} />;
  }
  return <Recalls data={part.output} />;
}

function Recalls({ data }: { data: RecallsOutput }) {
  const t = useMessages(messages);
  const day = useDay();
  const fresh = useFreshness(data.fetchedAt);
  const vehicle = t('recalls.vehicle', { year: data.year ? String(data.year) : '', make: data.make ?? '', model: data.model ?? '' }).replace(/\s+/g, ' ').trim();
  const handoff =
    data.maker?.url && (data.status === 'found' || data.status === 'none')
      ? { href: data.maker.url, label: t('recalls.handoff.vin'), note: t('recalls.handoff.vinNote', { maker: data.maker.name }) }
      : // No note here: with two buttons beside it, a one-line note would only repeat the button's own label.
        { href: data.links.database, label: t('recalls.handoff.db') };
  return (
    <WidgetShell
      icon={CarFront}
      tone="maple"
      title={t('recalls.title')}
      subtitle={vehicle ? rich(t('recalls.subtitle', { vehicle: SLOT }), <bdi>{vehicle}</bdi>) : t('recalls.subtitleGeneric')}
      badge={
        data.status === 'need-vehicle' ? null : !data.live ? (
          <Badge tone="warn">{t('common.offline')}</Badge>
        ) : fresh.stale ? (
          <Badge>{ordinals(t('recalls.checked', { date: day(fresh.fetchedOn, { month: 'short', day: 'numeric' }) }))}</Badge>
        ) : (
          <Badge tone="live">{t('common.live')}</Badge>
        )
      }
      // A reading from an earlier day isn't live any more: the footer then shows the day it was checked.
      sources={fresh.stale ? data.sources.map((src) => (src.live ? { ...src, live: false, checked: fresh.fetchedOn } : src)) : data.sources}
      handoff={handoff}
      secondaryAction={
        <LinkButton href={data.links.report} external variant="secondary" size="lg" className="max-sm:w-full">
          {t('recalls.report')}
        </LinkButton>
      }
      className="@container"
    >
      {data.status === 'found' ? <Found data={data} vehicle={vehicle} fresh={fresh} /> : null}
      {data.status === 'none' ? <None data={data} vehicle={vehicle} /> : null}
      {data.status === 'need-year' ? <Years data={data} /> : null}
      {data.status === 'need-vehicle' ? <NeedVehicle /> : null}
      {data.status === 'unavailable' ? <Unavailable data={data} /> : null}
      {data.status === 'found' || data.status === 'none' ? <VinCheck data={data} /> : null}
    </WidgetShell>
  );
}

function Found({ data, vehicle, fresh }: { data: RecallsOutput; vehicle: string; fresh: Freshness }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const day = useDay();
  const { today, stale } = fresh;
  const time = fmt.date(new Date(data.fetchedAt), { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: fresh.timeZone });
  const newest = data.recalls[0];
  const recent = data.recalls.filter((r) => isRecent(r.date, today)).length;
  const older = data.recalls.slice(INITIAL);
  const span = (list: Recall[]) => {
    const [to, from] = [list[0].date.slice(0, 4), list[list.length - 1].date.slice(0, 4)];
    return from === to ? to : `${from}–${to}`;
  };
  return (
    <>
      <Hero
        tone="alert"
        icon={AlertTriangle}
        title={rich(t(data.truncated ? 'recalls.found.titleMore' : 'recalls.found.title', { count: data.total, vehicle: SLOT }), <bdi>{vehicle}</bdi>)}
        sub={newest ? ordinals(t('recalls.found.sub', { date: day(newest.date, { month: 'long', day: 'numeric', year: 'numeric' }) })) : null}
      >
        {recent || data.live ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* A wrapping chip, not the one-line Badge: the French count must never be cut short. */}
            {recent ? (
              <span className="max-w-full text-balance rounded-[12px] bg-maple-wash px-2.5 py-1 text-[12.5px] font-medium leading-snug text-maple-ink tabular-nums">
                {t('recalls.found.recent', { count: recent })}
              </span>
            ) : null}
            {data.live ? (
              <p className="m-0 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-2 tabular-nums">
                <span className={cn('mt-[6px] size-1.5 shrink-0 rounded-full', stale ? 'bg-ink-3' : 'bg-pine')} aria-hidden />
                <span className="min-w-0 text-pretty">
                  {stale ? ordinals(t('recalls.freshOn', { date: day(fresh.fetchedOn, { month: 'short', day: 'numeric', year: 'numeric' }), time })) : t('recalls.fresh', { time })}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </Hero>
      {data.truncated ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" title={t('recalls.cut.title')}>
            {t('recalls.cut.body', { count: data.recalls.length })}{' '}
            <ExternalLink href={data.links.database}>
              {t('recalls.cut.link')}
            </ExternalLink>
          </Notice>
        </div>
      ) : null}
      <WidgetSection title={t('recalls.list.title')} aside={<span className="text-[13px] tabular-nums text-ink-3">{t('recalls.list.count', { count: data.total })}</span>}>
        <RecallList recalls={data.recalls.slice(0, INITIAL)} today={today} openFirst />
        {older.length ? (
          <Disclosure
            className="mt-3"
            title={t('recalls.list.older')}
            count={older.length}
            summary={<bdi dir="ltr">{span(older)}</bdi>}
            lazy
          >
            <RecallList recalls={older} today={today} />
          </Disclosure>
        ) : null}
      </WidgetSection>
    </>
  );
}

/** A quiet timeline rail ties the notices together, newest at the top. */
function RecallList({ recalls, today, openFirst }: { recalls: Recall[]; today: string; openFirst?: boolean }) {
  return (
    <ul className="relative m-0 grid list-none gap-2.5 p-0 ps-6 before:absolute before:bottom-6 before:start-[5px] before:top-6 before:w-px before:bg-hair-2 before:content-['']">
      {recalls.map((r, i) => (
        <RecallCard key={r.id} r={r} defaultOpen={!!openFirst && i === 0} today={today} />
      ))}
    </ul>
  );
}

function None({ data, vehicle }: { data: RecallsOutput; vehicle: string }) {
  const t = useMessages(messages);
  return (
    <>
      <Hero tone="info" icon={SearchX} title={t('recalls.none.title', { vehicle })} sub={t('recalls.none.sub')} />
      <WidgetSection title={t('recalls.none.tips')}>
        <Bullets
          items={[
            t('recalls.none.tip1', { model: data.model ?? '' }),
            t('recalls.none.tip2'),
            <ExternalLink key="db" href={data.links.database}>
              {t('recalls.none.tip3')}
            </ExternalLink>,
          ]}
        />
      </WidgetSection>
    </>
  );
}

function NeedVehicle() {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const examples = [t('recalls.need.ex1'), t('recalls.need.ex2'), t('recalls.need.ex3')];
  return (
    <>
      <Hero tone="info" icon={CarFront} title={t('recalls.need.title')} sub={t('recalls.need.sub')} />
      <div className="flex flex-wrap gap-2 px-5 pt-4 sm:px-6">
        {examples.map((e) => (
          <Chip key={e} onClick={() => send(t('recalls.need.ask', { vehicle: e }))} icon={CarFront}>
            {e}
          </Chip>
        ))}
      </div>
    </>
  );
}

function Unavailable({ data }: { data: RecallsOutput }) {
  const t = useMessages(messages);
  return (
    <div className="px-5 sm:px-6">
      <Notice tone="warn" title={t('recalls.down.title')} live>
        {t('recalls.down.body')}
      </Notice>
      <div className="mt-2 text-[14px]">
        <TelLink number={data.phones.defects} icon={Phone} />
      </div>
    </div>
  );
}

function VinCheck({ data }: { data: RecallsOutput }) {
  const t = useMessages(messages);
  return (
    <WidgetSection title={t('recalls.vin.title')}>
      <ol className="m-0 grid list-none gap-3 p-0 @xl:grid-cols-3">
        {[
          { icon: Hash, title: t('recalls.vin.s1'), body: t('recalls.vin.s1b') },
          {
            icon: CarFront,
            title: data.maker ? t('recalls.vin.s2', { maker: data.maker.name }) : t('recalls.vin.s2generic'),
            body: data.maker?.phone ? (
              <>
                {t('recalls.vin.s2b')} <TelLink number={data.maker.phone} />
              </>
            ) : (
              t('recalls.vin.s2bGeneric')
            ),
          },
          { icon: CircleCheck, title: t('recalls.vin.s3'), body: t('recalls.vin.s3b') },
        ].map((s, i) => (
          <li key={i} className="h-full rounded-tile border border-hair bg-card px-4 py-3.5">
            <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              <span className="grid size-6 place-items-center rounded-full bg-ink font-mono text-[12px] text-card" aria-hidden>
                {i + 1}
              </span>
              {s.title}
            </span>
            <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-ink-2">{s.body}</p>
          </li>
        ))}
      </ol>
    </WidgetSection>
  );
}
