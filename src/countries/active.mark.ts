/**
 * The active pack's mark on its own (`brand/Mark.tsx`), for the pages that must stay light: the error
 * boundaries ship with every route, and reading the mark off `pack.brand` would bundle the whole pack
 * (services, icons) into their chunks a second time.
 */
export { Mark } from '@country/mark';
