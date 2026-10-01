/**
 * Notice implementation, shared by the widget kit ('@/components/ui/Notice', merges `className` with
 * tailwind-merge) and the plain build for the app shell ('@/components/ui/plain/Notice').
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import type { ClassJoiner } from '@/lib/cx';

const tones = {
  warn: { cls: 'bg-amber-wash text-ink [--ic:var(--amber)]', icon: AlertTriangle },
  info: { cls: 'bg-glacier-wash text-ink [--ic:var(--glacier)]', icon: Info },
  ok: { cls: 'bg-pine-wash text-ink [--ic:var(--pine)]', icon: CheckCircle2 },
  danger: { cls: 'bg-maple-wash text-ink [--ic:var(--maple)]', icon: OctagonAlert },
};

/** Build the notice component around a class joiner. Call once at module scope. */
export function createNotice(cn: ClassJoiner) {
  return function Notice({
    tone = 'info',
    icon,
    title,
    children,
    live,
    className,
  }: {
    tone?: keyof typeof tones;
    icon?: LucideIcon;
    title?: ReactNode;
    children?: ReactNode;
    live?: boolean;
    className?: string;
  }) {
    const Icon = icon ?? tones[tone].icon;
    return (
      <div role={live ? 'status' : undefined} className={cn('flex gap-3 rounded-[16px] px-4 py-3.5 text-[14.5px] leading-snug', tones[tone].cls, className)}>
        <Icon className="mt-px size-[18px] shrink-0 text-[var(--ic)]" strokeWidth={1.9} aria-hidden />
        <div className="min-w-0">
          {title ? <strong className="font-semibold">{title}</strong> : null}
          {title && children ? ' ' : null}
          {children ? <span className="text-ink-2">{children}</span> : null}
        </div>
      </div>
    );
  };
}
