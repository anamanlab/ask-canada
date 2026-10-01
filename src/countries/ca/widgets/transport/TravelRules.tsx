'use client';
/**
 * Travelling with cannabis or a pet (transportTravelRules): a verdict per kind of trip, what to do, and for cannabis
 * the public-possession calculator (30 g of dried cannabis or its equivalent).
 */
import { useId, useState, type CSSProperties } from 'react';
import { Ban, Cannabis, Car, Cat, Check, CircleAlert, Dog, LogIn, LogOut, Luggage, PawPrint, Plane, Stethoscope } from 'lucide-react';
import { ExternalLink, Field, LiveRegion, Notice, NumberInput, Select, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { ChoiceGrid } from './choice-grid';
import { OFFICIAL } from './constants';
import { Hero, say } from './hero';
import messages from './messages';
import { Bullets, ordinals } from './shared';
import { ToolSkeleton } from './skeleton';
import { CANNABIS_LIMIT_G, FORMS, TRIPS, cannabisAllowed, driedEquivalent, maxOf, needsRabiesCert, type CannabisForm, type Pet, type TravelInput, type TravelOutput, type Trip } from './travel';

export function TravelRules({ part }: WidgetProps<TravelInput, TravelOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const pets = part.input?.topic === 'pets' || part.output?.topic === 'pets';
  if (part.state === 'output-error') {
    const l = locale === 'fr' ? 'fr' : 'en';
    return <WidgetError title={t('travel.error.title')} message={t('travel.error.body')} fallback={{ href: pets ? OFFICIAL.pets[l] : OFFICIAL.cannabisBorder[l], label: t('travel.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    const { trip, pet, petAgeMonths } = part.input ?? {};
    const vetNotice = (!trip || trip === 'entering-canada') && needsRabiesCert(pet ?? 'dog', petAgeMonths ?? null);
    return (
      <ToolSkeleton
        title={pets ? t('travel.pets.title') : t('travel.cannabis.title')}
        subtitle={t('travel.subtitle')}
        icon={pets ? PawPrint : Cannabis}
        tone={pets ? 'amber' : 'pine'}
        label={t('travel.loading')}
        // The same blocks as the answer: pickers, verdict, three points, then the vet notice (pets entering Canada, the
        // default trip), the calculator (cannabis within Canada, the default) or the medical notice (across the border).
        blocks={
          pets
            ? ['kinds3', 'trips4', 'heroShort', 'bulletsLong', ...(vetNotice ? (['notice'] as const) : []), 'action1', 'footerWrap']
            : ['trips4', 'heroShort', 'bullets', !trip || cannabisAllowed(trip) ? 'calc' : 'notice', 'action1', 'footer2']
        }
      />
    );
  }
  return part.output.topic === 'pets' ? <Pets data={part.output} /> : <CannabisRules data={part.output} />;
}

const TRIP_ICON = { 'domestic-flight': Plane, 'domestic-road': Car, 'entering-canada': LogIn, 'leaving-canada': LogOut } as const;

/**
 * Four trips on one row at every width. On a phone each card stacks its icon over a one-word label ("Flight",
 * « Entrée »); the full label ("Flight in Canada") is the accessible name and returns in a wide column.
 */
function TripPicker({ value, onChange }: { value: Trip; onChange: (t: Trip) => void }) {
  const t = useMessages(messages);
  return (
    <ChoiceGrid
      label={t('travel.trip')}
      value={value}
      onChange={onChange}
      stack
      className="grid-cols-4"
      options={TRIPS.map((k) => ({
        value: k,
        icon: TRIP_ICON[k],
        srLabel: t(`travel.trip.${k}`),
        label: (
          <>
            <span className="@xl:hidden">{t(`travel.trip.${k}.short`)}</span>
            {/* Narrow enough that every label breaks before the country ("Flight in / Canada", « Vol au / Canada »): four matching two-line cards in either language. */}
            <span className="hidden max-w-[5.5em] text-balance @xl:block">{t(`travel.trip.${k}`)}</span>
          </>
        ),
      }))}
    />
  );
}

/* ───────────────────────── Cannabis ───────────────────────── */

function CannabisRules({ data }: { data: TravelOutput }) {
  const t = useMessages(messages);
  const [trip, setTrip] = useState<Trip>(data.trip);
  // The calculator's inputs live here, so the verdict above it is computed in the same render as the meter.
  const [form, setForm] = useState<CannabisForm>('solids');
  const [amount, setAmount] = useState<number | undefined>(100);
  const eq = driedEquivalent(form, amount ?? 0);
  const pct = eq / CANNABIS_LIMIT_G;
  const ok = cannabisAllowed(trip);
  const over = ok && pct > 1;
  const title = over ? t('travel.cannabis.over') : t(`travel.cannabis.${trip}`);
  const sub = over ? t('travel.cannabis.over.sub') : t(`travel.cannabis.${trip}.sub`);
  // Seeds are counted, not weighed: a typed "2.5" becomes 3 seeds when the form switches.
  const pickForm = (f: CannabisForm) => {
    setForm(f);
    if (f === 'seeds' && amount != null) setAmount(Math.round(amount));
  };
  // The handoff follows the trip: Health Canada's possession limit on the road, CATSA's screening rules on a plane, CBSA at the border.
  const handoff =
    trip === 'domestic-road'
      ? { href: data.links.limit, label: t('travel.cannabis.handoffRoad'), note: t('travel.cannabis.handoffRoadNote') }
      : ok
        ? { href: data.links.flights, label: t('travel.cannabis.handoffOk'), note: t('travel.cannabis.handoffOkNote') }
        : { href: data.links.border, label: t('travel.cannabis.handoffNo'), note: t('travel.cannabis.handoffNoNote') };
  return (
    <WidgetShell
      icon={Cannabis}
      tone="pine"
      title={t('travel.cannabis.title')}
      subtitle={t('travel.subtitle')}
      sources={data.sourcesByTrip?.[trip] ?? data.sources}
      handoff={handoff}
      className="@container"
    >
      <div className="px-5 pb-4 sm:px-6">
        <TripPicker value={trip} onChange={setTrip} />
      </div>
      <Hero
        tone={over ? 'warn' : ok ? 'ok' : 'danger'}
        icon={over ? CircleAlert : ok ? Check : Ban}
        title={title}
        sub={sub}
        announce={say(title, sub)}
      />
      <WidgetSection title={t('travel.what')}>
        <Bullets items={[1, 2, 3].map((n) => t(`travel.cannabis.${trip}.${n}`))} />
        {!ok ? (
          <Notice tone="danger" className="mt-3" title={t('travel.cannabis.medical.title')}>
            {t('travel.cannabis.medical.body')}
          </Notice>
        ) : null}
      </WidgetSection>
      {ok ? <Calculator form={form} onForm={pickForm} amount={amount} onAmount={setAmount} eq={eq} pct={pct} /> : null}
    </WidgetShell>
  );
}

/** The largest amount the field reports (far past any limit; keeps the meter's numbers readable). */
const MAX_AMOUNT = 99_999;

/** Controlled by CannabisRules: the verdict above and the meter here are computed from the same inputs in one render. */
type CalcProps = { form: CannabisForm; onForm: (f: CannabisForm) => void; amount: number | undefined; onAmount: (n: number | undefined) => void; eq: number; pct: number };

function Calculator({ form, onForm, amount, onAmount, eq, pct }: CalcProps) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const over = pct > 1;
  // Health Canada's equivalents are all in grams, beverages included (570 g = 1 g dried).
  const unit = form === 'seeds' ? 'seeds' : 'g';
  const hintId = useId();
  const n1 = (n: number) => fmt.number(n, { maximumFractionDigits: n < 10 ? 2 : 1 });
  const equiv = t('travel.calc.equiv', { g: n1(eq) });
  const share = t(over ? 'travel.calc.over' : 'travel.calc.under', { pct: fmt.number(Math.round(pct * 100)) });
  return (
    <WidgetSection title={t('travel.calc.title')}>
      {/* Bottom-aligned: the two fields come from different primitives, so their boxes share a line whatever the labels do. */}
      <div className="grid items-end gap-3 @md:grid-cols-[1.4fr_1fr]">
        <Field label={t('travel.calc.form')} className="[&>label]:leading-snug">
          {(p) => (
            <Select {...p} aria-describedby={hintId} value={form} onChange={(e) => onForm(e.target.value as CannabisForm)} options={FORMS.map((f) => ({ value: f, label: t(`travel.form.${f}`) }))} />
          )}
        </Field>
        <NumberInput label={t(`travel.calc.amount.${unit}`)} value={amount} onChange={onAmount} min={0} max={MAX_AMOUNT} decimals={unit === 'seeds' ? 0 : 2} />
      </div>
      <p id={hintId} className="m-0 mt-2 text-[13px] leading-snug text-ink-3">
        {t('travel.calc.formHint')}
      </p>
      {/* Each value sits in a <bdi>: in an RTL page "6.67 g", "22%" and "450 g" keep the number before its unit. */}
      <div className="mt-4 rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <bdi className="whitespace-nowrap font-serif text-[28px] leading-none tracking-[-.02em] text-ink">{equiv}</bdi>
            <span className="text-[14px] text-ink-2">{t('travel.calc.equivLabel')}</span>
          </p>
          <p className={cn('m-0 font-mono text-[12.5px] font-medium', over ? 'text-maple-ink' : 'text-pine')}>
            <bdi>{share}</bdi>
          </p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-card" aria-hidden>
          {/* A full-width fill slid in from the start edge (transform only); the track clips the rest. */}
          <span
            className={cn(
              'block size-full rounded-full transition-transform duration-300 [transform:translateX(calc(var(--fill)_-_100%))] motion-reduce:transition-none rtl:[transform:translateX(calc(100%_-_var(--fill)))]',
              over ? 'bg-maple' : 'bg-pine',
            )}
            style={{ '--fill': `${Math.min(100, pct * 100)}%` } as CSSProperties}
          />
        </div>
        <p className="m-0 mt-2 text-[13px] text-ink-2">
          <bdi>{t(`travel.calc.max.${unit}`, { max: fmt.number(maxOf(form)) })}</bdi>
        </p>
      </div>
      <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('travel.calc.note')}</p>
      <LiveRegion text={say(`${equiv} ${t('travel.calc.equivLabel')}`, share)} />
    </WidgetSection>
  );
}

/* ───────────────────────── Pets ───────────────────────── */

function Pets({ data }: { data: TravelOutput }) {
  const t = useMessages(messages);
  const [trip, setTrip] = useState<Trip>(data.trip);
  const [pet, setPet] = useState<Pet>(data.pet);
  const young = data.petAgeMonths != null && data.petAgeMonths < 3;
  const cert = trip === 'entering-canada' && needsRabiesCert(pet, data.petAgeMonths);
  const key = trip === 'entering-canada' ? (pet === 'other' ? 'entering-other' : young ? 'entering-young' : 'entering') : trip;
  const tone = trip === 'entering-canada' || trip === 'leaving-canada' ? 'info' : 'ok';
  const title = t(`travel.pets.${key}`, { pet: t(`travel.pets.${pet}.lower`) });
  const sub = t(`travel.pets.${key}.sub`, { pet: t(`travel.pets.${pet}.lower`) });
  const handoff =
    trip === 'entering-canada'
      ? { href: data.links.petsImport, label: t('travel.pets.handoffIn'), note: t('travel.pets.handoffInNote') }
      : trip === 'leaving-canada'
        ? { href: data.links.pets, label: t('travel.pets.handoffOut'), note: t('travel.pets.handoffOutNote') }
        : { href: data.links.petsTravel, label: t('travel.pets.handoffHome'), note: t('travel.pets.handoffHomeNote') };
  return (
    <WidgetShell icon={PawPrint} tone="amber" title={t('travel.pets.title')} subtitle={t('travel.subtitle')} sources={data.sources} handoff={handoff} className="@container">
      <div className="grid gap-3 px-5 pb-4 sm:px-6">
        {/* The same cards as the trip below it: one selection idiom for both questions. */}
        <ChoiceGrid
          compact
          label={t('travel.pets.kind')}
          value={pet}
          onChange={setPet}
          className="grid-cols-3"
          options={[
            { value: 'dog', label: t('travel.pets.dog'), icon: Dog },
            { value: 'cat', label: t('travel.pets.cat'), icon: Cat },
            { value: 'other', label: t('travel.pets.other'), icon: PawPrint },
          ]}
        />
        <TripPicker value={trip} onChange={setTrip} />
      </div>
      <Hero
        tone={tone}
        icon={trip === 'domestic-flight' ? Plane : trip === 'domestic-road' ? Luggage : pet === 'cat' ? Cat : pet === 'dog' ? Dog : PawPrint}
        title={title}
        sub={sub}
        announce={say(title, sub)}
      />
      <WidgetSection title={t('travel.what')}>
        <Bullets items={[1, 2, 3].map((n) => t(`travel.pets.${key}.${n}`, { pet: t(`travel.pets.${pet}.lower`) }))} />
        {cert ? (
          <Notice tone="info" icon={Stethoscope} className="mt-3" title={t('travel.pets.cert.title')}>
            {t('travel.pets.cert.body')}
          </Notice>
        ) : null}
        {trip === 'leaving-canada' && pet === 'dog' ? (
          <Notice tone="warn" className="mt-3" title={t('travel.pets.us.title')}>
            {ordinals(t('travel.pets.us.body'))}{' '}
            <ExternalLink href={data.links.petsUs}>
              {t('travel.pets.us.link')}
            </ExternalLink>
          </Notice>
        ) : null}
      </WidgetSection>
    </WidgetShell>
  );
}
