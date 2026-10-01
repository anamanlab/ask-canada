'use client';
/** The forecast's "Today in detail" tiles. */
import type { ReactElement } from 'react';
import { ArrowUp, Droplets, Gauge, Leaf, Sun, Sunrise, Wind } from 'lucide-react';
import { WidgetSection } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { CATEGORY_TONE, aqhiColour } from './aqhi-parts';
import { askName, splitName, useLocalTime, useTemp } from './format';
import messages from './messages';
import { Facts, Tile } from './parts';
import type { ForecastOutput } from './types';

type Ok = Extract<ForecastOutput, { status: 'ok' }>;

const WIND_WORDS: Record<string, string> = { VR: 'variable' };

/** "Today in detail": wind, humidity, UV, pressure, sun and air quality, whichever the feed has. */
export function Details({ data }: { data: Ok }) {
  const t = useMessages(messages);
  const temp = useTemp();
  const { fmt } = useLocale();
  const time = useLocalTime(data.place.tz);
  const { send } = useChatActions();
  const c = data.current;
  const today = data.days[0]?.day;
  const uv = today?.uv;
  const windDir = (d?: string) => (d ? (WIND_WORDS[d] ? t(`wind.${WIND_WORDS[d]}`) : d) : '');
  const tiles: ReactElement[] = [];
  if (c?.wind) {
    tiles.push(
      <Tile
        key="wind"
        icon={Wind}
        label={t('d.wind')}
        value={
          <span className="inline-flex items-baseline gap-1.5">
            {c.wind.bearing != null && c.wind.dir !== 'VR' ? (
              <ArrowUp className="size-[18px] self-center text-ink-2" strokeWidth={2.2} style={{ transform: `rotate(${(c.wind.bearing + 180) % 360}deg)` }} aria-hidden />
            ) : null}
            {/* A measurement reads number-then-unit in every direction; the arrow stays outside the isolate. */}
            <bdi dir="ltr" className="inline-flex items-baseline gap-1.5">
              {fmt.number(c.wind.speed)}
              <span className="font-sans text-[13px] font-medium text-ink-3">{t('unit.kmh')}</span>
            </bdi>
          </span>
        }
        // Direction and gusts: each stays whole, and a wrapped line never keeps a dangling separator.
        note={windDir(c.wind.dir) || c.wind.gust ? <Facts items={[windDir(c.wind.dir), c.wind.gust ? <span className="whitespace-nowrap">{t('d.gusts', { v: fmt.number(c.wind.gust) })}</span> : null]} /> : null}
      />,
    );
  }
  if (c?.humidity != null) {
    tiles.push(
      <Tile key="hum" icon={Droplets} label={t('d.humidity')} value={<bdi>{t('unit.pct', { v: fmt.number(c.humidity) })}</bdi>} note={c.dewpoint != null ? <bdi>{t('d.dewpoint', { t: temp(c.dewpoint) })}</bdi> : undefined} />,
    );
  }
  if (uv != null) {
    tiles.push(<Tile key="uv" icon={Sun} label={t('d.uv')} value={fmt.number(uv)} note={today?.uvCategory ? <Facts items={[t('d.uvPeak'), today.uvCategory]} /> : undefined} />);
  }
  if (c?.pressure) {
    tiles.push(
      <Tile
        key="p"
        icon={Gauge}
        label={t('d.pressure')}
        value={
          <bdi dir="ltr" className="inline-flex items-baseline gap-1">
            {fmt.number(c.pressure.kPa, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="font-sans text-[13px] font-medium text-ink-3">{t('unit.kpa')}</span>
          </bdi>
        }
        note={c.pressure.tendency ? t('d.tendency', { v: c.pressure.tendency }) : undefined}
      />,
    );
  }
  if (data.sun) {
    tiles.push(<Tile key="sun" icon={Sunrise} label={t('d.sunrise')} value={<bdi>{time.time(data.sun.rise)}</bdi>} note={<bdi>{t('d.sunset', { time: time.time(data.sun.set) })}</bdi>} />);
  }
  const aqhi = data.aqhi;
  const v = aqhi ? (aqhi.value ?? aqhi.forecast[0]?.value) : undefined;
  if (aqhi && v != null) {
    const cat = aqhi.category ?? 'low';
    tiles.push(
      <Tile
        key="aq"
        icon={Leaf}
        label={t('d.aqhi')}
        action={{
          onClick: () => send(t('ask.air', { place: askName(data.place) })),
          'aria-label': t('d.aqhiAction', { v: fmt.number(v), cat: t(`aqhi.cat.${cat}`), place: splitName(data.place.name).base }),
        }}
        value={
          <span className="inline-flex items-center gap-2">
            <span className={cn('size-3 rounded-full', aqhiColour(v))} aria-hidden />
            {fmt.number(v)}
          </span>
        }
        note={<span className={CATEGORY_TONE[cat]}>{t(`aqhi.cat.${cat}`)}</span>}
      />,
    );
  }
  if (!tiles.length) return null;
  // Rows always fill: 2 columns on phones (an odd last tile spans both), 3 on wider columns (6 tracks). There a
  // last row of 2 splits the width in halves, and a remainder of 1 turns the last four into 2 + 2 (4 tiles read
  // as a 2 × 2 block, 7 as 3 + 2 + 2) rather than leaving one tile as a full-width slab. A single tile spans.
  const n = tiles.length;
  const halves = n % 3 === 2 ? 2 : n % 3 === 1 && n >= 4 ? 4 : 0;
  const span = (i: number) =>
    cn(
      // Label, value and note sit on rows shared by the whole grid row (subgrid), so a label that wraps
      // ("QUALITÉ DE L’AIR") makes its neighbour's header as tall and the values stay on one line.
      'row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0 [&>*]:row-span-3 [&>*]:grid [&>*]:grid-rows-subgrid [&>*]:gap-y-0',
      n % 2 === 1 && i === n - 1 ? 'col-span-2' : 'col-span-1',
      n === 1 ? '@xl:col-span-6' : i >= n - halves ? '@xl:col-span-3' : '@xl:col-span-2',
    );
  return (
    <WidgetSection title={t('d.title')}>
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 @xl:grid-cols-6">
        {tiles.map((tile, i) => (
          <li key={tile.key} className={span(i)}>
            {tile}
          </li>
        ))}
      </ul>
    </WidgetSection>
  );
}
