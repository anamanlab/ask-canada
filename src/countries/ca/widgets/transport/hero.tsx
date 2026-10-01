'use client';
/** The verdict card at the top of every transport widget, and the sentence it announces when a control changes it. */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LiveRegion } from '@/components/ui';
import { cn } from '@/lib/cn';

type HeroTone = 'ok' | 'warn' | 'danger' | 'info' | 'alert';

const heroBg: Record<HeroTone, string> = {
  ok: 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_55%,color-mix(in_oklab,var(--aurora-violet,var(--glacier))_10%,transparent))]',
  info: 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_16%,transparent),color-mix(in_oklab,var(--pine)_8%,transparent)_60%,transparent)]',
  warn: 'border-amber/20 bg-[linear-gradient(135deg,var(--amber-wash),color-mix(in_oklab,var(--maple)_6%,transparent))]',
  danger: 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_10%,transparent),color-mix(in_oklab,var(--maple)_4%,transparent))]',
  /** Urgent but calm: a neutral surface where only the icon carries the colour (recalls on file). */
  alert: 'border-hair bg-paper-2/70',
};
const dotCls: Record<HeroTone, string> = {
  ok: 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]',
  info: 'bg-glacier shadow-[0_0_0_6px_var(--glacier-wash)]',
  warn: 'bg-amber shadow-[0_0_0_6px_var(--amber-wash)]',
  danger: 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
  alert: 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
};

const statusDot = { live: 'bg-pine', warn: 'bg-amber', quiet: 'bg-ink-3' } as const;

/**
 * The header badge's status, repeated in the verdict on phones: WidgetShell hides its badge below `sm`, where the
 * same fact would otherwise only appear in the footer after a long scroll. Same breakpoint, so it never shows twice.
 */
export function HeroStatus({ tone = 'live', children }: { tone?: keyof typeof statusDot; children: ReactNode }) {
  return (
    <p className="m-0 mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-2 tabular-nums sm:hidden">
      <span className={cn('mt-[6px] size-1.5 shrink-0 rounded-full', statusDot[tone])} aria-hidden />
      <span className="min-w-0 text-pretty">{children}</span>
    </p>
  );
}

/** Join a verdict's parts into one spoken announcement ("You can fly with it. Keep it in your carry-on."). */
export const say = (...parts: (string | false | null | undefined)[]) =>
  parts
    .filter((p): p is string => !!p)
    .map((p) => (/[.!?…»”"]$/.test(p.trim()) ? p.trim() : `${p.trim()}.`))
    .join(' ');

/**
 * Icon dot, serif headline, supporting line, optional extra. The headline and the line are each isolated (`<bdi>`):
 * an English fallback sentence on a right-to-left page keeps its own order ("$5,000 off…", not "off… $5,000"). In a narrow card (a phone) the icon sits above the
 * headline, so a long French verdict gets the card's full width instead of a squeezed column beside the dot.
 * `announce`: the verdict as one sentence, for widgets whose controls change it. It is read politely once the person
 * stops adjusting, and never when the widget first appears (see `LiveRegion`).
 */
export function Hero({ tone, icon: Icon, title, sub, children, className, announce }: { tone: HeroTone; icon: LucideIcon; title: ReactNode; sub?: ReactNode; children?: ReactNode; className?: string; announce?: string }) {
  return (
    <div className={cn('relative mx-2 overflow-hidden rounded-[22px] border px-4 py-5 @sm:mx-3 @sm:px-5 sm:mx-4', heroBg[tone], className)}>
      <div className="flex flex-col items-start gap-3.5 @sm:flex-row">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-card @sm:size-9', dotCls[tone])} aria-hidden>
          <Icon className="size-4 @sm:size-[18px]" strokeWidth={2.3} />
        </span>
        <div className="min-w-0 flex-1 self-stretch">
          {/* A heading, so screen-reader heading navigation lands on the verdict (same level as the sections below it). */}
          <h4 className="m-0 text-balance font-serif text-[24px] font-normal leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] sm:text-[25px]">
            <bdi>{title}</bdi>
          </h4>
          {sub ? (
            <p className="m-0 mt-1.5 text-pretty text-[15px] leading-snug text-ink-2">
              <bdi>{sub}</bdi>
            </p>
          ) : null}
          {children}
        </div>
      </div>
      {announce ? <LiveRegion text={announce} /> : null}
    </div>
  );
}
