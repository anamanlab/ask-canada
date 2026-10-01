'use client';
/**
 * weatherAlerts renderer: colour-coded Environment Canada alerts.
 *  - place: the alerts in effect there (full official text), or a calm "none in effect".
 *  - province / Canada: how many areas are under which alert, grouped by hazard, filterable by province.
 */
import { Check, Siren } from 'lucide-react';
import { WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { ALERT_BANNER, AlertCard, AlertMark, ColourLegend } from './alert-parts';
import { URLS } from './data';
import { splitName, useProvinceName } from './format';
import { LocationPicker, pickerTitle } from './location';
import messages from './messages';
import { FreshBadge, FreshLine } from './parts';
import { AlertsSkeleton } from './Skeletons';
import { WX_SCOPE, WxTokens } from './tokens';
import type { AlertsOutput } from './types';
import { WideAlerts } from './WideAlerts';

type Input = { location?: string; province?: string };
type PlaceOk = Extract<AlertsOutput, { status: 'ok'; scope: 'place' }>;

export function WeatherAlerts({ part, locale }: WidgetProps<Input, AlertsOutput>) {
  const t = useMessages(messages);
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('alerts.errorTitle')} message={t('error.body')} fallback={{ href: URLS.alertMap[lang], label: t('alerts.map') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <AlertsSkeleton title={t('alerts.title')} subtitle={t('alerts.subtitle')} icon={Siren} label={t('loading')} />;
  }
  const out = part.output;
  if (out.status === 'ok' && out.scope === 'place') return <PlaceAlerts data={out} />;
  if (out.status === 'ok') return <WideAlerts data={out} />;
  if (out.status === 'unavailable') {
    return <WidgetError title={t('alerts.errorTitle')} message={t('alerts.unavailableBody')} fallback={{ href: out.page, label: t('alerts.map') }} />;
  }
  return (
    <WidgetShell icon={Siren} tone="amber" title={pickerTitle(t, out)} subtitle={t('alerts.subtitle')} sources={out.sources}>
      <LocationPicker failure={out} kind="alerts" />
      <div className="h-5" />
    </WidgetShell>
  );
}

function PlaceAlerts({ data }: { data: PlaceOk }) {
  const t = useMessages(messages);
  const prov = useProvinceName();
  const n = data.alerts.length;
  const worst = data.alerts[0]?.colour ?? null;
  return (
    <WidgetShell
      icon={Siren}
      tone="amber"
      title={t('alerts.forPlace', { place: splitName(data.place.name).base })}
      subtitle={t('alerts.placeSub', { prov: [splitName(data.place.name).qualifier, prov(data.place.province)].filter(Boolean).join(', ') })}
      badge={<FreshBadge at={data.servedAt ?? data.fetchedAt} fetchedAt={data.fetchedAt} tz={data.place.tz} />}
      sources={data.sources}
      handoff={{ href: data.page, label: n ? t('alerts.handoffPlace') : t('alerts.handoffForecast'), note: t('alerts.handoffNote') }}
      className={cn('@container', WX_SCOPE)}
    >
      <WxTokens />
      <FreshLine at={data.servedAt ?? data.fetchedAt} fetchedAt={data.fetchedAt} tz={data.place.tz} />
      {data.place.via === 'nearest' && data.place.query ? (
        <p className="-mt-1 mb-3 px-5 text-[13.5px] text-ink-3 sm:px-6">{t('nearest', { q: data.place.query, place: data.place.name, km: data.place.distanceKm ?? 0 })}</p>
      ) : null}
      <div
        className={cn(
          'relative mx-3 flex items-start gap-3.5 overflow-hidden rounded-[22px] border px-5 py-5 sm:mx-4',
          n ? 'border-hair bg-paper-2' : 'border-pine/15 [background-image:var(--wx-calm)]',
        )}
      >
        {n ? (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', worst ? ALERT_BANNER[worst] : 'bg-ink text-paper')} aria-hidden>
            <AlertMark className="size-5" />
          </span>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pine text-white shadow-[0_0_0_6px_var(--pine-wash)]" aria-hidden>
            <Check className="size-5" strokeWidth={2.6} />
          </span>
        )}
        <div className="min-w-0">
          <p className="m-0 font-serif text-[24px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">
            <bdi>{n ? t('alerts.count', { count: n }) : t('alerts.none')}</bdi>
          </p>
          <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">
            {n ? t('alerts.countSub', { count: n, place: splitName(data.place.name).base }) : t('alerts.noneSub', { place: splitName(data.place.name).base })}
          </p>
        </div>
      </div>
      {n ? (
        <WidgetSection className="pt-4">
          <div className="grid gap-2.5">
            {data.alerts.map((a, i) => (
              <AlertCard key={a.id} alert={a} tz={data.place.tz} defaultOpen={i === 0} />
            ))}
          </div>
        </WidgetSection>
      ) : null}
      <ColourLegend />
    </WidgetShell>
  );
}
