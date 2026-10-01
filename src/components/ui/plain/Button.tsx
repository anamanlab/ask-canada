/**
 * Button / LinkButton / IconButton for pages and site chrome on the landing's first load. Same props and
 * look as '@/components/ui/Button', without tailwind-merge: `className` is appended, not merged, so pass
 * only classes the button doesn't already set (margins, width, visibility), never a competing `px-*`,
 * `text-*` or `min-h-*`. Widgets keep using '@/components/ui'.
 */
'use client';
import { cx } from '@/lib/cx';
import { createButtons } from '../core/button';

export type { ButtonSize, ButtonVariant } from '../core/button';

const buttons = createButtons(cx);

export const Button = buttons.Button;
export const LinkButton = buttons.LinkButton;
export const IconButton = buttons.IconButton;
