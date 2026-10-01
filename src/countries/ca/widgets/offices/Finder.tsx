'use client';
/**
 * The finder with a place: filter, street map with numbered pins, the nearest offices with a live "open now"
 * clock, and a compact detail panel per office. The office opened first is the one the answer names: the
 * focused passport office, else the nearest that is in service (never a closed building).
 */
import { lazy, Suspense, useRef, useState } from 'react';
import { CalendarOff, Compass, MapPin, Navigation, Radio } from 'lucide-react';
import { Badge, Disclosure, LinkButton, LiveRegion, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { prefersReducedMotion, useNow } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import { EXPRESS_DAYS, URLS } from './data';
import { isOperating, liveIsFresh, officeStatus } from './hours';
import messages from './messages';
import { MapLegend } from './MapLegend';
import { NeedFilter } from './NeedFilter';
import { OfficeList } from './OfficeList';
import { OfficeMap, type MapPin as Pin } from './OfficeMap';
import { OfficialLink } from './AskShell';
import { defaultOffice, finderSources, listFor, meets, nearest, NEEDS, PASSPORTISH } from './search';
import { useRememberSearch } from './searchStore';
import { BADGE_FIT, CLOCK_TICK_MS, useKm, useLang, useStatusText } from './shared';
import type { FinderOutput, Need, Origin, ResultOffice } from './types';

export type FinderData = FinderOutput & { pinnedClock?: boolean };

/** The no-tiles fallback is rarely needed (offline, a blocked tile host), so its code loads only then. */
const OfficeRadar = lazy(() => import('./OfficeRadar').then((m) => ({ default: m.OfficeRadar })));
/** The map's box, shared by the map, its fallback and the fallback's loading placeholder. */
const MAP_BOX = 'h-[272px] @xl:h-[320px]';

/** Rows shown before "Show N more": the nearest few answer most visits; the rest wait behind one tap. */
const VISIBLE = 3;
/** The booking handoff's note, by need: one short line (the detail sits in the paragraph above the handoff). */
const BOOK_NOTE: Partial<Record<Need, string>> = {
  biometrics: 'handoff.bookNoteBio',
  'passport-urgent': 'handoff.bookNoteTravel',
  'passport-express': 'handoff.bookNoteTravel',
};
/** What to know before booking or going, by need: the first paragraph behind "Good to know before you go". */
const BEFORE_NOTE: Record<Need, string> = {
  any: 'programs',
  passport: 'notice.passportScc',
  'passport-urgent': 'notice.passportTravel',
  'passport-express': 'notice.passportTravel',
  biometrics: 'notice.bio',
};

const scrollToRow = (el: HTMLElement) => el.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

export function Finder({ data, origin, onChangePlace }: { data: FinderData; origin: Origin; onChangePlace?: () => void }) {
  const t = useMessages(messages);
  const lang = useLang();
  const km = useKm();
  // Epoch ms that only changes once per tick, so everything derived from it is stable in between.
  const now = useNow(data.asOf, { tickMs: CLOCK_TICK_MS, pinned: data.pinnedClock });
  const status = useStatusText();
  // The open row's element, and the office a map pin asked for that isn't on screen yet: its row scrolls into
  // view once its details have rendered (it may have been waiting behind "Show more").
  const openRow = useRef<{ id: string; el: HTMLLIElement } | null>(null);
  const awaited = useRef<string | null>(null);
  function rowOpened(id: string, el: HTMLLIElement | null) {
    if (!el) {
      if (openRow.current?.id === id) openRow.current = null;
      return;
    }
    openRow.current = { id, el };
    if (awaited.current !== id) return;
    awaited.current = null;
    scrollToRow(el);
  }
  // Each office's live snapshot carries the time it was read from the feed; officeStatus trusts it only while
  // that is recent, and falls back to the posted hours after.
  const statuses = new globalThis.Map(data.offices.map((o) => [o.id, officeStatus(o, now, o.live)]));
  const statusOf = (o: ResultOffice) => statuses.get(o.id) ?? officeStatus(o, now, o.live);
  const operating = (o: ResultOffice) => isOperating(statusOf(o));
  // The focus (the true passport office of a "passport office" search) belongs to the need that was asked.
  const focusFor = (n: Need) => (n === data.need ? data.focusId : null);
  const [need, setNeed] = useState<Need>(data.need);
  const list = listFor(data.offices, need, focusFor(need));
  // Opened first: the focused office, else the nearest one that is operating (never a closed building).
  const lead = defaultOffice(list, operating, focusFor(need));
  const [selectedId, setSelectedId] = useState<string | null>(() => lead?.id ?? null);
  // That office starts open at every width, so Directions and the office page are on screen without a guess.
  const [openId, setOpenId] = useState<string | null>(() => lead?.id ?? null);
  const [announce, setAnnounce] = useState('');
  // The list shows the nearest few; it starts expanded only when the office opened first sits further down.
  const [all, setAll] = useState(() => (lead ? list.indexOf(lead) >= VISIBLE : false));

  function changeNeed(n: Need) {
    setNeed(n);
    const next = listFor(data.offices, n, focusFor(n));
    const pick = defaultOffice(next, operating, focusFor(n));
    setAll(pick ? next.indexOf(pick) >= VISIBLE : false);
    setSelectedId(pick?.id ?? null);
    setOpenId((id) => (id && next.some((o) => o.id === id) ? id : (pick?.id ?? null)));
  }

  function selectFromMap(id: string) {
    const i = list.findIndex((o) => o.id === id);
    const o = list[i];
    if (!o) return;
    if (i >= VISIBLE) setAll(true);
    setSelectedId(id);
    setOpenId(id);
    setAnnounce(t('map.selected', { index: i + 1, name: o.short[lang], km: km(o.km), status: status.main(statusOf(o)) }));
    // Already open: scroll now. Otherwise its row scrolls itself in once its details are on screen.
    if (openRow.current?.id === id) scrollToRow(openRow.current.el);
    else awaited.current = id;
  }

  function toggleRow(id: string) {
    setSelectedId(id);
    setOpenId((cur) => (cur === id ? null : id));
  }

  const place = origin.precision === 'coords' ? t('head.here') : origin.label;
  // Kept in the page's search store (memory only, never stored): a later "near me" question reuses it. Lab
  // fixtures (pinned clocks) and results that are themselves reused are left out.
  useRememberSearch(!data.pinnedClock && !onChangePlace ? data : null);
  const youLabel = origin.precision === 'coords' ? t('map.youHere') : origin.label;
  // The Express tab says how long express takes at the nearest office that does it (2 to 9 business days; 3 or 4 to 9 at a few).
  const expressDays = nearest(data.offices, 'passport-express', 1)[0]?.expressDays ?? EXPRESS_DAYS;
  const leadStatus = lead ? statusOf(lead) : undefined;
  const holiday = lead && leadStatus?.state === 'holiday' && leadStatus.holiday ? { office: lead, day: leadStatus.holiday, next: leadStatus.next } : null;
  // Where to go instead of an office that is closed or has no visits: the nearest one in service.
  const inService = list.find(operating);
  const firstCentre = list.find((o) => o.kind !== 'outreach');
  const far = firstCentre && firstCentre.km > 80 ? firstCentre : null;
  const passportish = PASSPORTISH.includes(need);
  const bookNote = BOOK_NOTE[need] ?? 'handoff.bookNote';
  const handoff = passportish
    ? { href: URLS.booking[lang], label: t('handoff.book'), note: t(bookNote) }
    : { href: URLS.callback[lang], label: t('handoff.callback'), note: t('handoff.callbackNote') };
  // "Live" only when the card is really using the feed: a reading that is recent and dated today for its
  // office (the same test officeStatus applies). Yesterday's reading leaves every row on the posted hours.
  const liveOn = data.live && data.offices.some((o) => o.live && liveIsFresh(o.live, now) && o.live.updated === statusOf(o).today);
  const badge = liveOn ? (
    <Badge tone="live" icon={Radio} className={BADGE_FIT}>
      {t('badge.live')}
    </Badge>
  ) : (
    <Badge className={`${BADGE_FIT} ring-1 ring-inset ring-hair-2`}>{t('badge.posted')}</Badge>
  );
  const pins: Pin[] = list.map((o, i) => ({
    id: o.id,
    lat: o.lat,
    lng: o.lng,
    km: o.km,
    index: i + 1,
    kind: o.kind,
    short: `${o.short[lang]} · ${km(o.km)}`,
    label: t('map.pin', { index: i + 1, name: o.short[lang], km: km(o.km) }),
  }));
  const mapLabel = t('map.label', { count: list.length, place });
  // Hiding a single row saves nothing, so collapse only when at least two would wait behind the button.
  const hiddenCount = list.length - VISIBLE > 1 ? list.length - VISIBLE : 0;
  const shown = all || !hiddenCount ? list : list.slice(0, VISIBLE);
  const finderHref = (passportish ? URLS.finderPassport : URLS.finder)[lang];

  return (
    <div className="@container">
      <WidgetShell
        icon={MapPin}
        tone="maple"
        title={t(`head.${need}`, { place })}
        subtitle={
          <>
            <bdi>{t('sub.count', { count: list.length })}</bdi>
            {/* The shell hides its badge on phones; keep the live signal visible there too. */}
            <span className="mt-1.5 flex sm:hidden">{badge}</span>
          </>
        }
        badge={badge}
        aurora={false}
        sources={finderSources(data, lang)}
        // Directions is the card's one filled button; booking and call backs sit below it as an outlined one.
        secondaryAction={
          <>
            <LinkButton href={handoff.href} external variant="secondary" className="max-sm:w-full">
              {handoff.label}
            </LinkButton>
            <p className="m-0 ms-auto max-w-[28ch] text-end text-[13px] leading-snug text-balance text-ink-2 max-sm:ms-0 max-sm:max-w-none max-sm:text-start">{handoff.note}</p>
          </>
        }
        footnote={
          <>
            {t('ask.official')} <OfficialLink href={finderHref} />
          </>
        }
      >
        <div className="px-5 sm:px-6">
          {onChangePlace ? (
            <p className="m-0 mb-3 flex flex-wrap items-center gap-x-2 text-[13.5px] leading-snug text-ink-2">
              <span>{origin.precision === 'coords' ? t('reuse.noteHere') : t('reuse.note', { place })}</span>
              <button
                type="button"
                onClick={onChangePlace}
                className="-mx-1.5 inline-flex min-h-11 items-center rounded-chip px-1.5 font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-ink"
              >
                {t('reuse.change')}
              </button>
            </p>
          ) : null}
          <NeedFilter value={need} onChange={changeNeed} needs={NEEDS} expressDays={expressDays} disabled={(n) => !data.offices.some((o) => meets(o, n))} />
        </div>

        {holiday ? (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="info" icon={CalendarOff} title={t('notice.holiday.title', { holiday: holiday.day.name[lang] })}>
              {holiday.next ? t('notice.holiday.body', { name: holiday.office.short[lang], when: status.when(holiday.next) }) : null}
            </Notice>
          </div>
        ) : null}
        {!data.geocoded && origin.precision !== 'coords' ? (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="warn" icon={Compass}>
              {t('notice.approx')}
            </Notice>
          </div>
        ) : null}

        <div className="px-5 pt-4 sm:px-6">
          <OfficeMap
            viewKey={need}
            origin={origin}
            pins={pins}
            selectedId={selectedId}
            onSelect={selectFromMap}
            label={mapLabel}
            youLabel={youLabel}
            listed={shown.length}
            className={MAP_BOX}
            fallback={
              <Suspense fallback={<div className={cn('rounded-tile border border-hair bg-paper-2', MAP_BOX)} />}>
                <OfficeRadar
                  origin={origin}
                  pins={pins.slice(0, shown.length)}
                  selectedId={selectedId}
                  onSelect={selectFromMap}
                  label={mapLabel}
                  youLabel={youLabel}
                  northLabel={t('map.north')}
                  kmLabel={(k) => t('km', { km: k })}
                  caption={t('map.fallback')}
                  captionShort={t('map.fallback.short')}
                  className={MAP_BOX}
                />
              </Suspense>
            }
          />
          <MapLegend kinds={list.map((o) => o.kind)} you={origin.precision === 'coords' ? t('map.youHere') : t('map.you', { place })} />
          <LiveRegion text={announce} delay={150} />
        </div>

        {far ? (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="info" icon={Navigation} title={t('notice.far.title', { km: km(far.km) })}>
              {t('notice.far.body')}
            </Notice>
          </div>
        ) : null}

        <WidgetSection className="!pt-3">
          <OfficeList
            offices={shown}
            hiddenCount={hiddenCount}
            all={all}
            onAll={setAll}
            statusOf={statusOf}
            altFor={(o) => (!operating(o) && inService ? { name: inService.short[lang], km: km(inService.km), onSelect: () => selectFromMap(inService.id) } : undefined)}
            need={need}
            openId={openId}
            selectedId={selectedId}
            onToggle={toggleRow}
            onOpened={rowOpened}
            now={now}
          />
          {/* One quiet line; the need's own advice and the distance, hours and Google Maps caveats wait inside. */}
          <Disclosure className={cn(!hiddenCount && 'mt-1')} title={<span className="text-[14.5px] font-medium">{t('before.title')}</span>}>
            <div className="grid gap-2 pb-2 text-[13.5px] leading-snug text-ink-2">
              <p className="m-0">{t(BEFORE_NOTE[need])}</p>
              <p className="m-0">{t(`before.${origin.precision === 'coords' ? 'here' : origin.precision === 'place' ? 'place' : 'fsa'}`, { place })}</p>
            </div>
          </Disclosure>
        </WidgetSection>
      </WidgetShell>
    </div>
  );
}
