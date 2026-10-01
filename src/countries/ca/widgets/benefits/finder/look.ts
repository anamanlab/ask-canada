/** How each program looks in the finder (icon, tile tint, bar colour), and the types its parts share. */
import type { LucideIcon } from 'lucide-react';
import { Accessibility, Baby, Briefcase, GraduationCap, HandCoins, HeartHandshake, Landmark, LifeBuoy, PiggyBank, ShoppingBasket, Smile } from 'lucide-react';
import type { findBenefits, ProgramId } from '../calc';

export const PROGRAM_LOOK: Record<ProgramId, { icon: LucideIcon; tile: string; bar: string }> = {
  ccb: { icon: Baby, tile: 'bg-pine-wash text-pine', bar: 'bg-pine' },
  childDisability: { icon: HeartHandshake, tile: 'bg-pine-wash text-pine', bar: 'bg-aurora-rose' },
  cgeb: { icon: ShoppingBasket, tile: 'bg-glacier-wash text-glacier', bar: 'bg-glacier' },
  cwb: { icon: Briefcase, tile: 'bg-amber-wash text-amber', bar: 'bg-amber' },
  cdcp: { icon: Smile, tile: 'bg-glacier-wash text-glacier', bar: 'bg-glacier' },
  cdb: { icon: Accessibility, tile: 'bg-maple-wash text-maple-ink', bar: 'bg-aurora-violet' },
  ei: { icon: LifeBuoy, tile: 'bg-glacier-wash text-glacier', bar: 'bg-glacier' },
  student: { icon: GraduationCap, tile: 'bg-glacier-wash text-glacier', bar: 'bg-glacier' },
  oas: { icon: Landmark, tile: 'bg-glacier-wash text-glacier', bar: 'bg-aurora-violet' },
  gis: { icon: HandCoins, tile: 'bg-amber-wash text-amber', bar: 'bg-aurora-rose' },
  cpp: { icon: PiggyBank, tile: 'bg-pine-wash text-pine', bar: 'bg-aurora-green' },
};

/** Which answers came from the person. The rest are assumptions, shown as such and never as their numbers. */
export type Known = { household: boolean; age: boolean; kids: boolean; income: boolean; work: boolean };

export type Result = ReturnType<typeof findBenefits>;
