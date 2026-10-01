'use client';
/**
 * A park's key facts (admission or permit, reservable camping, Discovery Pass or distance) as one grouped
 * card: rows with hairline dividers on phones (label at the start, serif value at the end, the note
 * beneath), three columns split by hairlines on wider containers. One quiet container instead of a
 * stack of tiles.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { campgroundName } from './campground-names';
import { OTHER_FEES, TIERS, staysOnly, type Park } from './data';
import { useAdmissionText, useLang } from './hooks';
import messages from './messages';

type Fact = { key: string; label: string; value: ReactNode; unit?: string; note: string };

export function ParkFacts({ park, from, className }: { park: Park; from?: { place: string; km: number }; className?: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const adm = useAdmissionText();
  const lang = useLang();
  const a = park.admission;
  const camps = park.campgrounds?.length ?? 0;
  // No reservable campground, but oTENTiks or backcountry sites can be reserved (Pukaskwa).
  const stays = staysOnly(park);
  const money = (n: number) => fmt.money(n, { cents: 'always' });

  const facts: Fact[] = [
    {
      key: 'admission',
      label: a.kind === 'northern' ? t('card.permit') : t('card.admission'),
      value: a.kind === 'daily' ? money(TIERS[a.tier].adult) : a.kind === 'northern' ? money(a.dayTrip ? OTHER_FEES.northernDay : OTHER_FEES.northernNight) : t(`adm.value.${a.kind}`),
      unit: a.kind === 'daily' ? t('card.perAdult') : a.kind === 'northern' ? t(a.dayTrip ? 'card.dayTrip' : a.perDay ? 'card.perDay' : 'card.perNight') : undefined,
      note: a.kind === 'daily' ? `${adm(a, 'long')}${a.season ? ` ${t(`adm.season.${a.season}`)}` : ''}` : adm(a, 'long'),
    },
    {
      key: 'camping',
      label: t('card.camping'),
      value: camps ? fmt.number(camps) : stays ? t(`card.stays.value.${park.otentik ? 'otentik' : 'backcountry'}`) : '—',
      unit: camps ? t('card.campgrounds', { count: camps }) : undefined,
      note: camps
        ? park.otentik ? t('card.campNoteOtentik') : t('card.campNote')
        : stays
          ? `${t(`card.stays.${stays}`)}${park.firstCome?.length ? ` ${t('card.firstCome', { name: park.firstCome.map((c) => campgroundName(c, lang)).join(', ') })}` : ''}`
          : t('card.noCamp'),
    },
    from
      ? { key: 'distance', label: t('card.distance'), value: fmt.number(from.km), unit: t('unit.km'), note: t('card.distanceNote', { place: from.place }) }
      : {
          key: 'pass',
          label: t('card.pass'),
          value: a.kind === 'daily' ? t('card.passYes') : a.kind === 'northern' ? t('card.passNorthern') : t('card.passNa'),
          note: a.kind === 'daily' ? t('card.passNote') : a.kind === 'northern' ? t('card.passNorthernNote') : t('card.passNaNote'),
        },
  ];

  return (
    <dl className={cn('m-0 grid overflow-hidden rounded-tile border border-hair bg-card @xl:grid-cols-3', className)}>
      {facts.map((f, i) => (
        <div
          key={f.key}
          className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 px-4 py-2.5 @xl:grid-cols-1 @xl:content-start @xl:py-3.5', i > 0 && 'border-t border-hair @xl:border-s @xl:border-t-0')}
        >
          <dt className="min-w-0 font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-2">{f.label}</dt>
          {/* A flex gap (not a margin) keeps value and unit apart in right-to-left text too. */}
          <dd className="m-0 flex flex-wrap items-baseline justify-end gap-x-1.5 text-end @xl:mt-1.5 @xl:justify-start @xl:text-start">
            <bdi className="font-serif text-[22px] leading-[1.1] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] @xl:text-[24px]">{f.value}</bdi>
            {f.unit ? <span className="text-[13px] font-medium text-ink-3">{f.unit}</span> : null}
          </dd>
          <dd className="col-span-full m-0 mt-1 text-[12.5px] leading-snug text-ink-3">{f.note}</dd>
        </div>
      ))}
    </dl>
  );
}
