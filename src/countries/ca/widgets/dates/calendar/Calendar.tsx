'use client';
/**
 * The key dates calendar once its dates are in: the next payment with a countdown, the next date for each program, a
 * month calendar with colour markers and a day/month agenda, live CRA notices, and an .ics file for the person's own
 * calendar. Filtering is instant (pure selectors over the tool output); choices are remembered on this device only.
 */
import { useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { Badge, ExternalLink, LiveRegion, WidgetSection, WidgetShell } from '@/components/ui';
import { pack } from '@/countries/active';
import { addMonths } from '@/lib/dates/business-days';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PROGRAM_META, URLS, calendarSources, isProvince } from '../data';
import { saveCalendar } from '../ics';
import messages from '../messages';
import { MonthGrid, type GridMark } from '../MonthGrid';
import { ActionNote, AddButton, Ord, cap, useDate, useRel } from '../parts';
import { useDatePrefs, type DatePrefs } from '../prefs';
import { buildEvents, nextForEach, openingMonth, programsFor } from '../select';
import type { CalEvent, CalendarOutput } from '../types';
import { Agenda } from './Agenda';
import { Filters } from './Filters';
import { Hero } from './Hero';
import { NextTiles } from './NextTiles';
import { LateNote, LiveAlert, QppNote } from './notes';
import { toneOf, useEventText } from './text';

export default function Calendar({ o }: { o: CalendarOutput }) {
  const t = useMessages(messages);
  const { intl, locale } = useLocale();
  const fmtDate = useDate();
  const rel = useRel();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const today = useToday(o.today, { pinned: o.pinToday });
  const thisMonth = today.slice(0, 7);

  const [saved, save] = useDatePrefs();
  const [choice, setChoice] = useState<DatePrefs | null>(null);
  // What they asked in chat wins; otherwise what they chose last time on this device.
  const sel: DatePrefs =
    choice ??
    (saved && !o.programsAsked && o.focus === 'all'
      ? { ...saved, province: o.province && !o.provinceGuessed ? o.province : isProvince(saved.province) ? saved.province : o.province }
      : { programs: o.programs, taxes: o.showTaxes, holidays: o.showHolidays, province: o.province });
  const text = useEventText(sel.province, today);

  const base = programsFor(sel.province);
  const choices = [...base, ...sel.programs.filter((p) => !base.includes(p))];
  const events = buildEvents(o, sel);
  const upcoming = events.filter((e) => e.date >= today);
  const hero = upcoming.find((e) => e.kind === 'payment') ?? upcoming.at(0);
  // Payments issued the same day (OAS and CPP always are) share the hero.
  const heroGroup = hero ? upcoming.filter((e) => e.date === hero.date && e.kind === hero.kind) : [];
  const noMorePayments = sel.programs.length > 0 && !upcoming.some((e) => e.kind === 'payment');

  // The month on screen is derived until they move it, so it follows the reader's own "today" (not the server's)
  // and the choices saved on this device once they load.
  const [monthPick, setMonthPick] = useState<string | null>(null);
  const month = monthPick ?? openingMonth(o, today, upcoming);
  const [selected, setSelected] = useState<string | null>(null);
  const months = [thisMonth, ...events.map((e) => e.date.slice(0, 7))].sort();
  // With payments followed, one month past the last published payment date stays reachable: that month says the
  // next year's dates aren't published yet, instead of a dead "Next month" arrow in December.
  const afterPublished = addMonths(`${o.publishedThrough.slice(0, 7)}-01`, 1).slice(0, 7);
  if (sel.programs.length) months.push(afterPublished);
  months.sort();
  const bounds = { min: months[0], max: months[months.length - 1] };

  // What the one screen-reader announcement says next: the next date and the month (a choice changed), the month or
  // day on screen (they moved the calendar), or that the calendar file is ready.
  const [said, setSaid] = useState<'next' | 'month' | 'ready'>('next');
  const update = (next: Partial<DatePrefs>) => {
    const p = { ...sel, ...next };
    setChoice(p);
    // Changing what's shown never moves the month they're looking at.
    setMonthPick(month);
    save(p);
    setSaid('next');
  };
  const show = (ym: string, day: string | null) => {
    setMonthPick(ym);
    setSelected(day);
    setSaid('month');
  };

  const [ready, setReady] = useState(false);
  const addToCalendar = (evs: CalEvent[], id?: string) => {
    saveCalendar(
      id ? `${t('ics.file')}-${id}` : t('ics.file'),
      evs.map((e) => ({
        uid: `${e.id}@${pack.brand.domain}`,
        date: e.date,
        title: e.kind === 'payment' ? t('ics.payment', { name: text.name(e) }) : text.name(e),
        // A holiday's detail line already says "Statutory holiday in Ontario": no second "Statutory holiday." after it.
        description: [text.sub(e), e.kind === 'payment' ? t('ics.paymentDesc') : e.kind === 'tax' ? t('ics.taxDesc') : text.sub(e) ? '' : t('ics.holidayDesc'), t('ics.source', { url: text.sourceUrl(e) })]
          .filter(Boolean)
          .join('\n'),
        url: text.sourceUrl(e),
        reminder: t('ics.reminder', { name: text.name(e) }),
      })),
      { calName: `${t('ics.cal')} · ${pack.brand.name}`, prodId: `-//${pack.brand.name}//${t('ics.cal')}//${lang.toUpperCase()}` },
    );
    setReady(true);
    setSaid('ready');
  };

  const byDay = new Map<string, GridMark>();
  for (const e of events) {
    if (!e.date.startsWith(month)) continue;
    const m = byDay.get(e.date) ?? { date: e.date, tones: [], label: '' };
    if (e.kind === 'holiday') m.holiday = true;
    else m.tones.push(toneOf(e));
    m.label = m.label ? `${m.label}, ${text.name(e)}` : text.name(e);
    byDay.set(e.date, m);
  }
  const marks = [...byDay.values()];

  // The next date for each thing followed; taxes-only: the next date of each deadline.
  const perProgram = nextForEach(upcoming, heroGroup, sel.programs.length === 0);
  const craFollowed = sel.programs.some((p) => PROGRAM_META[p].admin === 'cra');
  const taxesOnly = o.focus === 'taxes' || (!sel.programs.length && sel.taxes);
  // "Live" only while payment dates read live from canada.ca are on screen; tax deadlines and a holidays-only view
  // are verified data, so they show the "Checked" date instead.
  const live = o.paymentsLive && !taxesOnly && sel.programs.length > 0;
  // Where their own amounts are: CRA My Account, My Service Canada Account, or My VAC Account (all on the sign-in page).
  const admins = new Set(sel.programs.map((p) => PROGRAM_META[p].admin));
  const handoffNote = admins.has('vac') ? 'handoff.noteAll' : admins.size === 1 && admins.has('sc') ? 'handoff.noteSc' : 'handoff.note';
  // Everything the reader sees follows the UI language, whatever language the model passed to the tool.
  const sources = calendarSources(lang, live, taxesOnly);
  const mine = o.notices.filter((n) => (n.lang ?? o.lang) === lang);
  const notices = mine.length ? mine : o.notices.filter((n) => (n.lang ?? o.lang) === 'en');

  // "October 2026: 9 dates" or "Tuesday, October 20: 2 dates", and after a choice changes, the next date first.
  const onScreen = events.filter((e) => (selected ? e.date === selected : e.date.startsWith(month))).length;
  const where = t('sr.onScreen', { where: selected ? cap(text.long(selected)) : cap(fmtDate(`${month}-01`, { month: 'long', year: 'numeric' })), count: onScreen });
  const nextUp = hero
    ? t('sr.next', {
        label: hero.kind === 'payment' ? t('next.payment') : hero.kind === 'tax' ? t('next.deadline') : t('next.holiday'),
        names: new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(heroGroup.map(text.name)),
        date: text.long(hero.date),
        rel: rel(today, hero.date),
      })
    : '';
  // The header says what's on screen: "Tax deadlines" for a taxes-only calendar, "Benefit payments and holidays"…
  const kinds = [sel.programs.length ? t('cal.sub.payments') : '', sel.taxes ? t('cal.sub.taxes') : '', sel.holidays ? t('cal.sub.holidays') : ''].filter(Boolean);
  const subtitle = kinds.length === 3 ? t('cal.subtitle') : kinds.length ? cap(new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(kinds)) : t('cal.sub.none');
  const announcement = said === 'ready' ? t('action.ready') : said === 'next' && nextUp ? `${nextUp} ${where}` : where;

  return (
    <WidgetShell
      icon={CalendarDays}
      tone="maple"
      title={t('title')}
      subtitle={subtitle}
      badge={
        live ? (
          <Badge tone="live">{t('badge.live')}</Badge>
        ) : (
          <Badge icon={Check}>
            <Ord>{t('badge.checked', { date: fmtDate(sources[0]?.checked ?? o.today, { month: 'short', day: 'numeric' }) })}</Ord>
          </Badge>
        )
      }
      sources={sources}
      handoff={
        taxesOnly
          ? { href: URLS.craSignIn[lang], label: t('handoff.cra.label') }
          : { href: URLS.signIn[lang], label: t('handoff.label') }
      }
      secondaryAction={
        upcoming.length ? <AddButton ready={ready} count={upcoming.length} srCount={(n) => t('action.addAll.count', { count: n })} onClick={() => addToCalendar(upcoming)} /> : null
      }
      footnote={
        <>
          {/* The handoff's note, as the first line under the buttons (see `ActionNote` in ../parts). */}
          <ActionNote>{t(taxesOnly ? 'handoff.cra.note' : handoffNote)}</ActionNote>
          {ready ? <b className="font-medium text-pine">{t('action.ready')} </b> : null}
          {t('footnote')}
        </>
      }
      className="@container"
    >
      {/* The widget's one live region: a short sentence once things settle, never the whole agenda read again. */}
      <LiveRegion text={announcement} />

      <Hero
        group={heroGroup}
        today={today}
        following={{ programs: sel.programs.length > 0, any: sel.programs.length > 0 || sel.taxes || sel.holidays }}
        noMorePayments={noMorePayments}
        then={perProgram.length === 1 ? perProgram[0] : undefined}
        text={text}
        onAdd={addToCalendar}
        onJump={(iso) => show(iso.slice(0, 7), iso)}
      />

      {perProgram.length > 1 ? <NextTiles items={perProgram} today={today} selected={selected} text={text} onJump={(iso) => show(iso.slice(0, 7), iso)} /> : null}

      {/* Quebec: the Quebec Pension Plan (Retraite Québec) pays most retirement pensions, not the CPP. */}
      {sel.province === 'QC' ? (
        <div className="px-5 pt-4 sm:px-6">
          <QppNote on={sel.programs.includes('cpp')} />
        </div>
      ) : null}

      <Filters sel={sel} choices={choices} guessed={o.provinceGuessed && sel.province === o.province && !choice} onChange={update} />

      <WidgetSection className="mt-5 border-t border-hair">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-7 gap-y-5 @xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <div className="min-w-0 @xl:sticky @xl:top-4 @xl:self-start">
            <MonthGrid
              month={month}
              marks={marks}
              today={today}
              selected={selected}
              onSelect={(iso) => show(month, iso)}
              onMonth={(m) => show(m, null)}
              min={bounds.min}
              max={bounds.max}
            />
          </div>
          <Agenda
            events={events}
            month={month}
            selected={selected}
            today={today}
            unpublished={sel.programs.length > 0 && `${month}-01` > o.publishedThrough}
            text={text}
            onClear={() => show(month, null)}
            onAdd={addToCalendar}
          />
        </div>
      </WidgetSection>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 px-5 pt-5 sm:px-6">
        {/* CRA alerts and wait times only concern CRA-administered benefits. */}
        {craFollowed ? notices.map((n) => <LiveAlert key={n.title} n={n} />) : null}
        {sel.programs.length ? <LateNote programs={sel.programs} /> : null}
        {sel.programs.length ? (
          <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">
            {t('note.ei')}{' '}
            <ExternalLink href={URLS.eiAfter[lang]} className="text-ink-2 hover:text-ink">
              {t('note.eiLink')}
            </ExternalLink>
          </p>
        ) : null}
      </div>
    </WidgetShell>
  );
}
