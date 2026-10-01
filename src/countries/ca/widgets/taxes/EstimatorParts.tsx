'use client';
/**
 * Pieces of the refund estimator:
 *   <BigNumber tone eyebrow value sub note? rate rateLabel rateShort />   the headline number with the average-rate ring
 *   <HowItAddsUp est={est} picked={provinceChosen} />                    federal / provincial tax and the two rates
 *   <BracketBar est={est} />                                             income across the federal brackets
 *   <RrspWhatIf scope="all|fed|qc" saving={n} note={result} onTry={fn} />  "put in $1,000 more" and what it changed
 */
import { Check, PencilLine, Plus } from 'lucide-react';
import { Button, LiveRegion, NumberTicker, Stat } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { returnDates } from './calc/deadlines';
import type { Estimate } from './calc/estimate';
import { RATES_YEAR } from './data';
import messages from './messages';
import { Ring, useDateFmt } from './shared';

/** Stand-ins for the legend's {rate} and {range} slots while the sentence around them is split. */
const RATE = '\u0000';
const RANGE = '\u0001';
const SLOTS = /(\u0000|\u0001)/;

/** Taxable income split across the federal brackets (text alternative included). */
export function BracketBar({ est }: { est: Estimate }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const total = est.netIncome;
  if (total <= 0) return null;
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const rate = (n: number) => fmt.number(n, { style: 'percent', maximumFractionDigits: 1 });
  const tones = ['bg-pine/35', 'bg-pine/55', 'bg-glacier/60', 'bg-glacier/80', 'bg-maple/70'];
  const top = est.fill[est.fill.length - 1];
  // The rate and the dollar range are isolated left-to-right runs, so the sentence is split around their slots.
  const rowParts = t('est.chart.row', { rate: RATE, range: RANGE }).split(SLOTS);
  return (
    <figure className="m-0 mt-5">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('est.chart.title')}</span>
        <span className="text-[13px] text-ink-3">{t('est.chart.taxable', { amount: money(total) })}</span>
      </figcaption>
      {/* Income runs left to right from the lowest bracket in every language, like any axis. */}
      <div dir="ltr" className="flex h-9 w-full overflow-hidden rounded-[12px] bg-paper-2" aria-hidden>
        {est.fill.map((f, i) => (
          <span
            key={f.rate}
            // Each segment takes its share of the income, but never less than its own rate needs: every segment is
            // named on the bar itself, at any width, so telling them apart never depends on colour alone.
            className={cn('flex min-w-max basis-0 items-center justify-center border-e border-card text-[11.5px] font-semibold text-ink last:border-e-0', tones[i])}
            style={{ flexGrow: f.to - f.from }}
          >
            <span className="whitespace-nowrap px-1.5">{rate(f.rate)}</span>
          </span>
        ))}
      </div>
      <ul className="m-0 mt-2.5 grid list-none gap-x-4 gap-y-1 p-0 text-[12.5px] text-ink-3 @xl:grid-cols-2">
        {est.fill.map((f, i) => (
          <li key={f.rate} className="flex items-center gap-2">
            <i className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', tones[i])} aria-hidden />
            {/* The sentence takes its own direction from its words; the rate and the range inside it stay left-to-right. */}
            <bdi>
              {rowParts.map((part, n) =>
                part === RATE ? (
                  <bdi key={n} dir="ltr">
                    {rate(f.rate)}
                  </bdi>
                ) : part === RANGE ? (
                  <bdi key={n} dir="ltr">
                    {t('est.chart.range', { from: money(f.from), to: money(f.to) })}
                  </bdi>
                ) : (
                  part
                ),
              )}
            </bdi>
          </li>
        ))}
      </ul>
      <p className="sr-only">{t('est.chart.sr', { rate: rate(top.rate) })}</p>
    </figure>
  );
}

/** Width the headline number can't use: the band's margins, border and padding, the ring and the gap before it. */
const BESIDE = 178;
/** Average advance of one character of a formatted amount in the display serif, in em (digits, separators, sign). */
const GLYPH = 0.5;

/** The headline number: refund (pine), balance owing (maple) or total tax (glacier), with the average rate ring. */
type BigNumberProps = {
  tone: 'ok' | 'danger' | 'info';
  eyebrow: string;
  value: number;
  sub: string;
  /** A quiet line under the sentence (why the number differs from the written answer). */
  note?: string;
  /** The average rate drawn in the ring (0.2 = 20%), with its accessible label and its short caption. */
  rate: number;
  rateLabel: string;
  rateShort: string;
};

export function BigNumber({ tone, eyebrow, value, sub, note, rate, rateLabel, rateShort }: BigNumberProps) {
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const c = {
    ok: { band: 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_15%,transparent),color-mix(in_oklab,var(--a-teal)_12%,transparent)_55%,color-mix(in_oklab,var(--a-violet)_9%,transparent))]', text: 'text-pine', ring: 'pine' as const },
    danger: { band: 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_9%,transparent),color-mix(in_oklab,var(--a-rose)_14%,transparent))]', text: 'text-maple-ink', ring: 'maple' as const },
    info: { band: 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--a-violet)_10%,transparent))]', text: 'text-glacier', ring: 'glacier' as const },
  }[tone];
  // The number shares its row with the ring: it steps down just enough to fit the widget's width, whatever its
  // length ("$674" keeps the full size; "$1,548,993" on a phone is set smaller rather than run under the ring).
  const chars = money(value).length;
  return (
    <div className={cn('mx-3 overflow-hidden rounded-[22px] border px-5 py-5 sm:mx-4', c.band)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em]', c.text)}>{eyebrow}</p>
          <p
            className="m-0 mt-1.5 whitespace-nowrap font-serif leading-none tracking-[-.04em] text-ink [--max:42px] @md:[--max:52px] [font-variation-settings:'opsz'_96]"
            style={{ fontSize: `min(var(--max), max(22px, calc((100cqw - ${BESIDE}px) / ${(chars * GLYPH).toFixed(2)})))` }}
          >
            <NumberTicker value={value} format={money} />
          </p>
          <p className="m-0 mt-2 text-[14.5px] leading-snug text-ink-2">
            <bdi>{sub}</bdi>
          </p>
          {note ? (
            <p className="m-0 mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-2">
              <PencilLine className="mt-px size-3.5 shrink-0" strokeWidth={1.9} aria-hidden />
              {note}
            </p>
          ) : null}
          {/* The figure moves with every keystroke: it is read once, after the person stops typing. */}
          <LiveRegion text={`${eyebrow}, ${money(value)}. ${sub}`} />
        </div>
        <Ring value={rate / 0.5} size={88} stroke={7} tone={c.ring} label={rateLabel}>
          <span className="flex flex-col items-center leading-none">
            <span className="font-serif text-[21px] tracking-[-.02em] text-ink">{fmt.number(rate, { style: 'percent', maximumFractionDigits: 0 })}</span>
            <span className="mt-1 whitespace-nowrap text-[11.5px] font-medium text-ink-2">{rateShort}</span>
          </span>
        </Ring>
      </div>
    </div>
  );
}

/**
 * Stat tiles share their row's tracks (label / value / note) through a subgrid: when one label in a row wraps,
 * its neighbours' values still sit on the same baseline, and one-line rows keep no empty band.
 */
const STAT_CELL = 'row-span-3 grid grid-rows-subgrid gap-y-0 [&>div:first-child]:self-start';

/** Federal and provincial tax with the marginal and average rates. Without a province (or in Quebec): federal only. */
export function HowItAddsUp({ est, picked }: { est: Estimate; picked: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const pct = (n: number) => fmt.number(n, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const qc = est.input.province === 'QC';
  const fedOnly = qc || !picked;
  const label = (text: string) => <span className="block">{text}</span>;
  return (
    <div className="grid grid-cols-2 gap-2.5 @xl:grid-cols-4">
      <Stat size="sm" className={STAT_CELL} label={label(t('est.out.federal'))} value={<NumberTicker value={est.federal} format={money} />} note={t(qc ? 'est.out.federalNoteQc' : 'est.out.federalNote')} />
      <Stat
        size="sm"
        className={STAT_CELL}
        label={label(t('est.out.provincial'))}
        value={!picked || est.provincial == null ? '—' : <NumberTicker value={est.provincial} format={money} />}
        note={!picked ? t('est.out.provincialPick') : est.provincial == null ? t('est.out.provincialQc') : t(`prov.${est.input.province}`)}
      />
      <Stat
        size="sm"
        className={STAT_CELL}
        label={label(t(fedOnly ? 'est.out.marginalFed' : 'est.out.marginal'))}
        value={pct(fedOnly ? est.federalMarginalRate : est.marginalRate)}
        note={t('est.out.marginalNote')}
      />
      <Stat
        size="sm"
        className={STAT_CELL}
        label={label(t(fedOnly ? 'est.out.averageFed' : 'est.out.average'))}
        value={pct(fedOnly ? est.federalAverageRate : est.averageRate)}
        note={t('est.out.averageNote')}
      />
    </div>
  );
}

/**
 * The what-if: what $1,000 more in an RRSP would save, a button that tries it, and (the RRSP field and the big
 * number are often off-screen on a phone) a confirmation right beside the button of how the result moved.
 */
export function RrspWhatIf({ scope, saving, note, onTry }: { scope: 'all' | 'fed' | 'qc'; saving: number; note: string | null; onTry: () => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const df = useDateFmt();
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  return (
    <div className="px-5 pt-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-glacier/20 bg-glacier-wash px-4 py-3.5">
        <p className="m-0 min-w-[16ch] flex-1 text-[14.5px] leading-snug text-ink">
          {t(scope === 'qc' ? 'est.rrspTipQc' : scope === 'fed' ? 'est.rrspTipFed' : 'est.rrspTip', {
            amount: money(1000),
            saving: money(saving),
            date: df(returnDates(RATES_YEAR).rrsp, { month: 'long', day: 'numeric', year: 'numeric' }),
          })}
        </p>
        <Button size="md" icon={Plus} onClick={onTry}>
          {t('est.rrspTry', { amount: money(1000) })}
        </Button>
        <p role="status" aria-live="polite" className={cn('m-0 w-full items-center gap-2 text-[14px] font-medium leading-snug text-pine', note ? 'flex' : 'sr-only')}>
          {note ? (
            <>
              <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden />
              <span>{note}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
