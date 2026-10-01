/**
 * Scenario families (server only): one scripted answer per priority allergen and per common drug brand, for
 * recall questions and for Drug Product Database lookups, so each answer's follow-ups name the brand that was
 * asked about and the next step. Listed in scenarios/health.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from './data';
import { drugVars } from './scenario-drugs';
import { ALLERGEN, DRUG_WORDS, drugQueryOf, recallQueryOf, type Ctx } from './scenario-queries';
import { recallsVars } from './scenario-vars';

type AllergenRoute = { id: string; words: string; ask: { en: string; fr: string } };
/** Priority allergens as the widget's chips ask about them (same wording as widgets/health/messages). */
const ALLERGEN_ROUTES: AllergenRoute[] = [
  { id: 'peanut', words: 'peanuts?|arachides?', ask: { en: 'Any recalls for undeclared peanut?', fr: 'Y a-t-il des rappels pour de l’arachide non déclarée?' } },
  { id: 'milk', words: 'milk|lait', ask: { en: 'Any recalls for undeclared milk?', fr: 'Y a-t-il des rappels pour du lait non déclaré?' } },
  { id: 'egg', words: 'eggs?|œufs?|oeufs?', ask: { en: 'Any recalls for undeclared egg?', fr: 'Y a-t-il des rappels pour de l’œuf non déclaré?' } },
  { id: 'sesame', words: 'sesame|sésame', ask: { en: 'Any recalls for undeclared sesame?', fr: 'Y a-t-il des rappels pour du sésame non déclaré?' } },
  { id: 'soy', words: 'soy|soya|soja', ask: { en: 'Any recalls for undeclared soy?', fr: 'Y a-t-il des rappels pour du soja non déclaré?' } },
  { id: 'gluten', words: 'gluten|wheat|blé', ask: { en: 'Any recalls for undeclared gluten?', fr: 'Y a-t-il des rappels pour du gluten non déclaré?' } },
  { id: 'tree-nuts', words: 'tree ?nuts?|nuts?|noix', ask: { en: 'Any recalls for undeclared tree nuts?', fr: 'Y a-t-il des rappels pour des noix non déclarées?' } },
  { id: 'mustard', words: 'mustard|moutarde', ask: { en: 'Any recalls for undeclared mustard?', fr: 'Y a-t-il des rappels pour de la moutarde non déclarée?' } },
];

/**
 * Allergen questions (often from the widget's allergen chips): the same live search, opened on that allergen's
 * notices. Follow-ups move on (the next allergen, reporting, the latest recalls) instead of repeating the
 * allergen just asked about or the alerts sign-up the answer already links.
 */
function allergenScenario(a: AllergenRoute, i: number): Scenario {
  const next = ALLERGEN_ROUTES[(i + 1) % ALLERGEN_ROUTES.length].ask;
  const w = `(?<!\\p{L})(?:${a.words})(?!\\p{L})`;
  return {
    id: `health-recalls-allergen-${a.id}`,
    priority: 4,
    match: [new RegExp(`\\b(recall\\w*|rappel\\w*|undeclared)\\b.*${w}`, 'iu'), new RegExp(`${w}.*\\b(recall\\w*|rappel\\w*)`, 'iu')],
    exclude: [/\b(car seats?|si[èe]ges? d['’]auto)\b/i],
    reply: {
      en: `# {headEn}

When a food has an allergen that isn’t on its label, the Canadian Food Inspection Agency posts a recall or warning on the official Recalls site. Match the brand, size and UPC or lot code before you throw anything out. [1](${URLS.recalls.en})

You can also get email alerts for a specific allergen, as soon as they’re posted or in a daily digest. [2](${URLS.recallsSubscribe.en} "Get email alerts about recalls") If you think a food made you sick or caused a reaction, contact a health care provider. [3](${URLS.reportConcern.en})

{bodyEn}`,
      fr: `# {headFr}

Quand un aliment contient un allergène qui n’est pas indiqué sur l’étiquette, l’Agence canadienne d’inspection des aliments publie un rappel ou une mise en garde sur le site officiel des rappels. Comparez la marque, le format et le CUP ou le code de lot avant de jeter quoi que ce soit. [1](${URLS.recalls.fr})

Vous pouvez aussi recevoir des alertes par courriel pour un allergène précis, dès leur publication ou dans un condensé quotidien. [2](${URLS.recallsSubscribe.fr} "Recevoir des alertes par courriel sur les rappels") Si vous pensez qu’un aliment vous a rendu malade ou a causé une réaction, consultez un professionnel de la santé. [3](${URLS.reportConcern.fr})

{bodyFr}`,
    },
    vars: (ctx: Ctx) => recallsVars(ctx, true),
    toolCalls: [{ toolName: 'healthRecalls', input: ({ text, lang }: Ctx) => ({ query: recallQueryOf(text) ?? undefined, allergen: true, lang }) }],
    followUps: {
      en: [next.en, 'How do I report a food safety concern?', 'Are there any recent recalls?'],
      fr: [next.fr, 'Comment signaler un problème de salubrité alimentaire?', 'Y a-t-il des rappels récents?'],
    },
  };
}

/**
 * Common drug brands in the Drug Product Database (checked 2026-09-30), so "Has Advil been recalled?" gets
 * drug follow-ups ("Is Advil approved in Canada?", reporting a side effect) instead of food and car seats.
 */
const DRUG_BRANDS = [
  'Advil', 'Tylenol', 'Motrin', 'Aleve', 'Aspirin', 'Benadryl', 'Reactine', 'Claritin', 'Aerius', 'Allegra', 'Gravol', 'Imodium',
  'Tums', 'NyQuil', 'DayQuil', 'Robitussin', 'Sudafed', 'Voltaren', 'Ozempic', 'Wegovy', 'Mounjaro', 'Lipitor', 'Crestor',
  'Synthroid', 'Ventolin', 'Nexium', 'Zantac', 'Xarelto', 'Eliquis', 'Jardiance', 'Concerta', 'Vyvanse', 'EpiPen',
];

function drugRecallScenario(brand: string | null): Scenario {
  const recall = '(?=.*\\b(?:recall\\w*|rappel\\w*)\\b)';
  return {
    id: brand ? `health-recalls-drug-${brand.toLowerCase()}` : 'health-recalls-drug',
    priority: 5,
    match: brand ? [new RegExp(`${recall}.*\\b${brand}\\b`, 'i')] : [new RegExp(`${recall}.*${DRUG_WORDS.source}`, 'i')],
    exclude: [/\b(car seats?|si[èe]ges? d['’]auto|vehicles?|v[ée]hicules?)\b/i, new RegExp(ALLERGEN, 'iu')],
    reply: {
      en: `# {headEn}

Health Canada posts recalls and safety alerts for drugs and other health products on the official Recalls site as soon as they’re issued. A recall usually covers specific lots, so compare the DIN, strength and lot number on your package with the notice. [1](${URLS.recalls.en})

Follow what the notice says. For a prescription drug, notices often advise against stopping it before you talk to your pharmacist or health care professional. If you think a drug caused a side effect, you can report it to Health Canada. [1](${URLS.recalls.en}) [2](${URLS.sideEffect.en} "Report a side effect of a health product")

{bodyEn}`,
      fr: `# {headFr}

Santé Canada publie les rappels et avis de sécurité visant les médicaments et les autres produits de santé sur le site officiel des rappels, dès leur diffusion. Un rappel vise habituellement des lots précis : comparez le DIN, la concentration et le numéro de lot sur votre emballage avec l’avis. [1](${URLS.recalls.fr})

Suivez les consignes de l’avis. Pour un médicament sur ordonnance, les avis recommandent souvent de ne pas cesser de le prendre avant d’en parler à votre pharmacien ou à un professionnel de la santé. Si vous pensez qu’un médicament a causé un effet secondaire, vous pouvez le déclarer à Santé Canada. [1](${URLS.recalls.fr}) [2](${URLS.sideEffect.fr} "Signaler un effet secondaire d’un produit de santé")

{bodyFr}`,
    },
    vars: (ctx: Ctx) => recallsVars(ctx),
    toolCalls: [{ toolName: 'healthRecalls', input: ({ text, lang }: Ctx) => ({ query: recallQueryOf(text) ?? undefined, lang }) }],
    followUps: brand
      ? {
          en: [`Is ${brand} approved in Canada?`, 'How do I report a side effect?', 'Are there any recent recalls?'],
          fr: [`${brand} est-il autorisé au Canada?`, 'Comment signaler un effet secondaire?', 'Y a-t-il des rappels récents?'],
        }
      : {
          en: ['How do I report a side effect?', 'Is Tylenol approved in Canada?', 'Are there any recent recalls?'],
          fr: ['Comment signaler un effet secondaire?', 'Tylenol est-il autorisé au Canada?', 'Y a-t-il des rappels récents?'],
        },
  };
}

export const allergenScenarios: Scenario[] = ALLERGEN_ROUTES.map(allergenScenario);
export const drugRecallScenarios: Scenario[] = [...DRUG_BRANDS.map(drugRecallScenario), drugRecallScenario(null)];

const DRUG_LOOKUP_MATCH = [
  /\b(approved|authori[sz]ed|legal|available|sold|licen[sc]ed)\b.*\bin canada\b/i,
  /\bDIN\b\s*:?\s*\d{8}\b/i,
  /\bdrug product database\b/i,
  /\b(active )?ingredients? (in|of)\b/i,
  /\b(needs?|requires?) a prescription\b/i,
  /\bprescription[- ]only\b/i,
  /(approuv|autoris|vendu|en vente|offert|disponible|homologu)\S*\s.*\bau canada\b/i,
  /\bbase de donn[ée]es sur les produits pharmaceutiques\b/i,
  /ingrédients? (actifs? )?(d[eu]s?\s|d['’]|dans\s)/i,
  /(nécessite|exige|requiert)(-t-(il|elle))? une ordonnance/i,
  /\bordonnance pour\b/i,
];

/**
 * A Drug Product Database lookup. One scenario per common brand, so the follow-ups ask about the brand the
 * person named ("Has Ozempic been recalled?"), and a general one for any other name or a DIN, whose follow-ups
 * name no brand and don't offer another DIN lookup.
 */
function drugLookupScenario(brand: string | null): Scenario {
  return {
    id: brand ? `health-drug-${brand.toLowerCase()}` : 'health-drug',
    priority: brand ? 6 : 5,
    match: brand ? DRUG_LOOKUP_MATCH.map((re) => new RegExp(`^(?=[\\s\\S]*\\b${brand}\\b)[\\s\\S]*?(?:${re.source})`, 'i')) : DRUG_LOOKUP_MATCH,
    exclude: [/\b(passport|passeport|citizen|citoyen|visa|work permit|permis|vehicle|véhicule|drone|car|voiture|recall\w*|rappel\w*)\b/i],
    reply: {
      en: `# {head}

Every drug authorized for sale in Canada gets an 8-digit Drug Identification Number (DIN). It’s printed on the label of prescription and over-the-counter drugs, and a drug sold without one isn’t in compliance with Canadian law. [1](${URLS.din.en} "Drug Identification Number (DIN)")

The database is updated nightly and shows whether a drug is available in Canada, its ingredients and its product monograph. [2](${URLS.dpdAbout.en} "Drug Product Database: Access the database")

This is information, not medical advice. Ask a pharmacist about dosage or interactions.

{intro}`,
      fr: `# {head}

Chaque médicament autorisé à la vente au Canada reçoit un numéro d’identification du médicament (DIN) à 8 chiffres. Il figure sur l’étiquette des médicaments sur ordonnance et en vente libre, et un médicament vendu sans DIN n’est pas conforme à la loi canadienne. [1](${URLS.din.fr} "Numéro d’identification d’un médicament (DIN)")

La base de données est mise à jour chaque nuit et indique si un médicament est offert au Canada, ses ingrédients et sa monographie. [2](${URLS.dpdAbout.fr} "Base de données sur les produits pharmaceutiques : Accéder à la base de données")

Il s’agit d’information, pas d’un avis médical. Consultez un pharmacien au sujet de la posologie ou des interactions.

{intro}`,
    },
    vars: drugVars,
    toolCalls: [{ toolName: 'healthDrugLookup', input: ({ text, lang }: Ctx) => ({ query: drugQueryOf(text), lang }) }],
    followUps: brand
      ? {
          en: [`Has ${brand} been recalled?`, 'How do I report a side effect?', 'Am I eligible for the dental care plan?'],
          fr: [`Y a-t-il un rappel pour ${brand}?`, 'Comment signaler un effet secondaire?', 'Suis-je admissible au régime de soins dentaires?'],
        }
      : {
          en: ['How do I report a side effect?', 'Are there any recent recalls?', 'Am I eligible for the dental care plan?'],
          fr: ['Comment signaler un effet secondaire?', 'Y a-t-il des rappels récents?', 'Suis-je admissible au régime de soins dentaires?'],
        },
  };
}

export const drugLookupScenarios: Scenario[] = [...DRUG_BRANDS.map(drugLookupScenario), drugLookupScenario(null)];
