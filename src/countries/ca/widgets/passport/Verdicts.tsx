'use client';
/**
 * The card at the top of the planner: the answer to the question asked.
 *   Verdict            "Can I renew?" (and whether online is open)
 *   (TripVerdict.tsx   a trip regular processing can't make: express or urgent pick-up, or who to call)
 *   FeeVerdict         "How much does a passport cost?"
 *   ProcessingVerdict  "How long does it take?"
 *   OnlineVerdict      "Can I renew online?"
 */
import { useId, type ReactNode } from 'react';
import { AlertTriangle, Check, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { PassportCover } from './PassportCover';
import type { PlannerOutput } from './types';
import { CARD, HEADING, isolate, isolateItem, MAPLE, nb, ordinal, PINE } from './shared';

/** The answer card for a fee, processing-time or online question: a titled section in the verdict's wash. */
function FocusCard({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn(CARD, PINE)}>
      <h4 id={id} className="m-0 text-balance font-serif text-[22px] font-normal leading-tight tracking-[-.02em] text-ink">
        {isolate(title)}
      </h4>
      {children}
    </section>
  );
}

/**
 * One of the two big numbers in an answer card, with its label under it. Column-reverse + justify-end: the
 * numbers line up at the top even when one label wraps.
 */
function Tile({ label, labelClassName, children }: { label: ReactNode; labelClassName: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col-reverse justify-end rounded-tile bg-card/80 px-3.5 py-3 shadow-sm ring-1 ring-hair @md:px-4">
      <dt className={cn('text-[14px] font-medium', labelClassName)}>{label}</dt>
      <dd className="m-0 font-serif text-[26px] leading-none tracking-[-.03em] text-ink tabular-nums [font-variation-settings:'opsz'_48] @md:text-[32px]">{children}</dd>
    </div>
  );
}
const TILES = 'm-0 mt-4 grid grid-cols-2 gap-2.5';

export function Verdict({ plan, canRenew }: { plan: PlannerOutput; canRenew: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const online = plan.methods.online;
  const exp = plan.expiry;
  // "if it expires by …" only when the window edge falls inside a month-only expiry.
  const straddles = !!exp && exp.monthOnly && exp.start <= plan.onlineOpenIfExpiresBy && plan.onlineOpenIfExpiresBy < exp.end;
  return (
    <div className={cn(CARD, canRenew ? PINE : MAPLE)} role="status" aria-live="polite">
      {/* The passport itself, tilted and running off the card's edge: the one illustrated moment in the plan. */}
      {canRenew ? <PassportCover size="lg" className="pointer-events-none absolute end-7 top-5 hidden rotate-[8deg] @xl:block rtl:-rotate-[8deg]" /> : null}
      <div className={cn('flex items-start gap-3.5', canRenew && '@xl:pe-[132px]')}>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-card',
            canRenew ? 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]' : 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
          )}
          aria-hidden
        >
          {canRenew ? <Check className="size-[18px]" strokeWidth={2.6} /> : <CircleAlert className="size-[18px]" strokeWidth={2.4} />}
        </span>
        <div className="min-w-0">
          <p className={HEADING}>{isolate(canRenew ? t('verdict.yes') : t('verdict.no'))}</p>
          <p className="m-0 mt-1 text-[15px] text-ink-2">{isolate(canRenew ? t('verdict.yesSub') : t('verdict.noSub'))}</p>
          {canRenew ? (
            <p className="m-0 mt-2 text-[14px] text-ink-2">
              <bdi>
                {online.available ? (
                  <>
                    <b className="font-semibold text-pine">{t('verdict.onlineOpen')}</b>
                    {plan.expired
                      ? ` · ${t('verdict.onlineExpired')}`
                      : straddles
                        ? <> · {ordinal(t('verdict.onlineIfBy', { date: nb(fmt.date(plan.onlineOpenIfExpiresBy, { month: 'long', day: 'numeric' })) }))}</>
                        : ` · ${t('verdict.onlineWithin')}`}
                  </>
                ) : online.reason === 'travel-soon' && plan.travelDate ? (
                  <b className="font-semibold text-maple-ink">{ordinal(t('verdict.travelSoon', { date: nb(fmt.date(plan.travelDate, { month: 'long', day: 'numeric' })) }))}</b>
                ) : online.reason === 'too-early' && plan.onlineOpensOn ? (
                  ordinal(t('verdict.onlineLater', { date: nb(fmt.date(plan.onlineOpensOn, { month: 'long', day: 'numeric', year: 'numeric' })) }))
                ) : online.reason === 'outside-canada' ? (
                  t('verdict.outsideCanada')
                ) : online.reason === 'unknown-expiry' ? (
                  t('verdict.onlineDepends')
                ) : null}
              </bdi>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Express and urgent pick-up with their extra fees. On phones the note sits on its own line under the service
 * name, so "2 to 9 business days" never leaves "days" alone next to the price.
 */
function FasterRows({ plan }: { plan: PlannerOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <>
      <p className="m-0 mt-5 text-[14px] font-semibold text-ink">{isolate(t('fees.faster'))}</p>
      <dl className="m-0 mt-1.5 grid gap-0">
        {([
          ['fees.express', 'fees.expressNote', plan.fees.expressPickup],
          ['fees.urgent', 'fees.urgentNote', plan.fees.urgentPickup],
        ] as const).map(([k, note, n]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-hair py-2.5 last:border-b-0">
            <dt className="min-w-0 text-[14.5px] leading-snug text-ink">
              <bdi className="font-semibold">{t(k)}</bdi>
              <span className="hidden text-ink-3 @md:inline">
                {' · '}
              </span>
              <span className="block text-[13.5px] text-ink-3 @md:inline @md:text-[14.5px]">{isolate(t(note))}</span>
            </dt>
            <dd className="m-0 shrink-0 font-serif text-[20px] leading-none tracking-[-.02em] text-ink tabular-nums">
              <bdi dir="ltr">+{nb(fmt.money(n))}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/**
 * The answer to "How much does a passport cost?": the two adult fees up front, then what faster service
 * adds at a passport office. Same card as the verdict, so a fee question gets a fee answer first.
 */
export function FeeVerdict({ plan }: { plan: PlannerOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const f = plan.fees;
  const cents = (n: number) => nb(fmt.money(n, { cents: 'always' }));
  return (
    <FocusCard title={t('fees.title')}>
      <p className="m-0 mt-0.5 text-[14px] text-ink-2">{isolate(t('fees.sub', { date: nb(fmt.date(f.since, { month: 'long', day: 'numeric', year: 'numeric' })) }))}</p>
      <dl className={TILES}>
        {([
          ['fees.10', f.adult10],
          ['fees.5', f.adult5],
        ] as const).map(([k, n]) => (
          <Tile key={k} label={isolate(t(k))} labelClassName="mt-1 text-ink-2">
            <bdi dir="ltr">{cents(n)}</bdi>
          </Tile>
        ))}
      </dl>
      <FasterRows plan={plan} />
      <p className="m-0 mt-2 text-[14px] text-ink-2">{isolate(t('fees.child', { fee: cents(f.child) }))}</p>
    </FocusCard>
  );
}

/**
 * The answer to "How long does passport renewal take?": business days by where you apply, then what
 * faster service at a passport office does, then the mailing caveat. Same card as the fee answer.
 */
export function ProcessingVerdict({ plan }: { plan: PlannerOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const office = plan.methods['in-person'].businessDays;
  const online = plan.methods.online.businessDays;
  return (
    <FocusCard title={t('proc.title')}>
      <p className="m-0 mt-0.5 text-[14px] text-ink-2">{isolate(t('proc.sub'))}</p>
      <dl className={TILES}>
        {([
          ['proc.office', office],
          ['proc.other', online],
        ] as const).map(([k, n]) => (
          <Tile key={k} label={isolate(t(k))} labelClassName="mt-2 leading-snug text-ink @md:mt-1 @md:text-ink-2">
            {fmt.number(n)}
            {/* The unit sits under the number on phones, so "business days" never breaks across lines. */}
            <span className="mt-1 block font-sans text-[13px] font-medium tracking-normal text-ink-3 @md:ms-1.5 @md:mt-0 @md:inline">
              {t('stat.businessDaysCount', { count: n })}
            </span>
          </Tile>
        ))}
      </dl>
      <FasterRows plan={plan} />
      <p className="m-0 mt-2 text-[14px] text-ink-2">{isolate(t('proc.mailing'))}</p>
    </FocusCard>
  );
}

/** The answer to "Can I renew my passport online?": when it opens, and the conditions, before any dates. */
export function OnlineVerdict({ plan }: { plan: PlannerOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <FocusCard title={t('onl.title')}>
      <p className="m-0 mt-1 text-[14px] text-ink-2">
        {isolate(t('onl.openBy', { date: nb(fmt.date(plan.onlineOpenIfExpiresBy, { month: 'long', day: 'numeric', year: 'numeric' })) }))}
      </p>
      <p className="m-0 mt-5 text-[14px] font-semibold text-ink">{isolate(t('onl.also'))}</p>
      <ul className="m-0 mt-2 grid list-none gap-2 p-0">
        {(['1', '2', '3', '4'] as const).map((k) => (
          <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ink">
            <Check className="mt-[3px] size-3.5 shrink-0 text-pine" strokeWidth={2.6} aria-hidden />
            {isolateItem(t(`onl.c${k}`))}
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 flex gap-2 text-[14px] leading-snug text-ink-2">
        <AlertTriangle className="mt-px size-3.5 shrink-0 text-amber" aria-hidden />
        {isolateItem(t('onl.cancelled'))}
      </p>
    </FocusCard>
  );
}
