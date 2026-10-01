'use client';
/**
 * One office, expanded (its address sits in the row above, right under the name). Compact by default: the
 * hours that the status line doesn't already say (the next opening when it is closed or over for the day; a
 * lunch break as two windows), the two most relevant passport services and the actions: Directions (the one
 * primary button, and it names where it goes: Google Maps), then the official office page and Save as quiet
 * buttons that always share a row (several offices can be saved; each change is announced). The week's hours,
 * language and access facts (plus any other passport services) sit behind one disclosure so a phone never
 * scrolls through a full table per office.
 */
import { Accessibility, ArrowRight, Bookmark, BookmarkCheck, Car, Languages, Navigation, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { Button, Disclosure, LinkButton, LiveRegion, Notice } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { EXPRESS_DAYS, officeUrl } from './data';
import { hasSchedule, nextVisits, upcomingDays, type DayRow, type OfficeStatus } from './hours';
import messages from './messages';
import { useSavedOffices } from './saved';
import { telHref, useLang, useTime } from './shared';
import type { Need, PassportTier, ResultOffice } from './types';

const TIERS: PassportTier[] = ['urgent', 'express', 'pickup10', 'mail20'];
/** The quiet actions beside Directions: text-sized, 44px tall. */
const QUIET = 'justify-self-start whitespace-nowrap px-2 text-[14.5px] @md:px-3';
type Service = PassportTier | 'bio';
/** The nearest office in service, offered when this one is closed or has no visits scheduled. */
export type OfficeAlt = { name: string; km: string; onSelect: () => void };

export function OfficeDetail({ office: o, status, now, need, alt }: { office: ResultOffice; status: OfficeStatus; now: number; need: Need; alt?: OfficeAlt }) {
  const t = useMessages(messages);
  const { fmt, intl } = useLocale();
  const lang = useLang();
  const time = useTime();
  const saved = useSavedOffices();
  const isSaved = saved.isSaved(o.id);
  const [savedNote, setSavedNote] = useState('');

  const destination = [...o.lines.en.filter((l) => /\d/.test(l)), o.city.en, o.prov, o.postal ?? '', 'Canada'].filter(Boolean).join(', ');
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const outreach = o.kind === 'outreach';
  const days = outreach ? [] : upcomingDays(o, now, 7);
  const visits = outreach ? nextVisits(o, now, 3) : [];
  // Closed until further notice, or no visits on the calendar: nobody should set out for this address, so the
  // notice comes first, the services step aside and Directions stops being the primary action.
  const noVisits = outreach && !(hasSchedule(o) && visits.length);
  const inactive = status.state === 'temp-closed' || noVisits;
  const range = (a: string, b: string) => `${time(a)} – ${time(b)}`;
  const dayName = (iso: string) => fmt.date(iso, { weekday: 'short', month: 'short', day: 'numeric' });

  // Today, plus the next day it opens if today is closed or over.
  const today = days[0];
  const next = status.next;
  const nextOpen = next && next.inDays > 0 ? days.find((d) => d.date === next.date) : undefined;
  // While it is open, the status line already says until when; today's row only adds something when the day
  // has a break in it (lunch), which the row shows as two windows.
  const openNow = status.state === 'open' || status.state === 'closing-soon';
  const glance = openNow && (today?.windows.length ?? 0) < 2 ? [] : [today, nextOpen].filter((d): d is DayRow => Boolean(d));
  // After closing time, today's hours are history: mute them and put the weight on the next opening.
  const todayOver = Boolean(today?.windows.length) && status.state === 'closed' && (!status.next || status.next.inDays > 0);
  const boldDate = glance[todayOver && glance.length > 1 ? 1 : 0]?.date;

  // Services, most relevant first: what they asked for, then urgent → mail.
  const services: Service[] = [...TIERS.filter((p) => o.pp?.includes(p)), ...(o.bio ? (['bio'] as const) : [])];
  const want: Service | undefined = need === 'biometrics' ? 'bio' : need === 'passport-urgent' ? 'urgent' : need === 'passport-express' ? 'express' : undefined;
  if (want && services.includes(want)) services.splice(0, 0, ...services.splice(services.indexOf(want), 1));
  const shown = inactive ? [] : services.slice(0, 2);
  const rest = inactive ? [] : services.slice(2);

  // `split`: each window on its own line, the lunch break left out (today's row). The week keeps the posted
  // hours, with the lunch break as one line under the table.
  const cell = (d: DayRow, past = false, split = false) =>
    d.windows.length ? (
      <span className={past ? 'font-normal text-ink-3' : 'text-ink'}>
        {split ? (
          d.windows.map(([a, b]) => (
            <span key={a} className="block">
              <bdi>{range(a, b)}</bdi>
            </span>
          ))
        ) : (
          <bdi>{d.posted.map(([a, b]) => range(a, b)).join(', ')}</bdi>
        )}
        {past ? <span className="block text-[13px]">{t('detail.closedNow')}</span> : null}
      </span>
    ) : d.holiday ? (
      <span className="text-maple-ink">{t('detail.closedHoliday', { holiday: d.holiday.name[lang] })}</span>
    ) : d.closed ? (
      <span className="text-maple-ink">{t('detail.closedTemp')}</span>
    ) : (
      <span className="text-ink-3">{t('detail.closed')}</span>
    );

  const row = (d: DayRow, bold: boolean, label?: string, past = false, split = false) => (
    <tr key={d.date} className={cn('border-t border-hair first:border-t-0', bold && 'font-semibold')}>
      <th scope="row" className={cn('whitespace-nowrap py-2 pe-3 align-top text-start font-normal', bold ? 'font-semibold text-ink' : past ? 'text-ink-3' : 'text-ink-2')}>
        {label ?? dayName(d.date)}
      </th>
      <td className="py-2 text-end align-top tabular-nums">{cell(d, past, split)}</td>
    </tr>
  );

  const express = o.expressDays ?? EXPRESS_DAYS;
  const serviceCard = (s: Service) => (
    <li key={s} className="rounded-tile border border-hair bg-card px-3.5 py-2.5">
      {/* Each line keeps its own order in a right-to-left page ("20 business days by mail" starts with a number). */}
      <span className="block text-[14px] font-medium text-ink">
        <bdi>{t(`tier.${s}`)}</bdi>
      </span>
      <span className="block text-[13px] leading-snug text-ink-2">
        <bdi>{s === 'express' ? t('tier.express.sub', { from: express[0], to: express[1] }) : t(`tier.${s}.sub`)}</bdi>
      </span>
    </li>
  );

  const signs = o.sign?.length ? new Intl.ListFormat(intl, { type: 'conjunction' }).format(o.sign.map((s) => t(`detail.sign.${s}`))) : '';

  const accessList = (
    <ul className="m-0 mt-3 grid list-none gap-1.5 p-0 text-[14px] text-ink-2">
      <li className="flex items-start gap-2">
        <Languages className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        <span>{t('detail.languagesLine', { langs: o.lang.length === 2 ? 'both' : (o.lang[0] ?? 'en'), sign: signs ? 'yes' : 'none', signs })}</span>
      </li>
      {o.wheelchair ? (
        <li className="flex items-start gap-2">
          <Accessibility className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <span>{t('detail.wheelchair')}</span>
        </li>
      ) : null}
      {o.parking ? (
        <li className="flex items-start gap-2">
          <Car className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <span>{t(`detail.parking.${o.parking}`)}</span>
        </li>
      ) : null}
    </ul>
  );

  return (
    <div className="pb-4 @md:ps-10 [&>:first-child]:mt-0">
      {o.closure && status.state === 'temp-closed' ? (
        <Notice tone="danger" className="mb-3">
          {o.closure.to
            ? t('detail.closureUntil', {
                from: fmt.date(o.closure.from, { month: 'long', day: 'numeric' }),
                to: fmt.date(o.closure.to, { month: 'long', day: 'numeric' }),
                cause: o.closure.cause[lang].toLowerCase(),
              })
            : t('detail.closure', { date: fmt.date(o.closure.from, { month: 'long', day: 'numeric', year: 'numeric' }), cause: o.closure.cause[lang].toLowerCase() })}
        </Notice>
      ) : null}
      {noVisits ? (
        <Notice tone="warn" className="mb-3">
          {t('detail.noVisits')}
        </Notice>
      ) : null}
      {inactive && alt ? (
        <p className="m-0 mb-3 flex flex-wrap items-center gap-x-2 text-[14px] leading-snug text-ink-2">
          <span>{t('detail.alt')}</span>
          <button
            type="button"
            onClick={alt.onSelect}
            className="-mx-1.5 inline-flex min-h-11 items-center gap-1 rounded-chip px-1.5 font-semibold text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            <bdi>{t('detail.alt.go', { name: alt.name, km: alt.km })}</bdi>
            <ArrowRight className="size-4 flip-rtl" aria-hidden />
          </button>
        </p>
      ) : null}
      {o.note ? <p className="m-0 text-[13px] leading-snug text-ink-2">{o.note[lang]}</p> : null}
      {o.geo === 'city' ? <p className="m-0 mt-1 text-[13px] text-ink-2">{t('detail.approx')}</p> : null}

      {o.apptOnly ? (
        <Notice tone="warn" icon={PhoneCall} className="mt-3" title={t('detail.apptOnly.title')}>
          {o.apptOnly.phone ? (
            <>
              {t('detail.apptOnly.call')}{' '}
              <a href={telHref(o.apptOnly.phone)} className="whitespace-nowrap font-medium text-ink">
                <bdi dir="ltr">{o.apptOnly.phone}</bdi>
              </a>
            </>
          ) : (
            t('detail.apptOnly.page')
          )}
        </Notice>
      ) : null}

      {!outreach ? (
        glance.length ? (
          <table className="mt-2 w-full border-collapse border-t border-hair text-[14px]">
            <caption className="sr-only">{t('detail.glanceLabel')}</caption>
            <tbody>{glance.map((d, i) => row(d, d.date === boldDate, i === 0 ? t('detail.today') : undefined, i === 0 && todayOver, i === 0))}</tbody>
          </table>
        ) : null
      ) : noVisits ? null : (
        <div className="mt-4">
          <h4 className="m-0 mb-2 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">{t('detail.visits')}</h4>
          <ul className="m-0 list-none p-0 text-[14px]">
            {visits.map((v) => (
              <li key={v.date} className="flex justify-between gap-3 border-t border-hair py-1.5 first:border-t-0">
                <span className="text-ink-2">{fmt.date(v.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span className="tabular-nums text-ink">
                  <bdi>{range(v.open, v.close)}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shown.length ? (
        <div className="mt-4">
          <h4 className="m-0 mb-2 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
            {t(shown.includes('bio') ? (shown.length > 1 ? 'detail.passportBio' : 'detail.bio') : 'detail.passport')}
          </h4>
          <ul className="m-0 grid list-none gap-1.5 p-0 @xl:grid-cols-2">{shown.map(serviceCard)}</ul>
        </div>
      ) : null}

      {!outreach ? (
        <Disclosure
          lazy
          className="mt-3"
          title={
            <span className="min-w-0 text-[14px] font-medium">
              <span className="@xl:hidden">{t('detail.more.short', { extra: rest.length })}</span>
              <span className="hidden @xl:inline">{t('detail.more', { extra: rest.length })}</span>
            </span>
          }
        >
          <table className="w-full border-collapse text-[14px]">
            <caption className="sr-only">{t('detail.weekLabel')}</caption>
            <tbody>{days.map((d, i) => row(d, d.date === boldDate, undefined, i === 0 && todayOver))}</tbody>
          </table>
          {o.lunch ? <p className="m-0 mt-1.5 text-[13px] text-ink-2">{t('detail.lunch', { from: time(o.lunch[0]), to: time(o.lunch[1]) })}</p> : null}
          {rest.length ? <ul className="m-0 mt-3 grid list-none gap-1.5 p-0 @xl:grid-cols-2">{rest.map(serviceCard)}</ul> : null}
          {accessList}
        </Disclosure>
      ) : null}

      {outreach ? accessList : null}

      {/* Phones: Directions across, then the two quiet actions side by side (two columns that never wrap, so
          a longer French label can't push the other onto its own line; on a 320px phone, where the two don't
          fit side by side in French, one under the other). Wider: one row. */}
      <div className="mt-3 grid grid-cols-1 items-center @xs:grid-cols-[auto_1fr] gap-x-1 gap-y-1.5 @md:flex @md:flex-wrap">
        <LinkButton href={directions} external variant={inactive ? 'secondary' : 'primary'} size="md" icon={Navigation} className="px-4 text-[14.5px] @xs:col-span-2 @md:me-1">
          {t('detail.directions')}
        </LinkButton>
        <LinkButton href={officeUrl(o.id, lang)} external variant="quiet" size="md" className={cn(QUIET, '-ms-2 @md:ms-0')}>
          {t('detail.page')}
        </LinkButton>
        <Button
          variant="quiet"
          size="md"
          icon={isSaved ? BookmarkCheck : Bookmark}
          aria-pressed={isSaved}
          onClick={() => setSavedNote(t(saved.toggle({ id: o.id, name: o.short[lang] }) ? 'saved.on' : 'saved.off', { name: o.short[lang] }))}
          className={cn(QUIET, isSaved && 'text-pine')}
        >
          {isSaved ? t('detail.saved') : t('detail.save')}
        </Button>
      </div>
      <LiveRegion text={savedNote} delay={150} />
    </div>
  );
}
