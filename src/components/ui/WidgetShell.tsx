/**
 * WidgetShell: the frame every in-chat widget uses.
 *
 * <WidgetShell
 *   icon={BookUser} | iconNode={<PassportCover/>}   // Lucide icon or a custom illustration
 *   tone="maple|pine|glacier|amber"                  // icon tile colour
 *   title="Passport renewal planner" subtitle="Adult passport · applying in Canada"
 *   badge={<Badge icon={Smartphone}>Saved on this device only</Badge>}
 *   sources={output.sources}                          // ToolSource[]: footer shows the first + checked date
 *   handoff={{ href, label: 'Continue on canada.ca', note: "You'll sign in to the IRCC Portal…" }}
 *   secondaryAction={<Button …>Save plan</Button>}
 *   footnote="Your plan is saved on this device only."
 * >
 *   <WidgetSection title="Can you renew?" aside={<Badge tone="ok">Yes</Badge>}>…</WidgetSection>
 * </WidgetShell>
 *
 * Also exported: WidgetSection, WidgetSkeleton (loading state), WidgetError (error state), SourceFooter,
 * SourceFooterContext (the chat sets `listedInAnswer` so the footer drops "+N more": the answer's own
 * Sources list already shows every page).
 */
'use client';
import { createContext, useContext, useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { hostOf } from '@/lib/url';
import type { ToolSource } from '@/lib/widgets/types';
import { useLocale } from '@/lib/i18n/provider';
import { pack } from '@/countries/active';
import { Card } from './Card';
import { Button, LinkButton } from './Button';
import { Skeleton, SkeletonText } from './Skeleton';

export type WidgetTone = 'maple' | 'pine' | 'glacier' | 'amber';
const toneCls: Record<WidgetTone, string> = {
  maple: 'bg-maple-wash text-maple',
  pine: 'bg-pine-wash text-pine',
  glacier: 'bg-glacier-wash text-glacier',
  amber: 'bg-amber-wash text-amber',
};

export type Handoff = { href: string; label: string; note?: string };

type ShellProps = {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  tone?: WidgetTone;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  sources?: ToolSource[];
  handoff?: Handoff;
  secondaryAction?: ReactNode;
  footnote?: ReactNode;
  aurora?: boolean;
  className?: string;
  children?: ReactNode;
  /** id of the title heading (for aria-labelledby); defaults to a unique generated id. */
  labelId?: string;
};

export function WidgetIcon({ icon: Icon, node, tone = 'maple', size = 'md' }: { icon?: LucideIcon; node?: ReactNode; tone?: WidgetTone; size?: 'sm' | 'md' }) {
  if (node) return <span className="grid shrink-0 place-items-center">{node}</span>;
  return (
    <span className={cn('grid shrink-0 place-items-center', size === 'md' ? 'size-[42px] rounded-[13px]' : 'size-9 rounded-[11px]', toneCls[tone])}>
      {Icon ? <Icon className={size === 'md' ? 'size-5' : 'size-[18px]'} strokeWidth={1.8} aria-hidden /> : null}
    </span>
  );
}

export function WidgetShell({
  icon,
  iconNode,
  tone = 'maple',
  title,
  subtitle,
  badge,
  sources,
  handoff,
  secondaryAction,
  footnote,
  aurora = true,
  className,
  children,
  labelId,
}: ShellProps) {
  const autoId = useId();
  const id = labelId ?? autoId;
  const hasActions = handoff || secondaryAction;
  return (
    <Card as="section" aria-labelledby={id} aurora={aurora} className={cn('text-start', className)}>
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} node={iconNode} tone={tone} />
        <div className="min-w-0 flex-1">
          <h3 id={id} className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">
            {title}
          </h3>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
        </div>
        {badge ? <div className="hidden shrink-0 sm:block">{badge}</div> : null}
      </header>
      {children}
      {hasActions ? (
        <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {handoff ? (
              <LinkButton href={handoff.href} external variant="primary" className="max-sm:w-full">
                {handoff.label}
              </LinkButton>
            ) : null}
            {secondaryAction}
            {handoff?.note ? (
              <p className="m-0 ms-auto max-w-[28ch] text-end text-[13px] leading-snug text-balance text-ink-3 max-sm:ms-0 max-sm:max-w-none max-sm:text-start">
                {handoff.note}
              </p>
            ) : null}
          </div>
          {footnote ? <p className="m-0 mt-3 text-[13px] text-ink-3">{footnote}</p> : null}
        </div>
      ) : footnote ? (
        <p className="m-0 px-5 pb-4 text-[13px] text-ink-3 sm:px-6">{footnote}</p>
      ) : null}
      {sources?.length ? <SourceFooter sources={sources} /> : null}
    </Card>
  );
}

export function WidgetSection({
  title,
  aside,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** id of the section heading; defaults to a unique generated id (safe when a widget renders twice). */
  id?: string;
}) {
  const autoId = useId();
  const headingId = id ?? autoId;
  return (
    <section className={cn('px-5 pt-5 sm:px-6 [&+&]:mt-5 [&+&]:border-t [&+&]:border-hair', className)} aria-labelledby={title ? headingId : undefined}>
      {title || aside ? (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          {title ? (
            <h4 id={headingId} className="m-0 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
              {title}
            </h4>
          ) : (
            <span />
          )}
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Re-exported for widgets, which import it from here. */
export { hostOf };

export const SourceFooterContext = createContext<{ listedInAnswer?: boolean }>({});

export function SourceFooter({ sources }: { sources: ToolSource[] }) {
  const { t, fmt } = useLocale();
  const { listedInAnswer } = useContext(SourceFooterContext);
  const s = sources[0];
  const Mark = pack.brand.Mark;
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-paper-2 px-5 py-3 sm:px-6">
      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-8 min-w-0 items-center gap-2.5 text-[12.5px] text-ink-2 no-underline"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-maple text-white">
          <Mark className="size-3" />
        </span>
        <span className="text-ink-3">{t('source.label')}</span>
        <span className="min-w-0 truncate font-mono text-[12px] text-ink-2 underline decoration-hair-2 underline-offset-[3px] group-hover:decoration-ink-2">
          {hostOf(s.url)} › {s.title}
        </span>
        <span className="sr-only"> {t('a11y.newTab')}</span>
      </a>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] text-pine">
        {s.live ? (
          <>
            <span className="size-1.5 rounded-full bg-pine" aria-hidden />
            {t('source.live')}
          </>
        ) : (
          <>
            <Check className="size-3.5" strokeWidth={2.2} aria-hidden />
            {t('source.checked', { date: fmt.date(s.checked, { month: 'short', day: 'numeric', year: 'numeric' }) })}
          </>
        )}
        {sources.length > 1 && !listedInAnswer ? <span className="text-ink-3">· {t('source.more', { count: sources.length - 1 })}</span> : null}
      </span>
    </footer>
  );
}

/** Loading state that mirrors the shell's layout (no layout shift when the output arrives). */
export function WidgetSkeleton({
  title,
  subtitle,
  icon,
  iconNode,
  tone,
  rows = 3,
  label,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  tone?: WidgetTone;
  rows?: number;
  label?: string;
}) {
  const { t } = useLocale();
  return (
    <Card as="section" aurora aria-busy="true" className="text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6">
        <WidgetIcon icon={icon} node={iconNode} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div className="px-5 pb-6 sm:px-6" role="status">
        <span className="sr-only">{label ?? t('widget.loading')}</span>
        <Skeleton className="mb-4 h-24 w-full rounded-[20px]" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-hair py-3.5 first:border-t-0">
            <Skeleton className="size-6" round />
            <SkeletonText lines={1} className="flex-1" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Error state: plain-language message, a retry (optional) and the official page to fall back on. */
export function WidgetError({
  title,
  message,
  onRetry,
  fallback,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  fallback?: { href: string; label: string };
}) {
  const { t } = useLocale();
  return (
    <Card as="section" role="alert" className="text-start">
      <div className="flex gap-3.5 px-5 py-5 sm:px-6">
        <WidgetIcon icon={AlertTriangle} tone="amber" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[16px] font-semibold text-ink">{title ?? t('widget.errorTitle')}</p>
          <p className="m-0 mt-1 text-[14.5px] text-ink-2">{message ?? t('widget.errorBody')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
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
      </div>
    </Card>
  );
}
