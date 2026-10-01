'use client';
/**
 * "Who to call": verified federal phone lines with hours shown in the viewer's own time, a live
 * open/closed status (weekends + federal holidays), a 24-hour day bar, TTY and international numbers,
 * and the self-service option to try first.
 */
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronDown, ChevronLeft, Phone } from 'lucide-react';
import { Button, ExternalLink, LiveRegion, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { useClock, useLang } from './clock';
import { CompactCard } from './CompactCard';
import { FILTERS, LINES, TOPIC_LINES, craLeads, type LineId, type Topic } from './data';
import { AccessOptions, DirectoryNotices, TryFirst, UrgentStrip } from './DirectoryParts';
import { regionOf, zoneCity } from './hours';
import { LineRow } from './LineRow';
import messages from './messages';
import { autoLegendLine, dayNotice, handoffPage, leadsNorth, legendLine, nextOpening, openSummary, sameHoursAs, ttyFirst, viewLine, type Viewer } from './pick';
import { DirectorySkeleton } from './skeletons/DirectorySkeleton';
import { sourcesFor } from './sources';
import { StatusPill, statusSentence, statusTone, useStatusText, useWhenText } from './status';
import { TopicRail } from './TopicRail';
import type { DirectoryInput, DirectoryOutput } from './types';

/** Phones: a long overview shows this many lines, then "Show all". */
const LIMIT = 4;

export function ContactDirectory({ part }: WidgetProps<DirectoryInput, DirectoryOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: t('error.href'), label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <DirectorySkeleton topic={part.input?.topic} />;
  }
  return <Directory data={part.output} />;
}

function Directory({ data }: { data: DirectoryOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { now, tz } = useClock(data);
  const [topic, setTopic] = useState<Topic | 'all'>(data.topic);
  /** "Details" on an overview card opens that one line in full. */
  const [focus, setFocus] = useState<LineId | null>(null);
  const [showAll, setShowAll] = useState(false);
  const backButton = useRef<HTMLButtonElement>(null);
  const detailButtons = useRef(new Map<LineId, HTMLButtonElement>());
  const [ttyPref, saveTty, clearTty] = useDeviceItem<boolean>('contact:tty', { label: t('saved.tty'), kind: 'preference' });
  /** This card's own TTY switch, once touched: it can turn TTY off here even when the answer asked for it. */
  const [ttyOverride, setTtyOverride] = useState<boolean | null>(null);
  const statusText = useStatusText(tz);
  /** Same relative wording as the status pills: "tomorrow at 8 a.m." or "Monday at 8 a.m.". */
  const whenText = useWhenText(tz);

  const tty = ttyFirst(data.tty, ttyPref, ttyOverride);
  // Toll-free numbers cover Canada and the United States; the international ones are for everywhere else.
  const region = regionOf(tz);
  const abroad = data.pinned ? data.abroad : data.abroad || region === 'intl';
  const us = data.pinned ? !!data.us : !abroad && region === 'us';
  const listed = (topic === data.topic ? data.lines : TOPIC_LINES[topic]).filter((id) => id in LINES);
  const ids = focus ? [focus] : listed;
  const viewer: Viewer = { now, tz, holidays: data.holidays, lang };
  const views = ids.map((id) => viewLine(id, { tty, abroad, us, north: data.north && leadsNorth(id, ids), lang }, viewer, ids));

  const day = dayNotice(ids, viewer);
  const holiday = day?.kind === 'holiday';
  const reopens = nextOpening(views.map((x) => x.status));
  const { total, open, single, closing, allClosed } = openSummary(views);
  const singleText = single ? statusText(single.status, now) : null;
  // Nothing answering (an ordinary night or weekend): say so once, with the first reopening, instead of leaving it to nine pills.
  const closedText = allClosed ? (reopens ? t('dir.badgeAllClosed', { when: whenText(now, reopens) }) : t('dir.badgeAllClosedNoDate')) : null;
  const countText = open ? t(closing ? 'dir.badgeClosing' : 'dir.badge', { open, total }) : closedText;
  // A lone phone line beside an online-only row gets no badge; on a holiday the notice already says it all.
  const badgeText = singleText ? (ids.length > 1 ? null : singleText.sub ? t('dir.badgeOne', { main: singleText.main, sub: singleText.sub }) : singleText.main) : countText;
  const compact = ids.length > 3;
  const long = compact && !focus && ids.length > LIMIT + 1;
  const legendId = legendLine(views);
  const autoLegendId = autoLegendLine(views, viewer);
  const badge = holiday || !badgeText ? null : <StatusPill tone={single ? statusTone(single.status) : allClosed ? 'closed' : closing ? 'closing' : 'open'}>{badgeText}</StatusPill>;
  const filters = data.topic === 'service-canada' ? (['all', 'service-canada', ...FILTERS.slice(1)] as const) : FILTERS;

  const openDetails = (id: LineId) => {
    // Render the single line now, so focus can move to its "Back" button in the same keypress.
    flushSync(() => setFocus(id));
    backButton.current?.focus();
  };
  const closeDetails = () => {
    const from = focus;
    flushSync(() => setFocus(null));
    if (from) detailButtons.current.get(from)?.focus();
  };

  return (
    <WidgetShell
      icon={Phone}
      tone="pine"
      title={t('dir.title')}
      subtitle={t('dir.subtitle', { city: zoneCity(tz, lang) })}
      badge={badge ?? undefined}
      sources={sourcesFor(ids, lang)}
      secondaryAction={
        <ExternalLink
          href={handoffPage(ids, topic, focus)[lang]}
          standalone
          className="-ms-1 rounded-chip px-1 text-[14.5px] underline-offset-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {/* A flex row (44px target): the label is one item, so its last space isn't lost before the arrow. */}
          <span>{t('dir.handoff')}</span>
        </ExternalLink>
      }
      className="@container"
    >
      {/* The shell drops its header badge on phone-width windows (its `sm` breakpoint): the answer to "is it open?" leads the body instead. */}
      {badge ? <div className="-mt-1 mb-3 px-5 sm:hidden">{badge}</div> : null}

      <DirectoryNotices day={day} reopens={reopens ? whenText(now, reopens) : undefined} abroad={abroad} us={us && ids.some((id) => LINES[id].agents?.zone === 'local')} lang={lang} />

      <TopicRail
        topics={filters}
        value={topic}
        onChange={(next) => {
          setTopic(next);
          setFocus(null);
          setShowAll(false);
        }}
      />

      <LiveRegion text={singleText ? statusSentence(singleText) : (countText ?? '')} />

      {focus ? (
        <div className="mt-2 px-4 sm:px-5">
          <Button ref={backButton} variant="quiet" size="sm" onClick={closeDetails} className="min-h-11 gap-1 ps-2 pe-3.5 text-ink-2">
            <ChevronLeft className="size-4 flip-rtl" strokeWidth={2.2} aria-hidden />
            {t('focus.back')}
          </Button>
        </div>
      ) : null}

      {craLeads(ids) && !focus ? <TryFirst lang={lang} /> : null}

      {compact ? (
        <>
          <ul className="m-0 mt-3 grid list-none gap-2.5 px-5 sm:px-6 @xl:grid-cols-2" aria-label={t(`topic.${topic}`)}>
            {views.map((view, i) => {
              const id = view.line.id;
              return (
                <CompactCard
                  key={id}
                  view={view}
                  viewer={viewer}
                  quiet={holiday}
                  wide={views.length % 2 === 1 && i === views.length - 1}
                  className={long && !showAll && i >= LIMIT ? '@max-xl:hidden' : undefined}
                  onOpen={() => openDetails(id)}
                  detailsRef={(el) => {
                    if (el) detailButtons.current.set(id, el);
                    else detailButtons.current.delete(id);
                  }}
                />
              );
            })}
          </ul>
          {long ? (
            <div className="mt-2 px-5 sm:px-6 @xl:hidden">
              {/* Same affordance as the card's other disclosures: the chevron sits at the end and turns when open. */}
              <Button variant="secondary" size="sm" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)} className="min-h-11 w-full justify-between ps-4 pe-3">
                {showAll ? t('list.showFewer') : t('list.showAll', { count: ids.length })}
                <ChevronDown className={cn('size-4 text-ink-2 transition-transform duration-300 motion-reduce:transition-none', showAll && 'rotate-180')} aria-hidden />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <ul className={cn('m-0 list-none p-0', focus ? 'mt-0' : 'mt-1')} aria-label={focus ? LINES[focus].name[lang] : t(`topic.${topic}`)}>
          {views.map((view, i) => {
            const same = sameHoursAs(views, i);
            return (
              <LineRow
                key={`${focus ?? topic}-${view.line.id}`}
                view={view}
                viewer={viewer}
                first={i === 0}
                defaultOpen={!!focus}
                legend={view.line.id === legendId}
                legendAuto={view.line.id === autoLegendId}
                sameAs={same ? LINES[same].name[lang] : undefined}
                quiet={holiday}
              />
            );
          })}
        </ul>
      )}

      <AccessOptions tty={tty} onTtyChange={(on) => {
          setTtyOverride(on);
          // Only "on" is remembered: a saved "off" must never hide TTY numbers from someone who asks for them later.
          if (on) saveTty(true, { detail: t('saved.on') });
          else clearTty();
        }} className={compact ? 'mt-4' : 'mt-1'} />

      <UrgentStrip lang={lang} />
    </WidgetShell>
  );
}
