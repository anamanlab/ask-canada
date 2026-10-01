'use client';
/**
 * "What do you need?": the finder's filter, always the same five choices (Express included, whatever the
 * person first asked for). Phones: a grid, so every label keeps its side padding at 320px and up in English
 * and French: two on the first row and three on the second (on the narrowest phones two, two and one
 * full-width), so no cell is ever empty.
 * Mid widths: one slim row of single-line labels. Wide: the same row with a sub-label under each, once every
 * tab has room. The sub-labels are always there for screen readers. Express says how long it takes at the
 * nearest office that offers it (`expressDays`), so the tab and the office's details never disagree.
 * Sizes come from the group's own layout (`className`) and from the label and sub-label this file renders,
 * never from the primitive's inner markup.
 */
import { Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Need } from './types';

/**
 * Five choices. Under 320px of card (a 320px phone): two columns, the last choice across both. From 320px: six columns, the
 * first two choices take three each and the other three take two each. From 512px: one row (a tab needs about
 * 90px: the longest label plus its padding; four choices reach that at 448px).
 */
const FIVE = cn(
  'grid-cols-2 [&>*:last-child]:col-span-2',
  '@[320px]:grid-cols-6 @[320px]:[&>*]:col-span-2 @[320px]:[&>*:nth-child(-n+2)]:col-span-3',
  '@lg:flex',
);

export function NeedFilter({
  value,
  onChange,
  needs,
  expressDays,
  disabled,
}: {
  value: Need;
  onChange: (n: Need) => void;
  needs: Need[];
  /** Express pick-up at the nearest office that offers it: [from, to] business days. */
  expressDays: [number, number];
  disabled: (n: Need) => boolean;
}) {
  const t = useMessages(messages);
  const options = needs.map((n) => ({
    value: n,
    label: t(`filter.${n}`),
    sub: (
      // Five tabs fit their sub-labels on one line each from 672px of card.
      <span className="sr-only whitespace-nowrap py-0.5 font-sans text-[12px] text-ink-2 @2xl:not-sr-only @2xl:block">
        <bdi>{t(`filter.${n}.sub`, { from: String(expressDays[0]), to: String(expressDays[1]) })}</bdi>
      </span>
    ),
    disabled: disabled(n),
  }));
  return <Segmented label={t('filter.label')} value={value} onChange={onChange} options={options} className={cn('grid w-full', FIVE)} />;
}
