'use client';
/**
 * Widget `anvisa`: registered medicines from ANVISA (Agência Nacional de Vigilância Sanitária).
 *
 * Source: ANVISA public search — registered medicines, active substances, holders.
 * Returns registration details: number, product, active substance, therapeutic class, presentation, manufacturer.
 */
import { Pill, Building, CheckCircle, Warning } from '@phosphor-icons/react';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import * as messages from './messages';

type Localized = { pt: string; en: string };
type Medicine = {
  registro: string;
  produto: string;
  principioAtivo: string;
  categoria: string;
  classeTerapeutica?: string;
  apresentacao: string;
  empresa: string;
  cnpjEmpresa: string;
  situacao: string;
  vencimentoRegistro?: string;
};
type Output = {
  query: string;
  count: number;
  medicines: Medicine[];
  sources?: ToolSource[];
};

function AnvisaWidget({ part }: WidgetProps<{ query: string; limit?: number }, Output>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const en = locale === 'en';

  const out = part.state === 'output-available' ? part.output : undefined;
  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('title')} icon={Pill} tone="amber" rows={3} />;
  }

  const subtitle = out.count === 1 ? t('subtitleSingle') : t('subtitlePlural', { count: out.count });

  return (
    <WidgetShell
      icon={Pill}
      tone="amber"
      title={t('title')}
      subtitle={subtitle}
      sources={out.sources}
      footnote={t('note')}
    >
      {out.count === 0 ? (
        <p className="m-0 px-5 pb-5 text-[15px] leading-snug text-ink-2 sm:px-6">
          {t('notFound')} <b className="font-semibold text-ink">{out.query}</b>. {t('notFoundHint')}
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-0 px-5 pb-1 pt-1 sm:px-6">
          {out.medicines.map((m) => (
            <li key={m.registro} className="border-t border-hair py-3 first:border-t-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
                  {m.produto}
                </p>
                <p className="m-0 font-mono text-[12.5px] tabular-nums text-ink-3">{m.registro}</p>
              </div>
              <p className="m-0 mt-0.5 text-[13px] text-ink-3">
                <Pill className="inline w-3 h-3 mr-1 text-ink-3" aria-hidden />
                {t('activeIngredient')}: <span className="font-medium">{m.principioAtivo}</span>
                {m.classeTerapeutica && <span className="ml-2">· {t('therapeuticClass')}: {m.classeTerapeutica}</span>}
              </p>
              <p className="m-0 mt-1 text-[13px] text-ink-3">
                {t('presentation')}: {m.apresentacao}
              </p>
              <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <Building className="w-3 h-3" aria-hidden />
                {m.empresa} (CNPJ: {m.cnpjEmpresa})
              </p>
              <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px]">
                {m.situacao.toLowerCase().includes('válido') || m.situacao.toLowerCase().includes('valid') ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald" aria-hidden />
                    <span className="text-emerald">{t('statusValid')}</span>
                  </>
                ) : m.situacao.toLowerCase().includes('cancelado') || m.situacao.toLowerCase().includes('cancelled') ? (
                  <>
                    <Warning className="w-3 h-3 text-amber" aria-hidden />
                    <span className="text-amber">{t('statusCancelled')}</span>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 inline-block" aria-hidden />
                    <span>{m.situacao}</span>
                  </>
                )}
                {m.vencimentoRegistro && <span className="ml-2">· {t('expires', { date: m.vencimentoRegistro })}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

export const renderers: Renderers = { anvisaMedicamento: AnvisaWidget };
export default renderers;