/**
 * Builds the Canadian Dental Care Plan answer (pure): the eligibility result for what the person said, the
 * plan's numbers and its official links in both languages. Used by the tool and the fixtures.
 */
import { CDCP, type Lang } from './facts';
import { checkDental, type DentalInput, type DentalOutput, type DentalView } from './dental';
import { dentalLinks, otherLang } from './links';

export function buildDental(input: DentalInput): DentalOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const view: DentalView = input.view === 'summary' ? 'summary' : 'checker';
  const clean: DentalInput = {
    ...input,
    familyIncome: input.familyIncome == null ? undefined : Math.max(0, Math.round(input.familyIncome)),
  };
  return {
    ...checkDental(clean),
    input: clean,
    view,
    lang,
    limit: CDCP.incomeLimit,
    tiers: CDCP.tiers.map((t) => ({ ...t })),
    phone: CDCP.phone,
    tty: CDCP.tty,
    benefitPeriod: CDCP.benefitPeriod,
    ...dentalLinks(lang, view),
    alt: dentalLinks(otherLang(lang), view),
  };
}
