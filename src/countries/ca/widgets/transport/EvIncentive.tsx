'use client';
/**
 * EV incentive (transportEvIncentive): the federal Electric Vehicle Affordability Program. Incentive calculator
 * (fuel, price, made in Canada, buy or lease), remaining funding, the yearly step-down and a search of
 * Transport Canada's official vehicle list — all recalculated on the device.
 */
import { useMemo, useState } from 'react';
import { BatteryCharging, Check, CircleAlert, PlugZap, Search } from 'lucide-react';
import { Mark } from '../../brand/Mark';
import { Badge, ExternalLink, Field, Input, LiveRegion, NumberTicker, Segmented, Slider, Toggle, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { EVAP, OFFICIAL } from './constants';
import { evapIncentive, groupModels, searchEv, type EvInput, type EvOutput, type Fuel } from './ev';
import { Hero, HeroStatus, say } from './hero';
import messages from './messages';
import { SLOT, iso, ordinals, rich, useDay } from './shared';
import { ToolSkeleton } from './skeleton';

const SHOW = 6;

type Model = ReturnType<typeof groupModels>[number];
const keyOf = (m: Pick<Model, 'make' | 'model'>) => `${m.make}|${m.model.toLowerCase()}`;
/** The model the question was about: the tool's search matched exactly one, and the calculator starts on its type. */
function askedModel(data: EvOutput): Model | null {
  const found = groupModels(data.vehicles, data.matches);
  return found.length === 1 && found[0].fuel === data.fuel ? found[0] : null;
}

export function EvIncentive({ part }: WidgetProps<EvInput, EvOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('ev.error.title')} message={t('ev.error.body')} fallback={{ href: OFFICIAL.ev[locale === 'fr' ? 'fr' : 'en'], label: t('ev.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ToolSkeleton title={t('ev.title')} subtitle={t('ev.subtitle')} icon={PlugZap} tone="pine" label={t('ev.loading')} blocks={['hero', 'chips', 'slider', 'bars', 'note', 'field', 'grid6', 'actions', 'footer']} />;
  }
  return <Calc data={part.output} />;
}

function Calc({ data }: { data: EvOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const day = useDay();
  // The reader's own date: an answer reopened next year shows that year's incentive level, not the one it was asked in.
  const today = useToday(data.today);
  const [fuel, setFuel] = useState<Fuel>(data.fuel);
  const [mode, setMode] = useState<'buy' | 'lease'>(data.leaseMonths > 0 ? 'lease' : 'buy');
  const [months, setMonths] = useState(data.leaseMonths > 0 ? data.leaseMonths : 36);
  const [price, setPrice] = useState(data.price ?? 45_000);
  const [ca, setCa] = useState(data.canadianMade);
  // The model picked from the official list (or asked about). Changing its type or origin by hand lets go of it.
  const [picked, setPicked] = useState<Model | null>(() => askedModel(data));
  const pickFuel = (f: Fuel) => {
    setFuel(f);
    if (picked && picked.fuel !== f) setPicked(null);
  };
  const pickCa = (v: boolean) => {
    setCa(v);
    if (picked && picked.ca !== v) setPicked(null);
  };
  const pickModel = (m: Model) => {
    setPicked(m);
    setFuel(m.fuel);
    setCa(m.ca);
  };
  const r = evapIncentive({ fuel, price, canadianMade: ca, leaseMonths: mode === 'lease' ? months : 0, date: today });
  const money = (n: number) => fmt.money(Math.round(n), { cents: 'never' });
  const year = Number(today.slice(0, 4));
  // Bars are scaled to the selected fuel's own first-year amount, so plug-in hybrids fill the chart too.
  const peak = Math.max(1, ...data.levels.map((l) => (fuel === 'PHEV' ? l.phev : l.zev)));
  const fundsPct = Math.max(0, Math.min(1, data.funds.remaining / data.funds.total));
  const reason = r.reasons[0] ?? 'price';
  const sub = r.eligible
    ? t(mode === 'lease' && months < 48 ? 'ev.hero.subLease' : 'ev.hero.sub', { fuel: t(`ev.fuel.${fuel}.lower`), months: fmt.number(months), full: money(r.full), year: String(year) })
    : t(`ev.hero.no.${reason}.sub`, { cap: money(EVAP.cap) });
  const pickedName = picked ? `${picked.make} ${picked.model}` : '';
  const pickedLine = picked ? t(picked.ca ? 'ev.hero.pickedCa' : 'ev.hero.picked', { name: SLOT, fuel: t(`ev.fuel.${picked.fuel}.lower`) }) : null;
  // Six bars share a phone's width: there the amounts are compact ("$2.5K" / "2,5 k $"); from `@md` they are exact.
  const compact = (n: number) => fmt.money(n, { compact: true });
  const big = (n: number) =>
    n >= 1e9 ? t('ev.billions', { n: fmt.number(n / 1e9, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) }) : t('ev.millions', { n: fmt.number(Math.round(n / 1e6)) });

  return (
    <WidgetShell
      icon={PlugZap}
      tone="pine"
      title={t('ev.title')}
      subtitle={t('ev.subtitle')}
      badge={data.listLive || data.funds.live ? <Badge tone="live">{t('common.live')}</Badge> : <Badge tone="warn">{t('common.offline')}</Badge>}
      sources={data.sources}
      handoff={{ href: data.links.overview, label: t('ev.handoff'), note: t('ev.handoffNote') }}
      footnote={t('ev.footnote')}
      className="@container"
    >
      <Hero
        tone={r.eligible ? 'ok' : 'warn'}
        icon={r.eligible ? Check : CircleAlert}
        title={
          r.eligible ? (
            <>
              <NumberTicker value={r.amount} format={money} />{' '}
              <span className="text-ink-2">{t('ev.hero.off')}</span>
            </>
          ) : (
            t(`ev.hero.no.${reason}`)
          )
        }
        sub={sub}
        announce={say(r.eligible ? `${money(r.amount)} ${t('ev.hero.off')}` : t(`ev.hero.no.${reason}`), sub, pickedLine?.replace(SLOT, pickedName))}
      >
        {pickedLine ? (
          <p className="m-0 mt-2.5 text-pretty text-[13.5px] leading-snug text-ink-2">{rich(pickedLine, <bdi className="font-semibold text-ink">{pickedName}</bdi>)}</p>
        ) : null}
        {data.listLive || data.funds.live ? <HeroStatus>{t('ev.status.live', { what: data.listLive && data.funds.live ? 'both' : data.listLive ? 'list' : 'funds' })}</HeroStatus> : <HeroStatus tone="warn">{t('common.offline')}</HeroStatus>}
      </Hero>

      <WidgetSection title={t('ev.calc.title')}>
        <Segmented
          label={t('ev.fuel')}
          value={fuel}
          onChange={pickFuel}
          options={(['BEV', 'PHEV', 'FCEV'] as Fuel[]).map((f) => ({
            value: f,
            // One line on phones: the plug-in hybrid label shortens below @md (the hero names it in full).
            label:
              f === 'PHEV' ? (
                <>
                  <span className="@md:hidden">{t('ev.fuel.PHEV.seg')}</span>
                  <span className="hidden @md:inline">{t('ev.fuel.PHEV')}</span>
                </>
              ) : (
                t(`ev.fuel.${f}`)
              ),
            sub: money(f === 'PHEV' ? data.levels[0].phev : data.levels[0].zev),
          }))}
        />
        {/* Two balanced rows: the choices side by side, then the sliders (price alone spans the row when buying). */}
        <div className="mt-4 grid items-start gap-4 @xl:grid-cols-2">
          <Segmented
            label={t('ev.mode')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'buy', label: t('ev.mode.buy') },
              { value: 'lease', label: t('ev.mode.lease') },
            ]}
          />
          <Toggle label={t('ev.ca')} description={t('ev.ca.sub')} checked={ca} onChange={pickCa} />
        </div>
        <div className={cn('mt-4 grid items-start gap-4', mode === 'lease' && '@xl:grid-cols-2')}>
          <Slider label={t('ev.price')} min={20_000} max={90_000} step={500} value={price} onChange={setPrice} format={money} />
          {mode === 'lease' ? (
            <Slider label={t('ev.lease')} min={12} max={60} step={1} value={months} onChange={setMonths} format={(n) => iso(t('ev.leaseValue', { count: n }))} />
          ) : null}
        </div>
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('ev.calc.note')}</p>
      </WidgetSection>

      <WidgetSection title={t('ev.years.title')}>
        <ol className="m-0 grid list-none grid-cols-6 items-end gap-1 p-0 @md:gap-2" aria-label={t('ev.years.title')}>
          {data.levels.map((l) => {
            const v = fuel === 'PHEV' ? l.phev : l.zev;
            const now = l.year === year;
            return (
              <li key={l.year} className="flex flex-col items-center gap-1.5">
                {/* The amount keeps its currency sign at every width. Sans (narrower than mono) so "2,5 k $" fits a phone's column. */}
                <span className={cn('whitespace-nowrap text-[11.5px] tabular-nums @md:font-mono @md:text-[12px]', now ? 'font-semibold text-ink' : 'text-ink-2')}>
                  <span className="@md:hidden">{compact(v)}</span>
                  <span className="hidden @md:inline">{money(v)}</span>
                </span>
                {/* A full-height bar slid down inside a clipped slot: only its transform changes when the amounts do. */}
                <span className="flex h-[72px] w-full justify-center">
                  <span className="block h-full w-[70%] max-w-9 overflow-hidden rounded-b-[3px]">
                    <span
                      className={cn('block size-full rounded-t-[7px] transition-transform duration-300 motion-reduce:transition-none', now ? 'bg-pine' : 'bg-pine/25')}
                      style={{ transform: `translateY(${72 - Math.max(4, (v / peak) * 72)}px)` }}
                    />
                  </span>
                </span>
                <span className={cn('font-mono text-[11.5px] tabular-nums', now ? 'font-semibold text-ink' : 'text-ink-3')}>
                  <bdi dir="ltr">{l.year}</bdi>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="sr-only">{data.levels.map((l) => `${l.year}: ${money(fuel === 'PHEV' ? l.phev : l.zev)}`).join(', ')}</p>
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('ev.years.note')}</p>
      </WidgetSection>

      <WidgetSection title={t('ev.funds.title')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="m-0 font-serif text-[28px] leading-none tracking-[-.02em] text-ink">{t('ev.funds.left', { amount: big(data.funds.remaining) })}</p>
          <p className="m-0 font-mono text-[12px] text-ink-3">{ordinals(t('ev.funds.of', { total: big(data.funds.total), date: day(data.funds.asOf, { month: 'short', day: 'numeric', year: 'numeric' }) }))}</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          <span className="block h-full rounded-full bg-[linear-gradient(90deg,var(--pine),var(--glacier))]" style={{ width: `${fundsPct * 100}%` }} />
        </div>
        <p className="m-0 mt-2 text-[13px] text-ink-3">{t('ev.funds.note', { pct: fmt.number(Math.round(fundsPct * 100)) })}</p>
      </WidgetSection>

      <VehicleSearch data={data} fuel={fuel} picked={picked ? keyOf(picked) : null} onPick={pickModel} />
    </WidgetShell>
  );
}

function VehicleSearch({ data, fuel, picked, onPick }: { data: EvOutput; fuel: Fuel; picked: string | null; onPick: (m: Model) => void }) {
  const t = useMessages(messages);
  const [q, setQ] = useState(data.query ?? '');
  const [all, setAll] = useState(false);
  const idx = useMemo(() => (q.trim() ? searchEv(data.vehicles, q) : undefined), [q, data.vehicles]);
  const found = useMemo(() => groupModels(data.vehicles, idx), [data.vehicles, idx]);
  const searching = q.trim() !== '';
  // Browsing (no search): models of the type set in the calculator come first; each type keeps the list's own order.
  const groups = searching ? found : [...found.filter((g) => g.fuel === fuel), ...found.filter((g) => g.fuel !== fuel)];
  const shown = all ? groups : groups.slice(0, SHOW);
  return (
    <WidgetSection
      title={t('ev.list.title')}
      aside={<span className="shrink-0 whitespace-nowrap font-mono text-[12px] text-ink-3">{t('ev.list.count', { count: data.vehicles.length })}</span>}
    >
      <Field label={t('ev.list.search')}>
        {(p) => (
          <span className="relative block">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input {...p} type="search" value={q} onChange={(e) => (setQ(e.target.value.slice(0, 40)), setAll(false))} placeholder={t('ev.list.placeholder')} className="ps-10" />
          </span>
        )}
      </Field>
      <p className="m-0 mt-2 text-[13px] text-ink-3">{searching ? t('ev.list.results', { count: groups.length }) : t('ev.list.hint')}</p>
      <LiveRegion text={searching ? t('ev.list.results', { count: groups.length }) : ''} />
      {groups.length ? (
        <ul className="m-0 mt-3 grid list-none gap-2 p-0 @xl:grid-cols-2 @xl:[&>li:only-child]:col-span-2">
          {shown.map((g) => {
            const on = keyOf(g) === picked;
            return (
              <li key={keyOf(g)}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(g)}
                  className={cn(
                    'flex min-h-[60px] w-full items-center gap-3 rounded-[14px] border bg-card px-3.5 py-2.5 text-start transition-[border-color,box-shadow] duration-200',
                    on ? 'border-ink shadow-sm' : 'border-hair hover:border-hair-2',
                  )}
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', g.fuel === 'PHEV' ? 'bg-glacier-wash text-glacier' : 'bg-pine-wash text-pine')} aria-hidden>
                    {g.fuel === 'PHEV' ? <PlugZap className="size-[18px]" strokeWidth={1.9} /> : <BatteryCharging className="size-[18px]" strokeWidth={1.9} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug text-ink">
                      {g.make} {g.model}
                    </span>
                    <span className="block text-[12.5px] leading-snug text-ink-3">
                      <bdi dir="ltr">{g.years.join(' · ')}</bdi> · {t('ev.list.trims', { count: g.trims.length || 1 })} · {t(`ev.fuel.${g.fuel}.short`)}
                    </span>
                    {g.ca ? (
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-chip bg-maple-wash px-2 py-0.5 text-[12px] font-medium text-maple-ink">
                        <Mark className="size-3 text-maple" />
                        {t('ev.list.ca')}
                      </span>
                    ) : null}
                  </span>
                  {on ? <Check className="size-[18px] shrink-0 text-ink" strokeWidth={2.4} aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 mt-3 rounded-tile bg-paper-2 px-4 py-3 text-[14px] leading-snug text-ink-2">{t('ev.list.none')}</p>
      )}
      {groups.length > SHOW ? (
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-2 min-h-11 rounded-full px-2 text-[14px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink">
          {all ? t('ev.list.less') : t('ev.list.more', { count: groups.length - SHOW })}
        </button>
      ) : null}
      <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">
        {t('ev.list.note')}{' '}
        <ExternalLink href={data.links.list}>
          {t('ev.list.official')}
        </ExternalLink>
      </p>
    </WidgetSection>
  );
}
