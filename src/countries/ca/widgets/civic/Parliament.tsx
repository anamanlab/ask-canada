'use client';
/**
 * civicParliament renderer: the House of Commons seat chart (live sitting/vacant counts), the three parts
 * of Parliament, how a bill becomes law, and live bills from LEGISinfo (one bill, a topic, or latest moves).
 * Sentences are wrapped in <bdi> so, in an RTL page with English fallback text, numbers and punctuation stay
 * where the sentence puts them.
 */
import type { ReactNode } from 'react';
import { Crown, Landmark, ScrollText, Users, type LucideIcon } from 'lucide-react';
import { Badge, Disclosure, ExternalLink, Notice, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { BillRow, FocusBill } from './Bills';
import { URLS, type Lang } from './data';
import messages from './messages';
import { SeatChart } from './SeatChart';
import { langOf } from './select';
import { ordinal, isolate } from './shared';
import { ParliamentSkeleton } from './skeletons/parliament';
import type { ParliamentOutput } from './types';

type ParliamentInput = { bill?: string; topic?: string; lang?: Lang };

export function CivicParliament({ part, locale }: WidgetProps<ParliamentInput, ParliamentOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('parl.error.title')} message={t('parl.error.body')} fallback={{ href: URLS.legisinfo[langOf(locale)], label: t('parl.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <ParliamentSkeleton bill={part.input?.bill} topic={part.input?.topic} />;
  return <ParliamentView data={part.output} />;
}

function ParliamentView({ data }: { data: ParliamentOutput }) {
  const t = useMessages(messages);
  const { fmt, intl } = useLocale();
  // A bill number or a topic is a question with an answer: show that first, and fold the explainer away.
  const answerFirst = !!(data.focus || data.query || data.notFound);
  // The card is titled after the question: one bill, bills on a topic, or (overview only) how Parliament works.
  const code = data.focus?.code ?? data.notFound;

  return (
    <WidgetShell
      icon={Landmark}
      tone="glacier"
      title={code ? t('parl.titleBill', { code }) : answerFirst ? t('parl.titleBills') : t('parl.title')}
      subtitle={<bdi>{t('parl.subtitle', { parliament: ordinal(data.parliament, intl), session: ordinal(data.session, intl) })}</bdi>}
      badge={data.live ? <Badge tone="live">{t('parl.badge')}</Badge> : null}
      sources={data.sources}
      handoff={{ href: data.focus?.url ?? URLS.legisinfo[data.lang], label: data.focus ? t('parl.bill.handoff', { code: data.focus.code }) : t('parl.handoff'), note: isolate(t('parl.handoffNote')) }}
      footnote={<bdi>{t('parl.footnote')}</bdi>}
      className="@container"
    >
      {data.focus ? (
        <div className="px-3 sm:px-4">
          <FocusBill bill={data.focus} />
        </div>
      ) : null}

      {answerFirst ? (
        <>
          <BillList data={data} answerFirst />
          {/* Folded away, and only mounted (seat chart included) when the person opens it. */}
          <Disclosure
            lazy
            className="mt-5 px-5 sm:px-6"
            title={<span className="font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">{t('parl.explainer.title')}</span>}
            summary={<bdi>{t('parl.explainer.sub', { seats: fmt.number(data.house.seats), senators: data.senateSeats })}</bdi>}
          >
            <div className="-mx-5 sm:-mx-6">
              <Overview data={data} />
            </div>
          </Disclosure>
        </>
      ) : (
        <>
          <Overview data={data} />
          <BillList data={data} />
        </>
      )}
    </WidgetShell>
  );
}

/** Live bills: the answer to a topic or bill question, more bills next to a focus bill, or the latest movement. */
function BillList({ data, answerFirst }: { data: ParliamentOutput; answerFirst?: boolean }) {
  const t = useMessages(messages);
  const title = data.focus
    ? t('parl.bills.more')
    : data.notFound
      ? t('parl.bills.titleFocus', { code: data.notFound })
      : data.query
        ? t('parl.bills.titleTopic', { topic: data.query })
        : t('parl.bills.title');
  const legisinfo = (label: string) => <ExternalLink href={URLS.legisinfo[data.lang]}>{label}</ExternalLink>;
  return (
    <WidgetSection title={isolate(title)} className={cn(data.focus && 'mt-5 border-t border-hair', !data.focus && answerFirst && 'pt-0')}>
      {/* The link runs inline after the sentence, so the first line of text sits level with the icon. */}
      {!data.live ? (
        <Notice tone="info" title={t('parl.bills.offline')}>
          {legisinfo(t('parl.legisinfo'))}
        </Notice>
      ) : data.notFound ? (
        <Notice tone="warn" title={t('parl.bills.notFound', { code: data.notFound })}>
          <bdi>{t('parl.bills.notFoundBody')}</bdi> {legisinfo(t('parl.legisinfo'))}
        </Notice>
      ) : data.query && !data.bills.length ? (
        <Notice tone="info" title={t('parl.bills.none', { topic: data.query })}>
          {legisinfo(t('parl.bills.noneLink'))}
        </Notice>
      ) : null}
      {data.bills.length ? (
        <ul className={cn('m-0 grid list-none gap-2.5 p-0', (data.notFound || !data.live) && 'mt-3')}>
          {data.bills.map((b) => (
            <BillRow key={b.code} bill={b} />
          ))}
        </ul>
      ) : null}
      {data.stats ? (
        <p className="m-0 mt-3 font-mono text-[12px] text-ink-2">
          <bdi>
            <span className="whitespace-nowrap">{t('parl.bills.statsTotal', { total: data.stats.total })}</span> ·{' '}
            <span className="whitespace-nowrap">{t('parl.bills.statsLaw', { law: data.stats.law })}</span>
          </bdi>
        </p>
      ) : null}
    </WidgetSection>
  );
}

/** The House today (seat chart), the three parts of Parliament and how a bill becomes law. */
function Overview({ data }: { data: ParliamentOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const { seats, sitting, vacant } = data.house;
  // Both counts or neither: they come from the same live list of seats.
  const counts = sitting != null && vacant != null ? { sitting, vacant } : null;
  return (
    <>
      <div className="grid items-center gap-5 px-5 sm:px-6 @xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <div className="relative">
            <SeatChart seats={seats} vacant={vacant ?? 0} label={counts ? t('parl.hero.sr', { seats, ...counts }) : t('parl.hero.srSimple', { seats })} />
            <p className="pointer-events-none absolute inset-x-0 bottom-[2%] m-0 text-center font-serif text-[44px] leading-none tracking-[-.035em] text-ink [font-variation-settings:'opsz'_72]" aria-hidden>
              {fmt.number(seats)}
            </p>
          </div>
          <p className="m-0 mt-2 text-center text-[13.5px] font-medium text-ink-2">{t('parl.hero.seats')}</p>
          {counts ? (
            <p className="m-0 mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[13.5px] text-ink-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-ink-2 opacity-80" aria-hidden />
                <span>
                  {t('parl.legend.filled')} · <b className="font-semibold tabular-nums text-ink">{fmt.number(counts.sitting)}</b>
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full border-[1.5px] border-maple bg-card" aria-hidden />
                <span>
                  {t('parl.legend.vacant')} · <b className="font-semibold tabular-nums text-ink">{fmt.number(counts.vacant)}</b>
                </span>
              </span>
            </p>
          ) : null}
        </div>
        <div>
          <h4 className="m-0 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">{t('parl.parts.title')}</h4>
          <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0">
            <Part icon={Crown} title={t('parl.parts.crown')} body={t('parl.parts.crownBody')} />
            <Part icon={ScrollText} title={t('parl.parts.senate')} body={t('parl.parts.senateBody', { seats: data.senateSeats })} />
            <Part
              icon={Users}
              title={t('parl.parts.house')}
              body={t('parl.parts.houseBody', { seats })}
              action={
                <button
                  type="button"
                  onClick={() => send(t('parl.next.mp'))}
                  className="-mb-2 inline-flex min-h-11 items-center gap-1 text-[13.5px] font-medium text-maple-ink underline decoration-maple/40 underline-offset-[3px] hover:decoration-maple"
                >
                  {t('parl.parts.houseMine')}
                </button>
              }
            />
          </ul>
        </div>
      </div>

      <WidgetSection title={t('parl.steps.title')} className="mt-5 border-t border-hair">
        <BillSteps />
      </WidgetSection>
    </>
  );
}

function Part({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-tile border border-hair bg-paper-2 px-3.5 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[calc(var(--radius-field)*0.66)] bg-card text-ink-2 shadow-sm">
        <Icon className="size-4" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">
          <bdi>{body}</bdi>
        </span>
        {action}
      </span>
    </li>
  );
}

const STEPS = ['notice', 'first', 'second', 'committee', 'report', 'third', 'senate', 'assent'] as const;

/** The generic path of a bill: numbered, with no step marked as "now" (no particular bill is being tracked). */
function BillSteps() {
  const t = useMessages(messages);
  return (
    <ol className="m-0 grid list-none grid-cols-1 gap-y-3.5 p-0 @xl:grid-cols-4 @xl:gap-x-3 @xl:gap-y-4">
      {STEPS.map((s, i) => (
        <li
          key={s}
          className={cn(
            'relative',
            // Phones: a thin rail joins the numbers into one path.
            i < STEPS.length - 1 && 'before:absolute before:start-3 before:top-7 before:-bottom-3 before:w-px before:bg-hair-2 @xl:before:hidden',
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'relative grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold',
                s === 'assent' ? 'bg-maple text-paper' : s === 'senate' ? 'bg-glacier-wash text-glacier' : 'bg-pine-wash text-pine',
              )}
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="text-[14px] font-semibold text-ink">{t(`parl.step.${s}`)}</span>
          </div>
          <p className="m-0 mt-1 ps-8 text-[13px] leading-snug text-ink-2">
            <bdi>{t(`parl.step.${s}Body`)}</bdi>
          </p>
        </li>
      ))}
    </ol>
  );
}
