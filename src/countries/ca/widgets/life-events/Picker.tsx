'use client';
/** The six life events to choose from, shown when the conversation didn't name one. */
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDir } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import { LINKS, TONES, type EventId } from './facts';
import messages from './messages';
import type { ChecklistOutput } from './model';
import { DeviceBadge, EVENT_ICONS, MetaLine, ToneTile } from './parts';

export function Picker({ data, onPick }: { data: ChecklistOutput; onPick: (id: EventId) => void }) {
  const t = useMessages(messages);
  // The chevron's hover nudge follows this list's own direction (the widget can be an LTR island in an RTL page).
  const [listRef, dir] = useDir<HTMLUListElement>();
  return (
    <WidgetShell
      icon={LayoutGrid}
      tone="glacier"
      title={t('title')}
      subtitle={t('subtitle')}
      badge={<DeviceBadge />}
      sources={data.sources}
      handoff={{ href: LINKS.lifeEvents[data.lang], label: t('picker.handoff'), note: t('picker.handoffNote') }}
      className="@container"
    >
      <div className="px-5 pt-1 sm:px-6">
        <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{t('picker.lead')}</p>
      </div>
      <ul ref={listRef} className="m-0 mt-4 grid list-none grid-cols-1 gap-2.5 p-0 px-3 sm:px-4 @lg:grid-cols-2">
        {data.events.map((e) => {
          const Icon = EVENT_ICONS[e.id];
          return (
            <li key={e.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(e.id)}
                aria-label={t('picker.open', { event: t(`event.${e.id}.name`) })}
                className="group flex h-full min-h-[92px] w-full items-start gap-3.5 rounded-[18px] border border-hair bg-card px-4 py-3.5 text-start shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-spring hover:-translate-y-0.5 hover:border-hair-2 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <ToneTile tone={TONES[e.id]}>
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                </ToneTile>
                {/* A column as tall as the card, so the meta lines of a row share a baseline whatever the blurbs' length. */}
                <span className="flex min-w-0 flex-1 flex-col self-stretch">
                  <span className="block text-[16px] font-semibold leading-snug text-ink">{t(`event.${e.id}.name`)}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-ink-2">{t(`event.${e.id}.blurb`)}</span>
                  <span className="mt-auto block pt-1.5 text-[13px] tabular-nums text-ink-3">
                    <MetaLine agencies={e.agencies} steps={e.steps} />
                  </span>
                </span>
                {/* The nudge moves the wrapper, so it can't fight the icon's own flip (flip-rtl is a transform too). */}
                <span
                  aria-hidden
                  className={cn(
                    'mt-3 shrink-0 text-ink-3 transition-transform motion-reduce:transition-none',
                    dir === 'rtl' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
                  )}
                >
                  <ChevronRight className="size-4 flip-rtl" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}
