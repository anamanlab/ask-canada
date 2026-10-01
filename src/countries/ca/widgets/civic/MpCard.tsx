'use client';
/** The civicFindMp result: the riding (one tab per riding when a postal code spans several), who holds the seat, and how to reach them. */
import { useState } from 'react';
import { Bookmark, BookmarkCheck, Landmark, MapPin } from 'lucide-react';
import { Badge, Button, ExternalLink, Segmented, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import messages from './messages';
import { MpContact } from './MpContact';
import { MpPerson } from './MpPerson';
import { RidingMap } from './RidingMap';
import { genderOf } from './select';
import { LinkRow, isolate } from './shared';
import type { FindMpOutput } from './types';

export function MpCard({ data }: { data: FindMpOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [idx, setIdx] = useState(0);
  const riding = data.ridings[Math.min(idx, data.ridings.length - 1)];
  const mp = riding.status === 'sitting' ? riding.mp : null;
  const lang = data.lang;
  const [saved, save] = useDeviceItem<{ riding: string; mp?: string }>('civic:riding', { label: t('mp.saved.label'), kind: 'preference' });
  const isSaved = saved?.riding === riding.name;

  const handoff = mp
    ? { href: mp.profileUrl, label: t('mp.handoff.profile'), note: isolate(t('mp.handoff.profileNote')) }
    : { href: URLS.membersSearch[lang], label: t('mp.handoff.search'), note: isolate(t('mp.handoff.searchNote')) };
  const verdict = mp
    ? t('mp.verdict.sitting', { name: mp.name, riding: riding.name })
    : riding.status === 'vacant'
      ? t('mp.verdict.vacant', { riding: riding.name })
      : t('mp.verdict.unconfirmed', { riding: riding.name });
  const saveRiding = () =>
    save(
      { riding: riding.name, ...(mp ? { mp: mp.name } : {}) },
      { detail: mp ? t('mp.saved.detail', { riding: riding.name, name: mp.name }) : t('mp.saved.detailVacant', { riding: riding.name }) },
    );

  return (
    <WidgetShell
      icon={Landmark}
      tone="maple"
      title={mp ? t('mp.titleMp', { gender: genderOf(mp) }) : t('mp.title')}
      subtitle={t('mp.subtitleRiding', { riding: riding.name, province: riding.provinceName })}
      badge={data.live && riding.status !== 'unconfirmed' ? <Badge tone="live">{t('mp.badge')}</Badge> : null}
      sources={data.sources}
      handoff={handoff}
      secondaryAction={
        <Button icon={isSaved ? BookmarkCheck : Bookmark} size="lg" className="max-sm:w-full" aria-pressed={isSaved} aria-label={isSaved ? t('mp.saved') : t('mp.save')} onClick={saveRiding}>
          {/* French is ~2x longer: a short visible label keeps the footer on one row; the full name is announced. */}
          {isSaved ? t('mp.savedShort') : t('mp.saveShort')}
        </Button>
      }
      footnote={<bdi>{t('mp.footnote')}</bdi>}
      className="@container"
    >
      <p className="sr-only" role="status">
        {verdict}
      </p>

      {data.ridings.length > 1 ? (
        <div className="px-5 pb-4 sm:px-6">
          <p className="m-0 mb-2 text-[13.5px] font-medium text-ink-2">{t('mp.multi.label', { count: data.ridings.length })}</p>
          <Segmented
            label={t('mp.multi.label', { count: data.ridings.length })}
            value={String(idx)}
            onChange={(v) => setIdx(Number(v))}
            options={data.ridings.map((r, i) => ({ value: String(i), label: r.name, sub: r.mp?.name ?? undefined }))}
          />
          <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3 [text-wrap:pretty]">
            {t('mp.multi.note')}{' '}
            <ExternalLink href={URLS.findRiding[lang]} className="whitespace-nowrap">
              {t('mp.multi.link')}
            </ExternalLink>
          </p>
        </div>
      ) : null}

      {/* The person card sets the row's height. The map fills its cell (its content is absolutely positioned),
          so a tall or wide riding never stretches the row: only the framing inside the map changes. */}
      <div className="grid items-stretch gap-3 px-3 sm:px-4 @xl:grid-cols-[minmax(0,1fr)_240px]">
        <MpPerson riding={riding} mp={mp} postal={data.postalCode} city={data.city} lang={lang} house={data.house} />
        {riding.shape ? (
          <div className="flex flex-col">
            <RidingMap
              key={riding.fedNum}
              shape={riding.shape}
              here={t('mp.riding.here')}
              label={riding.shape.pin ? t('mp.riding.map', { riding: riding.name, code: data.postalCode ?? '' }) : t('mp.riding.mapNoPin', { riding: riding.name })}
              className="h-[220px] @xl:h-auto @xl:min-h-[188px] @xl:flex-1"
            />
            <p className="m-0 text-center text-[13px]">
              <LinkRow href={URLS.ridingMaps[lang]}>{t('mp.riding.maps')}</LinkRow>
            </p>
          </div>
        ) : null}
      </div>

      {mp ? <MpContact mp={mp} /> : null}

      {/* The vacant card already gives the House's vacancy count. */}
      {riding.status === 'vacant' ? null : (
        <div className="px-5 pt-5 sm:px-6">
          <p className="m-0 flex items-start gap-2 text-[13px] leading-[1.5] text-ink-2">
            <MapPin className="mt-[3px] size-3.5 shrink-0 text-maple" aria-hidden />
            <span>
              {data.house.sitting != null && data.house.vacant != null
                ? t('mp.house.line', { seats: fmt.number(data.house.seats), sitting: fmt.number(data.house.sitting), vacant: data.house.vacant })
                : t('mp.house.lineSimple', { seats: fmt.number(data.house.seats) })}
            </span>
          </p>
        </div>
      )}
    </WidgetShell>
  );
}
