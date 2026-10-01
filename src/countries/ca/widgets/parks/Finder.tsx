'use client';
/**
 * Park finder: a map of every national park with filters, a ranked list, and a park card (admission,
 * camping, live alerts + fire danger for the park the person asked about, what to know before you go).
 * The ranking comes from the tool (`order`); the card only filters it.
 */
import { useCallback, useRef, useState } from 'react';
import { ChevronDown, MapPin, Trees } from 'lucide-react';
import { useChatActions } from '@/components/chat/actions';
import { Button, Chip, EmptyState, LiveRegion, Notice, Toggle, WidgetSection, WidgetShell } from '@/components/ui';
import { prefersReducedMotion, useRovingFocus, useScrollEdges } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import CanadaMap, { type Pin } from './CanadaMap';
import { LANDSCAPES, PARKS, parkById, type Landscape, type Park } from './data';
import { URLS, parkPageSources, parkUrls } from './urls';
import { KM, useFooterSources, useLang } from './hooks';
import messages from './messages';
import { distanceKm, type FinderOutput, type Ranked } from './model';
import { ParkCard } from './ParkCard';
import { ParkRow } from './ParkRow';

const LIST_STEP = 6;

/** The `n` parks closest to a park (for framing the map around it). */
const nearestTo = (p: Park, n: number) =>
  PARKS.filter((q) => q.id !== p.id)
    .map((q) => ({ id: q.id, d: distanceKm(p, q) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((q) => q.id);

/** Phones scroll the filter row sideways: bring a pre-selected filter into view (the row only, never the page). */
function centreInRow(row: HTMLElement, el: HTMLElement) {
  if (row.scrollWidth <= row.clientWidth) return;
  const r = row.getBoundingClientRect();
  const c = el.getBoundingClientRect();
  if (c.left >= r.left + 20 && c.right <= r.right - 20) return;
  row.scrollLeft += c.left - r.left - (r.width - c.width) / 2;
}

export default function Finder({ data }: { data: FinderOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const { ref: chipsRef, maskStyle } = useScrollEdges<HTMLDivElement>();
  // The filter the answer arrived with: centred in the row once, when the row mounts (children attach first).
  const preselected = useRef<HTMLSpanElement>(null);
  const attachRow = useCallback(
    (row: HTMLDivElement | null) => {
      if (row && preselected.current) centreInRow(row, preselected.current);
      return chipsRef(row);
    },
    [chipsRef],
  );
  // Set by a tap on a pin or a row; the card that mounts for it then scrolls itself into view.
  const picked = useRef(false);
  const revealCard = (el: HTMLDivElement | null) => {
    if (!el || !picked.current) return;
    picked.current = false;
    el.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const [landscape, setLandscape] = useState<Landscape | undefined>(data.filters.landscape);
  const [camping, setCamping] = useState(!!data.filters.camping);
  const [province, setProvince] = useState(data.filters.province);
  const [selectedId, setSelectedId] = useState<string | null>(data.matchedId);
  const [shown, setShown] = useState(LIST_STEP);
  // A new filter starts the list from the top again.
  const filter = (apply: () => void) => {
    apply();
    setShown(LIST_STEP);
  };

  // The landscape filter is one choice among "All parks" and each landscape: a radio group walked with the arrow keys.
  const lands: (Landscape | undefined)[] = [undefined, ...LANDSCAPES];
  const pickLand = (l: Landscape | undefined) => filter(() => setLandscape(l));
  const landRadios = useRovingFocus({ count: lands.length, index: lands.indexOf(landscape), onMove: (i) => pickLand(lands[i]), orientation: 'horizontal' });

  const matched = parkById(data.matchedId);
  const selected = parkById(selectedId);
  // Every park in the tool's order (nearest first from the place or the named park; otherwise west to east).
  const order: Ranked[] = data.order ?? data.results;
  const ranked = order.flatMap((o) => {
    const park = parkById(o.id);
    return park ? [{ park, km: o.km }] : [];
  });
  const results = ranked.filter(
    ({ park: p }) => p.id !== matched?.id && (!province || p.prov === province) && (!landscape || p.land.includes(landscape)) && (!camping || !!p.campgrounds?.length),
  );
  // Looking at another park: the park the person asked about leads the list, so one tap returns to it.
  const away = !!selected && selected.id !== matched?.id;
  const rows = matched && away ? [{ park: matched, km: undefined, asked: true }, ...results.map((r) => ({ ...r, asked: false }))] : results.map((r) => ({ ...r, asked: false }));
  const pins: Pin[] = [...(matched ? [matched] : []), ...results.map((r) => r.park)].map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, label: p.name[lang], short: p.short[lang] }));

  const select = (id: string) => {
    picked.current = true;
    setSelectedId(id);
  };

  const subtitle = data.origin ? t('finder.subNear', { place: data.origin.label }) : province ? t(`provIn.${province}`) : t('finder.subAll');

  const handoffPark = selected ?? matched;
  const handoff = handoffPark
    ? { href: parkUrls(handoffPark, lang).home, label: t('handoff.park'), note: t('handoff.parkNote', { park: handoffPark.short[lang] }) }
    : { href: URLS.parksSearch[lang], label: t('handoff.search'), note: t('handoff.searchNote') };

  // The footer cites the park on the card: its own pages first, then the shared ones (not the asked park's).
  const askedPages = matched ? Object.values(parkUrls(matched, lang)) : [];
  const sources = selected && away ? [...parkPageSources(selected, lang, data.sources[0]?.checked ?? ''), ...data.sources.filter((s) => !askedPages.includes(s.url))] : data.sources;
  const footerSources = useFooterSources(sources);

  // Long heading on wide containers, a short one on phones (the mono uppercase style wraps early).
  const listTitle = data.origin
    ? { long: t('list.near', { place: data.origin.label }), short: t('list.near', { place: data.origin.label }) }
    : matched
      ? { long: t(away ? 'list.fromPark' : 'list.others', { park: matched.short[lang] }), short: t('list.othersShort', { park: matched.short[lang] }) }
      : { long: t('list.all'), short: t('list.allShort') };
  const filtered = !!(landscape || camping || province);
  // A province filter or a short list: frame the results, not the whole country.
  const fitResults = !selected && !data.origin && results.length > 0 && (!!province || results.length <= 8);
  const framed = !!(selected || data.origin || fitResults);
  const focusIds = selected
    ? [selected.id, ...nearestTo(selected, 4)]
    : data.origin
      ? results.slice(0, 6).map((r) => r.park.id)
      : fitResults
        ? results.map((r) => r.park.id)
        : undefined;
  // Distances are from the starting place, or from the park the person asked about: the card says which.
  const fromPlace = data.origin?.label ?? (matched && away ? matched.short[lang] : undefined);
  const selectedKm = fromPlace && selected ? ranked.find((r) => r.park.id === selected.id)?.km : undefined;

  return (
    <WidgetShell
      icon={Trees}
      tone="pine"
      title={t('finder.title')}
      subtitle={subtitle}
      sources={footerSources}
      handoff={handoff}
      className="@container"
    >
      {data.unknown ? (
        <div className="px-5 pb-1 sm:px-6">
          <Notice tone="info" title={t('notice.unknownPark', { name: data.unknown })}>
            {t('notice.unknownParkBody')}
          </Notice>
        </div>
      ) : null}
      {data.originUnknown ? (
        <div className="px-5 pb-1 sm:px-6">
          <Notice tone="info" title={t('notice.unknownPlace', { place: data.originUnknown })}>
            {t('notice.unknownPlaceBody')}
          </Notice>
        </div>
      ) : null}

      {selected ? (
        <div key={selected.id} ref={revealCard} className="scroll-mt-4">
          <ParkCard
            park={selected}
            from={fromPlace && selectedKm != null ? { place: fromPlace, km: selectedKm } : undefined}
            conditions={selected.id === data.matchedId ? data.conditions : null}
            onAsk={send}
          />
        </div>
      ) : null}

      <WidgetSection title={selected ? t('list.nearby', { park: selected.short[lang] }) : undefined} className={selected ? undefined : 'pt-0'}>
        {/* One row of landscape filters: a single line on wide screens, a sideways scroller with soft edges on phones. */}
        <div
          ref={attachRow}
          style={maskStyle}
          className="-mx-5 mb-3 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 @xl:mx-0 @xl:flex-wrap @xl:overflow-visible @xl:px-0 [&>*]:shrink-0"
          role="radiogroup"
          aria-label={t('filters.label')}
        >
          {lands.map((l, i) => (
            <span key={l ?? 'any'} className="flex" ref={l && l === data.filters.landscape ? preselected : undefined}>
              <Chip
                {...landRadios.itemProps(i)}
                role="radio"
                aria-checked={landscape === l}
                aria-pressed={undefined}
                selected={landscape === l}
                onClick={() => pickLand(l)}
                className="px-3 text-[13.5px]"
              >
                {l ? t(`land.${l}`) : t('filters.any')}
              </Chip>
            </span>
          ))}
        </div>
        <CanadaMap
          pins={pins}
          selectedId={selectedId}
          onSelect={select}
          origin={data.origin}
          focus={framed ? 'fit' : 'all'}
          focusIds={focusIds}
          focusTight={selected ? 3 : undefined}
          height={framed ? 300 : 'auto'}
          label={t('map.label', { count: pins.length })}
        />
        <p className="m-0 mt-2 text-[12.5px] text-ink-3">{data.origin || matched ? t('map.noteDistance') : framed ? t('map.note') : `${t('map.note')} ${t('map.kluane')}`}</p>
      </WidgetSection>

      <WidgetSection
        title={
          <>
            <span className="@xl:hidden">{listTitle.short}</span>
            <span className="hidden @xl:inline">{listTitle.long}</span>
          </>
        }
        aside={
          <span className="shrink-0 whitespace-nowrap font-mono text-[12px] text-ink-3" aria-live="polite">
            <bdi>{t('list.count', { count: rows.length })}</bdi>
          </span>
        }
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          {province ? (
            <Chip selected onClick={() => filter(() => setProvince(undefined))} className="px-3 text-[13.5px]" aria-label={t('filters.provinceClear', { prov: t(`prov.${province}`) })}>
              {t('filters.province', { prov: t(`prov.${province}`) })}
            </Chip>
          ) : null}
          <Toggle
            label={t('filters.campingOnly')}
            checked={camping}
            onChange={(on) => filter(() => setCamping(on))}
            className="min-w-[15rem] flex-1 rounded-field bg-paper-2/70 py-1.5 pe-3 ps-3.5 [&_label>span]:text-[14.5px]"
          />
        </div>
        {rows.length ? (
          <>
            {/* Equal rows: a name or fee that wraps never leaves its neighbours shorter. */}
            <ul className="m-0 grid list-none gap-1.5 p-0 @xl:auto-rows-fr @xl:grid-cols-2">
              {rows.slice(0, shown).map(({ park, km, asked }) => (
                <ParkRow key={park.id} park={park} km={km} asked={asked} on={park.id === selectedId} onClick={() => select(park.id)} />
              ))}
            </ul>
            {rows.length > shown ? (
              <Button variant="quiet" size="sm" icon={ChevronDown} className="mt-2 min-h-11" onClick={() => setShown(rows.length)}>
                <bdi>{t('list.more', { count: rows.length - shown })}</bdi>
              </Button>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={MapPin}
            title={t('list.empty')}
            action={
              filtered ? (
                <Button
                  size="sm"
                  onClick={() =>
                    filter(() => {
                      setLandscape(undefined);
                      setCamping(false);
                      setProvince(undefined);
                    })
                  }
                >
                  {t('filters.clear')}
                </Button>
              ) : undefined
            }
          >
            {t('list.emptyBody')}
          </EmptyState>
        )}
        <LiveRegion text={selected ? t('list.selected', { park: selected.name[lang] }) : ''} delay={300} />
      </WidgetSection>
      {!selected ? null : (
        <p className="sr-only">{t('map.srList', { list: results.slice(0, 5).map(({ park, km }) => `${park.short[lang]}${km != null ? ` (${fmt.number(km, KM)})` : ''}`).join(', ') })}</p>
      )}
    </WidgetShell>
  );
}
