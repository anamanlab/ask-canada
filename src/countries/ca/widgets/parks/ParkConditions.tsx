'use client';
/** Live wildfire status and Parks Canada bulletins for one park. */
import { useState } from 'react';
import { ChevronDown, Flame, Globe, Map as MapIcon, Satellite, Tent } from 'lucide-react';
import { useChatActions } from '@/components/chat/actions';
import { Badge, Button, ExternalLink, LinkButton, Notice, Stat, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { BeforeYouGo } from './BeforeYouGo';
import { hasReservations, isRemote, parkById } from './data';
import { BulletinList, DangerGauge, FetchedBadge } from './fire';
import { useDateText, useFooterSources, useLang } from './hooks';
import messages from './messages';
import { dangerKey, type ConditionsOutput, type ParkLite } from './model';
import { ParkActions } from './ParkActions';
import { SceneTile } from './ParkScene';
import { URLS } from './urls';

export default function ParkConditions({ data, park }: { data: ConditionsOutput; park: ParkLite }) {
  const full = parkById(park.id);
  const t = useMessages(messages);
  const lang = useLang();
  const footerSources = useFooterSources(data.sources);
  const { fmt } = useLocale();
  const date = useDateText();
  const { send } = useChatActions();
  const fire = data.fire;
  const [all, setAll] = useState(false);
  const rest = data.bulletins.filter((b) => b.url !== data.fireBan?.url);
  const danger = fire?.danger ?? null;
  const tone = danger == null ? 'border-hair bg-paper-2/60' : danger <= 1 ? 'border-pine/15 bg-pine-wash' : danger === 2 ? 'border-amber/20 bg-amber-wash' : 'border-maple/20 bg-maple-wash';

  return (
    <WidgetShell
      iconNode={<SceneTile land={park.land[0]} seed={park.id} />}
      title={t('cond.titlePark', { park: park.short })}
      subtitle={data.fireLive || data.bulletinsLive ? t('cond.sub', { prov: t(`prov.${park.prov}`) }) : t(`prov.${park.prov}`)}
      badge={data.fireLive || data.bulletinsLive ? <FetchedBadge at={data.fetchedAt} /> : undefined}
      sources={footerSources}
      handoff={{ href: data.bulletinsUrl, label: t('handoff.bulletins'), note: t('handoff.bulletinsNote') }}
      secondaryAction={
        <LinkButton href={URLS.fireMap[lang]} external variant="secondary" size="lg" icon={MapIcon}>
          {t('action.fireMap')}
        </LinkButton>
      }
      className="@container"
    >
      <div className={cn('mx-5 rounded-card border px-4 py-5 sm:mx-6 sm:px-5', tone)}>
        {data.fireLive && fire ? (
          <>
            <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">{t('cond.dangerLabel')}</p>
            <p className="m-0 mt-1 font-serif text-[34px] leading-none tracking-[-.02em] text-ink [font-variation-settings:'opsz'_48]">{t(`danger.${dangerKey(danger)}`)}</p>
            <DangerGauge danger={danger} className="mt-4" />
            <p className="m-0 mt-3 max-w-[60ch] text-[14.5px] leading-snug text-ink-2">{t(`danger.desc.${dangerKey(danger)}`)}</p>
          </>
        ) : (
          <>
            <p className="m-0 font-serif text-[24px] leading-tight text-ink">{t('fire.unavailableTitle')}</p>
            <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">
              {t('fire.unavailable')}{' '}
              <ExternalLink href={URLS.fireMap[lang]}>{t('fire.unavailableLink')}</ExternalLink>
            </p>
          </>
        )}
      </div>

      {data.fireLive && fire ? (
        <div className="mt-3 grid gap-2.5 px-5 sm:px-6 @xl:grid-cols-2">
          <Stat
            size="sm"
            label={
              <span className="inline-flex items-center gap-1.5">
                <Satellite className="size-3.5" aria-hidden strokeWidth={2} />
                {t('fire.hotspotsLabel')}
              </span>
            }
            value={fire.hotspots ? fmt.number(fire.hotspots.count) : '—'}
            tone={fire.hotspots?.count ? 'danger' : undefined}
            note={
              fire.hotspots?.count && fire.hotspots.nearestKm != null
                ? t('fire.hotspotsNearest', { km: fire.hotspots.nearestKm, radius: fire.radiusKm })
                : t('fire.hotspotsNote', { km: fire.radiusKm })
            }
          />
          <Stat
            size="sm"
            label={t('fire.perimetersLabel')}
            value={fire.perimeters ? fmt.number(fire.perimeters.count) : '—'}
            tone={fire.perimeters?.count ? 'danger' : undefined}
            note={
              fire.perimeters?.count && fire.perimeters.lastSeen
                ? t('fire.perimetersSeen', { date: date(fire.perimeters.lastSeen, { month: 'short', day: 'numeric' }), km: fire.perimeterRadiusKm })
                : t('fire.perimetersNote', { km: fire.perimeterRadiusKm })
            }
          />
        </div>
      ) : null}

      <div className="px-5 pt-4 sm:px-6">
        {data.fireBan ? (
          <Notice tone="danger" icon={Flame} title={t('fireBan.title')} live>
            <ExternalLink href={data.fireBan.url} className="font-normal text-inherit">
              {data.fireBan.title}
            </ExternalLink>
            {data.fireBan.date ? ` · ${t('bulletin.posted', { date: date(data.fireBan.date, { month: 'short', day: 'numeric', year: 'numeric' }) })}` : ''}. {t('fireBan.body')}
          </Notice>
        ) : data.bulletinsLive ? (
          <p className="m-0 flex items-start gap-2 text-[13.5px] leading-[1.5] text-ink-2">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
            {t('fireBan.none')}
          </p>
        ) : null}
      </div>

      <WidgetSection
        title={t('bulletins.title', { count: data.bulletinsTotal })}
        // The header already says Live; repeat it here only when the bulletins are live and the fire data isn't.
        aside={data.bulletinsLive && !data.fireLive ? <Badge tone="live">{t('live.badge')}</Badge> : null}
      >
        {rest.length ? (
          <>
            <BulletinList items={all ? rest : rest.slice(0, 4)} />
            {rest.length > 4 ? (
              <Button variant="quiet" size="sm" icon={ChevronDown} className="mt-1 min-h-11" onClick={() => setAll((a) => !a)} aria-expanded={all}>
                {all ? t('bulletins.less') : t('bulletins.more', { count: rest.length - 4 })}
              </Button>
            ) : null}
            {data.bulletinsTotal > data.bulletins.length ? (
              <p className="m-0 mt-2 text-[13px] text-ink-3">{t('bulletins.truncated', { shown: data.bulletins.length, total: data.bulletinsTotal })}</p>
            ) : null}
          </>
        ) : data.bulletinsLive ? (
          <p className="m-0 text-[14px] text-ink-2">{data.fireBan ? t('bulletins.onlyBan') : t('bulletins.none')}</p>
        ) : (
          <Notice tone="info" title={t('bulletins.unavailable')}>
            <ExternalLink href={data.bulletinsUrl} className="font-normal text-inherit">
              {t('bulletins.open')}
            </ExternalLink>
          </Notice>
        )}
      </WidgetSection>

      <WidgetSection title={t('know.title')}>
        <BeforeYouGo park={{ name: park.name, url: park.url, remote: !full || isRemote(full) }} fireBan={data.fireBan} />
        <p className="m-0 mt-4 text-[13px] leading-snug text-ink-3">{t('cond.evac')}</p>
      </WidgetSection>

      <ParkActions
        className="mx-5 mt-4 sm:mx-6"
        items={[
          { key: 'national', icon: Flame, label: t('action.national'), onClick: () => send(t('ask.national')) },
          ...(full && hasReservations(full) ? [{ key: 'camping', icon: Tent, label: t('action.camping'), onClick: () => send(t('ask.camping', { park: park.short })) }] : []),
          { key: 'site', icon: Globe, label: t('action.parkSite'), href: park.url },
        ]}
      />
    </WidgetShell>
  );
}
