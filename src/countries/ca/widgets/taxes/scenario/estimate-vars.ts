/** The estimator answer: a heading with the refund, balance owing or tax, and a closing line that ties it to the widget. */
import { estimate } from '../calc/estimate';
import { PROVINCE_IN, dollars, estimatorInput, type Lang } from './parse-question';

export function estimateVars(text: string, lang: Lang) {
  const i = estimatorInput(text);
  const fr = lang === 'fr';
  const money = (n: number) => dollars(n, lang);
  const depends = fr
    ? 'Obtenir un remboursement dépend de l’impôt déjà retenu sur votre paie (case 22 de votre T4).'
    : 'Whether you get a refund depends on how much tax was already deducted from your pay (box 22 of your T4).';
  const live = fr ? 'Modifiez n’importe quel chiffre ci-dessous : l’estimation se met à jour aussitôt.' : 'Change any number below and the estimate updates instantly.';
  if (!i.employmentIncome) {
    return {
      heading: fr ? 'Entrez votre revenu ci-dessous pour estimer votre remboursement de *2026*.' : 'Enter your income below and I’ll estimate your *2026* refund.',
      last: fr
        ? `${depends} Entrez votre revenu d’emploi (case 14) et l’impôt retenu (case 22) : l’estimation se met à jour aussitôt.`
        : `${depends} Enter your employment income (box 14) and the tax deducted (box 22), and the estimate updates instantly.`,
    };
  }
  const inc = money(i.employmentIncome);
  if (!i.province) {
    // No province: the widget shows the federal part and asks for the province.
    const e = estimate({ province: 'ON', employmentIncome: i.employmentIncome, otherIncome: 0, rrsp: 0, fhsa: 0, taxDeducted: null });
    return {
      heading: fr
        ? `Avec ${inc}, votre impôt fédéral de 2026 serait d’environ *${money(e.federal)}*, avant l’impôt provincial.`
        : `At ${inc}, your 2026 federal tax comes to about *${money(e.federal)}*, before provincial tax.`,
      last: fr
        ? `Choisissez votre province ou territoire ci-dessous pour ajouter l’impôt provincial. ${depends}`
        : `Choose your province or territory below to add provincial tax. ${depends}`,
    };
  }
  const e = estimate({ province: i.province, employmentIncome: i.employmentIncome, otherIncome: 0, rrsp: 0, fhsa: 0, taxDeducted: i.taxDeducted ?? null });
  const where = PROVINCE_IN[i.province][lang];
  const qc = i.province === 'QC';
  const tax = money(qc ? e.federal : e.total);
  if (e.balance != null) {
    const amt = money(Math.abs(e.balance));
    const ded = money(i.taxDeducted ?? 0);
    // One sentence that ties the heading to the widget's numbers.
    const tie =
      e.balance >= 0
        ? fr
          ? `Votre impôt${qc ? ' fédéral' : ''} s’élève à environ ${tax} et ${ded} a été retenu sur votre paie, donc environ ${amt} vous reviendrait.`
          : `Your ${qc ? 'federal ' : ''}tax comes to about ${tax} and ${ded} was deducted from your pay, so about ${amt} would come back to you.`
        : fr
          ? `Votre impôt${qc ? ' fédéral' : ''} s’élève à environ ${tax}, mais seulement ${ded} a été retenu sur votre paie, donc il resterait environ ${amt} à payer.`
          : `Your ${qc ? 'federal ' : ''}tax comes to about ${tax}, but only ${ded} was deducted from your pay, so about ${amt} would be left to pay.`;
    return {
      heading:
        e.balance >= 0
          ? fr ? `Vous pourriez recevoir un remboursement d’environ *${amt}*.` : `You could get a refund of about *${amt}*.`
          : fr ? `Vous pourriez devoir environ *${amt}*.` : `You might owe about *${amt}*.`,
      last: `${tie} ${live}`,
    };
  }
  return {
    heading: qc
      ? fr ? `Avec ${inc} au Québec, votre impôt fédéral de 2026 serait d’environ *${tax}*.` : `At ${inc} in Quebec, your 2026 federal tax comes to about *${tax}*.`
      : fr ? `Avec ${inc} ${where}, votre impôt de 2026 serait d’environ *${tax}*.` : `At ${inc} ${where}, your 2026 income tax comes to about *${tax}*.`,
    last: fr
      ? `${depends} Ajoutez ce montant ci-dessous pour voir votre remboursement ou votre solde dû.`
      : `${depends} Add it below to see your refund or balance owing.`,
  };
}
