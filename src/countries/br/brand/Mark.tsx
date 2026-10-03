/**
 * Ask Brasil mark: a compass star, alone (never a state symbol or the government lockup).
 * Props: className (size/colour via CSS; fill uses currentColor), title (accessible name; omit when decorative).
 */
import type { MarkProps } from '@/lib/country/types';
import { MARK_CORE_PATH, MARK_PATH, MARK_VIEWBOX } from './mark';

export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={MARK_PATH} />
      <path d={MARK_CORE_PATH} opacity={0.4} />
    </svg>
  );
}