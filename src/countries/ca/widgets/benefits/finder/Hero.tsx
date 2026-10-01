'use client';
/**
 * The finder's hero: the estimated total (or EI first, when they lost a job), how it adds up, the answers it is
 * based on (assumptions dashed, each one a way into the questions) and the next payment date.
 */
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, BookmarkCheck, PencilLine } from 'lucide-react';
import { ExternalLink, LiveRegion, NumberTicker } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { FinderOutput } from '../build';
import type { Profile } from '../calc';
import messages from '../messages';
import { WHOLE } from '../parts';
import { PROGRAM_LOOK, type Known, type Result } from './look';

export function Hero({
  heroRef,
  result,
  payments,
  eiApply,
  onEdit,
  onEditIntent,
  onUseSaved,
  profile,
  known,
  editing,
}: {
  heroRef: React.Ref<HTMLDivElement>;
  result: Result;
  payments: FinderOutput['payments']['next'];
  eiApply: string;
  onEdit: () => void;
  /** Pointer or focus reached an "edit" control: the questions can start loading. */
  onEditIntent: () => void;
  /** Set when answers saved on this device can fill in for a question that gave none. */
  onUseSaved?: () => void;
  profile: Profile;
  known: Known;
  editing: boolean;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const reduce = useReducedMotion();
  const live = result.matches.filter((m) => m.status !== 'no');
  // Lost a job: EI is the money that matters and it has a 4-week window, so it leads, even before any income is
  // given (then with its weekly maximum instead of an estimate).
  const ei = live.find((m) => m.id === 'ei' && m.status === 'apply');
  const estimated = live.filter((m) => m.annual);
  const extra = live.filter((m) => !m.annual && m !== ei).length;
  const next = estimated
    .flatMap((m) => {
      const date = m.pay ? payments[m.pay]?.[0] : undefined;
      return date ? [{ id: m.id, date }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const kids = profile.childrenUnder6 + profile.children6to17;
  // `key` is an answer that may still be an assumption; facts (province, flags that are on) are always theirs.
  const chips: { id: string; key?: keyof Known; label: string }[] = [
    { id: 'household', key: 'household', label: t(`profile.${profile.household}`) },
    { id: 'age', key: 'age', label: t(`q.age.${profile.age}`) },
    ...(profile.province ? [{ id: 'province', label: t(`province.${profile.province}`) }] : []),
    { id: 'kids', key: 'kids', label: t('profile.kids', { count: kids }) },
    // Never show a made-up income as theirs: until they give one, the chip asks for it.
    { id: 'income', key: 'income', label: known.income ? t('profile.income', { amount: money(profile.income) }) : t('profile.incomeMissing') },
    // How much is from work changes the workers benefit and GIS: say so when it's an assumption.
    ...(known.income ? [{ id: 'work', key: 'work' as const, label: t('profile.work', { amount: money(profile.workIncome) }) }] : []),
    // The answers that switch programs on or off, so the results explain themselves (a student in Quebec, etc.).
    ...(profile.jobLoss ? [{ id: 'jobLoss', label: t('profile.jobLoss') }] : []),
    ...(profile.student ? [{ id: 'student', label: t('profile.student') }] : []),
    ...(profile.disability ? [{ id: 'disability', label: t('profile.disability') }] : []),
    ...(profile.childDisability > 0 && kids > 0 ? [{ id: 'childDisability', label: t('profile.childDisability') }] : []),
    ...(profile.dentalInsurance ? [{ id: 'dental', label: t('profile.dental') }] : []),
  ];
  const hit = "relative after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']";
  const eiLink = (
    <ExternalLink
      href={eiApply}
      standalone
      icon={false}
      className="mt-3.5 gap-1.5 rounded-full bg-ink px-4 text-[14.5px] font-semibold text-paper no-underline shadow-sm transition hover:-translate-y-px hover:shadow-md"
    >
      <bdi>{t('hero.ei.apply')}</bdi>
      <ArrowUpRight className="size-4 flip-rtl" strokeWidth={2} aria-hidden />
    </ExternalLink>
  );
  // One settled sentence for screen readers: the figures above tick and change with every slider step.
  const eiOthers = result.total > 0 ? ` ${t('hero.ei.others', { amount: money(result.total), count: estimated.length })}` : '';
  const spoken =
    ei && ei.weekly == null
      ? `${t('hero.eiCap.label')} ${money(ei.upTo ?? 0)} ${t('hero.ei.unit')}.${known.income ? eiOthers : ''}`
      : !known.income
        ? t('hero.start.title')
        : ei
          ? `${t('hero.ei.label')} ${money(ei.weekly ?? 0)} ${t('hero.ei.unit')}.${eiOthers}`
          : result.total > 0
            ? t('hero.sr', { amount: money(result.total) })
            : extra
              ? t('hero.none')
              : t('hero.noneTitle');
  const editProps = { onClick: onEdit, onPointerEnter: onEditIntent, onFocus: onEditIntent };

  return (
    <div
      ref={heroRef}
      className="mx-3 scroll-mt-24 overflow-hidden rounded-card border border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_14%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_50%,color-mix(in_oklab,var(--a-violet)_10%,transparent))] px-5 py-5 @xl:mx-4"
    >
      <LiveRegion text={spoken} />
      <div className="min-w-0">
        {ei && ei.weekly == null ? (
          <>
            <p className="m-0 text-[14px] font-medium text-ink-2"><bdi>{t('hero.eiCap.label')}</bdi></p>
            <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 font-serif text-[46px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
              <bdi dir="ltr">{money(ei.upTo ?? 0)}</bdi>
              <span className="font-sans text-[16px] font-medium tracking-[-.005em] text-ink-3"><bdi>{t('hero.ei.unit')}</bdi></span>
            </p>
            <p className="m-0 mt-2 max-w-[52ch] text-[14.5px] text-ink-2"><bdi>{t('hero.eiCap.sub')}</bdi></p>
            {eiLink}
          </>
        ) : !known.income ? (
          <>
            <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink"><bdi>{t('hero.start.title')}</bdi></p>
            <p className="m-0 mt-1.5 text-[14.5px] text-ink-2"><bdi>{t('hero.start.body')}</bdi></p>
          </>
        ) : ei ? (
          <>
            <p className="m-0 text-[14px] font-medium text-ink-2"><bdi>{t('hero.ei.label')}</bdi></p>
            <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 font-serif text-[46px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
              <bdi dir="ltr">
                <NumberTicker value={ei.weekly ?? 0} format={money} />
              </bdi>
              <span className="font-sans text-[16px] font-medium tracking-[-.005em] text-ink-3"><bdi>{t('hero.ei.unit')}</bdi></span>
            </p>
            <p className="m-0 mt-2 max-w-[52ch] text-[14.5px] text-ink-2"><bdi>{t('hero.ei.sub')}</bdi></p>
            {eiLink}
          </>
        ) : result.total > 0 ? (
          <>
            <p className="m-0 text-[14px] font-medium text-ink-2"><bdi>{t('hero.label')}</bdi></p>
            <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 font-serif text-[46px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
              <bdi dir="ltr">
                <NumberTicker value={Math.round(result.total)} format={money} />
              </bdi>
              <span className="font-sans text-[16px] font-medium tracking-[-.005em] text-ink-3"><bdi>{t('hero.perYear')}</bdi></span>
            </p>
            <p className="m-0 mt-2 text-[14.5px] text-ink-2"><bdi>{t('hero.perMonth', { amount: money(result.monthlyTotal), count: estimated.length })}</bdi></p>
            {extra ? <p className="m-0 mt-0.5 text-[14px] text-ink-3"><bdi>{t('hero.plus', { count: extra })}</bdi></p> : null}
          </>
        ) : (
          <>
            <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink"><bdi>{extra ? t('hero.none') : t('hero.noneTitle')}</bdi></p>
            <p className="m-0 mt-1.5 max-w-[52ch] text-[14.5px] text-ink-2"><bdi>{extra ? t('hero.noneSub', { count: extra }) : t('hero.noneBody')}</bdi></p>
          </>
        )}
        {onUseSaved ? (
          <button
            type="button"
            onClick={onUseSaved}
            className="mt-3.5 inline-flex min-h-11 items-center gap-2 rounded-[22px] border border-hair-2 bg-card px-4 py-2 text-start text-[14.5px] leading-snug font-semibold text-ink shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <BookmarkCheck className="size-4 shrink-0 text-pine" strokeWidth={2} aria-hidden />
            <bdi>{t('hero.useSaved')}</bdi>
          </button>
        ) : null}
      </div>

      {/* How the yearly amount adds up. When EI leads, the yearly programs stay as a second figure under it:
          the same bar and legend, a size down, so the money that was the headline a moment ago is still there. */}
      {known.income && result.total > 0 ? (
        <div className={ei ? 'mt-5' : 'mt-4'}>
          {ei ? (
            <p className="m-0 mb-2.5 text-[14.5px] font-medium leading-snug text-ink-2">
              <bdi>{t('hero.ei.others', { amount: money(result.total), count: estimated.length })}</bdi>
            </p>
          ) : null}
          <div className={cn('flex w-full gap-[3px] overflow-hidden rounded-full', ei ? 'h-2' : 'h-2.5')} role="img" aria-label={t('mix.label')}>
            {estimated.map((m) => (
              <motion.span
                key={m.id}
                layout={!reduce}
                className={cn('h-full rounded-full', PROGRAM_LOOK[m.id].bar)}
                style={{ flexGrow: m.annual ?? 0, flexBasis: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              />
            ))}
          </div>
          <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12.5px] text-ink-2">
            {estimated.map((m) => (
              <li key={m.id} className="inline-flex items-start gap-1.5">
                <i className={cn('mt-[5px] inline-block size-2 shrink-0 rounded-full', PROGRAM_LOOK[m.id].bar)} aria-hidden />
                <span>
                  <bdi>{t(`program.${m.id}`)}</bdi> <bdi dir="ltr" className="whitespace-nowrap tabular-nums text-ink-3">{money(m.annual ?? 0)}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-ink/10 pt-3.5">
        <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0" aria-label={t('profile.aria')}>
          {chips.map(({ id, key, label }) => {
            const assumed = key ? !known[key] : false;
            const missing = key === 'income' && assumed;
            const cls = cn(
              'inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1.5 text-[12.5px] font-medium leading-none',
              assumed ? 'border border-dashed border-ink-3/60 bg-transparent text-ink-2' : 'border border-transparent bg-card/60 text-ink-2',
            );
            const body = (
              <>
                <bdi>{label}</bdi>
                {missing ? null : assumed ? (
                  <>
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[.08em] text-ink-3" aria-hidden>
                      {t('profile.assumed')}
                    </span>
                    <span className="sr-only">{t('profile.assumedSr')}</span>
                  </>
                ) : null}
              </>
            );
            return (
              <li key={id} className="flex">
                {assumed && !editing ? (
                  <button type="button" {...editProps} className={cn(cls, hit, 'transition hover:border-ink-2 hover:text-ink')}>
                    {body}
                  </button>
                ) : (
                  <span className={cls}>{body}</span>
                )}
              </li>
            );
          })}
          {!editing ? (
            <li className="flex">
              <button
                type="button"
                {...editProps}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-chip border border-hair-2 bg-card px-3 py-1.5 text-[12.5px] font-semibold leading-none text-ink shadow-sm transition hover:-translate-y-px hover:shadow-md',
                  hit,
                )}
              >
                <PencilLine className="size-3.5" strokeWidth={2} aria-hidden />
                <bdi>{t('profile.edit')}</bdi>
              </button>
            </li>
          ) : null}
        </ul>
        {next && known.income ? (
          <p className="m-0 flex items-start gap-1.5 pt-3 text-[13px] font-medium text-pine">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
            <bdi>{t('hero.next', { date: fmt.date(next.date, { month: 'short', day: 'numeric' }), program: t(`program.${next.id}`) })}</bdi>
          </p>
        ) : null}
      </div>
    </div>
  );
}
