'use client';
/**
 * The summary of one recall notice: product, issue, what to do, where it was sold, and the affected sizes with
 * their UPC and lot codes, ending on the official notice. Every value is the publishing agency's own wording,
 * in English or French: each sits in a <bdi> so a right-to-left page keeps product names and codes in order.
 */
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Merged } from './recall-titles';
import { issueLines, sentenceCase, type RecallDetails as Details } from './recalls';
import { useLang, type DayLabel } from './shared';

/** Field names in quiet sans: the values (and the codes, in mono) are what the eye should land on. */
const LABEL = 'text-[13px] font-medium leading-snug text-ink-3';

export function RecallDetails({ item, d, officialTitle, day, className }: { item: Merged; d: Details; officialTitle?: string; day: DayLabel; className?: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  // Transport Canada's system names arrive in Title Case ("Seats And Restraints").
  const issue = issueLines(d.issue, t('common.sep')).map((line) => (item.category === 'vehicles' ? sentenceCase(line, lang) : line));
  const rows: [string, string[]][] = [
    ['notice', officialTitle ? [officialTitle] : []],
    ['product', d.product ? [d.product] : []],
    ['issue', issue],
    ['whatToDo', d.whatToDo ? [d.whatToDo] : []],
    ['distribution', d.distribution ? [d.distribution] : []],
    ['publishedBy', d.publishedBy ? [d.publishedBy] : []],
  ];
  const total = d.affectedTotal ?? d.affected?.length ?? 0;
  return (
    <div className={cn('rounded-tile border border-hair bg-paper-2 px-4 py-3.5', className)}>
      <dl className="m-0 grid gap-x-5 gap-y-1 @xl:grid-cols-[max-content_1fr] @xl:gap-y-2.5 @max-xl:[&>div+div>dt]:mt-2">
        {rows
          .filter(([, v]) => v.length)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className={cn(LABEL, '@xl:pt-px')}>{t(`recalls.d.${k}`)}</dt>
              <dd className={cn('m-0 text-[14.5px] leading-[1.45] text-ink [overflow-wrap:anywhere]', k === 'whatToDo' && 'font-medium')}>
                {v.map((line) => (
                  <bdi key={line} className="block">
                    {line}
                  </bdi>
                ))}
              </dd>
            </div>
          ))}
      </dl>
      {d.affected?.length ? (
        <div className="mt-3.5 border-t border-hair pt-3">
          <p className={cn('m-0', LABEL)}>{t('recalls.d.affected', { count: total })}</p>
          <ul className="m-0 mt-2 grid list-none gap-2 p-0 @2xl:grid-cols-2">
            {d.affected.map((p, i) => (
              <li key={i} className="rounded-field bg-card px-3 py-2.5 text-[13.5px] leading-snug shadow-sm">
                <bdi className="font-medium text-ink">{[p.brand, p.product].filter(Boolean).join(t('common.sep'))}</bdi>
                {p.size ? (
                  <span className="text-ink-3">
                    {t('common.sep')}
                    <bdi>{p.size}</bdi>
                  </span>
                ) : null}
                {p.upc || p.codes ? (
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-ink-2">
                    {p.upc ? (
                      <span>
                        {t('recalls.d.upc')}{' '}
                        <bdi dir="ltr" className="font-mono tracking-[.02em] text-ink">
                          {p.upc}
                        </bdi>
                      </span>
                    ) : null}
                    {p.codes ? (
                      <span className="[overflow-wrap:anywhere]">
                        {t('recalls.d.codes')} <bdi>{p.codes}</bdi>
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {total > d.affected.length ? <p className="m-0 mt-2 text-[12.5px] text-ink-3">{t('recalls.d.affectedMore', { count: total - d.affected.length })}</p> : null}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {/* The label is one element: as two flex items, a standalone link drops the space before its last word. */}
        <ExternalLink href={item.url} standalone className="text-[14px]">
          <span>{t('recalls.d.read')}</span>
        </ExternalLink>
        {item.earlier?.map((e) => (
          <ExternalLink key={e.url} href={e.url} standalone className="text-[14px]">
            <span>{t('recalls.earlier', { date: day(e.date) })}</span>
          </ExternalLink>
        ))}
      </div>
    </div>
  );
}
