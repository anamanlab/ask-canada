/**
 * Notice for the app shell on the landing's first load. Same props and look as '@/components/ui/Notice',
 * without tailwind-merge: `className` is appended, not merged, so pass only classes the notice doesn't
 * already set. Widgets keep using '@/components/ui'.
 */
import { cx } from '@/lib/cx';
import { createNotice } from '../core/notice';

export const Notice = createNotice(cx);
