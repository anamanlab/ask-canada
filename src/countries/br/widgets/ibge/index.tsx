'use client';
/**
 * Widget `ibge`: a place name resolved to the code Brazil's public sector actually uses.
 *
 * There is no English here to invent. IBGE publishes Portuguese place names only, so in the English
 * interface these rows read the same as in Portuguese — deliberately, rather than guessing at "Sao
 * Paulo" versus "São Paulo" and getting a real name wrong. What the widget does add in either language is
 * the thing a bare place name lacks: the 7-digit municipality code, the state, and the region.
 *
 * When several cities share a name — and plenty do, "Santa Rita" is in four states — all of them are
 * listed rather than the first one winning, because silently resolving "Santa Rita" to the wrong
 * municipality is the kind of error that has consequences.
 *
 * Built only from core primitives (`@/components/ui`) and design tokens; no user-visible string in TSX.
 */
import { MapPin } from 'lucide-react';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Localized = { pt: string; en: string };
type Match = {
  name: Localized;
  code: string;
  uf?: { code: string; sigla: string; name: Localized };
  region?: { sigla: string; name: Localized };
  immediateRegion?: Localized;
};
type StateAnswer = {
  sigla: string;
  name: Localized;
  region: { sigla: string; name: Localized };
  count: number;
  sample: { name: Localized; code: string }[];
};
type Output = {
  query: string;
  matches: Match[];
  ambiguous?: boolean;
  exact?: boolean;
  /** Present when the question was about a state, not a city. */
  state?: StateAnswer;
  sources?: ToolSource[];
};

function IbgePlace({ part }: WidgetProps<{ place: string; limit?: number }, Output>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const en = locale === 'en';
  // IBGE has no English place names, so the Portuguese name is shown in both locales rather than transliterated.
  const pick = (s: Localized) => s[en ? 'en' : 'pt'] ?? s.pt;

  const out = part.state === 'output-available' ? part.output : undefined;
  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('title')} icon={MapPin} tone="glacier" rows={2} />;
  }

  // A question about a state is not a lookup, so it is not drawn as one.
  // What a state has is a count and a full list on IBGE's own page; what this
  // card shows is the count, a sample that says it is alphabetical, and that page.
  if (out.state) {
    const st = out.state;
    return (
      <WidgetShell
        icon={MapPin}
        tone="glacier"
        title={t('title')}
        subtitle={t('stateSubtitle')}
        sources={out.sources}
        footnote={t('note')}
      >
        <div className="px-5 pb-5 pt-1 sm:px-6">
          <p className="m-0 flex flex-wrap items-baseline gap-x-2">
            <span className="text-[17px] font-semibold text-ink">{pick(st.name)}</span>
            <span className="font-normal text-ink-3">{st.sigla}</span>
            <span className="text-[13px] text-ink-3">· {t('region')} {pick(st.region.name)}</span>
          </p>
          <p className="m-0 mt-2 text-[15px] text-ink-2">
            <span className="font-display text-[26px] font-semibold tabular-nums text-ink">{st.count}</span>{' '}
            {st.count === 1 ? t('municipality') : t('municipalities')}
          </p>
          <ul className="m-0 mt-4 grid list-none gap-0 p-0">
            {st.sample.map((m) => (
              <li key={m.code} className="flex items-baseline justify-between gap-3 border-t border-hair py-2.5 first:border-t-0">
                <span className="text-[14px] text-ink-2">{pick(m.name)}</span>
                <span className="font-mono text-[12.5px] tabular-nums text-ink-3">{m.code}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-[12.5px] leading-snug text-ink-3">{t('sampleNote')}</p>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      icon={MapPin}
      tone="glacier"
      title={t('title')}
      subtitle={out.exact ? t('subtitleCode') : t('subtitle')}
      sources={out.sources}
      footnote={t('note')}
    >
      {out.matches.length === 0 ? (
        <p className="m-0 px-5 pb-5 text-[15px] leading-snug text-ink-2 sm:px-6">
          {t('notFound')} <b className="font-semibold text-ink">{out.query}</b>. {t('notFoundHint')}
        </p>
      ) : (
        <>
          <ul className="m-0 grid list-none gap-0 px-5 pb-1 pt-1 sm:px-6">
            {out.matches.map((m) => (
              <li key={m.code} className="border-t border-hair py-3 first:border-t-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
                    {pick(m.name)}
                    {m.uf ? <span className="ml-1.5 font-normal text-ink-3">{m.uf.sigla}</span> : null}
                  </p>
                  {/* The number the rest of the state keys on, given equal weight to the name. */}
                  <p className="m-0 font-mono text-[13px] tabular-nums text-ink-2">{m.code}</p>
                </div>
                <p className="m-0 mt-0.5 text-[13px] text-ink-3">
                  {[m.uf ? pick(m.uf.name) : null, m.region ? `${t('region')} ${pick(m.region.name)}` : null, m.immediateRegion ? `${t('immediate')} ${pick(m.immediateRegion)}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
          {out.ambiguous ? (
            <p className="m-0 border-t border-hair px-5 py-3 text-[12.5px] leading-snug text-ink-3 sm:px-6">{t('ambiguous')}</p>
          ) : null}
        </>
      )}
    </WidgetShell>
  );
}

export const renderers: Renderers = { ibgePlace: IbgePlace };
export default renderers;