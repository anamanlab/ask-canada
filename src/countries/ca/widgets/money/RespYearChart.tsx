'use client';
/**
 * The RESP balance year by year, stacked by where the money came from. Point at (or tap) a year and the line
 * above the chart and the legend under it give that year's figures; left alone they show the last year.
 * The chart is decorative for assistive tech: the same numbers are in a table for screen readers.
 */
import { useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { RespResult } from './calc/resp';
import { RESP } from './data';
import { useMoneyFormat } from './format';
import messages from './messages';
import { Legend, SWATCH } from './shared';

const MOTION = 'transition-transform duration-500 ease-out motion-reduce:transition-none';
/** Slides a full-height layer down so that only `--h` of it shows above the baseline. */
const RISE = `[translate:0_calc(100%_-_var(--h))] ${MOTION}`;

/** Two round amounts, a third and two thirds of the way up or so, for the faint guide lines. */
function guides(max: number): number[] {
  const rough = max / 3;
  const unit = 10 ** Math.floor(Math.log10(Math.max(1, rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * unit).find((s) => s >= rough) ?? rough;
  return [step, step * 2].filter((v) => v <= max);
}

export function RespYearChart({ r }: { r: RespResult }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { money } = useMoneyFormat();
  const [picked, setPicked] = useState<number | null>(null);
  const count = r.years.length;
  const at = picked != null && picked < count ? picked : count - 1;
  const shown = r.years[at];
  const max = Math.max(1, ...r.years.map((y) => y.balance));
  const many = count > 9;
  // A plan that starts at 15 or 16 has only a few years: fixed-width bars, centred, instead of a sparse full-width chart.
  const few = count <= 4;
  const row = few ? 'justify-center gap-8' : 'gap-[3px] @xl:gap-1.5';
  const col = few ? 'w-11 flex-none' : 'min-w-0 flex-1';
  const ageOf = (age: number) => (age === 0 ? t('resp.age.newborn') : t('resp.years.age', { age }));
  return (
    <figure className="m-0">
      <div className="flex items-baseline justify-between gap-3" aria-hidden>
        <p className="m-0 text-[13.5px] text-ink-2">
          <bdi>{t('resp.years.at', { age: ageOf(shown.age), year: String(shown.year) })}</bdi>
        </p>
        <p className="m-0 font-serif text-[22px] leading-none tracking-[-.02em] text-ink tabular-nums">{money(shown.balance)}</p>
      </div>
      {/* Bars are full height and move with transforms only (the shell slides up, the stack inside is scaled to
          the same height), so changing a slider never animates layout and the rounded tops stay crisp. */}
      <div
        className="relative mt-1 h-[176px] border-b border-hair-2 pt-8"
        aria-hidden
        onPointerLeave={(e) => {
          // A finger lifting leaves the chart too: the year someone tapped stays chosen.
          if (e.pointerType === 'mouse') setPicked(null);
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-8">
          {guides(max).map((v, i) => (
            <span key={i} className={cn('absolute inset-0 border-t border-dashed border-hair-2', RISE)} style={{ '--h': `${(v / max) * 100}%` } as CSSProperties}>
              <span className="absolute -top-[15px] start-0 font-mono text-[10px] leading-none text-ink-3">{fmt.money(v, { cents: 'never', compact: true })}</span>
            </span>
          ))}
        </div>
        <div className={cn('relative flex h-full items-end', row)}>
          {r.years.map((y, i) => {
            const parts = [
              { k: 'you', v: y.cum.you, c: SWATCH.ink },
              { k: 'cesg', v: y.cum.grants, c: SWATCH.grant },
              { k: 'clb', v: y.cum.clb, c: SWATCH.amber },
              { k: 'growth', v: y.cum.growth, c: SWATCH.glacier },
            ];
            const share = y.balance / max;
            const maxHere = r.capAge === y.age && y.age < RESP.cesgLastAge;
            return (
              <div
                key={y.year}
                className={cn('relative flex h-full justify-center', col)}
                style={{ '--h': `${share * 100}%`, '--s': share } as CSSProperties}
                onPointerEnter={() => setPicked(i)}
                onPointerDown={() => setPicked(i)}
              >
                {maxHere ? (
                  <span className={cn('pointer-events-none absolute inset-0 z-10', RISE)}>
                    <span className="absolute bottom-full end-1/2 mb-2 -me-2.5 whitespace-nowrap rounded-full bg-card px-2 py-[3px] text-[11px] font-medium leading-none text-pine shadow-sm ring-1 ring-pine/25">
                      <bdi>{t('resp.years.maxShort', { max: money(RESP.cesgLifetime) })}</bdi>
                    </span>
                    <span className="absolute bottom-full start-1/2 mb-px h-[7px] w-px -translate-x-1/2 bg-pine/60 rtl:translate-x-1/2" />
                  </span>
                ) : null}
                <div className={cn('h-full w-full max-w-[44px] overflow-hidden transition-opacity duration-200 motion-reduce:transition-none', picked != null && i !== at && 'opacity-45')}>
                  <div className={cn('h-full overflow-hidden rounded-t-[6px]', RISE)}>
                    <div className={cn('flex h-full origin-top flex-col-reverse [scale:1_var(--s)]', MOTION)}>
                      {parts.map((p) => (
                        <span key={p.k} className={cn('block w-full', p.c)} style={{ flexGrow: p.v, flexBasis: 0 }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={cn('mt-2 flex font-mono text-[10.5px] text-ink-3', row)} aria-hidden>
        {r.years.map((y, i) => (
          <span key={y.year} className={cn('text-center tabular-nums', col, picked != null && i === at && 'font-medium text-ink')}>
            {/* Every other age, counted back from the last bar, so the final age is always shown and never crowds
                its neighbour; the chosen year always shows its own. */}
            {!many || (count - 1 - i) % 2 === 0 || (picked != null && i === at) ? y.age : ''}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{t('resp.years.caption')}</figcaption>
      <Legend
        className="mt-3 justify-center text-[12.5px]"
        items={[
          { key: 'you', label: t('resp.split.you'), tone: 'ink', display: money(shown.cum.you) },
          { key: 'cesg', label: t('resp.split.cesg'), tone: 'grant', display: money(shown.cum.grants) },
          ...(r.totals.clb > 0 ? [{ key: 'clb', label: t('resp.split.clb'), tone: 'amber' as const, display: money(shown.cum.clb) }] : []),
          ...(r.totals.growth > 0 ? [{ key: 'growth', label: t('resp.years.growth'), tone: 'glacier' as const, display: money(shown.cum.growth) }] : []),
        ]}
      />
      <table className="sr-only">
        <caption>{t('resp.years.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('resp.table.age')}</th>
            <th scope="col">{t('resp.table.you')}</th>
            <th scope="col">{t('resp.table.grant')}</th>
            <th scope="col">{t('resp.table.clb')}</th>
            <th scope="col">{t('resp.table.balance')}</th>
          </tr>
        </thead>
        <tbody>
          {r.years.map((y) => (
            <tr key={y.year}>
              <th scope="row">{y.age}</th>
              <td>{money(y.contribution)}</td>
              <td>{money(y.basic + y.additional)}</td>
              <td>{money(y.clb)}</td>
              <td>{money(y.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
