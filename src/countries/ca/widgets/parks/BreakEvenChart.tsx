'use client';
import { useElementSize } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { MAX_DAYS } from './pass-model';

/**
 * Cumulative cost of paying daily vs the flat Discovery Pass, with the break-even day marked. The person's own
 * plan is a dashed line with its label on the chart ("Your plan: 8 days"), so the legend is just the two lines.
 *
 * Paying daily is a staircase, not a slope: the cost only changes on a whole day of visits, rising by one day's
 * admission at each day mark. The staircase therefore crosses the pass line on the riser of the break-even
 * day, which is exactly where the ring sits and where the shaded "pass wins" band begins.
 */
export function BreakEvenChart({ dayCost, passCost, days, breakEven }: { dayCost: number; passCost: number; days: number; breakEven: number | null }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // Cents, like every other amount on the card ($167.50 must never read as $167).
  const money = (n: number) => fmt.money(n, { cents: 'always' });
  const [ref, size] = useElementSize<HTMLDivElement>({ w: 600, h: 0 });
  const W = Math.max(240, size.w);
  const n = Math.min(MAX_DAYS + 2, Math.max(10, days + 2, (breakEven ?? 0) + 3));
  const yMax = Math.max(dayCost * n, passCost) * 1.08;
  const H = W < 480 ? 164 : 184;
  // The top band holds the plan's label, clear of the pass label that sits on the pass line below it.
  const P = { l: 8, r: 8, t: 30, b: 26 };
  const x = (d: number) => P.l + (d / n) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / yMax) * (H - P.t - P.b);
  const be = breakEven != null && breakEven <= n ? breakEven : null;
  const every = n > 32 ? 10 : W < 480 ? (n <= 12 ? 2 : 5) : n <= 12 ? 1 : 5;
  // Flat until each day mark, then up by one day's admission.
  const stairs = `M${x(0)} ${y(0)}` + Array.from({ length: n }, (_, i) => `H${x(i + 1)}V${y(dayCost * (i + 1))}`).join('');
  const plan = x(days) / W;
  const ticks = Array.from({ length: n + 1 }, (_, i) => i).filter((i) => i > 0 && (i % every === 0 || (i === 1 && every === 1)));
  return (
    <figure className="m-0 px-5 pt-5 sm:px-6">
      <div dir="ltr" className="relative" ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
          <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="stroke-hair-2" strokeWidth="1" />
          {be ? <rect x={x(be)} y={P.t} width={W - P.r - x(be)} height={H - P.t - P.b} className="fill-pine/[.07]" /> : null}
          <line x1={P.l} x2={W - P.r} y1={y(passCost)} y2={y(passCost)} className="stroke-pine" strokeWidth="2.5" strokeLinecap="round" />
          <path d={stairs} className="fill-none stroke-maple" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={x(days)} x2={x(days)} y1={20} y2={H - P.b} className="stroke-ink/40" strokeWidth="1.5" strokeDasharray="3 4" />
          {be ? <circle cx={x(be)} cy={y(passCost)} r="6" className="fill-card stroke-pine" strokeWidth="3" /> : null}
          <circle cx={x(days)} cy={y(dayCost * days)} r="4.5" className="fill-maple" />
          {ticks.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-3 font-mono text-[11px]">
              {i}
            </text>
          ))}
        </svg>
        {/* Centred over its line; pinned to the chart's edge when the line is close to one. */}
        <span
          className="absolute top-0 whitespace-nowrap font-mono text-[11px] font-medium leading-4 text-ink-2"
          style={plan < 0.22 ? { left: 0 } : plan > 0.78 ? { right: 0 } : { left: `${plan * 100}%`, transform: 'translateX(-50%)' }}
        >
          <bdi>{t('chart.you', { count: days })}</bdi>
        </span>
        <span className="absolute start-2 font-mono text-[11px] font-medium text-pine" style={{ top: `${(y(passCost) / H) * 100}%`, transform: 'translateY(-130%)' }}>
          {t('chart.pass', { amount: money(passCost) })}
        </span>
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-[3px] w-4 rounded-full bg-maple" aria-hidden />
          {t('chart.daily')}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-[3px] w-4 rounded-full bg-pine" aria-hidden />
          {t('chart.passLine')}
        </span>
        <span className="sr-only">{be ? t('chart.sr', { day: be, pass: money(passCost), daily: money(dayCost) }) : t('chart.srNever', { pass: money(passCost), daily: money(dayCost) })}</span>
      </figcaption>
    </figure>
  );
}
