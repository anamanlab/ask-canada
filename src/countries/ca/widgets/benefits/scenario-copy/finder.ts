/**
 * The scripted finder answer. The body follows the situation: the paragraph after the lead is about the program
 * the widget shows as the biggest for them (EI, the child benefit, OAS/GIS or the disability benefit), so the
 * text and the widget agree.
 */
import { buildFinder, type FinderInput } from '../build';
import { ccbAnnual } from '../calc';
import { CCB as CCB_RATES, CDB, OAS as OAS_RATES, type Lang, type SourceKey } from '../data';
import { situationIn } from '../situation';
import { cadIn, cite, type VarsCtx } from './shared';

export const FINDER_REPLY = { en: `# {head}\n\n{body}`, fr: `# {head}\n\n{body}` };

/**
 * The seniors' paragraph, from the same matches the widget shows: the GIS only when the finder estimates one for
 * them, the recovery tax when it lowers (or takes back) their pension, and just the pension in between. Without an
 * income, the maximums.
 */
function seniorParagraph(p: FinderInput, lang: Lang, c: (key: SourceKey) => string): string {
  const fr = lang === 'fr';
  const cad = cadIn(lang);
  const couple = p.household === 'couple';
  const over75 = p.age === '75-plus';
  const max = cad(over75 ? OAS_RATES.monthly75 : OAS_RATES.monthly65, true);
  const ages = fr ? (over75 ? 'à 75 ans et plus' : 'de 65 à 74 ans') : over75 ? 'at 75 and older' : 'from 65 to 74';
  const pension = fr
    ? `D’octobre à décembre 2026, la **pension de la Sécurité de la vieillesse** peut atteindre **${max} par mois** ${ages}.`
    : `From October to December 2026, the **Old Age Security pension** is up to **${max} a month** ${ages}.`;
  const gisMax = cad(couple ? OAS_RATES.gis.spouseOas.max : OAS_RATES.gis.single.max, true);
  const gisWho = fr ? (couple ? 'chacun si vous recevez tous les deux la pension' : 'pour une personne seule') : couple ? 'each if you both get the pension' : 'if you’re single';
  if (p.income == null) {
    return fr
      ? `${pension} Avec un faible revenu, le **Supplément de revenu garanti** peut ajouter jusqu’à **${gisMax} par mois** ${gisWho}. ${c('oasPayments')}`
      : `${pension} On a low income, the **Guaranteed Income Supplement** can add up to **${gisMax} a month** ${gisWho}. ${c('oasPayments')}`;
  }
  // Matches don't depend on the date or the payment calendar.
  const { matches } = buildFinder(p, lang, '', { next: {}, live: false });
  const oas = matches.find((m) => m.id === 'oas');
  const gis = matches.find((m) => m.id === 'gis');
  const threshold = cad(OAS_RATES.recovery.threshold);
  const whose = couple ? (fr ? ' (nous avons supposé la moitié du revenu familial pour chacun)' : ' (we assumed half the family income each)') : '';
  if (gis?.annual) {
    const amount = cad(gis.annual / 12);
    return fr
      ? `${pension} À votre revenu, le **Supplément de revenu garanti** pourrait ajouter environ **${amount} par mois**, non imposables; le maximum est de ${gisMax} ${gisWho}. ${c('oasPayments')}`
      : `${pension} At your income, the **Guaranteed Income Supplement** could add about **${amount} a month**, tax-free; the most is ${gisMax} ${gisWho}. ${c('oasPayments')}`;
  }
  if (oas?.status === 'no' && oas.reason === 'income') {
    return fr
      ? `${pension} ${c('oasPayments')} À votre revenu, l’**impôt de récupération** reprendrait toute la pension : il retient 15 % du revenu net de 2025 qui dépasse ${threshold} sur les versements jusqu’en juin 2027${whose}. ${c('oasRecovery')}`
      : `${pension} ${c('oasPayments')} At your income, the **recovery tax** would take back the whole pension: it holds back 15% of 2025 net income over ${threshold} from payments until June 2027${whose}. ${c('oasRecovery')}`;
  }
  if (oas?.annual && oas.reason === 'recovery') {
    const keep = cad(oas.annual / 12);
    return fr
      ? `${pension} ${c('oasPayments')} À votre revenu, l’**impôt de récupération** la réduit : il retient 15 % du revenu net de 2025 qui dépasse ${threshold} sur les versements jusqu’en juin 2027, ce qui vous laisserait environ **${keep} par mois**${whose}. ${c('oasRecovery')}`
      : `${pension} ${c('oasPayments')} At your income, the **recovery tax** lowers it: 15% of 2025 net income over ${threshold} is held back from payments until June 2027, which would leave you about **${keep} a month**${whose}. ${c('oasRecovery')}`;
  }
  return `${pension} ${c('oasPayments')}`;
}

export function finderVars({ text, lang }: VarsCtx): Record<string, string> {
  const p = situationIn(text);
  const fr = lang === 'fr';
  const cad = cadIn(lang);
  const job = !!p.jobLoss;
  const kidsKnown = (p.childrenUnder6 ?? 0) + (p.children6to17 ?? 0);
  const kids = kidsKnown || p.children || 0;
  const senior = p.age === '65-74' || p.age === '75-plus';
  let n = 1;
  const c = (key: SourceKey) => cite(++n, key, lang);

  const head = fr
    ? job
      ? 'Demandez l’assurance-emploi *tout de suite*, puis voyez ce qui peut aussi vous aider.'
      : 'Voici ce que vous pourriez recevoir, *réuni en un seul endroit*.'
    : job
      ? 'Apply for Employment Insurance *right away*, then see what else can help.'
      : 'Here’s what you may be able to get, *all in one place*.';
  const lead = job
    ? fr
      ? `Si vous présentez une demande plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations. Vous pouvez envoyer votre relevé d’emploi plus tard. ${cite(1, 'eiApply', 'fr')}`
      : `If you apply more than 4 weeks after your last day of work, you may lose benefits. You can send your record of employment later. ${cite(1, 'eiApply', 'en')}`
    : fr
      ? `La plupart des prestations fédérales sont calculées à partir de votre déclaration de revenus. La première étape est donc toujours la même : **produisez votre déclaration chaque année, même sans revenu**. ${cite(1, 'cgebGet', 'fr')}`
      : `Most federal benefits are worked out from your tax return, so the first step is always the same: **file your taxes every year, even with no income**. ${cite(1, 'cgebGet', 'en')}`;

  let situation = '';
  if (job) {
    situation = fr
      ? `Les prestations régulières correspondent généralement à 55 % de votre rémunération hebdomadaire moyenne assurable, jusqu’à **729 $ par semaine**, pendant 14 à 45 semaines. ${c('eiAmount')}`
      : `EI regular benefits are usually 55% of your average weekly insurable earnings, up to **$729 a week**, for 14 to 45 weeks. ${c('eiAmount')}`;
  } else if (kids > 0) {
    const cite1 = c('ccbAmount');
    if (p.income != null && kidsKnown) {
      const amt = cad(ccbAnnual(p.income, p.childrenUnder6 ?? 0, p.children6to17 ?? 0));
      situation = fr
        ? `Pour votre famille, l’**Allocation canadienne pour enfants** est sans doute le montant le plus important : environ **${amt} par année**, versés chaque mois et non imposables. ${cite1}`
        : `For your family, the **Canada child benefit** is likely the biggest amount: about **${amt} a year**, paid monthly and tax-free. ${cite1}`;
    } else if (p.income != null) {
      const low = cad(ccbAnnual(p.income, 0, kids));
      const high = cad(ccbAnnual(p.income, kids, 0));
      situation = fr
        ? `L’**Allocation canadienne pour enfants** est sans doute votre montant le plus important : pour ${kids} enfants à votre revenu, environ **${low} à ${high} par année**, selon le nombre d’enfants de moins de 6 ans. Indiquez-le dans le chercheur pour obtenir votre montant. ${cite1}`
        : `The **Canada child benefit** is likely your biggest amount: for ${kids} children at your income, about **${low} to ${high} a year**, depending on how many are under 6. Tell the finder and it works out yours. ${cite1}`;
    } else {
      situation = fr
        ? `L’**Allocation canadienne pour enfants** peut atteindre **${cad(CCB_RATES.under6)} par année** pour chaque enfant de moins de 6 ans et **${cad(CCB_RATES.age6to17)}** pour chaque enfant de 6 à 17 ans. Elle diminue quand le revenu familial net dépasse ${cad(CCB_RATES.t1)}. ${cite1}`
        : `The **Canada child benefit** is up to **${cad(CCB_RATES.under6)} a year** for each child under 6 and **${cad(CCB_RATES.age6to17)}** for each child aged 6 to 17. It goes down once family net income is over ${cad(CCB_RATES.t1)}. ${cite1}`;
    }
  } else if (senior) {
    situation = seniorParagraph(p, lang, c);
  } else if (p.disability) {
    const cite1 = c('cdbAmount');
    situation = fr
      ? `Si vous avez de 18 à 64 ans et êtes admissible au crédit d’impôt pour personnes handicapées, la **Prestation canadienne pour les personnes handicapées** peut atteindre **${cad(CDB.monthlyMax, true)} par mois**. ${cite1}`
      : `If you’re 18 to 64 and approved for the disability tax credit, the **Canada Disability Benefit** pays up to **${cad(CDB.monthlyMax, true)} a month**. ${cite1}`;
  }

  const cgeb = fr
    ? `Depuis juillet 2026, l’**Allocation canadienne pour l’épicerie et les besoins essentiels** remplace le crédit pour la TPS/TVH, avec un montant majoré de 25 % jusqu’en 2031. Aucune demande n’est nécessaire : il suffit de produire votre déclaration. ${c('cgeb')}`
    : `Since July 2026, the **Canada Groceries and Essentials Benefit** has replaced the GST/HST credit, with a 25% higher amount until 2031. You don’t apply: filing your taxes is enough. ${c('cgeb')}`;
  // Without a situation paragraph, the dental plan is the best "you have to apply" example.
  const dental = situation
    ? ''
    : fr
      ? `Certains programmes exigent une demande, comme le **Régime canadien de soins dentaires**, pour les familles sans assurance dentaire dont le revenu familial net rajusté est inférieur à 90 000 $. ${c('dentalQualify')}`
      : `Some programs need an application, like the **Canadian Dental Care Plan** for families without dental insurance and an adjusted family net income under $90,000. ${c('dentalQualify')}`;
  const outro = fr
    ? 'Le chercheur ci-dessous estime ce que vous pourriez recevoir et quand. Modifiez une réponse et tout se met à jour. Rien de ce que vous entrez ne quitte votre appareil.'
    : 'The finder below estimates what you could get and when it’s paid. Change any answer and it updates instantly. Nothing you enter leaves your device.';
  return { head, body: [lead, situation, cgeb, dental, outro].filter(Boolean).join('\n\n') };
}
