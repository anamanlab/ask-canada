'use client';
/**
 * The days calculator's verdict: a ring with the days counted, then the answer (eligible now, the
 * earliest date to apply, or not within 5 years), IRCC's advice to keep a margin, and what the last
 * edit changed ("That change moves your date 20 days later", "…leaves you 175 days over the minimum").
 * Phones stack the ring over a centred verdict; from @md the verdict sits beside the ring.
 */
import type { CSSProperties, Ref } from 'react';
import { CalendarCheck2, CalendarClock, Check, CheckCircle2, CircleAlert, Scale } from 'lucide-react';
import { Badge, NumberTicker } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { PresenceResult } from './presence';
import { firstOf, formatDays as days, useLang } from './shared';

/** What the person's last edit did to the answer. */
export type Change =
  | { kind: 'later' | 'earlier'; days: number; date: string }
  | { kind: 'eligible' | 'short' }
  /** Still enough days, with a different surplus over the minimum. */
  | { kind: 'margin'; days: number; more: boolean };

/** Compare two results and describe the move, if the answer changed. */
export function changeBetween(before: PresenceResult | null, after: PresenceResult | null): Change | null {
  if (!before || !after) return null;
  if (after.eligible && !before.eligible) return { kind: 'eligible' };
  if (!after.eligible && before.eligible) return { kind: 'short' };
  if (after.eligible) return after.surplus === before.surplus ? null : { kind: 'margin', days: after.surplus, more: after.surplus > before.surplus };
  if (!before.earliest || !after.earliest || before.earliest === after.earliest) return null;
  const shift = (Date.parse(after.earliest) - Date.parse(before.earliest)) / 86_400_000;
  return { kind: shift > 0 ? 'later' : 'earlier', days: Math.abs(shift), date: after.earliest };
}

const R = 38;
const C = 2 * Math.PI * R;

/** The ring draws itself from empty when the answer arrives, then follows every edit. */
function Ring({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <svg viewBox="0 0 88 88" className="size-[112px] shrink-0 -rotate-90 @md:size-[128px]" aria-hidden>
      <circle cx="44" cy="44" r={R} fill="none" stroke="var(--hair-2)" strokeWidth="5.5" />
      <circle
        cx="44"
        cy="44"
        r={R}
        fill="none"
        stroke="var(--pine)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray={C}
        style={{ '--ring-off': `${C * (1 - pct)}px` } as CSSProperties}
        className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(.22,1,.36,1)] [stroke-dashoffset:var(--ring-off)] motion-reduce:transition-none starting:[stroke-dashoffset:238.76px]"
      />
    </svg>
  );
}

const CHANGE_ICON = { eligible: CheckCircle2, short: CircleAlert, earlier: CalendarCheck2, later: CalendarClock, margin: Scale };

export function Hero({
  result,
  change,
  headingRef,
}: {
  result: PresenceResult;
  change: Change | null;
  /** Given when the verdict should take focus as it appears (it replaced the form the person just sent). */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const whole = Math.floor(result.total);
  const half = result.total - whole >= 0.5;
  const lang = useLang();
  const long = (iso: string) => firstOf(fmt.date(iso, { month: 'long', day: 'numeric', year: 'numeric' }), lang);
  // Good news in pine, a setback in maple, a smaller (but still sufficient) margin in plain ink.
  const tone = !change ? null : change.kind === 'earlier' || change.kind === 'eligible' || (change.kind === 'margin' && change.more) ? 'good' : change.kind === 'margin' ? 'plain' : 'bad';
  const ChangeIcon = change ? CHANGE_ICON[change.kind] : null;
  return (
    <div
      className={cn(
        'mx-3 rounded-card border px-5 py-6 sm:mx-4 @md:px-7 @md:py-7',
        result.eligible || result.earliest
          ? 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_55%,color-mix(in_oklab,var(--amber)_8%,transparent))]'
          : 'border-maple/20 bg-maple-wash',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-center @md:flex-row @md:gap-6 @md:text-start">
        <div className="relative grid shrink-0 place-items-center">
          <Ring value={result.total} max={result.required} />
          {/* The sentence below is the text equivalent; the split, animated number would be read twice. */}
          <span className="absolute inset-0 grid place-items-center text-center leading-none" aria-hidden>
            <span>
              <span className="block whitespace-nowrap font-serif text-[25px] tabular-nums tracking-[-.02em] text-ink @md:text-[28px]" dir="ltr">
                <NumberTicker value={whole} format={(n) => fmt.number(Math.round(n))} />
                {half ? <span className="text-[.65em]">{fmt.number(0.5, { minimumFractionDigits: 1 }).slice(1)}</span> : null}
              </span>
              <span className="mt-1.5 block text-[12.5px] tabular-nums text-ink-3">{t('presence.hero.of', { need: fmt.number(result.required) })}</span>
            </span>
          </span>
          {/* Reaching the minimum earns a small seal on the ring. */}
          {result.eligible ? (
            <span
              className="absolute end-1 top-1 grid size-7 place-items-center rounded-full bg-pine text-card shadow-md transition-transform delay-500 duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none starting:scale-0"
              aria-hidden
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 max-w-full">
          {/* One heading (label and answer), so a screen reader reads the verdict as a single line when it takes focus. */}
          <h4 ref={headingRef} tabIndex={-1} className="m-0 font-sans font-normal outline-none">
            {result.eligible ? (
              <>
                <span className="block text-[14px] font-medium text-pine">{t('presence.hero.countLabel')}</span>
                <span className="mt-1 block font-serif text-[28px] leading-[1.1] tracking-[-.02em] text-balance text-ink [font-variation-settings:'opsz'_48] @md:text-[34px]">{t('presence.hero.eligible')}</span>
              </>
            ) : result.earliest ? (
              <>
                <span className="block text-[14px] font-medium text-pine">{t('presence.hero.dateLabel')}</span>
                {/* Sized from the card's width, so the whole date stays on one line on any phone. */}
                <span className="mt-1 block whitespace-nowrap font-serif text-[clamp(26px,9.5cqi,36px)] leading-[1.05] tracking-[-.025em] text-ink [font-variation-settings:'opsz'_48] @md:text-[44px]">
                  <bdi>{long(result.earliest)}</bdi>
                </span>
              </>
            ) : (
              <span className="block font-serif text-[24px] leading-[1.15] tracking-[-.02em] text-balance text-ink @md:text-[28px]">{t('presence.hero.never', { need: fmt.number(result.required) })}</span>
            )}
          </h4>
          {!result.eligible && result.earliest ? (
            <Badge tone="ok" className="mt-2.5">
              {t('presence.hero.in', { count: result.wait ?? 0 })}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-5 text-center @md:text-start">
        <p className="m-0 text-[15px] leading-snug text-pretty text-ink-2">
          {result.eligible
            ? t('presence.hero.eligibleSub', { count: result.surplus })
            : result.earliest
              ? t('presence.hero.have', {
                  have: days(fmt, result.total),
                  need: fmt.number(result.required),
                })
              : t('presence.hero.neverSub')}
        </p>
        {/* The earliest date is the day the count reaches 1,095 exactly; IRCC asks for a margin. */}
        {!result.eligible && result.earliest ? <p className="m-0 mt-1.5 text-[14px] leading-snug text-pretty text-ink-2">{t('presence.hero.margin')}</p> : null}
      </div>
      {change && ChangeIcon ? (
        <p
          className={cn(
            'm-0 mt-4 flex items-start gap-2 border-t pt-3.5 text-[14px] font-medium leading-snug',
            tone === 'good' ? 'border-pine/15 text-pine' : tone === 'plain' ? 'border-hair-2 text-ink' : 'border-maple/20 text-maple-ink',
          )}
        >
          <ChangeIcon className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>
            {change.kind === 'later' || change.kind === 'earlier'
              ? t(`presence.change.${change.kind}`, { count: change.days, date: long(change.date) })
              : change.kind === 'margin'
                ? t('presence.change.margin', { count: change.days })
                : t(`presence.change.${change.kind}`, { need: fmt.number(result.required) })}
          </span>
        </p>
      ) : null}
    </div>
  );
}
