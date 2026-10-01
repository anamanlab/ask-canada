'use client';
/**
 * "N more options" under a phone line: the self-service route to try first, the other numbers (main line,
 * other language, TTY, the North, outside Canada, EI reporting, the numbers-by-country page for callers abroad) and the official contact page.
 */
import { ArrowUpRight, Globe2, HeartHandshake } from 'lucide-react';
import { Disclosure, ExternalLink } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { useHoursText } from './line-ui';
import messages from './messages';
import { sameHours, type LineView, type Viewer } from './pick';
import { PhoneNumber, telHref } from './primitives';

type AltRow = { key: string; label: string; number: string; note?: string };

export function LineMore({ view: { line, pick, abroadPage }, viewer, defaultOpen }: { view: LineView; viewer: Viewer; defaultOpen: boolean }) {
  const t = useMessages(messages);
  const { lang } = viewer;
  const hours = useHoursText(viewer);

  const voice = lang === 'fr' && line.numberFr ? line.numberFr : line.number;
  const rows: AltRow[] = [];
  if (pick.kind !== 'main' && pick.kind !== 'fr' && voice) rows.push({ key: 'main', label: t('alt.main'), number: voice });
  if (line.numberFr && line.number) {
    rows.push(lang === 'fr' ? { key: 'en', label: t('alt.en'), number: line.number } : { key: 'fr', label: t('alt.fr'), number: line.numberFr });
  }
  for (const a of line.alt ?? []) {
    if (a.kind === pick.kind) continue;
    const notes = [
      a.kind === 'reporting' ? t('alt.reportingNote') : a.hours && !sameHours(a.hours, line.agents) ? hours.line(a.hours) : '',
      a.collect ? t('alt.collect') : '',
    ].filter(Boolean);
    rows.push({ key: a.kind, label: t(a.outside === 'canada' ? 'alt.outsideCanada' : `alt.${a.kind}`), number: lang === 'fr' && a.numberFr ? a.numberFr : a.number, note: notes.join(' · ') || undefined });
  }
  // The CRA's self-service leads the whole card ("Try online first") and the Anti-Fraud Centre's sits beside Call.
  const selfServe = line.org !== 'cra' && line.org !== 'cafc' ? line.selfServe : undefined;
  const count = rows.length + (selfServe ? 1 : 0) + (abroadPage ? 1 : 0);
  if (!count) return null;

  return (
    <Disclosure title={<bdi>{t('more.show', { count })}</bdi>} defaultOpen={defaultOpen} headingLevel={5} className="mt-3">
      {selfServe ? (
        <ExternalLink
          href={selfServe.href[lang]}
          icon={false}
          className="mt-1 flex min-h-11 items-center gap-3 rounded-field bg-pine-wash px-3.5 py-2.5 text-[14px] leading-snug no-underline"
        >
          <HeartHandshake className="size-[18px] shrink-0 text-pine" strokeWidth={1.8} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11.5px] font-semibold uppercase tracking-[.08em] text-pine">{t('selfServe.eyebrow')}</span>
            {selfServe.label[lang]}
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-ink-3 flip-rtl" strokeWidth={2} aria-hidden />
        </ExternalLink>
      ) : null}
      {abroadPage ? (
        // The toll-free number differs in every country, so this row is the official list, never a number.
        <ExternalLink
          href={abroadPage.href[lang]}
          icon={false}
          className="mt-1 flex min-h-11 items-center gap-3 border-b border-hair py-1.5 text-[13.5px] leading-snug text-ink no-underline"
        >
          <Globe2 className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
          <bdi className="min-w-0 flex-1 font-medium underline decoration-hair-2 underline-offset-[3px]">{t('abroad.byCountry')}</bdi>
          <ArrowUpRight className="size-4 shrink-0 text-ink-3 flip-rtl" strokeWidth={2} aria-hidden />
        </ExternalLink>
      ) : null}
      {rows.length ? (
        <dl className="m-0 mt-2 grid">
          {rows.map((a) => (
            <div key={a.key} className="flex min-h-11 items-center justify-between gap-3 border-b border-hair py-1.5 last:border-b-0">
              <dt className="min-w-0 text-[13.5px] leading-snug text-ink-2">
                {a.label}
                {a.note ? <span className="block text-[12.5px] text-ink-3">{a.note}</span> : null}
              </dt>
              <dd className="m-0 shrink-0">
                <a href={telHref(a.number)} className="inline-flex min-h-11 items-center text-[15px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px]">
                  <PhoneNumber number={a.number} />
                </a>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <ExternalLink href={line.page[lang]} standalone className="mt-1 text-[13.5px] text-ink-2">
        <span>{t('web.officialPage')}</span>
      </ExternalLink>
    </Disclosure>
  );
}
