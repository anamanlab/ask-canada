'use client';
/**
 * Campsite reservation helper: what can be reserved in the park, when reservations open, how launch day
 * works, fees, and a launch-day checklist saved on this device. Booking and payment hand off to the
 * Parks Canada Reservation Service.
 */
import { useState } from 'react';
import { Smartphone, Tent } from 'lucide-react';
import { Badge, ExternalLink, LiveRegion, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { campgroundName } from './campground-names';
import { Fees, HowSteps, LaunchChecklist } from './CampingParts';
import { PARKS, RESERVATION, hasReservations, parkById, staysOnly, type Park } from './data';
import { KM, useDateText, useFooterSources, useLang } from './hooks';
import messages from './messages';
import { distanceKm, type CampingOutput } from './model';
import { ParkScene, SceneTile } from './ParkScene';
import { URLS, parkUrls } from './urls';

export default function CampingPlanner({ data }: { data: CampingOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const footerSources = useFooterSources(data.sources);
  const { fmt } = useLocale();
  const initial = parkById(data.park?.id);
  const [id, setId] = useState<string | undefined>(initial && hasReservations(initial) ? initial.id : undefined);
  const park = parkById(id);
  const camps = park?.campgrounds?.length ?? 0;
  const stays = park ? staysOnly(park) : null;
  // With a park chosen, suggest the closest other parks with camping; otherwise the tool's ranking (nearest
  // to the place, or to the park that has no campgrounds), with straight-line distances.
  const options: { p: Park; km?: number }[] = park
    ? PARKS.filter((p) => p.campgrounds?.length && p.id !== park.id)
        .map((p) => ({ p, km: Math.round(distanceKm(park, p)) }))
        .sort((a, b) => a.km - b.km)
    : data.options.length
      ? data.options.flatMap((o) => {
          const p = parkById(o.id);
          return p ? [{ p, km: o.km }] : [];
        })
      : PARKS.filter((p) => p.campgrounds?.length).map((p) => ({ p }));

  // Launch time for the park on the card: Newfoundland and Labrador parks open at 8:30 am, every other park at 8 am.
  const launchTime = park?.prov === 'nl' ? t('camp.time830') : t('camp.time8');

  const title = park ? t('camp.titlePark', { park: park.short[lang] }) : t('camp.title');
  const summary = park ? (stays ? t(`camp.subStays.${stays}`) : t('camp.subPark', { count: camps })) : t('camp.sub');

  return (
    <WidgetShell
      iconNode={park ? <SceneTile land={park.land[0]} seed={park.id} /> : undefined}
      icon={park ? undefined : Tent}
      tone="glacier"
      title={title}
      // Isolated: a subtitle that starts with a number keeps its order in right-to-left text.
      subtitle={park ? <bdi>{summary}</bdi> : summary}
      badge={<Badge icon={Smartphone} mono>{t('badge.device')}</Badge>}
      sources={footerSources}
      handoff={{ href: URLS.reservationService[lang], label: t('handoff.reserve'), note: t('handoff.reserveNote') }}
      footnote={t('camp.footnote')}
      className="@container"
    >
      {data.unknown ? (
        <div className="px-5 pb-3 sm:px-6">
          <Notice tone="info" title={t('notice.unknownPark', { name: data.unknown })}>
            {t('camp.pickBody')}
          </Notice>
        </div>
      ) : initial && !hasReservations(initial) ? (
        <div className="px-5 pb-3 sm:px-6">
          <Notice tone="info" title={t('camp.noneTitle', { park: initial.short[lang] })}>
            {t('camp.noneBody')}{' '}
            <ExternalLink href={parkUrls(initial, lang).home} className="text-inherit">
              {t('camp.parkPage')}
            </ExternalLink>
          </Notice>
        </div>
      ) : null}

      {park ? <ParkPlan park={park} today={data.today} time={launchTime} /> : null}
      {/* Picking another park rewrites the card: say which park it now shows ("Camping in Jasper. 4 reservable campgrounds"). */}
      <LiveRegion text={park ? `${title}. ${summary}` : ''} delay={300} />

      <WidgetSection title={park ? t('camp.other') : t('camp.pick')}>
        {/* Phones: a two-column grid of equal cells (name over distance). Wider containers: a row of pills. */}
        <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 @xl:flex @xl:flex-wrap @xl:gap-2">
          {options.slice(0, park ? 8 : 18).map(({ p, km }) => (
            <li key={p.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={p.id === id}
                onClick={() => setId(p.id)}
                className={cn(
                  'flex h-full min-h-[52px] w-full items-center gap-1.5 rounded-field border py-1.5 pe-1.5 ps-1.5 text-start text-ink transition-colors @xl:min-h-11 @xl:w-auto @xl:gap-2.5 @xl:rounded-chip @xl:pe-4',
                  p.id === id ? 'border-ink bg-card shadow-sm' : 'border-hair bg-card hover:border-hair-2',
                )}
              >
                <SceneTile land={p.land[0]} size={28} seed={p.id} />
                <span className="flex min-w-0 flex-col @xl:flex-row @xl:items-center @xl:gap-2">
                  {/* Park names break at their own hyphens and spaces, never mid-word (no automatic hyphenation). */}
                  <span className="text-[14px] font-medium leading-snug [overflow-wrap:anywhere] @xl:text-[14.5px]">{p.short[lang]}</span>
                  {km != null ? (
                    <span className="font-mono text-[11.5px] leading-snug text-ink-3">
                      <bdi dir="ltr" className="whitespace-nowrap">{fmt.number(km, KM)}</bdi>
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </WidgetSection>

      <WidgetSection title={t('camp.how')}>
        <HowSteps
          steps={[
            { title: t('camp.step1'), detail: t('camp.step1d', { min: RESERVATION.queueOpensMinutes }) },
            { title: t('camp.step2', { time: launchTime }), detail: park ? t('camp.step2d') : t('camp.step2dAny') },
            { title: t('camp.step3'), detail: t('camp.step3d', { min: RESERVATION.turnMinutes }) },
            { title: t('camp.step4'), detail: t('camp.step4d') },
          ]}
        />
      </WidgetSection>

      <LaunchChecklist time={launchTime} />

      <WidgetSection title={t('camp.fees')}>
        <Fees />
      </WidgetSection>
    </WidgetShell>
  );
}

function ParkPlan({ park, today: answered, time }: { park: Park; today: string; time: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  const date = useDateText();
  // The reader's own date: an answer reopened in December must not still say "not posted yet".
  const today = useToday(answered);
  const datesDue = today >= RESERVATION.nextSeasonDatesFrom;
  const launch = park.launch2026;
  const early = park.launchEarly;
  const camps = park.campgrounds?.length ?? 0;
  const long = { weekday: 'long', month: 'long', day: 'numeric' } as const;
  return (
    <div className="px-5 sm:px-6">
      <div className="relative overflow-hidden rounded-card border border-hair">
        <ParkScene land={park.land[0]} night className="h-[120px] w-full" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-card via-card/80 to-transparent px-4 pb-4 sm:px-5">
          <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">{t('camp.nextSeason', { year: String(RESERVATION.nextSeason) })}</p>
          <p className="m-0 mt-0.5 font-serif text-[24px] leading-[1.15] tracking-[-.02em] text-ink">{datesDue ? t('camp.checkDates') : t('camp.notYet')}</p>
        </div>
      </div>
      <p className="m-0 mt-3 text-[14.5px] leading-snug text-ink-2">
        {launch
          ? t('camp.lastYear', { park: park.short[lang], date: date(launch, long), time })
          : t('camp.lastYearGeneric')}{' '}
        {early ? `${t('camp.early', { what: early.what[lang], date: date(early.date, long) })} ` : ''}
        {t('camp.window', {
          first: date(RESERVATION.season2026.first, { month: 'long', day: 'numeric' }),
          last: date(RESERVATION.season2026.last, { month: 'long', day: 'numeric' }),
        })}{' '}
        <ExternalLink href={URLS.reserve[lang]}>{t('camp.launchTable')}</ExternalLink>
      </p>
      <div className="mt-3">
        <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{camps ? t('camp.campgrounds', { count: camps }) : t('camp.reservable')}</p>
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
          {park.campgrounds?.map((c) => (
            <li key={c} className="rounded-chip border border-hair bg-paper-2/60 px-3 py-1.5 text-[13.5px] text-ink">
              {campgroundName(c, lang)}
            </li>
          ))}
          {park.backcountry ? <li className="rounded-chip border border-dashed border-hair-2 px-3 py-1.5 text-[13.5px] text-ink-2">{t('camp.backcountry')}</li> : null}
          {park.otentik ? <li className="rounded-chip border border-dashed border-hair-2 px-3 py-1.5 text-[13.5px] text-ink-2">{t('camp.otentik')}</li> : null}
        </ul>
        {park.firstCome?.length ? (
          <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-2">{t('camp.firstCome', { name: park.firstCome.map((c) => campgroundName(c, lang)).join(', ') })}</p>
        ) : null}
        {/* An inline link: a long label wraps as text and the arrow stays with its last word. */}
        <p className="m-0 mt-1 text-[13.5px] leading-snug">
          <ExternalLink href={parkUrls(park, lang).camping}>{t('camp.parkCamping', { park: park.short[lang] })}</ExternalLink>
        </p>
      </div>
    </div>
  );
}
