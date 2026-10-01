'use client';
/**
 * The export side of businessTrade: destination, value and controlled goods decide whether an export
 * declaration and a permit are needed; then the reporting deadline by transport mode and the next steps.
 */
import { Badge, MoneyInput, Segmented, Stepper, Toggle, WidgetSection } from '@/components/ui';
import { exportCheck, type Destination } from './calc';
import { EXPORT } from './data';
import { Hero, LinkRow, useBiz, useSelectOnTab } from './shared';

/** What the person entered (kept by BusinessTrade, so it survives a switch to Import and back). */
export type ExportDraft = { destination: Destination; restricted: boolean; value: number };

const MODES = ['air', 'marine', 'rail', 'mail', 'highway'] as const;

export function TradeExport({ draft, onChange }: { draft: ExportDraft; onChange: (next: ExportDraft) => void }) {
  const { t, fmt, href } = useBiz();
  const selectOnTab = useSelectOnTab();
  const { destination: dest, restricted, value } = draft;
  const res = exportCheck(draft);
  const threshold = fmt.money(EXPORT.declarationValue);
  const unknown = res.reason === 'unknown';
  // The permit badge only where the heading doesn't already say it: a declaration is required and a permit too.
  const alsoPermit = res.permit && res.declaration;
  const verdict = t(unknown ? 'trade.exp.enter' : res.declaration ? 'trade.exp.yes' : res.permit ? 'trade.exp.permitOnly' : 'trade.exp.no');
  const reason =
    res.reason === 'restricted'
      ? t(dest === 'us' ? 'trade.exp.reason.restrictedUs' : 'trade.exp.reason.restricted')
      : unknown
        ? t('trade.exp.enter.sub', { amount: threshold })
        : t(`trade.exp.reason.${res.reason}`, { amount: threshold });

  return (
    <>
      <WidgetSection title={t('trade.export.check')} className="mt-5 border-t border-hair">
        <div className="grid gap-4">
          <div>
            <p className="m-0 mb-2 text-[14px] font-medium text-ink">{t('trade.dest')}</p>
            <Segmented
              label={t('trade.dest')}
              value={dest}
              onChange={(destination) => onChange({ ...draft, destination })}
              options={[
                { value: 'us', label: t('trade.dest.us'), sub: t('trade.dest.us.sub') },
                { value: 'other', label: t('trade.dest.other'), sub: t('trade.dest.other.sub') },
              ]}
            />
          </div>
          <div className="grid gap-3 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] @xl:items-end" {...selectOnTab}>
            <MoneyInput label={t('trade.value')} value={value || undefined} onChange={(n) => onChange({ ...draft, value: n ?? 0 })} max={1e10} placeholder="0" />
            <Toggle label={t('trade.restricted')} description={t('trade.restricted.desc')} checked={restricted} onChange={(on) => onChange({ ...draft, restricted: on })} />
          </div>
        </div>
      </WidgetSection>

      <div className="pt-4">
        <Hero
          tone={unknown ? 'info' : res.declaration || res.permit ? 'warn' : 'ok'}
          title={verdict}
          announce={`${verdict} ${reason}${alsoPermit ? ` ${t('trade.exp.permit')}` : ''}`}
        >
          <p className="m-0">{reason}</p>
          {alsoPermit ? (
            <p className="m-0 mt-2">
              <Badge tone="danger">{t('trade.exp.permit')}</Badge>
            </p>
          ) : null}
        </Hero>
      </div>

      {res.declaration ? (
        <WidgetSection title={t('trade.deadlines')}>
          <table className="w-full border-collapse text-start text-[14px]">
            <caption className="sr-only">{t('trade.deadlines')}</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">{t('trade.deadline.mode')}</th>
                <th scope="col">{t('trade.deadline.when')}</th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((m) => (
                <tr key={m} className="border-t border-hair first:border-t-0">
                  <th scope="row" className="w-[34%] py-2.5 pe-3 text-start font-medium text-ink">
                    {t(`trade.mode.${m}`)}
                  </th>
                  <td className="py-2.5 text-ink-2">
                    {m === 'highway' ? t('trade.deadline.highway') : t(m === 'mail' ? 'trade.deadline.mail' : 'trade.deadline.before', { count: EXPORT.deadlines[m] })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetSection>
      ) : null}

      {res.declaration ? (
        <WidgetSection title={t('trade.export.steps')}>
          <Stepper
            steps={(['s1', 's2', 's3'] as const).map((s) => ({
              title: t(`trade.export.${s}`, { years: EXPORT.recordsYears }),
              detail: t(`trade.export.${s}.d`),
              state: 'upcoming',
            }))}
          />
        </WidgetSection>
      ) : null}
      <WidgetSection title={t('trade.sell')}>
        <LinkRow href={href('tcs')} title={t('trade.tcs.link')} detail={t('trade.tcs')} />
      </WidgetSection>
    </>
  );
}
