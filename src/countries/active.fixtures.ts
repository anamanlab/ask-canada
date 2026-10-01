/**
 * Lab fixtures and widget catalogs of the active pack (both lazy). Kept apart from the widget registry
 * (`./active.widgets.ts`) so a page can read fixtures without pulling every widget's code into its bundle.
 */
export { fixtures, catalogs } from '@country/fixtures';
