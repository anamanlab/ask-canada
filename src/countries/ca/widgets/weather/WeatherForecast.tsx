'use client';
/**
 * weatherForecast renderer: live Environment Canada conditions and forecast for one place.
 * Hero "now" panel → alerts in effect → next 24 hours → 7 days (tap a day for ECCC's full wording)
 * → today in detail (wind, humidity, UV, pressure, sun, air quality) → handoff to weather.gc.ca.
 */
import { ArrowDown, ArrowUp, Bookmark, BookmarkCheck, CloudSun } from 'lucide-react';
import { Button, Notice, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS, isLive } from './data';
import { AlertCard } from './alert-parts';
import { Details } from './Details';
import { askName, ltr, splitName, useIndex, useLocalTime, useProvinceName, useTemp } from './format';
import { Hourly } from './Hourly';
import { LocationPicker, pickerTitle, useSavedPlace } from './location';
import messages from './messages';
import { FreshBadge, FreshLine } from './parts';
import { SkyHero, darkSky } from './SkyHero';
import { ForecastSkeleton } from './Skeletons';
import { WX_SCOPE, WxTokens } from './tokens';
import type { ForecastOutput } from './types';
import { Week } from './Week';

type Ok = Extract<ForecastOutput, { status: 'ok' }>;
type Input = { location?: string; lang?: 'en' | 'fr' };

export function WeatherForecast({ part, locale }: WidgetProps<Input, ForecastOutput>) {
  const t = useMessages(messages);
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.forecastHome[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // Only name the place once the model has finished writing it (no "Weather in Otta" mid-stream).
    const where = part.state === 'input-available' && part.input && typeof part.input === 'object' ? part.input.location : undefined;
    return <ForecastSkeleton title={where ? t('forecast.loadingFor', { place: where }) : t('forecast.title')} subtitle={t('forecast.subtitle')} icon={CloudSun} label={t('loading')} />;
  }
  const out = part.output;
  if (out.status === 'ok') return <Forecast data={out} />;
  if (out.status === 'unavailable') return <Unavailable page={out.page} place={splitName(out.place.name).base} />;
  return (
    <WidgetShell icon={CloudSun} tone="glacier" title={pickerTitle(t, out)} subtitle={t('forecast.subtitle')} sources={out.sources}>
      <LocationPicker failure={out} kind="forecast" />
      <div className="h-5" />
    </WidgetShell>
  );
}

function Unavailable({ page, place }: { page: string; place: string }) {
  const t = useMessages(messages);
  return <WidgetError title={t('unavailable.title', { place })} message={t('unavailable.body')} fallback={{ href: page, label: t('error.fallback') }} />;
}

function Forecast({ data }: { data: Ok }) {
  const t = useMessages(messages);
  const temp = useTemp();
  const index = useIndex();
  const { fmt } = useLocale();
  const prov = useProvinceName();
  const time = useLocalTime(data.place.tz);
  const { send } = useChatActions();
  const { place, current, today } = data;
  // Saved on this device; every weather picker then offers it first ("Winnipeg · your place").
  const [saved, save, unsave] = useSavedPlace();
  const isSaved = saved?.id === place.id;

  // Hero: the observation when there is one, otherwise today's first forecast period.
  const first = data.days[0];
  const lead = first?.day ?? first?.night;
  const heroTemp = current?.temp ?? lead?.temp ?? null;
  const heroSky = current?.sky ?? lead?.sky ?? 'cloudy';
  const heroNight = current ? current.night : Boolean(lead?.night);
  const condition = current?.condition || lead?.summary || '';
  const hiLo = [today.high != null ? t('hi', { t: temp(today.high) }) : null, today.low != null ? t('lo', { t: temp(today.low) }) : null].filter(Boolean).join('  ·  ');
  const feels = current?.feelsLike ? t(`feels.${current.feelsLike.kind}`, { t: index(current.feelsLike.value) }) : null;
  const line = [feels, hiLo].filter(Boolean).join('  ·  ');

  // How today's high compares with the normal for the date ("5° warmer than a usual day").
  const diff = today.high != null && today.normalHigh != null ? Math.round(today.high - today.normalHigh) : null;
  const insight =
    diff == null
      ? null
      : Math.abs(diff) < 3
        ? { tone: 'same' as const, text: t('normal.same', { t: temp(today.normalHigh) }) }
        : { tone: diff > 0 ? ('warm' as const) : ('cool' as const), text: t(diff > 0 ? 'normal.warmer' : 'normal.cooler', { d: ltr(`${fmt.number(Math.abs(diff))}°`), t: temp(today.normalHigh) }) };

  // One boolean for the badge ("Live / Updated"), the hero ("Now / Latest") and the hourly strip's "Now".
  const live = isLive(data.fetchedAt, data.updatedAt, current?.observedAt);
  const stale = Boolean(current) && !live;
  const kicker = current ? t(stale ? 'now.latest' : 'now.at', { time: time.time(current.observedAt) }) : t('now.forecast', { period: lead?.name ?? '' });
  const heroLabel = t('now.sr', {
    place: place.name,
    temp: temp(heroTemp),
    condition,
    extra: line,
  });

  const week = <Week days={data.days} currentTemp={current?.temp ?? null} openDay={data.openDay} />;

  return (
    <WidgetShell
      icon={CloudSun}
      tone="glacier"
      title={splitName(place.name).base}
      subtitle={t('forecast.sub', { prov: [splitName(place.name).qualifier, prov(place.province)].filter(Boolean).join(', ') })}
      badge={<FreshBadge at={data.updatedAt} fetchedAt={data.fetchedAt} tz={place.tz} live={live} />}
      sources={data.sources}
      // Two actions fill the row, so the note about the official page leads the footnote (left-aligned, under
      // the buttons) instead of dropping to a right-aligned line of its own.
      handoff={{ href: data.page, label: t('forecast.handoff') }}
      secondaryAction={
        <Button
          icon={isSaved ? BookmarkCheck : Bookmark}
          size="lg"
          // Phones: both actions stack at the same full width.
          className="max-sm:w-full"
          aria-pressed={isSaved}
          onClick={() => (isSaved ? unsave() : save({ id: place.id, name: place.name, province: place.province }, { detail: `${place.name}, ${place.province.toUpperCase()}` }))}
        >
          {isSaved ? t('saved.yes') : t('saved.save')}
        </Button>
      }
      footnote={`${t('forecast.handoffNote')} ${t('forecast.footnote')}`}
      className={cn('@container', WX_SCOPE)}
    >
      <WxTokens />
      <FreshLine at={data.updatedAt} fetchedAt={data.fetchedAt} tz={place.tz} live={live} />
      {place.via === 'nearest' && place.query ? (
        <p className="-mt-1 mb-3 px-5 text-[13.5px] text-ink-3 sm:px-6">{t('nearest', { q: place.query, place: place.name, km: place.distanceKm ?? 0 })}</p>
      ) : place.via === 'coords' ? (
        <p className="-mt-1 mb-3 px-5 text-[13.5px] text-ink-3 sm:px-6">{t('nearestYou', { place: place.name, km: place.distanceKm ?? 0 })}</p>
      ) : null}

      <SkyHero
        sky={heroSky}
        night={heroNight}
        kicker={kicker}
        temp={temp(heroTemp)}
        condition={condition}
        line={line}
        label={heroLabel}
        footer={
          insight ? (
            <p
              className={cn(
                // A full pill on one line; when a long string wraps on a phone it becomes a soft rounded box.
                'm-0 inline-flex items-start gap-1.5 rounded-[16px] px-3 py-1.5 text-[13px] font-medium leading-[1.45] backdrop-blur-sm',
                darkSky(heroSky, heroNight) ? 'bg-(color:--wx-pill-dark) text-(color:--wx-on-dark)' : 'bg-(color:--wx-pill) text-ink',
              )}
            >
              {insight.tone === 'warm' ? <ArrowUp className="mt-[3px] size-3.5 shrink-0" aria-hidden /> : insight.tone === 'cool' ? <ArrowDown className="mt-[3px] size-3.5 shrink-0" aria-hidden /> : null}
              <bdi>{insight.text}</bdi>
            </p>
          ) : null
        }
      />

      {!current ? (
        <div className="mx-3 mt-3 sm:mx-4">
          <Notice tone="info">{t('d.noObs')}</Notice>
        </div>
      ) : null}

      {place.others?.length ? (
        <p className="m-0 mt-3 px-5 text-[13.5px] text-ink-3 sm:px-6">
          {t('others.lead')}{' '}
          {place.others.map((o, i) => (
            <span key={o.id}>
              {i ? ', ' : ''}
              <button
                type="button"
                className="min-h-11 font-medium text-ink underline decoration-hair-2 underline-offset-4 hover:decoration-ink"
                onClick={() => send(t('ask.forecast', { place: askName(o) }))}
              >
                {`${o.name}, ${prov(o.province)}`}
              </button>
            </span>
          ))}
        </p>
      ) : null}

      {data.alerts.length ? (
        <WidgetSection title={<bdi>{t('alerts.inEffect', { count: data.alerts.length })}</bdi>} className="pt-4">
          <div className="grid gap-2.5">
            {data.alerts.map((a, i) => (
              <AlertCard key={a.id} alert={a} tz={place.tz} defaultOpen={i === 0 && a.colour !== 'yellow'} headingLevel={5} />
            ))}
          </div>
        </WidgetSection>
      ) : null}

      {/* "This week" questions lead with the 7-day list; everything else with the next hours. */}
      {data.focus === 'week' ? week : null}
      <Hourly hours={data.hours} sun={data.sun} tz={place.tz} now={current && !stale ? current : null} fetchedAt={data.fetchedAt} />
      {data.focus === 'week' ? null : week}

      <Details data={data} />
    </WidgetShell>
  );
}
