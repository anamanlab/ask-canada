'use client';
/**
 * Veterans benefits navigator (`veteransDefenceBenefits`). Answers re-rank the programs on the device;
 * starred programs are saved on this device only. A guide, not a decision.
 */
import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, ChevronDown, DoorOpen, HeartHandshake, Medal, MessageCircleHeart, Pencil, Phone, Shield, Smartphone, Users, type LucideIcon } from 'lucide-react';
import { Badge, Button, LinkButton, LiveRegion, Segmented, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { FALLBACK, inLanguage, langOf, tel } from './facts';
import { useSavedList } from './hooks';
import messages from './messages';
import { NEEDS, STATUSES, navigate, refFor, type BenefitsInput, type BenefitsOutput, type NavAnswers, type Status } from './navigator';
import { ChipGroup, Hero, Question } from './parts';
import { ProgramCard, voiced } from './ProgramCard';
import { ShapedSkeleton } from './skeletons';

const STATUS_ICON: Record<Status, LucideIcon> = { veteran: Medal, releasing: DoorOpen, serving: Shield, family: Users, survivor: HeartHandshake, rcmp: BadgeCheck };
const FIRST = 6;
export function BenefitsNavigator({ part, locale }: WidgetProps<BenefitsInput, BenefitsOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return (
      <WidgetError
        title={t('nav.error.title')}
        message={t('nav.error.body')}
        fallback={{ href: FALLBACK.vacNavigator[langOf(locale, 'en')], label: t('nav.error.fallback') }}
      />
    );
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ShapedSkeleton title={t('nav.title')} subtitle={t('nav.subtitle')} icon={Medal} tone="pine" label={t('nav.loading')} variant="benefits" compact={!!part.input?.status} />;
  }
  return <Navigator output={part.output} />;
}

function Navigator({ output }: { output: BenefitsOutput }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  // The widget follows the UI language (names, links, source titles), like the passport planner: one language per card.
  const data = inLanguage(output, langOf(locale, output.lang));
  const reduce = useReducedMotion();
  const answersId = useId();
  const [a, setA] = useState<NavAnswers>(output.answers);
  const [more, setMore] = useState(false);
  // When the conversation already said who this is for, lead with the programs and fold the questions away.
  const [editing, setEditing] = useState(!output.known);
  const set = (patch: Partial<NavAnswers>) => setA((x) => ({ ...x, ...patch }));
  const results = navigate(a);
  const main = results.filter((r) => r.inNeeds);
  const rest = results.filter((r) => !r.inNeeds);
  const hidden = Math.max(0, main.length - FIRST) + rest.length;
  const stars = useSavedList('veterans-defence:programs', t('nav.saved.label'), (next) => next.map((id) => refFor(data.names, id, a.status) ?? id).join(' · ') || t('nav.saved.none'));
  const showYears = a.status === 'veteran' || a.status === 'releasing';
  // No survivor program turns on a service-related condition (veterans.gc.ca): the question would change nothing.
  const showService = a.status !== 'survivor';

  return (
    <WidgetShell
      icon={Medal}
      tone="pine"
      title={t('nav.title')}
      subtitle={t('nav.subtitle')}
      badge={<Badge icon={Smartphone}>{t('nav.badge')}</Badge>}
      sources={data.sources}
      handoff={{ href: data.links.myVacSignIn, label: t('nav.handoff'), note: t('nav.handoff.note') }}
      secondaryAction={
        <LinkButton href={tel(data.phones.vac)} variant="secondary" size="lg" icon={Phone} className="max-sm:w-full">
          {t('nav.call', { phone: data.phones.vac })}
        </LinkButton>
      }
      footnote={t('nav.footnote')}
      className="@container"
    >
      <Hero tone="pine" count={main.length} label={t('nav.hero.label', { count: main.length })} sub={t('nav.hero.sub')} />
      <LiveRegion text={t('nav.sr', { count: main.length })} />

      <div className="px-5 pt-4 sm:px-6">
        <a
          href={tel(data.phones.assistance)}
          className="group flex min-h-11 items-start gap-3 rounded-tile bg-glacier-wash px-4 py-3 text-[14.5px] leading-snug text-ink no-underline"
        >
          <MessageCircleHeart className="mt-0.5 size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
          {/* The number always gets its own line, at every width, so it never wraps in on its own by accident. */}
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="min-w-0">
              <strong className="font-semibold">{t('nav.talk.title')}</strong> {t('nav.talk.body')}
            </span>
            <span className="whitespace-nowrap text-[15.5px] font-semibold tabular-nums text-glacier underline decoration-glacier/40 underline-offset-[3px] group-hover:decoration-glacier">
              <bdi dir="ltr">{data.phones.assistance}</bdi>
            </span>
          </span>
        </a>
      </div>

      <WidgetSection
        title={t('nav.q.title')}
        aside={
          data.known ? (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              aria-controls={answersId}
              className="relative inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13.5px] font-semibold text-ink-2 underline decoration-hair-2 underline-offset-[3px] after:absolute after:-inset-y-1.5 after:inset-x-0 hover:text-ink"
            >
              {editing ? null : <Pencil className="size-3.5" strokeWidth={2} aria-hidden />}
              {editing ? t('nav.done') : t('nav.edit')}
              {editing ? null : <span className="sr-only">: {t('nav.editSr')}</span>}
            </button>
          ) : null
        }
      >
        <div id={answersId}>
          {editing ? (
            <div className="grid gap-5">
              <Question title={t('nav.q.status')}>
                {(labelId) => (
                  <ChipGroup
                    kind="radio"
                    labelledBy={labelId}
                    value={[a.status]}
                    onChange={([v]) => set({ status: v })}
                    options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`), icon: STATUS_ICON[s] }))}
                  />
                )}
              </Question>
              {showService ? (
                <div className={cn('grid gap-5', showYears && '@xl:grid-cols-2')}>
                  <Question title={t(voiced('nav.q.service', a.status))}>
                    <Segmented
                      label={t(voiced('nav.q.service', a.status))}
                      value={a.serviceRelated}
                      onChange={(v) => set({ serviceRelated: v })}
                      options={(['yes', 'unsure', 'no'] as const).map((k) => ({ value: k, label: t(`answer.${k}`) }))}
                    />
                  </Question>
                  {showYears ? (
                    <Question title={t('nav.q.years')}>
                      <Segmented
                        label={t('nav.q.years')}
                        value={a.service}
                        onChange={(v) => set({ service: v })}
                        // Beside the other question (@xl) the options take their content width and never wrap
                        // (French: "Pas certain", "Moins de 6"); in a phone-width column they form a 2 × 2 grid.
                        className="@max-sm:grid @max-sm:grid-cols-2 @xl:[&>button]:flex-auto"
                        options={(['unsure', 'under6', '6to11', '12plus'] as const).map((k) => ({ value: k, label: <span className="whitespace-nowrap">{t(`years.${k}`)}</span> }))}
                      />
                    </Question>
                  ) : null}
                </div>
              ) : null}
              <Question title={t('nav.q.needs')} hint={t('nav.q.needsHint')}>
                {(labelId) => <ChipGroup kind="checkbox" labelledBy={labelId} value={a.needs} onChange={(v) => set({ needs: v })} options={NEEDS.map((n) => ({ value: n, label: t(`need.${n}`) }))} />}
              </Question>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {[
                { key: 'status', icon: STATUS_ICON[a.status], text: t(`status.${a.status}`), strong: true },
                ...(showService ? [{ key: 'svc', text: t(`nav.sum.service.${a.serviceRelated}`) }] : []),
                ...(showYears && a.service !== 'unsure' ? [{ key: 'years', text: t(`nav.sum.years.${a.service}`) }] : []),
                ...(a.needs.length ? a.needs.map((n) => ({ key: n, text: t(`need.${n}`) })) : [{ key: 'all', text: t('nav.sum.needsAll') }]),
              ].map((c) => {
                const Icon = 'icon' in c ? c.icon : undefined;
                return (
                  <li
                    key={c.key}
                    className={cn(
                      'inline-flex min-h-8 items-center gap-1.5 rounded-chip px-3 py-1 text-[13.5px] leading-snug',
                      'strong' in c ? 'bg-ink font-semibold text-paper' : 'border border-hair-2 bg-card font-medium text-ink-2',
                    )}
                  >
                    {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden /> : null}
                    <bdi>{c.text}</bdi>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </WidgetSection>

      <WidgetSection title={t('nav.results.title')}>
        <ul className="m-0 grid list-none gap-3 p-0">
          <AnimatePresence initial={false}>
            {(more ? main : main.slice(0, FIRST)).map((r, i) => (
              <motion.li
                key={r.program.id}
                layout={reduce ? false : 'position'}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                {/* The first program is the one to start with: a larger card with its figure and the action to take. */}
                <ProgramCard r={r} data={data} status={a.status} service={a.service} featured={i === 0} starred={stars.has(r.program.id)} onStar={() => stars.toggle(r.program.id)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {more && rest.length ? (
          <div className="mt-5">
            <h5 className="m-0 mb-2.5 text-[14px] font-semibold text-ink-2">{t('nav.more.title')}</h5>
            <ul className="m-0 grid list-none gap-3 p-0">
              {rest.map((r) => (
                <li key={r.program.id}>
                  <ProgramCard r={r} data={data} status={a.status} service={a.service} starred={stars.has(r.program.id)} onStar={() => stars.toggle(r.program.id)} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {hidden > 0 ? (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="md" onClick={() => setMore((v) => !v)} aria-expanded={more}>
              {more ? t('nav.more.hide') : t('nav.more.show', { count: hidden })}
              <ChevronDown className={cn('size-4 transition-transform duration-300 motion-reduce:transition-none', more && 'rotate-180')} strokeWidth={1.8} aria-hidden />
            </Button>
          </div>
        ) : null}
      </WidgetSection>
    </WidgetShell>
  );
}
