/** Scripted replies for the child benefit and EI estimators: the same figures the estimators show. */
import { ccbAnnual, childDisabilityAnnual, eiEstimate } from '../calc';
import { incomeIn, situationIn } from '../situation';
import { cadIn, cite, longDate, nextPay, type VarsCtx } from './shared';

export const CCB_REPLY = {
  en: `# {head}
{mine}
{def}From July 2026 to June 2027, the maximum is **$8,157 a year** for each child under 6 and **$6,883** for each child aged 6 to 17. ${cite(1, 'ccbAmount', 'en')}

It starts to go down once your adjusted family net income is over **$38,237**, based on your 2025 tax return. ${cite(1, 'ccbAmount', 'en')}

You’re eligible if you live with the child, are mainly responsible for their care, and are a resident of Canada for tax purposes, and you or your spouse or partner is a citizen, permanent resident, protected person, eligible temporary resident, or registered under the Indian Act. ${cite(2, 'ccbWho', 'en')}
{next}
{outro}`,
  fr: `# {head}
{mine}
{def}De juillet 2026 à juin 2027, le maximum est de **8 157 $ par année** pour chaque enfant de moins de 6 ans et de **6 883 $** pour chaque enfant de 6 à 17 ans. ${cite(1, 'ccbAmount', 'fr')}

Le montant diminue quand votre revenu familial net rajusté dépasse **38 237 $**, selon votre déclaration de 2025. ${cite(1, 'ccbAmount', 'fr')}

Vous y êtes admissible si vous vivez avec l’enfant, êtes le principal responsable de ses soins et êtes résident du Canada aux fins de l’impôt, et si vous ou votre époux ou conjoint êtes citoyen, résident permanent, personne protégée, résident temporaire admissible ou inscrit en vertu de la Loi sur les Indiens. ${cite(2, 'ccbWho', 'fr')}
{next}
{outro}`,
};

export function ccbVars({ text, lang }: VarsCtx): Record<string, string> {
  const d = nextPay('ccb');
  const fr = lang === 'fr';
  const s = situationIn(text);
  const u6 = s.childrenUnder6 ?? 0;
  const o6 = s.children6to17 ?? 0;
  // Their own figure when they gave an income and the children's ages: the same number the estimator shows.
  let head = fr ? 'Vous pourriez recevoir jusqu’à *8 157 $ par année* pour chaque enfant de moins de 6 ans.' : 'You could get up to *$8,157 a year* for each child under 6.';
  let mine = '';
  if (s.income != null && u6 + o6 > 0) {
    const dis = Math.min(s.childDisability ?? 0, u6 + o6);
    const annual = ccbAnnual(s.income, u6, o6) + childDisabilityAnnual(s.income, dis);
    const cad = cadIn(lang);
    const kidsFr = [u6 ? `${u6} enfant${u6 > 1 ? 's' : ''} de moins de 6 ans` : '', o6 ? `${o6} enfant${o6 > 1 ? 's' : ''} de 6 à 17 ans` : ''].filter(Boolean).join(' et ');
    const kidsEn = [u6 ? `${u6} ${u6 > 1 ? 'children' : 'child'} under 6` : '', o6 ? `${o6} ${o6 > 1 ? 'children' : 'child'} aged 6 to 17` : ''].filter(Boolean).join(' and ');
    head = fr ? `Vous pourriez recevoir environ *${cad(annual)} par année* (${cad(annual / 12)} par mois).` : `You could get about *${cad(annual)} a year* (${cad(annual / 12)} a month).`;
    mine = fr
      ? `\nC’est l’estimation pour ${kidsFr}, avec un revenu familial net de **${cad(s.income)}**${dis ? ', y compris la prestation pour enfants handicapés' : ''}. Elle est non imposable et versée chaque mois. ${cite(1, 'ccbAmount', 'fr')}\n`
      : `\nThat’s the estimate for ${kidsEn}, with a family net income of **${cad(s.income)}**${dis ? ', including the child disability benefit' : ''}. It’s tax-free and paid monthly. ${cite(1, 'ccbAmount', 'en')}\n`;
  }
  // A count without ages: the range between all of them at the 6-to-17 rate and all under 6. The estimator asks.
  const count = s.children ?? 0;
  let range = false;
  if (s.income != null && u6 + o6 === 0 && count > 0) {
    const cad = cadIn(lang);
    const low = ccbAnnual(s.income, 0, count);
    const high = ccbAnnual(s.income, count, 0);
    range = true;
    head = fr
      ? `Vous pourriez recevoir environ *${cad(low)} à ${cad(high)} par année*, selon l’âge de vos enfants.`
      : `You could get about *${cad(low)} to ${cad(high)} a year*, depending on your children’s ages.`;
    mine = fr
      ? `\nC’est l’estimation pour ${count} enfant${count > 1 ? 's' : ''}, avec un revenu familial net de **${cad(s.income)}** : le montant le plus bas s’ils ont tous de 6 à 17 ans, le plus élevé s’ils ont tous moins de 6 ans. Elle est non imposable et versée chaque mois. ${cite(1, 'ccbAmount', 'fr')}\n`
      : `\nThat’s the estimate for ${count} ${count > 1 ? 'children' : 'child'}, with a family net income of **${cad(s.income)}**: the lower amount if they’re all 6 to 17, the higher if they’re all under 6. It’s tax-free and paid monthly. ${cite(1, 'ccbAmount', 'en')}\n`;
  }
  const outro = range
    ? fr
      ? 'Indiquez ci-dessous combien ont moins de 6 ans pour voir votre montant.'
      : 'Say how many are under 6 below to see your amount.'
    : mine
    ? fr
      ? 'Déplacez les curseurs pour voir ce qui changerait avec un autre revenu ou d’autres enfants.'
      : 'Move the sliders to see how a different income or family changes it.'
    : fr
      ? 'Déplacez les curseurs pour voir l’estimation pour votre famille.'
      : 'Move the sliders to see your family’s estimate.';
  // With their own figure above (tax-free, paid monthly), the second paragraph goes straight to the rates.
  const def = mine
    ? ''
    : fr
      ? 'L’Allocation canadienne pour enfants est un paiement mensuel non imposable pour les familles qui élèvent des enfants de moins de 18 ans. '
      : 'The Canada child benefit is a tax-free monthly payment for families raising children under 18. ';
  return {
    head,
    mine,
    def,
    outro,
    next: d
      ? lang === 'fr'
        ? `\nLe prochain versement est prévu le **${longDate(d, 'fr')}**. ${cite(3, 'calendar', 'fr')}\n`
        : `\nThe next payment is on **${longDate(d, 'en')}**. ${cite(3, 'calendar', 'en')}\n`
      : '',
  };
}

export const EI_REPLY = {
  en: `# {head}
{mine}
For most people, EI regular benefits are 55% of average insurable weekly earnings. In 2026, earnings up to **$68,900 a year** count, so the most you can get is **$729 a week**. Benefits are taxable. ${cite(1, 'eiAmount', 'en')}

They last **14 to 45 weeks**, depending on your region’s unemployment rate and how many insured hours you worked. ${cite(1, 'eiAmount', 'en')} ${cite(2, 'eiElig', 'en')}

Don’t wait for an exact number: **apply right away**, even before you have your record of employment. If you apply more than 4 weeks after your last day of work, you may lose benefits. ${cite(3, 'eiApply', 'en')}

Type or slide to your own earnings (not your family’s income) for an estimate. Service Canada’s own estimator adds your region and hours.`,
  fr: `# {head}
{mine}
Pour la plupart des gens, les prestations régulières correspondent à 55 % de la rémunération hebdomadaire moyenne assurable. En 2026, la rémunération compte jusqu’à **68 900 $ par année**, pour un maximum de **729 $ par semaine**. Les prestations sont imposables. ${cite(1, 'eiAmount', 'fr')}

Elles durent de **14 à 45 semaines**, selon le taux de chômage de votre région et vos heures assurables. ${cite(1, 'eiAmount', 'fr')} ${cite(2, 'eiElig', 'fr')}

N’attendez pas d’avoir un montant exact : **présentez votre demande tout de suite**, même avant d’avoir votre relevé d’emploi. Si vous présentez une demande plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations. ${cite(3, 'eiApply', 'fr')}

Entrez votre propre rémunération (et non le revenu de votre famille) ou déplacez le curseur pour une estimation. L’estimateur de Service Canada tient compte de votre région et de vos heures.`,
};

/** Their own figure when they gave earnings: the same weekly amount and total the estimator shows. */
export function eiVars({ text, lang }: VarsCtx): Record<string, string> {
  const fr = lang === 'fr';
  const earnings = incomeIn(text);
  if (earnings == null || earnings > 1_000_000) {
    return {
      head: fr ? 'L’assurance-emploi verse jusqu’à *55 % de votre rémunération*, jusqu’à 729 $ par semaine.' : 'EI pays up to *55% of your earnings*, to a maximum of $729 a week.',
      mine: '',
    };
  }
  const e = eiEstimate(earnings);
  const cad = cadIn(lang);
  const head = e.capped
    ? fr
      ? `Vous pourriez recevoir le maximum : *${cad(e.weekly)} par semaine*.`
      : `You could get the maximum: *${cad(e.weekly)} a week*.`
    : fr
      ? `Vous pourriez recevoir environ *${cad(e.weekly)} par semaine*.`
      : `You could get about *${cad(e.weekly)} a week*.`;
  const mine = fr
    ? `\nAvec une rémunération de ${cad(earnings)} par année, cela ferait de **${cad(e.minTotal)} à ${cad(e.maxTotal)}** avant impôt au total, selon la durée des prestations. ${cite(1, 'eiAmount', 'fr')}\n`
    : `\nOn earnings of ${cad(earnings)} a year, that’s **${cad(e.minTotal)} to ${cad(e.maxTotal)}** in total before tax, depending on how long benefits last. ${cite(1, 'eiAmount', 'en')}\n`;
  return { head, mine };
}
