'use client';
/**
 * What the calendar shows: program chips, tax deadlines, holidays and the province. In a phone-width column the
 * choices fold behind one "Customize" row that says what's selected.
 */
import { useId, useState, type ReactNode } from 'react';
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Field, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PROGRAM_META, PROVINCES, isProvince, type Program } from '../data';
import messages from '../messages';
import { Dot, Mark, cap } from '../parts';
import type { DatePrefs } from '../prefs';
import { programsFor } from '../select';
import { FILTERS_FOLDED } from './layout';

export function Filters({
  sel,
  choices,
  guessed,
  onChange,
}: {
  sel: DatePrefs;
  /** Programs offered as chips (the province's own included). */
  choices: Program[];
  /** The province came from their time zone and they haven't changed it: say so under the picker. */
  guessed: boolean;
  onChange: (next: Partial<DatePrefs>) => void;
}) {
  const t = useMessages(messages);
  const { intl, locale } = useLocale();
  const titleId = useId();
  const panelId = useId();
  const [allChips, setAllChips] = useState(false);
  const [customize, setCustomize] = useState(false);
  const summary = [
    // "Tax deadlines and holidays" starts with a capital, as "2 programs, …" starts with its number.
    cap(
      new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' }).format(
        [sel.programs.length ? t('filter.sum.programs', { count: sel.programs.length }) : '', sel.taxes ? t('filter.sum.taxes') : '', sel.holidays ? t('filter.sum.holidays') : ''].filter(Boolean),
      ),
    ) || t('filter.count', { count: 0 }),
    sel.province ? t(`prov.${sel.province}`) : t('hol.place.federal'),
  ].join(' · ');
  const provinces = PROVINCES.map((c) => ({ value: c as string, label: t(`prov.${c}`) })).sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <section aria-labelledby={titleId} className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
      <div className="mb-3.5 flex items-center justify-between gap-3 @max-md:hidden">
        <h4 id={titleId} className="m-0 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
          {t('filter.title')}
        </h4>
        <span className="font-mono text-[12px] text-ink-3">{t('filter.count', { count: sel.programs.length + (sel.taxes ? 1 : 0) + (sel.holidays ? 1 : 0) })}</span>
      </div>
      {/* Phone width: one row that says what's shown, and opens the choices. */}
      <button
        type="button"
        aria-expanded={customize}
        aria-controls={panelId}
        onClick={() => setCustomize((v) => !v)}
        className="flex min-h-14 w-full items-center gap-3 rounded-[16px] border border-hair bg-card px-3.5 py-2 text-start shadow-sm transition-colors hover:border-hair-2 @md:hidden"
      >
        <SlidersHorizontal className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-snug text-ink">{t('filter.customize')}</span>
          {/* dir="auto": "7 programs, … · Ontario" keeps its own word order inside right-to-left pages. */}
          <span dir="auto" className="block text-start text-[13px] leading-snug text-ink-3">
            {summary}
          </span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-ink-3 transition-transform', customize && 'rotate-180')} aria-hidden />
      </button>
      <div id={panelId} className={cn(customize ? '@max-md:mt-4' : '@max-md:hidden')}>
        {/*
          Wraps (no hidden scroller). Selected = ink tint + check. In a narrow column the first
          FILTERS_FOLDED choices show, then "N more" (a toggle): the rest are one tap away instead of a tall wall of chips.
        */}
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={t('filter.label')}>
          {choices.map((p, i) => {
            const on = sel.programs.includes(p);
            return (
              <li key={p} className={cn(!allChips && i >= FILTERS_FOLDED && '@max-xl:hidden')}>
                <FilterChip on={on} onToggle={() => onChange({ programs: on ? sel.programs.filter((x) => x !== p) : [...sel.programs, p] })} mark={<Dot tone={PROGRAM_META[p].tone} />}>
                  {t(`program.${p}.short`)}
                </FilterChip>
              </li>
            );
          })}
          {/* A real toggle that stays in the row: keyboard focus never falls off a chip that removed itself. */}
          {choices.length > FILTERS_FOLDED ? (
            <li className="@xl:hidden">
              <button
                type="button"
                aria-expanded={allChips}
                onClick={() => setAllChips((v) => !v)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-chip border border-dashed border-hair-2 px-3.5 text-[14.5px] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                {allChips ? t('filter.fewer') : t('filter.more', { count: choices.length - FILTERS_FOLDED })}
                <ChevronDown className={cn('size-4 transition-transform', allChips && 'rotate-180')} aria-hidden />
              </button>
            </li>
          ) : null}
          <li>
            <FilterChip on={sel.taxes} onToggle={() => onChange({ taxes: !sel.taxes })} mark={<Mark kind="tax" />}>
              {t('filter.taxes')}
            </FilterChip>
          </li>
          <li>
            <FilterChip on={sel.holidays} onToggle={() => onChange({ holidays: !sel.holidays })} mark={<Mark kind="holiday" />}>
              {t('filter.holidays')}
            </FilterChip>
          </li>
        </ul>
        <Field label={t('filter.province')} hint={guessed ? t('filter.guessed') : undefined} className="mt-4 max-w-[340px]">
          {(p) => (
            <Select
              {...p}
              value={sel.province ?? ''}
              onChange={(ev) => {
                const v = ev.target.value;
                const province = isProvince(v) ? v : null;
                // Keep provincial programs only where they apply.
                const allowed = programsFor(province);
                onChange({ province, programs: sel.programs.filter((x) => allowed.includes(x) || !PROGRAM_META[x].province) });
              }}
              options={[{ value: '', label: t('filter.federal') }, ...provinces]}
            />
          )}
        </Field>
      </div>
    </section>
  );
}

/**
 * A filter toggle: unselected is a quiet outline with a faded colour mark; selected is a light ink tint with a firmer
 * border, the full-colour mark and a check, so the state reads at a glance without a wall of black pills (and to
 * assistive tech through `aria-pressed`). The core `Chip` takes one icon and has no tinted state, so this three-part
 * chip (mark, label, check) stays local.
 */
function FilterChip({ on, onToggle, mark, children }: { on: boolean; onToggle: () => void; mark: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-chip border ps-3 pe-3.5 text-[14.5px] font-medium shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-spring hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        on ? 'border-ink/45 bg-ink/[.07] text-ink' : 'border-hair bg-card text-ink-2 hover:border-hair-2 hover:text-ink',
      )}
    >
      <span className={cn('inline-flex shrink-0', !on && 'opacity-45')}>{mark}</span>
      <span className="text-start">{children}</span>
      {on ? <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden /> : null}
    </button>
  );
}
