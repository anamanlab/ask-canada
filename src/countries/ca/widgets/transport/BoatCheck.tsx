'use client';
/**
 * Pleasure Craft Operator Card checker (transportBoating): set the operator's age, the engine and the boat type
 * to see who may drive it, the youth horsepower limits on a gauge, and how to get (or replace) the card.
 */
import { useState } from 'react';
import { Anchor, Ban, Check, CreditCard, GraduationCap, Sailboat, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, LinkButton, Segmented, Slider, Toggle, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { boatVerdict, soloLimit, type BoatInput, type BoatOutput } from './boating';
import { OFFICIAL } from './constants';
import { Hero, HeroStatus, say } from './hero';
import messages from './messages';
import { PageLink, TelLink } from './links';
import { Bullets, iso } from './shared';
import { ToolSkeleton } from './skeleton';

const HP_MAX = 300;

export function BoatCheck({ part }: WidgetProps<BoatInput, BoatOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('boat.error.title')} message={t('boat.error.body')} fallback={{ href: OFFICIAL.pcoc[locale === 'fr' ? 'fr' : 'en'], label: t('boat.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    const lost = !!part.input?.lost;
    return (
      <ToolSkeleton
        title={lost ? t('boat.lost.shell') : t('boat.title')}
        subtitle={t('boat.subtitle')}
        icon={Sailboat}
        tone="glacier"
        label={t('boat.loading')}
        blocks={lost ? ['hero', 'steps', 'list', 'actions', 'footer'] : ['hero', 'slider', 'chips', 'tiles3', 'note', 'steps', 'list', 'actions', 'footer']}
      />
    );
  }
  return part.output.lost ? <Replace data={part.output} /> : <Check_ data={part.output} />;
}

/** Replacing a lost or damaged card: only the accredited provider that issued it can, for a fee (PCOC FAQ). */
function Replace({ data }: { data: BoatOutput }) {
  const t = useMessages(messages);
  return (
    <WidgetShell
      icon={Sailboat}
      tone="glacier"
      title={t('boat.lost.shell')}
      subtitle={t('boat.subtitle')}
      badge={<Badge icon={ShieldCheck}>{t('boat.badge')}</Badge>}
      sources={data.sources}
      handoff={{ href: data.links.lookup, label: t('boat.lost.handoff'), note: t('boat.lost.handoffNote') }}
      secondaryAction={
        <LinkButton href={data.links.faq} external variant="secondary" size="lg" className="max-sm:w-full">
          {t('boat.lost.faq')}
        </LinkButton>
      }
      className="@container"
    >
      <Hero tone="info" icon={CreditCard} title={t('boat.lost.title')} sub={t('boat.lost.sub')}>
        <HeroStatus tone="quiet">{t('boat.status')}</HeroStatus>
      </Hero>
      <WidgetSection title={t('boat.lost.steps')}>
        <Steps items={[{ icon: Search, k: 'lost.1' }, { icon: CreditCard, k: 'lost.2' }, { icon: Anchor, k: 'lost.3' }]} />
        <Bullets
          className="mt-4"
          items={[
            <>
              {t('boat.lost.help')} <TelLink number={data.phone} />
            </>,
          ]}
        />
      </WidgetSection>
    </WidgetShell>
  );
}

function Steps({ items }: { items: { icon: typeof Check; k: string }[] }) {
  const t = useMessages(messages);
  return (
    <ol className="m-0 grid list-none gap-3 p-0">
      {items.map(({ icon: Icon, k }) => (
        <li key={k} className="flex gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-glacier-wash text-glacier" aria-hidden>
            <Icon className="size-4" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[15px] font-semibold leading-snug text-ink">{t(`boat.${k}`)}</p>
            <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{t(`boat.${k}.body`)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Check_({ data }: { data: BoatOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [age, setAge] = useState(data.age);
  const [hp, setHp] = useState(data.horsepower);
  const [pwc, setPwc] = useState(data.pwc);
  const [supervised, setSupervised] = useState(data.supervised);
  const [north, setNorth] = useState(data.north);
  const v = boatVerdict({ age, horsepower: hp, pwc, supervised, north });
  const limit = soloLimit(age);
  const tone = v === 'pwc-under16' ? 'danger' : v === 'supervised' ? 'warn' : 'ok';
  const icon = v === 'pwc-under16' ? Ban : v === 'supervised' ? UserRound : Check;
  // Where the slider's thumb centre sits for a value: same linear 0–300 scale, inset by the 24px thumb's half-width.
  const pos = (n: number) => `calc(12px + (100% - 24px) * ${Math.min(n, HP_MAX) / HP_MAX})`;
  const hasLimit = !north && !pwc && limit !== Infinity;
  const over = hasLimit && hp > limit;
  const pwcBanned = !north && pwc && age < 16;
  const kind = pwc ? 'pwc' : 'boat';
  // No age in the question and the slider untouched: the verdict is about the person asking ("you"). Otherwise it
  // names the age ("a 13-year-old"); English needs "an" before 8, 11, 18 and the eighties.
  const who = data.ageKnown || age !== data.age ? 'age' : 'you';
  const an = age === 8 || age === 11 || age === 18 || (age >= 80 && age < 90) ? 'yes' : 'no';
  const title = t(`boat.verdict.${v}`, { age: String(age), hp: fmt.number(hp), kind, who, an });
  const sub = t(`boat.verdict.${v}.sub`, { limit: fmt.number(limit === Infinity ? 0 : limit), kind, age: String(age), an });

  return (
    <WidgetShell
      icon={Sailboat}
      tone="glacier"
      title={t('boat.title')}
      subtitle={t('boat.subtitle')}
      badge={<Badge icon={ShieldCheck}>{t('boat.badge')}</Badge>}
      sources={data.sources}
      handoff={{ href: data.links.providers, label: t('boat.handoff'), note: t('boat.handoffNote') }}
      secondaryAction={
        <LinkButton href={data.links.lookup} external variant="secondary" size="lg" className="max-sm:w-full">
          {t('boat.lost')}
        </LinkButton>
      }
      className="@container"
    >
      <Hero tone={tone} icon={icon} title={title} sub={sub} announce={say(title, sub)}>
        <HeroStatus tone="quiet">{t('boat.status')}</HeroStatus>
      </Hero>

      <WidgetSection title={t('boat.controls')}>
        {/* A wide column gap: the slider's end-aligned value must not read as one run with the next column's label. */}
        <div className="grid items-start gap-4 @xl:grid-cols-2 @xl:gap-x-10">
          <Slider label={t('boat.age')} min={6} max={80} value={age} onChange={setAge} format={(n) => iso(t('boat.ageValue', { count: n }))} />
          {/* The same label row as the slider beside it, so both columns start on one line (the group itself carries the name). */}
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[14px] font-medium leading-[22px] text-ink" aria-hidden>
              {t('boat.kind')}
            </p>
            <Segmented
              label={t('boat.kind')}
              value={kind}
              onChange={(k) => {
                setPwc(k === 'pwc');
                if (k === 'pwc' && hp < 60) setHp(130);
              }}
              options={[
                { value: 'boat', label: t('boat.kind.boat') },
                { value: 'pwc', label: t('boat.kind.pwc') },
              ]}
            />
          </div>
        </div>
        {/* In a narrow card the value (kept whole by no-break spaces) drops under its label instead of splitting. */}
        <Slider
          className="mt-4 [&>div:first-child]:flex-wrap [&>div:first-child]:gap-y-1.5"
          label={t('boat.hp')}
          min={0}
          max={HP_MAX}
          step={hp < 50 ? 1 : 5}
          value={hp}
          onChange={setHp}
          format={(n) => (n === 0 ? t('boat.hpNone') : iso(t('boat.hpValue', { hp: fmt.number(n), kw: fmt.number(Math.round(n * 0.7457 * 10) / 10) })))}
        />
        {/* The youth limit on the slider's own scale: the allowed zone as a filled band right under the track, a tick at the limit. */}
        {hasLimit ? (
          <div className="relative -mt-3 h-6" aria-hidden>
            <span className="absolute start-0 top-0 h-[3px] rounded-full bg-pine/45" style={{ width: pos(limit) }} />
            <span className={cn('absolute -top-[3px] h-[9px] w-[2px] rounded-full ltr:-translate-x-1/2 rtl:translate-x-1/2', over ? 'bg-maple' : 'bg-pine')} style={{ insetInlineStart: pos(limit) }} />
            <span
              className={cn('absolute top-[9px] whitespace-nowrap text-[11.5px] font-semibold leading-none tabular-nums ltr:-translate-x-1/2 rtl:translate-x-1/2', over ? 'text-maple-ink' : 'text-pine')}
              style={{ insetInlineStart: pos(limit) }}
            >
              <bdi>{t('boat.limit.tick', { limit: fmt.number(limit) })}</bdi>
            </span>
          </div>
        ) : null}
        <p className={cn('m-0 mt-1 flex items-center gap-2 text-[13.5px] font-medium', over || pwcBanned ? 'text-maple-ink' : 'text-ink-2')}>
          {north ? t('boat.limit.north') : pwcBanned ? t('boat.limit.pwc') : pwc || limit === Infinity ? t('boat.limit.none', { age }) : <bdi>{t('boat.limit.at', { age, limit: fmt.number(limit) })}</bdi>}
        </p>
        {over && !supervised ? <p className="m-0 mt-0.5 text-[13px] text-ink-3">{t('boat.limit.over')}</p> : null}

        <div className="mt-4 divide-y divide-hair border-t border-hair">
          <div className="py-3">
            <Toggle label={t('boat.supervised')} description={t('boat.supervised.sub')} checked={supervised} onChange={setSupervised} />
          </div>
          <div className="pt-3">
            <Toggle label={t('boat.north')} description={t('boat.north.sub')} checked={north} onChange={setNorth} />
          </div>
        </div>
      </WidgetSection>

      <WidgetSection title={t('boat.rules.title')}>
        {/* In the North the cards are reference only: say so first, and set them back so they don't argue with the verdict. */}
        {north ? <p className="m-0 mb-3 text-[14px] font-medium leading-snug text-ink-2">{t('boat.rules.north')}</p> : null}
        <ul className={cn('m-0 grid list-none gap-2 p-0 transition-opacity @xl:grid-cols-3', north && 'opacity-60')}>
          {(['u12', 'u16', 'pwc'] as const).map((k) => {
            const active = !north && (pwc ? k === 'pwc' && age < 16 : (k === 'u12' && age < 12) || (k === 'u16' && age >= 12 && age < 16));
            return (
              <li key={k} className={cn('rounded-tile border px-4 py-3 transition-colors', active ? 'border-glacier/60 bg-glacier-wash ring-1 ring-glacier/40' : 'border-hair bg-card')}>
                {/* A check, not a text badge: « S’applique » beside the label pushed the French header onto two lines. */}
                <p className="m-0 flex items-center justify-between gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">
                  <bdi>{t(`boat.rules.${k}`)}</bdi>
                  {active ? (
                    <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-glacier text-card">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                      <span className="sr-only">{t('boat.rules.applies')}</span>
                    </span>
                  ) : null}
                </p>
                <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink">{t(`boat.rules.${k}.body`)}</p>
              </li>
            );
          })}
        </ul>
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t(north ? 'boat.rules.visitors' : 'boat.rules.note')}</p>
      </WidgetSection>

      <WidgetSection title={t('boat.get.title')}>
        <Steps items={[{ icon: GraduationCap, k: 'get.1' }, { icon: Check, k: 'get.2' }, { icon: CreditCard, k: 'get.3' }]} />
        <Bullets
          className="mt-4"
          items={[
            t('boat.other.1'),
            t('boat.other.2'),
            <>
              {t('boat.other.3')} <TelLink number={data.phone} />
            </>,
          ]}
        />
        <div className="mt-1 flex items-start gap-2 text-[14px]">
          <Anchor className="mt-3.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <PageLink href={data.links.faq} className="min-w-0">
            {t('boat.faq')}
          </PageLink>
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}
