'use client';
/**
 * Renders one `tool-*` message part: looks the tool up in the active pack's widget registry
 * (lazy, code-split per widget), wraps it in an error boundary and a spring entrance.
 * Unknown tools render a neutral card; core tools (suggestFollowUps) are handled by the message.
 *
 * Memoized on what a widget can actually see (state, input, output, errorText): the AI SDK clones every
 * part of the streaming message on each chunk, so the part object itself changes identity constantly.
 */
import './chat.css';
import { Component, Suspense, createElement, memo, use, type ReactNode } from 'react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { Blocks, type LucideIcon } from 'lucide-react';
import { widgets } from '@/countries/active.widgets';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui/WidgetShell';
import { EnglishFallback, useLocale } from '@/lib/i18n/provider';
import type { Locale } from '@/lib/i18n/config';
import { findWidget, toolNameOf, type WidgetModule, type WidgetPart, type WidgetProps } from '@/lib/widgets/types';

/** Builders write en + fr catalogs; a widget declares more in the registry (`locales`) once translated. */
const DEFAULT_WIDGET_LOCALES: readonly Locale[] = ['en', 'fr'];

const modules = new Map<string, Promise<WidgetModule | null>>();

/** Load (once) the widget module that owns a tool, by tool-name prefix. */
function loadModule(toolName: string): Promise<WidgetModule | null> {
  const entry = findWidget(widgets, toolName);
  const key = entry?.id ?? '';
  if (!modules.has(key)) modules.set(key, entry ? entry.load().catch(() => null) : Promise.resolve(null));
  return modules.get(key)!;
}

function LoadedWidget({ part }: WidgetProps) {
  const { locale } = useLocale();
  const toolName = toolNameOf(part.type);
  const mod = use(loadModule(toolName));
  const renderers = mod?.renderers ?? mod?.default ?? {};
  const Renderer = renderers[toolName];
  // Each renderer narrows its own part (input and output come from the tool it is registered for).
  return Renderer ? createElement(Renderer, { part: part as WidgetPart<never, never>, locale }) : <UnknownTool part={part} locale={locale} />;
}

function UnknownTool({ part }: WidgetProps) {
  const { t } = useLocale();
  const name = toolNameOf(part.type);
  if (part.state !== 'output-available' && part.state !== 'output-error') {
    return <WidgetSkeleton title={t('widget.working')} icon={Blocks} tone="glacier" rows={2} />;
  }
  return (
    <WidgetShell icon={Blocks} tone="glacier" title={t('widget.unknownTitle')} subtitle={name} aurora={false}>
      <p className="m-0 px-5 pb-5 text-[14.5px] text-ink-2 sm:px-6">{t('widget.unknownBody')}</p>
    </WidgetShell>
  );
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[widget] render failed', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Shown while the widget's code loads. When the pack declares the tool's header (registry `heads`), the
 * skeleton already carries the real title, subtitle and icon; otherwise a neutral skeleton with the same
 * two-line header height. Exported for the lab, which holds a fixture's place with it.
 */
export function LoadingWidget({ toolName }: { toolName: string }) {
  const { locale, t } = useLocale();
  const head = findWidget(widgets, toolName)?.heads?.[toolName];
  if (!head) return <WidgetSkeleton title={t('widget.working')} subtitle={t('widget.loading')} icon={Blocks} tone="glacier" rows={3} />;
  return (
    <WidgetSkeleton
      title={head.title[locale] ?? head.title.en}
      subtitle={head.subtitle ? (head.subtitle[locale] ?? head.subtitle.en) : undefined}
      icon={head.icon as LucideIcon | undefined}
      iconNode={head.iconNode?.()}
      tone={head.tone}
      rows={head.rows ?? 3}
    />
  );
}

type ToolPartProps = {
  part: WidgetPart;
  /**
   * Play the spring entrance when the widget mounts (default). The chat turns it off for answers restored
   * from history, so reopening a conversation doesn't replay every widget's arrival.
   */
  appear?: boolean;
};

function ToolPartImpl({ part, appear = true }: ToolPartProps) {
  const { locale, t } = useLocale();
  const reduce = useReducedMotion();
  const toolName = toolNameOf(part.type);
  // A widget renders in the interface language when its catalog covers it, otherwise whole in English.
  const covered = (findWidget(widgets, toolName)?.locales ?? DEFAULT_WIDGET_LOCALES).includes(locale);
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="ac-widget"
        initial={reduce || !appear ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }}
        data-tool={toolName}
      >
        <Boundary fallback={<WidgetError title={t('widget.errorTitle')} message={t('widget.errorBody')} />}>
          {covered ? (
            <Suspense fallback={<LoadingWidget toolName={toolName} />}>
              <LoadedWidget part={part} locale={locale} />
            </Suspense>
          ) : (
            <EnglishFallback>
              <Suspense fallback={<LoadingWidget toolName={toolName} />}>
                <LoadedWidget part={part} locale="en" />
              </Suspense>
            </EnglishFallback>
          )}
        </Boundary>
      </m.div>
    </LazyMotion>
  );
}

/** `appear` only matters on mount, so it is left out of the comparison. */
const samePart = (a: ToolPartProps, b: ToolPartProps) =>
  a.part.type === b.part.type &&
  a.part.toolCallId === b.part.toolCallId &&
  a.part.state === b.part.state &&
  a.part.input === b.part.input &&
  a.part.output === b.part.output &&
  a.part.errorText === b.part.errorText;

export const ToolPart = memo(ToolPartImpl, samePart);
