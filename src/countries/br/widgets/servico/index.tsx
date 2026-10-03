'use client';
/**
 * Widget `servico`: one federal service, and what getting it involves.
 *
 * This is the card the service catalogue was ingested for. The search answers "which
 * service"; this answers the follow-up everyone actually asks — what are the steps, who
 * is it for, how long does it take, what does it cost, and where do I start. Every one
 * of those comes from the catalogue's own record, in its own words, and what the
 * catalogue does not state is marked as unstated rather than filled in:
 *
 * - a missing time estimate reads "the catalogue gives no estimate", never a number;
 * - legislation is not listed at all, because the catalogue's references are internal
 *   ids without titles — inventing links for them would be worse than the card pointing
 *   at the official page, which carries the real ones.
 *
 * The record is a generated snapshot, and the footer says verified-on rather than live,
 * because that is what it is. A snapshot is the right trade for this data: the stages
 * of getting a CPF card do not change between breakfast and lunch.
 *
 * Built only from core primitives (`@/components/ui`) and design tokens; no user-visible string in TSX.
 */
import { ClipboardList } from 'lucide-react';
import { ExternalLink, WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Stage = { title: string; description: string };
type Service = {
  name: string;
  slug: string;
  url: string;
  agency: string;
  digital: boolean;
  free: boolean;
  accountLevel?: string;
};
type Output = {
  status: 'ok' | 'not-found';
  query?: string;
  service?: Service;
  stages?: Stage[];
  audience?: string[];
  estimatedTime?: string;
  contact?: string;
  digitalLink?: string;
  sources?: ToolSource[];
};

function ServicoDetalhe({ part }: WidgetProps<{ service: string }, Output>) {
  const t = useMessages(messages);
  const out = part.state === 'output-available' ? part.output : undefined;

  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('title')} icon={ClipboardList} tone="pine" rows={3} />;
  }

  // "Not found" is an answer, not a failure: the catalogue genuinely may not carry it
  // (a state service, a brand-new programme), and saying so beats guessing at a cousin.
  if (out.status === 'not-found' || !out.service) {
    return (
      <WidgetShell icon={ClipboardList} tone="pine" title={t('title')} subtitle={t('subtitle')} footnote={t('note')}>
        <p className="m-0 px-5 pb-5 text-[15px] leading-snug text-ink-2 sm:px-6">
          {t('notFound')} <b className="font-semibold text-ink">{out.query}</b>. {t('notFoundHint')}
        </p>
      </WidgetShell>
    );
  }

  const s = out.service;
  const stages = out.stages ?? [];

  return (
    <WidgetShell
      icon={ClipboardList}
      tone="pine"
      title={t('title')}
      subtitle={s.name}
      sources={out.sources}
      footnote={t('note')}
    >
      <div className="px-5 pb-5 pt-1 sm:px-6">
        {/* The facts that decide whether to start: cost, channel, identity, time. */}
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 border-b border-hair pb-4">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('cost')}</dt>
            <dd className="m-0 mt-0.5 text-[14.5px] font-semibold text-ink">
              {s.free ? t('free') : t('paid')}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('channel')}</dt>
            <dd className="m-0 mt-0.5 text-[14.5px] font-semibold text-ink">
              {s.digital ? t('digital') : t('inPerson')}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('account')}</dt>
            <dd className="m-0 mt-0.5 text-[14.5px] font-semibold text-ink">
              {s.accountLevel ?? t('noAccount')}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('time')}</dt>
            <dd className="m-0 mt-0.5 text-[14.5px] font-semibold text-ink">
              {out.estimatedTime ?? t('noEstimate')}
            </dd>
          </div>
        </dl>

        {stages.length > 0 ? (
          <ol className="m-0 mt-4 grid list-none gap-0 p-0">
            {stages.map((st, i) => (
              <li key={i} className="flex gap-3.5 border-t border-hair py-3 first:border-t-0 first:pt-0">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-pine-wash font-mono text-[12px] font-semibold text-pine"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[14.5px] font-semibold leading-snug text-ink">{st.title}</p>
                  {st.description ? <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-2">{st.description}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {(out.audience?.length ?? 0) > 0 ? (
          <div className="mt-4 border-t border-hair pt-3">
            <p className="m-0 text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('audience')}</p>
            <ul className="m-0 mt-1.5 grid list-none gap-1 p-0 text-[13.5px] leading-snug text-ink-2">
              {out.audience!.map((a, i) => (
                <li key={i}>· {a}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {out.contact ? (
          <p className="m-0 mt-4 border-t border-hair pt-3 text-[13px] leading-snug text-ink-3">
            <span className="font-medium text-ink-2">{t('contact')} </span>
            {out.contact}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2.5">
          {out.digitalLink ? (
            <ExternalLink href={out.digitalLink}>{t('startOnline')}</ExternalLink>
          ) : null}
          <ExternalLink href={s.url}>{t('officialPage')}</ExternalLink>
        </div>
      </div>
    </WidgetShell>
  );
}

export const renderers: Renderers = { servicoDetalhe: ServicoDetalhe };
export default renderers;