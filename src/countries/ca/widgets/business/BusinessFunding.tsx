'use client';
/**
 * businessFunding: grants, loans and advice. Per ISED guidance, every funding answer leads with the
 * Business Benefits Finder (personalized, federal + provincial). Then the person's federal regional
 * development agency and a few national programs that match what they need. No amounts are shown.
 */
import { useState } from 'react';
import { HandCoins, MapPin, Sparkles } from 'lucide-react';
import { Badge, LinkButton, LiveRegion, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { WidgetProps } from '@/lib/widgets/types';
import type { FundingInput, FundingOutput } from './build';
import { fundingFor, NEEDS, type Need, type ProgramKey } from './calc';
import { AGENCIES, pickSources, type Province, SUPPORT_ANCHOR } from './data';
import { BizError, ChoicePills, LinkArrow, LinkRow, ProvinceSelect, useBiz } from './shared';
import { BizSkeleton } from './skeletons';

/** Programs whose intake is closed today (see data.ts: CanExport SMEs, last intake ended Aug 31, 2026). */
const CLOSED: ProgramKey[] = ['canexport'];

function Region({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-ink-3', className)}>
      <MapPin className="size-3.5 shrink-0" aria-hidden strokeWidth={1.8} />
      {text}
    </span>
  );
}

export function BusinessFunding({ part }: WidgetProps<FundingInput, FundingOutput>) {
  const { t, href } = useBiz();
  if (part.state === 'output-error') return <BizError href={href('bbf')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <BizSkeleton kind="funding" input={part.input} title={t('fund.title')} subtitle={t('fund.subtitle')} icon={HandCoins} tone="amber" />;
  }
  return <Finder data={part.output} />;
}

function Finder({ data }: { data: FundingOutput }) {
  const { t, lang, href } = useBiz();
  const [province, setProvince] = useState<Province | null>(data.province);
  const [need, setNeed] = useState<Need>(data.need);
  // One short sentence about what the person just changed, read once it settles (never the whole list again).
  const [said, setSaid] = useState('');
  const result = fundingFor({ province, need });
  const chooseProvince = (p: Province | null) => {
    setProvince(p);
    const names = fundingFor({ province: p, need }).agencies.map((k) => AGENCIES[k].short[lang]);
    setSaid(p && names.length ? t('fund.sr.agency', { province: t(`prov.${p}`), names: names.join(', ') }) : t('fund.agency.none'));
  };
  const chooseNeed = (n: Need) => {
    setNeed(n);
    setSaid(t('fund.sr.programs', { count: fundingFor({ province, need: n }).programs.length + (n === 'start' ? 1 : 0), need: t(`fund.need.${n}`) }));
  };

  return (
    <WidgetShell
      icon={HandCoins}
      tone="amber"
      title={t('fund.title')}
      subtitle={t('fund.subtitle')}
      sources={pickSources(data, lang)}
      handoff={{ href: href('supportFinancing'), label: t('fund.handoff'), note: t('fund.handoff.note') }}
      footnote={t('fund.footnote')}
      className="@container"
    >
      <LiveRegion text={said} />
      {/* The self-serve Finder is the recommended first step for every funding question. */}
      <div className="relative mx-3 overflow-hidden rounded-card border border-amber/25 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_15%,transparent),color-mix(in_oklab,var(--maple)_6%,transparent)_60%,transparent)] px-5 py-5 sm:mx-4">
        <p className="m-0 inline-flex items-center gap-1.5 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-amber">
          <Sparkles className="size-3.5" aria-hidden strokeWidth={2} />
          {t('fund.bbf.kicker')}
        </p>
        <p className="m-0 mt-1.5 text-balance font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{t('fund.bbf.title')}</p>
        <p className="m-0 mt-1.5 max-w-[52ch] text-pretty text-[15px] leading-snug text-ink-2 @xl:max-w-none">{t('fund.bbf.body')}</p>
        <LinkButton href={href('bbf')} external variant="accent" className="mt-4 max-sm:w-full">
          {t('fund.bbf.cta')}
        </LinkButton>
      </div>

      <div className="grid gap-4 px-5 pt-5 sm:px-6 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @xl:gap-6">
        <ProvinceSelect value={province} onChange={chooseProvince} />
        <div className="min-w-0">
          <p className="m-0 mb-1.5 text-[13.5px] font-medium text-ink-2">{t('fund.need')}</p>
          <ChoicePills label={t('fund.need')} value={need} onChange={chooseNeed} options={NEEDS.map((n) => ({ value: n, label: t(`fund.need.${n}`) }))} />
        </div>
      </div>

      <WidgetSection title={t('fund.agency')} className="mt-5 border-t border-hair">
        {province && result.agencies.length ? (
            <>
              {result.agencies.length > 1 ? <p className="m-0 mb-2.5 text-[14px] text-ink-2">{t('fund.agency.onChoose')}</p> : null}
              <ul className={cn('m-0 grid list-none gap-2.5 p-0', result.agencies.length > 1 && '@xl:grid-cols-2')}>
                {result.agencies.map((k) => {
                  const a = AGENCIES[k];
                  const single = result.agencies.length === 1;
                  return (
                    <li key={k}>
                      <LinkRow variant="feature" href={a.url[lang]} className={cn(!single && 'min-h-[88px]')}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-serif text-[22px] leading-tight tracking-[-.015em] text-ink">{a.short[lang]}</span>
                          <span className="flex items-center gap-3">
                            {/* One agency: the card spans the column, so the region sits on the right of the name. */}
                            {single ? <Region className="hidden @xl:inline-flex" text={t('fund.agency.region', { region: a.region[lang] })} /> : null}
                            <LinkArrow />
                          </span>
                        </span>
                        <span className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{a.name[lang]}</span>
                        <Region className={cn('mt-2', single && '@xl:hidden')} text={t('fund.agency.region', { region: a.region[lang] })} />
                      </LinkRow>
                    </li>
                  );
                })}
              </ul>
              <LinkRow
                className="mt-2.5"
                href={`${href('supportFinancing')}#${SUPPORT_ANCHOR[lang][province]}`}
                title={t('fund.local')}
                detail={t('fund.local.detail', { province: t(`prov.${province}`) })}
              />
            </>
          ) : (
            <p className="m-0 rounded-tile border border-dashed border-hair-2 px-4 py-4 text-[14px] leading-snug text-ink-3">{t('fund.agency.none')}</p>
        )}
      </WidgetSection>

      <WidgetSection title={t('fund.programs')}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {result.programs.map((p) => (
            <li key={p}>
              <LinkRow
                href={href(p)}
                title={t(`fund.program.${p}`)}
                detail={t(`fund.program.${p}.detail`)}
                aside={CLOSED.includes(p) ? <Badge className="mt-px shrink-0">{t('fund.program.closed')}</Badge> : undefined}
              />
            </li>
          ))}
          {need === 'start' ? (
            <li>
              <LinkRow href={`${href('supportFinancing')}#${SUPPORT_ANCHOR[lang].groups}`} title={t('fund.groups')} detail={t('fund.groups.detail')} />
            </li>
          ) : null}
        </ul>
      </WidgetSection>
    </WidgetShell>
  );
}
