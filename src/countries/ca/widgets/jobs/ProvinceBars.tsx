'use client';
/** Where the jobs are (Canada-wide searches): the six provinces with the most postings; a tap asks about that one. */
import { motion, useReducedMotion } from 'motion/react';
import { WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Province } from './data';
import messages from './messages';
import { useProvinceName } from './parts';
import { nbHyphens } from './text';

const SHOWN = 6;

export function ProvinceBars({ byProvince, onPick }: { byProvince: { code: Province; count: number }[]; onPick: (code: Province) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const reduce = useReducedMotion();
  const provinceName = useProvinceName();
  const top = byProvince.filter((p) => p.count > 0).toSorted((a, b) => b.count - a.count).slice(0, SHOWN);
  if (top.length < 2) return null;
  const max = top[0].count;
  return (
    <WidgetSection title={t('search.where')}>
      <ul className="m-0 grid list-none gap-1.5 p-0 @xl:grid-cols-2 @xl:gap-x-5">
        {top.map((p, i) => (
          <li key={p.code}>
            <button
              type="button"
              onClick={() => onPick(p.code)}
              className="group grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-field px-2 py-2 text-start hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-ink @md:grid-cols-[11.5rem_minmax(0,1fr)_3rem] @md:py-0 @xl:grid-cols-[12rem_minmax(0,1fr)_2.5rem]"
              aria-label={t('search.provinceAria', { count: p.count, province: provinceName(p.code) })}
            >
              {/* Phones: the name gets its own line, so "Terre-Neuve-et-Labrador" never splits mid-word. */}
              <span className="text-[14px] font-medium leading-tight text-ink">{nbHyphens(provinceName(p.code))}</span>
              {/* The track is mirrored in RTL, so the bar always grows from the inline start. */}
              <span className="relative col-span-2 row-start-2 h-2.5 overflow-hidden rounded-full bg-paper-2 group-hover:bg-card @md:col-span-1 @md:col-start-2 @md:row-start-1 rtl:-scale-x-100">
                {/* A full-width bar slid in from the start: only `transform` animates, and the round cap keeps its shape. */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-glacier"
                  initial={reduce ? false : { x: '-100%' }}
                  animate={{ x: `${-(1 - Math.max(0.03, p.count / max)) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 22, delay: reduce ? 0 : i * 0.04 }}
                />
              </span>
              <span className="col-start-2 row-start-1 text-end text-[13px] font-medium tabular-nums text-ink-2 @md:col-start-3">{fmt.number(p.count)}</span>
            </button>
          </li>
        ))}
      </ul>
    </WidgetSection>
  );
}
