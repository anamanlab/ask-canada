'use client';
/**
 * weatherAirQuality renderer: the Air Quality Health Index near a place (now + forecast) with the official
 * advice for everyone and for people at risk, plus wildfire smoke signals (air quality warnings, satellite
 * fire hotspots within 100 km, the smoke forecast map and how to protect yourself).
 */
import { useState } from 'react';
import { Flame, Leaf, MapPin } from 'lucide-react';
import { Badge, LinkButton, LiveRegion, Notice, Segmented, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AqhiScale, CATEGORY_TONE, aqhiColour } from './aqhi-parts';
import { URLS, aqhiCategory, isStale, type AqhiCategory } from './data';
import { splitName, useLocalTime, useProvinceName } from './format';
import { LocationPicker, pickerTitle } from './location';
import messages from './messages';
import { AirSkeleton } from './Skeletons';
import { PhoneFresh } from './parts';
import { Smoke } from './Smoke';
import { WX_SCOPE, WxTokens } from './tokens';
import type { AirOutput } from './types';

type Ok = Extract<AirOutput, { status: 'ok' }>;
type Input = { location?: string; focus?: 'aqhi' | 'smoke' };

export function WeatherAirQuality({ part, locale }: WidgetProps<Input, AirOutput>) {
  const t = useMessages(messages);
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('air.errorTitle')} message={t('error.body')} fallback={{ href: URLS.aqhiLocal[lang], label: t('air.handoff') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // A wildfire-smoke question loads at the height of its (longer) answer.
    const smoky = Boolean(part.input && typeof part.input === 'object' && part.input.focus === 'smoke');
    return <AirSkeleton title={t('air.titleGeneric')} subtitle={smoky ? t('smoke.subtitle') : t('air.subtitle')} icon={smoky ? Flame : Leaf} label={t('loading')} smoke={smoky} />;
  }
  const out = part.output;
  if (out.status === 'ok') return <Air data={out} />;
  // A wildfire-smoke question stays about smoke once a place is picked (the smoke answer runs again).
  const smoke = out.focus === 'smoke' || (part.input && typeof part.input === 'object' && part.input.focus === 'smoke');
  return (
    <WidgetShell icon={smoke ? Flame : Leaf} tone="pine" title={pickerTitle(t, out)} subtitle={smoke ? t('smoke.subtitle') : t('air.subtitle')} sources={out.sources}>
      <LocationPicker failure={out} kind={smoke ? 'smoke' : 'air'} />
      <div className="h-5" />
    </WidgetShell>
  );
}

function Air({ data }: { data: Ok }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const prov = useProvinceName();
  const time = useLocalTime(data.place.tz);
  const { aqhi, place } = data;
  const lang = data.lang;
  const shown = aqhi ? (aqhi.value ?? aqhi.forecast[0]?.value ?? null) : null;
  const cat: AqhiCategory | null = shown != null ? aqhiCategory(shown) : null;
  const showSmoke = data.focus === 'smoke' || data.smoke || data.airAlerts.length > 0;
  const [who, setWho] = useState<'general' | 'risk'>('general');
  // The reading's "Now / Latest" and the badge's "Live / Checked" come from this one boolean.
  const observedAt = aqhi?.value != null ? aqhi.observedAt : undefined;
  const staleReading = Boolean(observedAt) && isStale(observedAt ?? '', data.fetchedAt);
  const liveOnCard = Boolean(aqhi || (showSmoke && data.hotspots)) && !staleReading;
  const checked = t(liveOnCard ? 'live.checked' : 'live.checkedOnly', { time: time.time(data.fetchedAt) });
  // Low risk has one recommendation for everyone; from moderate up it differs for people at risk.
  const advice = cat ? t(cat === 'low' ? 'aqhi.advice.low' : `aqhi.advice.${cat}.${who}`) : '';

  const handoffNote = t(data.gap === 'quebec' ? 'air.handoffNoteInfoSmog' : 'air.handoffNote');

  const kicker =
    observedAt
      ? t(staleReading ? 'air.latest' : 'air.now', { time: time.time(observedAt) })
      : aqhi?.forecast[0]
        ? t('air.forecastFor', { period: aqhi.forecast[0].label })
        : '';

  return (
    <WidgetShell
      icon={Leaf}
      tone="pine"
      title={t('air.title', { place: splitName(place.name).base })}
      subtitle={aqhi ? (aqhi.distanceKm >= 5 ? t('air.community', { name: aqhi.community, km: aqhi.distanceKm }) : t('air.communityHere', { name: aqhi.community })) : t('air.subPlace', { prov: prov(place.province) })}
      badge={
        // "Live" only when a live reading is on the card (the AQHI, or hotspots in the smoke section); a place
        // with neither (Info-Smog, no AQHI community nearby) or with an old reading gets a neutral "Checked".
        data.live ? (
          <Badge tone={liveOnCard ? 'live' : 'neutral'} mono>
            <bdi>{checked}</bdi>
          </Badge>
        ) : undefined
      }
      sources={data.sources}
      // With the smoke map as a second action the note sits under the buttons as the footnote (left-aligned).
      handoff={{ href: data.gap === 'quebec' ? URLS.infoSmog[lang] : data.page, label: data.gap === 'quebec' ? t('air.handoffInfoSmog') : t('air.handoff'), note: showSmoke ? undefined : handoffNote }}
      footnote={showSmoke ? handoffNote : undefined}
      secondaryAction={
        showSmoke ? (
          <LinkButton href={URLS.smokeForecast[lang]} external variant="secondary" size="lg" className="max-sm:w-full">
            {t('smoke.mapLink')}
          </LinkButton>
        ) : null
      }
      className={cn('@container', WX_SCOPE)}
    >
      <WxTokens />
      {data.live ? <PhoneFresh live={liveOnCard}>{checked}</PhoneFresh> : null}
      {shown != null && cat ? (
        <div className="mx-3 rounded-[22px] border border-hair bg-paper-2 px-5 pb-5 pt-4 sm:mx-4">
          <p className="m-0 text-[13px] font-medium text-ink-2">
            <bdi>{kicker}</bdi>
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="font-serif text-[72px] leading-[.95] tracking-[-.04em] text-ink [font-variation-settings:'opsz'_72]">
              {fmt.number(Math.min(shown, 10))}
              {shown > 10 ? '+' : ''}
            </span>
            <div className="mb-2 min-w-0">
              <p className={cn('m-0 text-[18px] font-semibold leading-tight', CATEGORY_TONE[cat])}>{t(`aqhi.cat.${cat}`)}</p>
              <p className="m-0 mt-0.5 text-[13px] text-ink-3">{t('aqhi.scaleName')}</p>
            </div>
          </div>
          <AqhiScale value={shown} label={t('aqhi.scaleSr', { v: fmt.number(shown), cat: t(`aqhi.cat.${cat}`) })} className="mt-4" />
          {aqhi?.note ? <p className="m-0 mt-3 text-[13.5px] text-ink-2">{aqhi.note}</p> : null}
        </div>
      ) : (
        <div className="mx-3 sm:mx-4">
          <Notice tone="info" icon={MapPin} title={t(`air.gap.${data.gap ?? 'unavailable'}.title`, { place: splitName(place.name).base })}>
            {data.gap === 'far' && data.nearest
              ? t('air.gap.far.body', { name: data.nearest.name, km: data.nearest.distanceKm })
              : t(`air.gap.${data.gap ?? 'unavailable'}.body`)}
          </Notice>
        </div>
      )}

      {cat ? (
        <WidgetSection title={t('air.advice')}>
          {cat === 'low' ? null : (
            <Segmented
              label={t('air.who')}
              value={who}
              onChange={setWho}
              options={[
                { value: 'general', label: t('air.who.general') },
                { value: 'risk', label: t('air.who.risk') },
              ]}
            />
          )}
          <p className={cn('m-0 text-[16px] leading-snug text-ink', cat !== 'low' && 'mt-3')}>{advice}</p>
          {/* Read out when the audience toggle changes the advice (silent on first render). */}
          <LiveRegion text={advice} delay={300} />
          <p className="m-0 mt-2 text-[13px] text-ink-3">{t('air.atRiskDef')}</p>
        </WidgetSection>
      ) : null}

      {aqhi?.forecast.length ? (
        <WidgetSection title={t('air.forecast')}>
          <ol className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 @xl:grid-cols-4">
            {aqhi.forecast.map((f) => {
              const c = aqhiCategory(f.value);
              return (
                <li key={f.label} className="rounded-tile border border-hair bg-paper-2 px-3.5 py-3">
                  <p className="m-0 text-[13px] font-medium leading-snug text-ink-2">{f.label}</p>
                  <p className="m-0 mt-1 flex items-center gap-2 font-serif text-[26px] leading-none text-ink">
                    <span className={cn('size-3 shrink-0 rounded-full', aqhiColour(f.value))} aria-hidden />
                    {fmt.number(Math.min(f.value, 10))}
                    {f.value > 10 ? '+' : ''}
                  </p>
                  <p className={cn('m-0 mt-1.5 text-[12.5px] font-medium', CATEGORY_TONE[c])}>{t(`aqhi.cat.${c}`)}</p>
                  {f.inSmoke != null ? <p className="m-0 mt-1 text-[12.5px] text-amber">{t('air.inSmoke', { v: fmt.number(f.inSmoke) })}</p> : null}
                </li>
              );
            })}
          </ol>
          {aqhi.publishedAt ? <p className="m-0 mt-2.5 text-[12.5px] text-ink-3">{t('air.issued', { time: time.dayTimeTz(aqhi.publishedAt) })}</p> : null}
        </WidgetSection>
      ) : null}

      {showSmoke ? <Smoke data={data} /> : null}
    </WidgetShell>
  );
}
