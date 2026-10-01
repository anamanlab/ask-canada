'use client';
/**
 * businessIncorporate: federal incorporation planner. Fee and turnaround (express toggle), numbered vs
 * word name, the 5 official steps as a checklist saved on the device, where else to register
 * (province by province) and what happens after.
 */
import { useId, useState } from 'react';
import { Landmark } from 'lucide-react';
import { Button, Checklist, ExternalLink, LiveRegion, NumberTicker, Segmented, Stat, Toggle, useChecklist, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import type { WidgetProps } from '@/lib/widgets/types';
import type { IncorporateInput, IncorporateOutput, NameType } from './build';
import { pickSources, PROVINCE, PROVINCES, type Province } from './data';
import { BizError, HandoffNote, Hero, STAT_CELL, STAT_GRID, TogglePill, useBiz } from './shared';
import { BizSkeleton } from './skeletons';

const ROUTES = ['bundled', 'partner', 'registrar'] as const;

export function BusinessIncorporate({ part }: WidgetProps<IncorporateInput, IncorporateOutput>) {
  const { t, href } = useBiz();
  if (part.state === 'output-error') return <BizError href={href('howIncorporate')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <BizSkeleton kind="incorporate" title={t('inc.title')} subtitle={t('inc.subtitle')} icon={Landmark} tone="maple" />;
  }
  return <Planner data={part.output} />;
}

function Planner({ data }: { data: IncorporateOutput }) {
  const { t, fmt, lang, href } = useBiz();
  const { send } = useChatActions();
  const [express, setExpress] = useState(data.express);
  const [nameType, setNameType] = useState<NameType>(data.nameType);
  const [where, setWhere] = useState<Province[]>(data.provinces);
  // One short sentence about what the person just changed, read once it settles (never the whole card again).
  const [said, setSaid] = useState('');
  const hintId = useId();
  const fees = data.fees;
  const total = fees.incorporation + (express ? fees.express : 0);

  const steps = [
    { id: 'name', title: t('inc.step1.title'), detail: t(nameType === 'word' ? 'inc.step1.word' : 'inc.step1.numbered') },
    { id: 'articles', title: t('inc.step2.title'), detail: t(nameType === 'numbered' ? 'inc.step2.basic' : 'inc.step2.custom') },
    { id: 'office', title: t('inc.step3.title'), detail: t('inc.step3.detail') },
    { id: 'isc', title: t('inc.step4.title'), detail: t('inc.step4.detail') },
    { id: 'file', title: t('inc.step5.title', { fee: fmt.money(total) }), detail: t('inc.step5.detail') },
  ];
  // Saved on this device; the count is read during render, so it never flashes "0 of 5" first.
  const list = useChecklist('business:incorporate:steps', t('inc.saved'), steps.length);
  const done = steps.filter((s) => list.value.includes(s.id)).length;
  const verdict = t(express ? 'inc.hero.express' : 'inc.hero.standard');

  const group = (chosen: Province[]) => ROUTES.map((r) => ({ route: r, list: PROVINCES.filter((p) => chosen.includes(p) && PROVINCE[p].extra === r) })).filter((g) => g.list.length);
  const grouped = group(where);
  const toggleProv = (p: Province) => {
    const next = where.includes(p) ? where.filter((x) => x !== p) : [...where, p];
    setWhere(next);
    const routes = group(next).map((g) => t(`inc.sr.route.${g.route}`, { count: g.list.length }));
    setSaid(next.length ? t('inc.sr.where', { count: next.length, routes: routes.join(', ') }) : t('inc.where.none'));
  };

  return (
    <WidgetShell
      icon={Landmark}
      tone="maple"
      title={t('inc.title')}
      subtitle={t('inc.subtitle')}
      sources={pickSources(data, lang)}
      handoff={{ href: href('filingCentre'), label: t('inc.handoff') }}
      secondaryAction={
        <>
          {/* A short label; the full question is what gets asked: about a corporation, and where when one province is chosen. */}
          <Button size="lg" className="max-sm:w-full" onClick={() => send(t('structure.ask.register.corp', { where: where.length === 1 ? where[0] : 'none' }))}>
            {t('structure.ask.register.label')}
          </Button>
          <HandoffNote>{t('inc.handoff.note')}</HandoffNote>
        </>
      }
      footnote={t('inc.phone', { phone: data.phone })}
      className="@container"
    >
      <LiveRegion text={said} />
      <Hero tone="ok" title={verdict}>
        <p className="m-0">{t('inc.hero.sub')}</p>
      </Hero>

      <div className={cn(STAT_GRID, 'px-5 pt-4 sm:px-6')}>
        <Stat
          className={STAT_CELL}
          label={t('inc.total')}
          value={<NumberTicker value={total} format={(n) => fmt.money(n, { cents: 'never' })} />}
          note={express ? t('inc.totalNote.express', { fee: fmt.money(fees.express) }) : t('inc.totalNote')}
        />
        <Stat className={STAT_CELL} label={t('inc.yearly')} value={fmt.money(fees.annualReturn)} note={t('inc.yearlyNote')} />
      </div>
      <div className="px-5 pt-0.5 sm:px-6">
        <Toggle label={t('inc.express')} description={t('inc.express.desc', { fee: fmt.money(fees.express) })} checked={express}
          onChange={(v) => {
            setExpress(v);
            setSaid(t(v ? 'inc.hero.express' : 'inc.hero.standard'));
          }}
        />
      </div>

      <WidgetSection title={t('inc.name')} className="mt-4 border-t border-hair">
        <Segmented
          label={t('inc.name')}
          value={nameType}
          onChange={(v) => {
            setNameType(v);
            setSaid(t(v === 'word' ? 'inc.name.wordNote' : 'inc.name.numberedNote'));
          }}
          options={[
            { value: 'numbered', label: t('inc.name.numbered'), sub: <bdi dir="ltr">{t('inc.name.numbered.sub')}</bdi> },
            { value: 'word', label: t('inc.name.word'), sub: t('inc.name.word.sub') },
          ]}
        />
        <p className="m-0 mt-3 text-[14px] leading-snug text-ink-2">
          {t(nameType === 'word' ? 'inc.name.wordNote' : 'inc.name.numberedNote')}
          {nameType === 'word' ? (
            <>
              {' '}
              <ExternalLink href={href('naming')}>{t('inc.name.link')}</ExternalLink>
            </>
          ) : null}
        </p>
      </WidgetSection>

      <WidgetSection
        title={t('inc.steps')}
        aside={
          <span className="font-mono text-[12px] text-pine">
            {/* Isolated: the sentence keeps its own direction, so its leading digit is never reordered in RTL. */}
            <bdi>{t('inc.steps.progress', { done, total: steps.length })}</bdi>
          </span>
        }
      >
        <Checklist label={t('inc.saved')} items={steps} value={list.value} 
          onChange={(ids) => {
            list.onChange(ids);
            setSaid(t('inc.steps.progress', { done: steps.filter((s) => ids.includes(s.id)).length, total: steps.length }));
          }}
        />
      </WidgetSection>

      <WidgetSection title={t('inc.where')}>
        <p id={hintId} className="m-0 mb-3 text-[14px] leading-snug text-ink-2">{t('inc.where.hint')}</p>
        {/* The pills are one named group (the section's question), like the priority pills of businessStructure. */}
        <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={hintId}>
          <legend className="sr-only">{t('inc.where')}</legend>
          {/* Phones: an even two-column grid of full-width pills, all one height (room for a two-line French name, centred), set a little smaller and tighter; wide: a wrapping row. */}
          <div className="grid grid-cols-2 gap-2 @max-xl:[&>button]:min-h-12 @max-xl:[&>button]:gap-1.5 @max-xl:[&>button]:px-3 @max-xl:[&>button]:ps-2.5 @max-xl:[&>button]:text-[13.5px] @max-xl:[&>button]:leading-[1.15] @xl:flex @xl:flex-wrap">
            {PROVINCES.map((p) => (
              <TogglePill key={p} on={where.includes(p)} onClick={() => toggleProv(p)}>
                {t(`prov.${p}`)}
              </TogglePill>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          {grouped.length ? (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {grouped.map(({ route, list }) => (
                <li key={route} className={cn('rounded-tile border px-4 py-3.5', route === 'bundled' ? 'border-pine/20 bg-pine-wash' : 'border-hair bg-paper-2')}>
                  <p className="m-0 text-[14.5px] font-semibold text-ink">{t(`inc.route.${route}`)}</p>
                  <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-2">{list.map((p) => t(`prov.${p}`)).join(' · ')}</p>
                  <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">{t(`inc.route.${route}.detail`)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[14px] text-ink-3">{t('inc.where.none')}</p>
          )}
          <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-3">{t('inc.where.fees')}</p>
          {/* Inline (not `standalone`): the link's own vertical padding gives the 44px target, and the words keep their spaces. */}
          <p className="m-0 mt-1.5 text-[14px] leading-snug">
            <ExternalLink href={href('extraProvincial')}>{t('inc.where.feesLink')}</ExternalLink>
          </p>
        </div>
      </WidgetSection>

      <WidgetSection title={t('inc.after')}>
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {(['bn', 'gst', 'annual', 't2'] as const).map((k) => (
            <li key={k} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
              <span className="mt-[8px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
              {t(`inc.after.${k}`, { fee: fmt.money(fees.annualReturn) })}
            </li>
          ))}
        </ul>
      </WidgetSection>
    </WidgetShell>
  );
}
