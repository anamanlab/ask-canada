'use client';
/**
 * The career matcher's fixed parts, folded under one-line summaries so the matches stay the main thing:
 * who can join, pay and time off, and the five steps to join. The summaries carry the key facts while closed.
 */
import type { ReactNode } from 'react';
import { HandCoins, ListOrdered, UserCheck, type LucideIcon } from 'lucide-react';
import { Disclosure, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { CAF } from './facts';
import messages from './messages';

const REQUIREMENTS = ['age', 'citizen', 'school'] as const;
const STEPS = [1, 2, 3, 4, 5] as const;

const Title = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <>
    <Icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
    {children}
  </>
);

export function JoinFacts({
  facts,
  regular,
  allowanceCareers,
}: {
  facts: typeof CAF;
  /** Regular Force is in play (the allowance, full pay and leave figures are Regular Force only). */
  regular: boolean;
  /** How many careers offer the recruiting allowance today. */
  allowanceCareers: number;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const dollars = (n: number) => fmt.money(n, { cents: 'never' });
  return (
    <WidgetSection title={t('join.section')}>
      <div className="rounded-tile border border-hair bg-card px-4 [&>section:first-child]:border-t-0">
        <Disclosure title={<Title icon={UserCheck}>{t('join.title')}</Title>} summary={<bdi>{t('join.summary', { age: facts.minAge })}</bdi>}>
          <p className="m-0 mb-2 text-[14.5px] text-ink-2">{t('join.intro')}</p>
          <ol className="m-0 mb-3 list-none overflow-hidden rounded-field border border-hair p-0">
            {REQUIREMENTS.map((k, i) => (
              <li key={k} className="flex gap-3 border-hair px-3.5 py-2.5 [&+&]:border-t">
                <span className="mt-px grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] border-hair-2 text-[12px] font-semibold tabular-nums text-ink-2" aria-hidden>
                  {fmt.number(i + 1)}
                </span>
                <p className="m-0 min-w-0 text-[14.5px] leading-snug">
                  <span className="font-medium text-ink">{t(`join.${k}`, { age: facts.minAge })}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-3">{t(`join.${k}Note`)}</span>
                </p>
              </li>
            ))}
          </ol>
        </Disclosure>

        <Disclosure
          title={<Title icon={HandCoins}>{t('pay.title')}</Title>}
          summary={regular ? <bdi>{t('pay.summary', { min: dollars(facts.payMin), max: dollars(facts.payMax), days: facts.leaveDays })}</bdi> : <bdi>{t('pay.summaryPartTime')}</bdi>}
        >
          <dl className="m-0 mb-3 grid grid-cols-3 grid-rows-[auto_auto_auto] overflow-hidden rounded-field border border-hair bg-paper-2">
            <Fact
              label={
                <>
                  <span className="@xl:hidden">{t('stat.payShort')}</span>
                  <span className="hidden @xl:inline">{t('stat.pay')}</span>
                </>
              }
              value={
                <>
                  <span className="@xl:hidden">{dollars(facts.payMin)}</span>
                  <bdi dir="ltr" className="hidden @xl:inline">
                    {t('stat.payRange', { min: dollars(facts.payMin), max: dollars(facts.payMax) })}
                  </bdi>
                </>
              }
              micro={regular ? t('stat.payMicro', { max: dollars(facts.payMax) }) : t('stat.payMicroPartTime')}
              note={regular ? t('stat.payNote') : t('stat.payNotePartTime')}
            />
            <Fact
              label={t('stat.leave')}
              value={fmt.number(facts.leaveDays)}
              micro={regular ? t('stat.leaveUnit') : t('stat.leaveMicroPartTime')}
              note={regular ? t('stat.leaveNoteFull') : t('stat.leaveNotePartTime')}
            />
            <Fact
              label={t('stat.ra')}
              value={dollars(facts.recruitingAllowance)}
              muted={!regular}
              micro={regular ? t('stat.raMicro', { count: allowanceCareers }) : t('stat.raMicroPartTime')}
              note={regular ? t('stat.raNote', { count: allowanceCareers }) : t('stat.raNotePartTime')}
            />
          </dl>
        </Disclosure>

        <Disclosure title={<Title icon={ListOrdered}>{t('steps.title', { count: facts.steps })}</Title>} summary={<bdi>{STEPS.map((n) => t(`steps.${n}`)).join(' · ')}</bdi>}>
          {/* One list: a vertical timeline in a narrow column, five columns across from @xl. You start at step 1 (filled). */}
          <ol className="relative m-0 mb-3 flex list-none flex-col gap-5 p-0 pt-1 @xl:grid @xl:grid-cols-5 @xl:gap-0">
            {STEPS.map((n, i) => (
              <li key={n} className="relative grid grid-cols-[28px_1fr] gap-x-3.5 @xl:block @xl:pe-3">
                {i < STEPS.length - 1 ? (
                  <span aria-hidden className="absolute -bottom-5 start-[13px] top-7 w-0.5 bg-hair-2 @xl:bottom-auto @xl:start-7 @xl:top-[13px] @xl:h-0.5 @xl:w-[calc(100%-28px)]" />
                ) : null}
                <span
                  aria-hidden
                  className={cn(
                    'relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border-2 text-[12.5px] font-semibold tabular-nums',
                    i === 0 ? 'border-ink bg-ink text-paper' : 'border-hair-2 bg-card text-ink-2',
                  )}
                >
                  {fmt.number(n)}
                </span>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold leading-7 text-ink @xl:mt-2.5 @xl:text-[13.5px] @xl:leading-snug">{t(`steps.${n}`)}</div>
                  <div className="text-[13.5px] leading-snug text-ink-3 @xl:mt-0.5 @xl:text-[13px]">{t(`steps.${n}d`)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Disclosure>
      </div>
    </WidgetSection>
  );
}

/** One cell of the join facts row: a short label, a serif figure, and a qualifier (the full note from @xl). */
function Fact({ label, value, micro, note, muted }: { label: ReactNode; value: ReactNode; micro: ReactNode; note: ReactNode; muted?: boolean }) {
  return (
    // Subgrid rows: labels of different lengths still line the three figures up.
    <div className="row-span-3 grid min-w-0 grid-rows-subgrid content-start border-hair px-2.5 py-2.5 [&+&]:border-s @sm:px-3.5 @xl:px-4 @xl:py-3.5">
      <dt className="text-[12.5px] font-semibold leading-tight text-ink-2 [overflow-wrap:anywhere]">{label}</dt>
      <dd className={cn("m-0 mt-1.5 whitespace-nowrap font-serif text-[19px] leading-[1.05] tracking-[-.02em] [font-variation-settings:'opsz'_36] @sm:text-[22px] @xl:text-[26px]", muted ? 'text-ink-3' : 'text-ink')}>{value}</dd>
      <dd className="m-0 mt-1 text-balance text-[12px] leading-snug text-ink-2 @xl:hidden">{micro}</dd>
      <dd className="m-0 mt-1 hidden text-[12.5px] leading-snug text-ink-2 @xl:block">{note}</dd>
    </div>
  );
}
