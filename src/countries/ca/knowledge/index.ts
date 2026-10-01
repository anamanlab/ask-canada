/**
 * Canada pack grounding knowledge, from the Canadian Digital Service's AI Answers project
 * (vendor/cds-ai-answers, MIT; © Lisa Fast and © His Majesty the King in Right of Canada as represented by ESDC).
 *
 * - SAFETY_GUIDANCE: neutrality, bias and manipulation-resistance rules, appended to the system prompt.
 * - DEPARTMENTS / loadGuidance(): expert-curated, per-department canada.ca answer guidance, served to the
 *   model on demand by the `officialGuidance` tool (see tools/index.ts). Kept verbatim in vendor/.
 */
import 'server-only';
import { SAFETY_INSTRUCTIONS } from '../../../../vendor/cds-ai-answers/safety.js';
import { SCENARIO_ALIASES } from '../../../../vendor/cds-ai-answers/scenarios/scenario-aliases.js';

export const SAFETY_GUIDANCE: string = SAFETY_INSTRUCTIONS;

type Dept = { name: string; load: () => Promise<string> };

export const DEPARTMENTS: Record<string, Dept> = {
  'aafc-aac': { name: 'Agriculture and Agri-Food Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-aafc-aac/aafc-aac-scenarios.js')).AAFC_AAC_SCENARIOS as string },
  'bac-lac': { name: 'Library and Archives Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-bac-lac/bac-lac-scenarios.js')).BAC_LAC_SCENARIOS as string },
  'cbsa-asfc': { name: 'Canada Border Services Agency', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-cbsa-asfc/cbsa-asfc-scenarios.js')).CBSA_ASFC_SCENARIOS as string },
  'cds-snc': { name: 'Canadian Digital Service', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-cds-snc/cds-snc-scenarios.js')).CDS_SNC_SCENARIOS as string },
  'ceo-bec': { name: 'Elections Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-ceo-bec/ceo-bec-scenarios.js')).CEO_BEC_SCENARIOS as string },
  'cra-arc': { name: 'Canada Revenue Agency', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-cra-arc/cra-arc-scenarios.js')).CRA_ARC_SCENARIOS as string },
  'dnd-mdn': { name: 'National Defence and the Canadian Armed Forces', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-dnd-mdn/dnd-mdn-scenarios.js')).DND_MDN_SCENARIOS as string },
  'eccc': { name: 'Environment and Climate Change Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-eccc/eccc-scenarios.js')).ECCC_SCENARIOS as string },
  'edsc-esdc': { name: 'Employment and Social Development Canada / Service Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-edsc-esdc/edsc-esdc-scenarios.js')).EDSC_ESDC_SCENARIOS as string },
  'feddev-ontario': { name: 'FedDev Ontario', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-feddev-ontario/feddev-ontario-scenarios.js')).FEDDEV_ONTARIO_SCENARIOS as string },
  'fednor': { name: 'FedNor', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-fednor/fednor-scenarios.js')).FEDNOR_SCENARIOS as string },
  'fin': { name: 'Finance Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-fin/fin-scenarios.js')).FIN_SCENARIOS as string },
  'hc-sc': { name: 'Health Canada and the Public Health Agency of Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-hc-sc/hc-sc-scenarios.js')).HC_SC_SCENARIOS as string },
  'ircc': { name: 'Immigration, Refugees and Citizenship Canada (incl. passports)', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-ircc/ircc-scenarios.js')).IRCC_SCENARIOS as string },
  'ised-isde': { name: 'Innovation, Science and Economic Development Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-ised-isde/ised-isde-scenarios.js')).ISED_ISDE_SCENARIOS as string },
  'jus': { name: 'Justice Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-jus/jus-scenarios.js')).JUS_SCENARIOS as string },
  'nrcan-rncan': { name: 'Natural Resources Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-nrcan-rncan/nrcan-rncan-scenarios.js')).NRCAN_RNCAN_SCENARIOS as string },
  'pacifican': { name: 'PacifiCan', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-pacifican/pacifican-scenarios.js')).PACIFICAN_SCENARIOS as string },
  'prairiescan': { name: 'PrairiesCan', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-prairiescan/prairiescan-scenarios.js')).PRAIRIESCAN_SCENARIOS as string },
  'sac-isc': { name: 'Indigenous Services Canada / Crown-Indigenous Relations', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-sac-isc/sac-isc-scenarios.js')).SAC_ISC_SCENARIOS as string },
  'statcan': { name: 'Statistics Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-statcan/statcan-scenarios.js')).STATCAN_SCENARIOS as string },
  'tbs-sct': { name: 'Treasury Board of Canada Secretariat', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-tbs-sct/tbs-sct-scenarios.js')).TBS_SCT_SCENARIOS as string },
  'tc': { name: 'Transport Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-tc/tc-scenarios.js')).TC_SCENARIOS as string },
  'vac-acc': { name: 'Veterans Affairs Canada', load: async () => (await import('../../../../vendor/cds-ai-answers/scenarios/context-vac-acc/vac-acc-scenarios.js')).VAC_ACC_SCENARIOS as string },
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS) as [string, ...string[]];

/** Resolve aliases (e.g. PHAC-ASPC -> hc-sc) and load the department's guidance text. */
export async function loadGuidance(key: string): Promise<{ key: string; name: string; guidance: string } | null> {
  const upper = key.toUpperCase();
  const resolved = ((SCENARIO_ALIASES as Record<string, string>)[upper] ?? upper).toLowerCase();
  const dept = DEPARTMENTS[resolved];
  if (!dept) return null;
  try {
    return { key: resolved, name: dept.name, guidance: await dept.load() };
  } catch {
    return null;
  }
}
