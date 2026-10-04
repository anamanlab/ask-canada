/**
 * Official Brazilian flag component (Bandeira Nacional do Brasil).
 * Conforms to legal proportions (14:20 landscape) per Lei 5.700/1971 and Lei 8.421/1992.
 * Includes all 27 five-pointed stars representing the 26 states + Federal District,
 * and the official national motto "ORDEM E PROGRESSO".
 */
import { useId } from 'react';
import type { FlagProps } from '@/lib/country/types';

export const FLAG_VIEWBOX = '-2100 -1470 4200 2940';

export function Flag({ className, title, style }: FlagProps) {
  const rawId = useId().replace(/:/g, '');
  const clipId = `br-flag-clip-${rawId}`;
  const gClipId = `br-flag-gclip-${rawId}`;
  const defP = `br-flag-P-${rawId}`;
  const defO = `br-flag-O-${rawId}`;
  const defR = `br-flag-R-${rawId}`;
  const defD = `br-flag-D-${rawId}`;
  const defE = `br-flag-E-${rawId}`;
  const defM = `br-flag-M-${rawId}`;
  const defe = `br-flag-e-${rawId}`;
  const defG = `br-flag-G-${rawId}`;
  const defS = `br-flag-S-${rawId}`;
  const defStarA = `br-flag-star-a-${rawId}`;
  const defStarB = `br-flag-star-b-${rawId}`;
  const defStarF = `br-flag-star-f-${rawId}`;
  const defStarH = `br-flag-star-h-${rawId}`;
  const defStarI = `br-flag-star-i-${rawId}`;

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
      <defs>
        <g id={defG}>
          <clipPath id={gClipId}><path d="m-31.5 0v-70h63v70zm31.5-47v12h31.5v-12z"/></clipPath>
          <use clipPath={`url(#${gClipId})`} href={`#${defO}`}/>
          <path d="M5-35H31.5V-25H5z"/>
          <path d="m21.5-35h10v35h-10z"/>
        </g>
        <g id={defR}>
          <use href={`#${defP}`}/>
          <path d="m28 0c0-10 0-32-15-32h-19c22 0 22 22 22 32"/>
        </g>
        <g id={`br-s-${rawId}`} fill="#fff">
          <g id={`br-c-${rawId}`}>
            <path id={`br-t-${rawId}`} transform="rotate(18,0,-1)" d="m0-1v1h0.5"/>
            <use transform="scale(-1,1)" href={`#br-t-${rawId}`}/>
          </g>
          <use transform="rotate(72)" href={`#br-c-${rawId}`}/>
          <use transform="rotate(-72)" href={`#br-c-${rawId}`}/>
          <use transform="rotate(144)" href={`#br-c-${rawId}`}/>
          <use transform="rotate(216)" href={`#br-c-${rawId}`}/>
        </g>
        <g id={defStarA}><use transform="scale(31.5)" href={`#br-s-${rawId}`}/></g>
        <g id={defStarB}><use transform="scale(26.25)" href={`#br-s-${rawId}`}/></g>
        <g id={defStarF}><use transform="scale(21)" href={`#br-s-${rawId}`}/></g>
        <g id={defStarH}><use transform="scale(15)" href={`#br-s-${rawId}`}/></g>
        <g id={defStarI}><use transform="scale(10.5)" href={`#br-s-${rawId}`}/></g>
        <path id={defD} d="m-31.5 0h33a30 30 0 0 0 30-30v-10a30 30 0 0 0-30-30h-33zm13-13h19a19 19 0 0 0 19-19v-6a19 19 0 0 0-19-19h-19z" fillRule="evenodd"/>
        <path id={defE} transform="translate(-31.5)" d="m0 0h63v-13h-51v-18h40v-12h-40v-14h48v-13h-60z"/>
        <path id={defe} d="m-26.25 0h52.5v-12h-40.5v-16h33v-12h-33v-11h39.25v-12h-51.25z"/>
        <path id={defM} d="m-31.5 0h12v-48l14 48h11l14-48v48h12v-70h-17.5l-14 48-14-48h-17.5z"/>
        <path id={defO} d="m0 0a31.5 35 0 0 0 0-70 31.5 35 0 0 0 0 70m0-13a18.5 22 0 0 0 0-44 18.5 22 0 0 0 0 44" fillRule="evenodd"/>
        <path id={defP} d="m-31.5 0h13v-26h28a22 22 0 0 0 0-44h-40zm13-39h27a9 9 0 0 0 0-18h-27z" fillRule="evenodd"/>
        <path id={defS} d="m-15.75-22c0 7 6.75 10.5 16.75 10.5s14.74-3.25 14.75-7.75c0-14.25-46.75-5.25-46.5-30.25 0.25-21.5 24.75-20.5 33.75-20.5s26 4 25.75 21.25h-15.25c0-7.5-7-10.25-15-10.25-7.75 0-13.25 1.25-13.25 8.5-0.25 11.75 46.25 4 46.25 28.75 0 18.25-18 21.75-31.5 21.75-11.5 0-31.55-4.5-31.5-22z"/>
        <clipPath id={clipId}><circle r="735"/></clipPath>
      </defs>
      {/* Green field (20 x 14 modules -> 4200 x 2940) */}
      <rect x="-2100" y="-1470" width="4200" height="2940" fill="#009C3B" rx="16" />
      {/* Yellow rhombus (losango) */}
      <polygon points="-1743,0 0,1113 1743,0 0,-1113" fill="#FFDF00" />
      {/* Blue celestial globe */}
      <circle r="735" fill="#002776" />
      {/* White upward-curving band representing the celestial equator */}
      <path d="m-2205 1470a1785 1785 0 0 1 3570 0h-105a1680 1680 0 1 0-3360 0z" clipPath={`url(#${clipId})`} fill="#FFFFFF" />
      {/* Official motto: ORDEM E PROGRESSO in official green letters */}
      <g transform="translate(-420,1470)" fill="#009C3B">
        <use transform="rotate(-7)" y="-1697.5" href={`#${defO}`}/>
        <use transform="rotate(-4)" y="-1697.5" href={`#${defR}`}/>
        <use transform="rotate(-1)" y="-1697.5" href={`#${defD}`}/>
        <use transform="rotate(2)" y="-1697.5" href={`#${defE}`}/>
        <use transform="rotate(5)" y="-1697.5" href={`#${defM}`}/>
        <use transform="rotate(9.75)" y="-1697.5" href={`#${defe}`}/>
        <use transform="rotate(14.5)" y="-1697.5" href={`#${defP}`}/>
        <use transform="rotate(17.5)" y="-1697.5" href={`#${defR}`}/>
        <use transform="rotate(20.5)" y="-1697.5" href={`#${defO}`}/>
        <use transform="rotate(23.5)" y="-1697.5" href={`#${defG}`}/>
        <use transform="rotate(26.5)" y="-1697.5" href={`#${defR}`}/>
        <use transform="rotate(29.5)" y="-1697.5" href={`#${defE}`}/>
        <use transform="rotate(32.5)" y="-1697.5" href={`#${defS}`}/>
        <use transform="rotate(35.5)" y="-1697.5" href={`#${defS}`}/>
        <use transform="rotate(38.5)" y="-1697.5" href={`#${defO}`}/>
      </g>
      {/* The 27 official 5-pointed constellation stars in celestial coordinates */}
      <use x="-600" y="-132" href={`#${defStarA}`}/>
      <use x="-535" y="177" href={`#${defStarA}`}/>
      <use x="-625" y="243" href={`#${defStarB}`}/>
      <use x="-463" y="132" href={`#${defStarH}`}/>
      <use x="-382" y="250" href={`#${defStarB}`}/>
      <use x="-404" y="323" href={`#${defStarF}`}/>
      <use x="228" y="-228" href={`#${defStarA}`}/>
      <use x="515" y="258" href={`#${defStarA}`}/>
      <use x="617" y="265" href={`#${defStarF}`}/>
      <use x="545" y="323" href={`#${defStarB}`}/>
      <use x="368" y="477" href={`#${defStarB}`}/>
      <use x="367" y="551" href={`#${defStarF}`}/>
      <use x="441" y="419" href={`#${defStarF}`}/>
      <use x="500" y="382" href={`#${defStarB}`}/>
      <use x="365" y="405" href={`#${defStarF}`}/>
      <use x="-280" y="30" href={`#${defStarB}`}/>
      <use x="200" y="-37" href={`#${defStarF}`}/>
      <use y="330" href={`#${defStarA}`}/>
      <use x="85" y="184" href={`#${defStarB}`}/>
      <use y="118" href={`#${defStarB}`}/>
      <use x="-74" y="184" href={`#${defStarF}`}/>
      <use x="-37" y="235" href={`#${defStarH}`}/>
      <use x="220" y="495" href={`#${defStarB}`}/>
      <use x="283" y="430" href={`#${defStarF}`}/>
      <use x="162" y="412" href={`#${defStarF}`}/>
      <use x="-295" y="390" href={`#${defStarA}`}/>
      <use y="575" href={`#${defStarI}`}/>
    </svg>
  );
}

export default Flag;