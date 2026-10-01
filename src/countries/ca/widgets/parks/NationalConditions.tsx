'use client';
/** Fire danger across every national park: a headline, counts by danger class, a map and the list (worst first). */
import { useState } from 'react';
import { ChevronDown, Flame } from 'lucide-react';
import { useChatActions } from '@/components/chat/actions';
import { Button, ExternalLink, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import CanadaMap, { type Pin } from './CanadaMap';
import { HOTSPOT_RADIUS_KM, parkById, type Park } from './data';
import { URLS, parkUrls } from './urls';
import { DangerBadge, FetchedBadge } from './fire';
import { useFooterSources, useLang } from './hooks';
import messages from './messages';
import { DANGER_KEYS, dangerKey, type ConditionsOutput, type Danger, type NationalRow } from './model';
import { SceneTile } from './ParkScene';

type Row = NationalRow & { park: Park };

const MARKER_TONE: Record<string, Pin['tone']> = { none: 'muted', low: 'pine', moderate: 'pine', high: 'amber', veryHigh: 'maple', extreme: 'maple' };

export default function NationalConditions({ data }: { data: ConditionsOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const footerSources = useFooterSources(data.sources);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  // Rows for parks this build knows (an id it doesn't know is skipped, never a crash).
  const rows: Row[] = (data.national ?? []).flatMap((r) => {
    const park = parkById(r.id);
    return park ? [{ ...r, park }] : [];
  });
  const [sel, setSel] = useState<string | undefined>();
  const [all, setAll] = useState(false);

  const byLng = [...rows].sort((a, b) => a.park.lng - b.park.lng);
  // Live: worst danger first. Without live ratings: every park west to east, each linking to its own bulletins.
  const sorted = [...rows].sort((a, b) => (b.danger ?? -1) - (a.danger ?? -1) || b.hotspots - a.hotspots || a.park.lng - b.park.lng);
  const counts = DANGER_KEYS.map((_, i) => rows.filter((r) => r.danger === i).length);
  const unrated = rows.filter((r) => r.danger == null).length;
  const withSpots = rows.filter((r) => r.hotspots > 0).length;
  const worst = sorted[0]?.danger ?? null;
  const headline =
    !data.fireLive ? t('nat.unavailable') : worst != null && worst >= 3 ? t('nat.headlineHigh', { count: counts[3] + counts[4] }) : worst === 2 ? t('nat.headlineMid', { count: counts[2] }) : t('nat.headlineLow');

  const markers: Pin[] = rows.map(({ park: p, danger }) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    short: p.short[lang],
    label: t('nat.marker', { park: p.name[lang], danger: t(`danger.${dangerKey(danger)}`) }),
    tone: MARKER_TONE[dangerKey(danger)],
  }));
  const selRow = rows.find((r) => r.id === sel);
  const selPark = selRow?.park;

  return (
    <WidgetShell
      icon={Flame}
      tone="amber"
      title={t('cond.titleNational')}
      subtitle={data.fireLive ? t('cond.subNational') : t('cond.subNationalOff')}
      badge={data.fireLive ? <FetchedBadge at={data.fetchedAt} /> : undefined}
      sources={footerSources}
      handoff={{ href: URLS.fireMap[lang], label: t('handoff.fireMap'), note: t('handoff.fireMapNote') }}
      className="@container"
    >
      {data.unknown ? (
        <div className="px-5 pb-3 sm:px-6">
          <Notice tone="info" title={t('notice.unknownPark', { name: data.unknown })}>
            {data.fireLive ? t('notice.unknownParkNational') : t('notice.unknownParkNationalOff')}
          </Notice>
        </div>
      ) : null}
      <div className="px-5 sm:px-6">
        <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{headline}</p>
        {data.fireLive ? (
          <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-1.5 p-0">
            {[4, 3, 2, 1, 0].map((i) =>
              counts[i] ? (
                <li key={i}>
                  <DangerBadge danger={i as Danger} count={fmt.number(counts[i])} />
                </li>
              ) : null,
            )}
            {unrated ? (
              <li>
                <DangerBadge danger={null} count={fmt.number(unrated)} />
              </li>
            ) : null}
          </ul>
        ) : null}
        {data.fireLive ? (
          <p className="m-0 mt-3 text-[13.5px] text-ink-2">
            {withSpots ? t('nat.spots', { count: withSpots, km: HOTSPOT_RADIUS_KM }) : t('nat.noSpots', { km: HOTSPOT_RADIUS_KM })}
          </p>
        ) : null}
      </div>

      {!data.fireLive ? (
        <div className="px-5 pt-3 sm:px-6">
          <Notice tone="info" title={t('nat.offTitle')}>
            {t('nat.offBody')}
          </Notice>
        </div>
      ) : null}
      {data.fireLive ? (
        <>
          <div className="px-5 pt-4 sm:px-6">
            <CanadaMap pins={markers} selectedId={sel} onSelect={setSel} focus="all" height="auto" label={t('nat.mapLabel', { count: rows.length })} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3" aria-hidden>
              <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full bg-pine" />{t('nat.legendLow')}</span>
              <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full bg-amber" />{t('danger.high')}</span>
              <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full bg-maple" />{t('nat.legendHigh')}</span>
              <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full bg-ink-3" />{t('danger.none')}</span>
            </div>
            {selRow && selPark ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-tile border border-hair bg-paper-2/60 px-4 py-3" aria-live="polite">
                <div className="flex min-w-0 items-center gap-3">
                  <SceneTile land={selPark.land[0]} size={36} seed={selPark.id} />
                  <div className="min-w-0">
                    <p className="m-0 text-[15px] font-semibold text-ink">{selPark.short[lang]}</p>
                    <p className="m-0 text-[12.5px] text-ink-3">
                      {t(`danger.${dangerKey(selRow.danger)}`)} · {selRow.hotspots ? t('nat.rowSpots', { count: selRow.hotspots }) : t('nat.rowNoSpots')}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="min-h-11" onClick={() => send(t('ask.conditions', { park: selPark.short[lang] }))}>
                  {t('nat.details')}
                </Button>
              </div>
            ) : null}
          </div>

          <WidgetSection title={t('nat.listTitle')}>
            <ul className="m-0 grid list-none gap-1 p-0 @xl:grid-cols-2 @xl:gap-x-4">
              {(all ? sorted : sorted.slice(0, 8)).map((r) => (
                <NationalRowItem key={r.id} r={r} onAsk={(park) => send(t('ask.conditions', { park }))} />
              ))}
            </ul>
            {sorted.length > 8 ? (
              <Button variant="quiet" size="sm" icon={ChevronDown} className="mt-2 min-h-11" onClick={() => setAll((a) => !a)} aria-expanded={all}>
                <bdi>{all ? t('bulletins.less') : t('nat.more', { count: sorted.length - 8 })}</bdi>
              </Button>
            ) : null}
            <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('nat.note')}</p>
          </WidgetSection>
        </>
      ) : (
        <WidgetSection title={t('nat.offListTitle')}>
          <ul className="m-0 grid list-none gap-1 p-0 @xl:grid-cols-2 @xl:gap-x-4">
            {(all ? byLng : byLng.slice(0, 8)).map((r) => (
              <OfflineRowItem key={r.id} park={r.park} />
            ))}
          </ul>
          {byLng.length > 8 ? (
            <Button variant="quiet" size="sm" icon={ChevronDown} className="mt-2 min-h-11" onClick={() => setAll((a) => !a)} aria-expanded={all}>
              <bdi>{all ? t('bulletins.less') : t('nat.more', { count: byLng.length - 8 })}</bdi>
            </Button>
          ) : null}
        </WidgetSection>
      )}
    </WidgetShell>
  );
}

function NationalRowItem({ r, onAsk }: { r: Row; onAsk: (park: string) => void }) {
  const t = useMessages(messages);
  const lang = useLang();
  const p = r.park;
  return (
    <li>
      <button
        type="button"
        onClick={() => onAsk(p.short[lang])}
        // Top-aligned: a row whose second line wraps keeps its tile and badge level with its neighbour's.
        className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-start gap-3 rounded-field px-2 py-1.5 text-start transition-colors hover:bg-paper-2"
        aria-label={t('nat.rowAria', { park: p.name[lang], danger: t(`danger.${dangerKey(r.danger)}`), count: r.hotspots })}
      >
        <span className="mt-[3px] shrink-0">
          <SceneTile land={p.land[0]} size={30} seed={p.id} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-medium leading-5 text-ink">{p.short[lang]}</span>
          <span className="block text-[12px] leading-4 text-ink-3">
            {t(`prov.${p.prov}`)}
            {r.hotspots ? ` · ${t('nat.rowSpots', { count: r.hotspots })}` : ''}
          </span>
        </span>
        <DangerBadge danger={r.danger} className="mt-1.5 shrink-0" />
      </button>
    </li>
  );
}

/** Fallback row (no live rating): the park and a direct link to its official bulletins. */
function OfflineRowItem({ park: p }: { park: Park }) {
  const t = useMessages(messages);
  const lang = useLang();
  return (
    <li className="relative -mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-3 rounded-field px-2 py-1.5 transition-colors hover:bg-paper-2">
      <SceneTile land={p.land[0]} size={30} seed={p.id} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium leading-snug text-ink">{p.short[lang]}</span>
        <span className="block text-[12px] text-ink-3">{t(`prov.${p.prov}`)}</span>
      </span>
      {/* The link stretches over the whole row. */}
      <ExternalLink
        href={parkUrls(p, lang).bulletins}
        aria-label={`${p.short[lang]}: ${t('nat.bulletinsLink')} ${t('a11y.newTab')}`}
        className="static shrink-0 py-0 text-[13px] text-ink-2 no-underline after:absolute after:inset-0 after:rounded-field"
      >
        {t('nat.bulletinsLink')}
      </ExternalLink>
    </li>
  );
}
