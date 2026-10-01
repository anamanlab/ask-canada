'use client';
/**
 * The wage explorer itself: pick a province (menu, map tile or row) and the headline springs to its numbers;
 * hourly ⇄ yearly estimate; then every province on one axis, and the regions of the province asked about.
 */
import { useState } from 'react';
import { ArrowRight, Coins, WifiOff } from 'lucide-react';
import { Badge, Button, Notice, Tabs, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { CHECKED, HOURS_PER_YEAR, frDe, inLocation, inProvince, type Province } from './data';
import messages from './messages';
import { SubtitleWithBadge, useJobsLang, useProvinceName, yearly } from './parts';
import { lcFirst } from './text';
import type { WagesOutput } from './types';
import { WageHero, type Per } from './WageHero';
import { ProvinceRows, RegionRows, type WageChart } from './WageRows';
import { niceTicks, wageScale } from './wage-scale';

type Geo = Province | 'ca';

export function WagesExplorer({ data, occupation: occ }: { data: WagesOutput; occupation: NonNullable<WagesOutput['occupation']> }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const provinceName = useProvinceName();
  // Titles and sentences follow the interface language, even when the answer came in the other one.
  const lang = useJobsLang();
  const title = occ.titles?.[lang] ?? occ.title;
  // The keyword people search Job Bank with ("welder"), else the occupation title.
  const jobWord = occ.search?.[lang] ?? lcFirst(occ.title);

  const ranked = data.provinces.filter((p) => p.median != null).toSorted((a, b) => (b.median ?? 0) - (a.median ?? 0));
  const [geo, setGeo] = useState<Geo>(data.province && ranked.some((p) => p.code === data.province) ? data.province : 'ca');
  const [per, setPer] = useState<Per>(data.unit);
  const canYear = data.unit === 'hour';
  const estimate = per === 'year' && canYear;
  const inYears = per === 'year' || !canYear;
  const province = geo === 'ca' ? undefined : ranked.find((p) => p.code === geo);
  const asked = ranked.find((p) => p.code === data.province);

  // One axis for every bar (headline, provinces, regions).
  const scale = wageScale([data.national, ...data.provinces, ...data.regions], !data.provinces.length);
  const perYear = estimate ? HOURS_PER_YEAR : 1;
  const chart: WageChart = {
    pos: scale.pos,
    show: (n) => (n == null ? '—' : fmt.money(estimate ? yearly(n) : inYears ? Math.round(n) : n, { cents: inYears ? 'never' : 'always' })),
    ticks: niceTicks(scale.lo * perYear, scale.hi * perYear).map(({ value, at }) => ({ at, label: fmt.money(value, inYears ? { compact: true, cents: 'never' } : { cents: 'auto' }) })),
  };
  const select = (p: Province | undefined) => setGeo(p ?? 'ca');
  const badge = data.live ? <Badge tone="live">{t('badge.live')}</Badge> : <Badge tone="warn" icon={WifiOff}>{t('badge.saved')}</Badge>;
  const provinces = <ProvinceRows title={title} rows={ranked} selected={province?.code} onSelect={select} national={data.national?.median ?? null} chart={chart} />;

  return (
    <WidgetShell
      icon={Coins}
      tone="pine"
      title={t('wages.titleFor', { title })}
      subtitle={<SubtitleWithBadge badge={badge}>{t('wages.subtitleFor', { noc: occ.noc, date: data.updated ? fmt.date(data.updated, { month: 'short', day: 'numeric', year: 'numeric' }) : '' })}</SubtitleWithBadge>}
      badge={badge}
      sources={data.sources}
      handoff={{ href: data.links.wages, label: t('wages.handoff') }}
      secondaryAction={
        <Button variant="quiet" size="lg" iconEnd={ArrowRight} className="max-sm:w-full rtl:[&_svg]:-scale-x-100" onClick={() => send(t('wages.askJobs', { title: jobWord, deTitle: frDe(jobWord), inPlace: geo === 'ca' ? inLocation(lang, { kind: 'canada' }) : inProvince(lang, geo) }))}>
          {t('wages.findJobs')}
        </Button>
      }
      footnote={<span className="block pt-1 text-[12px] leading-relaxed">{t('wages.footnote', { period: data.refPeriod ?? '', hours: fmt.number(HOURS_PER_YEAR) })}</span>}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <WageHero ranked={ranked} national={data.national} province={province} onSelect={select} per={per} onPer={setPer} canYear={canYear} pos={scale.pos} />
        {!data.live ? (
          <Notice tone="warn" icon={WifiOff} className="mt-3" title={t('wages.offline', { date: fmt.date(CHECKED, { month: 'long', day: 'numeric', year: 'numeric' }) })}>
            {t('wages.offlineBody')}
          </Notice>
        ) : null}
      </div>

      {asked && data.regions.some((r) => r.median != null) ? (
        <WidgetSection className="pt-3">
          <Tabs
            label={t('wages.compare')}
            tabs={[
              { id: 'provinces', label: t('wages.across'), content: provinces },
              {
                id: 'regions',
                label: t('wages.regionsIn', { province: provinceName(asked.code) }),
                content: <RegionRows title={title} province={asked.code} regions={data.regions} lang={lang} answerLang={data.lang} provinceMedian={asked.median} chart={chart} />,
              },
            ]}
          />
        </WidgetSection>
      ) : ranked.length ? (
        <WidgetSection title={t('wages.across')}>{provinces}</WidgetSection>
      ) : null}
    </WidgetShell>
  );
}
