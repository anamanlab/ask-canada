'use client';
import { NumberTicker } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { ExplainOutput } from './explain';
import messages from './messages';

type Amount = ExplainOutput['extracted']['amounts'][number];

const TONE: Partial<Record<Amount['kind'], string>> = { refund: 'text-pine', benefit: 'text-pine', owing: 'text-maple-ink' };

/**
 * The amounts the verdict doesn't already state, as quiet rows (label, then the figure in serif): they inform,
 * they never outweigh the verdict above them.
 */
export function Amounts({ amounts, className }: { amounts: Amount[]; className?: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <dl className={cn('m-0', className)}>
      {amounts.map((a, i) => {
        const kind = t(`amt.${a.kind}`);
        const named = a.kind === 'refund' || a.kind === 'owing' || a.kind === 'benefit';
        return (
          <div key={`${i}:${a.kind}:${a.label}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 border-t border-hair py-3.5 first:border-t-0 first:pt-0 last:pb-0">
            <dt className="text-[15.5px] leading-snug text-ink-2">
              {a.label || kind}
              {a.label && named && a.label.toLowerCase() !== kind.toLowerCase() ? <span className="text-ink-3"> · {kind}</span> : null}
            </dt>
            <dd className={cn("m-0 font-serif text-[24px] leading-none tracking-[-.015em] tabular-nums [font-variation-settings:'opsz'_36]", (a.amount !== 0 && TONE[a.kind]) || 'text-ink')}>
              {/* A whole amount counts up in whole dollars; one with cents keeps its two digits all the way. */}
              <NumberTicker value={a.amount} format={(n) => fmt.money(n, { cents: Number.isInteger(a.amount) ? 'never' : 'always' })} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
