/**
 * Loading states for the veterans-defence widgets, shaped like the finished cards (hero, questions, result
 * cards, footer) so the page barely moves when the output arrives. No hooks: renders on either side.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';

const PILLS = ['w-[126px]', 'w-[162px]', 'w-[180px]', 'w-[198px]', 'w-[108px]', 'w-[135px]', 'w-[99px]', 'w-[171px]', 'w-[153px]', 'w-[135px]', 'w-[144px]', 'w-[117px]'];

/** A section of the loading state: the mono title bar, then its body (same paddings as WidgetSection). */
function SkelSection({ children, title = 'w-32', first }: { children: ReactNode; title?: string; first?: boolean }) {
  return (
    <div className={cn('px-5 pt-5 sm:px-6', !first && 'mt-5 border-t border-hair')}>
      <Skeleton className={cn('mb-4 h-3', title)} />
      {children}
    </div>
  );
}
const SkelQuestion = ({ children }: { children: ReactNode }) => (
  <div className="min-w-0">
    <Skeleton className="mb-3 h-4 w-44" />
    {children}
  </div>
);

/**
 * Loading state shaped like the finished widget (hero, questions, result cards, join facts, footer), so
 * the page barely moves when the output arrives. Heights track the first render within about 10%.
 */
export function ShapedSkeleton({
  title,
  subtitle,
  icon,
  iconNode,
  tone,
  label,
  variant,
  compact,
  lead,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** A custom header tile, in place of `icon` + `tone` (same as WidgetShell's `iconNode`). */
  iconNode?: ReactNode;
  tone?: 'maple' | 'pine' | 'glacier';
  label: string;
  variant: 'careers' | 'benefits' | 'support';
  /** benefits: the answers are already known, so they show as one summary row. */
  compact?: boolean;
  /** Real content that needs no data (e.g. crisis lines), shown in place of the first placeholder. */
  lead?: ReactNode;
}) {
  const footer = (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hair px-5 pb-4 pt-5 sm:px-6">
        <Skeleton className="h-12 w-44 max-sm:w-full" round />
        <Skeleton className="h-12 w-52 max-sm:w-full" round />
        <Skeleton className="h-3.5 w-56 @xl:ms-auto" />
        <Skeleton className="h-3.5 w-full max-w-[420px]" />
        <Skeleton className="h-9 w-full @sm:hidden" />
      </div>
      <Skeleton className="h-[83px] w-full rounded-none opacity-60 @sm:h-14" />
    </>
  );
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6">
        <WidgetIcon icon={icon} node={iconNode} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {variant === 'careers' ? (
          <>
            <Skeleton className="mx-3 h-[164px] rounded-card sm:mx-4 @xl:h-[152px]" />
            <div className="px-5 pt-6 sm:px-6">
              <Skeleton className="mb-[18px] mt-2 h-4 w-44" />
              <Skeleton className="mb-2.5 h-3 w-36" />
              {/* Phones: six interest tiles in two columns and the "Show all" toggle. From @xl: 12 tiles, three to a row. */}
              <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3">
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} className={cn('h-[52px] rounded-field', i >= 6 && '@max-xl:hidden')} />
                ))}
              </div>
              <Skeleton className="mt-3.5 h-4 w-24 @xl:hidden" />
              <Skeleton className="mt-7 h-[96px] rounded-tile @xl:mt-4 @xl:h-[58px]" />
            </div>
            <SkelSection>
              <div className="grid gap-2.5 @xl:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className={cn('h-[152px] rounded-tile', i === 3 && '@max-xl:hidden')} />
                ))}
              </div>
              <Skeleton className="mx-auto mt-4 h-11 w-36" round />
              <Skeleton className="mt-4 h-[62px] rounded-field @xl:h-10" />
            </SkelSection>
            <SkelSection>
              {/* Three folded rows: can you join, pay, steps. */}
              <Skeleton className="h-[262px] rounded-tile @xl:h-[196px]" />
            </SkelSection>
            {footer}
          </>
        ) : variant === 'benefits' ? (
          <>
            <Skeleton className="mx-3 h-[134px] rounded-card sm:mx-4 @xl:h-[114px]" />
            <div className="px-5 pt-4 sm:px-6">
              <Skeleton className="h-[68px] rounded-tile @xl:h-[48px]" />
            </div>
            <SkelSection first>
              {compact ? (
                <div className="flex flex-wrap gap-1.5">
                  {PILLS.slice(0, 3).map((w, i) => (
                    <Skeleton key={i} className={cn('h-8', w)} round />
                  ))}
                </div>
              ) : (
                <>
                  <SkelQuestion>
                    <div className="flex flex-wrap gap-2">
                      {PILLS.slice(0, 6).map((w, i) => (
                        <Skeleton key={i} className={cn('h-11', w)} round />
                      ))}
                    </div>
                  </SkelQuestion>
                  <div className="mt-5 grid gap-5 @xl:grid-cols-2">
                    <SkelQuestion>
                      <Skeleton className="h-[52px] rounded-field" />
                    </SkelQuestion>
                    <SkelQuestion>
                      <Skeleton className="h-[52px] rounded-field" />
                    </SkelQuestion>
                  </div>
                  <div className="mt-5">
                    <SkelQuestion>
                      <Skeleton className="-mt-1 mb-3 h-3 w-56" />
                      <div className="flex flex-wrap gap-2">
                        {PILLS.slice(4, 11).map((w, i) => (
                          <Skeleton key={i} className={cn('h-11', w)} round />
                        ))}
                      </div>
                    </SkelQuestion>
                  </div>
                </>
              )}
            </SkelSection>
            <SkelSection>
              <div className="grid gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-[300px] rounded-tile @xl:h-[190px]" />
                ))}
              </div>
              <Skeleton className="mx-auto mt-4 h-11 w-48" round />
            </SkelSection>
            {footer}
          </>
        ) : (
          <>
            {lead ?? (
              <div className="px-5 sm:px-6">
                <Skeleton className="h-[176px] rounded-tile @xl:h-[124px]" />
              </div>
            )}
            <div className="px-5 sm:px-6">
              <Skeleton className="mb-3 mt-5 h-4 w-40" />
              <Skeleton className="h-[52px] rounded-field" />
              <Skeleton className="mt-5 h-[380px] rounded-card @xl:h-[340px]" />
            </div>
            {[2, 3, 2].map((n, s) => (
              <SkelSection key={s} title="w-48">
                <div className="grid gap-2">
                  {Array.from({ length: n }, (_, i) => (
                    <Skeleton key={i} className="h-[175px] rounded-tile @xl:h-[112px]" />
                  ))}
                </div>
              </SkelSection>
            ))}
            <Skeleton className="mx-5 mb-5 mt-5 h-3.5 w-64 sm:mx-6" />
            <Skeleton className="h-11 w-full rounded-none opacity-60" />
          </>
        )}
      </div>
    </Card>
  );
}
