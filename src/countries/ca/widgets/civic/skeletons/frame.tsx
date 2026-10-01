/**
 * The frame every civic loading state shares, shaped like WidgetShell (header, body, action bar, source
 * footer), so nothing jumps when the output arrives.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';

export function Frame({ icon, tone, title, subtitle, label, children, actions = 1 }: { icon: LucideIcon; tone: WidgetTone; title: string; subtitle: ReactNode; label: string; children: ReactNode; actions?: number }) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {children}
      </div>
      {/* Action bar (handoff button + note) and the source footer. */}
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-11 w-full rounded-chip sm:w-56" />
          {actions > 1 ? <Skeleton className="h-11 w-full rounded-chip sm:h-12 sm:w-40" /> : null}
          <SkeletonText lines={2} className="ms-auto w-44 max-sm:ms-0 max-sm:w-full" />
        </div>
        <Skeleton className="mt-3 h-3.5 w-4/5" />
      </div>
      <div className="flex h-11 items-center justify-between bg-paper-2 px-5 sm:px-6" aria-hidden>
        <Skeleton className="h-3.5 w-52" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    </Card>
  );
}

export const SectionTitle = ({ className }: { className?: string }) => <Skeleton className={cn('mb-3.5 h-3 w-36', className)} />;
