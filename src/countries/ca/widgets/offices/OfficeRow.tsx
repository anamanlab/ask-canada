'use client';
/**
 * One office in the finder's list: number (pin shape = office kind), name and distance (the widget's serif
 * voice), kind and street, the live status with the estimated wait as the row's loudest figure, and (while
 * closed) one quiet line of the passport services that matter for the chosen filter.
 * Opening it puts the full address right under the name (the street is never said twice) and reveals OfficeDetail; the open (or map-selected) office reads as one raised card, button and
 * details together, with its number in the map's accent colour.
 */
import { useId } from 'react';
import { BookmarkCheck, ChevronDown, Hourglass, PhoneCall } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { OfficeStatus } from './hours';
import messages from './messages';
import { OfficeDetail, type OfficeAlt } from './OfficeDetail';
import { useSavedOffices } from './saved';
import { PASSPORTISH } from './search';
import { BADGE_FIT, KIND_SHAPE, PIN_CLS, PIN_ON_CLS, STATUS_DOT, STATUS_TEXT, statusTone, useKm, useLang, useStatusText } from './shared';
import type { Need, PassportTier, ResultOffice } from './types';

export function OfficeRow({
  office: o,
  index,
  status: s,
  need,
  open,
  selected,
  onToggle,
  onOpened,
  now,
  alt,
}: {
  office: ResultOffice;
  index: number;
  status: OfficeStatus;
  need: Need;
  open: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  /** Called with this row's element once it is open and its details are rendered, and with null when it closes. */
  onOpened: (id: string, el: HTMLLIElement | null) => void;
  now: number;
  /** For an office that is closed or has no visits: the nearest one in service, one tap away. */
  alt?: OfficeAlt;
}) {
  const t = useMessages(messages);
  const km = useKm();
  const lang = useLang();
  const st = useStatusText();
  const id = useId();
  const tone = statusTone(s);
  const isSaved = useSavedOffices().isSaved(o.id);
  const active = open || selected;
  const tiers: PassportTier[] = need === 'biometrics' ? [] : (o.pp ?? []).filter((p) => PASSPORTISH.includes(need) || p === 'urgent' || p === 'express');
  const street = (o.lines[lang].find((l) => /^\d/.test(l)) ?? o.lines[lang].find((l) => /\d/.test(l)) ?? o.lines[lang][0] ?? '').replace(/,?\s*\(.*?\)/g, '');
  const cityLine = `${o.city[lang]}, ${o.prov}${o.postal ? ` ${o.postal}` : ''}`;
  const shape = KIND_SHAPE[o.kind];
  const wait = s.wait ? st.wait(s.wait) : null;
  const services = [...tiers.map((p) => `chip.${p}`), ...(o.bio && need === 'biometrics' ? ['tier.bio'] : [])];
  const brief = tiers.length > 1;
  return (
    <li
      // Attached only while open, so it runs in the commit that put the details on screen.
      ref={
        open
          ? (el) => {
              onOpened(o.id, el);
              return () => onOpened(o.id, null);
            }
          : undefined
      }
      className={cn(
        'scroll-mt-4 border-t border-hair transition-[background-color,box-shadow] first:border-t-0',
        // One raised card for the whole office; the dividers on either side step aside.
        active && 'rounded-tile border-transparent bg-card shadow-md ring-1 ring-inset ring-hair-2 dark:bg-paper-2 [&+li]:border-transparent',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-d`}
        onClick={() => onToggle(o.id)}
        className={cn(
          'flex w-full items-start gap-3 rounded-tile px-3 py-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
          !active && 'hover:bg-paper-2',
        )}
      >
        <span
          className={cn('mt-px grid size-7 shrink-0 place-items-center text-[13px] font-bold tabular-nums', (selected ? PIN_ON_CLS : PIN_CLS)[shape], shape === 'square' && 'rounded-[8px]')}
          aria-hidden
        >
          {index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 font-serif text-[20px] leading-[1.2] tracking-[-.015em] text-ink">
              {o.short[lang]}
              {/* Saved on this device: the bookmark follows the name wherever the office is listed. */}
              {isSaved ? (
                <>
                  <BookmarkCheck className="ms-1.5 inline-block size-4 align-[-0.15em] text-pine" strokeWidth={2.2} aria-hidden />
                  <span className="sr-only"> ({t('detail.saved')})</span>
                </>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-serif text-[18px] leading-none tracking-[-.01em] text-ink">
              <bdi dir="ltr">{km(o.km)}</bdi>
              <ChevronDown className={cn('size-4 text-ink-3 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')} strokeWidth={2} aria-hidden />
            </span>
          </span>
          {/* Kind · street. When the street wraps to its own line the dot stays behind: it sits in the gap before
              its phrase, and at a line's start that gap falls outside the clipped box (either direction). */}
          <span className="mt-1 block overflow-hidden text-[13.5px] leading-snug text-ink-2">
            {open ? (
              // Open: the kind, then the whole address right under the name (bdi keeps each line's own order).
              <>
                <span className="block">{t(`kind.${o.kind}`)}</span>
                <span className="mt-1.5 block text-[14.5px] leading-[1.45] text-ink">
                  {[...o.lines[lang], cityLine].map((l, i) => (
                    <span key={i} className="block">
                      <bdi>{l}</bdi>
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="-ms-3.5 flex flex-wrap">
                <span className="ps-3.5">{t(`kind.${o.kind}`)}</span>
                <span className="relative min-w-0 ps-3.5 before:absolute before:start-0 before:w-3.5 before:text-center before:content-['·']">
                  <bdi>{street}</bdi>
                </span>
              </span>
            )}
          </span>
          <span className={cn('mt-2 flex items-start gap-2 text-[14px] font-medium leading-snug', STATUS_TEXT[tone])}>
            <span className={cn('relative mt-[6px] size-2 shrink-0 rounded-full', STATUS_DOT[tone])} aria-hidden>
              {/* The chosen office's "open" dot breathes: the status is live, not a printed timetable. */}
              {selected && tone === 'open' ? <span className="absolute inset-0 rounded-full bg-pine opacity-60 motion-safe:animate-ping [animation-duration:2.4s]" /> : null}
            </span>
            {/* Each phrase is one flex item, so it wraps as a unit and the two never interleave (RTL included).
                The item follows the row's direction, so a phrase that wraps lines up on the dot's side; the
                bdi inside keeps the phrase's own word order. */}
            <span className="flex min-w-0 flex-wrap gap-x-2 text-start">
              <span>
                <bdi>{st.main(s)}</bdi>
              </span>
              {s.state !== 'open' && s.state !== 'closing-soon' && s.state !== 'lunch' && s.next ? (
                <span className="font-normal text-ink-2">
                  <bdi>{t('status.opens', { when: st.when(s.next) })}</bdi>
                </span>
              ) : null}
            </span>
          </span>
          {/* The wait is what people compare offices by: the length is the row's loudest figure after the name. */}
          {wait ? (
            <span className="mt-2 flex">
              {/* Always one line, one pill: phones get the short wording, screen readers always the full one. */}
              <span className="inline-flex max-w-full items-baseline gap-x-1.5 whitespace-nowrap rounded-chip bg-paper-2 px-2.5 py-1 text-[13px] leading-snug text-ink-2 ring-1 ring-inset ring-hair">
                <Hourglass className="size-3.5 shrink-0 self-center text-ink-3 @max-xs:hidden" strokeWidth={2} aria-hidden />
                <bdi className="text-[15px] font-semibold tabular-nums tracking-[-.01em] text-ink">{wait.length}</bdi>
                <bdi className="sr-only @md:not-sr-only">{wait.rest}</bdi>
                <bdi className="@md:hidden" aria-hidden>
                  {wait.short}
                </bdi>
              </span>
            </span>
          ) : null}
          {o.apptOnly ? (
            <span className="mt-2 flex">
              <Badge tone="warn" icon={PhoneCall} className={BADGE_FIT}>
                {t('tier.apptOnly')}
              </Badge>
            </span>
          ) : null}
          {/* Closed row: the services as one quiet line. Open: the detail lists them, so they aren't said twice. */}
          {services.length && !open ? (
            <span className="mt-1.5 block text-[13px] leading-snug text-ink-2">
              {tiers.length ? <span className="sr-only">{t('chip.prefix')} </span> : null}
              {/* Phones: several services get short labels after a visible "Passports:", so "10 days" never
                  stands alone; one service keeps its full wording. Screen readers always get the full line. */}
              <bdi className={cn(brief && 'sr-only @md:not-sr-only')}>{services.map((k) => t(k)).join(' · ')}</bdi>
              {brief ? (
                <bdi className="@md:hidden" aria-hidden>
                  {t('chip.prefix.short')} {services.map((k) => t(`${k}.short`)).join(' · ')}
                </bdi>
              ) : null}
            </span>
          ) : null}
        </span>
      </button>
      <div id={`${id}-d`} hidden={!open} className="px-3">
        {open ? <OfficeDetail office={o} status={s} now={now} need={need} alt={alt} /> : null}
      </div>
    </li>
  );
}
