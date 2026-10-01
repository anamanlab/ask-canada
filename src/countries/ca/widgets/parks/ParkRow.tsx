'use client';
/** One park in the finder's list: its landscape tile, province, admission, and distance when there is a starting point. */
import { Tent } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Park } from './data';
import { KM, useAdmissionText, useLang } from './hooks';
import messages from './messages';
import { SceneTile } from './ParkScene';

export function ParkRow({
  park,
  km,
  asked,
  on,
  onClick,
}: {
  park: Park;
  km?: number;
  /** The park the answer is about, listed while another park's card is open: tapping it goes back. */
  asked?: boolean;
  on: boolean;
  onClick: () => void;
}) {
  const t = useMessages(messages);
  const lang = useLang();
  const { fmt } = useLocale();
  const adm = useAdmissionText();
  return (
    <li className="flex">
      <button
        type="button"
        aria-pressed={on}
        onClick={onClick}
        className={cn(
          'flex h-full min-h-[60px] w-full items-center gap-3 rounded-field border px-3 py-2.5 text-start transition-colors',
          on ? 'border-ink/40 bg-card shadow-sm' : 'border-hair bg-card hover:border-hair-2 hover:bg-paper-2/60',
        )}
      >
        <SceneTile land={park.land[0]} size={36} seed={park.id} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-ink">{park.short[lang]}</span>
          {/* Province · fee. A long province name wraps before the fee, never inside it, and the dot belongs to
              the fee: it sits in the gap before it and is clipped away when the fee starts a new line. */}
          <span className="block overflow-x-clip text-[12.5px] leading-snug text-ink-3">
            <span className="-ms-[1.1em] flex flex-wrap">
              <span className="ps-[1.1em]">{t(`prov.${park.prov}`)}</span>
              <span className="relative whitespace-nowrap ps-[1.1em] before:absolute before:start-0 before:w-[1.1em] before:text-center before:content-['·']">{adm(park.admission)}</span>
            </span>
          </span>
        </span>
        {asked ? (
          <span className="shrink-0 rounded-chip bg-pine-wash px-2 py-0.5 text-[12px] font-medium text-pine">{t('list.asked')}</span>
        ) : km != null ? (
          <span className="shrink-0 text-end font-mono text-[12px] text-ink-2">
            <bdi dir="ltr" className="whitespace-nowrap">{fmt.number(km, KM)}</bdi>
          </span>
        ) : park.campgrounds?.length ? (
          <Tent className="size-4 shrink-0 text-ink-3" aria-label={t('filters.camping')} strokeWidth={1.8} />
        ) : null}
      </button>
    </li>
  );
}
