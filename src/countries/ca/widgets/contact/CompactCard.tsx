'use client';
/** Overview card (many lines): name, live status, number and a tap to call; "Details" opens the line in full. */
import type { Ref } from 'react';
import { PhoneCall } from 'lucide-react';
import { Button, ExternalLink, LinkButton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { isOpen } from './hours';
import { LINE_ICON, ORG_TONE, useCallLabels, useTtyNote } from './line-ui';
import messages from './messages';
import type { LineView, Viewer } from './pick';
import { PhoneNumber, telHref } from './primitives';
import { quietStatus, StatusLine, statusTone, useStatusText } from './status';

export function CompactCard({
  view,
  viewer,
  quiet,
  wide,
  className,
  onOpen,
  detailsRef,
}: {
  view: LineView;
  viewer: Viewer;
  quiet?: boolean;
  /** The odd card out in the two-column grid: it spans both columns, with the number and its actions beside the name. */
  wide?: boolean;
  className?: string;
  onOpen: () => void;
  /** The "Details" button, so focus can return to it when the person comes back to the list. */
  detailsRef: Ref<HTMLButtonElement>;
}) {
  const t = useMessages(messages);
  const { line, pick, status: s, auto, abroadPage } = view;
  const { now, tz, lang } = viewer;
  const statusText = useStatusText(tz);
  const { kindLabel, callAria } = useCallLabels(view, lang);
  const ttyNote = useTtyNote(view, lang);
  return (
    // Two columns: each card spans three shared rows (title / status and notes / number), so neighbours line up
    // row for row whatever one of them leaves out. The odd card out keeps its own side-by-side layout.
    <li
      className={cn(
        'flex flex-col rounded-tile border border-hair bg-card px-4 py-3.5',
        wide ? '@xl:col-span-2 @xl:grid @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-center @xl:gap-x-6' : '@xl:row-span-3 @xl:grid @xl:grid-rows-subgrid @xl:gap-y-0',
        className,
      )}
    >
      <div className={cn('flex items-start gap-3', wide && '@xl:min-w-0')}>
        <WidgetIcon icon={LINE_ICON[line.id]} tone={ORG_TONE[line.org]} size="sm" />
        <div className="min-w-0 flex-1">
          <h4 className="m-0 text-[15px] font-semibold leading-snug text-ink">
            <bdi>{line.name[lang]}</bdi>
          </h4>
          <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">
            <bdi>{line.covers[lang]}</bdi>
          </p>
        </div>
      </div>
      <div className={cn('mt-2.5 flex flex-col items-start gap-1', wide && '@xl:col-start-1 @xl:ps-[46px]')}>
        <StatusLine stacked tone={pick.number ? statusTone(s) : 'web'} status={pick.number ? quietStatus(statusText(s, now), s, !!quiet) : { main: t('status.online') }} />
        {pick.number && auto && !isOpen(s) && isOpen(auto) ? <span className="ps-0.5 text-[12.5px] font-medium text-pine">{t('compact.autoOpen')}</span> : null}
        {ttyNote ? (
          <bdi className="ps-0.5 text-[12.5px] leading-snug text-ink-2">{ttyNote}</bdi>
        ) : null}
        {abroadPage ? (
          <span className="ps-0.5 text-[12.5px] leading-snug">
            <ExternalLink href={abroadPage.href[lang]}>{t('abroad.compact')}</ExternalLink>
          </span>
        ) : null}
      </div>
      <div className={cn('mt-auto flex items-center justify-between gap-2 pt-2.5', wide && '@xl:col-start-2 @xl:row-span-2 @xl:row-start-1 @xl:mt-0 @xl:gap-5 @xl:pt-0')}>
        {pick.number ? (
          // Tappable for touch and named like the round Call button, which stays the one tab stop. The kind chip
          // ("TTY") always sits under the number, so every card in the grid stacks the same way, the wide one included.
          <a href={telHref(pick.number)} tabIndex={-1} aria-label={callAria} className="inline-flex min-h-11 min-w-0 flex-col items-start justify-center gap-y-1 font-serif text-[22px] leading-none text-ink no-underline">
            <PhoneNumber number={pick.number} />
            {kindLabel ? <span className="rounded-chip bg-paper-2 px-1.5 py-0.5 font-sans text-[11.5px] font-medium text-ink-2">{kindLabel}</span> : null}
          </a>
        ) : (
          // An inline link (not a flex row): a long French label wraps as text and the arrow stays glued to its last word.
          <span className="min-w-0 text-[14px] leading-snug">
            <ExternalLink href={line.selfServe?.href[lang] ?? line.page[lang]}>{line.selfServe?.label[lang] ?? t('web.contactPage')}</ExternalLink>
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Button ref={detailsRef} variant="quiet" size="sm" onClick={onOpen} aria-label={t('compact.detailsSr', { name: line.name[lang] })} className="min-h-11 px-3 text-ink-2">
            {t('compact.details')}
          </Button>
          {pick.number ? <LinkButton href={telHref(pick.number)} variant="primary" size="sm" icon={PhoneCall} aria-label={callAria} className="size-11 min-h-11 rounded-full px-0" /> : null}
        </div>
      </div>
    </li>
  );
}
