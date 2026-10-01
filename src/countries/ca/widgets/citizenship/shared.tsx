'use client';
/** Small pieces shared by the citizenship renderers. */
import { Minus, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import type { Lang } from './data';

/** The widget's content language: French in French, English everywhere else (catalog is EN + FR). */
export function useLang(): Lang {
  const { locale } = useLocale();
  return locale === 'fr' ? 'fr' : 'en';
}

type Fmt = ReturnType<typeof useLocale>['fmt'];
/** Days with at most one decimal: days before PR count as half days, and every figure must add up. */
export const formatDays = (fmt: Fmt, v: number) => fmt.number(v, { maximumFractionDigits: 1 });

/** "1 mars 2023" -> "1er mars 2023" (Canada.ca French style for the first of the month). */
export const firstOf = (s: string, lang: Lang) => (lang === 'fr' ? s.replace(/^1 /, '1er ') : s);

/** − n + counter with 44px targets. The label is one word; qualifiers ("18 ans et plus · 653 $") go on the sub line, which may wrap. */
export function Counter({
  label,
  sub,
  value,
  min = 0,
  max = 12,
  onChange,
  fewer,
  more,
}: {
  label: string;
  sub?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  fewer: string;
  more: string;
}) {
  const { fmt } = useLocale();
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-2 rounded-tile border border-hair bg-card py-2.5 ps-4 pe-3">
      <div className="min-w-0">
        <p className="m-0 text-[15px] font-medium text-ink">{label}</p>
        {/* "18 or older · $653": isolated so a leading amount keeps its place in right-to-left text. */}
        {sub ? (
          <p className="m-0 text-[13px] text-ink-3">
            <bdi>{sub}</bdi>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={label}>
        <IconButton size="md" icon={Minus} label={`${fewer}: ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="border border-hair-2" />
        <output className="min-w-8 text-center font-serif text-[22px] tabular-nums text-ink" aria-live="polite">
          {fmt.number(value)}
        </output>
        <IconButton size="md" icon={Plus} label={`${more}: ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="border border-hair-2" />
      </div>
    </div>
  );
}
