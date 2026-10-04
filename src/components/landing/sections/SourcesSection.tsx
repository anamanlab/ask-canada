/**
 * Every answer shows its work: a verbatim quote from an official page with its checks, the answer's source
 * list, and the official domains answers come from.
 */
import { Check } from 'lucide-react';
import { packServer as pack } from '@/countries/active.server';
import { getLandingCopy } from '../copy';

const SOURCES = [
  // The three domains the pack's marquee cites, in the order they appear in `pack.sources.showcase`.
  ['1', pack.sources.showcase[0] ?? pack.officialHomeLabel, 'sources.list.1'],
  ['2', pack.sources.showcase[1] ?? pack.officialHomeLabel, 'sources.list.2'],
  ['3', pack.sources.showcase[2] ?? pack.officialHomeLabel, 'sources.list.3'],
] as const;

export async function SourcesSection() {
  const { t, sp, d, official, checked } = await getLandingCopy();
  const Mark = pack.brand.Mark;
  return (
    <>
      <section className="l-section" aria-labelledby="t-sources">
        <div className="l-split">
          <div>
            <p className="eyebrow">{t('sources.eyebrow')}</p>
            <h2 className="l-h2" id="t-sources">
              {t('sources.title')}
              {sp}
              <em>{t('sources.titleEm')}</em>
            </h2>
            <p className="l-sub">{t('sources.sub')}</p>
            <ul className="l-claims">
              {[1, 2, 3].map((n) => (
                <li key={n}>
                  <Check className="size-[18px]" strokeWidth={2.2} aria-hidden />
                  {t(`sources.claim.${n}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="l-proof">
            {/* A verbatim quote from the official page: it stays in the page's own language. */}
            <figure className="l-quote m-0">
              <div className="l-quote__head" lang={official ? undefined : pack.locales.default}>
                <span className="l-leafbadge">
                  <Mark className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="l-quote__t">{t('sources.quote.title')}</div>
                  <div className="l-crumbs">
                    {new URL(pack.officialHome.pt ? pack.officialHome.pt : pack.officialHome.en).hostname} › {t('sources.quote.crumbs')}
                  </div>
                </div>
              </div>
              <blockquote cite={t('sources.quote.url')} lang={official ? undefined : pack.locales.default}>
                {t('sources.quote.text')}
              </blockquote>
              <figcaption className="l-stamps">
                <span className="l-stamp l-stamp--ok">
                  <Check className="size-3" strokeWidth={2.4} aria-hidden />
                  {t('source.checked', { date: checked })}
                </span>
                <span className="l-stamp">{t('sources.updated', { date: d('2026-07-28', { month: 'short', day: 'numeric', year: 'numeric' }) })}</span>
              </figcaption>
            </figure>
            <div className="l-srclist">
              <div className="l-srclist__head">
                <b>{t('sources.list.title')}</b>
                <span>{t('chat.sourcesCount', { count: 3 })}</span>
              </div>
              <ol>
                {SOURCES.map(([n, dom, k]) => (
                  <li key={n}>
                    <span className="n">{n}</span>
                    <span className="t">
                      {t(k)}
                      <span className="dom">{dom}</span>
                    </span>
                    <span className="v">
                      <Check className="size-3" strokeWidth={2.4} aria-hidden />
                      {d(pack.showcase.factsChecked, { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
      {/* The official domains answers come from: a static, wrapped list (no motion to pause). */}
      <ul className="l-domains" aria-label={t('sources.domains')}>
        {pack.sources.showcase.map((dom) => (
          <li key={dom} translate="no">
            {dom}
          </li>
        ))}
      </ul>
    </>
  );
}
