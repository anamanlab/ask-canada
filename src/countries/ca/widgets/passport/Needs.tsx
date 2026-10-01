'use client';
/**
 * "What you'll need": the checklist for the chosen way to apply, ticked off on this device. It folds under
 * one row that names the items and how many are ready, so the plan leads with dates and the list is a tap away.
 */
import { Checklist, Disclosure, useChecklist } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Method, PlannerOutput } from './types';
import { isolate, nb } from './shared';

export function Needs({ plan, method, headingLevel }: { plan: PlannerOutput; method: Method; headingLevel?: 4 | 5 }) {
  const t = useMessages(messages);
  const refs = { id: 'refs', title: isolate(t('need.refs.title', { count: plan.references })), detail: isolate(t('need.refs.detail')) };
  const pass = { id: 'passport', title: t('need.passport.title'), detail: isolate(t(method === 'online' ? 'need.passport.online' : 'need.passport.paper')) };
  const items =
    method === 'online'
      ? [
          { id: 'photo-digital', title: t('need.photoDigital.title'), detail: isolate(t('need.photoDigital.detail')) },
          pass,
          refs,
          { id: 'portal', title: t('need.portal.title'), detail: isolate(t('need.portal.detail')) },
        ]
      : [
          { id: 'photos', title: isolate(t('need.photos.title')), detail: isolate(t('need.photos.detail')) },
          { id: 'form', title: t('need.form.title', { form: nb(plan.form) }), detail: isolate(t('need.form.detail')) },
          pass,
          refs,
          { id: 'payment', title: t('need.payment.title'), detail: isolate(t(method === 'mail' ? 'need.payment.mail' : 'need.payment.inPerson')) },
        ];
  // One saved list per way to apply (their items differ); the count is derived right here, in render.
  const list = useChecklist(`passport:needs:${method}`, t('need.listLabel'), items.length);
  const done = items.filter((i) => list.value.includes(i.id)).length;
  return (
    <Disclosure
      headingLevel={headingLevel}
      title={
        // The title wraps as one line of text with the count after it.
        <span className="flex flex-wrap items-baseline gap-x-2.5">
          {isolate(t('need.title'))}
          <span className="text-[13.5px] font-medium text-pine" aria-live="polite">
            {isolate(t('need.progress', { done, total: items.length }))}
          </span>
        </span>
      }
      summary={isolate(t(method === 'online' ? 'need.summary.online' : 'need.summary.paper', { count: plan.references, form: nb(plan.form) }))}
    >
      <Checklist label={t('need.listLabel')} items={items} value={list.value} onChange={list.onChange} className="mb-2" />
    </Disclosure>
  );
}
