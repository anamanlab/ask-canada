'use client';
/**
 * The three panels of the savings-room helper (TFSA, RRSP, FHSA). Each gets the computed room, the person's
 * entries and one `patch` to change them:
 *   <TfsaPanel room={room} form={form} patch={patch} />
 */
import type { ReactNode } from 'react';
import { CalendarClock, Home, Landmark, Sprout, UserCheck, type LucideIcon } from 'lucide-react';
import { Badge, ExternalLink, Field, LiveRegion, NumberTicker, Segmented, Select, Toggle, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { returnDates } from './calc/deadlines';
import type { RoomInput, RoomOutput } from './calc/room';
import { FHSA, RRSP_RATE } from './data';
import { URLS } from './urls';
import { MoneyField, YearField } from './fields';
import messages from './messages';
import { Ring, useDateFmt } from './shared';

type PanelProps = { room: RoomOutput; form: RoomInput; patch: (next: Partial<RoomInput>) => void };

function useMoney() {
  const { fmt } = useLocale();
  return (n: number) => fmt.money(n, { cents: 'never' });
}

/** The headline amount for a plan, with a ring and one sentence of context. */
function Hero({
  tone,
  icon: Icon,
  eyebrow,
  value,
  empty,
  note,
  ring,
  ringLabel,
}: {
  tone: 'glacier' | 'pine';
  icon: LucideIcon;
  eyebrow: string;
  value: number | null;
  empty?: string;
  note: string;
  ring: number;
  ringLabel: string;
}) {
  const money = useMoney();
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-[22px] border px-5 py-5',
        tone === 'pine'
          ? 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_14%,transparent),color-mix(in_oklab,var(--a-teal)_12%,transparent))]'
          : 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--a-violet)_12%,transparent))]',
      )}
    >
      <div className="min-w-0">
        <p className={cn('m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em]', tone === 'pine' ? 'text-pine' : 'text-glacier')}>{eyebrow}</p>
        {value == null ? (
          <p className="m-0 mt-1.5 text-balance font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink-2">{empty}</p>
        ) : (
          <p className="m-0 mt-1.5 font-serif text-[38px] leading-none @md:text-[46px] tracking-[-.035em] text-ink [font-variation-settings:'opsz'_72]">
            <NumberTicker value={value} format={money} />
          </p>
        )}
        <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">
          <bdi>{note}</bdi>
        </p>
        {/* The amount follows every keystroke: it is read once, after the person stops typing. */}
        <LiveRegion text={`${eyebrow}, ${value == null ? (empty ?? '') : money(value)}. ${note}`} />
      </div>
      <Ring value={ring} size={72} stroke={7} tone={tone} label={ringLabel}>
        <Icon className={cn('size-6', tone === 'pine' ? 'text-pine' : 'text-glacier')} strokeWidth={1.8} aria-hidden />
      </Ring>
    </div>
  );
}

/** Quiet tinted note with an icon (the RRSP deadline, who can open an FHSA). */
function Callout({ icon: Icon, tone, className, children }: { icon: LucideIcon; tone: 'glacier' | 'pine'; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-[16px] border border-hair bg-paper-2 px-4 py-3.5', className)}>
      <Icon className={cn('mt-0.5 size-[18px] shrink-0', tone === 'pine' ? 'text-pine' : 'text-glacier')} strokeWidth={1.9} aria-hidden />
      <p className="m-0 text-[14px] leading-snug text-ink-2">{children}</p>
    </div>
  );
}

export function TfsaPanel({ room, form, patch }: PanelProps) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = useMoney();
  const tf = room.tfsa;
  const year = String(room.year);
  const birthYear = form.birthYear ?? null;
  const net = form.tfsaNet ?? null;
  const max = Math.max(...tf.years.map((y) => y.limit));
  const first = tf.years[0];
  const last = tf.years[tf.years.length - 1];
  const notYet = birthYear != null && !tf.eligible;
  return (
    <WidgetSection className="pt-5">
      <Hero
        tone="glacier"
        icon={Sprout}
        eyebrow={net == null ? t('room.tfsa.eyebrowTotal', { year }) : t('room.tfsa.eyebrow', { year })}
        value={notYet ? 0 : tf.room}
        empty={t('room.tfsa.empty')}
        note={
          birthYear == null
            ? t('room.tfsa.needYear', { amount: money(tf.years.reduce((s, y) => s + y.limit, 0)) })
            : notYet
              ? t('room.tfsa.notYet', { year: String(birthYear + 18) })
              : net == null
                ? t('room.tfsa.since', { year: String(tf.startYear) })
                : t('room.tfsa.left', { total: money(tf.limitTotal), used: money(net) })
        }
        ring={tf.limitTotal > 0 && tf.room != null ? tf.room / tf.limitTotal : 0}
        ringLabel={t('room.tfsa.ring', { room: money(tf.room ?? 0), total: money(tf.limitTotal) })}
      />
      <div className="mt-4 grid grid-cols-2 items-start gap-3.5 @xl:grid-cols-3">
        <YearField label={t('room.tfsa.birth')} value={birthYear} onChange={(n) => patch({ birthYear: n })} min={1900} max={room.year} rangeNote={t('room.tfsa.yearRange', { min: '1900', max: year })} />
        <YearField
          label={t('room.tfsa.resident')}
          hint={t('room.tfsa.residentHint')}
          value={form.residentSince ?? null}
          onChange={(n) => patch({ residentSince: n })}
          // A year before the TFSA existed is a fair answer ("I moved in 2005"): it simply limits nothing.
          min={1900}
          max={room.year}
          rangeNote={t('room.tfsa.residentRange', { min: '1900', max: year })}
        />
        <MoneyField className="col-span-2 @xl:col-span-1" label={t('room.tfsa.net')} hint={t('room.tfsa.netHint')} value={net} onChange={(n) => patch({ tfsaNet: n })} />
      </div>

      <figure className="m-0 mt-5">
        <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('room.tfsa.chart')}</span>
          {tf.startYear != null && tf.eligible ? (
            <Badge tone="info">
              <bdi>{t('room.tfsa.counted', { count: tf.years.filter((y) => y.counted).length })}</bdi>
            </Badge>
          ) : null}
        </figcaption>
        {/* A time axis: the years run left to right in every language. */}
        <div dir="ltr" className="flex h-[112px] items-end gap-[3px]" aria-hidden>
          {tf.years.map((y) => (
            <span key={y.year} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              {y.limit === max ? <span className="mb-1 whitespace-nowrap font-mono text-[11.5px] font-medium text-ink-2">{fmt.money(y.limit, { cents: 'never', compact: true })}</span> : null}
              <span className={cn('w-full rounded-t-[4px] transition-colors', y.counted ? 'bg-glacier' : 'bg-hair-2')} style={{ height: `${(y.limit / max) * 82}%` }} />
            </span>
          ))}
        </div>
        <div dir="ltr" className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-3" aria-hidden>
          <span>{first.year}</span>
          <span>{last.year}</span>
        </div>
        <p className="sr-only">{t('room.tfsa.chartSr', { first: money(first.limit), y2015: money(max), now: money(last.limit) })}</p>
      </figure>
      <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-3">{t('room.tfsa.withdrawals')}</p>
    </WidgetSection>
  );
}

export function RrspPanel({ room, form, patch }: PanelProps) {
  const t = useMessages(messages);
  const df = useDateFmt();
  const money = useMoney();
  const { newRoom, limit, atMax, incomeYear } = room.rrsp;
  const year = String(room.year);
  const pct = String(Math.round(RRSP_RATE * 100));
  return (
    <WidgetSection className="pt-5">
      <Hero
        tone="glacier"
        icon={Landmark}
        eyebrow={t('room.rrsp.eyebrow', { year })}
        value={newRoom}
        empty={t('room.rrsp.empty')}
        note={
          newRoom == null
            ? t('room.rrsp.rule', { pct, limit: money(limit), year })
            : atMax
              ? t('room.rrsp.atMax', { limit: money(limit), year })
              : t('room.rrsp.calc', { income: money(form.earnedIncome ?? 0), pct })
        }
        ring={newRoom != null ? newRoom / limit : 0}
        ringLabel={t('room.rrsp.ring', { limit: money(limit) })}
      />
      <div className="mt-4 grid items-start gap-3.5 @xl:grid-cols-2">
        <MoneyField label={t('room.rrsp.income', { year: String(incomeYear) })} hint={t('room.rrsp.incomeHint')} value={form.earnedIncome ?? null} onChange={(n) => patch({ earnedIncome: n })} />
        <Callout icon={CalendarClock} tone="glacier" className="@xl:mt-[26px]">
          <b className="font-semibold text-ink">{t('room.rrsp.deadline', { date: df(returnDates(room.year).rrsp, { month: 'long', day: 'numeric', year: 'numeric' }) })}</b> {t('room.rrsp.deadlineSub', { year })}
        </Callout>
      </div>
      <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-3">{t('room.rrsp.noa')}</p>
    </WidgetSection>
  );
}

/** The most years shown side by side; from the fifth year on (2027) the year is picked from a list instead. */
const FHSA_YEAR_PILLS = 4;
/** Years an FHSA could have been opened in: from the first year the account existed to this one. */
const fhsaYears = (now: number) => Array.from({ length: now - FHSA.firstYear + 1 }, (_, i) => FHSA.firstYear + i);

export function FhsaPanel({ room, form, patch }: PanelProps) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const money = useMoney();
  const { carry, lifetimeLeft } = room.fhsa;
  const year = String(room.year);
  const opened = form.fhsaOpened ?? null;
  const years = fhsaYears(room.year);
  const annual = money(FHSA.annual);
  const lifetime = { left: money(lifetimeLeft), total: money(FHSA.lifetime) };
  const rule = opened == null ? t('room.fhsa.first', { amount: annual }) : carry > 0 ? t('room.fhsa.withCarry', { annual, carry: money(carry) }) : t('room.fhsa.noCarry', { annual });
  return (
    <WidgetSection className="pt-5">
      <Hero
        tone="pine"
        icon={Home}
        eyebrow={t('room.fhsa.eyebrow', { year })}
        value={room.fhsa.room}
        note={opened == null ? rule : `${rule} ${t('room.fhsa.lifetime', lifetime)}`}
        ring={1 - lifetimeLeft / FHSA.lifetime}
        ringLabel={t('room.fhsa.ring', lifetime)}
      />
      {opened == null ? (
        <Callout icon={UserCheck} tone="pine" className="mt-3 gap-2.5 py-3">
          {t('room.fhsa.who')} <ExternalLink href={URLS.fhsaOpen[lang]}>{t('room.fhsa.whoLink')}</ExternalLink>
        </Callout>
      ) : null}
      {/* "Not opened yet" is its own switch, so the year row only ever holds years (they all fit a phone, in French too). */}
      <Toggle
        label={t('room.fhsa.have')}
        checked={opened != null}
        onChange={(on) => patch({ fhsaOpened: on ? room.year : null })}
        className="mt-3 min-h-12 rounded-[14px] bg-paper-2 py-2 ps-4 pe-3"
      />
      {opened == null ? null : years.length <= FHSA_YEAR_PILLS ? (
        <div className="mt-3.5">
          <p className="m-0 mb-1.5 text-[14px] font-medium leading-snug text-ink" aria-hidden>
            {t('room.fhsa.opened')}
          </p>
          <Segmented
            label={t('room.fhsa.opened')}
            value={String(opened)}
            onChange={(v) => patch({ fhsaOpened: Number(v) })}
            options={years.map((y) => ({ value: String(y), label: <span className="tabular-nums">{y}</span> }))}
          />
        </div>
      ) : (
        <Field label={t('room.fhsa.opened')} className="mt-3.5 [&>label]:leading-snug">
          {(p) => (
            <Select
              {...p}
              value={String(opened)}
              onChange={(e) => patch({ fhsaOpened: Number(e.target.value) })}
              className="min-h-12 tabular-nums"
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
          )}
        </Field>
      )}
      {opened != null ? (
        // Opened this year: one field, across the row (half a row beside nothing reads as a missing field).
        <div className={cn('mt-3.5 grid gap-3.5', opened < room.year && '@xl:grid-cols-2')}>
          {opened < room.year ? (
            <MoneyField label={t('room.fhsa.prior', { year })} hint={t('room.fhsa.priorHint')} value={form.fhsaPrior ?? null} onChange={(n) => patch({ fhsaPrior: n })} />
          ) : null}
          <MoneyField label={t('room.fhsa.now', { year })} value={form.fhsaThisYear ?? null} onChange={(n) => patch({ fhsaThisYear: n })} />
        </div>
      ) : null}
      <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-3">{t('room.fhsa.rules', { lifetime: money(FHSA.lifetime), carry: money(FHSA.carryMax) })}</p>
    </WidgetSection>
  );
}
