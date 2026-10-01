/**
 * Skeleton: shimmering placeholder. Match the final layout's size to avoid layout shift.
 * <Skeleton className="h-6 w-40" />   <SkeletonText lines={3} />   <WidgetSkeleton title="Passport renewal planner" />
 */
import { cn } from '@/lib/cn';

export function Skeleton({ className, round }: { className?: string; round?: boolean }) {
  return <span aria-hidden className={cn('shimmer block', round ? 'rounded-full' : 'rounded-[10px]', className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cn('flex flex-col gap-2.5', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </span>
  );
}
