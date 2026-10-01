/**
 * Starter scenarios (foundation-owned): a sourced answer for every question the landing page and Menu
 * promote (hero chips, rotating examples, service rows) and their natural rephrasings, in EN and FR.
 *
 * They sit at priority -1..-2 so a widget's own scenario (priority >= 0) always wins once it exists.
 * Every fact was checked on the linked official page on 2026-09-29. `pnpm check:scenarios` proves that
 * each promoted question and every follow-up chip resolves to a real answer, never the fallback.
 */
import type { Scenario } from '@/lib/scripted/types';
import { findAdvisory } from '../data/advisory';
import { todayInCanada } from '../data/holidays';
import { titleCitations as tc } from './titles';

const C = 'https://www.canada.ca';
const U = {
  ccbWho: { en: `${C}/en/revenue-agency/services/child-family-benefits/canada-child-benefit/who-apply.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants/qui-demande.html` },
  ccbHow: { en: `${C}/en/revenue-agency/services/child-family-benefits/canada-child-benefit/how-apply.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants/comment-demande.html` },
  address: { en: `${C}/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/change-your-address.html`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/comment-changer-votre-adresse.html` },
  cgebGet: { en: `${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/get-benefit.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels/obtenir-allocation.html` },
  cgebWho: { en: `${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/who-eligible.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels/qui-admissible.html` },
  payDates: { en: `${C}/en/revenue-agency/services/child-family-benefits/benefit-payment-dates.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/dates-versement-prestations.html` },
  cgeb: { en: `${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit.html`, fr: `${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels.html` },
  howFile: { en: `${C}/en/services/taxes/income-tax/personal-income-tax/how-file.html`, fr: `${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/comment-produire.html` },
  simpleFile: { en: `${C}/en/services/taxes/income-tax/personal-income-tax/how-file/simplefile.html`, fr: `${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/comment-produire/declarer-simplement.html` },
  clinics: { en: `${C}/en/revenue-agency/services/tax/individuals/community-volunteer-income-tax-program.html`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/programme-communautaire-benevoles-matiere-impot.html` },
  software: { en: `${C}/en/services/taxes/income-tax/personal-income-tax/how-file/tax-software/find-software.html`, fr: `${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/comment-produire/logiciel-impot/trouver-logiciel.html` },
  taxDates: { en: `${C}/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/sujets/dates-importantes-particuliers.html` },
  eiApply: { en: `${C}/en/services/benefits/ei/ei-regular-benefit/apply.html`, fr: `${C}/fr/services/prestations/ae/assurance-emploi-reguliere/demande.html` },
  eiElig: { en: `${C}/en/services/benefits/ei/ei-regular-benefit/eligibility.html`, fr: `${C}/fr/services/prestations/ae/assurance-emploi-reguliere/admissibilite.html` },
  eiAmount: { en: `${C}/en/services/benefits/ei/ei-regular-benefit/benefit-amount.html`, fr: `${C}/fr/services/prestations/ae/assurance-emploi-reguliere/montant-prestation.html` },
  eiParental: { en: `${C}/en/services/benefits/ei/ei-maternity-parental.html`, fr: `${C}/fr/services/prestations/ae/assurance-emploi-maternite-parentales.html` },
  msca: { en: `${C}/en/employment-social-development/services/my-account/ei.html`, fr: `${C}/fr/emploi-developpement-social/services/mon-dossier/assurance-emploi.html` },
  oasElig: { en: `${C}/en/services/benefits/publicpensions/old-age-security/eligibility.html`, fr: `${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/admissibilite.html` },
  oasApply: { en: `${C}/en/services/benefits/publicpensions/old-age-security/apply.html`, fr: `${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/demande.html` },
  oasWhen: { en: `${C}/en/services/benefits/publicpensions/old-age-security/when-start.html`, fr: `${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/quand-debut.html` },
  cppWhen: { en: `${C}/en/services/benefits/publicpensions/cpp/when-start.html`, fr: `${C}/fr/services/prestations/pensionspubliques/rpc/quand-debut.html` },
  advisories: { en: 'https://travel.gc.ca/travelling/advisories', fr: 'https://voyage.gc.ca/voyager/avertissements' },
  recalls: { en: 'https://recalls-rappels.canada.ca/en', fr: 'https://recalls-rappels.canada.ca/fr' },
  vehicleRecalls: { en: 'https://tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats', fr: 'https://tc.canada.ca/fr/transport-routier/defauts-rappels-vehicules-pneus-sieges-auto-enfant' },
  citizenship: { en: `${C}/en/immigration-refugees-citizenship/services/canadian-citizenship/adult-minor/who.html`, fr: `${C}/fr/immigration-refugies-citoyennete/services/citoyennete-canadienne/adulte-mineur/qui.html` },
  gstRegister: { en: `${C}/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html`, fr: `${C}/fr/agence-revenu/services/impot/entreprises/sujets/tps-tvh-entreprises/quand-inscrire-facture.html` },
  vacNavigator: { en: 'https://www.veterans.gc.ca/en/about-vac/resources/find-programs-and-services/benefits-navigator', fr: 'https://www.veterans.gc.ca/fr/propos-dacc/ressources/trouvez-de-linformation-sur-les-programmes-et-les-services/navigateur-des-avantages-dacc' },
  vacContact: { en: 'https://www.veterans.gc.ca/en/contact-us', fr: 'https://www.veterans.gc.ca/fr/contactez-nous' },
  weather: { en: 'https://weather.gc.ca/', fr: 'https://meteo.gc.ca/' },
  hbp: { en: `${C}/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan.html`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/sujets/reer-regimes-connexes/est-regime-accession-a-propriete.html` },
  hbpWho: { en: `${C}/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan/participate-home-buyers-plan.html`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/sujets/reer-regimes-connexes/est-regime-accession-a-propriete/comment-participer-regime-accession-a-propriete.html` },
  cafCareers: { en: 'https://forces.ca/en/careers', fr: 'https://forces.ca/fr/carrieres' },
  caf: { en: `${C}/en/services/defence/caf.html`, fr: `${C}/fr/services/defense/fac.html` },
  lacImmigration: { en: `${C}/en/library-archives/collection/research-help/genealogy-family-history/immigration.html`, fr: `${C}/fr/bibliotheque-archives/collection/aide-recherche/genealogie-histoire-famille/immigration.html` },
  recordCheck: { en: 'https://rcmp.ca/en/criminal-records/criminal-record-checks/where-go', fr: 'https://grc.ca/fr/casiers-judiciaires/verification-casier-judiciaire/ou-aller' },
  emergencyAbroad: { en: 'https://travel.gc.ca/assistance/emergency-assistance', fr: 'https://voyage.gc.ca/assistance/assistance-d-urgence' },
  resp: { en: `${C}/en/services/benefits/education/education-savings/estimating-amounts.html`, fr: `${C}/fr/services/prestations/education/epargne-etudes/estimation-montants.html` },
  research: { en: `${C}/en/services/science/researchfunding.html`, fr: `${C}/fr/services/science/financementrecherche.html` },
  parks: { en: 'https://parks.canada.ca/voyage-travel/admission', fr: 'https://parcs.canada.ca/voyage-travel/admission' },
} as const;

/** Payment dates published on the CRA payment-dates page (checked 2026-09-29). */
const PAY = {
  ccb: ['2026-10-20', '2026-11-20', '2026-12-11'],
  cgeb: ['2026-10-05'],
};

const longDate = (iso: string, lang: 'en' | 'fr') =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
const nextOf = (dates: string[]) => {
  const today = todayInCanada();
  return dates.find((d) => d >= today);
};


/*
 * Newcomer guard. “Can I get the GST credit if I just moved to Canada?” is an eligibility question, and
 * for a new resident the honest answer is “apply once” (Form RC151, plus RC66 with children), not a
 * payment date. Any benefit question that says the person just moved or arrived goes to the
 * `newcomer-benefits` answer; payment dates never answer it (see `exclude` on `benefit-payments`).
 */
const src = (r: RegExp) => `(?:${r.source})`;
/** Every pattern must match somewhere in the text (and none of `not`). */
const all = (must: RegExp[], not: RegExp[] = []) =>
  new RegExp(`^${must.map((r) => `(?=[\\s\\S]*?${src(r)})`).join('')}${not.map((r) => `(?![\\s\\S]*?${src(r)})`).join('')}`, 'i');
/** Arrived in Canada from another country. */
export const NEWCOMER =
  /\b(new ?comers?|new to canada|new (permanent )?residents?|immigrants?|immigrated|(moved|came|arrived|immigrated|relocated|landed) (here |over )?(to|in) canada|just (arrived|landed)|from (another country|abroad|overseas))\b|\bnouve(l|lle|aux|lles) (arrivant|arrivante|résident|résidente)s?\b|\bimmigrant(e|es|s)?\b|\b(arriv(er|ée?s?)|immigr(er|ée?s?)|install(er|ée?s?)|déménag(er|ée?s?)) au canada\b|\brécemment arrivé|\bde l[’']étranger\b|\bd[’']un autre pays\b/i;
/** Any recent move or arrival, including within Canada. */
const MOVED =
  /\b(just|recently|newly) (moved|arrived|came|landed|relocated)\b|\b(moved|arrived|came|relocated) here\b|\bi (moved|arrived)\b|\brécemment (arrivé|déménagé)|\bje viens d[’'](arriver|emménager|déménager)\b|\b(j[’']ai|nous avons|on a) déménagé/i;
export const MOVE = new RegExp(`${src(NEWCOMER)}|${src(MOVED)}`, 'i');
const PROVINCE =
  /\b(another|a new|a different|new) (province|territory)\b|\b(from|to|in) (Ontario|Quebec|Québec|B\.?C|British Columbia|Alberta|Saskatchewan|Manitoba|Nova Scotia|New Brunswick|P\.?E\.?I|Prince Edward Island|Newfoundland|Yukon|Nunavut|(the )?Northwest Territories)\b|\b(autre|nouvelle) province\b|\b(de l[’']|du |de la |en |au )(Ontario|Québec|Quebec|Alberta|Manitoba|Saskatchewan|Colombie-Britannique|Nouvelle-Écosse|Nouveau-Brunswick|Île-du-Prince-Édouard|Terre-Neuve|Yukon|Nunavut)/i;
const BENEFIT =
  /\b(GST|HST|TPS|TVH|credits?|crédits?|benefits?|prestations?|allocations?|CCB|ACE|CGEB|ACEBE|groceries|payments?|paiements?|versements?|paid|cheques?|chèques?)\b|épicerie/i;
const CHILD = /\b(child|children|kids?|baby|CCB|enfants?|ACE)\b|bébé/i;

const starters: Scenario[] = [
  {
    id: 'newcomer-benefits',
    // Above every widget scenario: the move changes the answer, whatever the benefit.
    priority: 14,
    match: [all([MOVE, BENEFIT])],
    // A move between provinces with children: the child-benefit answer covers it (address change).
    exclude: [all([PROVINCE, CHILD], [NEWCOMER])],
    reply: {
      en: `{head}

{body}`,
      fr: `{head}

{body}`,
    },
    vars: ({ text, lang }) => {
      const withinCanada = PROVINCE.test(text) && !NEWCOMER.test(text);
      // “I just moved” without saying from where: answer for a newcomer, and cover a move within Canada.
      const ambiguous = !NEWCOMER.test(text);
      if (withinCanada) {
        return lang === 'fr'
          ? {
              head: '# Oui. Un déménagement au Canada ne change rien : *mettez à jour votre adresse* auprès de l’ARC.',
              body: tc(`En juillet 2026, l’**Allocation canadienne pour l’épicerie et les besoins essentiels** a remplacé le crédit de TPS/TVH. Aucune nouvelle demande n’est nécessaire : produisez votre déclaration chaque année et l’ARC vérifie votre admissibilité automatiquement. [1](${U.cgebGet.fr})

Donnez votre nouvelle adresse à l’ARC le plus tôt possible pour que vos paiements continuent sans interruption. [2](${U.address.fr})`),
            }
          : {
              head: '# Yes. Moving within Canada doesn’t change it: just *update your address* with the CRA.',
              body: tc(`In July 2026, the **Canada Groceries and Essentials Benefit** replaced the GST/HST credit. You don’t need to apply again: file your taxes each year and the CRA checks your eligibility automatically. [1](${U.cgebGet.en})

Tell the CRA your new address as soon as possible so your payments keep arriving. [2](${U.address.en})`),
            };
      }
      return lang === 'fr'
        ? {
            head: '# Oui, si vous résidez au Canada. Si vous venez d’arriver, *faites une demande une seule fois* avec le formulaire RC151.',
            body: tc(`En juillet 2026, l’**Allocation canadienne pour l’épicerie et les besoins essentiels** a remplacé le crédit de TPS/TVH. Elle s’adresse aux résidents du Canada aux fins de l’impôt, âgés de 19 ans ou plus (ou plus jeunes s’ils ont un époux, un conjoint ou un enfant), dont le revenu familial est faible ou modeste. [1](${U.cgebWho.fr})

- **Sans enfants** : remplissez le formulaire RC151 en ligne pour votre première année de résidence, avant de produire votre première déclaration. [2](${U.cgebGet.fr})
- **Avec des enfants de moins de 19 ans** : imprimez les formulaires RC151 et RC66, joignez une preuve de naissance pour chaque enfant et postez le tout à votre centre fiscal. [2](${U.cgebGet.fr})
- **Allocation canadienne pour enfants** : le formulaire RC66 sert aussi de demande. Joignez l’annexe RC66SCH. [3](${U.ccbHow.fr})

Une seule demande par ménage suffit. Ensuite, produisez simplement votre déclaration chaque année, même sans revenu, et l’ARC vérifie votre admissibilité automatiquement. [2](${U.cgebGet.fr})${ambiguous ? `\n\nVous avez plutôt déménagé d’une province à l’autre? Aucune nouvelle demande : donnez simplement votre nouvelle adresse à l’ARC. [4](${U.address.fr})` : ''}`),
          }
        : {
            head: '# Yes, if you’re a resident. As a newcomer, you *apply once* with Form RC151.',
            body: tc(`In July 2026, the **Canada Groceries and Essentials Benefit** replaced the GST/HST credit. It’s for residents of Canada for tax purposes who are 19 or older (or younger with a spouse, partner or child) and have a low or modest family income. [1](${U.cgebWho.en})

- **No children**: fill out Form RC151 online for your first year as a resident, before you file your first tax return. [2](${U.cgebGet.en})
- **Children under 19**: print Forms RC151 and RC66, attach proof of birth for each child and mail them to your tax centre. [2](${U.cgebGet.en})
- **Canada Child Benefit**: Form RC66 is also your application for it. Include Schedule RC66SCH. [3](${U.ccbHow.en})

One application per household is enough. After that, just file a tax return every year, even with no income, and the CRA checks your eligibility automatically. [2](${U.cgebGet.en})${ambiguous ? `\n\nMoved from another province instead? You don’t apply again: just give the CRA your new address. [4](${U.address.en})` : ''}`),
          };
    },
    toolCalls: [
      {
        toolName: 'officialHandoff',
        input: ({ text, lang }: { text: string; lang: 'en' | 'fr' }) =>
          PROVINCE.test(text) && !NEWCOMER.test(text)
            ? lang === 'fr'
              ? { url: U.address.fr, label: 'Changer mon adresse sur canada.ca' }
              : { url: U.address.en, label: 'Change my address on canada.ca' }
            : lang === 'fr'
              ? { url: U.cgebGet.fr, label: 'Formulaire RC151 sur canada.ca', note: 'Le formulaire se remplit sur canada.ca. Rien n’est conservé ici.' }
              : { url: U.cgebGet.en, label: 'Get Form RC151 on canada.ca', note: 'You fill in the form on canada.ca. Nothing is stored here.' },
      },
    ],
    followUps: {
      en: ['Am I eligible for the Canada Child Benefit?', 'How can I file my taxes for free?', 'When is my next benefit payment?'],
      fr: ['Suis-je admissible à l’Allocation canadienne pour enfants?', 'Comment produire ma déclaration gratuitement?', 'Quand est mon prochain paiement de prestations?'],
    },
  },
  {
    id: 'ccb',
    priority: -2,
    match: [
      /\b(canada child benefit|child benefits?|child tax benefit|CCB)\b/i,
      /\b(benefit|money|payments?|allowance)\b.*\b(for|per) (my )?(child|children|kids?)\b/i,
      /\ballocations? (canadienne )?(pour|aux) enfants\b/i,
      /\bACE\b/,
      /\b(prestations?|argent|paiements?)\b.*\bpour (mon |mes )?(enfants?|bébé)\b/i,
    ],
    reply: {
      en: `# You can likely get it if you live with and care for *a child under 18.*

The Canada Child Benefit is a tax-free monthly payment. You’re eligible if you meet all of these: [1](${U.ccbWho.en})

- You live with a child under 18 and are mainly responsible for their care.
- You’re a resident of Canada for tax purposes.
- You or your spouse or partner is a Canadian citizen, permanent resident, protected person, temporary resident or registered under the Indian Act.

Apply as soon as your child is born or starts living with you. You can apply online in your CRA account, or when you register your baby’s birth. [2](${U.ccbHow.en})
{moved}
{nextCcb}`,
      fr: `# Vous y avez probablement droit si vous vivez avec *un enfant de moins de 18 ans* et en prenez soin.

L’Allocation canadienne pour enfants est un paiement mensuel non imposable. Vous y êtes admissible si vous remplissez toutes ces conditions : [1](${U.ccbWho.fr})

- Vous vivez avec un enfant de moins de 18 ans et êtes le principal responsable de ses soins.
- Vous êtes résident du Canada aux fins de l’impôt.
- Vous ou votre époux ou conjoint êtes citoyen canadien, résident permanent, personne protégée, résident temporaire ou inscrit en vertu de la Loi sur les Indiens.

Présentez une demande dès la naissance de votre enfant ou dès qu’il vit avec vous. Vous pouvez le faire en ligne dans votre compte de l’ARC, ou au moment d’enregistrer la naissance de votre bébé. [2](${U.ccbHow.fr})
{moved}
{nextCcb}`,
    },
    vars: ({ text, lang }) => {
      const moved = /\b(moved?|moving|relocat\w*|new province)\b|déménag\w*|nouvelle province/i.test(text);
      const next = nextOf(PAY.ccb);
      return {
        moved: tc(moved
          ? lang === 'fr'
            ? `\nVous avez déménagé d’une province ou d’un territoire à l’autre? L’allocation est fédérale : votre admissibilité ne change pas. Donnez votre nouvelle adresse à l’ARC le plus tôt possible, car les prestations provinciales ou territoriales versées avec elle dépendent de l’endroit où vous vivez. [3](${U.address.fr})\n`
            : `\nMoved from another province or territory? The benefit is federal, so your eligibility doesn’t change. Tell the CRA your new address as soon as possible, since any provincial or territorial benefit paid with it depends on where you live. [3](${U.address.en})\n`
          : ''),
        nextCcb: tc(next
          ? lang === 'fr'
            ? `Le prochain versement est prévu le **${longDate(next, 'fr')}**. [${moved ? 4 : 3}](${U.payDates.fr})`
            : `The next payment date is **${longDate(next, 'en')}**. [${moved ? 4 : 3}](${U.payDates.en})`
          : ''),
      };
    },
    followUps: {
      en: ['When is my next benefit payment?', 'We’re having a baby. What should we apply for?'],
      fr: ['Quand est mon prochain paiement de prestations?', 'Nous attendons un bébé. Que devons-nous demander?'],
    },
  },
  {
    id: 'benefit-payments',
    priority: -1,
    // Payment dates never answer someone who just moved or arrived: see `newcomer-benefits`.
    exclude: [MOVE],
    match: [
      /\b(GST|HST)\b.*\bcredit\b/i,
      /\bgroceries and essentials\b/i,
      /\b(next|when)\b.*\b(benefit|CCB|GST|HST|credit|child benefit)\b.*\b(pay(ment|day)?s?|deposit)\b/i,
      /\b(benefit )?payment dates?\b/i,
      /\bwhen (do|will) i get (paid|my (benefits?|CCB|cheque|deposit))\b/i,
      /\bcrédit (de |pour la )?(TPS|TVH)\b/i,
      /\b(TPS|TVH)\b.*\bcrédit\b/i,
      /\ballocation canadienne pour l[’']épicerie/i,
      /\b(prochain|quand)\b.*\b(paiement|versement|dépôt)s?\b/i,
      /\bdates? de (versement|paiement)s?\b/i,
    ],
    reply: {
      en: `# {cgebHead}

The **Canada Groceries and Essentials Benefit** replaced the GST/HST credit in July 2026. It’s a tax-free quarterly payment for people with low and modest incomes. You don’t apply: file your taxes each year and you’re automatically considered. [1](${U.cgeb.en})

{ccbLine}

Didn’t get a payment? Wait 5 working days for the Canada Child Benefit, or 10 working days for other benefits, before contacting the CRA. [2](${U.payDates.en})`,
      fr: `# {cgebHead}

L’**Allocation canadienne pour l’épicerie et les besoins essentiels** a remplacé le crédit de TPS/TVH en juillet 2026. C’est un paiement trimestriel non imposable pour les personnes à revenu faible ou modeste. Aucune demande n’est nécessaire : produisez votre déclaration chaque année et votre admissibilité est évaluée automatiquement. [1](${U.cgeb.fr})

{ccbLine}

Vous n’avez pas reçu un paiement? Attendez 5 jours ouvrables pour l’Allocation canadienne pour enfants, ou 10 jours ouvrables pour les autres prestations, avant de communiquer avec l’ARC. [2](${U.payDates.fr})`,
    },
    vars: ({ lang }) => {
      const g = nextOf(PAY.cgeb);
      const c = nextOf(PAY.ccb);
      return {
        cgebHead: g
          ? lang === 'fr'
            ? `Votre prochain versement de l’Allocation canadienne pour l’épicerie et les besoins essentiels est le *${longDate(g, 'fr')}.*`
            : `Your next Canada Groceries and Essentials Benefit payment is *${longDate(g, 'en')}.*`
          : lang === 'fr'
            ? 'Les dates de versement sont publiées par l’*ARC*.'
            : 'Payment dates are published by *the CRA.*',
        ccbLine: tc(c
          ? lang === 'fr'
            ? `Le prochain versement de l’**Allocation canadienne pour enfants** est le **${longDate(c, 'fr')}**. [2](${U.payDates.fr})`
            : `The next **Canada Child Benefit** payment is on **${longDate(c, 'en')}**. [2](${U.payDates.en})`
          : ''),
      };
    },
    followUps: {
      en: ['Am I eligible for the Canada Child Benefit?', 'How can I file my taxes for free?'],
      fr: ['Suis-je admissible à l’Allocation canadienne pour enfants?', 'Comment produire ma déclaration gratuitement?'],
    },
  },
  {
    id: 'taxes-file',
    priority: -1,
    match: [
      /\bfile\b.*\b(tax|taxes|return)\b/i,
      /\bfree\b.*\b(tax|taxes|return)\b/i,
      /\b(do|doing|prepare)\b.*\bmy (taxes|tax return)\b/i,
      /\b(simplefile|netfile|tax clinics?|tax software)\b/i,
      /\b(produire|faire|remplir|préparer)\b.*\b(déclaration|impôts?)\b/i,
      /\bgratuit\w*\b.*\b(impôts?|déclaration)\b/i,
      /\b(impôts?|déclaration)\b.*\bgratuit\w*\b/i,
      /\b(clinique d[’']impôts?|comptoirs? d[’']impôts?|déclarer simplement|impotnet)\b/i,
    ],
    reply: {
      en: `# You can file *for free* three ways.

- **SimpleFile**: a free CRA service for eligible people with a lower income and a simple tax situation. [1](${U.simpleFile.en})
- **Certified tax software**: if you have a modest income, most certified software prepares a basic return for free. [2](${U.software.en})
- **Free tax clinics**: volunteers do your return if you have a modest income and a simple tax situation. [3](${U.clinics.en})

Returns for 2026 are due **April 30, 2027**. If you or your spouse or partner is self-employed, you have until June 15, 2027 to file, but any balance owing is still due April 30. [4](${U.taxDates.en})`,
      fr: `# Vous pouvez produire votre déclaration *gratuitement* de trois façons.

- **Déclarer simplement** : un service gratuit de l’ARC pour les personnes admissibles à revenu plus faible dont la situation fiscale est simple. [1](${U.simpleFile.fr})
- **Logiciels homologués** : si votre revenu est modeste, la plupart des logiciels homologués préparent gratuitement une déclaration de base. [2](${U.software.fr})
- **Comptoirs d’impôts gratuits** : des bénévoles remplissent votre déclaration si votre revenu est modeste et votre situation fiscale simple. [3](${U.clinics.fr})

Les déclarations de 2026 doivent être produites au plus tard le **30 avril 2027**. Si vous ou votre époux ou conjoint êtes travailleur autonome, vous avez jusqu’au 15 juin 2027 pour produire, mais tout solde dû doit être payé au plus tard le 30 avril. [4](${U.taxDates.fr})`,
    },
    followUps: {
      en: ['When is my next benefit payment?', 'Do I need to register for GST/HST?'],
      fr: ['Quand est mon prochain paiement de prestations?', 'Dois-je m’inscrire à la TPS/TVH?'],
    },
  },
  {
    id: 'tax-deadline',
    priority: -0.5,
    match: [/\b(tax|taxes|filing|return)\b.*\b(deadline|due|due date)\b/i, /\b(deadline|due date)\b.*\b(tax|taxes|filing|return)\b/i, /\b(date limite|échéance)\b.*\b(impôts?|déclaration)\b/i, /\b(impôts?|déclaration)\b.*\b(date limite|échéance)\b/i],
    reply: {
      en: `# File your 2026 return by *April 30, 2027.*

That’s also the date to pay any balance owing. If you or your spouse or partner is self-employed, you have until **June 15, 2027** to file, but a balance owing is still due April 30. [1](${U.taxDates.en})`,
      fr: `# Produisez votre déclaration de 2026 au plus tard le *30 avril 2027.*

C’est aussi la date limite pour payer tout solde dû. Si vous ou votre époux ou conjoint êtes travailleur autonome, vous avez jusqu’au **15 juin 2027** pour produire, mais tout solde dû doit tout de même être payé au plus tard le 30 avril. [1](${U.taxDates.fr})`,
    },
    followUps: {
      en: ['How can I file my taxes for free?', 'When is my next benefit payment?'],
      fr: ['Comment produire ma déclaration gratuitement?', 'Quand est mon prochain paiement de prestations?'],
    },
  },
  {
    id: 'ei-regular',
    priority: -1,
    match: [
      /\bemployment insurance\b/i,
      /\bEI\b/,
      /\b(lost|lose|losing|quit) (my )?job\b/i,
      /\b(laid off|got fired|been fired|unemployed|out of work|between jobs)\b/i,
      /\bassurance[- ]emploi\b/i,
      /\bAE\b/,
      /\b(perdu|perte de|perdre) (mon |d[’'] ?)?emploi\b/i,
      /\b(mis à pied|mise à pied|congédié|chômage|sans emploi)\b/i,
    ],
    reply: {
      en: `# Apply for Employment Insurance *right away*, even before you have your paperwork.

If you apply more than 4 weeks after your last day of work, you may lose benefits. The online application takes about an hour, and you can send your record of employment later. [1](${U.eiApply.en})

To qualify for regular benefits, you generally must have lost your job through no fault of your own, been without work and pay for at least 7 days in a row, and worked between 420 and 700 insurable hours in the last 52 weeks, depending on where you live. [2](${U.eiElig.en})

Benefits can be up to 55% of your earnings, for up to 45 weeks. [3](${U.eiAmount.en})`,
      fr: `# Demandez l’assurance-emploi *tout de suite*, même avant d’avoir vos documents.

Si vous présentez votre demande plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations. La demande en ligne prend environ une heure, et vous pouvez envoyer votre relevé d’emploi plus tard. [1](${U.eiApply.fr})

Pour recevoir des prestations régulières, vous devez généralement avoir perdu votre emploi sans en être responsable, avoir été sans travail et sans salaire pendant au moins 7 jours consécutifs, et avoir travaillé de 420 à 700 heures assurables au cours des 52 dernières semaines, selon votre région. [2](${U.eiElig.fr})

Les prestations peuvent atteindre 55 % de votre rémunération, pendant un maximum de 45 semaines. [3](${U.eiAmount.fr})`,
    },
    followUps: {
      en: ['How do I get my Record of Employment?', 'When is my next benefit payment?'],
      fr: ['Comment obtenir mon relevé d’emploi?', 'Quand est mon prochain paiement de prestations?'],
    },
  },
  {
    id: 'roe',
    priority: -0.5,
    match: [/\brecord of employment\b/i, /\bROEs?\b/, /\brelevés? d[’']emploi\b/i],
    reply: {
      en: `# Your employer sends it; you can *see it in your Service Canada account.*

Employers submit records of employment (ROEs) directly to Service Canada. To see yours, sign in to **My Service Canada Account**, select “Employment Insurance benefits”, then “View my records of employment”. You can print them, and they stay available for 7 years. [1](${U.msca.en})

Don’t wait for your ROE to apply for EI; you can apply as soon as you stop working. [2](${U.eiApply.en})`,
      fr: `# Votre employeur le transmet; vous pouvez *le consulter dans Mon dossier Service Canada.*

Les employeurs transmettent les relevés d’emploi (RE) directement à Service Canada. Pour voir les vôtres, ouvrez une session dans **Mon dossier Service Canada**, choisissez « Prestations d’assurance-emploi », puis « Voir mes relevés d’emploi ». Vous pouvez les imprimer, et ils restent accessibles pendant 7 ans. [1](${U.msca.fr})

N’attendez pas votre relevé d’emploi pour demander l’assurance-emploi; vous pouvez le faire dès que vous cessez de travailler. [2](${U.eiApply.fr})`,
    },
    followUps: {
      en: ['How do I apply for Employment Insurance?', 'How much will I get from EI?'],
      fr: ['Comment demander l’assurance-emploi?', 'Combien vais-je recevoir de l’assurance-emploi?'],
    },
  },
  {
    id: 'oas',
    priority: -1,
    match: [/\bold age security\b/i, /\bOAS\b/, /\bseniors?['’]? pension\b/i, /\bsécurité de la vieillesse\b/i, /\bSV\b/, /\bpension de (la )?vieillesse\b/i],
    reply: {
      en: `# You can start Old Age Security *at 65*, or delay it for a bigger payment.

You qualify at 65 if you’ve lived in Canada for at least 10 years since age 18 and meet the other conditions. [1](${U.oasElig.en})

Many people are enrolled automatically and get a letter around their 64th birthday. If it’s been a month since your 64th birthday and you have no letter, apply. [2](${U.oasApply.en})

Waiting pays: each month you delay after 65 raises your payment by 0.6%, up to 36% more at age 70. [3](${U.oasWhen.en})`,
      fr: `# Vous pouvez commencer à recevoir la Sécurité de la vieillesse *à 65 ans*, ou la reporter pour un montant plus élevé.

Vous y êtes admissible à 65 ans si vous avez vécu au Canada au moins 10 ans depuis l’âge de 18 ans et remplissez les autres conditions. [1](${U.oasElig.fr})

Beaucoup de personnes sont inscrites automatiquement et reçoivent une lettre vers leur 64e anniversaire. Si un mois s’est écoulé depuis votre 64e anniversaire sans lettre, présentez une demande. [2](${U.oasApply.fr})

Attendre est payant : chaque mois de report après 65 ans augmente votre paiement de 0,6 %, jusqu’à 36 % de plus à 70 ans. [3](${U.oasWhen.fr})`,
    },
    followUps: {
      en: ['When should I start my CPP?', 'How can I file my taxes for free?'],
      fr: ['Quand devrais-je commencer ma pension du RPC?', 'Comment produire ma déclaration gratuitement?'],
    },
  },
  {
    id: 'cpp',
    priority: -1,
    match: [/\b(canada pension plan|CPP)\b/i, /\bretirement pension\b/i, /\b(start|take|begin|collect)\b.*\bpension\b.*\b(early|60|70)\b/i, /\b(régime de pensions du canada|RPC)\b/i, /\bpension de retraite\b/i],
    reply: {
      en: `# You can start your CPP pension *any time from 60 to 70.*

Starting early lowers your payments by 0.6% a month, up to 36% less at 60. Waiting raises them by 0.7% a month after 65, up to 42% more at 70. There’s no benefit to waiting past 70. [1](${U.cppWhen.en})

The right age depends on your health, whether you’re still working, and your other income. The official page walks through each choice.`,
      fr: `# Vous pouvez commencer votre pension du RPC *à tout moment entre 60 et 70 ans.*

Commencer tôt réduit vos paiements de 0,6 % par mois, jusqu’à 36 % de moins à 60 ans. Attendre les augmente de 0,7 % par mois après 65 ans, jusqu’à 42 % de plus à 70 ans. Il n’y a aucun avantage à attendre après 70 ans. [1](${U.cppWhen.fr})

Le bon moment dépend de votre santé, de votre travail et de vos autres revenus. La page officielle explique chaque option.`,
    },
    followUps: {
      en: ['When can I start getting Old Age Security?', 'How can I file my taxes for free?'],
      fr: ['Quand puis-je commencer à recevoir la Sécurité de la vieillesse?', 'Comment produire ma déclaration gratuitement?'],
    },
  },
  {
    id: 'travel-advisory',
    priority: -1,
    match: [
      /\b(safe|safety|dangerous|advisory|advisories|risk\w*|warning)\b.*\b(travel\w*|trip|go(ing)?|visit\w*|vacation|holiday)\b/i,
      /\b(travel\w*|trip|go(ing)?|visit\w*|vacation|holiday)\b.*\b(safe|dangerous|advisory|advisories|warnings?)\b/i,
      /\btravel advi(ce|sory|sories)\b/i,
      /\bcan (i|we) (travel|go) to\b/i,
      /\b(puis-je|peut-on|pouvons-nous|est-ce que je peux)\b.*\b(voyager|aller)\b/i,
      /\b(sécuritaire|sûr|sans danger|dangereux|avertissements?|conseils?|risques?)\b.*\b(voyag\w*|aller|visiter|vacances)\b/i,
      /\b(voyag\w*|aller|visiter|vacances)\b.*\b(sécuritaire|sûr|sans danger|dangereux|risques?|avertissements?)\b/i,
    ],
    reply: {
      en: `# {headline}

{body}

Advisories can change quickly. Check again before you book and before you leave, and register as a Canadian abroad to get updates. [1]({url} "{urlTitle}")`,
      fr: `# {headline}

{body}

Les avertissements peuvent changer rapidement. Vérifiez-les avant de réserver et avant de partir, et inscrivez-vous comme Canadien à l’étranger pour recevoir les mises à jour. [1]({url} "{urlTitle}")`,
    },
    vars: async ({ text, lang }) => {
      const a = await findAdvisory(text);
      if (!a) {
        return lang === 'fr'
          ? {
              headline: 'Consultez l’avertissement officiel *pour votre destination.*',
              body: 'Le gouvernement du Canada publie des conseils et avertissements pour chaque pays, avec un niveau de risque, les régions à éviter et les exigences d’entrée. Dites-moi votre destination et je vous donnerai son niveau actuel.',
              url: U.advisories.fr,
              urlTitle: 'Conseils aux voyageurs et avertissements',
            }
          : {
              headline: 'Check the official advisory *for your destination.*',
              body: 'The Government of Canada publishes travel advice for every country, with a risk level, regions to avoid and entry requirements. Tell me where you’re going and I’ll give you its current level.',
              url: U.advisories.en,
              urlTitle: 'Travel advice and advisories',
            };
      }
      const updated = longDate(a.updated, lang);
      return lang === 'fr'
        ? {
            headline: `${a.country.fr} : *${a.text.fr.replace(/\.$/, '')}.*`,
            body: `C’est l’avertissement officiel actuel du gouvernement du Canada pour ${a.country.fr}, mis à jour le ${updated}. La page officielle précise les régions visées, la sécurité, les exigences d’entrée et la santé.`,
            url: a.url.fr,
            urlTitle: `Conseils aux voyageurs : ${a.country.fr}`,
          }
        : {
            headline: `${a.country.en}: *${a.text.en.replace(/\.$/, '')}.*`,
            body: `That’s the Government of Canada’s current official advisory for ${a.country.en}, updated ${updated}. The official page covers affected regions, safety, entry requirements and health.`,
            url: a.url.en,
            urlTitle: `Travel advice: ${a.country.en}`,
          };
    },
    followUps: {
      en: ['How do I get help from a Canadian embassy abroad?', 'How do I renew my passport?'],
      fr: ['Comment obtenir l’aide d’une ambassade canadienne à l’étranger?', 'Comment renouveler mon passeport?'],
    },
  },
  {
    id: 'recalls-vehicle',
    priority: -0.5,
    match: [
      /\b(car|vehicle|truck|tires?|car seat|child seat|booster seat)\b.*\brecall/i,
      /\brecall\w*\b.*\b(car|vehicle|truck|tires?|car seat|child seat|booster seat)\b/i,
      /\b(auto|voiture|véhicule|camion|pneus?|siège d[’']auto|siège pour enfant|siège d[’']appoint)\b.*\brappel/i,
      /\brappel\w*\b.*\b(voiture|véhicule|camion|pneus?|siège d[’']auto|siège pour enfant)\b/i,
    ],
    reply: {
      en: `# Look it up in *Transport Canada’s recalls database.*

Transport Canada keeps the official record of safety recalls for vehicles, tires and child car seats. You can search by make and model, or by your vehicle identification number (VIN), and sign up for recall alerts. [1](${U.vehicleRecalls.en})

If you notice a safety problem with your vehicle, tire or car seat, you can report it on the same page.`,
      fr: `# Vérifiez dans *la base de données des rappels de Transports Canada.*

Transports Canada tient le registre officiel des rappels de sécurité pour les véhicules, les pneus et les sièges d’auto pour enfants. Vous pouvez chercher par marque et modèle ou par numéro d’identification du véhicule (NIV), et vous abonner aux alertes de rappel. [1](${U.vehicleRecalls.fr})

Si vous constatez un problème de sécurité avec votre véhicule, un pneu ou un siège d’auto, vous pouvez le signaler sur la même page.`,
    },
    followUps: {
      en: ['Are there any recent product recalls?', 'We’re having a baby. What should we apply for?'],
      fr: ['Y a-t-il des rappels de produits récents?', 'Nous attendons un bébé. Que devons-nous demander?'],
    },
  },
  {
    id: 'recalls',
    priority: -1,
    match: [/\brecall(s|ed)?\b/i, /\brappels? (de produits?|d[’']aliments?|récents?)\b/i, /\b(a|ont) été rappelée?s?\b/i, /\b(produit|aliment|jouet)s?\b.*\brappel/i],
    reply: {
      en: `# Recent recalls are listed *on one official site.*

Recalls and safety alerts for food, health products, consumer products and vehicles are all published on the Government of Canada’s recalls site. Search by product or brand, or browse the latest by category. [1](${U.recalls.en})

For cars, tires or child car seats, you can also search Transport Canada’s database by make and model or VIN. [2](${U.vehicleRecalls.en})`,
      fr: `# Les rappels récents sont réunis *sur un seul site officiel.*

Les rappels et avis de sécurité pour les aliments, les produits de santé, les produits de consommation et les véhicules sont tous publiés sur le site des rappels du gouvernement du Canada. Cherchez par produit ou par marque, ou parcourez les plus récents par catégorie. [1](${U.recalls.fr})

Pour les voitures, les pneus ou les sièges d’auto pour enfants, vous pouvez aussi chercher dans la base de données de Transports Canada par marque et modèle ou par NIV. [2](${U.vehicleRecalls.fr})`,
    },
    followUps: {
      en: ['Was my car seat recalled?', 'What can you help me with?'],
      fr: ['Mon siège d’auto a-t-il été rappelé?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'citizenship',
    priority: -1,
    match: [/\bcitizenship\b/i, /\bbecome (a )?(canadian )?citizen\b/i, /\bcitoyenneté/i, /\bdevenir citoyen/i],
    reply: {
      en: `# You need *1,095 days* in Canada in the last 5 years, among other requirements.

To apply for Canadian citizenship as an adult, you generally must: [1](${U.citizenship.en})

- Have permanent resident status.
- Have been physically present in Canada for at least 1,095 days (3 years) in the 5 years before you apply, including at least 730 days as a permanent resident.
- Have filed taxes for at least 3 of those 5 years, if you had to.
- If you’re 18 to 54, show you can speak and listen in English or French at a basic level, and pass the citizenship test.

The official page has a calculator for your days in Canada.`,
      fr: `# Il faut *1 095 jours* au Canada au cours des 5 dernières années, entre autres exigences.

Pour demander la citoyenneté canadienne à l’âge adulte, vous devez généralement : [1](${U.citizenship.fr})

- Avoir le statut de résident permanent.
- Avoir été effectivement présent au Canada au moins 1 095 jours (3 ans) au cours des 5 années précédant votre demande, dont au moins 730 jours comme résident permanent.
- Avoir produit vos déclarations de revenus pendant au moins 3 de ces 5 années, si vous deviez le faire.
- Si vous avez de 18 à 54 ans, démontrer vos compétences de base en français ou en anglais et réussir l’examen pour la citoyenneté.

La page officielle propose un calculateur pour vos jours au Canada.`,
    },
    followUps: {
      en: ['How do I find my family’s immigration records?', 'How do I renew my passport?'],
      fr: ['Comment trouver les dossiers d’immigration de ma famille?', 'Comment renouveler mon passeport?'],
    },
  },
  {
    id: 'baby',
    priority: -1,
    match: [
      /\b(having|had|expecting) a baby\b/i,
      /\b(new ?born|pregnan\w*|maternity|parental (leave|benefits?))\b/i,
      /\bbaby\b/i,
      /bébé/i,
      /\b(enceinte|grossesse|nouveau-né|naissance)/i,
      /\b(congé|prestations?) (de maternité|parentales?)\b/i,
    ],
    reply: {
      en: `# Congratulations! Three things to set up *around the birth.*

- **Register the birth** with your province or territory. You can often apply for the Canada Child Benefit at the same time, without sending proof of birth. [1](${U.ccbHow.en})
- **Canada Child Benefit**: a tax-free monthly payment for families with children under 18. Apply as soon as your baby is born. [1](${U.ccbHow.en})
- **EI maternity and parental benefits**: if you qualify, you can get paid time off. Parents choose standard or extended parental benefits, which sets the number of weeks and the weekly amount. [2](${U.eiParental.en})`,
      fr: `# Félicitations! Trois choses à prévoir *autour de la naissance.*

- **Enregistrez la naissance** auprès de votre province ou territoire. Vous pouvez souvent demander l’Allocation canadienne pour enfants en même temps, sans envoyer de preuve de naissance. [1](${U.ccbHow.fr})
- **Allocation canadienne pour enfants** : un paiement mensuel non imposable pour les familles ayant des enfants de moins de 18 ans. Faites la demande dès la naissance de votre bébé. [1](${U.ccbHow.fr})
- **Prestations de maternité et parentales de l’assurance-emploi** : si vous êtes admissible, vous pouvez recevoir un revenu pendant votre congé. Les parents choisissent les prestations parentales standards ou prolongées, ce qui détermine le nombre de semaines et le montant hebdomadaire. [2](${U.eiParental.fr})`,
    },
    followUps: {
      en: ['Am I eligible for the Canada Child Benefit?', 'How much is the Canada Education Savings Grant?'],
      fr: ['Suis-je admissible à l’Allocation canadienne pour enfants?', 'Combien donne la Subvention canadienne pour l’épargne-études?'],
    },
  },
  {
    id: 'gst-register',
    priority: -0.5,
    match: [
      /\bregist\w*\b.*\b(GST|HST)\b/i,
      /\b(GST|HST)\b.*\b(regist\w*|charge|collect)\b/i,
      /\bsmall supplier\b/i,
      /\binscri\w*\b.*\b(TPS|TVH)\b/i,
      /\b(TPS|TVH)\b.*\b(inscri\w*|percevoir|facturer|exiger)\b/i,
      /\bpetit fournisseur\b/i,
    ],
    reply: {
      en: `# Not until your sales pass *$30,000* over four calendar quarters.

Most businesses are “small suppliers” and don’t have to register for the GST/HST as long as their taxable sales stay at or under $30,000 over four consecutive calendar quarters. Once you go over, you must register. [1](${U.gstRegister.en})

Some people must register right away, whatever their sales: for example, self-employed taxi and commercial ride-sharing drivers. You can also choose to register voluntarily. [1](${U.gstRegister.en})`,
      fr: `# Pas avant que vos ventes dépassent *30 000 $* sur quatre trimestres civils.

La plupart des entreprises sont de « petits fournisseurs » et n’ont pas à s’inscrire à la TPS/TVH tant que leurs ventes taxables ne dépassent pas 30 000 $ sur quatre trimestres civils consécutifs. Dès que vous dépassez ce seuil, vous devez vous inscrire. [1](${U.gstRegister.fr})

Certaines personnes doivent s’inscrire tout de suite, peu importe leurs ventes : par exemple, les chauffeurs de taxi et de covoiturage commercial travailleurs autonomes. Vous pouvez aussi choisir de vous inscrire volontairement. [1](${U.gstRegister.fr})`,
    },
    followUps: {
      en: ['How can I file my taxes for free?', 'When is the tax filing deadline?'],
      fr: ['Comment produire ma déclaration gratuitement?', 'Quelle est la date limite pour produire ma déclaration?'],
    },
  },
  {
    id: 'veterans',
    priority: -1,
    match: [
      /\bveterans?\b/i,
      /\b(leave|leaving|left|release|released|releasing|transition\w*)\b.*\b(forces|military|CAF|army|navy|air force)\b/i,
      /\bvétéran\w*\b/i,
      /\banciens? combattants?\b/i,
      /\b(quitt\w*|libér\w*|transition|départ)\b.*\b(forces|armée|militaire)\b/i,
    ],
    reply: {
      en: `# Veterans Affairs Canada supports you *after you leave the Forces.*

Support includes financial benefits, health and mental health services, and help with the move to civilian life and work. The **Benefits Navigator** asks a few questions and shows the programs that may fit you. [1](${U.vacNavigator.en})

To talk it through, call Veterans Affairs Canada toll-free at **1-866-522-2122**, Monday to Friday, 8:30 to 4:30 local time. [2](${U.vacContact.en})`,
      fr: `# Anciens Combattants Canada vous soutient *après votre départ des Forces.*

Le soutien comprend des prestations financières, des services de santé et de santé mentale, et de l’aide pour la transition vers la vie et le travail civils. Le **Navigateur des avantages** vous pose quelques questions et présente les programmes qui pourraient vous convenir. [1](${U.vacNavigator.fr})

Pour en parler, appelez Anciens Combattants Canada sans frais au **1-866-522-2122**, du lundi au vendredi, de 8 h 30 à 16 h 30, heure locale. [2](${U.vacContact.fr})`,
    },
    followUps: {
      en: ['Find mental health support near me', 'What happens when I call 9-8-8?'],
      fr: ['Trouver du soutien en santé mentale près de chez moi', 'Que se passe-t-il quand j’appelle le 9-8-8?'],
    },
  },
  {
    id: 'weather',
    priority: -1,
    match: [
      /\bweather\b/i,
      /\b(warnings?|alerts?|watch(es)?)\b.*\b(near me|storm|heat|snow|rain|wind|smoke|wildfire|air quality)\b/i,
      /\b(forecast|air quality)\b/i,
      /\bmétéo\b/i,
      /\b(avertissements?|alertes?|veilles?)\b.*\b(tempête|chaleur|neige|pluie|vent|fumée|feux?)\b/i,
      /\b(prévisions?|qualité de l[’']air)\b/i,
    ],
    reply: {
      en: `# Official weather warnings are *live on weather.gc.ca.*

Environment and Climate Change Canada issues every official weather warning, watch and advisory in Canada. The map shows what’s in effect right now; enter your city for your local forecast and alerts. [1](${U.weather.en})

If a warning tells you to take action, follow the advice of local authorities.`,
      fr: `# Les avertissements météo officiels sont *en direct sur meteo.gc.ca.*

Environnement et Changement climatique Canada émet tous les avertissements, veilles et avis météorologiques officiels au Canada. La carte montre ceux qui sont en vigueur maintenant; entrez votre ville pour vos prévisions et alertes locales. [1](${U.weather.fr})

Si un avertissement vous demande d’agir, suivez les consignes des autorités locales.`,
    },
    followUps: {
      en: ['Is it safe to travel to Mexico right now?', 'How much is a Parks Canada pass?'],
      fr: ['Est-ce sécuritaire de voyager au Mexique en ce moment?', 'Combien coûte la carte d’entrée de Parcs Canada?'],
    },
  },
  {
    id: 'home-buyers-plan',
    priority: -1,
    match: [/\bRRSP\b.*\b(home|house|condo)\b/i, /\bhome buyers['’]? plan\b/i, /\bHBP\b/, /\bfirst (home|house)\b/i, /\bREER\b.*\b(maison|propriété|habitation|condo)\b/i, /\brégime d[’']accession à la propriété\b/i, /\bRAP\b/, /\bpremière (maison|propriété|habitation)\b/i],
    reply: {
      en: `# Yes. The Home Buyers’ Plan lets you withdraw *up to $60,000* from your RRSPs.

The Home Buyers’ Plan lets you take money out of your RRSPs to buy or build a qualifying home, and you pay it back to your RRSPs over time. [1](${U.hbp.en})

In most cases you must be a first-time home buyer, and there are rules about the home and when you buy it. [2](${U.hbpWho.en})`,
      fr: `# Oui. Le Régime d’accession à la propriété vous permet de retirer *jusqu’à 60 000 $* de vos REER.

Le Régime d’accession à la propriété vous permet de retirer des fonds de vos REER pour acheter ou construire une habitation admissible, puis de les rembourser dans vos REER au fil du temps. [1](${U.hbp.fr})

Dans la plupart des cas, vous devez être un acheteur d’une première habitation, et des règles s’appliquent à l’habitation et au moment de l’achat. [2](${U.hbpWho.fr})`,
    },
    followUps: {
      en: ['How can I file my taxes for free?', 'When is the tax filing deadline?'],
      fr: ['Comment produire ma déclaration gratuitement?', 'Quelle est la date limite pour produire ma déclaration?'],
    },
  },
  {
    id: 'caf-join',
    priority: -1,
    match: [/\bjoin\b.*\b(forces|military|army|navy|air force|CAF|reserves?)\b/i, /\b(enlist\w*|military recruit\w*)\b/i, /\bcareers? in the (forces|military)\b/i, /\b(joindre|rejoindre|enrôler|intégrer|entrer dans)\b.*\b(forces|armée|marine|aviation|réserve)\b/i, /\brecrutement militaire\b/i],
    reply: {
      en: `# You apply online at *forces.ca*, the official Canadian Armed Forces careers site.

Browse full-time and part-time (Reserve) careers, check the requirements for the job you want, and start your application online. [1](${U.cafCareers.en}) [2](${U.caf.en})`,
      fr: `# Vous postulez en ligne sur *forces.ca*, le site officiel des carrières des Forces armées canadiennes.

Parcourez les carrières à temps plein et à temps partiel (Réserve), vérifiez les exigences du poste qui vous intéresse et commencez votre demande en ligne. [1](${U.cafCareers.fr}) [2](${U.caf.fr})`,
    },
    followUps: {
      en: ['What support is there after I leave the Forces?', 'What can you help me with?'],
      fr: ['Quel soutien existe-t-il après mon départ des Forces?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'genealogy',
    priority: -1,
    match: [
      /\b(family|ancestors?|grand(parents?|mother|father)|genealog\w*)\b.*\b(records?|immigration|arriv\w*|history)\b/i,
      /\bimmigration records?\b/i,
      /\bpassenger lists?\b/i,
      /\b(ancêtres?|famille|généalog\w*|grands?-(parents|mère|père))\b.*\b(dossiers?|documents?|immigration|archives)\b/i,
      /\bdossiers? d[’']immigration\b/i,
      /\b(documents?|dossiers?|archives)\b.*\bimmigration\b.*\b(famille|ancêtres?|grands?-parents)\b/i,
    ],
    reply: {
      en: `# Library and Archives Canada holds *Canada’s immigration records.*

You can search passenger lists and other immigration records for free, all at once or by collection, to find when and where a relative arrived. The research guide explains which records cover which years. [1](${U.lacImmigration.en})`,
      fr: `# Bibliothèque et Archives Canada conserve *les dossiers d’immigration du Canada.*

Vous pouvez chercher gratuitement dans les listes de passagers et d’autres documents d’immigration, tous ensemble ou par collection, pour savoir quand et où un proche est arrivé. Le guide de recherche indique quelles années chaque source couvre. [1](${U.lacImmigration.fr})`,
    },
    followUps: {
      en: ['What do I need for citizenship?', 'What can you help me with?'],
      fr: ['De quoi ai-je besoin pour la citoyenneté?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'record-check',
    priority: -1,
    match: [/\bcriminal record( check)?\b/i, /\b(police|background|record) check\b/i, /\bvulnerable sector\b/i, /\bcasier judiciaire\b/i, /\bvérification\b.*\b(antécédents|secteur vulnérable)\b/i],
    reply: {
      en: `# Go to *your local police* or an RCMP-accredited fingerprinting company.

For a certified criminal record check, your local police service or a fingerprinting company accredited by the RCMP takes your fingerprints and sends the application. [1](${U.recordCheck.en})

Need a **vulnerable sector check** (to work or volunteer with children or vulnerable people)? Only your local police service can do that one. [1](${U.recordCheck.en})`,
      fr: `# Adressez-vous à *votre service de police local* ou à une entreprise de dactyloscopie accréditée par la GRC.

Pour une vérification de casier judiciaire certifiée, votre service de police local ou une entreprise de dactyloscopie accréditée par la GRC prend vos empreintes digitales et transmet la demande. [1](${U.recordCheck.fr})

Il vous faut une **vérification des antécédents en vue d’un travail auprès de personnes vulnérables**? Seul votre service de police local peut la faire. [1](${U.recordCheck.fr})`,
    },
    followUps: {
      en: ['What do I need for citizenship?', 'What can you help me with?'],
      fr: ['De quoi ai-je besoin pour la citoyenneté?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'help-abroad',
    priority: -1,
    match: [
      /\b(embassy|embassies|consulate|consular)\b/i,
      /\b(help|emergency|trouble|arrested|lost|stolen)\b.*\babroad\b/i,
      /\babroad\b.*\b(help|emergency)\b/i,
      /\b(ambassade|consulat|consulaire)\b/i,
      /\bà l[’']étranger\b.*\b(aide|urgence|arrêté|perdu|volé)\b/i,
      /\b(aide|urgence)\b.*\bà l[’']étranger\b/i,
    ],
    reply: {
      en: `# In an emergency abroad, contact Canada’s *24/7 Emergency Watch and Response Centre.*

- **Call**: +1 613 996 8885 (collect where available)
- **Email**: SOS@international.gc.ca
- **Text**: +1 613 686 3658 · **WhatsApp**: +1 613 909 8881

The centre connects you with consular officials, who can help Canadians in trouble outside Canada. It doesn’t handle immigration, permanent residence or visa questions. [1](${U.emergencyAbroad.en})`,
      fr: `# En cas d’urgence à l’étranger, contactez le *Centre de surveillance et d’intervention d’urgence*, ouvert 24 heures sur 24.

- **Téléphone** : +1 613 996 8885 (à frais virés si possible)
- **Courriel** : SOS@international.gc.ca
- **Texto** : +1 613 686 3658 · **WhatsApp** : +1 613 909 8881

Le centre vous met en contact avec des agents consulaires, qui peuvent aider les Canadiens en difficulté à l’extérieur du Canada. Il ne traite pas les questions d’immigration, de résidence permanente ou de visa. [1](${U.emergencyAbroad.fr})`,
    },
    followUps: {
      en: ['Is it safe to travel to Mexico right now?', 'How do I renew my passport?'],
      fr: ['Est-ce sécuritaire de voyager au Mexique en ce moment?', 'Comment renouveler mon passeport?'],
    },
  },
  {
    id: 'resp-grant',
    priority: -1,
    match: [/\b(canada education savings grant|CESG|RESP)\b/i, /\beducation savings\b/i, /\bsubvention canadienne pour l[’']épargne-études\b/i, /\b(SCEE|REEE)\b/, /\bépargne-études\b/i],
    reply: {
      en: `# The grant adds *20% of the first $2,500* you put in an RESP each year: up to $500.

The Canada Education Savings Grant is paid into your child’s RESP. Families with low or middle incomes can get an extra 10% or 20% on the first $500 contributed each year. The lifetime maximum is **$7,200** per child. [1](${U.resp.en})

Children from lower-income families may also qualify for the Canada Learning Bond, with no contribution needed. [1](${U.resp.en})`,
      fr: `# La subvention ajoute *20 % des premiers 2 500 $* versés dans un REEE chaque année : jusqu’à 500 $.

La Subvention canadienne pour l’épargne-études est versée dans le REEE de votre enfant. Les familles à revenu faible ou moyen peuvent recevoir 10 % ou 20 % de plus sur les premiers 500 $ versés chaque année. Le maximum à vie est de **7 200 $** par enfant. [1](${U.resp.fr})

Les enfants de familles à faible revenu peuvent aussi avoir droit au Bon d’études canadien, sans cotisation requise. [1](${U.resp.fr})`,
    },
    followUps: {
      en: ['Am I eligible for the Canada Child Benefit?', 'We’re having a baby. What should we apply for?'],
      fr: ['Suis-je admissible à l’Allocation canadienne pour enfants?', 'Nous attendons un bébé. Que devons-nous demander?'],
    },
  },
  {
    id: 'research-funding',
    priority: -1,
    match: [/\bresearch\b.*\b(grants?|funding|fund)\b/i, /\b(NSERC|SSHRC|CIHR)\b/, /\b(subventions?|financement)\b.*\brecherche\b/i, /\b(CRSNG|CRSH|IRSC)\b/],
    reply: {
      en: `# Most federal research funding goes through *three granting agencies.*

The Canadian Institutes of Health Research (health), the Natural Sciences and Engineering Research Council (science and engineering) and the Social Sciences and Humanities Research Council (social sciences and humanities) fund researchers, usually through an eligible university, college or institution. The official page lists programs and awards across government. [1](${U.research.en})`,
      fr: `# La plupart du financement fédéral de la recherche passe par *trois organismes subventionnaires.*

Les Instituts de recherche en santé du Canada (santé), le Conseil de recherches en sciences naturelles et en génie (sciences et génie) et le Conseil de recherches en sciences humaines (sciences sociales et humaines) financent les chercheurs, généralement par l’entremise d’une université, d’un collège ou d’un établissement admissible. La page officielle présente les programmes et prix de l’ensemble du gouvernement. [1](${U.research.fr})`,
    },
    followUps: {
      en: ['How can I file my taxes for free?', 'What can you help me with?'],
      fr: ['Comment produire ma déclaration gratuitement?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'parks-pass',
    priority: -1,
    match: [/\b(discovery pass|parks canada)\b/i, /\bparks? pass\b/i, /\bnational parks?\b.*\b(pass|fee|fees|cost|admission|price)\b/i, /\b(laissez-passer découverte|parcs canada)\b/i, /\bparcs? nationa(l|ux)\b.*\b(laissez-passer|droits|prix|entrée|coût)\b/i],
    reply: {
      en: `# A Discovery Pass covers *more than 80 destinations* for 12 months.

The annual Parks Canada Discovery Pass covers admission to more than 80 Parks Canada destinations and saves time at the gate. Current prices and the online store are on the official page. [1](${U.parks.en})

Note: the free-admission Canada Strong Pass ended on September 7, 2026. Regular fees apply again. [1](${U.parks.en})`,
      fr: `# La carte d’entrée Découverte donne accès à *plus de 80 destinations* pendant 12 mois.

La carte annuelle Découverte de Parcs Canada donne accès à plus de 80 destinations de Parcs Canada et vous fait gagner du temps à l’entrée. Les prix en vigueur et la boutique en ligne sont sur la page officielle. [1](${U.parks.fr})

À noter : le laissez-passer Un Canada fort, qui offrait l’entrée gratuite, a pris fin le 7 septembre 2026. Les droits réguliers s’appliquent de nouveau. [1](${U.parks.fr})`,
    },
    followUps: {
      en: ['What’s the weather forecast?', 'Is it safe to travel to Mexico right now?'],
      fr: ['Quelles sont les prévisions météo?', 'Est-ce sécuritaire de voyager au Mexique en ce moment?'],
    },
  },
];

/*
 * Other languages: the same intents in Canada's most common other home languages. The answer opens
 * with a note in that language and continues in English, with the widget and sources.
 */
const INTL: Record<string, RegExp[]> = {
  ccb: [/إعانة\s*الطفل|اعانة الطفل|کمک هزینه فرزند|بچوں کا الاؤنس/, /牛奶金|儿童福利金|兒童福利金/, /ਚਾਈਲਡ ਬੈਨੀਫਿਟ|बाल लाभ/, /\b(beneficio|subsidio) (por|para) (hijos|niños)\b/i],
  'taxes-file': [/ضريبة|ضرائب|مالیات|ٹیکس/, /报税|報稅|税表|稅表/, /ਟੈਕਸ|टैक्स|કર/, /세금/, /налог/i, /\bimpuestos\b/i],
  'ei-regular': [/تأمين العمل|بیمه بیکاری|بے روزگاری/, /失业保险|失業保險|EI/, /ਬੇਰੁਜ਼ਗਾਰੀ|बेरोज़गारी/, /고용보험/, /\bseguro de empleo\b/i],
  'travel-advisory': [/السفر|مسافرت|سفر/, /旅行警告|旅遊警告|旅游/, /ਯਾਤਰਾ|यात्रा/, /여행/, /поездк|путешеств/i],
  oas: [/الشيخوخة|سالمندی|بڑھاپے/, /老年保障|養老金|养老金/, /ਬੁਢਾਪਾ|वृद्धावस्था/],
  citizenship: [/الجنسية|تابعیت|شہریت/, /入籍|公民/, /ਨਾਗਰਿਕਤਾ|नागरिकता/, /시민권/, /гражданств|громадянств/i, /\bciudadanía\b/i],
};
for (const s of starters) if (INTL[s.id]) s.matchIntl = INTL[s.id];

export default starters;
