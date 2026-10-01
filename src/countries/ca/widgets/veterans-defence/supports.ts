/**
 * Mental health supports for Veterans, serving members, RCMP and families: pure, isomorphic.
 * Numbers and hours from the official pages in data.ts (checked 2026-10-01).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { UrlKey } from './data';
import { PHONES, type Lang } from './facts';

export const AUDIENCES = ['veteran', 'serving', 'family', 'rcmp'] as const;
export type Audience = (typeof AUDIENCES)[number];

export type SupportKind = 'now' | 'peer' | 'care' | 'family';
export type Support = {
  id: string;
  kind: SupportKind;
  who: Audience[];
  url: UrlKey;
  phone?: string;
  tty?: string;
  /** '24/7' lines answer any time; 'weekdays' lines have office hours (shown on the row). */
  hours?: '24/7' | 'weekdays' | 'transition-group';
};

/** Building the tool output (links, sources): supports-build.ts. */
export const SUPPORTS: Support[] = [
  // For rcmp: former members only (veterans.gc.ca). The card says so and points serving members to their own program.
  { id: 'assistance', kind: 'now', who: ['veteran', 'family', 'rcmp'], url: 'assistance', phone: PHONES.assistance, tty: PHONES.assistanceTty, hours: '24/7' },
  { id: 'memberAssistance', kind: 'now', who: ['serving'], url: 'memberAssistance', phone: PHONES.assistance, tty: PHONES.assistanceTty, hours: '24/7' },
  { id: 'cafClinic', kind: 'care', who: ['serving'], url: 'cafMentalHealth' },
  { id: 'familyLine', kind: 'family', who: ['family', 'serving', 'veteran'], url: 'vfp', phone: PHONES.familyLine, hours: '24/7' },
  { id: 'osiss', kind: 'peer', who: ['veteran', 'serving', 'family'], url: 'osiss', phone: PHONES.transitionGroup, hours: 'transition-group' },
  { id: 'sosi', kind: 'peer', who: ['rcmp'], url: 'peerSupport' },
  // Not for serving members: their route to care is the CAF medical centre (the OSI page describes the VAC referral only).
  { id: 'osiClinics', kind: 'care', who: ['veteran', 'family', 'rcmp'], url: 'osiClinics', phone: PHONES.vac, hours: 'weekdays' },
  { id: 'mentalHealthBenefits', kind: 'care', who: ['veteran'], url: 'mentalHealthBenefits' },
  { id: 'vfp', kind: 'family', who: ['family', 'veteran'], url: 'vfp' },
];

export const supportsFor = (who: Audience) => SUPPORTS.filter((s) => s.who.includes(who));

export type SupportsInput = { audience?: Audience; lang?: Lang };
/** Everything in the output that depends on the language. */
export type SupportsRefs = { lang: Lang; urls: Record<string, string>; links: { crisis: string; vacContact: string }; sources: ToolSource[] };
export type SupportsOutput = SupportsRefs & {
  audience: Audience;
  phones: typeof PHONES;
  /** The same links and sources in the other official language (see `inLanguage`). */
  alt?: SupportsRefs;
};
