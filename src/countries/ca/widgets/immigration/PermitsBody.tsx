'use client';
/**
 * The body of the permits overview: switch, the three numbers, the country picker, then the study or work part.
 * With `ghost` it is the loading state: the same layout as placeholders over the real copy and controls (see
 * Skeletons.tsx), using the published fees and amounts until the live ones arrive.
 */
import type { ReactNode } from 'react';
import { Badge, Segmented, Stat, Stepper } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { PermitFocus, PermitsOutput } from './build';
import { countryName } from './country-name';
import { FEES, fundsFor, STUDY, STUDY_FUNDS } from './data';
import messages from './messages';
import { Counter, CountryChoice, Section, StatValue, useDate, useDurationParts } from './Shared';
import { Ghost, SkText } from './Skeletons';
import { decodeDuration, type Duration } from './times';

const noop = () => {};

type Props = {
  focus: PermitFocus;
  country: string;
  family: number;
  onFocus?: (focus: PermitFocus) => void;
  onCountry?: (code: string) => void;
  onFamily?: (n: number) => void;
  fees?: PermitsOutput['fees'];
  studyFunds?: PermitsOutput['studyFunds'];
  study?: PermitsOutput['study'];
  /** Processing times by country for the permit in focus. */
  times?: Record<string, string>;
  /** Extending this permit inside Canada. */
  extension?: Duration | null;
  /** Shown under the numbers (the "last known" line when IRCC's feed is down). */
  notice?: ReactNode;
  ghost?: boolean;
};

export function PermitsBody({ focus, country, family, onFocus = noop, onCountry = noop, onFamily = noop, fees = FEES, studyFunds = STUDY_FUNDS, study = STUDY, times = {}, extension, notice, ghost }: Props) {
  const t = useMessages(messages);
  const { fmt, intl } = useLocale();
  const parts = useDurationParts();
  const date = useDate();
  const codes = Object.keys(times);
  const time = country ? decodeDuration(times[country]) : null;
  const name = country ? countryName(country, intl) : '';
  const isStudy = focus === 'study';
  const tx = (node: ReactNode) => (ghost ? <SkText>{node}</SkText> : node);
  const block = (node: ReactNode, className?: string, shape?: string) => (ghost ? <Ghost className={className} shape={shape}>{node}</Ghost> : className ? <div className={className}>{node}</div> : node);
  const duration = (d: Duration | null | undefined) => (d ? <StatValue value={parts(d).n} unit={parts(d).unit} /> : '—');
  // While loading, a country's time is still to come: keep the line the result will show for it.
  const timeNote = country ? (time || ghost ? t('permits.stat.timeFrom', { country: name }) : t('permits.stat.timeNone', { country: name })) : t('permits.stat.timePick');
  const tile = ghost ? 'bg-transparent' : undefined;

  return (
    <>
      <div className="px-5 sm:px-6">
        {block(
          <Segmented
            label={t('permits.switch')}
            value={focus}
            onChange={onFocus}
            options={[
              { value: 'study', label: t('permits.tab.study') },
              { value: 'work', label: t('permits.tab.work') },
            ]}
          />,
          undefined,
          'rounded-field',
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 sm:px-6 @xl:grid-cols-3">
        <Stat
          className={tile}
          label={tx(t('permits.stat.fee'))}
          value={tx(fmt.money(isStudy ? fees.studyPermit : fees.workPermit))}
          note={tx(t(isStudy ? 'permits.stat.feeNoteStudy' : 'permits.stat.feeNoteWork', { bio: fmt.money(fees.biometrics), open: fmt.money(fees.openWorkPermitHolder) }))}
        />
        <Stat className={tile} label={tx(t('permits.stat.time'))} value={tx(duration(time))} note={tx(timeNote)} />
        {isStudy ? (
          <Stat
            className={cn('col-span-2 @xl:col-span-1', tile)}
            label={tx(t('permits.stat.work'))}
            value={tx(<StatValue value={t('permits.stat.hoursValue', { count: study.offCampusHoursPerWeek })} unit={t('permits.stat.hoursUnit')} />)}
            note={tx(t('permits.stat.workNote'))}
          />
        ) : (
          <Stat className={cn('col-span-2 @xl:col-span-1', tile)} label={tx(t('permits.stat.extension'))} value={tx(duration(extension))} note={tx(t('permits.stat.extensionNote'))} />
        )}
      </div>
      {notice}
      {/* Only a full country table can be switched on this device (a short one is the single country asked about). */}
      {ghost || codes.length > 20 ? (
        <div className="px-5 pt-3 sm:px-6">
          {block(<CountryChoice label={t('pt.applyingFrom')} value={country} onChange={onCountry} codes={ghost ? [] : codes} placeholder={t('pt.choose')} />, 'max-w-[360px]')}
        </div>
      ) : null}

      {isStudy ? (
        <>
          <Section title={tx(t('permits.money.title'))}>
            {block(
              <div className="flex flex-wrap items-end justify-between gap-3 rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
                <div>
                  <p className="m-0 font-serif text-[34px] leading-none tracking-[-.03em] text-ink" aria-live="polite">
                    {fmt.money(fundsFor(studyFunds, family))}
                  </p>
                  <p className="m-0 mt-1.5 text-[13px] text-ink-2">{t('permits.money.perYear', { count: family })}</p>
                </div>
                <Counter label={t('permits.money.family')} value={family} onChange={onFamily} min={1} max={10} format={(n) => t('family.count', { count: n })} />
              </div>,
            )}
            <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3">{tx(t('permits.money.note', { date: date(studyFunds.from, { month: 'long', day: 'numeric', year: 'numeric' }) }))}</p>
          </Section>
          <Section title={tx(t('permits.steps.title'))}>
            <Stepper
              steps={[
                { title: tx(t('permits.step.loa')), detail: tx(t('permits.step.loaDetail')), state: ghost ? 'upcoming' : 'current' },
                { title: tx(t('permits.step.pal')), detail: tx(t('permits.step.palDetail')), state: 'upcoming' },
                { title: tx(t('permits.step.funds')), detail: tx(t('permits.step.fundsDetail')), state: 'upcoming' },
                { title: tx(t('permits.step.apply')), detail: tx(t('permits.step.applyDetail')), state: 'upcoming' },
                // The destination, not a warning: neutral dot plus a calm "Goal" tag (maple is kept for alerts).
                {
                  title: tx(t('permits.step.pgwp')),
                  detail: tx(t('permits.step.pgwpDetail', { years: study.pgwpMaxYears })),
                  state: 'upcoming',
                  aside: block(<Badge tone="ok">{t('permits.step.goal')}</Badge>, undefined, 'rounded-chip'),
                },
              ]}
            />
          </Section>
        </>
      ) : (
        <>
          <Section title={tx(t('permits.types.title'))}>
            <ul className="m-0 grid list-none gap-2.5 p-0 @xl:grid-cols-2">
              {(['employer', 'open'] as const).map((k) => (
                // Two equal options, same card: amber is kept for warnings and assumed answers. What sets them apart is a tag.
                <li key={k} className={cn('rounded-tile border border-hair px-4 py-3.5', !ghost && 'bg-card')}>
                  {block(<Badge tone="neutral">{t(`permits.type.${k}.tag`)}</Badge>, 'flex w-fit', 'rounded-chip')}
                  <h4 className="m-0 mt-2 text-[15px] font-semibold text-ink">{tx(t(`permits.type.${k}`))}</h4>
                  <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">{tx(t(`permits.type.${k}.body`))}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={tx(t('permits.special.title'))}>
            <ul className="m-0 grid list-none gap-2 p-0 text-[14px] text-ink-2 @xl:grid-cols-2">
              {(['pgwp', 'student', 'iec', 'pr', 'family'] as const).map((k) => (
                <li key={k} className="flex gap-2.5 leading-snug">
                  <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
                  <span>{tx(t(`permits.special.${k}`, { fee: fmt.money(fees.iec) }))}</span>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}
