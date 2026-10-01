'use client';
/**
 * The holidays list once it's in: a direct answer when they asked about one holiday, the next holiday with its long
 * weekend drawn as days off, the year's list with observed days, the days off that aren't statutory there (federal
 * ones, the provincial government's own), and an .ics file for their calendar. Switching province or year is instant (pure selectors over the tool output).
 */
import { useState } from 'react';
import { BriefcaseBusiness, Building2, CalendarHeart, Check, Landmark } from 'lucide-react';
import { Badge, Field, LinkButton, LiveRegion, NumberTicker, Segmented, Select, Stat, WidgetSection, WidgetShell } from '@/components/ui';
import { pack } from '@/countries/active';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PROVINCES, URLS, holidaySources, isProvince, type HolidayItem, type Province } from '../data';
import { GOVERNMENT_SCHEDULES, PROVINCE_SOURCES } from '../sources';
import { saveCalendar } from '../ics';
import messages from '../messages';
import { ActionNote, AddButton, Ord, useDate } from '../parts';
import { useDatePrefs } from '../prefs';
import { dayOff, defaultPrograms, holidaysFor, longWeekend, nextLongWeekend } from '../select';
import { holidayName, inSentence } from '../names';
import type { HolidaysOutput } from '../types';
import { Asked } from './Asked';
import { HolidayRow } from './HolidayRow';
import { MoreDays, OfficialLink } from './MoreDays';
import { NextHoliday } from './NextHoliday';

/** A `Stat` laid on its parent's rows (label, value, note), labels top-aligned. */
const STAT_ROWS = 'row-span-3 grid grid-rows-subgrid gap-y-0 [&>div:first-child]:items-start';

export default function HolidayList({ o }: { o: HolidaysOutput }) {
  const t = useMessages(messages);
  const { fmt, intl, locale } = useLocale();
  const fmtDate = useDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const today = useToday(o.today, { pinned: o.pinToday });

  const [saved, save] = useDatePrefs();
  const [picked, setPicked] = useState<{ province: Province | null } | null>(null);
  // What they asked in chat wins, then what they chose last time on this device, then the guess from their time zone.
  const province: Province | null = picked ? picked.province : o.province && !o.provinceGuessed ? o.province : saved && isProvince(saved.province) ? saved.province : o.province;
  const guessed = !picked && o.provinceGuessed && province === o.province;
  const [year, setYear] = useState(o.year);

  const [ready, setReady] = useState(false);
  // What the one screen-reader announcement says: the list on screen, or that the calendar file is ready.
  const [said, setSaid] = useState<'list' | 'ready'>('list');

  const pickYear = (v: string) => {
    setYear(Number(v));
    setSaid('list');
  };
  const choose = (p: Province | null) => {
    setPicked({ province: p });
    save({ ...(saved ?? { programs: defaultPrograms(p), taxes: true, holidays: true }), province: p });
    setSaid('list');
  };

  const place = province ? t(`prov.${province}`) : t('hol.place.federal');
  const placeIn = province ? t(`provIn.${province}`) : '';
  const placeOf = province ? t(`provOf.${province}`) : '';
  const { stat, federalOnly, publicService, government } = holidaysFor(o.holidays, province, year);
  // Government days that are Canada Labour Code holidays too (N.L.: Victoria Day, Thanksgiving, Boxing Day…):
  // federally regulated employers give those as well, and both lists say so.
  const govFederal = government.filter((h) => h.clc);
  // The provincial government's own schedule for the year, when it has published one (N.L.: Treasury Board Secretariat).
  const schedule = province ? GOVERNMENT_SCHEDULES[province]?.[year] : undefined;
  // Every year's holidays here, once: the hero, the "next" row and the long weekends all read from it.
  const here = holidaysFor(o.holidays, province).stat;
  const off = new Set(here.map(dayOff));
  const next = (o.longWeekendAsked ? nextLongWeekend(o.holidays, province, today)?.holiday : undefined) ?? here.find((h) => dayOff(h) >= today);
  const longWeekends = new Set(stat.map((h) => longWeekend(dayOff(h), off)?.start).filter(Boolean)).size;
  // Still to come: after today (a holiday already under way isn't "to come", and isn't worth a calendar entry).
  const ahead = stat.filter((h) => dayOff(h) > today);
  const left = year === Number(today.slice(0, 4)) ? ahead.length : null;
  // Quebec: the two days of the employer's choice, by year (Good Friday and Easter Monday).
  const choiceDays = o.holidays.filter((h) => h.choice);
  const otherChoice = (h: HolidayItem) => choiceDays.find((x) => x !== h && x.date.slice(0, 4) === h.date.slice(0, 4));

  // A Canada Labour Code holiday that isn't statutory here but falls on one of the province's own (Quebec: Victoria Day
  // on National Patriots' Day). N.L.'s Memorial Day already carries Canada Day in its name and reads "Also federal".
  const sameDay = (h: HolidayItem) => (province && !h.clc && !h.clcDay ? o.holidays.find((x) => x.clc && x.date === h.date && !x.provinces.includes(province)) : undefined);

  const nm = (h: HolidayItem) => holidayName(h, province, lang);
  const provinceSource = province ? PROVINCE_SOURCES[province][lang] : null;
  // Sources follow the reader's language and province (the tool's list follows the model's).
  const sources = holidaySources(lang, province, o.live);
  // The handoff button, drawn here as the shell draws its own (`handoff.label` is a string, and this label has two
  // forms). Phone width: the button is as wide as the card, and a long name ("Check Newfoundland and Labrador’s
  // official list") would wrap inside it, so every province gets the same short label there; the place is in the
  // widget's subtitle and in the link above the list. Both labels are in the markup and CSS shows one, at the same
  // breakpoint as the button's width, so nothing swaps after hydration.
  const handoff = (
    <LinkButton href={provinceSource?.url ?? URLS.federalHolidays[lang]} external variant="primary" className="max-sm:w-full">
      {provinceSource ? (
        <>
          <span className="sm:hidden">{t('hol.handoffShort')}</span>
          <span className="max-sm:hidden">{t('hol.handoff', { placeOf })}</span>
        </>
      ) : (
        t('hol.handoffFederal')
      )}
    </LinkButton>
  );
  const checked = fmtDate(sources[0]?.checked ?? o.today, { month: 'short', day: 'numeric' });
  const inCalendar = ahead.length ? ahead : stat;

  const addAll = () => {
    const src = provinceSource?.url ?? URLS.federalHolidays[lang];
    saveCalendar(
      t('ics.fileHolidays', { place: province ? province.toLowerCase() : t('ics.fileFederal'), year: String(year) }),
      inCalendar.map((h) => ({
        uid: `hol-${province ?? 'federal'}-${h.date}-${h.name.en.replace(/\W+/g, '')}@${pack.brand.domain}`,
        date: dayOff(h),
        title: nm(h),
        description: [province ? t('hol.kind.stat', { placeIn }) : t('hol.kind.federal'), t('ics.source', { url: src })].join('\n'),
        url: src,
        reminder: t('ics.reminder', { name: nm(h) }),
      })),
      { calName: `${t('hol.title')} · ${place}`, prodId: `-//${pack.brand.name}//${t('hol.title')}//${lang.toUpperCase()}` },
    );
    setReady(true);
    setSaid('ready');
  };
  const count = (n: number) => fmt.number(Math.round(n));

  return (
    <WidgetShell
      icon={CalendarHeart}
      tone="pine"
      title={t('hol.title')}
      subtitle={t('hol.subtitle', { place, year: String(year) })}
      // The badge says what the footer's lead source says: live for a list read from the feed, "Checked" for the
      // Canada Labour Code list on canada.ca (or a province's own page, or the verified snapshot).
      badge={
        sources[0]?.live ? (
          <Badge tone="live">{t('hol.badge.live')}</Badge>
        ) : (
          <Badge icon={Check}>
            <Ord>{t('badge.checked', { date: checked })}</Ord>
          </Badge>
        )
      }
      sources={sources}
      secondaryAction={
        <>
          {handoff}
          {stat.length ? <AddButton ready={ready} onClick={addAll} count={inCalendar.length} srCount={(n) => t('hol.addAll.count', { count: n })} /> : null}
        </>
      }
      footnote={
        <>
          {/* The handoff's note, as the first line under the buttons (see `ActionNote` in ../parts). */}
          <ActionNote>{t('hol.handoff.note')}</ActionNote>
          {ready ? <b className="font-medium text-pine">{t('action.ready')} </b> : null}
          {t('hol.footnote')}
          {/* The federal list leads with the canada.ca rules page ("Checked" badge) while its dates are read from the
              same live feed as a province's list ("Live" badge): say both, so the two views don't look at odds. */}
          {!province && o.live ? (
            <>
              {' '}
              <Ord>{t('hol.footnote.federal', { date: fmtDate(sources[0]?.checked ?? o.today, { month: 'long', day: 'numeric' }) })}</Ord>
            </>
          ) : null}
        </>
      }
      className="@container"
    >
      {/* The widget's one live region (besides the direct answer): what the list shows once a choice settles. */}
      <LiveRegion text={said === 'ready' ? t('action.ready') : t('hol.sr.summary', { place, year: String(year), count: stat.length })} />

      {o.asked ? <Asked asked={o.asked} holidays={o.holidays} province={province} /> : null}

      <NextHoliday o={o} province={province} today={today} here={here} off={off} year={year} spaced={Boolean(o.asked)} />

      <div className="grid items-end gap-3 px-5 pt-5 sm:px-6 @xl:grid-cols-[minmax(0,1fr)_auto]">
        <Field label={t('hol.province')} hint={guessed ? t('hol.guessed') : undefined}>
          {(p) => (
            <Select
              {...p}
              value={province ?? ''}
              onChange={(e) => choose(isProvince(e.target.value) ? e.target.value : null)}
              options={[{ value: '', label: t('hol.federal') }, ...PROVINCES.map((c) => ({ value: c as string, label: t(`prov.${c}`) })).sort((a, b) => a.label.localeCompare(b.label, lang))]}
            />
          )}
        </Field>
        {o.years.length > 1 ? (
          <Segmented label={t('hol.year')} value={String(year)} onChange={pickYear} options={o.years.map((y) => ({ value: String(y), label: String(y) }))} className="@xl:w-[200px]" />
        ) : null}
      </div>

      {/* Each stat spans three shared rows (label, number, note), so a label that wraps never pushes its number
          below its neighbour's. Another year has no "still to come": two tiles share the row, no empty third column. */}
      <div className={cn('grid grid-cols-2 gap-x-2.5 px-5 pt-4 sm:px-6', left != null && '@xl:grid-cols-3')}>
        <Stat
          className={STAT_ROWS}
          label={province ? t('hol.stat.count') : t('hol.stat.countFederal')}
          value={<NumberTicker value={stat.length} format={count} />}
          note={<bdi>{province ? t('hol.stat.countNote', { year: String(year) }) : t('hol.stat.countFederalNote', { year: String(year) })}</bdi>}
        />
        <Stat className={STAT_ROWS} label={t('hol.stat.lw')} value={<NumberTicker value={longWeekends} format={count} />} note={<bdi>{t('hol.stat.lwNote')}</bdi>} />
        {left != null ? (
          <Stat className={cn(STAT_ROWS, '@max-xl:hidden')} label={t('hol.stat.left')} value={<NumberTicker value={left} format={count} />} note={<bdi>{t('hol.stat.leftNote')}</bdi>} />
        ) : null}
      </div>

      <WidgetSection
        title={t('hol.list.title', { year: String(year) })}
        className="mt-5 border-t border-hair"
        aside={
          // The province's own page, as a plain link (the chat's source list only carries allowlisted domains). Beside the
          // title when there's room; on its own line under it in a narrow column, so neither wraps.
          provinceSource ? <OfficialLink href={provinceSource.url} label={t('hol.officialList', { placeOf })} className="whitespace-nowrap @max-md:hidden" /> : null
        }
      >
        {provinceSource ? <OfficialLink href={provinceSource.url} label={t('hol.officialList', { placeOf })} className="-mt-2.5 mb-1 @md:hidden" /> : null}
        {!province ? <p className="m-0 mb-3 text-[14px] leading-snug text-ink-2">{t('hol.federalNote', { count: stat.length })}</p> : null}
        <ol className="m-0 list-none p-0" aria-label={province ? t('hol.list.label', { placeIn, year: String(year) }) : t('hol.list.title', { year: String(year) })}>
          {stat.map((h) => (
            <HolidayRow key={h.date + h.name.en} h={h} province={province} today={today} isNext={h === next} other={h.choice ? otherChoice(h) : undefined} sameDay={sameDay(h)} />
          ))}
        </ol>

        {province && federalOnly.length ? (
          <MoreDays icon={BriefcaseBusiness} title={t('hol.fedOnly.title', { count: federalOnly.length })} body={t(govFederal.length ? 'hol.fedOnly.bodyGov' : 'hol.fedOnly.body')} days={federalOnly} source={{ href: URLS.federalHolidays[lang], label: t('hol.handoffFederal') }} />
        ) : null}
        {province && government.length ? (
          <MoreDays
            icon={Building2}
            title={t('hol.gov.title', { count: government.length })}
            body={[
              t('hol.gov.body', { placeIn }),
              govFederal.length ? t('hol.gov.clc', { names: new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(govFederal.map((h) => inSentence(h.name[lang], lang))) }) : '',
              schedule ? '' : t('hol.gov.undated', { year: String(year) }),
            ]
              .filter(Boolean)
              .join(' ')}
            days={government}
            dated={Boolean(schedule)}
            source={schedule ? { href: schedule, label: t('hol.gov.source', { year: String(year) }) } : undefined}
          />
        ) : null}
        {publicService.length ? (
          <MoreDays icon={Landmark} title={t('hol.ps.title', { count: publicService.length })} body={t('hol.ps.body')} days={publicService} source={{ href: URLS.publicHolidays[lang], label: t('hol.ps.source') }} />
        ) : null}
      </WidgetSection>
    </WidgetShell>
  );
}
