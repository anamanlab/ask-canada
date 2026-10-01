'use client';
/**
 * Loading states for the business tools. Each one mirrors its widget's real structure (hero, inputs,
 * sections, handoff and source footer) with the same container-query breakpoints, so the card keeps
 * roughly its final height when the output arrives: no layout jump.
 */
import type { LucideIcon } from 'lucide-react';
import { Card, WidgetIcon, type WidgetTone } from '@/components/ui';
import { BODY, type SkeletonInput, type SkeletonKind } from './skeleton-bodies';
import { Longer } from './skeleton-parts';
import { useBiz } from './shared';

export function BizSkeleton({
  kind,
  title,
  subtitle,
  icon,
  tone,
  input,
}: {
  kind: SkeletonKind;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: WidgetTone;
  /** The tool input so far: sizes the loading state like the answer it announces. */
  input?: SkeletonInput;
}) {
  const { t, lang } = useBiz();
  return (
    <Longer.Provider value={lang === 'fr' ? 1 : 0}>
      <Card as="section" aurora aria-busy="true" className="@container text-start">
        <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
          <WidgetIcon icon={icon} tone={tone} />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
          </div>
        </header>
        <div role="status">
          <span className="sr-only">{t('loading')}</span>
        </div>
        <div aria-hidden>{BODY[kind](input)}</div>
      </Card>
    </Longer.Provider>
  );
}
