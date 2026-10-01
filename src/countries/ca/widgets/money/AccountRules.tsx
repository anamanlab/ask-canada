'use client';
/**
 * "The rules" of the three accounts, side by side: a real table on wide containers; on phones one block per
 * rule with the three accounts as label / answer lines (the same pattern for every rule), then the Home Buyers' Plan notice (first-home goal) and the notes on room and over-contributions.
 */
import type { ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, Minus } from 'lucide-react';
import { ExternalLink, Notice, WidgetSection } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { AccountId, Goal } from './calc/accounts';
import type { ACCOUNTS } from './data';
import { useMoneyFormat } from './format';
import messages from './messages';
import { Bullet } from './shared';

/** Column order everywhere the three accounts are listed. */
export const ORDER: readonly AccountId[] = ['tfsa', 'rrsp', 'fhsa'];

type RowData = { label: string; cells: string[]; good?: boolean[]; icon?: ReactNode };

export function AccountRules({ facts: f, goal, fhsaCloseHref }: { facts: typeof ACCOUNTS; goal: Goal; fhsaCloseHref: string }) {
  const t = useMessages(messages);
  const { money, pct } = useMoneyFormat();
  const rows: RowData[] = [
    { label: t('cmp.row.in'), icon: <ArrowDownToLine className="size-3.5" aria-hidden />, cells: [t('cmp.no'), t('cmp.yes'), t('cmp.yes')], good: [false, true, true] },
    { label: t('cmp.row.out'), icon: <ArrowUpFromLine className="size-3.5" aria-hidden />, cells: [t('cmp.taxFree'), t('cmp.taxed'), t('cmp.taxFreeHome')], good: [true, false, true] },
    {
      label: t('cmp.row.room', { year: String(f.year) }),
      cells: [money(f.tfsa.annual), t('cmp.rrspRoom', { pct: pct(f.rrsp.rate * 100), max: money(f.rrsp.max) }), t('cmp.fhsaRoom', { annual: money(f.fhsa.annual), life: money(f.fhsa.lifetime) })],
    },
    { label: t('cmp.row.back'), cells: [t('cmp.backTfsa'), t('cmp.backNo'), t('cmp.backNo')] },
    {
      label: t('cmp.row.who'),
      cells: [
        t('cmp.whoTfsa', { age: f.tfsa.minAge, older: f.tfsa.contractAge }),
        t('cmp.whoRrsp', { age: f.rrsp.closeAge }),
        t('cmp.whoFhsa', { age: f.fhsa.minAge, older: f.fhsa.contractAge, years: f.fhsa.notOwnedYears }),
      ],
    },
  ];

  return (
    <WidgetSection title={t('cmp.table.title', { year: String(f.year) })}>
      {/* Wide containers: a real table, fixed layout: the three accounts get the same measure, whatever they say.
          Narrow (phones): one block per rule, one line per account. */}
      <table className="hidden w-full table-fixed border-collapse text-start text-[13.5px] leading-snug @xl:table">
        <thead>
          <tr>
            <th scope="col" className="w-[25%] pb-2 text-start font-normal">
              <span className="sr-only">{t('cmp.table.rule')}</span>
            </th>
            {ORDER.map((a) => (
              <th key={a} scope="col" className="pb-2 text-start font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">
                {t(`acct.${a}.short`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="align-top">
          {rows.map((row) => (
            <Row key={row.label} label={row.label} cells={row.cells} good={row.good} icon={row.icon} />
          ))}
        </tbody>
      </table>
      <dl className="m-0 grid gap-0 @xl:hidden">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-hair py-3 first:border-t-0 first:pt-0">
            <dt className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
              {row.icon}
              {row.label}
            </dt>
            <dd className="m-0 mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5">
              {row.cells.map((c, i) => (
                <div key={ORDER[i]} className="contents">
                  <span className="font-mono text-[10.5px] font-medium uppercase tracking-[.08em] text-ink-3">{t(`acct.${ORDER[i]}.short`)}</span>
                  <span className="flex min-w-0 items-start gap-1 text-[13px] leading-snug text-ink">
                    {row.good ? <Mark good={row.good[i]} /> : null}
                    <span className="min-w-0">
                      <NoBreakHyphens text={c} />
                    </span>
                  </span>
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {goal === 'home' ? (
        <Notice tone="info" className="mt-4" title={t('cmp.hbp.title', { max: money(f.hbp.max) })}>
          {t('cmp.hbp.body', { years: f.hbp.repayYears })}
        </Notice>
      ) : null}
      <ul className="m-0 mt-4 grid list-none gap-2 p-0">
        {goal === 'home' ? (
          <Bullet>
            {t('cmp.note.fhsaYears', { years: f.fhsa.years, close: f.fhsa.closeAge })}{' '}
            <ExternalLink href={fhsaCloseHref}>{t('cmp.note.fhsaYearsLink')}</ExternalLink>
          </Bullet>
        ) : null}
        <Bullet>{t('cmp.note.room')}</Bullet>
        <Bullet>{t('cmp.note.over', { buffer: money(f.rrsp.excessBuffer), rate: pct(f.rrsp.excessTaxMonthly * 100) })}</Bullet>
      </ul>
    </WidgetSection>
  );
}

/** Phone layout: the small check (a plus for the saver) or dash before a cell. */
function Mark({ good }: { good: boolean }) {
  return good ? <Check className="mt-[3px] size-3 shrink-0 text-pine" strokeWidth={2.6} aria-hidden /> : <Minus className="mt-[3px] size-3 shrink-0 text-ink-3" aria-hidden />;
}

function Row({ label, cells, good, icon }: RowData) {
  return (
    <tr className="border-t border-hair">
      <th scope="row" className="py-2.5 pe-3 text-start text-[13px] font-medium text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </th>
      {cells.map((c, i) => (
        <td key={ORDER[i]} className="py-2.5 pe-4 text-ink last:pe-0">
          {good ? (
            <span className="inline-flex items-start gap-1.5">
              {good[i] ? <Check className="mt-[3px] size-3.5 shrink-0 text-pine" strokeWidth={2.6} aria-hidden /> : <Minus className="mt-[3px] size-3.5 shrink-0 text-ink-3" aria-hidden />}
              <span>
                <NoBreakHyphens text={c} />
              </span>
            </span>
          ) : (
            <NoBreakHyphens text={c} />
          )}
        </td>
      ))}
    </tr>
  );
}

/**
 * Keeps hyphenated words ("Tax-free", "libre-service") on one line so short cells never break as "Tax- / free".
 * Wrapped in <bdi> so mixed text ("$8,000 a year", "18% of…") keeps its own order in right-to-left locales.
 */
function NoBreakHyphens({ text }: { text: string }) {
  const parts = text.split(/(\S*[-‑]\S*)/);
  return (
    <bdi>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </bdi>
  );
}
