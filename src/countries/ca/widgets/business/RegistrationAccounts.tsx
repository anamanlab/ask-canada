'use client';
/**
 * "What you need from the CRA" in businessRegistration: the business number drawn as a registration card (the
 * nine digits, then one code per program account, each listed underneath with whether it is required), and
 * the switches that add accounts to it.
 */
import { motion, useReducedMotion } from 'motion/react';
import { Badge, Toggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Account, AccountNeed, OrgType } from './calc';
import { PROVINCE, type Province } from './data';
import { useBiz } from './shared';

const needTone: Record<AccountNeed, 'ok' | 'neutral' | 'info'> = { required: 'ok', optional: 'neutral', auto: 'info' };

export type Activity = 'employees' | 'incorporated' | 'trade' | 'rideshare';
export type Activities = Record<Activity, boolean>;

export function BusinessNumberCard({ accounts, bn, charity, province }: { accounts: Account[]; bn: boolean; charity: boolean; province: Province | null }) {
  const { t } = useBiz();
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-tile border border-hair bg-card shadow-md">
      <div className="bg-[linear-gradient(150deg,var(--pine-wash),transparent_72%)] px-4 pb-4 pt-3.5">
        <p className="m-0 flex items-center justify-between gap-2 text-[12px] font-semibold uppercase tracking-[.08em] text-ink-2">
          {t('reg.bn')}
          <span className="rounded-full border border-hair-2 bg-card px-2 py-px text-[11px] font-medium tracking-[.06em] text-ink-3">{t('reg.bn.example')}</span>
        </p>
        {/* The one place these widgets use the mono face: the number itself. */}
        <p className="m-0 mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[19px] font-medium tabular-nums tracking-[.04em] text-ink" dir="ltr" aria-hidden>
          <span className={cn(!bn && !charity && 'text-ink-3 opacity-60')}>123456789</span>
          {charity ? <span className="rounded-chip bg-pine-wash px-2 py-0.5 text-[16px] text-pine">RR 0001</span> : null}
          {accounts
            .filter((a) => a.need !== 'optional')
            .map((a) => (
              <motion.span
                key={a.code}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-chip bg-pine-wash px-2 py-0.5 text-[16px] text-pine"
              >
                {a.code} 0001
              </motion.span>
            ))}
        </p>
        <p className="m-0 mt-2.5 text-[14px] leading-snug text-ink-2">{charity ? t('reg.bn.charity') : bn ? t('reg.bn.need') : t('reg.bn.optional')}</p>
      </div>
      <ul className="m-0 list-none border-t border-hair p-0">
        {accounts.map((a) => {
          // Incorporating in this province issues no BN: the RC account is only automatic for a federal corporation.
          const federalOnly = a.code === 'RC' && province != null && !PROVINCE[province].bnWithProvince;
          return (
            <li key={a.code} className="flex items-start gap-3 border-b border-hair px-4 py-3 last:border-b-0">
              <span className="grid h-6 min-w-9 shrink-0 place-items-center rounded-chip bg-paper-2 px-1.5 text-[12px] font-semibold tracking-[.04em] text-ink-2" dir="ltr">
                {a.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <span className="min-w-0 text-[14.5px] font-semibold leading-snug text-ink">{t(`reg.account.${a.code}`)}</span>
                  <Badge tone={federalOnly ? 'neutral' : needTone[a.need]} className="shrink-0 whitespace-nowrap">
                    {federalOnly ? t('reg.need.autoFederal') : t(`reg.need.${a.need}`)}
                  </Badge>
                </span>
                <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-3">{federalOnly ? t('reg.account.RC.detail.noProvinceBn') : t(`reg.account.${a.code}.detail`)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Four switches in equal rows, each with one line saying what it changes. */
export function ActivityToggles({ acts, org, onChange }: { acts: Activities; org: OrgType; onChange: (key: Activity, on: boolean) => void }) {
  const { t } = useBiz();
  return (
    <div className="mt-5 grid gap-x-8 gap-y-3 @xl:auto-rows-fr @xl:grid-cols-2">
      {(['employees', 'incorporated', 'trade'] as const).map((k) => (
        <Toggle key={k} className="items-start" label={t(`reg.act.${k}`)} description={t(`reg.act.${k}.desc`)} checked={acts[k]} onChange={(v) => onChange(k, v)} />
      ))}
      {/* The rideshare rule is for businesses only: switching it on from Charity or Non-profit says so, then switches the type. */}
      <Toggle
        className="items-start"
        label={t('reg.act.rideshare')}
        description={t(org === 'business' || acts.rideshare ? 'reg.act.rideshare.desc' : 'reg.act.rideshare.orgHint')}
        checked={acts.rideshare}
        onChange={(v) => onChange('rideshare', v)}
      />
    </div>
  );
}
