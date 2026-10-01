'use client';
/**
 * Where's my refund: places the person on the CRA service-standard timeline for their return and hands off
 * to the progress tracker in the CRA account.
 */
import { useId, useState } from 'react';
import { Check, Clock, Hourglass, Phone, Send, CircleAlert } from 'lucide-react';
import { Disclosure, ExternalLink, Input, Segmented, Toggle, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { refundArgs } from './args';
import { buildRefund } from './build';
import { refundStatus } from './calc/refund';
import { CHECKED, REFUND } from './data';
import { URLS, localizeSources } from './urls';
import messages from './messages';
import { AnswerLang, SHELL, Verdict, useDateFmt } from './shared';
import { TaxSkeleton } from './skeleton';
import type { RefundArgs, RefundResult } from './types';

export function RefundStatus(props: WidgetProps<RefundArgs, RefundResult>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <RefundStatusView {...props} />
    </AnswerLang>
  );
}

function RefundStatusView({ part }: WidgetProps<RefundArgs, RefundResult>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  // Until the tool answers with its own date, plan the loading state from the reader's.
  const today = useToday(CHECKED);
  if (part.state === 'output-error') {
    return <WidgetError title={t('ref.error.title')} message={t('error.body')} fallback={{ href: URLS.refunds[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The widget itself, built from the input so far and drawn as a skeleton: same layout, so nothing jumps.
    return (
      <TaxSkeleton label={t('loading')}>
        <Tracker initial={buildRefund(refundArgs(part.input, lang), today)} />
      </TaxSkeleton>
    );
  }
  return <Tracker initial={part.output} />;
}

/** The part of the track that is the usual wait (filed → expected by). */
const STANDARD = 'absolute inset-y-0 start-0 bg-[linear-gradient(90deg,var(--pine),color-mix(in_oklab,var(--pine)_60%,var(--glacier)))]';

function Tracker({ initial }: { initial: RefundResult }) {
  const t = useMessages(messages);
  const { locale, fmt } = useLocale();
  const df = useDateFmt();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const dateId = useId();
  const today = useToday(initial.today, { maxDriftDays: 1 });
  const [method, setMethod] = useState(initial.method);
  const [filedOn, setFiledOn] = useState<string | null>(initial.filedOn);
  const [abroad, setAbroad] = useState(initial.abroad);
  // The person's own answer to "on time?", tied to the date it was given for (a new date re-infers it).
  const [said, setSaid] = useState<{ date: string; value: boolean } | null>(
    initial.filedOn && initial.onTime != null && initial.onTime !== initial.onTimeGuess ? { date: initial.filedOn, value: initial.onTime } : null,
  );
  const onTimeSaid = said && said.date === filedOn ? said.value : null;
  const r = refundStatus({ filedOn, method, abroad, onTime: onTimeSaid, today });
  // The filing date the calculation accepted, bound once so the handlers below keep its type.
  const filed = r.filedOn;
  const long = (d: string) => df(d, { month: 'long', day: 'numeric', year: 'numeric' });
  const short = (d: string) => df(d, { month: 'short', day: 'numeric' });
  const weeks = r.weeks;
  const contactWeeks = r.contactDays / 7;
  const phone = r.lines[lang];
  // The number is a tel: link inside the sentence, so the message is split around its {number} slot.
  const [phoneBefore, phoneAfter = ''] = t('ref.tip.phoneBody', { number: '\u0000', option: phone.option }).split('\u0000');

  const verdict =
    r.stage === 'unknown' ? (
      <Verdict tone="neutral" icon={Hourglass} title={t('ref.v.unknown')} sub={t(`ref.v.unknownSub.${method}`, { weeks: r.weeks, target: r.target })} />
    ) : r.stage === 'future' ? (
      <Verdict tone="info" icon={CircleAlert} title={t('ref.v.future')} sub={t('ref.v.futureSub')} />
    ) : r.stage === 'late' ? (
      <Verdict tone="info" icon={Hourglass} title={t('ref.v.late', { weeks })} sub={t('ref.v.lateSub', { date: long(r.contactAfter!), weeks: contactWeeks })} />
    ) : r.stage === 'processing' ? (
      <Verdict
        tone="ok"
        icon={Clock}
        title={t('ref.v.processing', { date: long(r.expectedBy!) })}
        sub={t('ref.v.processingSub', { count: Math.max(0, diffDays(today, r.expectedBy!)), weeks, target: r.target })}
      />
    ) : r.stage === 'due' ? (
      <Verdict tone="info" icon={Send} title={t('ref.v.due', { weeks })} sub={t('ref.v.dueSub', { date: long(r.contactAfter!) })} />
    ) : (
      <Verdict tone="danger" icon={Phone} title={t('ref.v.contact', { weeks: contactWeeks })} sub={t('ref.v.contactSub')} />
    );

  const pos = (d: string) => (r.filedOn ? Math.max(0, Math.min(100, (diffDays(r.filedOn, d) / r.contactDays) * 100)) : 0);
  const todayPos = r.filedOn ? pos(today) : 0;
  const hasExpected = r.expectedBy != null && r.standardDays < r.contactDays;
  const stdPos = r.expectedBy ? (r.standardDays / r.contactDays) * 100 : 0;
  const late = r.onTime === false;

  return (
    <WidgetShell
      icon={Hourglass}
      tone="glacier"
      title={t('ref.title')}
      subtitle={t('ref.subtitle')}
      sources={localizeSources(initial.sources, lang)}
      handoff={{ href: URLS.signIn[lang], label: t('ref.handoff'), note: t('ref.handoffNote') }}
      footnote={t('ref.footnote')}
      className={SHELL}
    >
      {verdict}

      <WidgetSection title={t('ref.in.title')}>
        <div className="grid gap-4 @xl:grid-cols-2">
          <div>
            <p className="m-0 mb-1.5 text-[14px] font-medium text-ink" aria-hidden>
              {t('ref.in.method')}
            </p>
            <Segmented
              label={t('ref.in.method')}
              value={method}
              onChange={setMethod}
              options={[
                { value: 'online', label: t('ref.in.online'), sub: late ? undefined : <bdi>{t('ref.in.weeks', { count: REFUND.digitalWeeks })}</bdi> },
                { value: 'paper', label: t('ref.in.paper'), sub: late ? undefined : <bdi>{t('ref.in.weeks', { count: REFUND.paperWeeks })}</bdi> },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={dateId} className="text-[14px] font-medium text-ink">
              {t('ref.in.date')}
            </label>
            <Input id={dateId} type="date" value={filedOn ?? ''} max={today} onChange={(e) => setFiledOn(e.target.value || null)} className="min-h-12" />
          </div>
        </div>
        {filed && r.dueDate ? (
          <div className="mt-4">
            <p className="m-0 mb-1.5 text-[14px] font-medium text-ink" aria-hidden>
              {t('ref.in.onTime')}
            </p>
            <Segmented
              label={t('ref.in.onTime')}
              value={r.onTime ? 'yes' : 'no'}
              onChange={(v) => setSaid({ date: filed, value: v === 'yes' })}
              options={[
                { value: 'yes', label: t('ref.in.onTimeYes') },
                { value: 'no', label: t('ref.in.onTimeNo') },
              ]}
            />
            <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-ink-3">
              {t(r.selfEmployedWindow ? 'ref.in.onTimeHintSelf' : 'ref.in.onTimeHint', { due: long(r.dueDate), self: long(r.selfEmployedDue!) })}
            </p>
          </div>
        ) : null}
        <Toggle className="mt-2" label={t('ref.in.abroad')} description={t('ref.in.abroadSub')} checked={abroad} onChange={setAbroad} />
      </WidgetSection>

      {r.filedOn && r.stage !== 'future' ? (
        <WidgetSection title={t('ref.track.title')}>
          <div className="relative mt-11 h-3" aria-hidden>
            <div className="absolute inset-0 overflow-hidden rounded-full bg-paper-2">
              {/* The usual wait, drawn twice: the whole of it faint, and the part already behind today at full
                  strength, so progress reads from the bar even when the wait fills the whole track (paper). */}
              {r.expectedBy ? (
                <>
                  <span className={cn(STANDARD, 'rounded-full opacity-40')} style={{ width: `${stdPos}%` }} />
                  <span className={cn(STANDARD, 'rounded-s-full')} style={{ width: `${Math.min(todayPos, stdPos)}%` }} />
                </>
              ) : null}
              {stdPos < 100 ? (
                <span
                  className="absolute inset-y-0 bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--glacier)_34%,transparent)_0_4px,color-mix(in_oklab,var(--glacier)_12%,transparent)_4px_8px)]"
                  style={{ insetInlineStart: `${stdPos}%`, insetInlineEnd: '0%' }}
                />
              ) : null}
            </div>
            {hasExpected ? (
              <span className="absolute -top-1 bottom-[-4px] w-0.5 -translate-x-1/2 bg-card rtl:translate-x-1/2" style={{ insetInlineStart: `${stdPos}%` }} />
            ) : null}
            <span
              className="absolute top-1/2 block size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-ink shadow-md rtl:translate-x-1/2"
              // Kept whole inside the track: at either end the dot stops with its edge on the track's.
              style={{ insetInlineStart: `clamp(11px, ${todayPos}%, calc(100% - 11px))` }}
            />
            {/* The pill belongs to the track, not the dot: the two spacers share the room left beside it in the
                proportion of today's position, so it sits over the dot and stops flush at either end of the track. */}
            <span className="absolute inset-x-0 bottom-[calc(100%+11px)] flex">
              <span className="basis-0" style={{ flexGrow: todayPos }} />
              <span className="shrink-0 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] font-semibold text-paper">
                <bdi>{r.elapsedDays != null ? t('ref.track.todayDay', { count: r.elapsedDays }) : t('ref.track.today')}</bdi>
              </span>
              <span className="basis-0" style={{ flexGrow: 100 - todayPos }} />
            </span>
          </div>
          {/* Legend: each dot matches the part of the bar it names (not positioned under it). */}
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-6 gap-y-2.5 p-0" aria-hidden>
            {[
              { key: 'filed', label: t('ref.track.filedL'), date: r.filedOn, dot: 'bg-ink' },
              ...(r.expectedBy ? [{ key: 'expected', label: t('ref.track.expectedL'), date: r.expectedBy, dot: 'bg-pine' }] : []),
              ...(hasExpected || !r.expectedBy ? [{ key: 'contact', label: t('ref.track.contactL'), date: r.contactAfter!, dot: 'bg-glacier' }] : []),
            ].map((m) => (
              <li key={m.key} className="min-w-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[.06em] text-ink-3">
                  <i className={cn('inline-block size-2 rounded-full', m.dot)} />
                  {m.label}
                </span>
                <span className="mt-0.5 block text-[14.5px] font-semibold text-ink">{short(m.date)}</span>
              </li>
            ))}
          </ul>
          <p className="sr-only">
            {r.expectedBy
              ? t('ref.track.sr', { filed: long(r.filedOn), expected: long(r.expectedBy), contact: long(r.contactAfter!), today: long(today) })
              : t('ref.track.srLate', { filed: long(r.filedOn), contact: long(r.contactAfter!), today: long(today) })}
          </p>
        </WidgetSection>
      ) : null}

      <div className="mx-5 mt-5 sm:mx-6">
        <Disclosure title={t('ref.held.title')} lazy>
          <ul className="m-0 grid list-none gap-2 p-0">
            {(['owing', 'garnish', 'debts', 'gst', 'small'] as const).map((k) => (
              <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
                <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
                {t(`ref.held.${k}`, { amount: fmt.money(REFUND.minimum) })}
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>

      <div className="px-5 pt-3 sm:px-6">
        <div className="grid gap-2.5 @xl:grid-cols-2">
          <div className="flex items-start gap-3 rounded-[16px] border border-hair bg-paper-2 px-4 py-3.5">
            <Check className="mt-0.5 size-[18px] shrink-0 text-pine" strokeWidth={2.2} aria-hidden />
            <p className="m-0 text-[14px] leading-snug text-ink-2">
              <b className="font-semibold text-ink">{t('ref.tip.deposit')}</b> {t('ref.tip.depositBody')}{' '}
              <ExternalLink href={URLS.directDeposit[lang]} className="whitespace-nowrap">{t('ref.tip.depositLink')}</ExternalLink>
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-[16px] border border-hair bg-paper-2 px-4 py-3.5">
            <Phone className="mt-0.5 size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
            <p className="m-0 text-[14px] leading-snug text-ink-2">
              <b className="font-semibold text-ink">{t('ref.tip.phone')}</b>{' '}
              {phoneBefore}
              <a href={`tel:+${phone.line.replace(/\D/g, '')}`} className="-my-[13px] inline-block py-[13px] whitespace-nowrap font-medium text-ink underline decoration-hair-2 underline-offset-[3px]">
                <bdi dir="ltr">{phone.line}</bdi>
              </a>
              {phoneAfter}
            </p>
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

