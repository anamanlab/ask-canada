'use client';
/** The map's zoom out / zoom in / recentre buttons (44px each), at the map's bottom end corner. */
import type { Ref } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

export function MapControls({
  ref,
  onZoom,
  canZoomIn,
  canZoomOut,
  onRecentre,
}: {
  ref?: Ref<HTMLDivElement>;
  onZoom: (dz: number) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** Absent while the map still shows its fitted view. */
  onRecentre?: () => void;
}) {
  const t = useMessages(messages);
  const buttons = [
    { label: t('map.zoomOut'), icon: Minus, on: () => onZoom(-1), disabled: !canZoomOut },
    { label: t('map.zoomIn'), icon: Plus, on: () => onZoom(1), disabled: !canZoomIn },
    { label: t('map.recenter'), icon: LocateFixed, on: onRecentre, disabled: !onRecentre },
  ];
  return (
    <div ref={ref} className="absolute bottom-2.5 end-2.5 z-40 flex overflow-hidden rounded-field border border-hair bg-card/95 shadow-md backdrop-blur-sm">
      {buttons.map(({ label, icon: Icon, on, disabled }, i) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={on}
          disabled={disabled}
          className={cn(
            'grid size-11 place-items-center text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:text-ink-3/50 disabled:hover:bg-transparent',
            i > 0 && 'border-s border-hair',
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      ))}
    </div>
  );
}
