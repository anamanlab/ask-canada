'use client';
/**
 * Widget `holidays`: the next days the federal administration has no service, telling the two apart.
 *
 * The distinction the whole widget exists for: a *feriado nacional* is fixed in law, while a *ponto
 * facultativo* is merely a day the federal administration does not work. Carnaval and Corpus Christi are
 * pontos facultativos; Good Friday is a feriado nacional. Showing them as one undifferentiated list is the
 * mistake most assistants make, so each row is labelled and the legend says why.
 *
 * Built only from core primitives (`@/components/ui`) and design tokens; no user-visible string in TSX.
 */
import { CalendarDays, CircleDot } from 'lucide-react';
import { DateTile, WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Day = { date: string; name: { en: string; pt: string }; kind: 'feriado' | 'ponto' };
type Output = { today: string; holidays: Day[]; sources: ToolSource[] };

function HolidaysNext({ part }: WidgetProps<{ count?: number }, Output>) {
  const t = useMessages(messages);
  const { locale, fmt } = useLocale();
  const nameOf = (d: Day) => d.name[locale === 'en' ? 'en' : 'pt'] ?? d.name.en;

  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <WidgetSkeleton title={t('title')} icon={CalendarDays} tone="pine" rows={3} />;
  }

  const days = part.output.holidays;

  return (
    <WidgetShell
      icon={CalendarDays}
      tone="pine"
      title={t('title')}
      subtitle={t('subtitle')}
      sources={part.output.sources}
      footnote={t('note')}
    >
      {days.length === 0 ? (
        <p className="m-0 px-5 pb-5 text-[15px] text-ink-2 sm:px-6">{t('empty')}</p>
      ) : (
        <>
          <dl className="m-0 grid list-none gap-0 px-5 pb-1 pt-1 sm:px-6">
            {days.map((d) => {
              const feriado = d.kind === 'feriado';
              return (
                <div key={d.date} className="flex items-start gap-3.5 border-t border-hair py-3 first:border-t-0">
                  <DateTile date={d.date} tone={feriado ? 'pine' : 'glacier'} />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[15px] font-semibold leading-snug text-ink">{nameOf(d)}</p>
                    <p className="m-0 text-[13px] text-ink-3">
                      {fmt.date(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="m-0 mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
                      <CircleDot className="size-3 shrink-0" aria-hidden style={{ color: feriado ? 'var(--pine)' : 'var(--glacier)' }} />
                      {feriado ? t('legend') : t('legendOptional')}
                    </p>
                  </div>
                </div>
              );
            })}
          </dl>
          <p className="m-0 border-t border-hair px-5 py-3 text-[12.5px] leading-snug text-ink-3 sm:px-6">
            <b className="font-semibold text-ink-2">{t('legend')}.</b> {t('legendHint')}{' '}
            <b className="font-semibold text-ink-2">{t('legendOptional')}.</b> {t('legendOptionalHint')}
          </p>
        </>
      )}
    </WidgetShell>
  );
}

export const renderers: Renderers = { holidaysNext: HolidaysNext };
export default renderers;