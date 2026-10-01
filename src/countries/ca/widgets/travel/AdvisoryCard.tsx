'use client';
/**
 * The advisory card for one destination: hero with the official risk level, what the level means, regional
 * advisories and the entry / help / before-you-go tabs (AdvisoryTabs).
 */
import { AlertTriangle, Clock, Globe2, Plane, ShieldAlert, Umbrella } from 'lucide-react';
import { Badge, Disclosure, LinkButton, Notice, Tabs, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { Entry, Help, Prepare } from './AdvisoryTabs';
import { LEVEL_TEXT, URLS } from './data';
import { frIn } from './fr';
import messages from './messages';
import { capFirst, regionTitle, updatedText } from './select';
import { Feed, LEVEL_FILL, LEVEL_INK, LevelPill, LiveSubtitle, REVEAL_FOCUS, RiskMeter, ShowAll, nameIn, proseIn, urlIn, useSources, useShowAll, useUiLang } from './shared';
import type { AdvisoryOutput, CountryAdvisory, Lang, RegionalAdvisory, RiskLevel } from './types';

const TONE: Record<RiskLevel, 'pine' | 'amber' | 'maple'> = { 1: 'pine', 2: 'amber', 3: 'maple', 4: 'maple' };
/** Key points shown before "Show more". */
const POINTS = 3;

export function AdvisoryCard({ out }: { out: Extract<AdvisoryOutput, { kind: 'advisory' }> }) {
  const t = useMessages(messages);
  // Everything follows the UI's language: our words, the level names, the destination's name and link, and
  // the feed's own prose (summary, regions, entry rules, numbers, offices), which the feed publishes in both.
  const L = useUiLang();
  const { c: localized, lang: F } = proseIn(out.country, out.lang, L);
  const c = { ...localized, name: nameIn(out.country, L), url: urlIn(out.country, L) };
  const sources = useSources(out);
  const worst = c.regions.reduce<RiskLevel>((m, r) => (r.level > m ? r.level : m), c.level);
  // "Sep 29, 2:42 p.m. EDT" / « 29 sept., 4 h 14 HAE »: the same time style as the border-waits board.
  const updated = updatedText(c.updated, L);
  const tab = out.focus === 'help' ? 'help' : out.focus === 'prepare' ? 'prepare' : 'entry';

  return (
    <WidgetShell
      icon={c.level >= 3 ? ShieldAlert : Plane}
      tone={TONE[c.level]}
      title={t('advisory.title')}
      subtitle={<LiveSubtitle short={c.name} full={t('advisory.subtitleOffline', { country: c.name })} badge={<Badge tone="live">{t('badge.live')}</Badge>} />}
      badge={<Badge tone="live">{t('badge.live')}</Badge>}
      sources={sources}
      handoff={{ href: URLS.roca[L], label: t('advisory.handoff'), note: t('advisory.handoffNote') }}
      secondaryAction={
        <LinkButton href={c.url} external variant="secondary" size="md" className="max-sm:w-full">
          {t('advisory.fullAdvice')}
        </LinkButton>
      }
      className="@container"
    >
      <Hero c={c} updated={updated} lang={L} feed={F} />

      {c.level === 4 ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="danger" icon={AlertTriangle} title={t('notice.l4.title')} live>
            {t('notice.l4.body')}
          </Notice>
        </div>
      ) : worst >= 3 ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="warn" icon={Umbrella} title={t(c.level === 3 ? 'notice.l3.title' : 'notice.regional.title')}>
            {t('notice.insurance')}
          </Notice>
        </div>
      ) : null}

      {c.points.length ? <Points points={c.points} level={c.level} feed={F} /> : null}

      {c.regions.length ? (
        <WidgetSection
          title={t('regions.title')}
          aside={
            // A compact count, so the title keeps its line on phones ("Avertissements régionaux" is long).
            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-paper-2 px-2 font-mono text-[12px] font-medium text-ink-2">
              <bdi aria-hidden>{c.regions.length}</bdi>
              <span className="sr-only">{t('regions.count', { count: c.regions.length })}</span>
            </span>
          }
        >
          <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2 p-0">
            {c.regions.map((r, i) => (
              // Feed text has no ids and can repeat; the lists are fixed for one answer, so position is the key.
              <li key={i}>
                <Region r={r} feed={F} />
              </li>
            ))}
          </ul>
        </WidgetSection>
      ) : (
        <p className="m-0 flex items-start gap-2 px-5 pt-4 text-[13.5px] leading-[1.5] text-ink-3 sm:px-6">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
          {t('regions.none', { country: c.name, inCountry: frIn(c.name) })}
        </p>
      )}

      <div className="px-5 pt-5 sm:px-6">
        <Tabs
          label={t('tabs.label')}
          defaultTab={tab}
          // Three tabs share the row evenly, so « Avant de partir » fits a phone without scrolling. Tabs has no
          // "stretch" prop yet (asked of core); until it does, this reaches for its tab buttons by role.
          className="[&_[role=tab]]:flex-1 [&_[role=tab]]:px-2 [&_[role=tablist]]:gap-0"
          tabs={[
            { id: 'entry', label: t('tabs.entry'), content: <Entry c={c} feed={F} /> },
            { id: 'help', label: t('tabs.help'), content: <Help c={c} feed={F} /> },
            { id: 'prepare', label: t('tabs.prepare'), content: <Prepare c={c} worst={worst} feed={F} /> },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

/**
 * The national advisory without repeating its level: "Exercise a high degree of caution in Mexico due to
 * crime." → "Due to crime." One-sentence advisories that only restate the level are dropped.
 */
function leadOf(summary: string): string {
  const m = summary.match(/\b(due to|because of|en raison d(?:es?|u|’|')|à cause d(?:es?|u|’|'))/i);
  if (m?.index != null) return capFirst(summary.slice(m.index));
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1 && /^(take|exercise|avoid|prenez|prendre|faites|faire|évite[rz]|evite[rz])\b/i.test(summary)) return '';
  return summary;
}

/** Feed change notes that say nothing to a traveller ("Health – editorial change"). */
const BOILERPLATE_CHANGE = /editorial change|minor change|changement (mineur|éditorial|de forme)|modification (mineure|éditoriale)/i;

function Hero({ c, updated, lang, feed }: { c: CountryAdvisory; updated: string; lang: Lang; feed: Lang }) {
  const t = useMessages(messages);
  const lead = leadOf(c.summary);
  const levelName = LEVEL_TEXT[lang][c.level];
  const change = c.change && !BOILERPLATE_CHANGE.test(c.change) ? c.change.replace(/[\s.]+$/, '') : '';
  return (
    <div
      className={cn(
        'relative mx-3 overflow-hidden rounded-[22px] border border-hair px-5 pb-5 pt-5 sm:mx-4 sm:px-6',
        c.level === 1 && 'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_13%,transparent),color-mix(in_oklab,var(--glacier)_9%,transparent)_60%,transparent)]',
        c.level === 2 && 'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_15%,transparent),color-mix(in_oklab,var(--glacier)_7%,transparent)_65%,transparent)]',
        c.level === 3 && 'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_11%,transparent),color-mix(in_oklab,var(--amber)_11%,transparent)_60%,transparent)]',
        c.level === 4 && 'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_16%,transparent),color-mix(in_oklab,var(--maple)_5%,transparent)_70%,transparent)]',
      )}
    >
      {/* One short sentence for screen readers, instead of announcing the whole card. */}
      <p className="sr-only" role="status" aria-live="polite">
        {t('hero.sr', { country: c.name, level: c.level, name: levelName })}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3" aria-hidden>
        <p className="m-0 flex items-center gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
          <Globe2 className="size-3.5" aria-hidden strokeWidth={2} />
          {t('level.of', { level: c.level })}
        </p>
        <RiskMeter level={c.level} />
      </div>
      <h4 className="m-0 mt-4 font-serif text-[34px] leading-[1.02] tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72] [text-wrap:balance] @xl:text-[42px]">{c.name}</h4>
      <p className={cn('m-0 mt-2 text-[19px] font-semibold leading-snug tracking-[-.01em] [text-wrap:balance]', LEVEL_INK[c.level])}>{levelName}</p>
      {lead ? (
        <p className="m-0 mt-1.5 max-w-[62ch] text-[15px] leading-[1.5] text-ink-2">
          <Feed lang={feed}>{lead}</Feed>
        </p>
      ) : null}
      <p className="m-0 mt-3.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-3">
        <Clock className="mt-px size-3.5 shrink-0" aria-hidden strokeWidth={2} />
        <span>
          {t('hero.updated', { date: updated })}
          {change ? (
            <>
              {' · '}
              <Feed lang={feed}>{change}</Feed>
            </>
          ) : null}
        </span>
      </p>
    </div>
  );
}

function Points({ points, level, feed }: { points: string[]; level: RiskLevel; feed: Lang }) {
  const t = useMessages(messages);
  const more = useShowAll<HTMLLIElement>(POINTS);
  const shown = more.open ? points : points.slice(0, POINTS);
  return (
    <WidgetSection title={t('points.title')}>
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {shown.map((p, i) => (
          <li key={i} {...more.revealed(i)} className={cn('flex gap-2.5 rounded-[8px] text-[14.5px] leading-[1.5] text-ink', REVEAL_FOCUS)}>
            <span className={cn('mt-[8px] size-[6px] shrink-0 rounded-full', LEVEL_FILL[level])} aria-hidden />
            {/* Inline isolate in a block: the text stays next to its dot in a right-to-left page. */}
            <span className="min-w-0 flex-1 text-start">
              <Feed lang={feed}>{p}</Feed>
            </span>
          </li>
        ))}
      </ul>
      {points.length > POINTS ? (
        <ShowAll open={more.open} onToggle={more.toggle} more={t('points.more', { count: points.length - POINTS })} fewer={t('points.fewer')} />
      ) : null}
    </WidgetSection>
  );
}

function Region({ r, feed }: { r: RegionalAdvisory; feed: Lang }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const reason = r.reason.replace(/[\s.;:]+$/, '');
  const short = regionTitle(r);
  // An untitled advisory gets a short title ("14 states: violence and organized crime"); the full reason
  // stays in the body. A reason cut off before its list ("Avoid all travel to") becomes "3 areas".
  const cut = !short && /\b(to|in|into|dans|vers|à|following|suivant(e)?s)$/i.test(reason);
  const title = short ?? (cut ? t('regions.untitled', { count: r.areas.length }) : reason);
  const body = reason && reason !== title;
  const head = (
    <span className="flex min-w-0 items-start gap-3">
      <span className={cn('mt-[7px] size-2.5 shrink-0 rounded-full', LEVEL_FILL[r.level])} aria-hidden />
      <span className="min-w-0 flex-1 text-start">
        <span className="block">
          <Feed lang={cut ? L : feed}>{title}</Feed>
        </span>
        <LevelPill level={r.level} className="mt-1">
          {LEVEL_TEXT[L][r.level]}
        </LevelPill>
      </span>
    </span>
  );
  // Nothing behind the title (no fuller reason, no areas): a plain card, not a toggle that opens on nothing.
  if (!body && !r.areas.length) return <div className="rounded-[16px] border border-hair bg-card px-4 py-3 text-[15px] font-semibold leading-snug text-ink">{head}</div>;
  return (
    <Disclosure
      headingLevel={5}
      className="rounded-[16px] border border-hair bg-card px-4 has-[[aria-expanded=true]]:shadow-sm"
      title={head}
      summary={r.areas.length ? <bdi className="ms-[22px] font-medium">{t('regions.showAreas', { count: r.areas.length })}</bdi> : undefined}
    >
      <div className="-mt-1 border-t border-hair pb-3 pt-3">
        {body ? (
          <p className="m-0 text-[14px] leading-[1.5] text-ink-2">
            <Feed lang={feed}>{t('regions.reason', { reason })}</Feed>
          </p>
        ) : null}
        {r.areas.length ? (
          <ul className="m-0 mt-2 grid list-none gap-1.5 p-0" aria-label={t('regions.areas', { count: r.areas.length })}>
            {r.areas.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-ink">
                <span className={cn('mt-[7px] size-[5px] shrink-0 rounded-full', LEVEL_FILL[r.level])} aria-hidden />
                <span className="min-w-0 flex-1 text-start">
                  <Feed lang={feed}>{a.text}</Feed>
                  {a.except?.length ? (
                    <ul className="m-0 mt-1 grid list-none gap-1 p-0 text-[13px] text-ink-3">
                      {a.except.map((e, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="mt-[9px] h-px w-2 shrink-0 bg-ink-3" aria-hidden />
                          <span className="min-w-0 flex-1 text-start">
                            <Feed lang={feed}>{e}</Feed>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Disclosure>
  );
}
