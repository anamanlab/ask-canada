'use client';
/**
 * Renderers for the `immigration` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 * Each renderer is its own chunk: an answer about visas doesn't download the CRS calculator (the chat shows its
 * loading skeleton while a renderer arrives).
 */
import { lazy, type ComponentType } from 'react';
import type { Renderers, WidgetProps, WidgetRenderer } from '@/lib/widgets/types';

type Props = WidgetProps<unknown, unknown>;

/**
 * Lab fixtures are built in English and carry their French build as `output.fr` (fixtures.ts): the lab page in
 * French shows that one, with French sources, links and round names, exactly like a real French answer. A tool
 * output never has `fr`, so in the chat this passes the part through untouched.
 */
function renderer(load: () => Promise<{ default: WidgetRenderer }>): WidgetRenderer {
  const Widget = lazy(load) as unknown as ComponentType<Props>;
  function InPageLanguage(props: Props) {
    const fr = props.locale === 'fr' ? (props.part.output as { fr?: unknown } | undefined)?.fr : undefined;
    return <Widget {...props} part={fr ? { ...props.part, output: fr } : props.part} />;
  }
  return InPageLanguage as WidgetRenderer;
}

export const renderers: Renderers = {
  immigrationCrsCalculator: renderer(() => import('./CrsCalculator').then((m) => ({ default: m.CrsCalculator }))),
  immigrationEligibility: renderer(() => import('./Eligibility').then((m) => ({ default: m.Eligibility }))),
  immigrationProcessingTimes: renderer(() => import('./ProcessingTimes').then((m) => ({ default: m.ProcessingTimes }))),
  immigrationVisaCheck: renderer(() => import('./VisaCheck').then((m) => ({ default: m.VisaCheck }))),
  immigrationPermits: renderer(() => import('./Permits').then((m) => ({ default: m.Permits }))),
};
export default renderers;
