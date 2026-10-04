/**
 * Ask Brasil brand mark: the Brazilian national flag emblem.
 * Renders the authentic national flag symbol of Brazil per Lei 5.700/1971.
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
      {/* Green field */}
      <rect width="28" height="20" rx="2.5" fill="#009C3B" />
      {/* Yellow rhombus (losango) */}
      <polygon points="14,1.8 25.8,10 14,18.2 2.2,10" fill="#FFDF00" />
      {/* Blue celestial globe */}
      <circle cx="14" cy="10" r="5.2" fill="#002776" />
      {/* White celestial band with Ordem e Progresso green arc */}
      <path
        d="M 8.8,10.8 A 7,7 0 0,1 19.1,8.3 A 7.3,7.3 0 0,0 8.8,10.8 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 11.2,10.1 A 6.8,6.8 0 0,1 17.2,8.8"
        fill="none"
        stroke="#009C3B"
        strokeWidth="0.4"
        strokeLinecap="round"
      />
      {/* Stars in white */}
      <g fill="#FFFFFF">
        {/* Spica above the band */}
        <circle cx="14.8" cy="7.8" r="0.32" />
        {/* Cruzeiro do Sul */}
        <circle cx="14" cy="9.6" r="0.35" />
        <circle cx="14" cy="11.4" r="0.35" />
        <circle cx="13.2" cy="10.4" r="0.3" />
        <circle cx="14.7" cy="10.5" r="0.32" />
        <circle cx="14.3" cy="10.9" r="0.25" />
        {/* Canopus & Sirius */}
        <circle cx="12" cy="11.2" r="0.3" />
        <circle cx="11.3" cy="9.8" r="0.3" />
        {/* Triângulo Austral */}
        <circle cx="14.2" cy="12.8" r="0.3" />
        <circle cx="13.4" cy="13.5" r="0.28" />
        <circle cx="14.9" cy="13.5" r="0.28" />
        {/* Sigma Octantis (DF) */}
        <circle cx="14" cy="14.2" r="0.25" />
      </g>
    </svg>
  );
}

export default Mark;