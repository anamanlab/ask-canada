'use client';
/**
 * The air-quality widget's wildfire smoke section: air quality warnings, satellite fire hotspots within 100 km
 * and how to protect yourself. When nothing points to smoke (no warning, no hotspots, low-risk AQHI now and in
 * the forecast) it leads with a calm all-clear and folds the protective advice away, so emergency guidance
 * never outweighs a "no".
 */
import type { ReactNode } from 'react';
import { Check, Flame, HeartPulse, Map as MapIcon, Satellite, Wind } from 'lucide-react';
import { Disclosure, ExternalLink, Notice, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { AlertCard } from './alert-parts';
import { URLS } from './data';
import { splitName } from './format';
import messages from './messages';
import type { AirOutput } from './types';

type Ok = Extract<AirOutput, { status: 'ok' }>;

/** The highest AQHI still "low risk" (1 to 3). */
const LOW_MAX = 3;

/** No smoke signal of any kind: no warning, hotspots checked and none found, AQHI low now and in the forecast. */
function allClear(data: Ok) {
  const { aqhi, hotspots } = data;
  if (data.airAlerts.length || data.smoke || !aqhi || hotspots?.count !== 0) return false;
  const values = [aqhi.value, ...aqhi.forecast.map((f) => f.value)].filter((v): v is number => v != null);
  return values.length > 0 && values.every((v) => v <= LOW_MAX);
}

export function Smoke({ data }: { data: Ok }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const lang = data.lang;
  const h = data.hotspots;
  const place = splitName(data.place.name).base;
  const fireMap = (
    // Its own line with a full 44px target (not a small inline link).
    <ExternalLink href={URLS.fireMap[lang]} standalone className="-mx-2 -mb-2 mt-0.5 gap-1.5 rounded-[10px] px-2 text-[14px] underline-offset-4 hover:bg-card">
      <MapIcon className="size-4 shrink-0 text-ink-3" aria-hidden />
      {t('smoke.fireMap')}
    </ExternalLink>
  );

  if (allClear(data) && h) {
    return (
      <WidgetSection title={t('smoke.title')}>
        <div className="flex items-start gap-3.5 rounded-tile border border-pine/15 px-4 py-4 [background-image:var(--wx-calm)]">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pine text-white shadow-[0_0_0_5px_var(--pine-wash)]" aria-hidden>
            <Check className="size-[18px]" strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <p className="m-0 font-serif text-[21px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{t('smoke.clear')}</p>
            <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">
              <bdi>{t('smoke.clearSub', { place, km: fmt.number(h.radiusKm) })}</bdi>
            </p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-ink-3">
              <bdi>{t('smoke.hotspotsNote')}</bdi>
            </p>
            {fireMap}
          </div>
        </div>
        <Disclosure title={t('smoke.protect')} summary={t('smoke.protectSummary')} headingLevel={5} className="mt-4 border-b">
          <Protect />
        </Disclosure>
      </WidgetSection>
    );
  }

  return (
    <WidgetSection title={t('smoke.title')}>
      {data.airAlerts.length ? (
        <div className="mb-3 grid gap-2.5">
          {data.airAlerts.map((a, i) => (
            <AlertCard key={a.id} alert={a} tz={data.place.tz} defaultOpen={i === 0} headingLevel={5} />
          ))}
        </div>
      ) : (
        <p className="m-0 mb-3 flex items-start gap-2 text-[14px] leading-snug text-ink-2">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
          {t('smoke.noAlert', { place })}
        </p>
      )}

      {h ? (
        <div className="flex items-start gap-3 rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-[11px]', h.count ? 'bg-amber-wash text-amber' : 'bg-pine-wash text-pine')} aria-hidden>
            {h.count ? <Flame className="size-[18px]" strokeWidth={1.8} /> : <Satellite className="size-[18px]" strokeWidth={1.8} />}
          </span>
          <div className="min-w-0">
            {/* Isolated so the count and the distances keep their place inside right-to-left text. */}
            <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
              <bdi>{h.count ? t('smoke.hotspots', { count: h.count, km: fmt.number(h.radiusKm) }) : t('smoke.noHotspots', { km: fmt.number(h.radiusKm) })}</bdi>
            </p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">
              {h.count && h.nearestKm != null ? (
                <>
                  <bdi>{t('smoke.nearest', { km: fmt.number(h.nearestKm) })}</bdi>{' '}
                </>
              ) : null}
              <bdi>{t('smoke.hotspotsNote')}</bdi>
            </p>
            {fireMap}
          </div>
        </div>
      ) : null}

      <h5 className="m-0 mt-5 flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Wind className="size-4 text-ink-3" aria-hidden />
        {t('smoke.protect')}
      </h5>
      <Protect className="mt-2" />
    </WidgetSection>
  );
}

/** Health Canada's protective steps, the symptoms that need care, and the reminder that smoke can be invisible. */
function Protect({ className }: { className?: string }): ReactNode {
  const t = useMessages(messages);
  return (
    <div className={className}>
      <ul className="m-0 grid list-none gap-2 p-0">
        {(['1', '2', '3', '4'] as const).map((n) => (
          <li key={n} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
            <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
            {t(`smoke.tip.${n}`)}
          </li>
        ))}
      </ul>
      <Notice tone="danger" icon={HeartPulse} className="mt-3" title={t('smoke.symptoms.title')}>
        {t('smoke.symptoms.body')}
      </Notice>
      <p className="m-0 mt-3 text-[13px] text-ink-3">{t('smoke.invisible')}</p>
    </div>
  );
}
