'use client';
/** Example widget: a list of upcoming holidays, built only from core primitives. */
import { CalendarDays } from 'lucide-react';
import { DateTile, WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Output = { holidays: { date: string; name: { en: string; fr: string } }[]; sources: ToolSource[] };

function HolidaysNext({ part }: WidgetProps<{ count?: number }, Output>) {
  const t = useMessages(messages);
  const { locale, fmt } = useLocale();
  if (part.state === 'output-error') return <WidgetError />;
  if (part.state !== 'output-available' || !part.output) return <WidgetSkeleton title={t('title')} icon={CalendarDays} tone="pine" />;
  return (
    <WidgetShell icon={CalendarDays} tone="pine" title={t('title')} subtitle={t('subtitle')} sources={part.output.sources}>
      <ul className="m-0 grid list-none gap-1 px-5 pb-5 sm:px-6">
        {part.output.holidays.map((h) => (
          <li key={h.date} className="flex items-center gap-3.5 border-t border-hair py-2.5 first:border-t-0">
            <DateTile date={h.date} tone="pine" />
            <span>
              <span className="block text-[15px] font-semibold">{h.name[locale === 'fr' ? 'fr' : 'en']}</span>
              <span className="block text-[13px] text-ink-3">{fmt.date(h.date, { weekday: 'long' })}</span>
            </span>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

export const renderers: Renderers = { holidaysNext: HolidaysNext };
export default renderers;
