/**
 * Ask Brasil brand mark: the Brazilian flag emblem.
 * Renders the authentic national flag symbol of Brazil, matching Ask Canada's use of its national maple leaf.
 * Props: className (size/colour via CSS), title (accessible name; omit when decorative).
 */
import type { MarkProps } from '@/lib/country/types';

export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 28 20"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <rect width="28" height="20" rx="3" fill="#009C3B" />
      <polygon points="14,2.5 25.6,10 14,17.5 2.4,10" fill="#FFDF00" />
      <circle cx="14" cy="10" r="5" fill="#002776" />
      {/* White celestial curved arc */}
      <path
        d="M 9.2,10.7 A 6.8,6.8 0 0,1 18.7,8.6 A 7.1,7.1 0 0,0 9.2,10.7 Z"
        fill="#FFFFFF"
      />
      {/* Southern Cross and constellation stars */}
      <g fill="#FFFFFF">
        <circle cx="14" cy="9.2" r="0.45" />
        <circle cx="14" cy="10.9" r="0.45" />
        <circle cx="13.3" cy="10" r="0.4" />
        <circle cx="14.7" cy="10.1" r="0.45" />
        <circle cx="14.3" cy="10.5" r="0.3" />
        <circle cx="13.6" cy="7.9" r="0.45" />
      </g>
    </svg>
  );
}

export default Mark;