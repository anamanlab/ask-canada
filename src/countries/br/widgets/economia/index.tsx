'use client';
/**
 * Widget `economia`: one Brazilian macro indicator, from the Banco Central.
 *
 * Two things this widget refuses to do, and both are the point of it. It never shows a number it has not
 * just fetched, and it never shows a fetched number without its date. A Selic or inflation figure quoted
 * without "as of when" is how stale rates turn into confidently wrong advice about a loan or a rent
 * increase, so the observation date is as prominent as the value. When the Central Bank's series turns out
 * to be stale or unreachable, the widget says so instead of showing a number that looks the same as a fresh
 * one — the failure has to be visible, not merely quiet.
 *
 * Built only from core primitives (`@/components/ui`) and design tokens; no user-visible string in TSX.
 */
import { LineChart, TriangleAlert } from 'lucide-react';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Point = { date: string; value: number };
type Output = {
  status: 'ok' | 'stale' | 'unavailable' | 'unknown-series';
  series?: string;
  name?: string;
  unit?: string;
  latest?: Point;
  points?: Point[];
  staleByDays?: number;
  reason?: string;
  available?: { key: string; name: string }[];
  sources?: ToolSource[];
};

/** The "small trend visualization": shape only. The value and date below it are the real content. */
function Spark({ points }: { points: Point[] }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = 100 / (points.length - 1);
  const d = points
    .map((p, i) => `${(i * step).toFixed(2)},${(26 - ((p.value - min) / span) * 24).toFixed(2)}`)
    .join(' ');
  const rising = values[values.length - 1] > values[0];
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full" role="presentation" aria-hidden focusable="false">
      <polyline
        points={d}
        fill="none"
        stroke={rising ? 'var(--amber)' : 'var(--pine)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function EconomiaSeries({ part }: WidgetProps<{ question: string; count?: number }, Output>) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const out = part.state === 'output-available' ? part.output : undefined;

  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('title')} icon={LineChart} tone="amber" rows={2} />;
  }

  // Two states that must not be drawn like data: nothing matched, or the fetch failed.
  if (out.status === 'unknown-series') {
    return (
      <WidgetShell icon={LineChart} tone="amber" title={t('title')} subtitle={t('subtitle')} footnote={t('note')}>
        <div className="px-5 pb-5 sm:px-6">
          <p className="m-0 text-[15px] leading-snug text-ink-2">{t('unsupported')}</p>
          <ul className="m-0 mt-3 list-none grid list-none gap-1 p-0 text-[14px] text-ink-3">
            {out.available?.map((s) => (
              <li key={s.key}>{s.name}</li>
            ))}
          </ul>
        </div>
      </WidgetShell>
    );
  }

  if (out.status === 'unavailable' || !out.latest) {
    return (
      <WidgetShell
        icon={LineChart}
        tone="amber"
        title={t('title')}
        subtitle={out.name ?? t('subtitle')}
        sources={out.sources}
        footnote={t('note')}
      >
        <div className="flex items-start gap-3 px-5 pb-5 sm:px-6">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
          <p className="m-0 text-[15px] leading-snug text-ink-2">{t('unavailable')}</p>
        </div>
      </WidgetShell>
    );
  }

  const { latest, points = [] } = out;
  const stale = out.status === 'stale';

  return (
    <WidgetShell
      icon={LineChart}
      tone="amber"
      title={t('title')}
      subtitle={out.name}
      sources={out.sources}
      footnote={t('note')}
    >
      <div className="px-5 pb-5 pt-1 sm:px-6">
        <p className="m-0 flex items-baseline gap-2">
          <span className="font-display text-[34px] leading-none font-semibold tracking-tight text-ink">
            {fmt.number(latest.value, { maximumFractionDigits: 4 })}
          </span>
          {out.unit ? <span className="text-[14px] font-medium text-ink-3">{out.unit}</span> : null}
        </p>
        {/* The date is not a footnote. It is what makes the number above usable. */}
        <p className="m-0 mt-1.5 text-[13px] text-ink-3">
          {t('observedOn')} {fmt.date(latest.date, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {points.length > 1 ? (
          <div className="mt-4">
            <Spark points={points} />
            <p className="m-0 mt-1 text-[12px] text-ink-3">
              {t('trend')} {fmt.date(points[0].date, { day: 'numeric', month: 'short' })} –{' '}
              {fmt.date(latest.date, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ) : null}

        {stale ? (
          <p className="m-0 mt-4 flex items-start gap-2.5 rounded-lg bg-amber-wash px-3 py-2.5 text-[13px] leading-snug text-ink-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
            {t('stale')}
          </p>
        ) : null}
      </div>
    </WidgetShell>
  );
}

export const renderers: Renderers = { economiaSeries: EconomiaSeries };
export default renderers;