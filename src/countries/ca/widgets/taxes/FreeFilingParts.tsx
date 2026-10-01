'use client';
/**
 * Pieces of the free-filing checker: the family-size picker, the "does any of this apply" chips, one card per
 * free way to file, and the clinic income limits table.
 */
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Minus, Plus, Square, SquareCheck, Users, type LucideIcon } from 'lucide-react';
import { Chip, ExternalLink, IconButton, Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { COMPLEXITIES, type Complexity } from './calc/free-filing';
import { CLINIC_EXTRA_PERSON, CLINIC_INTEREST_MAX } from './data';
import messages from './messages';

const SIZES = ['1', '2', '3', '4', '5', '6'] as const;
/** "6+" opens the exact count: the suggested limit keeps rising with each person. */
const MANY = SIZES.length;
/** The largest family the tool accepts. */
export const MAX_FAMILY = 15;

/** People in the family: 1 to 5 in one tap; "6+" adds a stepper for the exact number (6 to 15). */
export function FamilySize({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const many = value >= MANY;
  const step = (by: number) => onChange(Math.max(MANY, Math.min(MAX_FAMILY, value + by)));
  // At either end the button stays focusable (a disabled one would drop the keyboard's place) but does nothing.
  const stepper = (by: number, label: string, icon: LucideIcon) => {
    const stop = by < 0 ? value <= MANY : value >= MAX_FAMILY;
    return <IconButton label={label} icon={icon} aria-disabled={stop || undefined} onClick={() => step(by)} className={cn('bg-card shadow-sm', stop && 'opacity-40')} />;
  };
  return (
    <div>
      <p className="m-0 mb-1.5 flex items-center gap-2 text-[14px] font-medium text-ink" aria-hidden>
        <Users className="size-4 text-ink-3" strokeWidth={1.9} aria-hidden />
        {t('free.check.size')}
      </p>
      <Segmented
        label={t('free.check.size')}
        value={String(Math.min(MANY, value)) as (typeof SIZES)[number]}
        onChange={(v) => onChange(Number(v) === MANY ? Math.max(MANY, value) : Number(v))}
        options={SIZES.map((s) => ({ value: s, label: Number(s) === MANY ? <bdi dir="ltr">{t('free.check.sizeMore')}</bdi> : s }))}
      />
      {many ? (
        <div role="group" aria-label={t('free.check.sizeExact')} className="mt-2.5 flex items-center justify-between gap-3 rounded-[16px] border border-hair bg-paper-2 py-1.5 ps-4 pe-1.5">
          <span className="text-[14px] font-medium leading-snug text-ink" aria-hidden>
            {t('free.check.sizeExact')}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {stepper(-1, t('free.check.fewerPeople'), Minus)}
            <output aria-live="polite" aria-label={t('free.limits.people', { count: value })} className="min-w-[2ch] text-center font-serif text-[22px] leading-none tabular-nums text-ink">
              {fmt.number(value)}
            </output>
            {stepper(1, t('free.check.morePeople'), Plus)}
          </span>
        </div>
      ) : null}
      <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-ink-3">
        {many ? t('free.check.sizeExactHint', { extra: fmt.money(CLINIC_EXTRA_PERSON, { cents: 'never' }) }) : t('free.check.sizeHint')}
      </p>
    </div>
  );
}

/** How many situations show before "Show more" (ticked ones always show). */
const SHOWN = 3;

/** Situations a volunteer can't take on, as toggle chips. The rarer ones sit behind "Show more". */
export function ComplexityChips({ value, onChange }: { value: Complexity[]; onChange: (next: Complexity[]) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [all, setAll] = useState(false);
  const hidden = COMPLEXITIES.filter((c, i) => i >= SHOWN && !value.includes(c)).length;
  const toggle = (c: Complexity) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-[14px] font-medium text-ink">{t('free.check.complex')}</legend>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {COMPLEXITIES.filter((c, i) => all || i < SHOWN || value.includes(c)).map((c) => {
          const on = value.includes(c);
          return (
            <li key={c}>
              <Chip
                wrap
                selected={on}
                icon={on ? SquareCheck : Square}
                iconClassName={on ? 'text-ink' : undefined}
                onClick={() => toggle(c)}
                className="px-3.5 py-1.5 text-[14px] leading-snug"
              >
                {t(`free.cx.${c}`, { amount: fmt.money(CLINIC_INTEREST_MAX, { cents: 'never' }) })}
              </Chip>
            </li>
          );
        })}
        {hidden > 0 || all ? (
          <li>
            <button
              type="button"
              aria-expanded={all}
              onClick={() => setAll(!all)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-chip px-3 text-[14px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
            >
              {all ? t('free.check.fewer') : t('free.check.more', { count: hidden })}
            </button>
          </li>
        ) : null}
      </ul>
      <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3">{t('free.check.complexHint', { amount: fmt.money(1000, { cents: 'never' }) })}</p>
    </fieldset>
  );
}

/**
 * One free way to file: what it is, whether it fits this person, and the official page. On a phone only the
 * `featured` ways (the ones that fit this person) show their description; the others are a compact row (title
 * and link) that opens on tap, so the handoff button isn't four long cards away. Wide layouts show everything.
 */
export function Way({
  icon: Icon,
  tone,
  title,
  badge,
  body,
  href,
  link,
  featured,
}: {
  icon: LucideIcon;
  tone: 'pine' | 'glacier' | 'amber';
  title: string;
  badge?: ReactNode;
  body: string;
  href: string;
  link: string;
  featured: boolean;
}) {
  const t = useMessages(messages);
  const bodyId = useId();
  const [open, setOpen] = useState(false);
  const tile = { pine: 'bg-pine-wash text-pine', glacier: 'bg-glacier-wash text-glacier', amber: 'bg-amber-wash text-amber' }[tone];
  return (
    // Title / body / link sit on the list's shared row tracks (subgrid): two cards side by side keep their titles,
    // bodies and links on the same lines even when one title carries a badge that wraps under it.
    <li className="row-span-3 grid grid-rows-subgrid gap-y-0 rounded-[18px] border border-hair bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-[11px]', tile)} aria-hidden>
          <Icon className="size-[18px]" strokeWidth={1.9} />
        </span>
        <h5 className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-[15.5px] font-semibold leading-snug text-ink">
          {/* The title's first line is as tall as the icon tile, so every card's title sits at the same height. */}
          <span className="flex min-h-9 items-center">{title}</span>
          {badge}
        </h5>
        {featured ? null : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={t('free.way.details', { title })}
            onClick={() => setOpen(!open)}
            className="-me-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full text-ink-3 transition-colors duration-200 hover:bg-hair hover:text-ink @xl:hidden"
          >
            <ChevronDown className={cn('size-5 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.8} aria-hidden />
          </button>
        )}
      </div>
      <p id={bodyId} className={cn('m-0 ms-12 pt-0.5 pb-1 text-[14px] leading-snug text-ink-2', !featured && !open && 'hidden @xl:block')}>
        {body}
      </p>
      {/* A block link with a 44px target. (`standalone` is a flex row, which drops the space before the last word.) */}
      <ExternalLink href={href} className="ms-12 block min-h-11 self-end justify-self-start py-[11px] text-[14px] leading-snug">
        {link}
      </ExternalLink>
    </li>
  );
}

/** Suggested clinic income limits by family size; the person's own row is marked. */
export function LimitsTable({ thresholds, size }: { thresholds: number[]; size: number }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const lastRow = thresholds.length - 1;
  return (
    <>
      <table className="w-full border-collapse text-[14px]">
        <caption className="sr-only">{t('free.limits.caption')}</caption>
        <thead>
          <tr className="text-start font-mono text-[11.5px] uppercase tracking-[.08em] text-ink-3">
            <th scope="col" className="pb-2 text-start font-medium">
              {t('free.limits.size')}
            </th>
            <th scope="col" className="pb-2 text-end font-medium">
              {t('free.limits.income')}
            </th>
          </tr>
        </thead>
        <tbody>
          {thresholds.map((limit, i) => {
            const on = Math.min(thresholds.length, size) === i + 1;
            return (
              <tr key={limit} className={cn('border-t border-hair', on && 'bg-pine-wash')} aria-current={on || undefined}>
                <th scope="row" className={cn('py-2 ps-2 text-start font-normal text-ink-2', on && 'font-semibold text-ink')}>
                  {i === lastRow ? t('free.limits.more') : t('free.limits.people', { count: i + 1 })}
                </th>
                <td className={cn('py-2 pe-2 text-end tabular-nums text-ink-2', on && 'font-semibold text-ink')}>
                  {i === lastRow ? t('free.limits.plus', { base: money(thresholds[lastRow - 1]), extra: money(CLINIC_EXTRA_PERSON) }) : money(limit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3">{t('free.limits.note')}</p>
    </>
  );
}
