'use client';
/**
 * Building blocks of the contact loading states. Static copy (chips, line names, section titles) is laid out
 * for real but drawn as shimmer, so wrapping and height match the final card in every language.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { useLang } from '../clock';
import { LINES } from '../data';
import { formatDays, formatTime, OTTAWA, typicalWindow } from '../hours';
import messages from '../messages';
import { amberPanel } from '../primitives';

/** Real text, drawn as shimmer bars (one per line fragment). */
export function Ghost({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('shimmer select-none rounded-[6px] text-transparent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]', className)}>{children}</span>;
}

/** The shell's header with its real title, a status line for screen readers, and the placeholder body. */
export function Frame({ icon, tone, title, subtitle, label, children }: { icon: LucideIcon; tone: WidgetTone; title: string; subtitle: string; label: string; children: ReactNode }) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status" className="sr-only">
        {label}
      </div>
      <div aria-hidden>{children}</div>
    </Card>
  );
}

/** Handoff row + source footer, as WidgetShell draws them. With `quiet`, the directory's single text link. */
export function ShellFooter({ note, quiet }: { note?: string; quiet?: string }) {
  return (
    <>
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
        {quiet ? (
          <span className="flex min-h-11 items-center text-[14.5px] font-medium">
            <Ghost>{quiet}</Ghost>
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton className="h-11 w-60 rounded-full max-sm:w-full" />
            <p className="m-0 ms-auto max-w-[28ch] text-end text-[13px] leading-snug text-balance max-sm:ms-0 max-sm:max-w-none max-sm:text-start">
              <Ghost>{note}</Ghost>
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-paper-2 px-5 py-3 sm:px-6">
        <span className="flex min-h-8 items-center gap-2.5">
          <Skeleton className="size-5 rounded-[6px]" />
          <Skeleton className="h-3 w-48" />
        </span>
        <span className="flex h-[19px] items-center">
          <Skeleton className="h-3 w-36" />
        </span>
      </div>
    </>
  );
}

export function NoticeGhost({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-tile bg-paper-2 px-4 py-3.5 text-[14.5px] leading-snug">
      <Skeleton className="size-[18px] shrink-0" />
      <p className="m-0">
        <Ghost>{title}</Ghost> <Ghost>{body}</Ghost>
      </p>
    </div>
  );
}

/** A numbered list of steps under a section title, as `WidgetSection` + `Stepper` draw them. */
export function StepsGhost({ title, steps, children }: { title: string; steps: { key: string; title: string; detail: string; extra?: ReactNode }[]; children?: ReactNode }) {
  return (
    <div className="mt-5 px-5 pt-5 sm:px-6">
      <p className="m-0 mb-3.5 font-mono text-[12px] uppercase tracking-[.12em]">
        <Ghost>{title}</Ghost>
      </p>
      {steps.map((s) => (
        <div key={s.key} className="flex gap-3.5 pb-3.5">
          <Skeleton className="size-6 shrink-0" round />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="m-0 text-[15px] font-semibold leading-snug">
              <Ghost>{s.title}</Ghost>
            </p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug">
              <Ghost>{s.detail}</Ghost>
            </p>
            {s.extra}
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}

/** A fixed weekday morning, only to word the Anti-Fraud Centre's usual hours in this language (drawn as shimmer). */
const SAMPLE_DAY = Date.UTC(2026, 0, 5, 12);

/**
 * The Anti-Fraud Centre card. `hero` (fraud): the amber card with one button; `status` adds the pill that sits
 * beside the title when the card is not inside the steps.
 */
export function CafcGhost({ hero, status, buttons, className }: { hero?: boolean; status?: boolean; buttons: string[]; className?: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { intl } = useLocale();
  const { name, covers, agents } = LINES.cafc;
  const usual = agents ? typicalWindow(agents, SAMPLE_DAY, OTTAWA) : null;
  return (
    <div className={cn('rounded-card border px-5 py-5', hero ? amberPanel : 'border-hair', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[.08em]">
            <Ghost>{t('line.cafc.eyebrow')}</Ghost>
          </p>
          <p className="m-0 mt-1.5 text-[16px] font-semibold leading-snug">
            <Ghost>{name[lang]}</Ghost>
          </p>
        </div>
        {status ? <Skeleton className="h-6 w-44 rounded-full" /> : null}
      </div>
      <p className="m-0 mt-1 text-[13.5px] leading-snug">
        <Ghost>{covers[lang]}</Ghost>
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="flex min-h-11 items-center">
          <Skeleton className="h-[30px] w-52" />
        </span>
        <span className="flex gap-2">
          {buttons.map((w) => (
            <Skeleton key={w} className={cn('h-11 rounded-full', w)} />
          ))}
        </span>
      </div>
      {agents && usual ? (
        <p className="m-0 mt-3 text-[13.5px] leading-snug">
          <Ghost>{t('fraud.hours', { days: formatDays(agents.days, intl), from: formatTime(usual.start, OTTAWA, intl), to: formatTime(usual.end, OTTAWA, intl) })}</Ghost>
        </p>
      ) : null}
    </div>
  );
}
