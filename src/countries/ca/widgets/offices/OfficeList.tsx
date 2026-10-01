'use client';
/**
 * The finder's list: the nearest offices as numbered rows (the text equivalent of the map), and "Show N more"
 * when further ones wait behind it. The finder owns which rows show, which is open and which is selected.
 */
import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { OfficeStatus } from './hours';
import messages from './messages';
import type { OfficeAlt } from './OfficeDetail';
import { OfficeRow } from './OfficeRow';
import type { Need, ResultOffice } from './types';

export function OfficeList({
  offices,
  hiddenCount,
  all,
  onAll,
  statusOf,
  altFor,
  need,
  openId,
  selectedId,
  onToggle,
  onOpened,
  now,
}: {
  /** The rows on screen, nearest first. */
  offices: ResultOffice[];
  /** How many more wait behind "Show more" (0: no button). */
  hiddenCount: number;
  all: boolean;
  onAll: (all: boolean) => void;
  statusOf: (o: ResultOffice) => OfficeStatus;
  /** Where to go instead, for an office that is closed or has no visits. */
  altFor: (o: ResultOffice) => OfficeAlt | undefined;
  need: Need;
  openId: string | null;
  selectedId: string | null;
  onToggle: (id: string) => void;
  /** The open row's element once its details are on screen (null when it closes): what a map pin scrolls to. */
  onOpened: (id: string, el: HTMLLIElement | null) => void;
  now: number;
}) {
  const t = useMessages(messages);
  const listId = useId();
  if (!offices.length) return <p className="m-0 py-4 text-[14.5px] text-ink-2">{t('empty.need')}</p>;
  return (
    <>
      <ol id={listId} className="m-0 list-none p-0" aria-label={t('list.label')}>
        {offices.map((o, i) => (
          <OfficeRow
            key={o.id}
            office={o}
            index={i + 1}
            status={statusOf(o)}
            need={need}
            open={o.id === openId}
            selected={o.id === selectedId}
            onToggle={onToggle}
            onOpened={onOpened}
            now={now}
            alt={altFor(o)}
          />
        ))}
      </ol>
      {hiddenCount > 0 ? (
        <div className="border-t border-hair pt-1">
          <button
            type="button"
            aria-expanded={all}
            aria-controls={listId}
            onClick={() => onAll(!all)}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-tile px-3 py-2.5 text-start text-[14.5px] font-medium text-ink transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper-2" aria-hidden>
              <ChevronDown className={cn('size-4 text-ink-2 transition-transform', all && 'rotate-180')} />
            </span>
            {all ? t('list.fewer') : t('list.more', { count: hiddenCount })}
          </button>
        </div>
      ) : null}
    </>
  );
}
