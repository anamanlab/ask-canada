'use client';
/** weatherAlerts for all of Canada or one province: how many areas are under which alert, grouped by hazard. */
import { useState } from 'react';
import { Check, Info, Siren } from 'lucide-react';
import { Chip, Disclosure, LiveRegion, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { ALERT_DOT, AlertBanner, ColourLegend, below, useAlertTitle } from './alert-parts';
import { viewGroup, type GroupView } from './alert-view';
import { ALERT_COLOURS } from './data';
import { capFirst, localTime, useProvinceName, type Fmt } from './format';
import { MyLocationButton } from './location';
import messages from './messages';
import { FreshBadge, FreshLine } from './parts';
import { WX_SCOPE, WxTokens } from './tokens';
import type { AlertGroup, AlertsOutput } from './types';

type WideOk = Extract<AlertsOutput, { status: 'ok'; scope: 'canada' | 'province' }>;

/** Alerts across Canada or one province: the count, colour chips, a province filter and one card per hazard. */
export function WideAlerts({ data }: { data: WideOk }) {
  const t = useMessages(messages);
  const prov = useProvinceName();
  const [filter, setFilter] = useState<string | null>(null);
  const { ref: railRef, maskStyle } = useScrollEdges<HTMLDivElement>();
  const provinces = [...new Set(data.groups.flatMap((g) => g.provinces))].sort((a, b) => prov(a).localeCompare(prov(b)));
  const groups = filter ? data.groups.filter((g) => g.provinces.includes(filter)) : data.groups;
  // A province's own zone; Canada-wide, Eastern (as the national alert map does).
  const tz = (data.province && data.groups[0]?.tz) || 'America/Toronto';
  // Special weather statements are "not an alert" (the card says so), so they are counted apart from alert types.
  const isStatement = (g: AlertGroup) => !g.colour || g.type === 'statement' || g.type === 'other';
  const statementGroups = groups.filter(isStatement).length;
  const alertGroups = groups.length - statementGroups;
  const counted = (key: 'alerts.groupCount' | 'alerts.typeCountShort') =>
    [alertGroups || !statementGroups ? t(key, { count: alertGroups }) : null, statementGroups ? t('alerts.statementGroups', { count: statementGroups }) : null].filter(Boolean).join(' · ');
  const typeCount = counted('alerts.groupCount');
  return (
    <WidgetShell
      icon={Siren}
      tone="amber"
      title={data.province ? t('alerts.inProv', { prov: prov(data.province) }) : t('alerts.acrossCanada')}
      subtitle={t('alerts.subtitle')}
      badge={<FreshBadge at={data.servedAt ?? data.fetchedAt} fetchedAt={data.fetchedAt} tz={tz} />}
      sources={data.sources}
      handoff={{ href: data.page, label: t('alerts.map'), note: t('alerts.mapNote') }}
      className={cn('@container', WX_SCOPE)}
    >
      <WxTokens />
      <FreshLine at={data.servedAt ?? data.fetchedAt} fetchedAt={data.fetchedAt} tz={tz} />
      <div
        className={cn(
          'mx-3 rounded-[22px] border px-5 py-5 sm:mx-4',
          // Nothing in effect: the same calm check card as a place with no alerts.
          data.total ? 'border-hair bg-paper-2' : 'flex items-start gap-3.5 border-pine/15 [background-image:var(--wx-calm)]',
        )}
      >
        {!data.total ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pine text-white shadow-[0_0_0_6px_var(--pine-wash)]" aria-hidden>
            <Check className="size-5" strokeWidth={2.6} />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className={cn("m-0 font-serif tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]", data.total ? 'text-[26px] leading-[1.12]' : 'text-[24px] leading-[1.15]')}>
            <bdi>{data.total ? t('alerts.wideCount', { count: data.total }) : t('alerts.wideNone')}</bdi>
          </p>
          {!data.total ? <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">{t('alerts.wideNoneSub')}</p> : null}
          {data.total || data.statements ? (
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {ALERT_COLOURS.filter((c) => data.counts[c] > 0).map((c) => (
                <li key={c} className="inline-flex items-center gap-2 rounded-full border border-hair bg-card px-3 py-1.5 text-[13.5px] font-medium">
                  <span className={cn('size-2.5 rounded-full', ALERT_DOT[c])} aria-hidden />
                  <bdi>{t('alerts.colourCount', { colour: c, count: data.counts[c] })}</bdi>
                </li>
              ))}
              {data.statements ? (
                <li className="inline-flex items-center gap-2 rounded-full border border-dashed border-hair-2 px-3 py-1.5 text-[13.5px] font-medium text-ink-2">
                  <Info className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  <bdi>{t('alerts.statementCount', { count: data.statements })}</bdi>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>

      <WidgetSection title={t('alerts.local')}>
        <MyLocationButton kind="alerts" variant="secondary" />
      </WidgetSection>

      {data.groups.length ? (
        <WidgetSection
          title={t('alerts.byHazard')}
          aside={
            // Phones: "5 types · 1 statement", so the section title beside it stays on one line.
            <span className="whitespace-nowrap font-mono text-[12px] text-ink-3">
              <bdi className="@sm:hidden">{counted('alerts.typeCountShort')}</bdi>
              <bdi className="hidden @sm:inline">{typeCount}</bdi>
            </span>
          }
        >
          {!data.province && provinces.length > 1 ? (
            // Phones: one scrolling row that fades where chips are cut off, so they read as "more". Wider: wrap.
            <div
              ref={railRef}
              style={maskStyle}
              className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 @xl:mx-0! @xl:flex-wrap @xl:overflow-visible @xl:px-0! @xl:pb-0"
              role="group"
              aria-label={t('alerts.filter')}
            >
              <Chip selected={filter == null} onClick={() => setFilter(null)} className="text-[14px]">
                {t('alerts.all')}
              </Chip>
              {provinces.map((p) => (
                <Chip key={p} selected={filter === p} onClick={() => setFilter(filter === p ? null : p)} className="text-[14px]">
                  {prov(p)}
                </Chip>
              ))}
            </div>
          ) : null}
          <LiveRegion text={typeCount} />
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {groups.map((g) => (
              // Under a province filter each card is that province's part of the hazard: its areas, its end time.
              <GroupCard key={g.key} group={g} view={viewGroup(g, filter)} />
            ))}
          </ul>
        </WidgetSection>
      ) : null}
      <ColourLegend />
    </WidgetShell>
  );
}

/**
 * When the areas shown end, in the zone where the alert is ("Thu 11 a.m. MST" for Yukon, not Eastern).
 * Areas whose provinces and territories keep different clocks get each zone's time ("Thu 11 a.m. MST /
 * 12 p.m. MDT"); past three zones the time is left to each alert's own text (null).
 */
function endTimes(fmt: Fmt, t: ReturnType<typeof useMessages>, { endsAt, zones }: GroupView): string | null {
  if (!endsAt) return null;
  const times = [...new Set(zones.map((z) => localTime(fmt, z, t).dayTimeTz(endsAt)))];
  if (times.length > 3) return null;
  if (times.length === 1) return times[0];
  // Same local day everywhere: name the day once ("Thu 11 a.m. MST / 12 p.m. MDT").
  const days = new Set(zones.map((z) => localTime(fmt, z, t).ymd(endsAt)));
  const rest = days.size === 1 ? [...new Set(zones.map((z) => localTime(fmt, z, t).timeTz(endsAt)))].slice(1) : times.slice(1);
  return [times[0], ...rest].join(' / ');
}

/** One hazard: its banner, how many areas, where and until when, and the areas (three, then all on request). */
function GroupCard({ group, view }: { group: AlertGroup; view: GroupView }) {
  const t = useMessages(messages);
  const title = useAlertTitle();
  const prov = useProvinceName();
  const { fmt, intl } = useLocale();
  const areas = view.areas.map((a) => capFirst(a, intl));
  const until = endTimes(fmt, t, view);
  return (
    <li className="overflow-hidden rounded-[18px] border border-hair bg-card shadow-sm">
      <AlertBanner colour={group.colour} title={title(group)} headingLevel={5} />
      <div className="px-4 pb-3 pt-3">
        <p className="m-0 text-[13.5px] text-ink-2">
          <bdi>
            {[t('alerts.areas', { count: areas.length }), view.provinces.map((p) => prov(p)).join(', '), until ? t('alerts.untilShort', { time: until }) : null].filter(Boolean).join(' · ')}
          </bdi>
        </p>
        {areas.length > 3 ? (
          // Closed: the first three areas as the summary. Open: every area.
          <Disclosure title={t('alerts.areasTitle')} summary={`${areas.slice(0, 3).join(' · ')} …`} headingLevel={below(5)} className="-mb-2 mt-2.5">
            <p className="m-0 pb-2 text-[14px] leading-snug text-ink">{areas.join(' · ')}</p>
          </Disclosure>
        ) : (
          <p className="m-0 mt-1.5 text-[14px] leading-snug text-ink">{areas.join(' · ')}</p>
        )}
      </div>
    </li>
  );
}
