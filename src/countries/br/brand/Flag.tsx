/**
 * Brazilian flag component: green field, yellow rhombus, blue circle with white stars and
 * "Ordem e Progresso" band. Matches official proportions (7:10) per Lei 5.700/1971.
 */
import type { FlagProps } from '@/lib/country/types';

const FLAG_VIEWBOX = '0 0 700 1000';

/**
 * The 27 stars on the flag represent the states + Federal District, positioned as they
 * appeared over Rio de Janeiro on 15 Nov 1889. Coordinates are scaled to the flag's
 * blue circle (radius 35% of height, centered at 50% width, 45% height).
 */
const STARS = [
  { x: 350, y: 150, size: 24 }, // Sigma Octantis (Polaris Australis) - Federal District
  { x: 220, y: 280, size: 18 }, // Procyon - Amazonas
  { x: 280, y: 320, size: 16 }, // Canopus - Mato Grosso
  { x: 420, y: 290, size: 18 }, // Spica - Pará
  { x: 480, y: 330, size: 16 }, // Hydra - Tocantins
  { x: 180, y: 380, size: 14 }, // Crux (Southern Cross) - 5 stars for Southeast states
  { x: 210, y: 410, size: 14 },
  { x: 240, y: 440, size: 14 },
  { x: 270, y: 410, size: 14 },
  { x: 240, y: 425, size: 12 },
  { x: 480, y: 430, size: 16 }, // Scorpius - Northeast states
  { x: 520, y: 380, size: 14 },
  { x: 560, y: 420, size: 14 },
  { x: 540, y: 460, size: 14 },
  { x: 500, y: 480, size: 14 },
  { x: 460, y: 460, size: 14 },
  { x: 470, y: 430, size: 12 },
  { x: 350, y: 500, size: 16 }, // Triangulum Australe - South states
  { x: 300, y: 540, size: 14 },
  { x: 400, y: 540, size: 14 },
  { x: 320, y: 580, size: 12 },
  { x: 380, y: 580, size: 12 },
  { x: 350, y: 600, size: 10 }, // Sigma Octantis area - smaller stars
  { x: 330, y: 620, size: 10 },
  { x: 370, y: 620, size: 10 },
  { x: 310, y: 640, size: 8 },
  { x: 390, y: 640, size: 8 },
] as const;

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spikes = 5;
  const step = (Math.PI * 2) / spikes;
  const outerR = r;
  const innerR = r * 0.45;
  let d = `M${cx} ${cy - outerR}`;
  for (let i = 0; i < spikes; i++) {
    const angle = -Math.PI / 2 + i * step;
    const nextAngle = angle + step / 2;
    const outerX = cx + Math.cos(angle) * outerR;
    const outerY = cy + Math.sin(angle) * outerR;
    const innerX = cx + Math.cos(nextAngle) * innerR;
    const innerY = cy + Math.sin(nextAngle) * innerR;
    d += ` L${outerX} ${outerY} L${innerX} ${innerY}`;
  }
  d += 'Z';
  return <path d={d} fill="white" />;
}

export function Flag({ className, title }: FlagProps) {
  return (
    <svg
      viewBox={FLAG_VIEWBOX}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {title ? <title>{title}</title> : null}
      {/* Green field */}
      <rect width="700" height="1000" fill="#009C3B" />
      {/* Yellow rhombus (losango) - vertices at midpoints of each side */}
      <polygon
        points="350,0 700,500 350,1000 0,500"
        fill="#FFDF00"
      />
      {/* Blue circle */}
      <circle cx="350" cy="450" r="350" fill="#002776" />
      {/* White band with "Ordem e Progresso" */}
      <g transform="translate(350, 450) rotate(-13)">
        <rect x="-280" y="-18" width="560" height="36" fill="white" rx="4" />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fill="#002776"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fontSize="22"
          letterSpacing="0.5"
        >
          Ordem e Progresso
        </text>
      </g>
      {/* 27 stars */}
      {STARS.map((s, i) => (
        <Star key={i} cx={s.x} cy={s.y} r={s.size} />
      ))}
    </svg>
  );
}