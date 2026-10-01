'use client';
/**
 * The narrow structure comparison: the core `Tabs` (its ARIA, roving focus and sliding underline, nothing
 * re-implemented here) laid out as equal-width tabs whose labels wrap instead of scrolling, so all three (and
 * the best fit, in pine) stay visible, even in French on a 360px phone.
 *   <StructureTabs label="Compare" tabs={[{ id, label, content }, …]} defaultTab="sole" />
 *
 * DEPENDS ON CORE (for the owner of src/components/ui/Tabs.tsx): `Tabs` has no equal-width / wrapping variant,
 * so this file restyles its tab list from outside, through the ARIA roles it renders (`> [role=tablist]`,
 * `> [role=tab]`). Asked of core: a `fit="equal"` (or `wrap`) prop on `Tabs`. When it lands, delete this file
 * and use `<Tabs fit="equal" />` in BusinessStructure. Until then tabs-contract.test.mjs fails as soon as the core
 * markup stops matching these selectors (the tab list no longer a direct child, a tab no longer a direct child of it). The underline is core's own: it is placed from the
 * measured `offsetLeft` of the active tab (a physical offset, see `useSlidingThumb`), which is why it is
 * anchored with `left-0` there and still lands under the right tab in RTL.
 */
import { Tabs, type TabItem } from '@/components/ui';
import { cn } from '@/lib/cn';

/** The tab list as an even grid (one column per tab, no gap, nothing to scroll). */
const LIST = '[&>[role=tablist]]:grid [&>[role=tablist]]:auto-cols-fr [&>[role=tablist]]:grid-flow-col [&>[role=tablist]]:gap-0 [&>[role=tablist]]:overflow-visible';
/** Each tab: a little smaller and tighter, free to wrap (and to break a long French word) inside its column. */
const TAB =
  '[&>[role=tablist]>[role=tab]]:min-h-12 [&>[role=tablist]>[role=tab]]:min-w-0 [&>[role=tablist]>[role=tab]]:whitespace-normal [&>[role=tablist]>[role=tab]]:px-1.5 [&>[role=tablist]>[role=tab]]:py-2 [&>[role=tablist]>[role=tab]]:text-[14px] [&>[role=tablist]>[role=tab]]:leading-tight [&>[role=tablist]>[role=tab]]:[overflow-wrap:anywhere]';

export function StructureTabs({ label, tabs, defaultTab, className }: { label: string; tabs: TabItem[]; defaultTab?: string; className?: string }) {
  return <Tabs label={label} tabs={tabs} defaultTab={defaultTab} className={cn(LIST, TAB, className)} />;
}
