'use client';
/**
 * Local primitives for the veterans-defence widgets:
 *   <ChipGroup kind="checkbox|radio" label options value onChange collapse? />  accessible chip pickers built
 *     on core `Chip` (44px targets; radio chips are one Tab stop with arrow keys / Home / End, direction-aware,
 *     skipping disabled chips). `collapse` shows the first few as a two-column grid on phones, with a toggle.
 *   <Hero tone count label sub aside? art? />   the verdict block with a big serif number
 *   <Question title hint>{(labelId) => …}</Question>   a question heading; hands its id to the control
 *   <PhoneText text phone />        a sentence with its phone number as a tel: link
 */
import { useId, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown } from 'lucide-react';
import { Chip, NumberTicker } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';
import { tel } from './facts';

export type ChipOption<T extends string> = { value: T; label: ReactNode; icon?: LucideIcon; count?: number; disabled?: boolean };

export function ChipGroup<T extends string>({
  kind,
  label,
  labelledBy,
  options,
  value,
  onChange,
  className,
  collapse,
}: {
  kind: 'checkbox' | 'radio';
  label?: string;
  labelledBy?: string;
  options: ChipOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  className?: string;
  /**
   * Lay the chips out as a tidy grid of equal cells (two columns, three from @xl), each count at the end
   * edge of its cell. In a narrow column only the first `visible` show (plus any that are selected) until
   * the person asks for all of them.
   */
  collapse?: { visible: number; more: string; less: string };
}) {
  const groupId = useId();
  const [expanded, setExpanded] = useState(false);
  const toggle = (v: T) => {
    if (kind === 'radio') onChange([v]);
    else onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  // Radio chips share one Tab stop; checkbox chips each keep their own.
  const roving = useRovingFocus({
    count: options.length,
    index: options.findIndex((o) => value.includes(o.value)),
    onMove: (i) => onChange([options[i].value]),
    orientation: 'both',
    isDisabled: (i) => !!options[i].disabled,
  });
  const folds = !!collapse && options.length > collapse.visible;
  return (
    <div className={className}>
      <div
        id={groupId}
        role={kind === 'radio' ? 'radiogroup' : 'group'}
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className={collapse ? 'grid grid-cols-2 gap-2 @xl:grid-cols-3' : 'flex flex-wrap gap-2'}
      >
        {options.map((o, i) => {
          const on = value.includes(o.value);
          return (
            // Core Chip carries the shape, target size and focus ring; the group adds the checkbox / radio
            // semantics (so `aria-pressed` is cleared), the count, and the filled "selected" state used in cards.
            <Chip
              key={o.value}
              {...(kind === 'radio' ? roving.itemProps(i) : undefined)}
              role={kind}
              aria-checked={on}
              aria-pressed={undefined}
              selected={on}
              wrap
              icon={o.icon}
              // In a phone-width grid the cell is about 130px: the label and its count get the room, the icon returns from @sm.
              iconClassName={cn('size-[17px]', on && 'text-paper', collapse && '@max-sm:hidden')}
              disabled={o.disabled}
              onClick={() => toggle(o.value)}
              className={cn(
                'px-3.5 py-2 text-[14.5px] leading-tight shadow-none hover:translate-y-0 hover:shadow-sm active:scale-[.98] disabled:pointer-events-none disabled:opacity-40 [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:gap-2',
                on ? 'border-ink bg-ink text-paper shadow-md hover:bg-ink hover:shadow-md' : 'border-hair-2 hover:border-ink-3',
                collapse && 'rounded-field @max-xl:gap-1.5 @max-xl:px-2.5 @max-xl:text-[13.5px] @xl:min-h-[52px]',
                folds && !expanded && !on && i >= collapse.visible && '@max-xl:hidden',
              )}
            >
              {!o.icon && kind === 'checkbox' ? (
                <span aria-hidden className={cn('grid size-[18px] shrink-0 place-items-center rounded-[6px] border-[1.5px]', on ? 'border-paper bg-paper text-ink' : 'border-hair-2 text-transparent')}>
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : null}
              {/* Words stay whole (the label wraps at its spaces); a word longer than the cell breaks rather than overflow. */}
              <span className="min-w-0 flex-1 hyphens-none text-pretty break-words">{o.label}</span>
              {/* The count has its own quiet column at the end edge of the chip. */}
              {o.count != null ? (
                <>
                  {/* A space for the accessible name ("Health care 31"); it takes no room between flex items. */}{' '}
                  <bdi className={cn('shrink-0 text-[12.5px] font-normal tabular-nums', on ? 'text-paper/75' : 'text-ink-3')}>{o.count}</bdi>
                </>
              ) : null}
            </Chip>
          );
        })}
      </div>
      {folds ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={groupId}
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full text-[14px] font-semibold text-ink-2 hover:text-ink @xl:hidden"
        >
          {expanded ? collapse.less : collapse.more}
          <ChevronDown className={cn('size-4 transition-transform duration-300 motion-reduce:transition-none', expanded && 'rotate-180')} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function Question({
  title,
  hint,
  hintBelow,
  aside,
  children,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  /** Put the hint under the control (keeps controls in a two-column grid on the same line). */
  hintBelow?: boolean;
  /** Pass `null` to reserve the aside's row height before it appears (no layout shift on first tap). */
  aside?: ReactNode;
  /** The control, or a function of the title's id for controls labelled with `aria-labelledby`. */
  children: ReactNode | ((labelId: string) => ReactNode);
  className?: string;
}) {
  const id = useId();
  const hintEl = hint ? <p className={cn('m-0 text-[13px] leading-snug text-ink-3', hintBelow ? 'mt-2' : '-mt-1.5 mb-2.5')}>{hint}</p> : null;
  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('mb-2.5 flex justify-between gap-3', aside !== undefined ? 'min-h-8 items-center' : 'items-baseline')}>
        <p id={id} className="m-0 text-[15px] font-semibold leading-snug text-ink">
          {title}
        </p>
        {aside}
      </div>
      {hintBelow ? null : hintEl}
      {typeof children === 'function' ? children(id) : children}
      {hintBelow ? hintEl : null}
    </div>
  );
}

export const HERO_BG = {
  pine: 'border-pine/15 bg-linear-135 from-aurora-green/20 via-aurora-teal/16 via-45% to-aurora-violet/14',
  // Neutral warm paper: the serif number carries the emphasis (a maple tint reads as an alert).
  maple: 'border-hair bg-paper-2',
  glacier: 'border-glacier/15 bg-linear-135 from-aurora-teal/20 via-aurora-violet/13 via-55% to-aurora-green/12',
};

/**
 * The verdict block. It is not a live region: each widget keeps one short sr-only `aria-live` sentence
 * for its result, so a change is announced once.
 */
export function Hero({
  tone,
  count,
  label,
  sub,
  aside,
  art,
}: {
  tone: keyof typeof HERO_BG;
  count: number;
  label: ReactNode;
  sub?: ReactNode;
  /** A quiet line under the text (e.g. the live-data badge). */
  aside?: ReactNode;
  /** Decorative artwork at the end edge, shown when the column has room for it. */
  art?: ReactNode;
}) {
  return (
    <div className={cn('relative mx-3 overflow-hidden rounded-card border px-5 py-5 sm:mx-4 @xl:px-6 @xl:py-6', HERO_BG[tone])}>
      <div className="flex items-start gap-4">
        <p className="m-0 font-serif text-[52px] leading-[.9] tracking-[-.04em] text-ink [font-variation-settings:'opsz'_72]">
          <NumberTicker value={count} />
        </p>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="m-0 font-serif text-[23px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{label}</p>
          {sub ? <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">{sub}</p> : null}
          {aside ? <div className="mt-2.5 flex">{aside}</div> : null}
        </div>
        {art ? <div className="hidden shrink-0 self-center @md:block">{art}</div> : null}
      </div>
    </div>
  );
}

/** A sentence that names a phone number, with the number as a one-tap `tel:` link (it never breaks across lines). */
export function PhoneText({ text, phone }: { text: string; phone: string }) {
  const at = text.indexOf(phone);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <a href={tel(phone)} className="whitespace-nowrap font-semibold text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink">
        <bdi dir="ltr">{phone}</bdi>
      </a>
      {text.slice(at + phone.length)}
    </>
  );
}
