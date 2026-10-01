import { clsx, type ClassValue } from 'clsx';

/** A class-name joiner: `cx` (join only) or `cn` from '@/lib/cn' (join, then resolve Tailwind conflicts). */
export type ClassJoiner = (...inputs: ClassValue[]) => string;

/**
 * Join class names without resolving Tailwind conflicts. Use it wherever the inputs cannot conflict
 * (state toggles, BEM classes, spacing added to a component). It keeps tailwind-merge (8.5 KB gz) out of
 * the landing's first load; reach for `cn` only when a later class must override an earlier one.
 */
export const cx: ClassJoiner = (...inputs) => clsx(inputs);
