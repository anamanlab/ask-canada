'use client';
/**
 * Recalls & safety alerts (renders `healthRecalls`). Live notices from recalls-rappels.canada.ca: one headline
 * line, the newest notices as the card's focal point (product, hazard, what to do), the rest as one-line rows
 * grouped by day, filterable by category on the device, with each notice's summary and affected UPC codes one
 * tap away.
 *
 * One filled button per state: with notices listed it is "Get recall alerts" (the next thing to do) and the
 * official list is a link beside it; when there is nothing to show (no match, site unreachable) the official
 * site is the button.
 */
import { useState } from 'react';
import { ArrowUpRight, Car, ChevronDown, Nut, ScanBarcode, SearchCheck, SearchX, ShieldAlert, WifiOff } from 'lucide-react';
import { Button, EmptyState, ExternalLink, LiveRegion, Notice, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { inLang, OFFICIAL } from './facts';
import messages from './messages';
import { RecallFinder } from './RecallFinder';
import { FeaturedNotices } from './RecallFeature';
import { CAT_ICON, RecallRow } from './RecallRow';
import { RecallsSkeleton } from './RecallsSkeleton';
import { RecallsSummary, type Summary } from './RecallsSummary';
import { mergeRepeats, type Merged } from './recall-titles';
import { allergenNotices, allergenOf, RECALL_CATEGORIES, type RecallCategory, type RecallsInput, type RecallsOutput } from './recalls';
import { LiveBadge, useDayLabel, useLang } from './shared';

type Filter = RecallCategory | 'all' | 'allergen';
const VEHICLE_WORDS = /\b(car|cars|vehicle|truck|tires?|tyres?|seat|booster|vin|auto|voiture|véhicule|camion|pneus?|siège|siege)\b/i;
/** Rows under the cards before "Show more", and how many each tap adds. */
const FIRST = 4;
const PAGE = 8;
/** A card goes to the newest notices only: one of the first rows, never a notice from further down the list. */
const LEAD = 4;
/** A week needs at least this many notices to stand as the list on its own. */
const WEEK_MIN = 5;

export function RecallsWidget({ part }: WidgetProps<RecallsInput, RecallsOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('recalls.error.title')} message={t('recalls.error.body')} fallback={{ href: OFFICIAL.recalls[lang], label: t('recalls.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    const q = part.input?.query?.trim() ?? '';
    return <RecallsSkeleton search={Boolean(q)} chips={!q || Boolean(part.input?.allergen) || Boolean(allergenOf(q))} />;
  }
  return <Recalls data={inLang(part.output, lang)} />;
}

function Recalls({ data }: { data: RecallsOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const today = useToday(data.fetchedAt.slice(0, 10));
  const dayLabel = useDayLabel(today);
  const search = data.mode === 'search';
  // One row per product: a warning and its recall a day later are one notice in the list (the newer one, with
  // the earlier one attached), and every number on the card counts those rows: the headline, the bars, the
  // chips, the live sentence and the list itself all agree.
  // The latest notices: when the last 7 days are all in hand, they are the list. A feed that doesn't reach back
  // a week says "30+"; a quiet week shows the latest notices instead.
  const all = mergeRepeats(data.items);
  const week = search ? [] : all.filter((i) => diffDays(i.date, today) <= 6);
  const weekIsList = !search && week.length >= WEEK_MIN;
  const pool = weekIsList ? week : all;
  // For an allergen search ("sesame"), notices about that allergen undeclared come first: the search also finds
  // notices that only mention the word (sesame recalled for Salmonella, a sesame candy with undeclared peanut),
  // still one tap away under "All".
  const allergen = allergenOf(data.query);
  const allergenItems = allergenNotices(pool, data.query);
  const allergenSearch = search && (Boolean(data.allergen) || Boolean(allergen));
  const showAllergen = allergenSearch && allergenItems.length > 0 && allergenItems.length < pool.length;
  const [cat, setCat] = useState<Filter>(showAllergen ? 'allergen' : 'all');
  const [shown, setShown] = useState(FIRST);
  const handoffLabel = search ? t('recalls.handoff.search') : t('recalls.handoff.all');

  const inCategory = (k: RecallCategory) => pool.filter((i) => i.category === k);
  const counts: Record<Filter, number> = {
    all: pool.length,
    allergen: allergenItems.length,
    food: inCategory('food').length,
    health: inCategory('health').length,
    consumer: inCategory('consumer').length,
    vehicles: inCategory('vehicles').length,
  };
  const rows: Merged[] = cat === 'all' ? pool : cat === 'allergen' ? allergenItems : inCategory(cat);
  // The newest notices that carry a summary lead as cards (two for the latest notices, one for a search). The
  // tool fetches the summary of the notices each filter leads with; when one couldn't be read, the next of the
  // first rows takes its card, so a filter keeps a card whenever a summary exists.
  const featured = rows.slice(0, LEAD).filter((r) => r.details).slice(0, search ? 1 : 2);
  const rest = rows.filter((r) => !featured.includes(r));
  // No notice of this filter carries a summary (none could be read): each row opens the official notice, and a line says so.
  const linkOnly = rows.length > 0 && !rows.some((r) => r.details);
  const visible = rest.slice(0, shown);
  const groups = groupByDate(visible, search);

  const newest = pool[0]?.date;
  const summary: Summary = search
    ? // A search whose newest notice is over a year old says so, so an old "Recall" badge isn't read as current.
      { mode: 'search', count: data.total > data.items.length ? data.total : all.length, shown: all.length, query: data.query ?? '', noneRecent: newest ? diffDays(newest, today) > 365 : false }
    : weekIsList
      ? { mode: 'week', count: week.length, plus: week.length >= all.length }
      : { mode: 'latest', count: pool.length };
  const chipLabel = (k: Filter) => (k === 'allergen' && allergen ? t(`recalls.chipAllergen.${allergen}`) : t(`recalls.chip.${k}`));
  const catLabel = (k: Filter) => (k === 'allergen' && allergen ? t(`recalls.chipAllergen.${allergen}`) : t(`recalls.cat.${k}`));
  const showVehicleTip = cat === 'vehicles' || data.category === 'vehicles' || (data.query ? VEHICLE_WORDS.test(data.query) : false);
  const cats = RECALL_CATEGORIES.filter((k) => counts[k] > 0);
  const filters: Filter[] = ['all', ...(showAllergen ? (['allergen'] as const) : []), ...(cats.length > 1 ? cats : [])];
  const listed = data.live && data.items.length > 0;
  const showing = featured.length + visible.length;

  return (
    <WidgetShell
      icon={ShieldAlert}
      tone="maple"
      title={t('recalls.title')}
      subtitle={t('recalls.subtitle')}
      badge={<LiveBadge live={data.live} at={data.fetchedAt} />}
      sources={data.sources}
      handoff={listed ? { href: data.subscribeUrl, label: t('recalls.subscribe') } : { href: data.searchUrl, label: handoffLabel }}
      secondaryAction={
        <ExternalLink href={listed ? data.searchUrl : data.subscribeUrl} standalone className="min-h-11 items-center px-2 text-[15px] max-sm:w-full max-sm:justify-center">
          <span>{listed ? handoffLabel : t('recalls.subscribe')}</span>
        </ExternalLink>
      }
      className="@container"
    >
      {!data.live ? (
        <div className="px-5 sm:px-6">
          <Notice tone="warn" icon={WifiOff} title={t('recalls.offline.title')}>
            {t('recalls.offline.body', { button: handoffLabel })}
          </Notice>
        </div>
      ) : data.items.length === 0 ? (
        <div className="px-5 sm:px-6">
          <EmptyState icon={SearchX} title={t('recalls.empty.title', { query: data.query ?? '' })}>
            {t('recalls.empty.body')}
          </EmptyState>
        </div>
      ) : (
        <>
          {data.broadened ? (
            <div className="px-5 pb-5 sm:px-6">
              <Notice tone="info" icon={SearchCheck} title={t('recalls.broadened.title', { from: data.broadened.from })}>
                {t(data.broadened.any ? 'recalls.broadened.any' : 'recalls.broadened.word', { query: data.query ?? '' })}
              </Notice>
            </div>
          ) : null}
          <RecallsSummary summary={summary} items={pool} newest={newest} today={today} day={dayLabel} featured={featured.length > 0} />

          {filters.length > 1 ? (
            <div role="group" aria-label={t('recalls.filter.label')} className="mt-4 flex flex-wrap gap-2 px-5 sm:px-6">
              {filters.map((k) => {
                const on = cat === k;
                const Icon = k === 'all' ? null : k === 'allergen' ? Nut : CAT_ICON[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setCat(k);
                      setShown(FIRST);
                    }}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[14px] font-medium transition-colors duration-200',
                      on ? 'border-ink bg-ink text-paper shadow-sm' : 'border-hair-2 bg-card text-ink hover:border-ink-3',
                    )}
                  >
                    {Icon ? <Icon className="size-4" strokeWidth={1.8} aria-hidden /> : null}
                    <span aria-hidden>{chipLabel(k)}</span>
                    <span className="sr-only">{catLabel(k)}</span>
                    <span className={cn('font-mono text-[12px] tabular-nums', on ? 'text-paper/70' : 'text-ink-3')}>{fmt.number(counts[k])}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* One short live sentence when a filter or "Show more" changes the list (the list itself isn't live). */}
          <LiveRegion
            delay={300}
            text={showing < rows.length ? t('recalls.showingSome', { filter: catLabel(cat), shown: showing, count: rows.length }) : t('recalls.showing', { filter: catLabel(cat), count: rows.length })}
          />
          {/* Keyed by the filter: a new filter shows other notices, so none of them starts open. */}
          {featured.length ? <FeaturedNotices key={cat} items={featured} label={search ? t('recalls.feature.search') : t('recalls.feature.recent')} day={dayLabel} expand={Boolean(data.expand)} /> : null}
          {linkOnly ? (
            <p className="m-0 mt-6 flex items-start gap-2.5 px-5 text-[14px] leading-snug text-ink-2 sm:px-6">
              <ArrowUpRight className="mt-px size-[18px] shrink-0 text-ink-3 flip-rtl" strokeWidth={1.8} aria-hidden />
              <span>{t('recalls.linkOnly')}</span>
            </p>
          ) : null}
          <div className={cn('px-3 sm:px-4', linkOnly && '[&>section:first-child]:mt-4')}>
            {groups.map((g) => (
              <section key={g.date} className="mt-7" aria-label={search ? fmt.date(g.date, { month: 'long', year: 'numeric' }) : dayLabel(g.date, { weekday: 'long', month: 'long', day: 'numeric', sentenceStart: true })}>
                <h4 className={cn(DAY, 'px-2 pb-1.5')}>{search ? fmt.date(g.date, { month: 'long', year: 'numeric' }) : dayLabel(g.date, { weekday: 'short', month: 'short', day: 'numeric', sentenceStart: true })}</h4>
                <ul className="m-0 list-none p-0">
                  {g.items.map((it) => (
                    <RecallRow key={it.url} item={it} date={search ? dayLabel(it.date, { sentenceStart: true }) : undefined} day={dayLabel} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {rest.length > shown ? (
            <div className="px-3 pt-3 sm:px-4">
              <Button variant="quiet" size="md" icon={ChevronDown} onClick={() => setShown((s) => s + PAGE)}>
                {t('recalls.more', { count: Math.min(PAGE, rest.length - shown) })}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* One callout by the actions: vehicles and car seats have no UPC and aren't thrown out, so they get the
          make, model and VIN advice; everything else, the lot codes. */}
      {showVehicleTip ? (
        <div className="px-5 pt-5 sm:px-6">
          <Notice tone="info" icon={Car} title={t('recalls.vehicle.title')}>
            {t('recalls.vehicle.body')}{' '}
            <ExternalLink href={data.vehicleUrl}>{t('recalls.vehicle.link')}</ExternalLink>
          </Notice>
        </div>
      ) : listed ? (
        // A quiet line, not another tinted box: the notices above are the content.
        <p className="m-0 flex items-start gap-2.5 px-5 pt-6 text-[14px] leading-snug text-ink-2 sm:px-6">
          <ScanBarcode className="mt-px size-[18px] shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden />
          <span>
            <strong className="font-semibold text-ink">{t('recalls.tip.title')}</strong> {t('recalls.tip.body')}
          </span>
        </p>
      ) : null}

      {/* The finder runs a new live search: hide it while the Recalls site isn't answering. */}
      {data.live && (!search || data.items.length === 0) ? <RecallFinder /> : null}
    </WidgetShell>
  );
}

/** Day headings in the body's own voice (small sans), not a third typeface. */
const DAY = 'm-0 text-[13.5px] font-semibold leading-snug text-ink-2';

/** Latest: one group per day. Search results span months or years: one group per month (keyed by its first day). */
function groupByDate(items: Merged[], byMonth: boolean): { date: string; items: Merged[] }[] {
  const groups: { date: string; items: Merged[] }[] = [];
  for (const it of items) {
    const date = byMonth ? `${it.date.slice(0, 7)}-01` : it.date;
    const last = groups[groups.length - 1];
    if (last?.date === date) last.items.push(it);
    else groups.push({ date, items: [it] });
  }
  return groups;
}
