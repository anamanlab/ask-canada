/**
 * Chip: pill-shaped action (suggestions, follow-ups, filters).
 * <Chip icon={Icon} onClick selected>Renew my passport</Chip>
 * <Chip as="a" href="/?q=…">…</Chip>
 * `wrap` lets long follow-up questions wrap onto two lines.
 *
 * `className` and `iconClassName` are merged with tailwind-merge, so they can override the chip's own
 * classes. The landing imports '@/components/ui/plain/Chip' instead.
 */
'use client';
import { cn } from '@/lib/cn';
import { createChip } from './core/chip';

export const Chip = createChip(cn);
