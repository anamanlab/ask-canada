'use client';
/** The parts of the campsite reservation helper that don't depend on the park: launch-day steps, checklist, fees. */
import { Phone } from 'lucide-react';
import { Checklist, Stat, WidgetSection, useChecklist } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { RESERVATION } from './data';
import messages from './messages';

/**
 * How launch day works: an explainer, not a progress tracker, so every step looks the same (numbered,
 * neutral). The person's own progress lives in the launch-day checklist below.
 */
export function HowSteps({ steps }: { steps: { title: string; detail: string }[] }) {
  const { fmt } = useLocale();
  return (
    <ol className="m-0 list-none p-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3.5 pb-4 last:pb-0">
          {i < steps.length - 1 ? <span aria-hidden className="absolute start-[13px] top-7 -bottom-0 w-px bg-hair-2" /> : null}
          <span aria-hidden className="relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border border-hair-2 bg-card font-mono text-[12.5px] font-medium text-ink-2">
            {fmt.number(i + 1)}
          </span>
          <div className="min-w-0 pt-[3px]">
            {/* Isolated: a title that starts with a time ("8 am local time…") keeps its order in right-to-left text. */}
            <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
              <bdi>{s.title}</bdi>
            </p>
            <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{s.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const CHECKS = ['account', 'choices', 'equipment', 'early', 'notify'] as const;

/** `time`: when the random draw happens for the park on the card ("8 am", or "8:30 am" in Newfoundland and Labrador). */
export function LaunchChecklist({ time }: { time: string }) {
  const t = useMessages(messages);
  const list = useChecklist('parks:launch-day', t('check.label'), CHECKS.length);
  const items = CHECKS.map((k) => ({ id: k, title: t(`check.${k}.title`, { time }), detail: t(`check.${k}.detail`) }));
  return (
    <WidgetSection
      title={t('check.title')}
      aside={
        <span className="shrink-0 whitespace-nowrap font-mono text-[12px] text-pine" aria-live="polite">
          <bdi>{t('check.progress', { done: items.filter((i) => list.value.includes(i.id)).length, total: items.length })}</bdi>
        </span>
      }
    >
      <Checklist label={t('check.label')} items={items} value={list.value} onChange={list.onChange} />
    </WidgetSection>
  );
}

export function Fees() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'always' });
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Stat size="sm" label={t('camp.feeOnline')} value={money(RESERVATION.online)} note={t('camp.feeOnlineNote')} />
        <Stat size="sm" label={t('camp.feePhone')} value={money(RESERVATION.phone)} note={t('camp.feePhoneNote')} />
      </div>
      {/* Two rows of the same shape: who the number is for, then the number (under it on phones, at the end
          of the line on wider cards). The whole row is the tap target. */}
      <dl className="m-0 mt-3 divide-y divide-hair overflow-hidden rounded-field border border-hair">
        {(
          [
            ['camp.phoneNA', RESERVATION.phoneNumber],
            ['camp.phoneIntl', RESERVATION.phoneIntl],
          ] as const
        ).map(([label, number]) => (
          <div key={label} className="relative flex flex-col gap-0.5 px-3.5 py-2.5 @md:min-h-11 @md:flex-row @md:items-center @md:justify-between @md:gap-3 @md:py-0">
            <dt className="flex items-center gap-2 text-[14px] leading-snug text-ink-2">
              <Phone className="size-4 shrink-0 text-ink-3" aria-hidden strokeWidth={1.8} />
              {t(label)}
            </dt>
            <dd className="m-0 ps-6 @md:ps-0">
              <a href={`tel:+${number.replace(/\D/g, '')}`} className="font-medium text-ink underline decoration-hair-2 underline-offset-[3px] after:absolute after:inset-0">
                <bdi dir="ltr" className="whitespace-nowrap">{number}</bdi>
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">{t('camp.feesNote')}</p>
    </>
  );
}
