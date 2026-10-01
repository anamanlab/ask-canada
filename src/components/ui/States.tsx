/**
 * EmptyState / ErrorState: full-width states for lists and panels.
 * <EmptyState icon={Inbox} title="No saved plans yet" action={<Button …/>}>Plans you save appear here.</EmptyState>
 * <ErrorState title="We couldn’t reach weather.gc.ca" onRetry={retry} fallback={{ href, label }} />
 */
'use client';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CloudOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/provider';
import { Button, LinkButton } from './Button';

export function EmptyState({ icon: Icon, title, children, action, className }: { icon?: LucideIcon; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-card border border-dashed border-hair-2 px-6 py-10 text-center', className)}>
      {Icon ? (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-paper-2 text-ink-2">
          <Icon className="size-6" strokeWidth={1.6} aria-hidden />
        </span>
      ) : null}
      <p className="m-0 font-serif text-[22px] leading-tight tracking-[-.02em] text-ink">{title}</p>
      {children ? <p className="m-0 mt-2 max-w-[42ch] text-[15px] text-ink-3">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  children,
  onRetry,
  fallback,
  className,
}: {
  title?: ReactNode;
  children?: ReactNode;
  onRetry?: () => void;
  fallback?: { href: string; label: string };
  className?: string;
}) {
  const t = useT();
  return (
    <div role="alert" className={cn('flex flex-col items-center rounded-card bg-paper-2 px-6 py-9 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-wash text-amber">
        <CloudOff className="size-6" strokeWidth={1.6} aria-hidden />
      </span>
      <p className="m-0 font-serif text-[22px] leading-tight tracking-[-.02em] text-ink">{title ?? t('widget.errorTitle')}</p>
      <p className="m-0 mt-2 max-w-[44ch] text-[15px] text-ink-3">{children ?? t('widget.errorBody')}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button size="sm" icon={RotateCcw} onClick={onRetry}>
            {t('widget.retry')}
          </Button>
        ) : null}
        {fallback ? (
          <LinkButton size="sm" variant="secondary" href={fallback.href} external>
            {fallback.label}
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}
