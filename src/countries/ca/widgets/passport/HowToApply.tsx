'use client';
/**
 * "How to apply": online, in person or by mail, with the fee, the processing time and the date for the chosen
 * way. In person with a trip that regular processing can't make, the tiles show express or urgent pick-up.
 * The conditions for each way are in MethodNotes.tsx, folded under the plan.
 */
import type { ReactNode } from 'react';
import { Notice, NumberTicker, Segmented, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Method, PlannerOutput } from './types';
import { isolate, leadAndBody, nb, ordinal } from './shared';
import type { Rush } from './timelineModel';

const METHODS: Method[] = ['online', 'in-person', 'mail'];
/** A label that stays on one line, as a block so its negative margins can reach into the option's padding. */
const ONE_LINE = 'block whitespace-nowrap';
/** The line under an option's name ("Recommended", "$163.50") in the interface sans, not the control's mono. */
const SUB = 'font-sans text-[12px] tabular-nums';
/** Half-width tiles on phones: the unit drops under the number, so « jours ouvrables » never breaks in two. */
const UNIT = '@max-xl:mt-1 @max-xl:block @max-xl:leading-tight';
/** A tile label breaks between its words only, never inside "pick-up". */
const words = (label: string) =>
  label.split(' ').map((w, i) => (
    <span key={w} className="whitespace-nowrap">
      {i ? ' ' : ''}
      {w}
    </span>
  ));

/**
 * One of the three figures for the chosen way to apply. Core's Stat with the plan's own hierarchy: the date
 * (`lead`) is the figure people came for, so it is the raised, larger tile; notes are set a size up from Stat's;
 * and a control (`children`, the 10 or 5 year choice) sits under the figure, clear of the label.
 *   <Tile label="Ready by" value="Oct 29" note="If you apply today" lead />
 */
function Tile({
  label,
  value,
  unit,
  note,
  lead,
  tone,
  className,
  children,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  lead?: boolean;
  tone?: 'danger';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-tile border px-4 py-4',
        lead ? 'border-hair bg-card shadow-md dark:border-hair-2 dark:bg-[color-mix(in_oklab,var(--ink)_7%,var(--card))]' : 'border-hair bg-paper-2',
        className,
      )}
    >
      <div className="font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{label}</div>
      <div
        className={cn(
          'mt-1.5 font-serif leading-[1.05] tracking-[-.03em] [font-variation-settings:"opsz"_48]',
          lead ? 'text-[38px]' : 'text-[30px]',
          tone === 'danger' ? 'text-maple-ink' : 'text-ink',
        )}
      >
        {value}
        {unit ? <span className="ms-1.5 font-sans text-[14px] font-medium tracking-normal text-ink-3">{unit}</span> : null}
      </div>
      {note ? <div className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{note}</div> : null}
      {children}
    </div>
  );
}

export function HowToApply({
  plan,
  method,
  onMethod,
  validity,
  onValidity,
  rush,
}: {
  plan: PlannerOutput;
  method: Method;
  onMethod: (m: Method) => void;
  validity: 5 | 10;
  onValidity: (v: 5 | 10) => void;
  rush: Rush | null;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const m = plan.methods[method];
  const online = plan.methods.online;
  const d = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) => nb(fmt.date(iso, opts));
  const cents = (n: number) => fmt.money(n, { cents: 'always' });
  const fee = validity === 10 ? plan.fees.adult10 : plan.fees.adult5;

  const sub = (k: Method) => {
    if (k === 'mail') return t('method.mail.sub', { form: nb(plan.form) });
    if (k === 'in-person') return plan.recommended === 'in-person' ? t('method.sub.recommended') : t('method.sub.fastest');
    if (online.available) return plan.recommended === 'online' ? t('method.sub.recommended') : isolate(t('method.sub.days', { count: online.businessDays }));
    if (online.reason === 'too-early' && plan.onlineOpensOn) {
      // "Opens Dec 1" is ambiguous a year out: another year's opening is written as its month ("Opens Feb 2027").
      const sameYear = plan.onlineOpensOn.slice(0, 4) === plan.today.slice(0, 4);
      // French says « Dès le 1er déc. » for a day and « Dès févr. 2027 » for a month, so each has its own message.
      return sameYear ? t('method.sub.opens', { date: d(plan.onlineOpensOn) }) : t('method.sub.opensMonth', { date: d(plan.onlineOpensOn, { month: 'short', year: 'numeric' }) });
    }
    return t(`method.sub.${online.reason ?? 'unknown-expiry'}`);
  };
  // In person, "today" is the day a passport office can next take the application.
  const later = method === 'in-person' && plan.officeOpensOn !== plan.today;

  return (
    <WidgetSection title={isolate(t('how.title'))}>
      <Segmented
        label={t('how.title')}
        value={method}
        onChange={onMethod}
        // Each label and sub-label is one line, so the three options always line up: both are written short
        // (« Trop tard », « Dès le 1er déc. »), and on narrow columns their own type tightens and they reach a
        // little into the option's padding. Styled on our own spans, never on Segmented's markup.
        options={METHODS.map((k) => ({
          value: k,
          label: <span className={cn(ONE_LINE, '-mx-1 @max-md:text-[13.5px]')}>{t(`method.${k}`)}</span>,
          sub: <span className={cn(ONE_LINE, SUB, '-mx-1.5 @max-md:tracking-[-.02em]')}>{sub(k)}</span>,
        }))}
      />
      {/* Phones: the fee across the top, then processing and the date side by side. The pick-up tiles carry
          longer labels and a number with its unit ("2–9 business days"), so on phones each takes a full row. */}
      <div className={cn('mt-3.5 grid gap-2.5 @xl:grid-cols-[1fr_1fr_1.12fr]', rush ? 'grid-cols-1 @md:grid-cols-2' : 'grid-cols-2')}>
        <Tile className={cn('@xl:col-span-1', rush ? '@md:col-span-2' : 'col-span-2')} label={t('stat.fee')} value={<NumberTicker value={fee} format={cents} />}>
          <Segmented
            size="sm"
            label={t('validity.label')}
            value={String(validity) as '5' | '10'}
            onChange={(v) => onValidity(v === '5' ? 5 : 10)}
            className="mt-3 max-w-[240px]"
            options={[
              { value: '10', label: isolate(t('validity.10')), sub: <span className={SUB}>{cents(plan.fees.adult10)}</span> },
              { value: '5', label: isolate(t('validity.5')), sub: <span className={SUB}>{cents(plan.fees.adult5)}</span> },
            ]}
          />
        </Tile>
        {rush ? (
          <>
            <Tile
              label={<span>{words(t(`stat.rush.${rush.kind}`))}</span>}
              value={<bdi dir="ltr">{rush.kind === 'express' ? '2–9' : fmt.number(1)}</bdi>}
              unit={<span className="whitespace-nowrap">{t('stat.businessDaysCount', { count: rush.kind === 'express' ? 9 : 1 })}</span>}
              note={isolate(
                rush.kind === 'emergency'
                  ? t('stat.rushNote.emergency')
                  : t(`stat.rushNote.${rush.kind}`, { fee: fmt.money(rush.kind === 'express' ? plan.fees.expressPickup : plan.fees.urgentPickup) }),
              )}
            />
            <Tile
              lead
              label={<span>{words(t(rush.kind === 'emergency' ? 'stat.urgentReady' : 'stat.pickUpBy'))}</span>}
              value={ordinal(d(rush.readyBy))}
              tone={rush.kind === 'emergency' ? 'danger' : undefined}
              note={isolate(rush.kind === 'emergency' ? t('stat.tripOn', { date: d(rush.trip) }) : t('stat.pickUpNote', { count: diffDays(rush.readyBy, rush.trip) }))}
            />
          </>
        ) : (
          <>
            <Tile label={t('stat.processing')} value={<bdi dir="ltr">{fmt.number(m.businessDays)}</bdi>} unit={<span className={UNIT}>{t('stat.businessDays')}</span>} note={isolate(t(`stat.processingNote.${method}`))} />
            {method === 'mail' ? (
              <Tile lead label={t('stat.mailReady')} value={isolate(t('stat.mailWeeks', { count: Math.round(m.businessDays / 5) }))} note={isolate(t('stat.mailNote'))} />
            ) : (
              <Tile
                lead
                label={t('stat.readyBy')}
                value={ordinal(d(m.readyBy))}
                note={
                  <>
                    {later ? ordinal(t('stat.readyNoteFrom', { date: d(plan.officeOpensOn) })) : t('stat.readyNote')}
                    <span className="block whitespace-nowrap">{ordinal(t('stat.readyNoteHand', { date: d(m.inHandBy) }))}</span>
                  </>
                }
              />
            )}
          </>
        )}
      </div>
      {method === 'online' && !m.available ? (
        <Notice tone="info" className="mt-3">
          {leadAndBody(
            t(`online.unavailable.${m.reason ?? 'too-early'}`),
            m.reason === 'too-early' && plan.onlineOpensOn
              ? t('online.opens', { date: d(plan.onlineOpensOn, { month: 'long', day: 'numeric', year: 'numeric' }) })
              : m.reason === 'unknown-expiry'
                ? null
                : t('online.tryInPerson'),
          )}
        </Notice>
      ) : null}
    </WidgetSection>
  );
}
