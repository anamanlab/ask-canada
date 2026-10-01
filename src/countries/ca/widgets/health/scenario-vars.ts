/**
 * The parts of a scripted health answer that are worded on the result (server only): the verdict heading for
 * recalls and the dental plan (drugs: ./scenario-drugs.ts, travel: ./scenario-travel-vars.ts). Each shares its fetch with the
 * tool call (the short memo in ./live-shared.ts), so the text never promises what the widget can't show.
 */
import { checkDental } from './dental';
import { CDCP, URLS } from './data';
import { liveRecalls } from './live-recalls';
import { allergenNotices } from './recalls';
import { deFr, moneyFr, monthYear, NB, pctFr, typoFr } from './scenario-fr';
import { dentalInputOf, recallQueryOf, type Ctx } from './scenario-queries';

type Vars = Record<string, string>;

/** Whole days from a to b (YYYY-MM-DD). */
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/**
 * Heading and closing line for a recalls answer, worded on the live result (shared with the tool call through
 * liveRecalls' short memo), so the text never promises notices the widget can't show. For a product, brand or
 * allergen, the heading is a verdict on how recent the notices are ("2 notices in the last 30 days", "No recent
 * recalls: the last notice was in October 2021"), so an old "Recall" badge isn't read as a current recall.
 */
export async function recallsVars({ text, lang }: Ctx, allergen = false): Promise<Vars> {
  const asked = recallQueryOf(text);
  const out = await liveRecalls({ query: asked ?? undefined, lang }).catch(() => null);
  if (!out?.live) {
    return {
      headEn: 'The Recalls site didn’t answer just now. *Search it directly.*',
      headFr: 'Le site des rappels n’a pas répondu. *Cherchez-y directement.*',
      bodyEn: 'Use the button below to open the same search on the official site, where every notice is listed as soon as it’s published.',
      bodyFr: 'Utilisez le bouton ci-dessous pour ouvrir la même recherche sur le site officiel, où chaque avis est publié dès sa diffusion.',
    };
  }
  if (!asked) {
    return {
      headEn: 'Here are the *latest* recalls and safety alerts.',
      headFr: 'Voici les *derniers* rappels et avis de sécurité.',
      bodyEn: 'Filter by category below, or check a product or an allergen.',
      bodyFr: 'Filtrez par catégorie ci-dessous, ou vérifiez un produit ou un allergène.',
    };
  }
  if (out.items.length === 0) {
    // Nothing matched is never good news about a product: say only what was searched, and what to try next.
    return {
      headEn: `The Recalls site has no notices that mention *${asked}*.`,
      headFr: `Le site des rappels n’a aucun avis qui mentionne «${NB}*${asked}*${NB}».`,
      bodyEn: 'Nothing matched that wording. That doesn’t mean a product is safe: a notice may use another product or company name. Try the brand name alone below, or search the official site by UPC.',
      bodyFr: `Rien ne correspond à ces mots. Cela ne veut pas dire qu’un produit est sûr${NB}: un avis peut utiliser un autre nom de produit ou d’entreprise. Essayez le nom de la marque seul ci-dessous, ou cherchez par CUP sur le site officiel.`,
    };
  }
  // The exact words found nothing and the tool widened the search (see fetchRecalls): the answer is worded on
  // the search the notices come from, and says so first.
  const q = out.query ?? asked;
  const qFr = `«${NB}${q}${NB}»`;
  const wide = out.broadened;
  const wideEn = !wide ? '' : wide.any ? `No notice has the exact words “${wide.from}”, so these are the notices that mention any of those words. ` : `No notice has the exact words “${wide.from}”, so I searched for “${q}” instead. `;
  const wideFr = !wide
    ? ''
    : wide.any
      ? `Aucun avis ne contient les mots exacts «${NB}${wide.from}${NB}»${NB}: voici les avis qui mentionnent l’un ou l’autre de ces mots. `
      : `Aucun avis ne contient les mots exacts «${NB}${wide.from}${NB}»${NB}: j’ai donc cherché ${qFr}. `;
  // An allergen question: the widget opens on the notices about that allergen undeclared (see RecallsWidget).
  const list = allergen ? allergenNotices(out.items, q) : out.items;
  const split = allergen && list.length > 0 && list.length < out.items.length;
  const restEn = split ? ` Other notices that mention ${q}, such as a recall for bacteria or another allergen, are under “All”.` : '';
  const restFr = split ? ` Les autres avis qui mentionnent ${qFr}, par exemple un rappel pour une bactérie ou un autre allergène, sont sous «${NB}Tous${NB}».` : '';
  if (list.length === 0) {
    return {
      headEn: `None of the newest notices that mention *${q}* is about an undeclared allergen.`,
      headFr: `Aucun des avis récents qui mentionnent «${NB}*${q}*${NB}» ne porte sur un allergène non déclaré.`,
      bodyEn: `${wideEn}They’re listed below, for example recalls for bacteria. The official site has older notices too.`,
      bodyFr: `${wideFr}Ils sont présentés ci-dessous, par exemple des rappels pour une bactérie. Le site officiel présente aussi les avis plus anciens.`,
    };
  }
  const today = out.fetchedAt.slice(0, 10);
  const recent = list.filter((i) => days(i.date, today) <= 30).length;
  const age = days(list[0].date, today);
  const more = !allergen && recent === out.items.length && out.total > recent ? '+' : '';
  if (recent > 0) {
    const nEn = `${recent}${more} ${recent === 1 && !more ? 'notice' : 'notices'}`;
    return {
      headEn: allergen ? `*${nEn}* about undeclared ${q} in the last 30 days.` : `*${nEn}* for ${q} in the last 30 days.`,
      headFr: allergen
        ? `*${recent}${more} avis* sur un allergène non déclaré ${recent === 1 && !more ? 'mentionne' : 'mentionnent'} ${qFr} au cours des 30 derniers jours.`
        : `*${recent}${more} avis* pour ${qFr} au cours des 30 derniers jours.`,
      bodyEn: `${wideEn}The newest are first. Open one to see the product, what to do and where it was sold.${restEn}`,
      bodyFr: `${wideFr}Les plus récents sont en premier. Ouvrez-en un pour voir le produit, quoi faire et où il a été vendu.${restFr}`,
    };
  }
  const [mEn, mFr] = [monthYear(list[0].date, 'en'), monthYear(list[0].date, 'fr')];
  if (age <= 365) {
    return {
      headEn: allergen ? `No notices about undeclared *${q}* in the last 30 days: the latest is from ${mEn}.` : `No new notices for *${q}* in the last 30 days: the latest is from ${mEn}.`,
      headFr: allergen
        ? `Aucun avis sur un allergène non déclaré ne mentionne «${NB}*${q}*${NB}» depuis 30 jours${NB}: le plus récent date ${deFr(mFr)}.`
        : `Aucun nouvel avis pour «${NB}*${q}*${NB}» depuis 30 jours${NB}: le plus récent date ${deFr(mFr)}.`,
      bodyEn: `${wideEn}Earlier notices are listed below, newest first. Open one to check whether it matches your product.${restEn}`,
      bodyFr: `${wideFr}Les avis antérieurs sont présentés ci-dessous, du plus récent au plus ancien. Ouvrez-en un pour vérifier s’il correspond à votre produit.${restFr}`,
    };
  }
  return {
    headEn: allergen ? `No recent notices about undeclared *${q}*: the last one was in ${mEn}.` : `No recent recalls for *${q}*: the last notice was in ${mEn}.`,
    headFr: allergen
      ? `Aucun avis récent sur un allergène non déclaré ne mentionne «${NB}*${q}*${NB}»${NB}: le dernier date ${deFr(mFr)}.`
      : `Aucun rappel récent pour «${NB}*${q}*${NB}»${NB}: le dernier avis date ${deFr(mFr)}.`,
    bodyEn: `${wideEn}Older notices are listed below, newest first. Open one to check whether it matches your product.${restEn}`,
    bodyFr: `${wideFr}Les avis plus anciens sont présentés ci-dessous, du plus récent au plus ancien. Ouvrez-en un pour vérifier s’il correspond à votre produit.${restFr}`,
  };
}

export const moneyEn = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

/**
 * The dental answer, worded on the income the person gave ("We make $76,500"): the heading states their
 * co-payment and `mine` spells out the split, so the text uses the same figure the checker opens on. Without an
 * income, the general verdict.
 */
export function dentalVars(ctx: Ctx): Vars {
  const fr = ctx.lang === 'fr';
  const input = dentalInputOf(ctx);
  const income = input.familyIncome;
  if (income == null) {
    return {
      head: fr ? 'Si vous n’avez pas d’assurance dentaire, le *Régime canadien de soins dentaires* pourrait vous couvrir.' : 'If you have no dental insurance, the *Canadian Dental Care Plan* may cover you.',
      mine: '',
    };
  }
  const r = checkDental(input);
  // The requirements still to confirm (the income is known; "no dental insurance" may be too).
  const rest = r.unknown.length;
  if (r.copay == null || r.covered == null) {
    return fr
      ? {
          head: typoFr(`Avec un revenu de ${moneyFr(income)}, vous dépassez la *limite de ${moneyFr(CDCP.incomeLimit)}* du régime.`),
          mine: typoFr('\n\nC’est votre revenu familial net rajusté qui compte : il se calcule à partir de la ligne 23600 de vos déclarations de revenus, pas de votre salaire brut. Vérifiez-le avec le curseur ci-dessous.'),
        }
      : {
          head: `At ${moneyEn(income)}, you’re over the plan’s *${moneyEn(CDCP.incomeLimit)} income limit*.`,
          mine: '\n\nWhat counts is your adjusted family net income, which starts from line 23600 of your tax returns, not your gross pay. Check it with the slider below.',
        };
  }
  // The co-payment tiers are on the coverage page, cited as [2] in the answer.
  const ifEn = `if you meet the other ${rest} requirements. [2](${URLS.dentalCoverage.en} "What services are covered in the Canadian Dental Care Plan")`;
  const ifFr = `si vous remplissez les ${rest} autres exigences. [2](${URLS.dentalCoverage.fr} "Services couverts par le Régime canadien de soins dentaires")`;
  if (r.copay === 0) {
    return fr
      ? {
          head: typoFr(`Avec un revenu de ${moneyFr(income)}, le Régime canadien de soins dentaires paierait *${pctFr(100)}* de ses tarifs établis.`),
          mine: typoFr(`\n\nAvec un revenu familial net rajusté de ${moneyFr(income)}, vous n’auriez aucune quote-part, ${ifFr}`),
        }
      : {
          head: `At ${moneyEn(income)}, the Canadian Dental Care Plan would pay *100%* of its set fees.`,
          mine: `\n\nWith an adjusted family net income of ${moneyEn(income)}, you’d have no co-payment, ${ifEn}`,
        };
  }
  return fr
    ? {
        head: typoFr(`Avec un revenu de ${moneyFr(income)}, vous paieriez une *quote-part de ${pctFr(r.copay)}* au Régime canadien de soins dentaires.`),
        mine: typoFr(`\n\nAvec un revenu familial net rajusté de ${moneyFr(income)}, le régime paierait ${pctFr(r.covered)} de ses tarifs établis et vous paieriez ${pctFr(r.copay)}, ${ifFr}`),
      }
    : {
        head: `At ${moneyEn(income)}, you’d pay a *${r.copay}% co-payment* under the Canadian Dental Care Plan.`,
        mine: `\n\nWith an adjusted family net income of ${moneyEn(income)}, the plan would pay ${r.covered}% of its set fees and you’d pay ${r.copay}%, ${ifEn}`,
      };
}

type Pair = { en: string; fr: string };
/** Input of an `officialHandoff` tool call: the official page, a button label and what happens there, by language. */
export const handoff =
  (url: Pair, label: Pair, note: Pair) =>
  ({ lang }: Ctx) => ({ url: url[lang], label: label[lang], note: note[lang] });
