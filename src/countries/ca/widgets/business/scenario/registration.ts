/** Scripted answer for "Do I need to register for GST/HST?" (EN + FR). Facts and URLs: ../data.ts. */
import { PROVINCE, type Province } from '../data';
import { amountIn, isRideshare, provinceIn } from '../parse';
import { c } from './cite';

/** Province names for answer prose ("in Ontario" / "en Ontario", "au Manitoba", "à l’Île-du-Prince-Édouard"). */
const PROVINCE_NAME: Record<Province, { en: string; fr: string }> = {
  AB: { en: 'Alberta', fr: 'en Alberta' },
  BC: { en: 'British Columbia', fr: 'en Colombie-Britannique' },
  MB: { en: 'Manitoba', fr: 'au Manitoba' },
  NB: { en: 'New Brunswick', fr: 'au Nouveau-Brunswick' },
  NL: { en: 'Newfoundland and Labrador', fr: 'à Terre-Neuve-et-Labrador' },
  NS: { en: 'Nova Scotia', fr: 'en Nouvelle-Écosse' },
  NT: { en: 'the Northwest Territories', fr: 'dans les Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'au Nunavut' },
  ON: { en: 'Ontario', fr: 'en Ontario' },
  PE: { en: 'Prince Edward Island', fr: 'à l’Île-du-Prince-Édouard' },
  QC: { en: 'Quebec', fr: 'au Québec' },
  SK: { en: 'Saskatchewan', fr: 'en Saskatchewan' },
  YT: { en: 'Yukon', fr: 'au Yukon' },
};

export const registrationReply = {
  en: `# {headEn}

Most businesses are “small suppliers”: you don’t have to register for the GST/HST while your taxable sales stay at or under $30,000 over four calendar quarters in a row. Go over it in a single quarter and you start charging GST/HST on the sale that put you over, then register within 29 days. Go over it across the four quarters and you stop being a small supplier at the end of the month after that quarter. ${c(1, 'gstWhen', 'en')}

{p2En}

You only need a business number (BN) when you open a CRA account like GST/HST or payroll, or when you incorporate. {bnEn}

{enterEn}`,
  fr: `# {headFr}

La plupart des entreprises sont de « petits fournisseurs » : vous n’avez pas à vous inscrire à la TPS/TVH tant que vos ventes taxables ne dépassent pas 30 000 $ sur quatre trimestres civils consécutifs. Si vous dépassez ce seuil en un seul trimestre, vous facturez la TPS/TVH dès la vente qui vous fait dépasser le seuil et vous vous inscrivez dans les 29 jours. Si vous le dépassez sur les quatre trimestres, vous cessez d’être un petit fournisseur à la fin du mois suivant ce trimestre. ${c(1, 'gstWhen', 'fr')}

{p2Fr}

Il vous faut un numéro d’entreprise (NE) seulement quand vous ouvrez un compte de l’ARC, comme la TPS/TVH ou les retenues sur la paie, ou quand vous vous constituez en société. {bnFr}

{enterFr}`,
};

export const registrationVars = ({ text }: { text: string }) => {
  const amount = amountIn(text);
  const fmtEn = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const fmtFr = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const rideshare = isRideshare(text);
  const p = provinceIn(text);
  // Only the paragraphs that apply to this person: rideshare rule, Quebec rule, or their province's rate.
  const en: string[] = [];
  const fr: string[] = [];
  let n = 2;
  if (rideshare) {
    en.push(`Taxi and rideshare drivers must register whatever they earn. ${c(n, 'rideshare', 'en')}`);
    fr.push(`Les chauffeurs de taxi et de covoiturage doivent s’inscrire, peu importe leurs revenus. ${c(n, 'rideshare', 'fr')}`);
    n++;
  }
  if (p === 'QC') {
    en.push(`Your business is in Quebec, so you register for the GST/HST with Revenu Québec, not the CRA. ${c(n, 'registerBn', 'en')}`);
    fr.push(`Votre entreprise est au Québec : vous vous inscrivez à la TPS/TVH auprès de Revenu Québec, et non de l’ARC. ${c(n, 'registerBn', 'fr')}`);
    n++;
  } else if (p) {
    const f = PROVINCE[p];
    const name = { en: PROVINCE_NAME[p].en, fr: PROVINCE_NAME[p].fr };
    const pctFr = new Intl.NumberFormat('fr-CA').format(f.rate);
    en.push(
      `When you register, you charge ${f.rate}% ${f.kind === 'hst' ? 'HST' : 'GST'} on sales made in ${name.en}${f.pst ? '; the province also has its own sales tax' : ''}. ${c(n, 'gstRates', 'en')}`,
    );
    fr.push(
      `Une fois inscrit, vous facturez la ${f.kind === 'hst' ? 'TVH' : 'TPS'} de ${pctFr} % sur les ventes effectuées ${name.fr}${f.pst ? '; la province a aussi sa propre taxe de vente' : ''}. ${c(n, 'gstRates', 'fr')}`,
    );
    n++;
  } else {
    en.push(`The rate you charge depends on where you make the sale: 5% GST, or 13% to 15% HST in the participating provinces. ${c(n, 'gstRates', 'en')}`);
    fr.push(`Le taux à facturer dépend de l’endroit où vous effectuez la vente : TPS de 5 %, ou TVH de 13 % à 15 % dans les provinces participantes. ${c(n, 'gstRates', 'fr')}`);
    n++;
  }
  // "I made $45,000 last year": the checker spreads it over the last four calendar quarters, so say so.
  const lastYear = amount != null && /\b(last year|past year|l[’']an dernier|l[’']année dernière)\b/i.test(text);
  const rest = {
    p2En: en.join(' '),
    p2Fr: fr.join(' '),
    bnEn: c(n, 'needBn', 'en'),
    bnFr: c(n, 'needBn', 'fr'),
    enterEn: lastYear
      ? 'Enter each quarter below — the test uses your last four calendar quarters, not the calendar year.'
      : 'Enter your sales for each quarter in the checker below to see exactly where you stand.',
    enterFr: lastYear
      ? 'Entrez chaque trimestre ci-dessous : le critère porte sur vos quatre derniers trimestres civils, et non sur l’année civile.'
      : 'Entrez vos ventes de chaque trimestre dans l’outil ci-dessous pour savoir exactement où vous en êtes.',
  };
  if (rideshare)
    return {
      ...rest,
      headEn: 'Yes: taxi and rideshare drivers must register, *whatever they earn*.',
      headFr: 'Oui : les chauffeurs de taxi et de covoiturage doivent s’inscrire, *peu importe leurs revenus*.',
    };
  if (amount != null && amount > 30_000)
    return {
      ...rest,
      headEn: `At ${fmtEn(amount)} in yearly sales, *yes*: you need to register for the GST/HST.`,
      headFr: `Avec ${fmtFr(amount)} de ventes par année, *oui* : vous devez vous inscrire à la TPS/TVH.`,
    };
  if (amount != null && amount >= 1000)
    return {
      ...rest,
      headEn: `At ${fmtEn(amount)} a year, *not yet*: the limit is $30,000 over four quarters.`,
      headFr: `Avec ${fmtFr(amount)} par année, *pas encore* : le seuil est de 30 000 $ sur quatre trimestres.`,
    };
  return {
    ...rest,
    headEn: 'Not until your sales pass *$30,000* over four calendar quarters.',
    headFr: 'Pas avant que vos ventes dépassent *30 000 $* sur quatre trimestres civils.',
  };
};
