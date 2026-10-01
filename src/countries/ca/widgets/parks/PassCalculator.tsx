'use client';
/**
 * Discovery Pass vs daily admission: party + days + fee tier → the cheaper option, the break-even day and a
 * small chart of both costs, plus who gets in free.
 */
import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Badge, ExternalLink, LinkButton, LiveRegion, Notice, NumberTicker, Segmented, Slider, Stat, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { BreakEvenChart } from './BreakEvenChart';
import { DISCOVERY, FAMILY_MAX, STRONG_PASS, TIERS, TIER_KEYS, parkById, type Tier } from './data';
import { URLS, parkUrls } from './urls';
import { useDateText, useFooterSources, useLang } from './hooks';
import messages from './messages';
import { MAX_DAYS, normalizeParty, passCalc, type Mix, type Party, type PassesOutput } from './pass-model';
import { PartyCounter } from './PartyCounter';

export default function PassCalculator({ data }: { data: PassesOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const footerSources = useFooterSources(data.sources);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'always' });
  const date = useDateText();
  const [party, setParty] = useState<Party>(data.party);
  const [days, setDays] = useState(data.days);
  const [tier, setTier] = useState<Tier>(data.tier);
  const calc = passCalc(party, days, tier);
  const park = data.park;
  const f = TIERS[tier];
  const set = (k: keyof Party, v: number) => setParty((p) => normalizeParty({ ...p, [k]: v }));
  const paying = party.adults + party.seniors;
  // "1 family/group pass + 1 senior pass" and "1 family/group rate + 1 senior" from the cheapest split.
  const mixList = (m: Mix, kind: 'pass' | 'day') =>
    [
      m.family ? t(`${kind}.nFamily`, { count: m.family }) : '',
      m.adults ? t(kind === 'pass' ? 'pass.nAdult' : 'day.nAdult', { count: m.adults }) : '',
      m.seniors ? t(kind === 'pass' ? 'pass.nSenior' : 'day.nSenior', { count: m.seniors }) : '',
    ]
      .filter(Boolean)
      .join(' + ');
  const onlyFamily = (m: Mix) => m.family === 1 && !m.adults && !m.seniors;
  // The park name only describes the tier it came with; once the person picks another fee, name that tier.
  const subtitle = park && tier === data.tier ? t('pass.subPark', { park: park.short }) : t('pass.subTier', { parks: t(`tier.${tier}`) });
  // The primary action follows the verdict: buy the pass, read the daily fees (the named park's own page while
  // its fee is the one selected), or the free-admission rules. Paying daily keeps the pass as a quiet second link.
  const namedPark = tier === data.tier ? parkById(park?.id) : undefined;
  const feesPage = namedPark ? parkUrls(namedPark, lang).fees : null;
  const handoff =
    calc.recommend === 'free'
      ? { href: URLS.youth[lang], label: t('handoff.free'), note: t('handoff.freeNote') }
      : calc.recommend === 'daily'
        ? {
            href: feesPage ?? URLS.feesByPlace[lang],
            label: t('handoff.daily'),
            note: feesPage && park ? t('handoff.dailyNotePark', { park: park.short }) : t('handoff.dailyNote'),
          }
        : { href: URLS.buyDiscovery[lang], label: t('handoff.buy'), note: t('handoff.buyNote') };

  const verdict =
    calc.recommend === 'free'
      ? { title: t('pass.v.free'), sub: t('pass.v.freeSub') }
      : calc.recommend === 'pass'
        ? { title: t('pass.v.pass', { amount: fmt.money(calc.savings), who: party.adults + party.seniors + party.youth <= 1 ? 'you' : data.family ? 'family' : 'group' }), sub: t('pass.v.passSub', { day: calc.breakEven ?? 0 }) }
        : { title: t('pass.v.daily', { amount: fmt.money(-calc.savings) }), sub: t('pass.v.dailySub', { day: calc.breakEven ?? 0, days }) };
  const headline = calc.recommend === 'pass' && calc.savings === 0 ? t('pass.v.even') : verdict.title;

  return (
    <WidgetShell
      icon={Ticket}
      tone="maple"
      title={t('pass.title')}
      subtitle={subtitle}
      badge={<Badge mono><bdi>{t('pass.badge', { price: money(DISCOVERY.adult) })}</bdi></Badge>}
      sources={footerSources}
      handoff={handoff}
      secondaryAction={
        calc.recommend === 'daily' ? (
          <LinkButton href={URLS.buyDiscovery[lang]} external variant="quiet" className="max-sm:w-full">
            {t('handoff.buyInstead')}
          </LinkButton>
        ) : undefined
      }
      className="@container"
    >
      <div
        className={cn(
          'mx-5 rounded-card border px-4 py-5 sm:mx-6 sm:px-5',
          calc.recommend === 'daily' ? 'border-hair bg-paper-2/70' : 'border-pine/15 bg-[linear-gradient(135deg,var(--pine-wash),var(--glacier-wash))]',
        )}
      >
        <p className="m-0 text-balance font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{headline}</p>
        <p className="m-0 mt-1.5 text-[15px] text-ink-2">{verdict.sub}</p>
        {calc.overFamilyLimit && paying > 0 ? (
          <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">{t('pass.v.overFamily', { vehicles: calc.vehicles, max: FAMILY_MAX, list: mixList(calc.passMix, 'pass') })}</p>
        ) : null}
      </div>

      {/* One announcement per change, once it settles: the group as it now stands (the steppers themselves are
          silent), then the verdict. */}
      <LiveRegion text={`${t('pass.sr.group', party)} ${headline}. ${verdict.sub}`} />

      {paying > 0 ? <BreakEvenChart dayCost={calc.dayCost} passCost={calc.passCost} days={days} breakEven={calc.breakEven} /> : null}

      <WidgetSection title={t('pass.group')}>
        <div className="divide-y divide-hair overflow-hidden rounded-tile border border-hair bg-card">
          <PartyCounter label={t('pass.adults')} hint={t('pass.adultsHint')} value={party.adults} onChange={(v) => set('adults', v)} />
          <PartyCounter label={t('pass.seniors')} hint={t('pass.seniorsHint')} value={party.seniors} onChange={(v) => set('seniors', v)} />
          <PartyCounter label={t('pass.youth')} hint={t('pass.youthHint')} value={party.youth} onChange={(v) => set('youth', v)} free />
        </div>
        {paying > 0 ? <Plan days={days} setDays={setDays} tier={tier} setTier={setTier} /> : <p className="m-0 mt-3 text-[14px] leading-snug text-ink-2">{t('pass.freeHint')}</p>}
      </WidgetSection>

      {paying > 0 ? (
        <WidgetSection title={t('pass.compare')}>
          <div className="grid gap-2.5 @xl:grid-cols-2">
            <Stat
              label={t('pass.stat.pass')}
              value={<NumberTicker value={calc.passCost} format={(n) => money(n)} />}
              note={onlyFamily(calc.passMix) ? t('pass.stat.passFamily', { max: FAMILY_MAX }) : t('pass.stat.passEach', { list: mixList(calc.passMix, 'pass') })}
              tone={calc.recommend === 'pass' ? 'ok' : undefined}
            />
            <Stat
              label={t('pass.stat.daily', { count: days })}
              value={<NumberTicker value={calc.dailyTotal} format={(n) => money(n)} />}
              note={
                onlyFamily(calc.dayMix)
                  ? t('pass.stat.dailyFamily', { day: money(calc.dayCost), count: days })
                  : calc.dayUsesFamily
                    ? t('pass.stat.dailyMix', { day: money(calc.dayCost), count: days, list: mixList(calc.dayMix, 'day') })
                    : t('pass.stat.dailyEach', { day: money(calc.dayCost), count: days })
              }
              tone={calc.recommend === 'daily' ? 'ok' : undefined}
            />
          </div>
          <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">
            {t('pass.fees', { adult: money(f.adult), senior: money(f.senior), family: money(f.family), max: FAMILY_MAX })}{' '}
            {t('pass.passPrices', { adult: money(DISCOVERY.adult), senior: money(DISCOVERY.senior), family: money(DISCOVERY.family) })}
          </p>
        </WidgetSection>
      ) : null}

      <WidgetSection title={t('free.title')}>
        <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2">
          {(
            [
              ['youth', URLS.youth[lang]],
              ['newcomers', URLS.newcomers[lang]],
              ['support', URLS.support[lang]],
              ['forces', URLS.forces[lang]],
            ] as const
          ).map(([k, href]) => (
            <li key={k} className="relative flex min-h-11 flex-col rounded-field border border-hair px-3.5 py-3 transition-colors hover:border-hair-2 hover:bg-paper-2/60">
              {/* The title is the link (with the new-tab arrow); it stretches over the whole card. */}
              <ExternalLink href={href} className="static py-0 text-[14.5px] font-semibold leading-snug no-underline after:absolute after:inset-0 after:rounded-field">
                {t(`free.${k}.title`)}
              </ExternalLink>
              <span className="mt-0.5 text-[13px] leading-snug text-ink-2">{t(`free.${k}.body`)}</span>
            </li>
          ))}
        </ul>
        <Notice tone="info" className="mt-3" title={t('strong.title', { date: date(STRONG_PASS.ended, { month: 'long', day: 'numeric', year: 'numeric' }) })}>
          {t('strong.body', { date: date(STRONG_PASS.regularFrom, { month: 'long', day: 'numeric' }) })}
          <span className="mt-1.5 block">
            {t('strong.extended')}{' '}
            <ExternalLink href={URLS.passCalculator[lang]}>{t('strong.calculator')}</ExternalLink>
          </span>
        </Notice>
      </WidgetSection>
    </WidgetShell>
  );
}

/** The two inputs that only matter when someone pays: park days in the year and the daily fee where they're going. */
/** A tier as the choice control's option value, and back. */
const TIER_VALUE = { 1: '1', 2: '2', 3: '3' } as const satisfies Record<Tier, string>;
const TIER_OF = { '1': 1, '2': 2, '3': 3 } as const satisfies Record<string, Tier>;

function Plan({ days, setDays, tier, setTier }: { days: number; setDays: (n: number) => void; tier: Tier; setTier: (t: Tier) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <>
      <Slider
        className="mt-5"
        label={t('pass.days')}
        min={1}
        max={MAX_DAYS}
        value={days}
        onChange={setDays}
        // First-strong isolate: "8 days" keeps its order in right-to-left layouts.
        format={(n) => `⁨${t('pass.daysValue', { count: n })}⁩`}
      />
      <div className="mt-5">
        <p className="m-0 mb-2 text-[14px] font-medium text-ink">{t('pass.where')}</p>
        <Segmented
          label={t('pass.where')}
          value={TIER_VALUE[tier]}
          onChange={(v) => setTier(TIER_OF[v])}
          options={TIER_KEYS.map((k) => ({
            value: TIER_VALUE[k],
            label: fmt.money(TIERS[k].adult, { cents: 'always' }),
            // One line on every width so the three prices share a baseline: one park on phones, two on wider.
            sub: (
              <>
                <span className="whitespace-nowrap @xl:hidden">{t(`tier.${k}.short`)}</span>
                <span className="hidden whitespace-nowrap @xl:inline">{t(`tier.${k}`)}</span>
              </>
            ),
          }))}
        />
      </div>
    </>
  );
}
