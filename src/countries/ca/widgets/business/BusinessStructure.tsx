'use client';
/**
 * businessStructure: sole proprietorship vs partnership vs corporation. The person says who owns the
 * business and what matters; a transparent rule of thumb (calc.recommendStructure) picks the best fit,
 * a fit meter shows the other two, and a side-by-side table (tabs on phones) explains the differences.
 */
import { useState, type CSSProperties } from 'react';
import { Scale } from 'lucide-react';
import { Button, Segmented, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import type { WidgetProps } from '@/lib/widgets/types';
import type { StructureInput, StructureOutput } from './build';
import { PRIORITIES, recommendStructure, STRUCTURES, type Owners, type Priority, type StructureKey } from './calc';
import { pickSources, type UrlKey } from './data';
import { BizError, HandoffNote, Hero, TogglePill, useBiz } from './shared';
import { BizSkeleton } from './skeletons';
import { StructureTabs } from './StructureTabs';

const ROWS = ['owners', 'legal', 'liability', 'tax', 'setup', 'life', 'money'] as const;

/** The page that backs each verdict leads the sources (the shell footer cites the first one). */
const LEAD: Record<StructureKey, UrlKey[]> = {
  sole: ['soleProp', 'registerSoleProp'],
  partnership: ['partnership', 'structures'],
  corporation: ['corporation', 'ccBenefits'],
};

/**
 * The fit bar's fill: always full width, slid in from the start edge by a transform (`--fit` = 0 to 1), so the
 * score animates on the compositor and the rounded end keeps its shape. Mirrored in RTL; instant when the
 * person prefers reduced motion.
 */
const FIT_FILL =
  'block h-full rounded-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [transform:translateX(calc((var(--fit)_-_1)_*_100%))] rtl:[transform:translateX(calc((1_-_var(--fit))_*_100%))]';

export function BusinessStructure({ part }: WidgetProps<StructureInput, StructureOutput>) {
  const { t, href } = useBiz();
  if (part.state === 'output-error') return <BizError href={href('structures')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <BizSkeleton kind="structure" title={t('structure.title')} subtitle={t('structure.subtitle')} icon={Scale} tone="glacier" />;
  }
  return <Structure data={part.output} />;
}

function Structure({ data }: { data: StructureOutput }) {
  const { t, fmt, lang, href } = useBiz();
  const { send } = useChatActions();
  const [owners, setOwners] = useState<Owners>(data.owners);
  const [priorities, setPriorities] = useState<Priority[]>(data.priorities);
  const fit = recommendStructure({ owners, priorities });
  const fee = fmt.money(data.federalFee);
  const best = fit.best;
  const toggle = (p: Priority) => setPriorities((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const cell = (k: StructureKey, row: (typeof ROWS)[number]) => t(`structure.${k}.${row}`, { fee });
  const why = t(`structure.why.${best}`);

  const handoff =
    best === 'corporation'
      ? { href: href('howIncorporate'), label: t('structure.handoff.corporation'), note: t('structure.handoff.corporationNote') }
      : { href: href('registerSoleProp'), label: t('structure.handoff.register'), note: t('structure.handoff.registerNote') };

  return (
    <WidgetShell
      icon={Scale}
      tone="glacier"
      title={t('structure.title')}
      subtitle={t('structure.subtitle')}
      sources={pickSources(data, lang, LEAD[best])}
      handoff={{ href: handoff.href, label: handoff.label }}
      secondaryAction={
        <>
          {/* A short label; the full question is what gets asked (about a corporation when that is the best fit). */}
          <Button
            size="lg"
            className="max-sm:w-full"
            onClick={() => send(best === 'corporation' ? t('structure.ask.register.corp', { where: data.province ?? 'none' }) : t('structure.ask.register'))}
          >
            {t('structure.ask.register.label')}
          </Button>
          <HandoffNote>{handoff.note}</HandoffNote>
        </>
      }
      footnote={t('structure.footnote')}
      className="@container"
    >
      <Hero tone="ok" kicker={t('structure.best')} title={t(`structure.best.${best}`)} announce={`${t(`structure.best.${best}`)} ${why}`}>
        <p className="m-0">{why}</p>
        {best === 'corporation' ? (
          <p className="m-0 mt-1.5 text-[14px] text-ink-2">{fit.federal ? t('structure.why.federal', { fee }) : t('structure.why.provincial', { fee })}</p>
        ) : null}
      </Hero>

      <div className="grid gap-5 px-5 pt-5 sm:px-6">
        <div className="min-w-0 @xl:max-w-[440px]">
          <p className="m-0 mb-2 text-[14px] font-medium text-ink">
            {t('structure.owners')}
          </p>
          <Segmented
            label={t('structure.owners')}
            value={owners}
            onChange={setOwners}
            options={[
              { value: 'solo', label: t('structure.owners.solo'), sub: t('structure.owners.solo.sub') },
              { value: 'partners', label: t('structure.owners.partners'), sub: t('structure.owners.partners.sub') },
            ]}
          />
        </div>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="m-0 mb-2 p-0 text-[14px] font-medium text-ink">
            {t('structure.priorities')} <span className="font-normal text-ink-3">{t('structure.priorities.hint')}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <TogglePill key={p} on={priorities.includes(p)} onClick={() => toggle(p)}>
                {t(`structure.priority.${p}`)}
              </TogglePill>
            ))}
          </div>
        </fieldset>
      </div>

      <WidgetSection title={t('structure.fit')} className="mt-5 border-t border-hair">
        <ul className="m-0 grid list-none gap-3 p-0">
          {STRUCTURES.map((k) => {
            const off = fit.unavailable.includes(k);
            const score = fit.scores[k];
            return (
              <li key={k} className="grid grid-cols-1 gap-y-1.5 @xl:grid-cols-[200px_minmax(0,1fr)] @xl:items-center @xl:gap-x-4">
                <span className={cn('text-[14.5px] font-medium leading-snug', off ? 'text-ink-3' : 'text-ink')}>
                  {t(`structure.name.${k}`)}
                  {off ? null : <span className="sr-only">{t('structure.fit.sr', { name: t(`structure.name.${k}`), score })}</span>}
                </span>
                {off ? (
                  // Not an option for these owners: say why instead of drawing an empty (0%) bar.
                  <span className="text-start text-[13px] leading-snug text-ink-3">{t(`structure.fit.unavailable.${k}`)}</span>
                ) : (
                  <span className="h-2.5 w-full overflow-hidden rounded-full bg-paper-2" aria-hidden>
                    <span
                      style={{ '--fit': score / 100 } as CSSProperties}
                      className={cn(FIT_FILL, k === fit.best ? 'bg-pine' : 'bg-ink-3/45')}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </WidgetSection>

      <WidgetSection title={t('structure.compare')}>
        {/* Wide: a real table. */}
        <div className="hidden @xl:block">
          <table className="w-full table-fixed border-collapse text-start text-[13.5px] leading-snug">
            <caption className="sr-only">{t('structure.compare')}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[19%] pb-2 text-start font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-3">
                  {t('structure.col.aspect')}
                </th>
                {STRUCTURES.map((k) => (
                  <th key={k} scope="col" className={cn('px-2.5 pb-2 text-start text-[14px] font-semibold', k === best ? 'text-pine' : 'text-ink')}>
                    {t(`structure.name.${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row} className="border-t border-hair align-top">
                  <th scope="row" className="py-2.5 pe-2 text-start text-[13px] font-medium text-ink-2">
                    {t(`structure.row.${row}`)}
                  </th>
                  {STRUCTURES.map((k) => (
                    <td key={k} className={cn('px-2.5 py-2.5 text-ink-2', k === best && 'bg-pine-wash text-ink')}>
                      {cell(k, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Narrow: one structure at a time. */}
        <StructureTabs
          key={best}
          className="@xl:hidden"
          label={t('structure.compare')}
          defaultTab={best}
          tabs={STRUCTURES.map((k) => ({
            id: k,
            label: k === best ? <span className="text-pine">{t(`structure.short.${k}`)}</span> : t(`structure.short.${k}`),
            content: (
              <dl className="m-0 grid gap-0">
                {ROWS.map((row) => (
                  <div key={row} className="grid gap-0.5 border-b border-hair py-2.5 last:border-b-0">
                    <dt className="font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-3">{t(`structure.row.${row}`)}</dt>
                    <dd className="m-0 text-[14.5px] leading-snug text-ink">{cell(k, row)}</dd>
                  </div>
                ))}
              </dl>
            ),
          }))}
        />
      </WidgetSection>
    </WidgetShell>
  );
}
