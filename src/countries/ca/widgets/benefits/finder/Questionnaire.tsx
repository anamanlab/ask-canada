'use client';
/**
 * The life-situation questions: household, age, children, income, what else applies and the province. Every
 * answer recalculates the estimate on the device. Loaded on demand: when the question already gave an income,
 * people see their results first and only open this to change an answer.
 */
import { useId, type ReactNode, type Ref } from 'react';
import { Accessibility, GraduationCap, HeartHandshake, LifeBuoy, ShieldCheck } from 'lucide-react';
import { Button, Field, LiveRegion, Segmented, Select } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { AgeBand, Profile } from '../calc';
import messages from '../messages';
import { ChoiceGrid, Counter, FlagChip, WHOLE } from '../parts';
import { Range } from '../Range';
import { PROVINCES } from '../rates';
import type { Known, Result } from './look';

const AGES: AgeBand[] = ['under-19', '19-59', '60-64', '65-74', '75-plus'];

export function Questionnaire({
  headingRef,
  profile,
  set,
  result,
  known,
  onDone,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  profile: Profile;
  /** Change one or more answers. */
  set: (patch: Partial<Profile>) => void;
  result: Result;
  known: Known;
  onDone: () => void;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const incomeKnown = known.income;
  const senior = profile.age === '60-64' || profile.age === '65-74' || profile.age === '75-plus';
  const oasAge = profile.age === '65-74' || profile.age === '75-plus';
  const kids = profile.childrenUnder6 + profile.children6to17;
  // The programs that make up the amount (the hero's count), not every match: EI and dental add no yearly dollars.
  const count = result.matches.filter((m) => m.status !== 'no' && m.annual).length;
  const live = incomeKnown && result.total > 0 ? t('q.live', { amount: money(result.total), count }) : t('q.liveNone');

  return (
    <div className="px-5 pt-6 @xl:px-6">
      <h4 ref={headingRef} tabIndex={-1} className="m-0 scroll-mt-24 font-serif text-[22px] leading-tight tracking-[-.02em] text-ink focus:outline-none">
        <bdi>{t('q.title')}</bdi>
      </h4>
      <p className="m-0 mt-1 text-[14px] text-ink-3">
        <bdi>{t('q.sub')}</bdi>
      </p>
      <div className="mt-5 grid gap-5">
        <Q label={t('q.household')}>
          <Segmented
            label={t('q.household')}
            value={profile.household}
            onChange={(v) => set({ household: v })}
            options={[
              { value: 'single', label: t('q.household.single'), sub: t('q.household.singleSub') },
              { value: 'couple', label: t('q.household.couple'), sub: t('q.household.coupleSub') },
            ]}
          />
        </Q>

        <Q label={t('q.age')}>
          <ChoiceGrid label={t('q.age')} value={profile.age} onChange={(v) => set({ age: v })} options={AGES.map((a) => ({ value: a, label: t(`q.age.${a}`), short: t(`q.age.${a}.short`) }))} />
        </Q>

        <Q label={t('q.children')}>
          <div className="grid gap-2 @md:grid-cols-2">
            <Counter label={t('q.under6')} value={profile.childrenUnder6} onChange={(n) => set({ childrenUnder6: n })} />
            <Counter label={t('q.age6to17')} value={profile.children6to17} onChange={(n) => set({ children6to17: n })} />
          </div>
        </Q>

        <div className="grid gap-4 rounded-tile border border-hair bg-paper-2 px-4 py-4">
          <div>
            {/* Until they type or drag it, there is no amount: a default must never read as their income. */}
            <Range
              entry="money"
              label={t('q.income')}
              max={200_000}
              step={1_000}
              value={profile.income}
              onChange={(n) => set({ income: n })}
              format={money}
              state={incomeKnown ? 'set' : 'unset'}
            />
            <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{oasAge ? t('q.incomeHintSenior') : t('q.incomeHint')}</bdi></p>
          </div>
          {/* A share of an income nobody gave has nothing to be a share of: it waits (at rest, not typable) until
              the income above is theirs, so nothing is ever capped by a figure they never entered. */}
          <div>
            <Range
              entry="money"
              label={t('q.work')}
              max={incomeKnown ? Math.max(profile.income, 1_000) : 200_000}
              step={1_000}
              value={Math.min(profile.workIncome, profile.income)}
              onChange={(n) => set({ workIncome: n })}
              format={money}
              // With an income but no work share given, the share shown is our assumption until they change it.
              state={known.work ? 'set' : incomeKnown ? 'typical' : 'unset'}
              disabled={!incomeKnown}
            />
            {incomeKnown ? null : <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{t('q.workNeedsIncome')}</bdi></p>}
          </div>
          {senior ? (
            <Range
              label={t('q.years')}
              max={40}
              step={1}
              value={Math.min(profile.yearsInCanada, 40)}
              onChange={(n) => set({ yearsInCanada: n })}
              format={(n) => (n >= 40 ? t('q.yearsMax') : t('q.yearsValue', { count: n }))}
            />
          ) : null}
        </div>

        <Q label={t('q.also')}>
          <div className="flex flex-wrap gap-2">
            <FlagChip icon={LifeBuoy} label={t('q.flag.jobLoss')} on={profile.jobLoss} onChange={(v) => set({ jobLoss: v })} />
            <FlagChip icon={GraduationCap} label={t('q.flag.student')} on={profile.student} onChange={(v) => set({ student: v })} />
            <FlagChip icon={Accessibility} label={t('q.flag.disability')} on={profile.disability} onChange={(v) => set({ disability: v })} />
            {kids > 0 ? (
              <FlagChip icon={HeartHandshake} label={t('q.flag.childDisability')} on={profile.childDisability > 0} onChange={(v) => set({ childDisability: v ? 1 : 0 })} />
            ) : null}
            <FlagChip icon={ShieldCheck} label={t('q.flag.dentalInsurance')} on={profile.dentalInsurance} onChange={(v) => set({ dentalInsurance: v })} />
          </div>
          {/* EI is based on the claimant's own earnings. A single person's work income is theirs; a couple's isn't. */}
          {profile.jobLoss && profile.household === 'couple' ? (
            <div className="mt-3 rounded-tile border border-hair bg-paper-2 px-4 py-4">
              <Range
                entry="money"
                label={t('q.jobEarnings')}
                max={120_000}
                step={1_000}
                value={profile.jobEarnings ?? 0}
                onChange={(n) => set({ jobEarnings: n })}
                format={money}
                state={profile.jobEarnings == null ? 'unset' : 'set'}
              />
              <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{t('q.jobEarningsHint')}</bdi></p>
            </div>
          ) : null}
        </Q>

        <Field label={t('q.province')} className="max-w-[320px]">
          {(p) => (
            <Select
              {...p}
              value={profile.province ?? ''}
              onChange={(e) => set({ province: PROVINCES.find((c) => c === e.target.value) })}
              options={[{ value: '', label: t('q.provinceAny') }, ...PROVINCES.map((c) => ({ value: c, label: t(`province.${c}`) }))]}
            />
          )}
        </Field>
      </div>

      {/* Dark mode: a raised surface, not an inverted (near-white) slab: the maple button stays the one accent. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-tile border border-transparent bg-ink px-4 py-3 text-paper dark:border-hair-2 dark:bg-paper-3 dark:text-ink">
        <p className="m-0 min-w-0 text-[14.5px] font-medium">
          <bdi>{live}</bdi>
        </p>
        <LiveRegion text={live} />
        <Button variant="accent" size="md" onClick={onDone} className="@max-xl:w-full">
          {t('q.show')}
        </Button>
      </div>
    </div>
  );
}

function Q({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="m-0 mb-2 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
        <bdi>{label}</bdi>
      </p>
      {children}
    </div>
  );
}
