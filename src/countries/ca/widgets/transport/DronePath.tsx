'use client';
/**
 * Drone pilot certificate path (transportDrone): pick the drone's size and how you'll fly, see the category,
 * minimum age, every step in order and Transport Canada's fees in force today. Recomputes on the device.
 */
import { useState } from 'react';
import { Check, CircleAlert, Drone, Info, PartyPopper, Plane, Radar, Trees, UserRound, Users } from 'lucide-react';
import { Badge, ExternalLink, Notice, NumberTicker, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { OFFICIAL } from './constants';
import { MIN_AGE, OPS, SIZES, categoryOf, dronePath, feesSince, govTotal, tooYoungFor, youngPath, type DroneInput, type DroneOp, type DroneOutput, type DroneSize, type PathStep } from './drone';
import { ChoiceGrid } from './choice-grid';
import { Hero, HeroStatus, say } from './hero';
import { PageLink } from './links';
import messages from './messages';
import { AsideSteps, ordinals, useDay } from './shared';
import { ToolSkeleton } from './skeleton';

const OP_ICON = { standard: Trees, 'near-people': Users, 'controlled-airspace': Plane, bvlos: Radar, event: PartyPopper } as const;

export function DronePath({ part }: WidgetProps<DroneInput, DroneOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('drone.error.title')} message={t('drone.error.body')} fallback={{ href: OFFICIAL.droneCategories[locale === 'fr' ? 'fr' : 'en'], label: t('drone.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ToolSkeleton title={t('drone.title')} subtitle={t('drone.subtitle')} icon={Drone} tone="glacier" label={t('drone.loading')} blocks={['heroTall', 'sizes4', 'note', 'choices2', 'steps', 'note', 'chips', 'actions', 'note', 'footer']} />;
  }
  return <Path data={part.output} />;
}

function Path({ data }: { data: DroneOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const day = useDay();
  const [size, setSize] = useState<DroneSize>(data.size);
  const [op, setOp] = useState<DroneOp>(data.operation);
  const cat = categoryOf(size, op);
  const minAge = MIN_AGE[cat];
  const tooYoung = tooYoungFor(cat, data.age);
  const age = data.age ?? 0;
  const youngCat = cat === 'advanced' || cat === 'complex' ? cat : 'basic';
  // Too young for this category: no certificate to get yet, so the path is registration + a supervising pilot.
  const steps = tooYoung ? youngPath(age, data.fees) : dronePath(cat, data.fees);
  const total = govTotal(steps);
  const stepKey = (kind: PathStep['kind']) => (kind === 'young-supervisor' || kind === 'young-fly' || kind === 'young-later' ? `drone.step.${kind}.${youngCat}` : `drone.step.${kind}`);
  const money = (n: number) => fmt.money(n, { cents: 'always' });
  const title = tooYoung ? t(cat === 'complex' ? 'drone.verdict.young.complex' : 'drone.verdict.young', { min: String(minAge ?? 0) }) : t(`drone.verdict.${cat}`);
  const sub = tooYoung ? t(`drone.verdict.young.${youngCat}.sub`) : t(`drone.verdict.${cat}.sub`);
  const hasSteps = cat !== 'micro' && cat !== 'special';
  const feeNote = t(tooYoung ? 'drone.feeNoteYoung' : 'drone.feeNote', { total: money(total), date: day(data.today, { month: 'long', day: 'numeric', year: 'numeric' }) });

  const handoff =
    cat === 'special'
      ? { href: data.links.special, label: t('drone.handoff.special'), note: t('drone.handoff.specialNote') }
      : cat === 'micro'
        ? { href: data.links.micro, label: t('drone.handoff.micro'), note: t('drone.handoff.microNote') }
        : { href: data.links.portal, label: t('drone.handoff.portal'), note: t(tooYoung && age < 14 ? 'drone.handoff.portalNoteOwner' : 'drone.handoff.portalNote') };

  const feesStored = ordinals(t('drone.feesStored', { date: day(feesSince(data.today), { month: 'short', day: 'numeric', year: 'numeric' }) }));

  return (
    <WidgetShell
      icon={Drone}
      tone="glacier"
      title={t('drone.title')}
      subtitle={t('drone.subtitle')}
      badge={
        data.feesLive ? (
          <Badge tone="live">{t('drone.feesLive')}</Badge>
        ) : (
          <Badge tone="warn">{feesStored}</Badge>
        )
      }
      sources={data.sources}
      handoff={handoff}
      footnote={cat === 'basic' || cat === 'advanced' || cat === 'complex' ? t('drone.fines') : undefined}
      className="@container"
    >
      <Hero
        tone={cat === 'micro' ? 'ok' : cat === 'special' || tooYoung ? 'warn' : 'info'}
        icon={cat === 'micro' ? Check : cat === 'special' ? CircleAlert : tooYoung ? UserRound : Drone}
        title={title}
        sub={sub}
        announce={say(title, sub, hasSteps && feeNote)}
      >
        {minAge != null || total > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            {minAge != null ? (
              <span className="inline-flex items-baseline gap-1.5 rounded-[12px] bg-card/70 px-3 py-2">
                <span className="font-serif text-[22px] leading-none tracking-[-.02em] text-ink">
                  <bdi dir="ltr">{fmt.number(minAge)}+</bdi>
                </span>
                <span className="text-[13px] text-ink-3">{t('drone.minAge')}</span>
              </span>
            ) : null}
            {total > 0 ? (
              <span className="inline-flex items-baseline gap-1.5 rounded-[12px] bg-card/70 px-3 py-2">
                <span className="font-serif text-[22px] leading-none tracking-[-.02em] text-ink">
                  <NumberTicker value={total} format={money} />
                </span>
                <span className="text-[13px] text-ink-3">{t(!tooYoung ? 'drone.tcFees' : age < 14 ? 'drone.tcFeesOwner' : 'drone.tcFeesReg')}</span>
              </span>
            ) : null}
          </div>
        ) : null}
        {data.feesLive ? <HeroStatus>{t('drone.status.live')}</HeroStatus> : <HeroStatus tone="warn">{feesStored}</HeroStatus>}
      </Hero>

      <WidgetSection title={t('drone.size.title')}>
        <ChoiceGrid
          label={t('drone.size.title')}
          value={size}
          onChange={setSize}
          className="grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4"
          options={SIZES.map((s) => ({ value: s, label: <bdi dir="ltr">{t(`drone.size.${s}`)}</bdi>, sub: t(`drone.size.${s}.sub`) }))}
        />
        {/* Only while the selection is still the size that weight falls in. */}
        {data.weightGrams != null && size === data.size ? <p className="m-0 mt-2 text-[13px] text-ink-3">{t('drone.size.given', { grams: fmt.number(data.weightGrams) })}</p> : null}
        <p className="m-0 mt-2 text-[13px] text-ink-3">{t('drone.size.note')}</p>
      </WidgetSection>

      <WidgetSection title={t('drone.op.title')}>
        <ChoiceGrid
          label={t('drone.op.title')}
          value={op}
          onChange={setOp}
          // Five choices in two columns: the odd last card spans the row instead of leaving an empty cell.
          className="@xl:grid-cols-2 @xl:[&>*:last-child:nth-child(odd)]:col-span-2"
          options={OPS.map((o) => ({ value: o, label: t(`drone.op.${o}`), sub: t(`drone.op.${o}.sub`), icon: OP_ICON[o] }))}
        />
        {size === 'micro' ? <p className="m-0 mt-2 text-[13px] text-ink-3">{t('drone.op.microHint')}</p> : null}
      </WidgetSection>

      {tooYoung ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" icon={Info} title={t('drone.young.title')}>
            {t('drone.young.micro')}{' '}
            <ExternalLink href={data.links.micro}>
              {t('drone.young.microLink')}
            </ExternalLink>
            <span className="mt-1.5 block">
              {t('drone.young.owner')}{' '}
              <ExternalLink href={data.links.carOwner}>
                {t('drone.young.ownerLaw')}
              </ExternalLink>
            </span>
          </Notice>
        </div>
      ) : null}

      <WidgetSection
        title={
          cat === 'micro'
            ? t('drone.steps.microTitle')
            : cat === 'special'
              ? t('drone.steps.specialTitle')
              : tooYoung
                ? age < 14
                  ? t('drone.steps.youngChild')
                  : t('drone.steps.youngTeen', { min: minAge ?? 0 })
                : t('drone.steps.title')
        }
      >
        {!hasSteps ? (
          <MicroOrSpecial cat={cat} />
        ) : (
          <>
            <AsideSteps
              steps={steps.map((s, i) => ({
                title: t(stepKey(s.kind), { min: minAge ?? 0 }),
                // The supervision rule is cited right after the step that states it.
                detail:
                  s.kind === 'young-fly' ? (
                    <>
                      {t(`${stepKey(s.kind)}.detail`, { min: minAge ?? 0 })}{' '}
                      <ExternalLink href={data.links.car[youngCat]}>
                        {t(`drone.young.law.${youngCat}`)}
                      </ExternalLink>
                    </>
                  ) : (
                    t(`${stepKey(s.kind)}.detail`, { min: minAge ?? 0 })
                  ),
                state: i === steps.length - 1 ? 'end' : i === 0 ? 'current' : 'upcoming',
                aside: <FeeTag step={s} money={money} />,
              }))}
            />
            <p className="m-0 mt-4 text-[13px] leading-snug text-ink-3">{ordinals(feeNote)}</p>
          </>
        )}
      </WidgetSection>

      {hasSteps ? (
        <WidgetSection title={t('drone.more')}>
          <div className="-my-2 flex flex-wrap gap-x-5 text-[14px]">
            <PageLink href={data.links.schools}>{t('drone.link.schools')}</PageLink>
            <PageLink href={data.links.exam}>{t('drone.link.exam')}</PageLink>
            <PageLink href={data.links.recency}>{t('drone.link.recency')}</PageLink>
          </div>
        </WidgetSection>
      ) : null}
    </WidgetShell>
  );
}

function FeeTag({ step, money }: { step: PathStep; money: (n: number) => string }) {
  const t = useMessages(messages);
  if (step.fee == null) return null;
  const label = typeof step.fee === 'number' ? money(step.fee) : t(`drone.fee.${step.fee}`);
  return <span className="shrink-0 whitespace-nowrap font-mono text-[12.5px] font-medium text-ink-2">{label}</span>;
}

function MicroOrSpecial({ cat }: { cat: 'micro' | 'special' }) {
  const t = useMessages(messages);
  const keys = cat === 'micro' ? ['1', '2', '3', '4'] : ['1', '2', '3'];
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {keys.map((k) => (
        <li key={k} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2" aria-hidden>
            <Info className="size-3" strokeWidth={2.4} />
          </span>
          {t(`drone.${cat}.${k}`)}
        </li>
      ))}
    </ul>
  );
}
