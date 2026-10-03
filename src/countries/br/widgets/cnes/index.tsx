'use client';
/**
 * Widget `cnes`: health establishments from CNES (Cadastro Nacional de Estabelecimentos de Saúde).
 *
 * Source: Ministério da Saúde OpenDataSUS — public API, no authentication.
 * Returns facility details: name, type, address, phone, hours, bed count.
 *
 * When several facilities match, all are listed. The widget never invents a facility.
 */
import { Building, MapPin, Phone, Clock, Bed } from '@phosphor-icons/react';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import * as messages from './messages';

type Localized = { pt: string; en: string };
type Establishment = {
  codigo: string;
  nome: string;
  tipo: string;
  municipio: string;
  uf: string;
  endereco: string;
  telefone?: string;
  horarioFuncionamento?: string;
  leitos?: number;
};
type Output = {
  query: string;
  count: number;
  establishments: Establishment[];
  sources?: ToolSource[];
};

function CnesWidget({ part }: WidgetProps<{ query: string; uf?: string; municipio?: string; tipo?: string; limit?: number }, Output>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const en = locale === 'en';

  const out = part.state === 'output-available' ? part.output : undefined;
  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('title')} icon={Building} tone="amber" rows={3} />;
  }

  const subtitle = out.count === 1 ? t('subtitleSingle') : t('subtitlePlural', { count: out.count });

  return (
    <WidgetShell
      icon={Building}
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
          {out.establishments.map((e) => (
            <li key={e.codigo} className="border-t border-hair py-3 first:border-t-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
                  {e.nome}
                  <span className="ml-1.5 font-normal text-ink-3 text-[13px]">({e.tipo})</span>
                </p>
                <p className="m-0 font-mono text-[12.5px] tabular-nums text-ink-3">{e.codigo}</p>
              </div>
              <p className="m-0 mt-0.5 text-[13px] text-ink-3">
                <MapPin className="inline w-3 h-3 mr-1 text-ink-3" aria-hidden />
                {e.municipio} ({e.uf})
                {e.endereco && <span className="ml-2">· {e.endereco}</span>}
              </p>
              {e.telefone && (
                <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                  <Phone className="w-3 h-3" aria-hidden />
                  {e.telefone}
                </p>
              )}
              {e.horarioFuncionamento && (
                <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                  <Clock className="w-3 h-3" aria-hidden />
                  {e.horarioFuncionamento}
                </p>
              )}
              {e.leitos && e.leitos > 0 && (
                <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                  <Bed className="w-3 h-3" aria-hidden />
                  {t('beds', { count: e.leitos })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

export const renderers: Renderers = { cnesEstabelecimentos: CnesWidget };
export default renderers;