/**
 * Chip for the landing's first load. Same props and look as '@/components/ui/Chip', without
 * tailwind-merge: `className` and `iconClassName` are appended, not merged, so pass only classes the chip
 * doesn't already set. Widgets keep using '@/components/ui'.
 */
'use client';
import { cx } from '@/lib/cx';
import { createChip } from '../core/chip';

export const Chip = createChip(cx);
