/**
 * Tabs: ARIA tablist with panels.
 * <Tabs label="Details" tabs={[{ id: 'fees', label: 'Fees', content: <…/> }, …]} defaultTab="fees" />
 * <Tabs label="Details" tabs={…} value={tab} onChange={setTab} />   // controlled
 * Arrow keys / Home / End move between tabs (direction-aware). The underline slides to the active tab (CSS transition).
 */
'use client';
import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks/roving-focus';
import { useSlidingThumb } from '@/lib/hooks/thumb';

export type TabItem = { id: string; label: ReactNode; content: ReactNode };

export function Tabs({
  label,
  tabs,
  defaultTab,
  value,
  onChange,
  className,
}: {
  label: string;
  tabs: TabItem[];
  defaultTab?: string;
  /** Controlled active tab id (with `onChange`). */
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [own, setOwn] = useState(defaultTab ?? tabs[0]?.id);
  const active = value ?? own;
  const select = (id: string) => {
    setOwn(id);
    onChange?.(id);
  };
  const uid = useId();
  const index = tabs.findIndex((t) => t.id === active);
  const { itemProps, getItem } = useRovingFocus({ count: tabs.length, index, onMove: (i) => select(tabs[i].id) });
  // The underline is the tablist's ::before, slid under the active tab; until it is measured (server HTML) the
  // active tab paints its own.
  const list = useSlidingThumb<HTMLDivElement>(index, getItem, tabs.length);
  return (
    <div className={className}>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        className={cn(
          'group/tabs relative flex gap-1 overflow-x-auto border-b border-hair [scrollbar-width:none]',
          'before:pointer-events-none before:absolute before:left-0 before:top-0 before:hidden before:h-0.5 before:w-[calc(var(--thumb-w)_-_16px)] before:rounded-full before:bg-ink before:[transform:translate(calc(var(--thumb-x)_+_8px),calc(var(--thumb-y)_+_var(--thumb-h)_-_1px))] before:transition-[transform,width] before:duration-300 before:ease-spring data-[thumb]:before:block motion-reduce:before:transition-none',
        )}
      >
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              {...itemProps(i)}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-controls={`${uid}-panel-${t.id}`}
              aria-selected={on}
              onClick={() => select(t.id)}
              className={cn(
                'relative min-h-11 whitespace-nowrap px-3 text-[14.5px] font-medium transition-colors',
                on
                  ? 'text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-ink group-data-[thumb]/tabs:after:hidden'
                  : 'text-ink-3 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-panel-${t.id}`}
          aria-labelledby={`${uid}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="pt-4 focus-visible:rounded-lg"
        >
          {t.id === active ? t.content : null}
        </div>
      ))}
    </div>
  );
}
