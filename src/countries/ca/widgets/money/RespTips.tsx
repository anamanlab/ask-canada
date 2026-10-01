'use client';
/** The RESP planner's advice: which grant or bond is being left unclaimed with the current numbers, and how to collect it. */
import { Info } from 'lucide-react';
import { Notice } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { RespResult } from './calc/resp';
import { RESP } from './data';
import { useMoneyFormat } from './format';
import messages from './messages';

/** Yearly contribution that collects the most grant allowed in one year when catching up (1,000 ÷ 20% = 5,000). */
const CATCH_UP_AMOUNT = RESP.cesgMaxPerYear / RESP.cesgRate;

export function RespTips({ r }: { r: RespResult }) {
  const t = useMessages(messages);
  const { money, pct } = useMoneyFormat();
  const tips: { id: string; tone: 'info' | 'ok' | 'warn'; title: string; body?: string }[] = [];
  if (r.tooOld)
    tips.push({ id: 'old', tone: 'warn', title: t('resp.tip.old.title'), body: t('resp.tip.old.body', { total: money(RESP.age16.total), yearly: money(RESP.age16.yearly), years: RESP.age16.years }) });
  else if (r.annual < RESP.cesgMatchedPerYear)
    tips.push({
      id: 'more',
      tone: 'info',
      title: t('resp.tip.more.title', { more: money(RESP.cesgMatchedPerYear - r.annual) }),
      body: t('resp.tip.more.body', { rate: pct(RESP.cesgRate * 100), max: money(RESP.cesgMatchedPerYear), grant: money(RESP.cesgBasicPerYear) }),
    });
  if (!r.tooOld && r.capAge == null && r.unusedAtStart > 0 && r.annual < CATCH_UP_AMOUNT)
    tips.push({ id: 'catch', tone: 'info', title: t('resp.tip.catch.title', { room: money(r.unusedAtStart) }), body: t('resp.tip.catch.body', { amount: money(CATCH_UP_AMOUNT), grant: money(RESP.cesgMaxPerYear) }) });
  if (r.clbEligible) tips.push({ id: 'clb', tone: 'ok', title: t('resp.tip.clb.title', { max: money(RESP.clb.lifetime) }), body: t('resp.tip.clb.body', { parentAge: RESP.clb.caregiverBeforeAge, age: RESP.clb.claimBeforeAge }) });
  if (r.capped) tips.push({ id: 'cap', tone: 'info', title: t('resp.tip.cap.title', { max: money(RESP.lifetimeContribution) }) });
  if (r.capAge != null && r.capAge < RESP.cesgLastAge)
    tips.push({ id: 'maxAt', tone: 'ok', title: t('resp.tip.maxAt.title', { max: money(RESP.cesgLifetime), age: r.capAge }), body: t('resp.tip.maxAt.body') });
  if (!tips.length) tips.push({ id: 'full', tone: 'ok', title: t('resp.tip.full.title'), body: t('resp.tip.full.body') });
  return (
    <div className="mt-5 grid gap-2.5">
      {tips.map((x) => (
        <Notice key={x.id} tone={x.tone} title={x.title}>
          {x.body}
        </Notice>
      ))}
      {!r.clbEligible && !r.tooOld ? (
        <p className="m-0 flex gap-2 px-1 text-[13px] leading-snug text-ink-2">
          <Info className="mt-px size-4 shrink-0 text-ink-3" aria-hidden />
          <span className="min-w-0">
            {t('resp.clbHint', { max: money(RESP.clb.lifetime) })}{' '}
            {t('resp.clbLimits', { few: money(RESP.clbThresholds.upTo3), four: money(RESP.clbThresholds.four), five: money(RESP.clbThresholds.five) })}{' '}
            {t('resp.clbMore')}
          </span>
        </p>
      ) : null}
    </div>
  );
}
