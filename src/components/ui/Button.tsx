/**
 * Button / LinkButton / IconButton
 *
 * <Button variant="primary|accent|secondary|quiet|glass" size="sm|md|lg" icon={Icon} iconEnd={Icon} loading>
 * <LinkButton href external> … same variants; `external` adds the ↗ icon, target=_blank and
 *   an sr-only "(opens in a new tab)".
 * <IconButton label="Copy" icon={Copy} size="sm|md" />   label is required (used as aria-label + title).
 *
 * All sizes keep a 44px minimum touch target (sm keeps 40px height with a 44px hit area via padding).
 *
 * `className` is merged with tailwind-merge, so `px-3` or `text-[14px]` overrides the size's own. Pages and
 * site chrome that load with the landing import '@/components/ui/plain/Button' instead.
 */
'use client';
import { cn } from '@/lib/cn';
import { createButtons } from './core/button';

export type { ButtonSize, ButtonVariant } from './core/button';

const buttons = createButtons(cn);

export const Button = buttons.Button;
export const LinkButton = buttons.LinkButton;
export const IconButton = buttons.IconButton;
