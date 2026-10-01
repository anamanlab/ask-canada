'use client';
/**
 * Compact dental card for follow-up questions ("What does it cover?"): where the person stands (from the
 * answers saved on this device, if any) and the co-payment tiers. The full checker is one tap away.
 */
import { ArrowRight, Check, CircleAlert, CircleHelp, Smile } from 'lucide-react';
import { Button, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { checkDental, REQS, type DentalOutput } from './dental';
import { answersOf, nbPeriod, useSavedAnswers } from './dental-saved';
import messages from './messages';
import { verdictTone } from './shared';

const TONE = { likely: 'ok', not: 'no', maybe: 'open' } as const;
const ICON = { likely: Check, not: CircleAlert, maybe: CircleHelp } as const;

export default function DentalSummary({ data }: { data: DentalOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const [saved] = useSavedAnswers();
  const answers = answersOf(data.input, saved);
  const r = checkDental(answers);
  const known = r.unknown.length < REQS.length;
  // Not eligible for a reason other than income: the income tile is only what the plan *would* pay (dashed,
  // labelled "If you qualified"), never a green "this is yours".
  const hypothetical = r.verdict === 'not' && r.failed.some((f) => f !== 'income');
  const income = answers.familyIncome;
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const pct = (n: number) => fmt.number(n / 100, { style: 'percent' });
  const tiles = [
    ...data.tiers.map((tier, i) => ({
      key: String(tier.below),
      big: pct(100 - tier.copay),
      label: tier.copay ? t('dental.summary.copay', { pct: pct(tier.copay) }) : t('dental.cover.none'),
      range: i === 0 ? t('dental.tier.under', { amount: money(tier.below) }) : t('dental.tier.range', { from: money(data.tiers[i - 1].below), to: money(tier.below - 1) }),
      here: income != null && income < tier.below && (i === 0 || income >= data.tiers[i - 1].below),
      over: false,
    })),
    { key: 'over', big: '—', label: t('dental.tier.none'), range: t('dental.tier.from', { amount: money(data.limit) }), here: income != null && income >= data.limit, over: true },
  ];
  const Icon = ICON[r.verdict];
  const tone = verdictTone(TONE[r.verdict]);
  const askChecker = () => send(t('dental.summary.ask'));
  return (
    <WidgetShell
      icon={Smile}
      tone="pine"
      title={t('dental.title')}
      subtitle={t('dental.summary.subtitle', { period: nbPeriod(data.benefitPeriod) })}
      sources={data.sources}
      handoff={{ href: data.coverageUrl, label: t('dental.summary.handoff'), note: t('dental.summary.handoffNote') }}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        {known ? (
          <div role="status" className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-tile border px-4 py-3', tone.box)}>
            <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone.dot)}>
              <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <p className="m-0 min-w-0 flex-1 basis-[12rem] leading-snug">
              <span className="block text-[15px] font-semibold text-ink">{t(`dental.verdict.${r.verdict}`)}</span>
              <span className="mt-0.5 block text-[13.5px] text-ink-2">{t('dental.summary.fromAnswers', { done: REQS.length - r.unknown.length, total: REQS.length })}</span>
            </p>
            {/* Always reachable: on phones the row wraps and the button goes full width under the status. */}
            <Button variant="secondary" size="md" iconEnd={ArrowRight} onClick={askChecker} className="shrink-0 max-sm:w-full">
              {t('dental.summary.review')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-tile border border-hair bg-paper-2 px-4 py-3">
            <p className="m-0 min-w-0 flex-1 text-[14.5px] leading-snug text-ink-2">{t('dental.summary.notSure')}</p>
            <Button variant="secondary" size="md" iconEnd={ArrowRight} onClick={askChecker} className="max-sm:w-full">
              {t('dental.summary.check')}
            </Button>
          </div>
        )}

        <h4 className="m-0 mt-5 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-3">{t('dental.summary.tiersTitle')}</h4>
        <ul aria-label={t('dental.summary.tiersTitle')} className="m-0 mt-2.5 grid list-none grid-cols-2 gap-2 p-0 @xl:grid-cols-4">
          {tiles.map((x) => (
            <li
              key={x.key}
              aria-current={x.here || undefined}
              className={cn(
                'flex min-w-0 flex-col rounded-tile border px-3.5 py-3 transition-colors',
                x.here && !hypothetical ? 'border-pine/40 bg-pine-wash' : x.here ? 'border-dashed border-ink-3/60 bg-card' : 'border-hair bg-card',
                x.over && !x.here && 'bg-paper-2',
              )}
            >
              <span className={cn("font-serif text-[30px] leading-none tracking-[-.02em] [font-variation-settings:'opsz'_48]", x.over ? 'text-ink-3' : 'text-ink')}>
                <bdi dir="ltr">{x.big}</bdi>
              </span>
              <span className="mt-2 text-[13px] font-semibold leading-tight text-ink">{x.label}</span>
              <span className="mt-0.5 text-[12.5px] leading-tight text-ink-2">
                <bdi dir="ltr">{x.range}</bdi>
              </span>
              {x.here && hypothetical && !x.over ? (
                <span className="mt-2 inline-flex items-center gap-1 self-start text-[12px] font-medium leading-tight text-ink-2">
                  <CircleAlert className="size-3.5 shrink-0" aria-hidden />
                  {t('dental.summary.ifQualified')}
                </span>
              ) : null}
              {x.here ? <span className="sr-only">{t('dental.summary.yourIncome')}</span> : null}
            </li>
          ))}
        </ul>
        <p className="m-0 mt-2.5 text-[13px] leading-snug text-ink-3">{t('dental.summary.note')}</p>
      </div>
    </WidgetShell>
  );
}
