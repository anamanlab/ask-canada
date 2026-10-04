/**
 * Official Brazilian flag component (Bandeira Nacional do Brasil).
 * Conforms to legal proportions (14:20 landscape) per Lei 5.700/1971.
 */
import type { FlagProps } from '@/lib/country/types';

export const FLAG_VIEWBOX = '0 0 1000 700';

/**
 * Brazilian flag stars positioned in landscape coordinates (viewBox 0 0 1000 700).
 * Sphere center is (500, 350) with radius 175.
 */
const STARS = [
  // Spica (Pará) - above the white band
  { cx: 485, cy: 265, r: 4.8 },
  // Procyon (Amazonas)
  { cx: 415, cy: 375, r: 4.2 },
  // Canopus (Goiás / Tocantins)
  { cx: 450, cy: 420, r: 4.2 },
  // Sirius (Mato Grosso)
  { cx: 435, cy: 395, r: 4.5 },
  // Crux (Cruzeiro do Sul) - 5 stars
  { cx: 500, cy: 325, r: 4.5 }, // Estrela de Magalhães (alpha)
  { cx: 500, cy: 385, r: 4.5 }, // Rubídea (gamma)
  { cx: 476, cy: 350, r: 4.0 }, // Pálida (delta)
  { cx: 524, cy: 355, r: 4.5 }, // Mimosa (beta)
  { cx: 510, cy: 370, r: 3.2 }, // Intrometida (epsilon)
  // Scorpius (Northeast states)
  { cx: 545, cy: 405, r: 4.2 }, // Antares
  { cx: 565, cy: 390, r: 3.8 }, // Graffias
  { cx: 580, cy: 415, r: 3.8 },
  { cx: 570, cy: 435, r: 3.8 },
  { cx: 555, cy: 455, r: 3.8 },
  { cx: 540, cy: 470, r: 3.5 },
  { cx: 525, cy: 450, r: 3.2 },
  { cx: 535, cy: 430, r: 3.2 },
  // Triangulum Australe (South states)
  { cx: 500, cy: 475, r: 4.2 }, // Atria
  { cx: 475, cy: 500, r: 3.8 },
  { cx: 525, cy: 500, r: 3.8 },
  // Hydra
  { cx: 545, cy: 340, r: 3.8 }, // Alphard
  { cx: 560, cy: 325, r: 3.5 },
  // Sigma Octantis (Polo Sul Celeste - Distrito Federal)
  { cx: 500, cy: 512, r: 3.5 },
] as const;

export function Flag({ className, title, style }: FlagProps) {
  return (
    <svg
      viewBox={FLAG_VIEWBOX}
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {title ? <title>{title}</title> : null}
      {/* Green field (20 x 14 modules -> 1000 x 700) */}
      <rect width="1000" height="700" fill="#009C3B" rx="4" />
      {/* Yellow rhombus (losango) - vertices at 1.7 modules (85px) from each edge */}
      <polygon points="500,85 915,350 500,615 85,350" fill="#FFDF00" />
      {/* Blue celestial circle (radius 3.5 modules -> 175px) */}
      <circle cx="500" cy="350" r="175" fill="#002776" />
      {/* White upward-curving band representing the celestial equator */}
      <path
        d="M 330,378 A 245,245 0 0,1 668,300 A 253,253 0 0,0 330,378 Z"
        fill="#FFFFFF"
      />
      {/* Constellation stars in official white */}
      <g fill="#FFFFFF">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />
        ))}
      </g>
    </svg>
  );
}

export default Flag;