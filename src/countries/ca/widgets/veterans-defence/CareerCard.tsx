'use client';
/** One matched career: role, name (links to its forces.ca page), environments, hours, incentives, and the star. */
import { Anchor, ArrowUpRight, Clock, GraduationCap, HandCoins, Plane, Star, Trees, Zap, type LucideIcon } from 'lucide-react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { careerUrl, type Env, type Hours, type Match } from './careers';
import type { Lang } from './facts';
import type { ListJoin } from './hooks';
import messages from './messages';

const ENV_ICON: Record<Env, LucideIcon> = { army: Trees, navy: Anchor, air: Plane };
const ENV_ORDER: Env[] = ['army', 'navy', 'air'];
/** The tags along the bottom of a card: always the same place, whatever the career. They wrap, never truncate. */
const TAG = 'inline-flex min-h-6 items-center gap-1 rounded-chip px-2 py-0.5 text-[12.5px] font-medium leading-snug';

export function CareerCard({
  m,
  lang,
  hours,
  showMatched,
  saved,
  onSave,
  join,
}: {
  m: Match;
  lang: Lang;
  /** The answer to "full-time or part-time?": the card shows the side that was picked. */
  hours: Hours;
  showMatched: boolean;
  saved: boolean;
  onSave: () => void;
  join: ListJoin;
}) {
  const t = useMessages(messages);
  const c = m.career;
  const name = lang === 'fr' ? c.nameFr : c.name;
  const envs = ENV_ORDER.filter((e) => c.envs.includes(e));
  // The recruiting allowance, signing bonuses and priority processing are stated by forces.ca for the Regular
  // Force: none of them shows once the person has picked the Reserve.
  const regular = hours !== 'part-time';
  const hoursLabel = hours === 'either' ? t('card.hours', { kind: c.fullTime && c.partTime ? 'both' : c.fullTime ? 'full' : 'part' }) : t(`sum.hours.${hours}`);
  const ra = regular && c.recruitingAllowance;
  const signing = regular && c.signingBonus;
  const priority = regular && c.priority;
  const saveLabel = t(saved ? 'card.unsave' : 'card.save', { name });
  return (
    <article className="group relative flex h-full flex-col rounded-tile border border-hair bg-card px-4 pb-3 pt-3.5 shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-spring hover:-translate-y-px hover:border-hair-2 hover:shadow-md motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[12.5px] font-medium leading-snug text-ink-3">{c.officer ? t('card.officer') : t('card.ncm')}</p>
          <h5 className="m-0 mt-0.5 text-[17px] font-semibold leading-snug tracking-[-.012em] text-ink">
            {/* The whole card is the link's target (the star sits above it). */}
            <ExternalLink href={careerUrl(c, lang)} icon={false} className="py-0 font-semibold no-underline after:absolute after:inset-0 after:rounded-tile">
              {name}
            </ExternalLink>
          </h5>
        </div>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saveLabel}
          title={saveLabel}
          className="relative z-[1] -me-2 -mt-1.5 grid size-11 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <Star className={cn('size-[19px]', saved && 'fill-current text-amber')} strokeWidth={1.8} aria-hidden />
        </button>
      </div>
      <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
        {/* forces.ca lists no environment for some careers (e.g. medical specialists): show nothing rather than a gap in the data. */}
        {envs.length ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1" aria-hidden>
              {envs.map((e) => {
                const Icon = ENV_ICON[e];
                return <Icon key={e} className="size-3.5 text-ink-3" strokeWidth={1.8} />;
              })}
            </span>
            {join(envs.map((e) => t(`env.${e}`)))}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-ink-3" strokeWidth={1.8} aria-hidden />
          {hoursLabel}
        </span>
      </p>
      {showMatched && m.matched.length ? <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3">{t('card.matched', { list: join(m.matched.map((k) => t(`cat.${k}`))) })}</p> : null}
      {/* Always the last row, so tags and the "opens forces.ca" arrow sit in the same place on every card. */}
      <div className="mt-auto flex items-center gap-2 pt-3">
        <p className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {priority ? (
            // forces.ca's own wording as the title: "Priority Application Processing – Paid Education Entry Plan only".
            <span title={t(c.priorityPaidEdOnly ? 'card.priorityPaidEd' : 'card.priority')} className={cn(TAG, 'bg-amber-wash text-ink')}>
              <Zap className="size-3 shrink-0 fill-current text-amber" aria-hidden />
              {t(c.priorityPaidEdOnly ? 'card.priorityPaidEdTag' : 'card.priorityTag')}
            </span>
          ) : null}
          {ra || signing ? (
            <span className={cn(TAG, 'bg-pine-wash text-ink')}>
              <HandCoins className="size-3.5 shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
              {ra && signing ? t('card.raAndSigning') : ra ? t('card.raShort') : t('card.signing')}
            </span>
          ) : null}
          {m.via === 'paid-ed' ? (
            <span className={cn(TAG, 'bg-glacier-wash text-ink')}>
              <GraduationCap className="size-3.5 shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
              {t('card.paidEd')}
            </span>
          ) : null}
          {priority || ra || signing || m.via === 'paid-ed' ? null : <span className="text-[12.5px] text-ink-3">{t('card.details')}</span>}
        </p>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full border border-hair text-ink-2 transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-paper group-has-[a:focus-visible]:border-ink"
        >
          <ArrowUpRight className="flip-rtl size-4" strokeWidth={1.9} />
        </span>
      </div>
    </article>
  );
}
