'use client';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Checklist, Disclosure, ExternalLink, useChecklist, WidgetSection } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { DocId } from './data';
import type { ExplainOutput } from './explain';
import { useLang } from './local';
import messages from './messages';
import { WithPhones } from './Phones';
import { url } from './urls';

/** A list this long or longer starts with its first steps only; the rest are one tap away. */
const FOLD_FROM = 5;
const FIRST = 3;

/**
 * On a narrow column each step's official page drops under the step as a named text link, indented to the
 * step's text; from @xl it is a pill beside the row. Either way it stays outside the tick target (the
 * Checklist's `aside`), so the selectors below only place that slot. They follow the core Checklist's markup
 * (`li > div` is the aside) until it offers a placement prop; the lab's EI decision fixture is the check.
 */
const LINK_BELOW =
  '@max-xl:[&>li]:flex-wrap @max-xl:[&>li>div]:-mt-1.5 @max-xl:[&>li>div]:basis-full @max-xl:[&>li>div]:pb-3 @max-xl:[&>li>div]:ps-9 @max-xl:[&>li>div]:pt-0 @max-xl:[&>li>div]:leading-[1.4]';

/**
 * A step's official page. Narrow column: inline text that wraps like a sentence, the arrow glued to its last
 * word (so a two-line French label never strands it). From @xl: a one-line pill.
 */
function StepLink({ href, label }: { href: string; label: string }) {
  const text = label.trimEnd();
  const cut = text.lastIndexOf(' ') + 1;
  return (
    <ExternalLink
      href={href}
      icon={false}
      className="group/link rounded-[6px] text-[14.5px] text-ink-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink @xl:-my-2.5 @xl:inline-flex @xl:min-h-11 @xl:items-center @xl:rounded-full @xl:py-0"
    >
      <span className="underline decoration-hair-2 underline-offset-[3px] transition-colors group-hover/link:text-ink group-hover/link:decoration-ink @xl:inline-block @xl:h-8 @xl:whitespace-nowrap @xl:rounded-full @xl:border @xl:leading-[30px] @xl:border-hair-2 @xl:bg-card @xl:px-3 @xl:text-[13.5px] @xl:no-underline @xl:group-hover/link:border-ink-3">
        {text.slice(0, cut)}
        <span className="whitespace-nowrap">
          {text.slice(cut)}
          <ArrowUpRight className="ms-1 inline-block size-4 shrink-0 align-[-0.18em] flip-rtl @xl:ms-1.5" strokeWidth={1.9} aria-hidden />
        </span>
      </span>
    </ExternalLink>
  );
}

/**
 * Next steps, ticked off on this device (saved per document). The first few show; the rest wait in a
 * `Disclosure` (same saved list, so the count covers both).
 */
export function Steps({ doc, steps, className }: { doc: DocId; steps: ExplainOutput['steps']; className?: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  const label = t('steps.listLabel');
  const list = useChecklist(`documents:steps:${doc}`, label, steps.length);
  const folds = steps.length >= FOLD_FROM;
  const first = folds ? steps.slice(0, FIRST) : steps;
  const rest = folds ? steps.slice(FIRST) : [];
  const toItems = (part: ExplainOutput['steps']) =>
    part.map((s) => {
      const detail = t(`doc.${doc}.step.${s.id}.detail`, { phone: s.phone ?? '' });
      return {
        id: s.id,
        title: <span className="text-[16px]">{t(`doc.${doc}.step.${s.id}.title`)}</span>,
        detail: (
          <span className="block max-w-[60ch] text-[14.5px] leading-[1.45] text-ink-2">
            {s.phone ? <WithPhones text={detail} phones={[s.phone]} /> : detail}
            {s.note ? (
              <span className="mt-1.5 flex items-start gap-1.5 font-medium text-pine">
                <ShieldCheck className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden />
                {t(`doc.${doc}.step.${s.id}.note`)}
              </span>
            ) : null}
          </span>
        ),
        aside: s.link ? <StepLink href={url(s.link, lang)} label={t(`link.${s.link}`)} /> : undefined,
      };
    });
  // Count only this card's steps: a tick saved for a step this letter doesn't show isn't progress here.
  const done = steps.filter((s) => list.value.includes(s.id)).length;
  return (
    <WidgetSection
      className={className}
      title={t('sec.steps')}
      aside={
        <span className="whitespace-nowrap text-[13.5px] font-medium text-pine" aria-live="polite">
          <bdi>{t('steps.progress', { done, total: steps.length })}</bdi>
        </span>
      }
    >
      <Checklist label={label} items={toItems(first)} value={list.value} onChange={list.onChange} className={LINK_BELOW} />
      {rest.length ? (
        <Disclosure
          title={t('steps.more', { count: rest.length })}
          // Names the next step only: a joined list of every title would be cut off on a phone.
          summary={t('steps.moreHint', { title: t(`doc.${doc}.step.${rest[0].id}.title`) })}
          headingLevel={5}
          className="mt-2"
        >
          <Checklist label={t('steps.moreLabel')} items={toItems(rest)} value={list.value} onChange={list.onChange} className={LINK_BELOW} />
        </Disclosure>
      ) : null}
    </WidgetSection>
  );
}
