'use client';
/**
 * The advisory tool's answers without a live advisory: no destination named (registration first, then
 * popular destinations), a destination we didn't recognise, and the feed being down (official link and
 * the 24/7 emergency line), each with the four risk levels explained.
 */
import { BellRing, LifeBuoy, Mail, Phone, Plane } from 'lucide-react';
import { Chip, LinkButton, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { EWRC, LEVEL_TEXT, URLS } from './data';
import { frIn } from './fr';
import messages from './messages';
import { LEVEL_FILL, nameIn, urlIn, useSources, useUiLang } from './shared';
import type { AdvisoryOutput, Lang, Names, RiskLevel } from './types';

type Out<K extends AdvisoryOutput['kind']> = Extract<AdvisoryOutput, { kind: K }>;

export function AdvisoryStart({ out }: { out: Out<'start' | 'not-found' | 'offline'> }) {
  if (out.kind === 'start') return <Start out={out} />;
  if (out.kind === 'not-found') return <NotFound out={out} />;
  return <Offline out={out} />;
}

/** Popular destinations as one-tap questions. */
function Destinations({ list }: { list: { iso: string; name: string; names?: Names }[] }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const { send } = useChatActions();
  return (
    // An even grid (2 across on phones, 3 in the desktop column), so no chip is left alone on a row.
    <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-2 p-0 @xl:grid-cols-3">
      {list.map((s) => (
        <li key={s.iso} className="grid">
          <Chip wrap className="w-full justify-center text-center" onClick={() => send(t('ask.safe', { country: nameIn(s, L), inCountry: frIn(nameIn(s, L)) }))}>
            {nameIn(s, L)}
          </Chip>
        </li>
      ))}
    </ul>
  );
}

const rocaHandoff = (t: ReturnType<typeof useMessages>, L: Lang) => ({ href: URLS.roca[L], label: t('advisory.handoff'), note: t('advisory.handoffNote') });

/** No destination named: "How do I register my trip?" gets registration first, then a destination. */
function Start({ out }: { out: Out<'start'> }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const register = out.focus === 'prepare';
  const sources = useSources(out);
  return (
    <WidgetShell
      icon={register ? BellRing : Plane}
      tone={register ? 'pine' : 'glacier'}
      title={t(register ? 'start.registerTitle' : 'advisory.title')}
      subtitle={t(register ? 'start.registerSub' : 'advisory.subtitleAll')}
      sources={sources}
      handoff={rocaHandoff(t, L)}
      className="@container"
    >
      {register ? (
        <div className="mx-3 rounded-[22px] border border-hair bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_12%,transparent),color-mix(in_oklab,var(--glacier)_9%,transparent)_60%,transparent)] px-5 py-5 sm:mx-4 sm:px-6">
          <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-pine">{t('start.free')}</p>
          <p className="m-0 mt-2 font-serif text-[28px] leading-[1.1] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_48] [text-wrap:balance]">{t('start.headline')}</p>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0">
            {(['where', 'info', 'private'] as const).map((k) => (
              <li key={k} className="flex gap-2.5 text-[14.5px] leading-[1.5] text-ink-2">
                <span className="mt-[8px] size-[6px] shrink-0 rounded-full bg-pine" aria-hidden />
                <span>{t(`start.point.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <WidgetSection title={t('start.destTitle')}>
        <p className="m-0 text-[15px] leading-[1.5] text-ink-2">{t('start.destBody')}</p>
        <Destinations list={out.suggestions} />
      </WidgetSection>
      {register ? null : <LevelsLegend />}
    </WidgetShell>
  );
}

function NotFound({ out }: { out: Out<'not-found'> }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const sources = useSources(out);
  return (
    <WidgetShell icon={Plane} tone="glacier" title={t('advisory.title')} subtitle={t('advisory.subtitleAll')} sources={sources} handoff={rocaHandoff(t, L)} className="@container">
      <div className="px-5 sm:px-6">
        <p className="m-0 font-serif text-[24px] leading-tight tracking-[-.02em] text-ink [text-wrap:balance]">
          {out.query ? t('notFound.title', { query: out.query }) : t('notFound.titleNoQuery')}
        </p>
        <p className="m-0 mt-1.5 text-[15px] text-ink-3">{t('notFound.body')}</p>
        <Destinations list={out.suggestions} />
      </div>
      <LevelsLegend />
    </WidgetShell>
  );
}

function Offline({ out }: { out: Out<'offline'> }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const name = out.country ? nameIn(out.country, L) : '';
  const sources = useSources(out);
  const link = 'inline-flex min-h-11 items-center font-medium text-ink underline decoration-hair-2 underline-offset-[3px]';
  return (
    <WidgetShell
      icon={Plane}
      tone="glacier"
      title={t('advisory.title')}
      subtitle={out.country ? t('advisory.subtitleOffline', { country: name }) : t('advisory.subtitleAll')}
      sources={sources}
      handoff={{
        href: out.country ? urlIn(out.country, L) : URLS.advisories[L],
        label: out.country ? t('offline.handoff', { country: name }) : t('error.advisoryLink'),
        note: t('offline.note'),
      }}
      secondaryAction={
        <LinkButton href={URLS.roca[L]} external variant="secondary" size="md" className="max-sm:w-full">
          {t('advisory.handoff')}
        </LinkButton>
      }
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <Notice tone="warn" title={t('offline.title')} live>
          {t('offline.body')}
        </Notice>
        {/* Static facts that still help while the feed is down. */}
        <div className="mt-3 rounded-[16px] bg-paper-2 px-4 py-3">
          <p className="m-0 flex items-center gap-2 text-[14.5px] font-semibold text-ink">
            <LifeBuoy className="size-4 shrink-0 text-maple" aria-hidden strokeWidth={2} />
            {t('offline.ewrc')}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-5 text-[14.5px]">
            <a href={EWRC.collect.href} className={cn(link, 'gap-1.5')}>
              <Phone className="size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={2} />
              <span className="sr-only">{t('help.phone')}</span>
              <bdi dir="ltr">{EWRC.collect.label}</bdi>
            </a>
            <a href={EWRC.email.href} className={cn(link, 'min-w-0 gap-1.5 [overflow-wrap:anywhere]')}>
              <Mail className="size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={2} />
              {EWRC.email.label}
            </a>
          </div>
        </div>
      </div>
      <LevelsLegend />
    </WidgetShell>
  );
}

function LevelsLegend() {
  const t = useMessages(messages);
  const L = useUiLang();
  return (
    <WidgetSection title={t('levels.title')} className="pb-6">
      <ol className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2">
        {([1, 2, 3, 4] as RiskLevel[]).map((l) => (
          <li key={l} className="rounded-[14px] border border-hair bg-card px-3.5 py-3">
            <p className="m-0 flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              <span className={cn('size-2.5 shrink-0 rounded-full', LEVEL_FILL[l])} aria-hidden />
              <span className="font-mono text-[11.5px] font-medium text-ink-3">{l}</span>
              {LEVEL_TEXT[L][l]}
            </p>
            <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-3">{t(`levels.${l}`)}</p>
          </li>
        ))}
      </ol>
    </WidgetSection>
  );
}
