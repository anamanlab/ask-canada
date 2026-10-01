/**
 * Checklist: tickable list whose progress is saved on this device (never on a server).
 *
 * Controlled (preferred): the widget owns the saved state, so it can show "3 of 5 ready" in the same render.
 *   const list = useChecklist('passport:needs', t('need.listLabel'), items.length);
 *   <WidgetSection title={t('need.title')} aside={<Badge>{t('need.progress', { done: list.value.length })}</Badge>}>
 *     <Checklist label={t('need.listLabel')} items={items} value={list.value} onChange={list.onChange} />
 *   </WidgetSection>
 *
 * Uncontrolled (still supported): the list saves itself under `storageKey`.
 *   <Checklist storageKey="passport:needs" label="Passport renewal checklist" items={[…]} />
 *
 * Items: `{ id, title, detail?, aside? }`. `aside` sits outside the tick target, so it may hold a link or button.
 */
'use client';
import { useEffect, useEffectEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useT } from '@/lib/i18n/provider';

export type ChecklistItem = { id: string; title: ReactNode; detail?: ReactNode; aside?: ReactNode };

/** Nothing ticked yet (one shared array, so `value` keeps its identity between renders). */
const NONE: string[] = [];

/**
 * Saved checklist state for `storageKey`. Spread into a controlled `<Checklist value onChange>`, or use
 * `done` / `toggle` directly. The saved entry's detail reads "X of Y ready" in the privacy card.
 */
export function useChecklist(storageKey: string, label: string, total: number) {
  const t = useT();
  const [saved, save] = useDeviceItem<string[]>(storageKey, { label, kind: 'checklist' });
  const value = saved ?? NONE;
  const onChange = (next: string[]) => save(next, { detail: t('checklist.progress', { done: next.length, total }) });
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return { value, onChange, done: value, toggle };
}

type Common = { items: ChecklistItem[]; label: string; className?: string };

type Controlled = Common & {
  /** Ids of the ticked items. */
  value: string[];
  onChange: (next: string[]) => void;
  storageKey?: never;
  onProgress?: never;
};

type Uncontrolled = Common & {
  /** Device-store key the list saves itself under. */
  storageKey: string;
  /** @deprecated Use the controlled form (`useChecklist` + `value`/`onChange`) and count during render. */
  onProgress?: (done: number, total: number) => void;
  value?: never;
  onChange?: never;
};

export function Checklist(props: Controlled | Uncontrolled) {
  if (props.value) return <ChecklistList {...props} />;
  return <StoredChecklist {...props} />;
}

function StoredChecklist({ items, storageKey, label, onProgress, className }: Uncontrolled) {
  const { value, onChange } = useChecklist(storageKey, label, items.length);
  const count = items.filter((i) => value.includes(i.id)).length;
  // Legacy callback: reported when the count changes (not on every parent render).
  const report = useEffectEvent(() => onProgress?.(count, items.length));
  useEffect(() => report(), [count, items.length]);
  return <ChecklistList items={items} label={label} value={value} onChange={onChange} className={className} />;
}

function ChecklistList({ items, label, value, onChange, className }: Common & { value: string[]; onChange: (next: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <ul className={cn('m-0 grid list-none gap-0.5 p-0', className)} aria-label={label}>
      {items.map((it) => {
        const on = value.includes(it.id);
        return (
          <li key={it.id} className="-mx-2.5 flex items-start gap-3.5 rounded-[14px] px-2.5 transition-colors hover:bg-paper-2">
            <label className="group flex min-w-0 flex-1 cursor-pointer items-start gap-3.5 py-3">
              <input type="checkbox" checked={on} onChange={() => toggle(it.id)} className="peer sr-only" />
              <span
                aria-hidden
                className={cn(
                  'mt-px grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-all duration-200 peer-focus-visible:shadow-[var(--focus)]',
                  on ? 'border-pine bg-pine text-white' : 'border-hair-2 text-transparent',
                )}
              >
                <Check className={cn('size-3.5 transition-transform duration-200', on ? 'scale-100' : 'scale-50')} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[15px] font-medium leading-snug', on ? 'text-ink-3 line-through decoration-hair-2' : 'text-ink')}>{it.title}</span>
                {it.detail ? <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-3">{it.detail}</span> : null}
              </span>
            </label>
            {it.aside ? <div className="shrink-0 py-3">{it.aside}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
