/** Scripted answers for importing and exporting commercial goods (EN + FR). Facts and URLs: ../data.ts. */
import type { FxRates } from '../build';
import { importEstimate } from '../calc';
import { amountIn, COST_Q, currencyIn, dutyRateIn, originIn, PCT, withoutRates } from '../parse';
import { c } from './cite';

export const importReply = {
  en: `{headEn}

{bodyEn}

{tariffsEn}

{closeEn}`,
  fr: `{headFr}

{bodyFr}

{tariffsFr}

{closeFr}`,
};

/** What the question gives for an estimate: invoice amount, duty rate and currency (U.S. dollars when none is named, like the tool). */
const invoiceIn = (text: string) => ({ amount: amountIn(withoutRates(text)), duty: dutyRateIn(text), currency: currencyIn(text) ?? 'USD' });
/** True when the heading can state a total, but only with an exchange rate (a foreign invoice with a duty rate). */
export const importNeedsFx = (text: string) => {
  const { amount, duty, currency } = invoiceIn(text);
  return amount != null && duty != null && currency !== 'CAD';
};

const money = (n: number, intl: string, currency = 'CAD') =>
  new Intl.NumberFormat(intl, { style: 'currency', currency, currencyDisplay: currency === 'CAD' ? 'narrowSymbol' : 'symbol', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);

/**
 * "…importing 48,000 yuan of goods at 6.5%": the same sum the widget shows (calc.importEstimate), as the
 * heading. Null without an amount, a duty rate or (for a foreign invoice) a live rate: the heading stays general.
 */
function estimateHead(text: string, fx: FxRates | null) {
  const { amount, duty, currency } = invoiceIn(text);
  const rate = currency === 'CAD' ? 1 : fx?.rates[currency];
  if (amount == null || duty == null || !rate) return null;
  const { total } = importEstimate({ amount, rate, dutyRate: duty });
  return {
    headEn: `# On a ${money(amount, 'en-CA', currency)} invoice at ${duty}% duty, expect about *${money(total, 'en-CA')}* in duty and GST.`,
    headFr: `# Sur une facture de ${money(amount, 'fr-CA', currency)} à ${new Intl.NumberFormat('fr-CA').format(duty)} % de droits, prévoyez environ *${money(total, 'fr-CA')}* de droits et de TPS.`,
  };
}

export const importVars = ({ text }: { text: string }, fx: FxRates | null = null) => {
  // U.S. counter-tariffs and the CUSMA sentence only when the person names the U.S. as the origin and no other
  // place: a U.S.-dollar invoice says nothing about where goods are made. Otherwise the neutral all-countries
  // page (canadas-tariff-responses.html, 2026-09-29).
  const us = originIn(text) === 'us';
  // "How much duty…?" gets a duty verdict first; "How do I import?" gets the setup verdict first.
  const cost = PCT.test(text) || COST_Q.test(text);
  const setupEn = `Every commercial importer needs a CBSA Assessment and Revenue Management (CARM) Client Portal account, a 9-digit business number and an RM import program account. A customs broker is optional: brokers are licensed by the CBSA but aren’t government, and charge fees.`;
  const setupFr = `Tout importateur commercial a besoin d’un compte dans le portail client de la Gestion des cotisations et des recettes de l’ASFC (GCRA), d’un numéro d’entreprise à 9 chiffres et d’un compte de programme d’importation RM. Le courtier en douane est facultatif : les courtiers sont agréés par l’ASFC, mais ne font pas partie du gouvernement et facturent des frais.`;
  const dutiesEn = `The duty rate comes from your goods’ 10-digit tariff classification and their country of origin. You declare the value in Canadian dollars, using the exchange rate on the date the goods were shipped, and GST is charged on the value plus duty.`;
  const dutiesFr = `Le taux de droits dépend du classement tarifaire à 10 chiffres de vos marchandises et de leur pays d’origine. Vous déclarez la valeur en dollars canadiens, au taux de change de la date d’expédition, et la TPS s’applique à la valeur plus les droits.`;
  const cusmaEn = us ? ' Goods made in the U.S. may qualify for the preferential United States Tariff under CUSMA, but only with a valid certification of origin and direct shipment.' : '';
  const cusmaFr = us ? ' Les marchandises originaires des États-Unis peuvent bénéficier du tarif préférentiel des États-Unis en vertu de l’ACEUM, mais seulement avec un certificat d’origine valide et une expédition directe.' : '';
  const head = cost
    ? {
        headEn: '# Duty depends on your goods’ *tariff classification*; GST is 5% on the value plus duty.',
        headFr: '# Les droits dépendent du *classement tarifaire* de vos marchandises; la TPS de 5 % s’applique à la valeur plus les droits.',
        bodyEn: `${dutiesEn}${cusmaEn} ${c(1, 'importDuties', 'en')}\n\nTo clear the goods, you also need a CARM Client Portal account, a 9-digit business number and an RM import program account. A customs broker is optional: brokers are licensed by the CBSA but aren’t government, and charge fees. ${c(2, 'importSetup', 'en')}`,
        bodyFr: `${dutiesFr}${cusmaFr} ${c(1, 'importDuties', 'fr')}\n\nPour dédouaner les marchandises, il vous faut aussi un compte dans le portail client de la GCRA, un numéro d’entreprise à 9 chiffres et un compte de programme d’importation RM. Le courtier en douane est facultatif : les courtiers sont agréés par l’ASFC, mais ne font pas partie du gouvernement et facturent des frais. ${c(2, 'importSetup', 'fr')}`,
      }
    : {
        headEn: '# To import for your business, you need a *CARM* account, a business number and an import account.',
        headFr: '# Pour importer pour votre entreprise, il vous faut un compte *GCRA*, un numéro d’entreprise et un compte d’importation.',
        bodyEn: `${setupEn} ${c(1, 'importSetup', 'en')}\n\n${dutiesEn}${cusmaEn} ${c(2, 'importDuties', 'en')}`,
        bodyFr: `${setupFr} ${c(1, 'importSetup', 'fr')}\n\n${dutiesFr}${cusmaFr} ${c(2, 'importDuties', 'fr')}`,
      };
  return {
    ...head,
    ...estimateHead(text, fx),
    tariffsEn: us
      ? `Some goods from the U.S. face Canadian counter-tariffs, so check the complete list before you order. ${c(3, 'counterTariffs', 'en')}`
      : `Canada applies tariffs to some imports from the U.S. and other countries, such as steel and aluminum, so check before you order. ${c(3, 'tariffResponses', 'en')}`,
    tariffsFr: us
      ? `Certaines marchandises des États-Unis sont visées par des contre-mesures tarifaires canadiennes : consultez la liste complète avant de commander. ${c(3, 'counterTariffs', 'fr')}`
      : `Le Canada applique des droits de douane à certaines importations des États-Unis et d’autres pays, comme l’acier et l’aluminium : vérifiez avant de commander. ${c(3, 'tariffResponses', 'fr')}`,
    // No amount given: the estimate opens empty, so the closing line asks for the invoice value.
    ...(amountIn(withoutRates(text)) == null
      ? {
          closeEn: 'Enter your invoice value and duty rate below for an estimate with today’s Bank of Canada exchange rate.',
          closeFr: 'Entrez la valeur de votre facture et votre taux de droits ci-dessous pour obtenir une estimation au taux de change du jour de la Banque du Canada.',
        }
      : PCT.test(text)
        ? {
            closeEn: 'Here’s your estimate with today’s Bank of Canada exchange rate. Change any figure to update it.',
            closeFr: 'Voici votre estimation au taux de change du jour de la Banque du Canada. Modifiez un montant pour la mettre à jour.',
          }
        : {
            closeEn: 'Here’s an estimate with today’s Bank of Canada exchange rate. Add your duty rate to include customs duty.',
            closeFr: 'Voici une estimation au taux de change du jour de la Banque du Canada. Ajoutez votre taux de droits pour inclure les droits de douane.',
          }),
  };
};

export const exportReply = {
  en: `# Most goods going to the U.S. don’t need an *export declaration*; elsewhere, it depends on value.

Goods exported for use in the United States usually don’t need one. For other countries, you need one for commercial goods worth CAN$2,000 or more, and controlled, regulated or prohibited goods always need a permit, certificate or licence. ${c(1, 'exportGuide', 'en')}

To report, get a business number and an RM export account through the CARM Client Portal, then use the Canadian Export Reporting System. Timing depends on how the goods leave: at least 2 hours before loading by air, 48 hours by sea, and immediately before export by truck. Keep your export records for 6 years. ${c(1, 'exportGuide', 'en')}

For help finding buyers abroad, the Trade Commissioner Service offers export advice and contacts worldwide. ${c(2, 'tcs', 'en')}

Check your own shipment below.`,
  fr: `# La plupart des marchandises destinées aux États-Unis ne nécessitent pas de *déclaration d’exportation*; ailleurs, cela dépend de la valeur.

Les marchandises exportées pour être utilisées aux États-Unis n’en ont habituellement pas besoin. Pour les autres pays, il en faut une pour les marchandises commerciales d’une valeur de 2 000 $ CA ou plus, et les marchandises contrôlées, réglementées ou interdites exigent toujours un permis, un certificat ou une licence. ${c(1, 'exportGuide', 'fr')}

Pour déclarer, obtenez un numéro d’entreprise et un compte d’exportation RM dans le portail client de la GCRA, puis utilisez le Système canadien de déclaration des exportations. Le délai dépend du mode de sortie : au moins 2 heures avant le chargement par avion, 48 heures par bateau, et immédiatement avant l’exportation par camion. Conservez vos documents d’exportation pendant 6 ans. ${c(1, 'exportGuide', 'fr')}

Pour trouver des acheteurs à l’étranger, le Service des délégués commerciaux offre des conseils et des contacts partout dans le monde. ${c(2, 'tcs', 'fr')}

Vérifiez votre envoi ci-dessous.`,
};
