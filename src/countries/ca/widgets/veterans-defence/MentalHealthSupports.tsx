'use client';
/**
 * Mental health supports (`veteransDefenceMentalHealth`): crisis lines first, then the free 24/7
 * professional line for the chosen audience, peer support, treatment and family supports. Nothing saved.
 */
import { useState } from 'react';
import { AlertTriangle, Clock, HeartHandshake, HeartPulse, House, MessageSquare, Phone, Stethoscope, Users, type LucideIcon } from 'lucide-react';
import { Badge, Card, ExternalLink, LinkButton, LiveRegion, Segmented, WidgetIcon, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { FALLBACK, PHONES, inLanguage, langOf, sms, tel } from './facts';
import messages from './messages';
import { HERO_BG, PhoneText } from './parts';
import { ShapedSkeleton } from './skeletons';
import { AUDIENCES, supportsFor, type Audience, type Support, type SupportKind, type SupportsInput, type SupportsOutput } from './supports';

/** A support with a phone line: the only kind the "talk to someone now" card shows. */
type Line = Support & { phone: string };
const isLine = (s: Support): s is Line => !!s.phone;

const ROW_ICON: Record<string, LucideIcon> = {
  osiss: Users,
  sosi: Users,
  osiClinics: Stethoscope,
  mentalHealthBenefits: HeartPulse,
  cafClinic: Stethoscope,
  familyLine: House,
  vfp: HeartHandshake,
};
/** Row links sit on a 32px line, and a pseudo-element extends the hit area to 44px, so rows stay compact. */
const ROW_LINK = 'relative inline-flex min-h-8 items-center underline decoration-hair-2 underline-offset-[3px] after:absolute after:inset-x-0 after:-inset-y-1.5';
const SECTIONS: SupportKind[] = ['peer', 'care', 'family'];
const FAMILY_FIRST: SupportKind[] = ['family', 'peer', 'care'];

export function MentalHealthSupports({ part, locale }: WidgetProps<SupportsInput, SupportsOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    // The crisis lines need no data: they stay when the tool fails, in the same card as the error (core
    // `WidgetError` is a card of its own, so its layout is repeated here under the note).
    return (
      <Card as="section" className="@container text-start">
        <CrisisNote className="px-5 pt-5 sm:px-6" />
        <div role="alert" className="flex gap-3.5 px-5 py-5 sm:px-6">
          <WidgetIcon icon={AlertTriangle} tone="amber" />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[16px] font-semibold leading-snug text-ink">{t('mh.error.title')}</p>
            <p className="m-0 mt-1 text-[14.5px] text-ink-2">
              <PhoneText text={t('mh.error.body', { phone: PHONES.assistance })} phone={PHONES.assistance} />
            </p>
            <LinkButton size="sm" variant="secondary" href={FALLBACK.assistance[langOf(locale, 'en')]} external className="mt-4">
              {t('mh.error.fallback')}
            </LinkButton>
          </div>
        </div>
      </Card>
    );
  }
  if (part.state !== 'output-available' || !part.output) {
    // The crisis lines need no data: they show for real while the rest loads.
    return <ShapedSkeleton title={t('mh.title')} subtitle={t('mh.subtitle')} icon={HeartHandshake} tone="glacier" label={t('mh.loading')} variant="support" lead={<CrisisNote />} />;
  }
  return <Supports output={part.output} />;
}

function Supports({ output }: { output: SupportsOutput }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  // The widget follows the UI language (links, source titles), like the passport planner: one language per card.
  const data = inLanguage(output, langOf(locale, output.lang));
  const [who, setWho] = useState<Audience>(output.audience);
  const list = supportsFor(who);
  // Families lead with their own 24/7 line; the professional line (same number for VAC and the CF program) comes first under it.
  const family = who === 'family';
  const now = list.filter(isLine).find((s) => (family ? s.id === 'familyLine' : s.kind === 'now'));
  const rowsOf = (kind: SupportKind) =>
    family && kind === 'family' ? list.filter((s) => s.kind === 'now' || (s.kind === 'family' && s !== now)) : list.filter((s) => s.kind === kind && s !== now);

  return (
    <WidgetShell
      icon={HeartHandshake}
      tone="glacier"
      title={t('mh.title')}
      subtitle={t('mh.subtitle')}
      badge={<Badge tone="info">{t('mh.badge')}</Badge>}
      sources={data.sources}
      className="@container"
    >
      <CrisisNote />

      <div className="px-5 pt-5 sm:px-6">
        <p className="m-0 mb-2.5 text-[15px] font-semibold text-ink">
          {t('mh.q.who')}
        </p>
        <Segmented
          label={t('mh.q.who')}
          value={who}
          onChange={setWho}
          // Two by two on phones, so French labels ("En service") keep to one line.
          className="@max-sm:grid @max-sm:grid-cols-2"
          options={AUDIENCES.map((k) => ({ value: k, label: <span className="whitespace-nowrap">{t(`mh.who.${k}`)}</span> }))}
        />
        <LiveRegion text={t('mh.who.sr', { who })} />
      </div>

      {now ? <NowCard s={now} data={data} rcmp={who === 'rcmp'} /> : null}

      {(family ? FAMILY_FIRST : SECTIONS).map((kind) => {
        const rows = rowsOf(kind);
        if (!rows.length) return null;
        return (
          <WidgetSection key={kind} title={t(`mh.sec.${kind}`)}>
            <ul className="m-0 grid list-none gap-2 p-0">
              {rows.map((s) => (
                <SupportRow key={s.id} s={s} data={data} />
              ))}
            </ul>
          </WidgetSection>
        );
      })}
      <p className="m-0 px-5 pb-5 pt-5 text-[13px] text-ink-3 sm:px-6">{t('mh.footnote')}</p>
    </WidgetShell>
  );
}

/**
 * Core `accent` is the maple button. Dark maple is brighter (4.2:1 under white, short of AA for a 15px label),
 * so in dark mode the 911 button mixes the token with 18% black (about 6:1). Drop this if core adds an on-maple token.
 */
const CALL_911 = 'dark:bg-[color-mix(in_oklab,var(--color-maple),black_18%)]';

/** Half-width in a phone column: the label alone (French "Appeler le 9-8-8" needs the whole 140px), on one line. */
const PAIR = '@max-sm:whitespace-nowrap @max-sm:px-2 @max-sm:[&>svg]:hidden';

/** 911 and 9-8-8, first and always (also shown while the tool runs, and when it fails). */
function CrisisNote({ className = 'px-5 sm:px-6' }: { className?: string }) {
  const t = useMessages(messages);
  return (
    <div className={className}>
      <div role="note" className="rounded-tile border border-maple/20 bg-maple-wash px-4 py-3.5">
        <p className="m-0 text-[15px] font-semibold leading-snug text-ink">{t('mh.crisis.title')}</p>
        <p className="m-0 mt-0.5 text-[14.5px] leading-snug text-ink-2">{t('mh.crisis.body')}</p>
        {/* In a phone-width column: 911 on its own row, then call and text 9-8-8 as two equal columns (their icons
            return from @sm, where the three sit in one row). */}
        <div className="mt-3 grid grid-cols-2 gap-2 @sm:flex @sm:flex-wrap">
          <LinkButton href={tel(PHONES.emergency)} variant="accent" size="md" icon={Phone} className={cn('col-span-2 px-4 font-semibold', CALL_911)}>
            {t('mh.crisis.call911')}
          </LinkButton>
          <LinkButton href={tel(PHONES.crisis)} variant="secondary" size="md" icon={Phone} className={cn('bg-card px-4 font-semibold', PAIR)}>
            {t('mh.crisis.call988')}
          </LinkButton>
          <LinkButton href={sms(PHONES.crisis)} variant="secondary" size="md" icon={MessageSquare} className={cn('bg-card px-4 font-semibold', PAIR)}>
            {t('mh.crisis.text988')}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

/** The professional lines are free; the Family Information Line page says confidential, bilingual and 24/7. */
const NOW_TAGS: Record<string, readonly ('free' | 'confidential' | 'bilingual' | 'always')[]> = {
  familyLine: ['confidential', 'bilingual', 'always'],
};

function NowCard({ s, data, rcmp }: { s: Line; data: SupportsOutput; rcmp: boolean }) {
  const t = useMessages(messages);
  const tags = NOW_TAGS[s.id] ?? (['free', 'confidential', 'always'] as const);
  return (
    <div className="px-5 pt-5 sm:px-6">
      <div className={cn('relative overflow-hidden rounded-card border px-5 py-5', HERO_BG.glacier)}>
        <p className="m-0 text-balance font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">{t(s.kind === 'now' ? 'mh.now.eyebrow' : 'mh.now.eyebrowFamily')}</p>
        <h4 className="m-0 mt-1.5 text-[18px] font-semibold leading-snug tracking-[-.01em] text-ink">{t(`mh.now.name.${s.id}`)}</h4>
        {/* Veterans Affairs Canada lists former RCMP members only: say so before the number. */}
        {rcmp ? <p className="m-0 mt-0.5 text-[14.5px] font-medium leading-snug text-ink-2">{t('mh.now.rcmp.for')}</p> : null}
        <a
          href={tel(s.phone)}
          className={cn(
            "inline-flex min-h-11 items-center font-serif text-[38px] leading-none tracking-[-.03em] text-ink no-underline decoration-glacier/50 underline-offset-[6px] hover:underline [font-variation-settings:'opsz'_72] @xl:text-[46px]",
            // The audience line above needs more air than the name alone.
            rcmp ? 'mt-3' : 'mt-1',
          )}
        >
          <span className="sr-only">{t('mh.now.callSr')} </span>
          <bdi dir="ltr">{s.phone}</bdi>
        </a>
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {tags.map((k) => (
            <li key={k}>
              <Badge tone={k === 'always' ? 'ok' : 'neutral'} icon={k === 'always' ? Clock : undefined} className="bg-card/70">
                <bdi>{t(`mh.now.tag.${k}`)}</bdi>
              </Badge>
            </li>
          ))}
        </ul>
        <ul className="m-0 mt-4 grid list-none gap-1.5 p-0">
          {([1, 2, 3] as const).map((n) => (
            <li key={n} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
              <span className="mt-[8px] size-[5px] shrink-0 rounded-full bg-glacier" aria-hidden />
              {t(`mh.now.${s.id}.${n}`)}
            </li>
          ))}
        </ul>
        {rcmp ? (
          <p className="m-0 mt-4 rounded-field border border-hair bg-card/70 px-3.5 py-3 text-[14px] leading-snug text-ink-2">
            <strong className="font-semibold text-ink">{t('mh.now.rcmp.serving.title')}</strong> {t('mh.now.rcmp.serving.body')}{' '}
            <ExternalLink href={data.urls.rcmpServing} className="font-medium text-ink">
              {t('mh.now.rcmp.serving.link')}
            </ExternalLink>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <LinkButton href={tel(s.phone)} variant="primary" size="md" icon={Phone} className="px-4 font-semibold max-sm:w-full">
            {t('mh.action.callNow')}
          </LinkButton>
          {s.tty ? (
            <a href={tel(s.tty)} className="inline-flex min-h-11 items-center gap-1 text-[13.5px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink">
              {t('mh.now.tty')} <bdi dir="ltr">{s.tty}</bdi>
            </a>
          ) : null}
          <ExternalLink href={data.urls[s.id]} standalone className="text-[13.5px] text-ink-2 hover:text-ink">
            {/* One element, so the words keep their space inside the flex link. */}
            <span>{t('mh.action.learn')}</span>
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

function SupportRow({ s, data }: { s: Support; data: SupportsOutput }) {
  const t = useMessages(messages);
  const Icon = ROW_ICON[s.id] ?? HeartHandshake;
  return (
    <li className="flex gap-3.5 rounded-tile border border-hair bg-card px-4 pb-2.5 pt-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-field bg-glacier-wash text-glacier" aria-hidden>
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h5 className="m-0 text-[15.5px] font-semibold leading-snug text-ink">{t(`mh.row.${s.id}.name`)}</h5>
          {s.hours === '24/7' ? (
            <Badge tone="ok" icon={Clock}>
              {t('mh.hours.always')}
            </Badge>
          ) : null}
        </div>
        <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{t(`mh.row.${s.id}.body`)}</p>
        {/* One compact action line (call + learn more side by side); office hours sit as a quiet full-width line under it. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0 pb-0.5 text-[13.5px]">
          {s.phone ? (
            <a href={tel(s.phone)} className={cn(ROW_LINK, 'font-semibold text-ink hover:decoration-ink')}>
              <span>
                {t(s.id === 'osiClinics' ? 'mh.action.referral' : 'mh.action.call')}{' '}
                <bdi dir="ltr" className="whitespace-nowrap">
                  {s.phone}
                </bdi>
              </span>
            </a>
          ) : null}
          <ExternalLink href={data.urls[s.id]} standalone className={cn(ROW_LINK, 'text-ink-2 hover:text-ink')}>
            {/* One element, so the words keep their space inside the flex link. */}
            <span>{t('mh.action.learn')}</span>
          </ExternalLink>
          {s.phone && (s.hours === 'weekdays' || s.hours === 'transition-group') ? (
            <span className="-mt-0.5 mb-1 basis-full text-[12.5px] leading-snug text-ink-3">{t(`mh.hours.${s.hours}`)}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
