'use client';
/**
 * Under the plan, one section with two tabs, so the planner stays short:
 *   "Year by year"  — the chart (shown first)
 *   "How to get it" — the four steps to open an RESP and collect the grant and bond, as a checklist the family
 *                     ticks off. The ticks are saved on this device only (they show in the privacy card and
 *                     clear with it), and the tab carries the count.
 */
import { Checklist, Tabs, useChecklist, WidgetSection } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { RespResult } from './calc/resp';
import messages from './messages';
import { RespYearChart } from './RespYearChart';

const STEPS = ['1', '2', '3', '4'] as const;

export function RespDetails({ r }: { r: RespResult }) {
  const t = useMessages(messages);
  const label = t('resp.how.listLabel');
  const list = useChecklist('money:resp-steps', label, STEPS.length);
  const done = STEPS.filter((s) => list.value.includes(s)).length;
  return (
    <WidgetSection className="pt-2">
      <Tabs
        label={t('resp.more.label')}
        tabs={[
          { id: 'years', label: t('resp.years.title'), content: <RespYearChart r={r} /> },
          {
            id: 'how',
            label: (
              <>
                {t('resp.how.title')}{' '}
                <span className="ms-1 font-mono text-[11.5px] font-normal tabular-nums text-ink-3">
                  <bdi>{t('resp.how.count', { done, total: STEPS.length })}</bdi>
                </span>
                <span className="sr-only">{t('resp.how.progress', { done, total: STEPS.length })}</span>
              </>
            ),
            content: (
              <Checklist label={label} items={STEPS.map((s) => ({ id: s, title: t(`resp.how.${s}`), detail: t(`resp.how.${s}d`) }))} value={list.value} onChange={list.onChange} />
            ),
          },
        ]}
      />
    </WidgetSection>
  );
}
