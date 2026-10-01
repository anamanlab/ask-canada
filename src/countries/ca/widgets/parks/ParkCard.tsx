'use client';
/**
 * The park card inside the finder: name over a landscape vignette, key facts, today's conditions (live fire
 * danger and bulletins) for the park the person asked about, follow-up actions and what to know before you go.
 */
import { Bookmark, BookmarkCheck, Flame, Receipt, Tent, Ticket } from 'lucide-react';
import { Badge, Disclosure, ExternalLink, Notice } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import { BeforeYouGo } from './BeforeYouGo';
import { hasReservations, isRemote, parkById, type Park } from './data';
import { URLS, parkUrls } from './urls';
import { BulletinList, DangerBadge, DangerGauge } from './fire';
import { useDateText, useLang } from './hooks';
import messages from './messages';
import { dangerKey, type ConditionsOutput } from './model';
import { ParkActions, type ParkAction } from './ParkActions';
import { ParkFacts } from './ParkFacts';
import { ParkScene } from './ParkScene';

/** Keep a park's own name on one line ("Parc national du Gros-Morne" never splits "Gros- / Morne"). */
function keepTogether(name: string, short: string) {
  const i = short.length <= 18 ? name.indexOf(short) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <span className="whitespace-nowrap">{short}</span>
      {name.slice(i + short.length)}
    </>
  );
}

export function ParkCard({
  park,
  from,
  conditions,
  onAsk,
}: {
  park: Park;
  /** The place the person started from and the straight-line distance to this park, when they named one. */
  from?: { place: string; km: number };
  conditions: ConditionsOutput | null;
  onAsk: (text: string) => void;
}) {
  const t = useMessages(messages);
  const lang = useLang();
  const date = useDateText();
  const urls = parkUrls(park, lang);
  const [saved, save] = useDeviceItem<string[]>('parks:shortlist', { label: t('saved.label'), kind: 'plan' });
  const list = saved ?? [];
  const isSaved = list.includes(park.id);
  const toggleSave = () => {
    const next = isSaved ? list.filter((x) => x !== park.id) : [...list, park.id];
    save(next, { detail: next.map((id) => parkById(id)?.short[lang]).filter(Boolean).join(', ') });
  };
  const fire = conditions?.fire;
  const short = park.short[lang];
  const actions: ParkAction[] = [
    ...(!conditions ? [{ key: 'conditions', icon: Flame, label: t('action.conditions'), onClick: () => onAsk(t('ask.conditions', { park: short })) }] : []),
    ...(hasReservations(park) ? [{ key: 'camping', icon: Tent, label: t('action.camping'), onClick: () => onAsk(t('ask.camping', { park: short })) }] : []),
    ...(park.admission.kind === 'daily' ? [{ key: 'pass', icon: Ticket, label: t('action.pass'), onClick: () => onAsk(t('ask.pass', { park: short })) }] : []),
    // Three parks have no fees page; the handoff below opens the park's own page.
    ...(urls.fees ? [{ key: 'fees', icon: Receipt, label: t('action.fees'), href: urls.fees }] : []),
  ];

  return (
    <div className="px-5 sm:px-6">
      <div className="relative overflow-hidden rounded-card border border-hair">
        <ParkScene land={park.land[0]} className="h-[132px] w-full @xl:h-[156px]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/85 to-transparent px-4 pb-3.5 pt-10 sm:px-5">
          {/* Province and designation never break mid-name; the dot stays with the province, so a wrapped line never starts with it. */}
          <p className="m-0 pe-12 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
            <span className="whitespace-nowrap">{t(`prov.${park.prov}`)} ·</span> <span className="whitespace-nowrap">{t(`des.${park.des}`)}</span>
          </p>
          <h4 className="m-0 mt-0.5 font-serif text-[26px] font-normal leading-[1.1] tracking-[-.02em] text-ink text-balance [font-variation-settings:'opsz'_36]">{keepTogether(park.name[lang], park.short[lang])}</h4>
        </div>
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={isSaved}
          aria-label={isSaved ? t('saved.remove', { park: park.short[lang] }) : t('saved.add', { park: park.short[lang] })}
          className="absolute end-2.5 top-2.5 grid size-11 place-items-center rounded-full border border-hair bg-card text-ink shadow-sm transition hover:bg-paper-2"
        >
          {isSaved ? <BookmarkCheck className="size-[18px] text-pine" strokeWidth={2} aria-hidden /> : <Bookmark className="size-[18px]" strokeWidth={1.8} aria-hidden />}
        </button>
      </div>

      <ParkFacts park={park} from={from} className="mt-3" />

      {conditions ? (
        <div className="mt-3 rounded-tile border border-hair bg-paper-2/60 px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              {conditions.fireLive || conditions.bulletinsLive ? <Badge tone="live">{t('live.badge')}</Badge> : null}
              {t('card.today')}
            </p>
            {conditions.fireLive ? <DangerBadge danger={fire?.danger ?? null} /> : null}
          </div>
          {conditions.fireLive && fire ? (
            <>
              <DangerGauge danger={fire.danger} className="mt-3" />
              <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">
                {t(`danger.desc.${dangerKey(fire.danger)}`)}{' '}
                {fire.hotspots?.count ? t('fire.hotspots', { count: fire.hotspots.count, km: fire.radiusKm }) : t('fire.noHotspots', { km: fire.radiusKm })}
              </p>
            </>
          ) : (
            <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">
              {t('fire.unavailable')}{' '}
              <ExternalLink href={URLS.fireMap[lang]}>{t('fire.unavailableLink')}</ExternalLink>
            </p>
          )}
          {conditions.fireBan ? (
            <Notice tone="danger" icon={Flame} className="mt-3" title={t('fireBan.title')}>
              <ExternalLink href={conditions.fireBan.url} className="font-normal text-inherit">
                {conditions.fireBan.title}
              </ExternalLink>
              {conditions.fireBan.date ? ` · ${t('bulletin.posted', { date: date(conditions.fireBan.date, { month: 'short', day: 'numeric', year: 'numeric' }) })}` : ''}
            </Notice>
          ) : null}
          {conditions.bulletins.length ? (
            <>
              <p className="m-0 mt-3 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">
                {t('bulletins.title', { count: conditions.bulletinsTotal })}
              </p>
              <BulletinList className="mt-1" items={conditions.bulletins.filter((b) => b.url !== conditions.fireBan?.url).slice(0, 3)} />
              <p className="m-0 mt-1 text-[13.5px] leading-snug">
                <ExternalLink href={conditions.bulletinsUrl}>{t('bulletins.all', { count: conditions.bulletinsTotal })}</ExternalLink>
              </p>
            </>
          ) : conditions.bulletinsLive ? (
            <p className="m-0 mt-3 text-[13.5px] text-ink-2">{t('bulletins.none')}</p>
          ) : (
            <p className="m-0 mt-3 text-[13.5px] text-ink-2">
              {t('bulletins.unavailable')}{' '}
              <ExternalLink href={conditions.bulletinsUrl}>{t('bulletins.open')}</ExternalLink>
            </p>
          )}
        </div>
      ) : null}

      <ParkActions className="mt-3" items={actions} />

      {/* Rarely opened for a park picked from the list: mounted on first open. */}
      <Disclosure title={t('know.title')} headingLevel={5} defaultOpen={!!conditions} lazy className="mt-4 rounded-tile border border-hair px-4">
        <BeforeYouGo className="pb-3" park={{ name: park.name[lang], url: urls.home, remote: isRemote(park) }} fireBan={conditions?.fireBan} />
      </Disclosure>
    </div>
  );
}
