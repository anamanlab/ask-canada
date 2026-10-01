'use client';
/**
 * Renderers for the `civic` widget (democracy & civic life): { [toolName]: Component }.
 * See docs/WIDGET_GUIDE.md. Tools: src/countries/ca/tools/civic.ts. Facts: ./data.ts.
 */
import type { Renderers } from '@/lib/widgets/types';
import { CivicFindMp } from './FindMp';
import { CivicNews } from './News';
import { CivicParliament } from './Parliament';
import { CivicVoterCheck } from './VoterCheck';

export const renderers: Renderers = {
  civicFindMp: CivicFindMp,
  civicVoterCheck: CivicVoterCheck,
  civicParliament: CivicParliament,
  civicNews: CivicNews,
};
export default renderers;
