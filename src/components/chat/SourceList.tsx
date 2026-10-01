'use client';
/**
 * Source cards: domain / title (two lines at most) / checked date, on a fixed three-row grid so every card in
 * a row lines up. Every card carries the third row: the page's own checked date, else the date the answer's
 * facts were verified, else "Official page" (never a blank slot, never an invented date).
 */
import { useState } from 'react';
import { Check, ChevronDown, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import type { CitedSource } from './sources';

const FOLD = 3;

export function SourceList({ sources, official, checked }: { sources: CitedSource[]; official: number; checked?: string }) {
  const { t, fmt } = useLocale();
  const [all, setAll] = useState(false);
  const shown = all ? sources : sources.slice(0, FOLD);
  return (
    <section className="ac-sources" aria-label={t('chat.sources')}>
      <div className="ac-sources__head">
        <h3>{t('chat.sources')}</h3>
        <span className="ac-sources__q">{t('chat.sourcesCount', { count: official })}</span>
      </div>
      <ol className="ac-sources__list">
        {shown.map((s) => {
          const date = s.checked || (s.official && !s.live ? checked : undefined);
          return (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="ac-src">
                <span className="ac-src__num">{s.n}</span>
                <span className="ac-src__body">
                  <span className="ac-src__dom">
                    {s.host}
                    {!s.official ? (
                      <span className="ac-src__warn">
                        <TriangleAlert className="size-3" aria-hidden /> {t('chat.unofficial')}
                      </span>
                    ) : null}
                  </span>
                  <span className="ac-src__title">{s.title}</span>
                  {date ? (
                    <span className="ac-src__checked">
                      <Check className="size-3" strokeWidth={2.4} aria-hidden />
                      {t('source.checked', { date: fmt.date(date, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                    </span>
                  ) : s.live ? (
                    <span className="ac-src__checked">{t('source.live')}</span>
                  ) : s.official ? (
                    <span className="ac-src__checked is-plain">{t('source.officialPage')}</span>
                  ) : (
                    <span className="ac-src__checked is-plain" aria-hidden />
                  )}
                </span>
                <span className="sr-only"> {t('a11y.newTab')}</span>
              </a>
            </li>
          );
        })}
      </ol>
      {sources.length > FOLD ? (
        <button type="button" className="ac-sources__more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          <ChevronDown className={cn('size-4 transition-transform', all && 'rotate-180')} aria-hidden />
          {all ? t('chat.fewerSources') : t('chat.moreSources', { count: sources.length - FOLD })}
        </button>
      ) : null}
    </section>
  );
}
