'use client';
/** Under the career matches: what the tags on the cards mean, and the careers starred on this device. */
import { ArrowUpRight, HandCoins, Star, Zap } from 'lucide-react';
import { ExternalLink, WidgetSection } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { careerUrl, type Career } from './careers';
import type { Lang } from './facts';
import messages from './messages';

/** One line per tag in view, each with the tag's own icon. */
export function ResultNotes({ priority, paidEdOnly, incentive }: { priority: boolean; paidEdOnly: boolean; incentive: boolean }) {
  const t = useMessages(messages);
  if (!priority && !incentive) return null;
  return (
    <div className="mt-4 grid gap-1 text-[13px] leading-snug text-ink-3">
      {priority ? (
        <p className="m-0 flex gap-2">
          <Zap className="mt-0.5 size-3.5 shrink-0 fill-current text-amber" aria-hidden />
          {t('results.priorityNote')}
        </p>
      ) : null}
      {paidEdOnly ? <p className="m-0 ps-[22px]">{t('results.priorityNotePaidEd')}</p> : null}
      {incentive ? (
        <p className="m-0 flex gap-2">
          <HandCoins className="mt-0.5 size-3.5 shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
          {t('results.regularOnly')}
        </p>
      ) : null}
    </div>
  );
}

export function Shortlist({ careers, lang }: { careers: Career[]; lang: Lang }) {
  const t = useMessages(messages);
  if (!careers.length) return null;
  return (
    <WidgetSection title={t('shortlist.title')} aside={<span className="text-[13px] font-medium text-pine">{t('shortlist.count', { count: careers.length })}</span>}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {careers.map((c) => (
          <li key={c.slug}>
            <ExternalLink href={careerUrl(c, lang)} standalone icon={false} className="gap-2 rounded-chip border border-hair-2 bg-card px-3.5 text-[14.5px] no-underline hover:bg-paper-2">
              <Star className="size-4 fill-current text-amber" aria-hidden strokeWidth={1.8} />
              {lang === 'fr' ? c.nameFr : c.name}
              <ArrowUpRight className="flip-rtl size-3.5 text-ink-3" aria-hidden />
            </ExternalLink>
          </li>
        ))}
      </ul>
    </WidgetSection>
  );
}
