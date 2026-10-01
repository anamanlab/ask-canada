'use client';
/**
 * Travel health (renders `healthTravel`): the live Public Health Agency of Canada notices for a destination,
 * the level on a 4-step scale, and "see a travel clinic about 6 weeks before" as a countdown the person
 * can set to their own departure date (saved on this device only, if they choose).
 */
import { ArrowUpRight, Globe2, MapPinOff, Plane, WifiOff } from 'lucide-react';
import { ExternalLink, LinkButton, Notice, Skeleton, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { inLang, OFFICIAL, type Lang } from './facts';
import messages from './messages';
import { DotList, HERO_BOX, Lines, LiveBadge, rows, ShellSkeleton, TEXT, useDayLabel, useLang } from './shared';
import { noticeName, topicOf, type ThnLevel, type ThnNotice, type TravelOutput } from './travel';
import { COUNTDOWN_GRID, TravelCountdown } from './TravelCountdown';

const LEVEL_BG: Record<ThnLevel, string> = { 1: 'bg-glacier', 2: 'bg-amber', 3: 'bg-maple', 4: 'bg-maple-ink' };
const HERO: Record<ThnLevel, string> = {
  1: 'border-glacier/15 bg-glacier-wash',
  // Dark: amber at 12% over navy turns grey, so level 2 gets a warmer fill and a clearer amber edge there.
  2: 'border-amber/20 bg-amber-wash dark:border-amber/50 dark:bg-amber/[.22]',
  3: 'border-maple/20 bg-maple-wash',
  4: 'border-maple/30 bg-maple-wash',
};
const LEVEL_CHIP: Record<ThnLevel, string> = {
  1: 'bg-glacier-wash text-glacier',
  2: 'bg-amber-wash text-amber',
  3: 'bg-maple-wash text-maple-ink',
  4: 'bg-maple text-paper',
};

export function TravelHealth({ part }: WidgetProps<{ destination?: string }, TravelOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('travel.error.title')} message={t('travel.error.body')} fallback={{ href: OFFICIAL.thn[lang], label: t('travel.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <TravelSkeleton place={Boolean(part.input?.destination)} />;
  }
  return <Travel data={inLang(part.output, lang)} />;
}

/**
 * A destination result with bars for text: the level panel, the clinic countdown, three notices and the
 * advisories line. Boxes, paddings, gaps and section titles are the result's own; only the number of text lines
 * is assumed (longer on a phone).
 */
function TravelSkeleton({ place }: { place: boolean }) {
  const t = useMessages(messages);
  const fr = useLang() === 'fr';
  return (
    <ShellSkeleton title={t(place ? 'travel.title.short' : 'travel.title')} subtitle={t('travel.subtitle')} icon={Plane} tone="glacier" label={t('travel.loading')} heights={{ source: 'max-sm:h-[83px]' }}>
      <div className={cn(HERO_BOX, 'border-hair')}>
        <div className={HERO_ROW}>
          <div className={HERO_TEXT}>
            <Lines line={TEXT.label} rows={['w-36']} />
            {/* « Prendre des précautions sanitaires spéciales » takes two lines even on desktop. */}
            <Lines line={TEXT.level} rows={rows(2, fr ? 2 : 1)} className="mt-1.5" />
            <Lines line={TEXT.notice} rows={rows(2, 1)} className="mt-1.5" />
          </div>
          <div className={HERO_SCALE}>
            <Skeleton className="h-2.5 w-full" round />
            <Lines line="h-[16.5px]" rows={['w-full']} className="mt-1.5" />
          </div>
        </div>
      </div>
      <WidgetSection title={t('travel.when.title')}>
        <div className={COUNTDOWN_GRID}>
          <div className="flex items-start gap-3.5">
            <Skeleton className="size-11 shrink-0 rounded-field" />
            <div className="min-w-0 flex-1">
              <Lines line={TEXT.head} rows={rows(2, 1)} />
              <Lines line={TEXT.sub} rows={rows(fr ? 5 : 3, fr ? 4 : 3)} className="mt-1" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Lines line="h-[21px]" rows={['w-36']} />
            <Skeleton className="h-[44.7px] w-full rounded-field" />
          </div>
        </div>
      </WidgetSection>
      <WidgetSection title={t('travel.notices.place', { count: 3 })}>
        <div className="grid gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={cn(NOTICE_CARD, 'border-hair')}>
              <div className={NOTICE_BODY}>
                <Skeleton className="h-[25px] w-[66px] shrink-0 @md:mt-0.5" round />
                <div className="min-w-0 flex-1 self-stretch">
                  {/* « Chikungunya : Conseils à l’intention des voyageurs » wraps on a phone; the last notice (all destinations) has a longer second line. */}
                  <Lines line={TEXT.body} rows={rows(fr ? 2 : 1, 1)} />
                  <Lines line={TEXT.small} rows={rows(i === 2 ? 2 : 1, 1)} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Lines line={TEXT.small} rows={rows(2, 1)} className="mt-3" />
      </WidgetSection>
      <Lines line="h-[18.56px]" rows={rows(fr ? 4 : 3, fr ? 2 : 1)} className="px-5 pt-4 sm:px-6" />
    </ShellSkeleton>
  );
}

/** Layout classes the result and its placeholder share, so the two can't drift apart. */
const HERO_ROW = 'flex flex-wrap items-end justify-between gap-x-6 gap-y-4';
const HERO_TEXT = 'min-w-[220px] flex-1';
const HERO_SCALE = 'w-full shrink-0 @xl:w-[200px]';
const NOTICE_CARD = 'flex items-start gap-3 rounded-tile border px-3.5 py-3';
const NOTICE_BODY = 'flex min-w-0 flex-1 flex-col items-start gap-1.5 @md:flex-row @md:gap-3';

function Travel({ data }: { data: TravelOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const place = data.destination;
  const lvl = data.highestLevel;
  const top = data.notices[0];
  const today = useToday(data.fetchedAt.slice(0, 10));
  const day = useDayLabel(today);
  // The notices keep the language they were fetched in. When the interface is in the other one (the reader
  // switched language after the answer), the level's reason names the notice instead of weaving its title into a
  // sentence: no « En raison measles. », no "Because of rougeole.".
  const sameLang = data.lang === lang;
  // travel.gc.ca answered but its table couldn't be read: not the same thing as a site that is down.
  const unreadable = data.offline === 'unreadable';

  return (
    <WidgetShell
      icon={Plane}
      tone="glacier"
      title={place ? t('travel.title.place', { place }) : t('travel.title')}
      subtitle={t('travel.subtitle')}
      badge={<LiveBadge live={data.live} at={data.fetchedAt} />}
      sources={data.sources}
      handoff={{ href: data.urls.clinic, label: t('travel.handoff'), note: t('travel.handoffNote') }}
      secondaryAction={
        <LinkButton href={data.urls.vaccines} external variant="secondary" size="lg" className="max-sm:w-full">
          {t('travel.vaccines')}
        </LinkButton>
      }
      className="@container"
    >
      {!data.live ? (
        <div className="px-5 sm:px-6">
          <Notice tone="warn" icon={WifiOff} title={t(unreadable ? 'travel.unreadable.title' : 'travel.offline.title')}>
            {t(unreadable ? 'travel.unreadable.body' : 'travel.offline.body')}{' '}
            <ExternalLink href={data.urls.notices}>{t('travel.offline.link')}</ExternalLink>
          </Notice>
        </div>
      ) : (
        <>
          {data.unknownDestination ? (
            <div className="px-5 sm:px-6">
              <Notice tone="info" icon={MapPinOff} title={t('travel.unknown.title', { query: data.query ?? '' })}>
                {t('travel.unknown.body')}
              </Notice>
            </div>
          ) : null}
          {place && lvl ? <LevelHero level={lvl} top={top} count={data.notices.length} lang={sameLang ? lang : null} place={place} /> : null}
          {!place && !data.unknownDestination ? (
            <p className="m-0 px-5 text-[15px] leading-snug text-ink-2 sm:px-6">
              {/* Starts with a number: isolated, so a right-to-left page keeps "9 travel health notices…" in order. */}
              <bdi>{t('travel.all.intro', { count: data.totalNotices })}</bdi>
            </p>
          ) : null}
        </>
      )}

      <TravelCountdown destination={place} travelDate={data.travelDate} today={today} day={day} />

      {data.live && data.notices.length ? (
        <WidgetSection title={place ? t('travel.notices.place', { count: data.notices.length }) : t('travel.notices.all')}>
          {place && data.specific === 0 ? (
            <p className="m-0 mb-3 text-[14.5px] leading-snug text-ink-2">{t('travel.notices.onlyGlobal', { place, count: data.notices.length })}</p>
          ) : null}
          <ul className="m-0 grid list-none gap-2 p-0">
            {data.notices.map((n) => (
              <NoticeRow key={n.id} n={n} showWhere={!place} updated={day(n.updated)} lang={data.lang} />
            ))}
          </ul>
          <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('travel.notices.note')}</p>
        </WidgetSection>
      ) : null}

      <div className="px-5 pt-4 sm:px-6">
        <p className="m-0 text-[13.5px] leading-snug text-ink-2">
          {t('travel.advisories')}{' '}
          <ExternalLink href={data.urls.advisories}>{t('travel.advisoriesLink')}</ExternalLink>
        </p>
      </div>
    </WidgetShell>
  );
}

/** `lang`: the language the notice titles and the interface share, or null when they differ. */
function LevelHero({ level, top, count, lang, place }: { level: ThnLevel; top?: ThnNotice; count: number; lang: Lang | null; place: string }) {
  const t = useMessages(messages);
  const name = top ? noticeName(top.title, place) : '';
  const others = count - 1;
  // One notice: "Because of chikungunya." (« En raison du chikungunya. ») when the title can be woven into the
  // sentence, else the notice by its name ("Notice: Measles").
  const why = !top ? null : others === 0 && !lang ? t('travel.level.only', { name }) : t('travel.level.because', { ...topicOf(top.title, lang ?? 'en'), name, level: top.level, count: others });
  return (
    <div className={cn(HERO_BOX, HERO[level])}>
      <div className={HERO_ROW}>
        <div className={HERO_TEXT}>
          <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">{t('travel.level.label', { level })}</p>
          <p className="m-0 mt-1.5 font-serif text-[26px] leading-[1.12] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">{t(`travel.level.${level}`)}</p>
          <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{why}</p>
        </div>
        <div className={HERO_SCALE} aria-hidden>
          <div className="grid grid-cols-4 gap-1">
            {([1, 2, 3, 4] as ThnLevel[]).map((l) => (
              <span key={l} className={cn('h-2.5 rounded-full', l <= level ? LEVEL_BG[l] : 'bg-hair-2')} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1 font-mono text-[11px] text-ink-3">
            {[1, 2, 3, 4].map((l) => (
              <span key={l} className={cn('text-center', l === level && 'font-semibold text-ink')}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only">{t('travel.level.sr', { level })}</p>
    </div>
  );
}

/** The source mixes "Dengue: Conseils" and "Chikungunya : Conseils"; French gets its non-breaking space before the colon. */
const tidyTitle = (title: string, lang: Lang) =>
  (lang === 'fr' ? title.replace(/\s*:\s+/, '\u00a0: ') : title).replace(/'/g, '’');

function NoticeRow({ n, showWhere, updated, lang }: { n: ThnNotice; showWhere: boolean; updated: string; lang: Lang }) {
  const t = useMessages(messages);
  const where = n.global ? t('travel.notices.everywhere') : n.locations.length > 4 ? t('travel.notices.places', { list: n.locations.slice(0, 3).join(', '), count: n.locations.length - 3 }) : n.locations.join(', ');
  return (
    <li>
      {/* The whole card is the link: ExternalLink supplies the new-tab wording and rel, the card its own look. */}
      <ExternalLink
        href={n.url}
        icon={false}
        className={cn(NOTICE_CARD, 'border-hair bg-card font-normal no-underline shadow-sm transition hover:-translate-y-px hover:border-hair-2 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none')}
      >
        {/* Phones: the level chip sits above the title so the title gets the full width. */}
        <span className={NOTICE_BODY}>
          <span className={cn('inline-flex min-w-[66px] shrink-0 items-center justify-center rounded-full px-2 py-1 font-mono text-[11.5px] font-semibold @md:mt-0.5', LEVEL_CHIP[n.level])}>
            {t('travel.level.short', { level: n.level })}
          </span>
          <span className="min-w-0 flex-1 self-stretch">
            <bdi className="block text-[15px] font-medium leading-snug text-ink">{tidyTitle(n.title, lang)}</bdi>
            <DotList
              className="mt-1 block text-[13px] leading-snug text-ink-3"
              items={[
                showWhere || n.global ? (
                  <span key="w" className="inline-flex min-w-0 items-center">
                    {n.global ? <Globe2 className="me-1 size-3.5 shrink-0" aria-hidden /> : null}
                    <bdi>{where}</bdi>
                  </span>
                ) : null,
                <span key="u" className="whitespace-nowrap">
                  {t('travel.notices.updated', { date: updated })}
                </span>,
              ].filter(Boolean)}
            />
          </span>
        </span>
        <ArrowUpRight className="mt-1 size-[18px] shrink-0 text-ink-3 flip-rtl" aria-hidden />
      </ExternalLink>
    </li>
  );
}
