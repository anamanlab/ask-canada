/** Small helpers the calculations share. */
import type { Profile } from './types';

export const pos = (n: number) => Math.max(0, n);
export const r2 = (n: number) => Math.round(n * 100) / 100;
export const kidsOf = (p: Pick<Profile, 'childrenUnder6' | 'children6to17'>) => p.childrenUnder6 + p.children6to17;
