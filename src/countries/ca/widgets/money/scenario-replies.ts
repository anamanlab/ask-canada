/**
 * The parts of the scripted `money` answers that depend on what the person typed: the RESP heading and lead,
 * and the mortgage answer's heading and paragraphs. Facts: ./data; pages: ./links. Server only.
 */
import { formatMoney, numberFormat } from '@/lib/i18n/format';
import { todayInCanada } from '../../data/holidays';
import { minDownPayment, stressTest } from './calc/mortgage';
import { planResp } from './calc/resp';
import { MORTGAGE, RESP } from './data';
import { listAnd } from './intl';
import { URLS } from './links';
import { mortgageInput, respInput } from './scenario-parse';

type Ctx = { text: string; lang: 'en' | 'fr' };

/* One shared formatter per language and option set (core caches the Intl instances). */
const INTL = { en: 'en-CA', fr: 'fr-CA' } as const;
const cad = (lang: 'en' | 'fr') => (n: number) => formatMoney(n, INTL[lang], 'CAD', { cents: 'never' });
const percent = (lang: 'en' | 'fr', opts: Intl.NumberFormatOptions) => (n: number) => numberFormat(INTL[lang], opts).format(n) + (lang === 'fr' ? '\u00a0%' : '%');
const pct2 = (lang: 'en' | 'fr') => percent(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = (lang: 'en' | 'fr') => percent(lang, { maximumFractionDigits: 1 });
const list = (lang: 'en' | 'fr', items: string[]) => listAnd(items, INTL[lang]);
/** "a" or "an" before an amount, as it is read aloud: 8…, 11… and 18… start with a vowel sound ("an $800,000 home", "an $11,000 gift"). */
const article = (n: number) => {
  const digits = String(Math.round(Math.abs(n)));
  const lead = digits.slice(0, ((digits.length - 1) % 3) + 1);
  return lead.startsWith('8') || lead === '11' || lead === '18' ? 'an' : 'a';
};

/** Personalized RESP heading + lead when the person gave an age or an amount; the general rule otherwise. */
export function respVars({ text, lang }: Ctx): Record<string, string> {
  const fr = lang === 'fr';
  const f = cad(lang);
  const i = respInput(text);
  const rule = fr
    ? `Grâce à la Subvention canadienne pour l’épargne-études, votre enfant peut recevoir jusqu’à **${f(RESP.cesgLifetime)}** d’ici la fin de l’année de ses 17 ans.`
    : `Through the Canada Education Savings Grant, your child can get up to **${f(RESP.cesgLifetime)}** by the end of the year they turn 17.`;
  const catchUpRule = fr
    ? `Vous avez manqué des années? Vous pouvez rattraper : jusqu’à **${f(RESP.cesgMaxPerYear)}** de subvention en une année, s’il reste des montants inutilisés.`
    : `Missed a few years? You can catch up: up to **${f(RESP.cesgMaxPerYear)}** of grant in one year, if there’s unused room.`;
  if (i.childAge == null && i.said == null) {
    return {
      heading: fr
        ? `La subvention ajoute *20 % des premiers ${f(RESP.cesgMatchedPerYear)}* versés dans un REEE chaque année : jusqu’à ${f(RESP.cesgBasicPerYear)}.`
        : `The grant adds *20% of the first ${f(RESP.cesgMatchedPerYear)}* you put in an RESP each year: up to ${f(RESP.cesgBasicPerYear)}.`,
      lead: `${rule} ${catchUpRule}`,
    };
  }
  const year = Number(todayInCanada().slice(0, 4));
  const at = i.said
    ? fr
      ? `À ${f(i.said.amount)} par ${i.said.per === 'month' ? 'mois' : 'année'}`
      : `At ${f(i.said.amount)} a ${i.said.per}`
    : fr
      ? `En versant ${f(RESP.cesgMatchedPerYear)} par année`
      : `Put in ${f(RESP.cesgMatchedPerYear)} a year and`;
  if (i.childAge == null) {
    // An amount but no age: the yearly grant is exact, the total depends on the age.
    const perYear = Math.min(RESP.cesgRate * (i.annual ?? 0), RESP.cesgBasicPerYear);
    return {
      heading: fr
        ? `${at}, la subvention ajoute *${f(perYear)} par année*, jusqu’à ${f(RESP.cesgLifetime)} par enfant.`
        : `${at}, the grant adds *${f(perYear)} a year*, up to ${f(RESP.cesgLifetime)} per child.`,
      lead: `${rule} ${catchUpRule}`,
    };
  }
  const r = planResp({ childAge: i.childAge, annual: i.annual, incomeTier: i.incomeTier }, year);
  const endYear = year + (RESP.cesgLastAge - r.childAge);
  const grant = r.totals.cesg + r.totals.additional;
  const heading = fr
    ? `${at}, la subvention ajoute *${f(grant)}* d’ici la fin de ${endYear}.`
    : i.said
      ? `${at}, the grant adds *${f(grant)}* by the end of ${endYear}.`
      : `${at} the grant adds *${f(grant)}* by the end of ${endYear}.`;
  const how = fr
    ? `C’est la Subvention canadienne pour l’épargne-études : 20 % des premiers ${f(RESP.cesgMatchedPerYear)} versés chaque année, jusqu’à **${f(RESP.cesgLifetime)}** par enfant d’ici la fin de l’année de ses 17 ans.`
    : `That’s the Canada Education Savings Grant: 20% of the first ${f(RESP.cesgMatchedPerYear)} you put in each year, up to **${f(RESP.cesgLifetime)}** per child by the end of the year they turn 17.`;
  const catchAmount = RESP.cesgMaxPerYear / RESP.cesgRate;
  const catchUp =
    !r.tooOld && r.capAge == null && r.unusedAtStart > 0 && r.annual < catchAmount
      ? fr
        ? ` Si votre enfant n’a encore reçu aucune subvention, il a aussi **${f(r.unusedAtStart)}** de subvention inutilisée des années passées : versez ${f(catchAmount)} dans une année pour obtenir jusqu’à ${f(RESP.cesgMaxPerYear)} de subvention cette année-là.`
        : ` If your child hasn’t received any grant yet, there’s also **${f(r.unusedAtStart)}** of unused grant room from past years: put in ${f(catchAmount)} in a year to get up to ${f(RESP.cesgMaxPerYear)} of grant that year.`
      : '';
  const more =
    !r.tooOld && r.annual < RESP.cesgMatchedPerYear
      ? fr
        ? ` En versant ${f(RESP.cesgMatchedPerYear)} par année, vous obtiendriez la subvention complète de ${f(RESP.cesgBasicPerYear)}.`
        : ` Putting in ${f(RESP.cesgMatchedPerYear)} a year gets the full ${f(RESP.cesgBasicPerYear)} each year.`
      : '';
  return { heading, lead: `${how}${more}${catchUp}` };
}

/** Heading, two paragraphs and outro of the mortgage answer: a down-payment question leads with the down-payment rule, the rest with the stress test. */
export function mortgageVars({ text, lang }: Ctx): Record<string, string> {
  const fr = lang === 'fr';
  const i = mortgageInput(text);
  const f = cad(lang);
  const p = pct2(lang);
  const d = MORTGAGE.down;
  const floor = p(MORTGAGE.floor);
  const cite = (n: number, u: { en: string; fr: string }) => `[${n}](${u[lang]})`;
  const rule = fr
    ? `Les banques doivent vous évaluer au plus élevé de ${floor} ou de votre taux plus ${MORTGAGE.buffer} % : c’est le test de résistance hypothécaire. Les autres prêteurs peuvent aussi vous demander de le passer.`
    : `Banks must test you at the higher of ${floor} or your rate plus ${MORTGAGE.buffer}%: that’s the mortgage stress test. Other lenders may ask you to pass it too.`;
  const ratios = (n: number) =>
    fr
      ? `À ce taux admissible, vos frais de logement (hypothèque, impôt foncier, chauffage et la moitié des frais de copropriété) ne doivent pas dépasser **${MORTGAGE.gdsMax} %** du revenu brut de votre ménage, et l’ensemble de vos dettes, **${MORTGAGE.tdsMax} %**. ${cite(n, URLS.mortgagePrep)}`
      : `At that qualifying rate, your housing costs (mortgage, property tax, heating and half of any condo fees) should be no more than **${MORTGAGE.gdsMax}%** of your gross household income, and all your debts together no more than **${MORTGAGE.tdsMax}%**. ${cite(n, URLS.mortgagePrep)}`;
  const insurance = fr
    ? 'Avec moins de 20 % de mise de fonds, il faut généralement une assurance prêt hypothécaire.'
    : 'With less than 20% down, you’ll usually need mortgage loan insurance.';
  const amort = (n: number) =>
    fr
      ? `Les premiers acheteurs et les acheteurs d’une construction neuve peuvent obtenir un amortissement de ${MORTGAGE.amortLong} ans. ${cite(n, URLS.reforms)}`
      : `First-time buyers and buyers of new builds can get a ${MORTGAGE.amortLong}-year amortization. ${cite(n, URLS.reforms)}`;
  const downRule = (a: number, b: number) =>
    fr
      ? `La mise de fonds minimale est de 5 % sur les premiers 500 000 $ et de 10 % sur la partie jusqu’à 1,5 million de dollars; à 1,5 million ou plus, elle est de 20 %. ${insurance} ${cite(a, URLS.downPayment)} ${cite(b, URLS.reforms)} ${amort(b)}`
      : `The minimum down payment is 5% on the first $500,000 and 10% on the portion up to $1.5 million; at $1.5 million or more it’s 20%. ${insurance} ${cite(a, URLS.downPayment)} ${cite(b, URLS.reforms)} ${amort(b)}`;
  const outro = fr ? 'Voici le test avec vos chiffres.' : 'Here’s the test with your numbers.';

  if (!i.income && /down ?payment|mise de fonds/i.test(text)) {
    // A down-payment question: the heading answers it; the stress test follows as context.
    const heading = i.price
      ? fr
        ? `Pour une maison de ${f(i.price)}, la mise de fonds minimale est de *${f(minDownPayment(i.price))}*.`
        : `On ${article(i.price)} ${f(i.price)} home, the minimum down payment is *${f(minDownPayment(i.price))}*.`
      : fr
        ? `La mise de fonds minimale est de *5 % sur les premiers ${f(d.firstTier)}*, plus 10 % sur le reste jusqu’à 1,5 million de dollars.`
        : `The minimum down payment is *5% of the first ${f(d.firstTier)}*, plus 10% of the rest up to $1.5 million.`;
    const how = !i.price
      ? ''
      : i.price >= d.allPctFrom
        ? fr
          ? 'À 1,5 million de dollars ou plus, c’est 20 % du prix.'
          : 'At $1.5 million or more, it’s 20% of the price.'
        : i.price <= d.firstTier
          ? fr
            ? `C’est 5 % du prix, jusqu’à ${f(d.firstTier)}.`
            : `That’s 5% of the price, up to ${f(d.firstTier)}.`
          : fr
            ? `C’est 5 % des premiers ${f(d.firstTier)}, plus 10 % du reste.`
            : `That’s 5% of the first ${f(d.firstTier)}, plus 10% of the rest.`;
    const p1 = i.price
      ? `${how} ${insurance} ${cite(1, URLS.downPayment)} ${cite(2, URLS.reforms)} ${amort(2)}`
      : fr
        ? `À 1,5 million de dollars ou plus, elle est de 20 %. ${insurance} ${cite(1, URLS.downPayment)} ${cite(2, URLS.reforms)} ${amort(2)}`
        : `At $1.5 million or more, it’s 20%. ${insurance} ${cite(1, URLS.downPayment)} ${cite(2, URLS.reforms)} ${amort(2)}`;
    const p2 = fr
      ? `Même avec la mise de fonds, les banques doivent vous évaluer au plus élevé de ${floor} ou de votre taux plus ${MORTGAGE.buffer} % : c’est le test de résistance hypothécaire. ${ratios(3)}`
      : `Even with the down payment, banks must test you at the higher of ${floor} or your rate plus ${MORTGAGE.buffer}%: that’s the mortgage stress test. ${ratios(3)}`;
    return {
      heading,
      p1,
      p2,
      outro: i.price
        ? fr
          ? 'Ajoutez votre revenu ci-dessous pour faire le test.'
          : 'Add your income below to run the test.'
        : fr
          ? 'Ajoutez votre revenu et un prix ci-dessous pour voir votre mise de fonds minimale et faire le test.'
          : 'Add your income and a price below to see your minimum down payment and run the test.',
    };
  }

  if (!i.income || !i.price) {
    return {
      heading: fr
        ? `Les banques vous évaluent au *plus élevé de ${floor} ou de votre taux plus ${MORTGAGE.buffer} %*, pas au taux qu’on vous offre.`
        : `Banks will test you at *the higher of ${floor} or your rate plus ${MORTGAGE.buffer}%*, not the rate you’re offered.`,
      p1: `${fr ? 'C’est le test de résistance hypothécaire.' : 'That’s the mortgage stress test.'} ${ratios(1)}`,
      p2: downRule(2, 3),
      outro: fr ? 'Ajoutez vos chiffres ci-dessous pour faire le test.' : 'Add your numbers below to run the test.',
    };
  }

  const r = stressTest(i);
  const down = r.downIsMinimum ? (fr ? ` Nous avons supposé la mise de fonds minimale, ${f(r.minDown)}.` : ` We assumed the minimum down payment, ${f(r.minDown)}.`) : '';
  const missing = list(
    lang,
    r.missing.map((m) => (fr ? { rate: 'votre taux', propertyTax: 'l’impôt foncier', heating: 'le chauffage' } : { rate: 'your mortgage rate', propertyTax: 'property tax', heating: 'heating' })[m]),
  );

  if (r.verdict === 'maybe') {
    // Something that can only make it worse is missing: a hedged verdict, then what to add in the lead.
    // The widget carries the rough-check caveat (hero + notices), so the answer doesn't repeat it.
    const at = p(r.qualifyingRate);
    // The heading names its own condition (the lowest test rate, or the costs left out), so it still reads
    // true above a widget in which the person has since typed a rate and got a different verdict.
    const given = r.rateMissing
      ? fr
        ? `Au taux d’évaluation le plus bas, ${at},`
        : `At the lowest test rate, ${at},`
      : fr
        ? `Sans compter ${missing},`
        : `Not counting ${missing},`;
    const heading = fr
      ? `${given} une maison de ${f(r.price)} *pourrait passer* avec ${f(r.income)} par année.`
      : `${given} a ${f(r.price)} home *could fit* on ${f(r.income)} a year.`;
    const lead = fr
      ? `Sans ${missing}, le logement représenterait ${pct1(lang)(r.gds)} de votre revenu à ${at}${r.rateMissing ? ', le taux d’évaluation le plus bas' : ''}.`
      : `Without ${missing}, housing would be ${pct1(lang)(r.gds)} of your income at ${at}${r.rateMissing ? ', the lowest test rate' : ''}.`;
    const addThem = fr ? ` Ajoutez ${missing} ci-dessous pour confirmer.` : ` Add ${missing} below to be sure.`;
    return { heading, p1: `${lead} ${ratios(1)}${down}${addThem}`, p2: downRule(2, 3), outro };
  }

  const floorNote = r.verdict === 'fail' && r.rateMissing && (r.reason === 'gds' || r.reason === 'tds');
  const minDownNote = r.verdict === 'fail' && r.downIsMinimum && (r.reason === 'gds' || r.reason === 'tds');
  const heading =
    r.verdict === 'pass'
      ? fr
        ? `Avec ${f(r.income)} par année, une maison de ${f(r.price)} *réussit* le test de résistance.`
        : `On ${f(r.income)} a year, a ${f(r.price)} home *passes* the stress test.`
      : fr
        ? `Avec ${f(r.income)} par année, une maison de ${f(r.price)} *ne réussit pas* le test de résistance${floorNote ? ', même au taux le plus bas' : minDownNote ? ' avec la mise de fonds minimale' : ''}.`
        : `On ${f(r.income)} a year, a ${f(r.price)} home *doesn’t pass* the stress test${floorNote ? ', even at the lowest test rate' : minDownNote ? ' with the minimum down payment' : ''}.`;
  const lead = fr
    ? `Vous seriez évalué à ${p(r.qualifyingRate)}${r.rateMissing ? ' au minimum' : ''}. ${rule}${down}`
    : `You’d be tested at ${p(r.qualifyingRate)}${r.rateMissing ? ' at the very least' : ''}. ${rule}${down}`;
  return { heading, p1: `${lead} ${ratios(1)}`, p2: downRule(2, 3), outro };
}
