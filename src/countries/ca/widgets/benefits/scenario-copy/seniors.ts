/** Scripted replies for the OAS and CPP estimators: the same figures the estimators show. */
import { oasEstimate } from '../calc';
import { OAS as OAS_RATES } from '../rates';
import { oasIn } from '../situation';
import { cadIn, cite, type VarsCtx } from './shared';

export const OAS_REPLY = {
  en: `# {head}

For October to December 2026, the maximum is **$762.50 a month** from 65 to 74 and **$838.75** at 75 and older. ${cite(1, 'oasPayments', 'en')}{more}

You need at least 10 years in Canada after age 18. With fewer than 40 years, you get a partial pension: years lived in Canada ÷ 40. ${cite(2, 'oasAmount', 'en')}

Waiting pays: each month you delay after 65 adds **0.6%**, up to 36% more at 70. ${cite(3, 'oasWhen', 'en')} If your 2025 net income was over **$93,454**, the recovery tax holds back 15% of the difference from your payments until June 2027; from July 2027, it’s based on 2026 income over $95,323. ${cite(4, 'oasRecovery', 'en')}

Adjust the sliders to estimate yours.`,
  fr: `# {head}

D’octobre à décembre 2026, le maximum est de **762,50 $ par mois** de 65 à 74 ans et de **838,75 $** à 75 ans et plus. ${cite(1, 'oasPayments', 'fr')}{more}

Il faut avoir vécu au moins 10 ans au Canada après 18 ans. Avec moins de 40 ans, vous recevez une pension partielle : années vécues au Canada ÷ 40. ${cite(2, 'oasAmount', 'fr')}

Attendre est payant : chaque mois de report après 65 ans ajoute **0,6 %**, jusqu’à 36 % de plus à 70 ans. ${cite(3, 'oasWhen', 'fr')} Si votre revenu net de 2025 dépassait **93 454 $**, l’impôt de récupération retient 15 % de l’excédent sur vos versements jusqu’en juin 2027; à partir de juillet 2027, il est calculé sur le revenu de 2026 qui dépasse 95 323 $. ${cite(4, 'oasRecovery', 'fr')}

Déplacez les curseurs pour estimer votre pension.`,
};

/**
 * Their own figure when they gave years in Canada, an income or a start age: the same number the estimator opens
 * on, with the full pension at 65 kept as context in the first paragraph. A question about waiting is answered
 * with the pension at the age they named (70 when they named none).
 */
export function oasVars({ text, lang }: VarsCtx): Record<string, string> {
  const fr = lang === 'fr';
  const { yearsInCanada: y, income, age75, startAge } = oasIn(text);
  const money = cadIn(lang);
  const cad = (n: number, cents = true) => money(n, cents);
  const start = Math.min(Math.max(startAge ?? 65, 65), 70);
  const waits = start > 65;
  const years = Math.min(y ?? OAS_RATES.fullYears, OAS_RATES.fullYears);
  const o = oasEstimate({ years: y ?? OAS_RATES.fullYears, startAge: start, age75: !!age75, income: income ?? 0 });
  const pct = new Intl.NumberFormat(fr ? 'fr-CA' : 'en-CA', { style: 'percent', maximumFractionDigits: 1 }).format(o.deferral);
  // When the amount applies: from the start age, or at 75 and older (then with the wait they earned).
  const at = fr
    ? age75
      ? waits ? `à 75 ans et plus, après avoir commencé à ${start} ans` : 'à 75 ans et plus'
      : waits ? `en commençant à ${start} ans` : 'à 65 ans'
    : age75
      ? waits ? `at 75 and older, having started at ${start}` : 'at 75 and older'
      : waits ? `if you start at ${start}` : 'at 65';
  const over = income != null && o.recovery > 0;
  const yrs = fr ? `${years} ans` : `${years} years`;
  const net = income != null ? cad(income, false) : '';
  // The share of that amount that comes from waiting, said once after the figure.
  const gain = waits ? (fr ? ` La pension comprend ${pct} de plus pour avoir attendu après 65 ans. ${cite(3, 'oasWhen', 'fr')}` : ` The pension includes ${pct} more for waiting past 65. ${cite(3, 'oasWhen', 'en')}`) : '';
  let head = fr ? 'La pension complète de la Sécurité de la vieillesse est de *762,50 $ par mois* à 65 ans.' : 'The full Old Age Security pension is *$762.50 a month* at 65 right now.';
  let more = '';
  if (y != null && y < OAS_RATES.minYears) {
    // Under 10 years: the 10-year rule is the answer.
    head = fr
      ? 'Il faut avoir vécu *au moins 10 ans* au Canada après 18 ans pour recevoir la Sécurité de la vieillesse.'
      : 'You need *at least 10 years* in Canada after age 18 to get Old Age Security.';
    more = fr
      ? ` Avec ${y} ${y > 1 ? 'ans' : 'an'}, vous n’y avez pas encore droit, mais chaque année de plus compte. ${cite(2, 'oasAmount', 'fr')}`
      : ` With ${y} ${y === 1 ? 'year' : 'years'}, you don’t qualify yet, but each extra year counts. ${cite(2, 'oasAmount', 'en')}`;
  } else if (over && o.monthly <= 0) {
    head = fr
      ? `Avec un revenu net de ${net}, l’impôt de récupération *reprendrait toute la pension*.`
      : `With a net income of ${net}, the recovery tax *would take back the whole pension*.`;
  } else if (over) {
    const who = y != null ? (fr ? `Avec ${yrs} au Canada et un revenu net de ${net}` : `With ${yrs} in Canada and a net income of ${net}`) : fr ? `Avec un revenu net de ${net}` : `With a net income of ${net}`;
    head = fr ? `${who}, vous pourriez garder environ *${cad(o.monthly)} par mois* ${at}.` : `${who}, you could keep about *${cad(o.monthly)} a month* ${at}.`;
    more =
      (fr
        ? ` C’est une pension de ${cad(o.gross)} par mois, moins environ ${cad(o.recovery)} par mois d’impôt de récupération.`
        : ` That’s a pension of ${cad(o.gross)} a month, minus about ${cad(o.recovery)} a month in recovery tax.`) + gain;
  } else if (y != null && y < OAS_RATES.fullYears) {
    head = fr ? `Avec ${yrs} au Canada, vous pourriez recevoir environ *${cad(o.monthly)} par mois* ${at}.` : `With ${yrs} in Canada, you could get about *${cad(o.monthly)} a month* ${at}.`;
    more = (fr ? ` Avec ${yrs}, vous recevez ${years}/40 de la pension complète. ${cite(2, 'oasAmount', 'fr')}` : ` With ${yrs}, you get ${years}/40 of the full pension. ${cite(2, 'oasAmount', 'en')}`) + gain;
  } else if (waits && age75) {
    head = fr
      ? `À 75 ans et plus, après avoir commencé à ${start} ans, la pension complète est de *${cad(o.monthly)} par mois*.`
      : `At 75 and older, having started at ${start}, the full pension is *${cad(o.monthly)} a month*.`;
    more = gain;
  } else if (waits) {
    // The question was about waiting: lead with the pension at that age, next to the amount at 65 below.
    head = fr
      ? `En attendant à ${start} ans, la pension complète passe à *${cad(o.monthly)} par mois*, soit ${pct} de plus qu’à 65 ans.`
      : `Waiting until ${start} raises the full pension to *${cad(o.monthly)} a month*, ${pct} more than at 65.`;
    const with40 = y != null ? (fr ? ` avec ${yrs} au Canada` : ` with ${yrs} in Canada`) : '';
    more = fr
      ? ` Commencer à ${start} ans ajoute ${pct} au montant à 65 ans, soit ${cad(o.monthly)} par mois aux taux actuels${with40}. ${cite(3, 'oasWhen', 'fr')}`
      : ` Starting at ${start} adds ${pct} to the amount at 65, so ${cad(o.monthly)} a month at today’s rates${with40}. ${cite(3, 'oasWhen', 'en')}`;
  } else if (y == null && age75) {
    head = fr ? 'À 75 ans et plus, la pension complète est de *838,75 $ par mois*.' : 'At 75 and older, the full pension is *$838.75 a month*.';
  } else if (y != null) {
    head = fr ? `Avec ${yrs} au Canada, vous avez droit à la pension complète : *${cad(o.monthly)} par mois* ${at}.` : `With ${yrs} in Canada, you qualify for the full pension: *${cad(o.monthly)} a month* ${at}.`;
  }
  return { head, more };
}

export const CPP_REPLY = {
  en: `# You can start your CPP pension *any time from 60 to 70*.

Starting early lowers your payments by **0.6% a month**, up to 36% less at 60. Waiting past 65 raises them by **0.7% a month**, up to 42% more at 70. ${cite(1, 'cppWhen', 'en')}

Your amount depends on how much and how long you contributed. The average new pension at 65 was **$858.34 a month** in July 2026; the maximum is **$1,507.65**. ${cite(2, 'cppAmount', 'en')}

Base your choice on your health, your finances and your plans for retirement. ${cite(1, 'cppWhen', 'en')} Try different start ages below. For your own number, My Service Canada Account shows your estimate.`,
  fr: `# Vous pouvez commencer votre pension du RPC *à tout moment entre 60 et 70 ans*.

Commencer tôt réduit vos versements de **0,6 % par mois**, jusqu’à 36 % de moins à 60 ans. Attendre après 65 ans les augmente de **0,7 % par mois**, jusqu’à 42 % de plus à 70 ans. ${cite(1, 'cppWhen', 'fr')}

Votre montant dépend de vos cotisations et de leur durée. La pension moyenne des nouveaux bénéficiaires à 65 ans était de **858,34 $ par mois** en juillet 2026; le maximum est de **1 507,65 $**. ${cite(2, 'cppAmount', 'fr')}

Faites votre choix selon votre santé, votre situation financière et vos projets de retraite. ${cite(1, 'cppWhen', 'fr')} Essayez différents âges ci-dessous. Pour votre propre montant, Mon dossier Service Canada affiche votre estimation.`,
};
