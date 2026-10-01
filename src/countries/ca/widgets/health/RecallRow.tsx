'use client';
/**
 * One recall notice in the list, as one scannable line: the product, then what is wrong with it. With a
 * summary (the newest notices of a result) the row opens in place on the shared Disclosure; without one it
 * opens the official notice. The larger cards the newest notices get are in ./RecallFeature.tsx.
 *
 * Every notice says what is wrong the same way (`Hazard`): a dot and a label in the colour of the notice's
 * kind (a recall in maple, an alert in amber, an advisory in glacier). The label is the hazard the title names,
 * else the notice's issue type, else the site's own type label, so no row is left without one. A badge names
 * the kind only where it tells something: an alert or an advisory (a recall is what the card is about).
 *
 * Titles, hazards and codes are written by the publishing agency in English or French: each sits in a <bdi>,
 * so a right-to-left page never reorders "3-inch Grundfos SQFlex" or a model number.
 *
 * Core request: Disclosure's header takes any node as its title, which is enough for the icon, badge and meta
 * here, but it has no hover surface or `aside` slot of its own, so the row supplies the hover background and
 * the link rows repeat its round chevron by hand (ROUND below).
 */
import type { ReactNode } from 'react';
import { Apple, ArrowUpRight, Car, Package, Pill, type LucideIcon } from 'lucide-react';
import { Badge, Disclosure, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { RecallDetails } from './RecallDetails';
import { rowText, type Merged, type RowText } from './recall-titles';
import type { RecallCategory, RecallKind } from './recalls';
import { DotList, useLang, type DayLabel } from './shared';

export const CAT_ICON: Record<RecallCategory, LucideIcon> = { food: Apple, health: Pill, consumer: Package, vehicles: Car };
const CAT_TONE: Record<RecallCategory, string> = {
  food: 'bg-amber-wash text-amber',
  health: 'bg-glacier-wash text-glacier',
  consumer: 'bg-pine-wash text-pine',
  vehicles: 'bg-paper-2 text-ink-2',
};
export const KIND_TONE: Record<RecallKind, 'danger' | 'warn' | 'info'> = { recall: 'danger', alert: 'warn', advisory: 'info' };
/** What is wrong, in the colour of its notice: a recall in maple, a warning in amber, an advisory in glacier. */
const HAZARD_TONE: Record<RecallKind, string> = { recall: 'text-maple-ink', alert: 'text-amber', advisory: 'text-glacier' };
const ROUND = 'grid size-9 shrink-0 place-items-center rounded-full border border-hair bg-card text-ink-2 transition-colors';

export function CatTile({ category, className }: { category: RecallCategory; className?: string }) {
  const Icon = CAT_ICON[category];
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-field', CAT_TONE[category], className)} aria-hidden>
      <Icon className="size-[18px]" strokeWidth={1.8} />
    </span>
  );
}

/** What is wrong with the product, the same way on every notice: a dot and a label in the notice's colour. */
export function Hazard({ item, text, className }: { item: Merged; text: RowText; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-baseline gap-1.5 font-medium', HAZARD_TONE[item.kind], className)}>
      <span aria-hidden className="size-[7px] shrink-0 -translate-y-px rounded-full bg-current" />
      <bdi className="min-w-0 [overflow-wrap:anywhere]">{text.hazard ?? text.issue ?? item.type}</bdi>
    </span>
  );
}

/** Transport Canada's recall number: always left to right, in the one place mono earns its keep (a code to match). */
export function RecallRef({ value }: { value: string }) {
  return (
    <bdi dir="ltr" className="whitespace-nowrap font-mono text-[12.5px] tracking-[.02em]">
      {value}
    </bdi>
  );
}

/** Badge (when it tells something), what is wrong, recall number, date and any earlier notice for the same product. */
function Meta({ item, text, badge, date, day }: { item: Merged; text: RowText; badge: boolean; date?: string; day: DayLabel }) {
  const t = useMessages(messages);
  const bits: ReactNode[] = [
    <Hazard key="h" item={item} text={text} />,
    text.ref ? <RecallRef key="r" value={text.ref} /> : null,
    date ? (
      <span key="d" className="whitespace-nowrap">
        {date}
      </span>
    ) : null,
    item.earlier?.length ? <span key="e">{t('recalls.earlier', { date: day(item.earlier[0].date) })}</span> : null,
  ].filter(Boolean);
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-normal leading-snug text-ink-2">
      {badge ? <Badge tone={KIND_TONE[item.kind]}>{t(`recalls.kind.${item.kind}`)}</Badge> : null}
      <DotList items={bits} />
    </span>
  );
}

/** Whether a notice's kind badge tells something: an alert or an advisory, not the recall the card is named for. */
export const hasBadge = (item: Merged) => item.kind !== 'recall';

export function RecallRow({ item, date, day }: { item: Merged; date?: string; day: DayLabel }) {
  const t = useMessages(messages);
  const text = rowText(item, t('common.sep'), useLang());
  const head = (
    <span className="flex min-w-0 flex-1 items-start gap-3.5">
      <CatTile category={item.category} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <bdi className="block text-[15.5px] font-medium leading-snug text-ink [overflow-wrap:anywhere]">{text.title}</bdi>
        <Meta item={item} text={text} badge={hasBadge(item)} date={date} day={day} />
      </span>
    </span>
  );
  return (
    <li className="rounded-tile px-2 transition-colors duration-200 hover:bg-paper-2">
      {item.details ? (
        <Disclosure title={head} lazy headingLevel={5} className="border-t-0 [&>h5>button]:py-2.5">
          <RecallDetails item={item} d={item.details} officialTitle={text.shortened ? item.title : undefined} day={day} className="mb-2 bg-card @md:ms-[50px]" />
        </Disclosure>
      ) : (
        // The whole row is the link: ExternalLink supplies the new-tab wording and rel, the row its own look.
        <ExternalLink href={item.url} icon={false} className="group flex min-h-14 w-full items-center gap-3 py-2.5 text-start font-normal no-underline">
          {head}
          <span className={cn(ROUND, 'group-hover:bg-paper-2')} aria-hidden>
            <ArrowUpRight className="size-4 flip-rtl" />
          </span>
        </ExternalLink>
      )}
    </li>
  );
}
