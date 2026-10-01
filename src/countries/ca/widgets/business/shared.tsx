'use client';
/**
 * Small building blocks shared by the business widgets (built on @/components/ui + design tokens).
 */
import { useId, useRef, type FocusEvent, type ReactNode } from 'react';
import { ArrowUpRight, Check, CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { ExternalLink, LiveRegion, Select, WidgetError } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { langOf, PROVINCES, type Province, type UrlKey, URLS } from './data';
import messages from './messages';

/** Messages, formatters and official links (in the reader's language) for the business widgets. */
export function useBiz() {
  const t = useMessages(messages);
  const { fmt, intl, locale } = useLocale();
  const lang = langOf(intl || locale);
  const href = (key: UrlKey) => URLS[key][lang];
  /** Figures people type (sales, shipment values) are shown to the dollar: "$32,300", never "$32,300.00". */
  const dollars = (n: number) => fmt.money(n, { cents: 'never' });
  return { t, fmt, intl, lang, href, dollars };
}

/**
 * Spread on the element that wraps number fields: tabbing into a filled field selects its contents, so typing
 * replaces the number instead of appending to it ("1000" + "2500" must never become "10002500"). The shared
 * number field rewrites its text on focus, which drops the browser's own select-all, so the selection is made
 * one frame later. Clicks and taps keep their caret.
 *
 * No clock: a pointer press marks the focus that follows it as the pointer's; a key press or a blur clears the
 * mark. The pending frame is cancelled on blur and skipped if the field is gone or no longer focused.
 *
 * DEPENDS ON CORE (for the owner of src/components/ui/NumberInput.tsx): this belongs in the field itself.
 * Asked of core: a `selectOnFocus` prop on NumberInput / MoneyInput / PercentInput (select after the focus
 * rewrite, keyboard focus only). When it lands, delete this hook and its call sites (BusinessRegistration,
 * TradeImport, TradeExport).
 */
export function useSelectOnTab() {
  const byPointer = useRef(false);
  const frame = useRef(0);
  return {
    onPointerDownCapture: () => {
      byPointer.current = true;
    },
    // A key pressed inside (Tab from one field to the next) ends the pointer's turn.
    onKeyDownCapture: () => {
      byPointer.current = false;
    },
    onBlurCapture: () => {
      byPointer.current = false;
      cancelAnimationFrame(frame.current);
    },
    onFocusCapture: (e: FocusEvent<HTMLElement>) => {
      const el = e.target;
      const pointer = byPointer.current;
      byPointer.current = false;
      if (pointer || !(el instanceof HTMLInputElement)) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        if (el.isConnected && el.ownerDocument.activeElement === el) el.select();
      });
    },
  };
}

export type HeroTone = 'ok' | 'warn' | 'danger' | 'info';
const heroCls: Record<HeroTone, { box: string; dot: string; icon: LucideIcon }> = {
  ok: {
    box: 'border-pine/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_55%,color-mix(in_oklab,var(--glacier)_4%,transparent))]',
    dot: 'bg-pine text-card shadow-[0_0_0_6px_var(--pine-wash)]',
    icon: Check,
  },
  info: {
    box: 'border-glacier/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--pine)_8%,transparent))]',
    dot: 'bg-glacier text-card shadow-[0_0_0_6px_var(--glacier-wash)]',
    icon: Info,
  },
  warn: {
    // One clean amber wash (no second hue). Dark: a stronger amber that fades into a cool glacier tail.
    box: 'border-amber/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_13%,transparent),color-mix(in_oklab,var(--amber)_4%,transparent))] dark:border-amber/35 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_24%,transparent),color-mix(in_oklab,var(--amber)_8%,transparent)_45%,color-mix(in_oklab,var(--glacier)_5%,transparent))]',
    dot: 'bg-amber text-card shadow-[0_0_0_4px_var(--amber-wash)]',
    icon: TriangleAlert,
  },
  danger: {
    box: 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_11%,transparent),color-mix(in_oklab,var(--maple)_4%,transparent))]',
    dot: 'bg-maple text-card shadow-[0_0_0_6px_var(--maple-wash)]',
    icon: CircleAlert,
  },
};

/**
 * The verdict card at the top of a widget: one confident sentence, then the why.
 * Not a live region itself (a chat can hold several of these). Pass `announce` (the verdict as plain text)
 * when the verdict can change as the person interacts: it is read once it settles, never on first render.
 */
export function Hero({
  tone,
  icon,
  kicker,
  title,
  announce,
  children,
  className,
}: {
  tone: HeroTone;
  icon?: LucideIcon;
  kicker?: ReactNode;
  title: ReactNode;
  announce?: string;
  children?: ReactNode;
  className?: string;
}) {
  const c = heroCls[tone];
  const Icon = icon ?? c.icon;
  return (
    <div className={cn('relative mx-3 overflow-hidden rounded-card border px-5 py-5 sm:mx-4', c.box, className)}>
      {announce ? <LiveRegion text={announce} /> : null}
      <div className="flex items-start gap-3.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', c.dot)} aria-hidden>
          <Icon className="size-[18px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          {kicker ? <p className="m-0 mb-1 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">{kicker}</p> : null}
          <p className="m-0 text-balance font-serif text-[22px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] @xl:text-[26px]">{title}</p>
          {children ? <div className="mt-1.5 text-[15px] leading-snug text-ink-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat tiles in pairs/rows whose labels may wrap in French: each tile is a 3-row subgrid (label, value,
 * note) so side-by-side values always share a baseline. Use STAT_GRID on the parent, STAT_CELL on each Stat.
 */
export const STAT_GRID = 'grid grid-cols-2 gap-x-2.5 gap-y-0';
export const STAT_CELL = 'row-span-3 mb-2.5 grid grid-rows-subgrid gap-y-0 [&>div:first-child]:items-start';

/** The ↗ of an external card link (LinkRow draws it itself in a row; a `feature` card places it in its own layout). */
export function LinkArrow({ className }: { className?: string }) {
  return <ArrowUpRight className={cn('size-[18px] shrink-0 text-ink-3 transition-colors flip-rtl group-hover:text-ink', className)} aria-hidden strokeWidth={1.8} />;
}

const linkCls = {
  row: 'flex min-h-[52px] items-start gap-3 px-4 py-3 hover:-translate-y-px',
  feature: 'flex h-full flex-col px-4 py-3.5 shadow-sm hover:-translate-y-0.5',
};

/**
 * An external official link as a card. The link itself is the core `ExternalLink` (new tab, `rel`, the sr-only
 * "(opens in a new tab)" in the interface language): only the card look and layout are added here.
 * FOR CORE: a `card` variant of ExternalLink would replace this.
 *   <LinkRow href title detail aside? />                       a list row (title, detail, ↗)
 *   <LinkRow variant="feature" href>…<LinkArrow />…</LinkRow>  a raised card with its own layout
 */
export function LinkRow({
  href,
  title,
  detail,
  aside,
  variant = 'row',
  children,
  className,
}: {
  href: string;
  title?: ReactNode;
  detail?: ReactNode;
  aside?: ReactNode;
  variant?: keyof typeof linkCls;
  /** Replaces the row layout (use with `variant="feature"`). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <ExternalLink
      href={href}
      icon={false}
      className={cn(
        'group rounded-tile border border-hair bg-card text-start font-normal no-underline transition-[border-color,box-shadow,transform] duration-200 hover:border-hair-2 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        linkCls[variant],
        className,
      )}
    >
      {children ?? (
        <>
          <span className="min-w-0 flex-1">
            {/* `aside` rides on the title line (and wraps under the title when short of room), so the detail keeps the full width. */}
            <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <span className="text-[15px] font-semibold leading-snug text-ink">{title}</span>
              {aside}
            </span>
            {detail ? <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-3">{detail}</span> : null}
          </span>
          <LinkArrow className="mt-0.5" />
        </>
      )}
    </ExternalLink>
  );
}

/** Province/territory select, sorted by the localized name. */
export function ProvinceSelect({ value, onChange, className }: { value: Province | null; onChange: (p: Province | null) => void; className?: string }) {
  const id = useId();
  const { t, intl } = useBiz();
  const sorted = PROVINCES.map((p) => ({ value: p as string, label: t(`prov.${p}`) })).sort((a, b) => a.label.localeCompare(b.label, intl));
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13.5px] font-medium text-ink-2">
        {t('prov.label')}
      </label>
      <Select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(PROVINCES.find((p) => p === e.target.value) ?? null)}
        options={[{ value: '', label: t('prov.choose') }, ...sorted]}
      />
    </div>
  );
}

/**
 * Chosen pills are outlined in ink on a quiet fill, not filled dark: the one dark filled element of a widget is
 * its primary button.
 */
const PILL_ON = 'border-ink bg-paper-2 text-ink shadow-[inset_0_0_0_1px_var(--ink)]';
const PILL_OFF = 'border-hair-2 bg-card text-ink hover:border-ink-3';

/** A pill that toggles on/off (multi-select). Uses role="checkbox" so screen readers announce the state. */
export function TogglePill({ on, onClick, children, icon: Icon }: { on: boolean; onClick: () => void; children: ReactNode; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-chip border px-4 ps-3 text-start text-[14.5px] font-medium leading-snug transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        on ? PILL_ON : PILL_OFF,
      )}
    >
      <span
        aria-hidden
        className={cn('grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors', on ? 'border-ink bg-ink text-paper' : 'border-hair-2 text-transparent')}
      >
        {Icon ? <Icon className="size-3" strokeWidth={2.4} /> : <Check className="size-3" strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}

/** One-of-many pills (radio semantics), for option sets too long for a Segmented control on phones. */
export function ChoicePills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  const { itemProps } = useRovingFocus({
    count: options.length,
    index: options.findIndex((o) => o.value === value),
    onMove: (i) => onChange(options[i].value),
    orientation: 'both',
  });
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-11 rounded-chip border px-4 text-[14.5px] font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
              on ? PILL_ON : PILL_OFF,
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The handoff note for a widget that also has a second button. Passed after that button in `secondaryAction`
 * (instead of `handoff.note`), so it takes the space left on the button row and wraps there, next to the
 * primary button it describes, instead of dropping to a line of its own.
 */
export function HandoffNote({ children }: { children: ReactNode }) {
  return <p className="m-0 min-w-36 flex-1 text-end text-[13px] leading-snug text-balance text-ink-3 max-sm:basis-full max-sm:text-start">{children}</p>;
}

/** Error state shared by every business tool (loading states live in skeletons.tsx). */
export function BizError({ href }: { href: string }) {
  const { t } = useBiz();
  return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href, label: t('error.fallback') }} />;
}
