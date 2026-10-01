'use client';
/** One youth, student or government program: what it is, why it fits (or doesn't), and its official pages. */
import { Check, CircleHelp, Minus } from 'lucide-react';
import { Badge, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { STUDENT_PAY, type Lang } from './data';
import messages from './messages';
import { programFacts, type Evaluated, type Fit } from './programs';
import type { Stage } from './types';
import { nbHyphens } from './text';

const FIT: Record<Fit, { tone: 'ok' | 'info' | 'neutral'; icon: typeof Check; iconCls: string; card: string }> = {
  yes: { tone: 'ok', icon: Check, iconCls: 'text-pine', card: 'border-pine/20 bg-card shadow-sm' },
  maybe: { tone: 'info', icon: CircleHelp, iconCls: 'text-glacier', card: 'border-hair bg-card' },
  no: { tone: 'neutral', icon: Minus, iconCls: 'text-ink-3', card: 'border-hair bg-paper-2' },
};

/** Each link keeps a 44px target; negative block margins let two wrapped rows sit close together. */
const LINK = '-my-1.5 text-[13.5px]';

/** `stage` picks the student pay floor quoted on the FSWEP card (secondary, or college and university). */
export function ProgramCard({ p, lang, stage }: { p: Evaluated; lang: Lang; stage?: Stage }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const values = {
    ...programFacts(p.id),
    // Secondary and college students start at the same rate; university undergraduates start higher.
    level: stage === 'high-school' ? 'secondary' : stage === 'post-secondary' ? 'post' : 'any',
    pay: fmt.money(STUDENT_PAY.secondary, { cents: 'always' }),
    payUni: fmt.money(STUDENT_PAY.undergrad.min, { cents: 'always' }),
  };
  const f = FIT[p.fit];
  const name = t(`programs.${p.id}.name`);
  const eyebrow = t(`programs.cat.${p.id}`).split(' · ');
  return (
    <article className={cn('flex w-full flex-col rounded-tile border px-4 py-4', f.card)}>
      {/* The badge stays pinned at the top end on every card; a long eyebrow wraps in its own column. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
        <p className={cn('m-0 pt-[3px] font-mono text-[11px] font-medium uppercase tracking-[.1em]', p.fit === 'no' ? 'text-ink-2' : 'text-ink-3')}>
          {eyebrow.map((part, i) => (
            <span key={part}>
              {/* The dot stays glued to the part it introduces; a long part ("Fonction publique fédérale") may still wrap. */}
              {i > 0 ? ' ·\u00a0' : null}
              {part}
            </span>
          ))}
        </p>
        <Badge tone={f.tone} icon={f.icon}>
          {t(`programs.fit.${p.fit}`)}
        </Badge>
      </div>
      {/* "Co‑op" never splits at its hyphen on a phone. */}
      <h4 className="m-0 mt-1.5 text-[16px] font-semibold leading-snug text-ink">{nbHyphens(name)}</h4>
      <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">{t(`programs.${p.id}.what`, values)}</p>
      <p className={cn('m-0 mt-2.5 flex items-start gap-2 text-[13.5px] leading-snug', p.fit === 'no' ? 'text-ink-2' : 'text-ink')}>
        <f.icon className={cn('mt-0.5 size-3.5 shrink-0', f.iconCls)} aria-hidden strokeWidth={2.2} />
        <span>{t(`programs.why.${p.id}.${p.why}`, values)}</span>
      </p>
      <div className="mt-auto flex flex-wrap gap-x-4 pt-4">
        <ExternalLink href={p.url[lang]} standalone className={cn(LINK, 'font-semibold')}>
          {t('programs.learnMore')}
          <span className="sr-only"> {t('programs.learnMoreAbout', { name })}</span>
        </ExternalLink>
        {p.search ? (
          <ExternalLink href={p.search[lang]} standalone className={cn(LINK, 'text-ink-2 hover:text-ink')}>
            {/* One flex item, so the label keeps its spaces ("Search GC Jobs") and wraps as a whole. */}
            <span>{t(`programs.${p.id}.search`)}</span>
          </ExternalLink>
        ) : null}
      </div>
    </article>
  );
}
