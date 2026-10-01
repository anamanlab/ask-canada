'use client';
/** The filter rail above the job list: one chip per filter with its count; scrolls sideways on a phone. */
import { Chip } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Filter } from './search-model';

export function FilterChips({ filters, counts, value, onChange }: { filters: Filter[]; counts: Record<Filter, number>; value: Filter; onChange: (f: Filter) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // Chips past the edge fade out toward whichever side still has more (mirrored in RTL).
  const { ref, maskStyle } = useScrollEdges<HTMLDivElement>({ threshold: 4 });
  return (
    <div
      // The offered filters change with the list (saved view, a job unsaved): measure the new rail afresh.
      key={filters.join(' ')}
      ref={ref}
      style={maskStyle}
      role="group"
      aria-label={t('search.filterLabel')}
      className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6"
    >
      {filters.map((f) => {
        const on = value === f;
        return (
          <Chip
            key={f}
            selected={on}
            onClick={() => onChange(f)}
            className={cn(
              'shrink-0 px-3.5 text-[13.5px] shadow-none hover:translate-y-0 hover:shadow-none',
              on ? 'bg-ink text-paper hover:bg-ink' : 'border-hair-2 hover:border-ink-3',
            )}
          >
            {/* The count is its own isolated run, spaced by the gap: in RTL it never joins a Latin label ("All12"). */}
            <span className="inline-flex items-baseline gap-1.5">
              <span>{t(`search.filter.${f}`)}</span>
              <bdi className={cn('font-mono text-[11.5px] tabular-nums', on ? 'text-paper/70' : 'text-ink-3')}>{fmt.number(counts[f])}</bdi>
            </span>
          </Chip>
        );
      })}
    </div>
  );
}
