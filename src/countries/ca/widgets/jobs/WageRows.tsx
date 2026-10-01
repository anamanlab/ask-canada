'use client';
/**
 * The wage explorer's lists: provinces and territories (tap a row to put it in the headline) and the economic
 * regions of the province asked about. Every bar shares one axis, so rows compare at a glance. Each list
 * opens with its top five (the chosen province always among them); the rest is one tap away.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { Lang, Province } from './data';
import messages from './messages';
import { OutlookMeter, useProvinceName } from './parts';
import { nbHyphens } from './text';
import type { WageRow, WagesOutput } from './types';

/** What the rows need to draw themselves: the shared axis, its ticks and the wage formatter. */
export type WageChart = {
  /** Position (0–100) of a wage on the shared axis. */
  pos: (n: number | null) => number;
  /** A wage as text in the chosen unit ("$42.00", "$81,900"), "—" when Job Bank has none. */
  show: (n: number | null | undefined) => string;
  ticks: { at: number; label: string }[];
};

/** Rows shown before "Show all". */
const TOP = 5;

/** Phones: name and amount (and the outlook meter for provinces) on one line, the bar below. Wider: one line. */
const ROW = 'grid items-center gap-x-3 gap-y-1.5 px-2';
const COLS = {
  province: 'grid-cols-[minmax(0,1fr)_auto_2.5rem] @md:grid-cols-[11.5rem_minmax(0,1fr)_4.75rem_4.5rem] @xl:grid-cols-[13.5rem_minmax(0,1fr)_4.75rem_4.5rem]',
  region: 'grid-cols-[minmax(0,1fr)_auto] @md:grid-cols-[11.5rem_minmax(0,1fr)_4.75rem] @xl:grid-cols-[13.5rem_minmax(0,1fr)_4.75rem]',
};
const BAR_CELL = 'relative col-span-full @md:col-span-1 @md:col-start-2';
const AMOUNT = 'col-start-2 row-start-1 whitespace-nowrap text-end text-[14px] font-semibold tabular-nums text-ink @md:col-start-3';
const CAPTION = 'hidden text-end text-[12px] font-medium text-ink-2 @md:block';
/** The low-to-high bar of a row that isn't chosen: opaque, so the axis lines pass behind it. */
const RANGE = 'bg-[color-mix(in_oklab,var(--pine)_55%,var(--card))]';
/** A mark on the axis: its centre sits on the value, mirrored in right-to-left. */
const ON_AXIS = 'absolute ltr:-translate-x-1/2 rtl:translate-x-1/2';

/** Low-to-high range with the median dot, over the axis gridlines and the reference line (Canada's median, or the province's). */
function RangeBar({ row, chart, reference, active }: { row: WageRow; chart: WageChart; reference: number | null; active?: boolean }) {
  const at = (n: number | null) => ({ insetInlineStart: `${chart.pos(n)}%` });
  // From `@md` a row is one line, so gridlines and the reference line run its full height and join up down the list.
  const through = '-inset-y-1 @md:-inset-y-[18px]';
  return (
    <span className={cn(BAR_CELL, 'row-start-2 h-2.5 @md:row-start-1')} aria-hidden>
      {chart.ticks.map((tick) => (
        <i key={tick.at} className={cn('absolute w-px bg-hair', through)} style={{ insetInlineStart: `${tick.at}%` }} />
      ))}
      <i className="absolute inset-x-0 top-1/2 h-px bg-hair-2" />
      {reference != null ? <i className={cn('absolute w-px bg-[repeating-linear-gradient(to_bottom,var(--maple)_0_3px,transparent_3px_6px)]', through)} style={at(reference)} /> : null}
      <i className={cn('absolute inset-y-0 rounded-full transition-colors', active ? 'bg-pine' : RANGE)} style={{ insetInlineStart: `${chart.pos(row.low)}%`, insetInlineEnd: `${100 - chart.pos(row.high)}%` }} />
      <i className={cn(ON_AXIS, 'top-1/2 size-3.5 -translate-y-1/2 rounded-full border-[2.5px] border-card bg-ink shadow-sm')} style={at(row.median)} />
    </span>
  );
}

/** Above the rows: what the dashed line is ("Canada median $43.27"), and the column captions on wide cards. */
function ListHead({ cols, chart, reference, label, captions }: { cols: string; chart: WageChart; reference: number | null; label: string; captions: string[] }) {
  const x = chart.pos(reference);
  return (
    <div className={cn(ROW, cols, 'pb-1.5')}>
      {reference != null ? (
        <p className={cn(BAR_CELL, 'row-start-1 m-0 h-5 text-[12.5px] font-medium text-maple-ink')}>
          {/* Near either end of the axis the label hangs inward, so it never leaves the chart. */}
          <span className={cn('absolute whitespace-nowrap', x < 22 ? 'start-0' : x > 78 ? 'end-0' : ON_AXIS)} style={x < 22 || x > 78 ? undefined : { insetInlineStart: `${x}%` }}>
            <bdi>{label}</bdi>
          </span>
        </p>
      ) : null}
      {captions.map((caption, i) => (
        <span key={caption} className={CAPTION} style={{ gridColumnStart: i + 3, gridRowStart: 1 }} aria-hidden>
          {caption}
        </span>
      ))}
    </div>
  );
}

/** Under the rows: dollar values on the axis. */
function Axis({ cols, chart }: { cols: string; chart: WageChart }) {
  if (!chart.ticks.length) return null;
  return (
    <div className={cn(ROW, cols, 'pt-1')} aria-hidden>
      <span className={cn(BAR_CELL, 'h-4 text-[11.5px] tabular-nums text-ink-3')}>
        {chart.ticks.map((tick) => (
          // The position is on the span (the row's direction); the amount is isolated inside it.
          <span key={tick.at} className={cn(ON_AXIS, 'whitespace-nowrap')} style={{ insetInlineStart: `${tick.at}%` }}>
            <bdi>{tick.label}</bdi>
          </span>
        ))}
      </span>
    </div>
  );
}

function ShowAll({ open, count, onToggle }: { open: boolean; count: number; onToggle: () => void }) {
  const t = useMessages(messages);
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="mx-auto mt-2 flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-ink hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-ink"
    >
      {open ? t('wages.showFewer') : t('wages.showAll', { count })}
      <ChevronDown className={cn('size-4 text-ink-3 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
    </button>
  );
}

function Legend({ children }: { children?: ReactNode }) {
  const t = useMessages(messages);
  return (
    <p className="m-0 mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <i className={cn('inline-block h-2 w-5 rounded-full', RANGE)} aria-hidden />
        <bdi>{t('wages.legendRange')}</bdi>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3 rounded-full border-2 border-card bg-ink shadow-sm" aria-hidden />
        <bdi>{t('wages.legendMedian')}</bdi>
      </span>
      {children}
    </p>
  );
}

/** Position by median, ties sharing a place ("10" twice, then "12"). */
const rankOf = (rows: WageRow[], row: WageRow) => 1 + rows.filter((r) => (r.median ?? 0) > (row.median ?? 0)).length;

function Rank({ children }: { children: number }) {
  return <span className="w-5 shrink-0 text-[12px] tabular-nums text-ink-3">{children}</span>;
}

type ProvinceRow = WagesOutput['provinces'][number];

/** `rows` are sorted, highest median first. */
export function ProvinceRows({ title, rows, selected, onSelect, national, chart }: { title: string; rows: ProvinceRow[]; selected?: Province; onSelect: (p: Province | undefined) => void; national: number | null; chart: WageChart }) {
  const t = useMessages(messages);
  const provinceName = useProvinceName();
  const [open, setOpen] = useState(false);
  const foldable = rows.length > TOP + 1;
  // Closed: the top five, or the top four and the chosen province when it ranks lower.
  const top = rows.slice(0, TOP);
  const chosen = rows.find((r) => r.code === selected);
  const shown = open || !foldable ? rows : !chosen || top.includes(chosen) ? top : [...rows.slice(0, TOP - 1), chosen];
  return (
    <>
      <ListHead cols={COLS.province} chart={chart} reference={national} label={t('wages.legendCanada', { amount: chart.show(national) })} captions={[t('wages.legendMedian'), t('wages.outlookCaption')]} />
      <ul className="m-0 list-none p-0" aria-label={t('wages.acrossAria', { title })}>
        {shown.map((p) => {
          const on = selected === p.code;
          return (
            <li key={p.code}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? undefined : p.code)}
                aria-label={t('wages.rowAria', {
                  rank: rankOf(rows, p),
                  province: provinceName(p.code),
                  median: chart.show(p.median),
                  low: chart.show(p.low),
                  high: chart.show(p.high),
                  outlook: p.outlook ? t(`outlook.${p.outlook.stars}`) : t('outlook.0'),
                })}
                className={cn(ROW, COLS.province, 'min-h-11 w-full rounded-field py-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-ink @md:py-1.5', on ? 'bg-pine-wash' : 'hover:bg-paper-2')}
              >
                {/* Phones: the name sits on its own line above the bar (no hyphenated names split mid-word). */}
                <span className={cn('flex items-baseline gap-1.5 text-[14px] leading-tight', on ? 'font-semibold text-ink' : 'font-medium text-ink-2')}>
                  <Rank>{rankOf(rows, p)}</Rank>
                  {nbHyphens(provinceName(p.code))}
                </span>
                <RangeBar row={p} chart={chart} reference={national} active={on} />
                <bdi className={AMOUNT}>{chart.show(p.median)}</bdi>
                <span className="col-start-3 row-start-1 flex justify-end @md:col-start-4">{p.outlook ? <OutlookMeter stars={p.outlook.stars} compact /> : null}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Axis cols={COLS.province} chart={chart} />
      {foldable ? <ShowAll open={open} count={rows.length} onToggle={() => setOpen(!open)} /> : null}
      <Legend>
        <span className="inline-flex items-center gap-1.5">
          {/* A sample meter only: hidden from screen readers so it isn't read as this job's outlook. */}
          <span aria-hidden>
            <OutlookMeter stars={4} compact />
          </span>
          <bdi>{t('wages.legendOutlook')}</bdi>
        </span>
      </Legend>
    </>
  );
}

type Region = WagesOutput['regions'][number];

/** Regions of the province asked about: same axis and marks as the provinces. */
export function RegionRows({ title, province, regions, lang, answerLang, provinceMedian, chart }: { title: string; province: Province; regions: Region[]; lang: Lang; answerLang: Lang; provinceMedian: number | null; chart: WageChart }) {
  const t = useMessages(messages);
  const provinceName = useProvinceName();
  const [open, setOpen] = useState(false);
  const rows = regions.filter((r) => r.median != null).toSorted((a, b) => (b.median ?? 0) - (a.median ?? 0));
  const foldable = rows.length > TOP + 1;
  return (
    <>
      <ListHead cols={COLS.region} chart={chart} reference={provinceMedian} label={t('wages.legendProvince', { province: provinceName(province), amount: chart.show(provinceMedian) })} captions={[t('wages.legendMedian')]} />
      <ul className="m-0 list-none p-0" aria-label={t('wages.regionsAria', { title, province: provinceName(province) })}>
        {(open || !foldable ? rows : rows.slice(0, TOP)).map((r) => {
          // Region names in the interface language when Job Bank gave us both; otherwise Job Bank's own, marked as such.
          const own = r.names?.[lang];
          return (
            <li key={r.geo ?? r.name} className={cn(ROW, COLS.region, 'min-h-11 py-2 @md:py-1.5')}>
              <span className="flex items-baseline gap-1.5 text-start text-[14px] font-medium leading-tight text-ink-2">
                <Rank>{rankOf(rows, r)}</Rank>
                {/* lang on an inner isolate, so an English name keeps the row's direction and start alignment in RTL. */}
                <bdi lang={own ? lang : answerLang}>{own ?? r.name}</bdi>
              </span>
              <RangeBar row={r} chart={chart} reference={provinceMedian} />
              <span className={AMOUNT}>
                <bdi>{chart.show(r.median)}</bdi>
                <span className="sr-only"> {t('wages.rangeSr', { low: chart.show(r.low), high: chart.show(r.high) })}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Axis cols={COLS.region} chart={chart} />
      {foldable ? <ShowAll open={open} count={rows.length} onToggle={() => setOpen(!open)} /> : null}
      <Legend />
    </>
  );
}
