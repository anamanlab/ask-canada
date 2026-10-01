'use client';
/**
 * One phone line in full: live status, the number to call (tap, Call, Copy), agent and automated hours in the
 * viewer's time, the 24-hour day bar, and the other ways to reach the service behind "more options".
 */
import { PhoneCall } from 'lucide-react';
import { ExternalLink, LinkButton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useTimeFmt } from './clock';
import { CopyButton } from './CopyButton';
import { DayBar } from './DayBar';
import { isOpen } from './hours';
import { LINE_ICON, ORG_TONE, useCallLabels, useHoursText, useTtyNote } from './line-ui';
import { LineMore } from './LineMore';
import messages from './messages';
import type { LineView, Viewer } from './pick';
import { PhoneNumber, telHref } from './primitives';
import { quietStatus, StatusLine, statusSentence, statusTone, useStatusText } from './status';

/** Layout only: the shared button at the cards' 44px row height; long French labels wrap inside the pill. */
const ACTION = 'min-h-11 py-1.5 text-start';

export function LineRow({
  view,
  viewer,
  first,
  defaultOpen,
  legend,
  legendAuto,
  sameAs,
  quiet,
}: {
  view: LineView;
  viewer: Viewer;
  first: boolean;
  /** Start with "more options" open (the line was opened on its own from the overview). */
  defaultOpen: boolean;
  /** The card's first day bar: it carries the "Agents" swatch (`legendAuto`: the "Automated line" swatch). */
  legend?: boolean;
  legendAuto?: boolean;
  /** An earlier row keeps exactly these hours: name it instead of repeating the hours and the day bar. */
  sameAs?: string;
  /** A holiday notice above already says why lines are closed. */
  quiet?: boolean;
}) {
  const t = useMessages(messages);
  const { line, pick, status: s, autoRule, auto, abroadPage } = view;
  const { now, tz, holidays, lang } = viewer;
  const { time } = useTimeFmt(tz);
  const statusText = useStatusText(tz);
  const hours = useHoursText(viewer);
  const { kindLabel, callAria } = useCallLabels(view, lang);
  const ttyNote = useTtyNote(view, lang);

  const status = pick.number ? quietStatus(statusText(s, now), s, !!quiet) : { main: t('status.online') };
  const barLabel = pick.hours ? t('bar.sr', { hours: hours.line(pick.hours), now: time(now), status: statusSentence(status) }) : '';
  const zoneNote = pick.hours ? hours.eastern(pick.hours) : null;
  /**
   * The Anti-Fraud Centre takes reports online at any hour, so that option sits beside Call instead of behind
   * "more options": Call leads while the phones are open, the online report leads while they're closed.
   */
  const report = line.org === 'cafc' ? line.selfServe : undefined;
  const phoneLeads = !report || isOpen(s);
  const reportBtn = report ? (
    // Leading on a phone-width card, it takes the whole first row, with Call and Copy together below it.
    <LinkButton href={report.href[lang]} external variant={phoneLeads ? 'secondary' : 'primary'} size="sm" className={cn(ACTION, !phoneLeads && '@max-sm:w-full')}>
      {t('fraud.reportOnline')}
    </LinkButton>
  ) : null;

  return (
    <li className={cn('px-5 py-5 sm:px-6', !first && 'border-t border-hair')}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3.5">
        <WidgetIcon icon={LINE_ICON[line.id]} tone={ORG_TONE[line.org]} size="sm" />
        <div className="min-w-0">
          <h4 className="m-0 text-[15.5px] font-semibold leading-snug text-ink">
            <bdi>{line.name[lang]}</bdi>
          </h4>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">
            <bdi>{line.covers[lang]}</bdi>
          </p>
        </div>

        {/* Phones: the number block spans the full card width; wider cards indent it under the title. */}
        <div className="col-span-2 min-w-0 @lg:col-span-1 @lg:col-start-2">
          <StatusLine tone={pick.number ? statusTone(s) : 'web'} status={status} className="mt-2.5" />

          {pick.number ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                {/* Tappable for touch and named like the Call button, so exploring by touch never lands on silence; the Call button stays the one tab stop. */}
                <a
                  href={telHref(pick.number)}
                  tabIndex={-1}
                  aria-label={callAria}
                  // The lead number is the card's focal point: set larger than the lines that follow it.
                  className={cn('group inline-flex min-h-11 items-center gap-2 rounded-field font-serif text-ink no-underline', first ? 'text-[32px] tracking-[-.02em] @lg:text-[36px]' : 'text-[26px] tracking-[-.01em]', 'leading-none')}
                >
                  <PhoneNumber number={pick.number} className="underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-hair-2" />
                </a>
                {kindLabel ? <span className="rounded-chip bg-paper-2 px-2 py-0.5 text-[12px] font-medium text-ink-2">{kindLabel}</span> : null}
                <div className={cn('relative flex flex-wrap gap-2 @xl:ms-auto', !phoneLeads && '@max-sm:w-full')}>
                  {phoneLeads ? null : reportBtn}
                  <LinkButton href={telHref(pick.number)} variant={phoneLeads ? 'primary' : 'secondary'} size="sm" icon={PhoneCall} aria-label={callAria} className={ACTION}>
                    {t('call.button')}
                  </LinkButton>
                  <CopyButton value={pick.number} label={t('copy.button')} doneLabel={t('copy.done')} ariaLabel={t('copy.aria', { number: pick.number })} />
                  {phoneLeads ? reportBtn : null}
                </div>
              </div>
              {ttyNote ? (
                <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">
                  <bdi>{ttyNote}</bdi>
                </p>
              ) : null}
              {abroadPage ? (
                <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">
                  {/* One isolate, so the sentence and its link keep their order on a right-to-left page. */}
                  <bdi>
                    {t('abroad.note')} <ExternalLink href={abroadPage.href[lang]}>{t('abroad.noteLink')}</ExternalLink>
                  </bdi>
                </p>
              ) : null}
              {pick.hours && sameAs ? (
                <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">
                  <bdi>{t('hours.same', { name: sameAs })}</bdi>
                </p>
              ) : pick.hours ? (
                <>
                  {/* Each hours sentence is one isolate (label, days, range, zone note), so it keeps its order in RTL pages. */}
                  <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">
                    <bdi>
                      <span className="font-medium text-ink-2">{t('hours.agents')}</span> {hours.node(pick.hours)}
                      {zoneNote ? (
                        <>
                          {' '}
                          <span className="whitespace-nowrap">{zoneNote}</span>
                        </>
                      ) : null}
                    </bdi>
                  </p>
                  {report ? (
                    <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">
                      <bdi>
                        <span className="font-medium text-ink-2">{t('hours.online')}</span> {t('hours.anyTime')}
                      </bdi>
                    </p>
                  ) : null}
                  {autoRule && auto ? (
                    <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">
                      <bdi>
                        <span className="font-medium text-ink-2">{t('hours.automated')}</span> {hours.node(autoRule)}
                        {isOpen(auto) && !isOpen(s) ? (
                          <>
                            {' '}
                            <span className="ms-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-chip bg-pine-wash px-2 py-px align-[1px] text-[12px] font-medium leading-[18px] text-pine">
                              <span className="size-1.5 rounded-full bg-pine" aria-hidden />
                              {t('hours.autoOpen')}
                            </span>
                          </>
                        ) : null}
                      </bdi>
                    </p>
                  ) : null}
                  <DayBar agents={pick.hours} automated={autoRule} now={now} tz={tz} holidays={holidays} label={barLabel} legend={legend} legendAuto={legendAuto} />
                </>
              ) : null}
              <LineMore view={view} viewer={viewer} defaultOpen={defaultOpen} />
            </>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {line.selfServe ? (
                <LinkButton href={line.selfServe.href[lang]} external variant="primary" size="sm" className={ACTION}>
                  {line.selfServe.label[lang]}
                </LinkButton>
              ) : null}
              <LinkButton href={line.page[lang]} external variant="secondary" size="sm" className={ACTION}>
                {t('web.contactPage')}
              </LinkButton>
              <p className="m-0 w-full text-[13px] leading-snug text-ink-3">
                <bdi>{t(`web.why.${line.org}`)}</bdi>
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
