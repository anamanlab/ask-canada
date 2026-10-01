/**
 * Ask Canada mark: the maple leaf on its own (never the Canada wordmark or FIP signature).
 * Props: className (size/colour via CSS; fill uses currentColor), title (accessible name; omit when decorative).
 */
import type { MarkProps } from '@/lib/country/types';
import { LEAF_PATH, LEAF_VIEWBOX } from './leaf';

export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox={LEAF_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={LEAF_PATH} />
    </svg>
  );
}
