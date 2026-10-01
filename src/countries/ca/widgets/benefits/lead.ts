/** Short footer names for the source a widget leads with (server and browser: plain data). */
import type { Lang, SourceKey } from './data';

/**
 * Short names for the page a widget's source footer leads with. The footer shows one line: on a small phone about 14
 * characters fit after "canada.ca ›", and the longest French titles don't fit on a desktop either. `short` is for
 * phones; `brief` (when the official title runs past the footer on wide screens) is for desktops. The answer's
 * own Sources list always shows the full official title.
 */
const LEAD: Partial<Record<SourceKey, { short: { en: string; fr: string }; brief?: { en?: string; fr?: string } }>> = {
  eiAmount: { short: { en: 'EI amounts', fr: 'AE : montants' } },
  ccbAmount: { short: { en: 'CCB amounts', fr: 'ACE : montants' } },
  childDisability: { short: { en: 'CDB (children)', fr: 'PEH : enfants' } },
  cgeb: { short: { en: 'CGEB', fr: 'ACEBE' } },
  cwbAmount: { short: { en: 'CWB amounts', fr: 'ACT : montants' }, brief: { fr: 'Allocation canadienne pour les travailleurs : montant' } },
  dentalQualify: { short: { en: 'Dental plan', fr: 'RCSD' } },
  cdbAmount: { short: { en: 'CDB amounts', fr: 'PCPH : montant' }, brief: { fr: 'Prestation pour les personnes handicapées : montant' } },
  oasPayments: { short: { en: 'OAS amounts', fr: 'SV : montants' } },
  cppAmount: { short: { en: 'CPP amounts', fr: 'RPC : montants' } },
  student: { short: { en: 'Student grants', fr: 'Bourses' } },
};

/** The footer names for a widget's leading source (see LEAD). */
export type LeadTitle = { short: string; brief?: string };
export function leadTitle(key: SourceKey, lang: Lang): LeadTitle | undefined {
  const l = LEAD[key];
  return l ? { short: l.short[lang], ...(l.brief?.[lang] ? { brief: l.brief[lang] } : {}) } : undefined;
}
