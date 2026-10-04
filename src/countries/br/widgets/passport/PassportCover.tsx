/**
 * Brazilian passport cover illustration (Passaporte Brasileiro):
 * Deep navy blue cover, gold-embossed Southern Cross constellation / national emblem,
 * official lettering and biometric e-passport chip.
 */
import { useId } from 'react';

const TOKENS = [
  '[--pp-navy:#0d2346] [--pp-navy-deep:#061224] [--pp-spine:#050e1c]',
  '[--pp-gold:#e5b842] [--pp-rim:rgba(229,184,66,0.3)] [--pp-shadow:rgba(6,18,36,0.35)]',
  'dark:[--pp-navy:#132a52] dark:[--pp-navy-deep:#09152b] dark:[--pp-spine:#081022]',
  'dark:[--pp-gold:#f0c95d] dark:[--pp-rim:rgba(240,201,93,0.35)] dark:[--pp-shadow:rgba(0,0,0,0.6)]',
].join(' ');

/**
 * <PassportCover />            the planner's icon (36 x 44)
 * <PassportCover size="lg" />  expanded illustration (100 x 122)
 */
export function PassportCover({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const id = useId().replace(/[^\w-]/g, '');
  const grad = `pc-cover-br-${id}`;
  const sheen = `pc-sheen-br-${id}`;
  const gold = { fill: 'var(--pp-gold)' };
  const lg = size === 'lg';

  return (
    <svg
      width={lg ? 100 : 36}
      height={lg ? 122 : 44}
      viewBox="0 0 36 44"
      aria-hidden
      className={`${lg ? 'drop-shadow-[0_14px_18px_var(--pp-shadow)]' : '-rotate-[4deg] drop-shadow-[0_6px_10px_var(--pp-shadow)]'} ${TOKENS} ${className ?? ''}`}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--pp-navy)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pp-navy-deep)' }} />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0.2" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0" />
          <stop offset="0.5" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0.18" />
          <stop offset="0.8" style={{ stopColor: 'var(--pp-gold)' }} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Passport booklet cover */}
      <rect
        x="1"
        y="1"
        width="34"
        height="42"
        rx={lg ? 3 : 4}
        fill={`url(#${grad})`}
        style={{ stroke: 'var(--pp-rim)' }}
        strokeWidth={lg ? 0.6 : 0.8}
      />
      {/* Sheen overlay */}
      <rect x="1" y="1" width="34" height="42" rx={lg ? 3 : 4} fill={`url(#${sheen})`} />

      {/* Book spine on left */}
      <rect x="1" y="1" width="3.5" height="42" rx="1.5" style={{ fill: 'var(--pp-spine)' }} opacity=".8" />

      {/* Gold decorative border (larger version) */}
      {lg ? (
        <rect
          x="7"
          y="4.5"
          width="25"
          height="35"
          rx="1.2"
          fill="none"
          style={{ stroke: 'var(--pp-gold)' }}
          strokeWidth=".35"
          opacity=".4"
        />
      ) : null}

      {/* Gold embossed text: BRASIL */}
      <rect x="11" y="6" width="14" height="1.6" rx=".8" style={gold} opacity=".95" />

      {/* Southern Cross constellation (Cruzeiro do Sul) */}
      <g style={gold} opacity=".95">
        <circle cx="18" cy="14" r="1.1" />
        <circle cx="18" cy="24" r="1.1" />
        <circle cx="13" cy="18.5" r="1" />
        <circle cx="23" cy="19.5" r="1" />
        <circle cx="20" cy="21.5" r="0.75" />
        {/* Subtle connecting lines */}
        <line x1="18" y1="14" x2="18" y2="24" stroke="var(--pp-gold)" strokeWidth="0.4" opacity="0.4" />
        <line x1="13" y1="18.5" x2="23" y2="19.5" stroke="var(--pp-gold)" strokeWidth="0.4" opacity="0.4" />
      </g>

      {/* Gold embossed text: PASSAPORTE */}
      <rect x="10" y="30" width="16" height="1.6" rx=".8" style={gold} opacity=".9" />
      <rect x="13" y="33" width="10" height="1.1" rx=".55" style={gold} opacity=".6" />

      {/* Biometric chip emblem */}
      <rect x="15.5" y="36.5" width="5" height="3" rx="0.8" fill="none" style={{ stroke: 'var(--pp-gold)' }} strokeWidth=".7" opacity=".85" />
      <circle cx="18" cy="38" r="0.8" style={gold} opacity=".85" />
      <line x1="15.5" y1="38" x2="17.2" y2="38" stroke="var(--pp-gold)" strokeWidth="0.7" opacity="0.85" />
      <line x1="18.8" y1="38" x2="20.5" y2="38" stroke="var(--pp-gold)" strokeWidth="0.7" opacity="0.85" />
    </svg>
  );
}

export default PassportCover;
