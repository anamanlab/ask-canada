'use client';
/** The child benefit by family income: the curve for these children, with a marker at the person's income. */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { ccbAnnual, childDisabilityAnnual } from '../calc';
import messages from '../messages';
import { WHOLE } from '../parts';

export function CcbCurve({ income, u6, o6, dis }: { income: number; u6: number; o6: number; dis: number }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const top = 250_000;
  const f = (x: number) => ccbAnnual(x, u6, o6) + childDisabilityAnnual(x, dis);
  const peak = f(0) || 1;
  const pts = Array.from({ length: 101 }, (_, i) => (i / 100) * top).map((x) => [x / top, f(x) / peak] as const);
  const W = 600;
  const H = 150;
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * W).toFixed(1)},${(H - y * (H - 8)).toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const cx = Math.min(income, top) / top;
  const cy = f(Math.min(income, top)) / peak;
  const compact = (n: number) => fmt.money(n, { cents: 'never', compact: true });
  // The marker and its label ride on full-size layers moved by `translate` (a percentage of the chart), so
  // only transforms animate. The label's layer stays within 8% of either edge.
  const rise = cy * ((H - 8) / H) * 100;
  const layer = 'pointer-events-none absolute inset-0 transition-[translate] duration-300 ease-spring motion-reduce:transition-none';
  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-[13px] font-medium text-ink-2">
        <bdi>{t('est.ccb.chart')}</bdi>
      </figcaption>
      <div dir="ltr" className="relative h-[150px]" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={W} y1={H - g * (H - 8)} y2={H - g * (H - 8)} className="stroke-hair" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} className="fill-pine/12" />
          <path d={line} className="fill-none stroke-pine" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1={cx * W} x2={cx * W} y1={H - cy * (H - 8)} y2={H} className="stroke-ink/40" strokeDasharray="3 3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className={layer} style={{ translate: `${cx * 100}% ${-rise}%` }}>
          <span className="absolute bottom-0 left-0 size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card bg-maple shadow-md" />
        </span>
        <span className={layer} style={{ translate: `${Math.min(Math.max(cx * 100, 8), 92)}% ${-rise}%` }}>
          <span className="absolute bottom-3.5 left-0 -translate-x-1/2 whitespace-nowrap rounded-chip bg-ink px-2 py-0.5 font-mono text-[11px] font-medium text-paper">
            {t('est.ccb.you')} · {money(f(Math.min(income, top)))}
          </span>
        </span>
      </div>
      <div dir="ltr" className="mt-2 flex justify-between font-mono text-[11px] text-ink-3" aria-hidden>
        {[0, 50_000, 100_000, 150_000, 200_000, 250_000].map((x) => (
          <span key={x}>{compact(x)}</span>
        ))}
      </div>
      <p className="sr-only">{t('est.ccb.chartSr', { top: money(top), from: money(f(0)), to: money(f(top)), income: money(income), annual: money(f(income)) })}</p>
    </figure>
  );
}
