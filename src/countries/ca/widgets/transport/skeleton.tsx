'use client';
/** Loading state that mirrors each tool's real layout (tokens only; RTL-safe). */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, WidgetIcon, type WidgetTone } from '@/components/ui';
import { ContentPart, type ContentBlock } from './skeleton-blocks';
import { ControlPart, isControl, type ControlBlock } from './skeleton-controls';

type SkeletonBlock = ContentBlock | ControlBlock;

/**
 * Like WidgetSkeleton, but built from the blocks the real output uses (hero, controls, lists), so the card keeps
 * roughly its final height and nothing jumps when the answer arrives.
 */
export function ToolSkeleton({ title, subtitle, icon, tone, label, blocks }: { title: ReactNode; subtitle?: ReactNode; icon: LucideIcon; tone: WidgetTone; label: string; blocks: SkeletonBlock[] }) {
  return (
    <Card as="section" aurora aria-busy="true" className="text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status" className="@container">
        <span className="sr-only">{label}</span>
        {blocks.map((b, i) =>
          isControl(b) ? <ControlPart key={i} kind={b} /> : <ContentPart key={i} kind={b} />,
        )}
      </div>
    </Card>
  );
}
