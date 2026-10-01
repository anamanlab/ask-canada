'use client';
/**
 * businessRegistration: "Do I need to register for GST/HST, and do I need a business number?"
 * Runs the CRA small supplier test on the last four calendar quarters as the person types, draws the
 * running total against the limit, lists the CRA program accounts they need (built onto one BN), and
 * shows the rate to charge in their province. Nothing is saved or sent anywhere.
 */
import { Fragment, useState } from 'react';
import { Receipt } from 'lucide-react';
import { Disclosure, LiveRegion, MoneyInput, Notice, Toggle, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import type { WidgetProps } from '@/lib/widgets/types';
import type { RegistrationInput, RegistrationOutput } from './build';
import { accountsFor, daysIntoQuarter, gstCheck, needsBn, taxRateFor, type GstCheck, type OrgType, type Quarter } from './calc';
import { GST, pickSources, type Province, type UrlKey } from './data';
import { ActivityToggles, BusinessNumberCard } from './RegistrationAccounts';
import { RegistrationMeter, swatch } from './RegistrationMeter';
import { BizError, ChoicePills, Hero, ProvinceSelect, useBiz, useSelectOnTab, type HeroTone } from './shared';
import { BizSkeleton } from './skeletons';

export function BusinessRegistration({ part }: WidgetProps<RegistrationInput, RegistrationOutput>) {
  const { t, href } = useBiz();
  if (part.state === 'output-error') return <BizError href={href('gstWhen')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <BizSkeleton kind="registration" title={t('reg.title')} subtitle={t('reg.subtitle')} icon={Receipt} tone="pine" />;
  }
  return <Checker data={part.output} />;
}

/** `strong`: the part of `body` to emphasise (the date that matters). */
type Verdict = { tone: HeroTone; title: string; body: string; extra?: string; strong?: string };

/** A current quarter younger than this carries (almost) none of a yearly figure: the caption says so. */
const YOUNG_QUARTER_DAYS = 7;

/** Sections sit a little further apart than the shell's default: this widget has a lot to say. */
const SECTION = 'pt-6 [&+&]:mt-6';

/** The one-sentence answer and its reason, from the small supplier test. */
function verdictFor(
  check: GstCheck,
  o: { empty: boolean; spreadOver: boolean; today: string },
  { t, dollars, range, long }: { t: ReturnType<typeof useBiz>['t']; dollars: (n: number) => string; range: (q: Quarter) => string; long: (iso: string) => string },
): Verdict {
  const threshold = dollars(check.threshold);
  if (o.empty) return { tone: 'info', title: t('reg.hero.empty'), body: t('reg.hero.empty.sub') };
  if (check.status === 'must') return { tone: 'warn', title: t('reg.hero.must'), body: t('reg.hero.must.sub') };
  // A yearly figure spread evenly can't tell which quarter went over, so never state a date from it.
  if (o.spreadOver) return { tone: 'warn', title: t('reg.hero.spread', { threshold }), body: t('reg.hero.spread.sub', { amount: dollars(check.total) }) };
  if (check.status === 'over-quarter') {
    // A quarter that has ended: the 29 days ran from the sale that went over, so they are long gone.
    const q = check.quarters[check.crossedIndex ?? 0];
    return { tone: 'warn', title: t('reg.hero.quarter'), body: t(q.current ? 'reg.hero.quarter.sub' : 'reg.hero.quarter.past', { threshold, quarter: range(q) }) };
  }
  if (check.status === 'over-four') {
    // Past: quarters before the four we know could have tipped the total over sooner, so the date is a latest date.
    const future = check.smallUntil != null && check.smallUntil >= o.today;
    const date = long(check.smallUntil ?? o.today);
    return { tone: 'warn', title: t('reg.hero.four'), body: t(future ? 'reg.hero.four.future' : 'reg.hero.four.pastLatest', { threshold, date }), strong: date };
  }
  // Exactly at the limit ("exceed" is strict): still a small supplier, but "$0 more" would read like a bug.
  if (check.headroom === 0) return { tone: 'info', title: t('reg.hero.small'), body: t('reg.hero.small.atLimit', { threshold }), extra: t('reg.hero.small.voluntary') };
  return { tone: 'ok', title: t('reg.hero.small'), body: t('reg.hero.small.sub', { amount: dollars(check.headroom) }), extra: t('reg.hero.small.voluntary') };
}

function Checker({ data }: { data: RegistrationOutput }) {
  const { t, fmt, lang, href, dollars } = useBiz();
  // The reader's own date: an answer reopened weeks later speaks in the right tense.
  const today = useToday(data.today, { pinned: data.pinToday });
  const [amounts, setAmounts] = useState<number[]>(data.check.quarters.map((q) => q.amount));
  const [org, setOrg] = useState<OrgType>(data.org);
  const [acts, setActs] = useState({ employees: data.employees, incorporated: data.incorporated, trade: data.trade, rideshare: data.rideshare });
  const [province, setProvince] = useState<Province | null>(data.province);
  // Where the business is located, not where a sale happens: only the tool's own province (where the person
  // said they are based) switches this on; picking Quebec to check a rate asks first.
  const [inQuebec, setInQuebec] = useState(data.province === 'QC');
  const [touched, setTouched] = useState(false);

  const check = gstCheck({ amounts, org, rideshare: acts.rideshare, today: data.today, now: today });
  // Reopened in a later quarter: the figures still belong to the quarters they were given for.
  const stale = today > check.quarters[check.quarters.length - 1].end;
  const accounts = accountsFor(check.status, acts);
  const bn = needsBn(accounts, acts.incorporated);
  const empty = !data.hasSales && !touched && check.total === 0 && check.status === 'small';
  const threshold = dollars(check.threshold);
  // "Jan–Mar 2026" / "janv.–mars 2026". English takes the first three letters of the full month name (no
  // abbreviation dot, whatever the ICU version); French keeps its dots (Canada.ca style).
  const range = (q: Quarter) => {
    if (lang === 'fr') return `${fmt.date(q.start, { month: 'short' })}–${fmt.date(q.end, { month: 'short', year: 'numeric' })}`;
    const month = (iso: string) => fmt.date(iso, { month: 'long' }).slice(0, 3);
    return `${month(q.start)}–${month(q.end)} ${q.end.slice(0, 4)}`;
  };
  const long = (iso: string) => fmt.date(iso, { month: 'long', day: 'numeric', year: 'numeric' });
  const rate = province ? taxRateFor(province) : null;
  const rideshare = check.status === 'must';
  // The footer cites the page that matches the handoff: the rideshare page for drivers (they register
  // whatever they earn), Revenu Québec for a business located in Quebec. Added here if the person changed it
  // after the tool answered.
  const first: UrlKey[] = [...(rideshare ? (['rideshare'] as const) : []), ...(inQuebec ? (['rqRegister', 'gstWhen'] as const) : [])];

  // A yearly figure spread evenly can't tell which quarter went over, so never state a date from it.
  const spreadOver = data.spread && !touched && (check.status === 'over-quarter' || check.status === 'over-four');
  const hero = verdictFor(check, { empty, spreadOver, today }, { t, dollars, range, long });

  // What the line under the fields says. A yearly figure laid over a quarter that is only days old fills three
  // fields and leaves the fourth (nearly) empty, which reads like a higher yearly pace than the person gave: say
  // whose figure it is and which quarters carry it.
  const caption = stale
    ? t('reg.stale')
    : !data.spread || touched
      ? t('reg.count')
      : daysIntoQuarter(data.today) < YOUNG_QUARTER_DAYS
        ? t('reg.spread.young', {
            amount: dollars(data.check.total),
            from: fmt.date(data.check.quarters[0].start, { month: 'long', year: 'numeric' }),
            to: fmt.date(data.check.quarters[2].end, { month: 'long', year: 'numeric' }),
            empty: data.check.quarters[3].amount === 0 ? 'yes' : 'no',
          })
        : t('reg.spread', { amount: dollars(data.check.total) });

  const setQ = (i: number, n: number) => {
    setTouched(true);
    setAmounts((a) => a.map((v, j) => (j === i ? n : v)));
  };

  const charity = org === 'charity';
  const selectOnTab = useSelectOnTab();
  const rateText = rate ? t(rate.kind === 'hst' ? 'reg.rate.hst' : 'reg.rate.gst', { rate: fmt.number(rate.rate) }) : null;
  // One announcement per change, once the figures settle: verdict, total, accounts needed, rate.
  const needed = accounts.filter((a) => a.need !== 'optional').map((a) => t(`reg.account.${a.code}`));
  const summary = [
    `${hero.title}. ${hero.body}`,
    t('reg.meter.sr', { total: dollars(check.total), threshold }),
    needed.length ? t('reg.sr.accounts', { list: needed.join(', ') }) : t('reg.sr.accounts.none'),
    rateText && province ? t('reg.sr.rate', { rate: rateText, province: t(`prov.${province}`) }) : '',
    inQuebec ? t('reg.quebec.located') : province === 'QC' ? t('reg.quebec') : '',
  ]
    .filter(Boolean)
    .join(' ');
  // The button, then one caption under it saying what to do there.
  const handoff = inQuebec ? { href: href('rqRegister'), label: t('reg.handoff.rq') } : { href: href('craSignIn'), label: t('reg.handoff') };
  const [bodyStart, bodyEnd] = hero.strong ? hero.body.split(hero.strong) : [hero.body];

  return (
    <WidgetShell
      icon={Receipt}
      tone="pine"
      title={t('reg.title')}
      subtitle={t('reg.subtitle')}
      sources={pickSources(data, lang, first)}
      handoff={handoff}
      footnote={t(inQuebec ? 'reg.handoff.rqNote' : 'reg.handoff.note')}
      className="@container"
    >
      <LiveRegion text={summary} delay={900} />
      <Hero tone={hero.tone} title={hero.title}>
        <p className="m-0">
          {bodyStart}
          {bodyEnd != null ? (
            <Fragment>
              <strong className="whitespace-nowrap font-semibold text-ink">{hero.strong}</strong>
              {bodyEnd}
            </Fragment>
          ) : null}
        </p>
        {hero.extra ? <p className="m-0 mt-1.5 text-[14px] text-ink-3">{hero.extra}</p> : null}
      </Hero>

      <WidgetSection
        className={SECTION}
        title={t('reg.meter')}
        aside={
          <span className="text-[13px] font-medium tabular-nums text-ink-2">
            <bdi className="whitespace-nowrap">{t('reg.meter.total', { amount: dollars(check.total) })}</bdi>
          </span>
        }
      >
        <RegistrationMeter quarters={check.quarters} threshold={check.threshold} label={range} muted={rideshare} />
        {rideshare ? <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-2">{t('reg.meter.noLimit', { amount: threshold })}</p> : null}
        <div className="mt-5 grid grid-cols-2 items-start gap-3 @xl:grid-cols-4" {...selectOnTab}>
          {check.quarters.map((q, i) => (
            <MoneyInput
              key={q.start}
              label={
                <>
                  <span className="sr-only">{t('reg.quarter.label', { range: range(q) })}</span>
                  <span aria-hidden className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <i className={cn('inline-block size-2 rounded-full', swatch(i))} />
                    {range(q)}
                  </span>
                </>
              }
              hint={q.current ? <span className="font-medium text-pine">{t('reg.quarter.current')}</span> : undefined}
              value={amounts[i] || undefined}
              onChange={(n) => setQ(i, n ?? 0)}
              max={1e9}
              placeholder="0"
            />
          ))}
        </div>
        <p className="m-0 mt-2.5 text-[13px] leading-snug text-ink-3">{caption}</p>
        <div className="mt-5">
          <p className="m-0 mb-2 text-[14px] font-medium text-ink">{t('reg.org')}</p>
          <ChoicePills
            label={t('reg.org')}
            value={org}
            onChange={setOrg}
            options={(['business', 'charity', 'psb'] as OrgType[]).map((o) => ({
              value: o,
              label: (
                <>
                  {t(`reg.org.${o}`)} <span className="ms-1 text-[13px] font-normal tabular-nums text-ink-3">{dollars(o === 'business' ? GST.threshold : GST.publicServiceThreshold)}</span>
                </>
              ),
            }))}
          />
          {org === 'charity' ? <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">{t('reg.org.charityNote', { amount: dollars(GST.charityGrossRevenue) })}</p> : null}
        </div>
      </WidgetSection>

      <WidgetSection className={SECTION} title={t(inQuebec ? 'reg.accounts.rq' : 'reg.accounts')}>
        <BusinessNumberCard accounts={accounts} bn={bn} charity={charity} province={province} />
        {/* Quebec: say who runs which account, since the card lists them together. */}
        {inQuebec ? <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-2">{t('reg.accounts.rqSplit')}</p> : null}
        <ActivityToggles
          acts={acts}
          org={org}
          onChange={(key, on) => {
            setActs((s) => ({ ...s, [key]: on }));
            if (key === 'rideshare' && on) setOrg('business');
          }}
        />
      </WidgetSection>

      {/* The rate is a second question: one row with the answer, the detail a tap away. Flush against the footer's rule. */}
      <div className="-mb-5 mt-6 border-t border-hair px-5 sm:px-6">
        <Disclosure
          className="border-t-0"
          title={t('reg.rate')}
          summary={rateText && province ? <bdi>{`${rateText} · ${t(`prov.${province}`)}`}</bdi> : t('prov.choose')}
          defaultOpen={data.province === 'QC'}
        >
          <div className="pb-4">
            <div className="grid gap-x-5 gap-y-3 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] @xl:items-end">
              <ProvinceSelect value={province} onChange={setProvince} />
              {rate ? (
                <p className="m-0 text-[22px] font-semibold leading-none tracking-[-.02em] text-ink @xl:pb-3">
                  <bdi>{rateText}</bdi>
                </p>
              ) : null}
            </div>
            {rate && province ? (
              <div className="mt-3 grid gap-2">
                <p className="m-0 text-[14px] leading-snug text-ink-2">{t('reg.rate.detail', { province: t(`prov.${province}`) })}</p>
                {rate.pst != null ? (
                  <p className="m-0 text-[14px] leading-snug text-ink-3">
                    {province === 'QC' ? t('reg.rate.qst', { rate: fmt.number(rate.pst) }) : t('reg.rate.pst', { province: t(`prov.${province}`), rate: fmt.number(rate.pst) })}
                  </p>
                ) : null}
                {rate.bnWithProvince ? <p className="m-0 text-[13.5px] leading-snug text-ink-3">{t('reg.bnProvince', { province: t(`prov.${province}`) })}</p> : null}
              </div>
            ) : null}
            {/* The rate follows the sale; who you register with follows the business. Asked, never assumed from the rate. */}
            {province === 'QC' || inQuebec ? (
              <div className="mt-3 grid gap-1.5">
                <Notice tone="info">{t(inQuebec ? 'reg.quebec.located' : 'reg.quebec')}</Notice>
                <Toggle label={t('reg.quebec.toggle')} checked={inQuebec} onChange={setInQuebec} />
              </div>
            ) : null}
          </div>
        </Disclosure>
      </div>
    </WidgetShell>
  );
}
