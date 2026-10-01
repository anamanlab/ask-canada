/**
 * The verdict heading of a scripted drug answer (server only), worded on the live Drug Product Database result
 * and on what the question asked. Shares its fetch with the tool call (the short memo in ./live-shared.ts).
 */
import { strengthLabel, titleCase, type DrugIngredient } from './drugs';
import type { Lang } from './facts';
import { liveDrugs } from './live-drugs';
import { NB } from './scenario-fr';
import { drugIntentOf, drugQueryOf, type Ctx } from './scenario-queries';

type Vars = Record<string, string>;

/** "acetaminophen 325 mg", "semaglutide 1.34 mg/mL" (« 1,34 mg/mL »): an active ingredient mid-sentence. */
const ingredientText = (a: DrugIngredient, lang: Lang) => {
  const num = (n: number) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { maximumFractionDigits: 4 }).format(n);
  const strength = strengthLabel(a, lang, num);
  return `${a.name.toLocaleLowerCase(lang)}${strength ? ` ${strength}` : ''}`;
};
const listOf = (items: string[], and: string) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}` : (items[0] ?? ''));

/**
 * The answer's verdict heading, worded on the live Drug Product Database result (shared with the tool call
 * through liveDrugs' short memo) and on what was asked: whether it's sold in Canada, what's in it, or whether it
 * needs a prescription. The text answers the question the person asked with the data the widget shows.
 */
export async function drugVars({ text, lang }: Ctx): Promise<Vars> {
  const query = drugQueryOf(text);
  const fr = lang === 'fr';
  if (!query) {
    return fr
      ? { head: 'Dites-moi le *nom du médicament* ou son DIN, et je le chercherai.', intro: 'Par exemple : « Tylenol est-il autorisé au Canada? » ou « Chercher le DIN 02241769 ».' }
      : { head: 'Tell me the *drug’s name* or its DIN, and I’ll look it up.', intro: 'For example: “Is Tylenol approved in Canada?” or “Look up DIN 02241769”.' };
  }
  const out = await liveDrugs({ query, lang }).catch(() => null);
  if (!out?.live) {
    return fr
      ? { head: 'La Base de données sur les produits pharmaceutiques n’a pas répondu. *Cherchez-y directement.*', intro: 'Le bouton ci-dessous ouvre la base de données officielle.' }
      : { head: 'The Drug Product Database didn’t answer just now. *Search it directly.*', intro: 'The button below opens the official database.' };
  }
  const din = out.kind === 'din';
  const exact = out.products.find((p) => p.brand.toUpperCase() === out.query.toUpperCase());
  const name = titleCase((din ? out.products[0]?.brand : exact?.brand) ?? out.query.toUpperCase());
  if (!out.products.length) {
    if (din) {
      return fr
        ? { head: `Aucun médicament n’a le DIN *${out.query}* dans la base de données de Santé Canada.`, intro: 'Vérifiez les 8 chiffres sur l’emballage. Les vitamines et les produits à base de plantes portent plutôt un NPN.' }
        : { head: `No drug has DIN *${out.query}* in Health Canada’s database.`, intro: 'Check the 8 digits on the package. Vitamins and herbal products have an NPN instead.' };
    }
    return fr
      ? { head: `La base de données de Santé Canada ne contient aucun médicament nommé *${name}*.`, intro: 'Vérifiez l’orthographe, ou cherchez par le DIN inscrit sur l’emballage. Les vitamines et les produits à base de plantes figurent dans une autre base de données.' }
      : { head: `Health Canada’s database has no drug called *${name}*.`, intro: 'Check the spelling, or search by the DIN on the package. Vitamins and herbal products are in a separate database.' };
  }
  const sold = out.marketed > 0 || out.products.some((p) => p.status === 'marketed');
  if (din) {
    return sold
      ? fr
        ? { head: `Le DIN ${out.query} correspond à *${name}*, vendu au Canada.`, intro: 'Voici ses ingrédients actifs, sa forme et s’il faut une ordonnance.' }
        : { head: `DIN ${out.query} is *${name}*, sold in Canada.`, intro: 'Here are its active ingredients, its form and whether it needs a prescription.' }
      : fr
        ? { head: `Le DIN ${out.query} correspond à *${name}*, qui n’est pas vendu au Canada en ce moment.`, intro: 'Voici ce que la base de données indique à son sujet.' }
        : { head: `DIN ${out.query} is *${name}*, which isn’t sold in Canada right now.`, intro: 'Here’s what the database still lists about it.' };
  }
  if (!sold) {
    return fr
      ? { head: `*${name}* n’est pas vendu au Canada en ce moment.`, intro: 'Voici ce que la base de données indique encore, avec la fiche de chaque produit.' }
      : { head: `*${name}* isn’t sold in Canada right now.`, intro: 'Here’s what the database still lists, with the product page for each.' };
  }
  const intent = drugIntentOf(text);
  const onSale = out.products.filter((p) => p.status === 'marketed');
  const first = onSale[0] ?? out.products[0];
  if (intent === 'ingredients' && first.ingredients.length) {
    const product = titleCase(first.brand);
    const several = out.total > 1;
    const many = first.ingredients.length > 4;
    const list = listOf(first.ingredients.slice(0, many ? 3 : 4).map((a) => ingredientText(a, lang)), fr ? 'et' : 'and');
    if (fr) {
      const label = first.ingredients.length > 1 ? (many ? `${first.ingredients.length} ingrédients actifs, dont` : 'Ingrédients actifs') : 'Ingrédient actif';
      return {
        head: many ? `*${product}* contient ${label} ${list}.` : `${label} de *${product}*${NB}: ${list}.`,
        intro: several ? `Les autres produits ${name} peuvent contenir d’autres ingrédients${NB}: chaque fiche ci-dessous indique les siens, avec le DIN.` : 'Voici sa fiche, avec le DIN et s’il faut une ordonnance.',
      };
    }
    return {
      head: many ? `*${product}* contains ${first.ingredients.length} active ingredients, including ${list}.` : `*${product}* contains ${list}.`,
      intro: several ? `Other ${name} products can have different ingredients: each card below lists its own, with the DIN.` : 'Here’s its record, with the DIN and whether it needs a prescription.',
    };
  }
  if (intent === 'prescription') {
    const access = new Set((onSale.length ? onSale : out.products).map((p) => p.access));
    const cards = fr ? 'Chaque fiche ci-dessous indique le DIN, les ingrédients actifs et le statut du produit.' : 'Each card below shows the DIN, the active ingredients and the product’s status.';
    if (access.size === 1 && access.has('rx')) {
      return fr ? { head: `Oui, il faut *une ordonnance* pour obtenir ${name} au Canada.`, intro: cards } : { head: `Yes, ${name} needs *a prescription* in Canada.`, intro: cards };
    }
    if (access.size === 1 && access.has('otc')) {
      return fr ? { head: `Non, ${name} est vendu *sans ordonnance* au Canada.`, intro: cards } : { head: `No, ${name} is sold *without a prescription* in Canada.`, intro: cards };
    }
    if (access.has('rx') && access.has('otc')) {
      return fr
        ? { head: `Ça dépend du produit${NB}: certains produits *${name}* exigent une ordonnance, d’autres non.`, intro: 'Chaque fiche ci-dessous indique s’il faut une ordonnance.' }
        : { head: `It depends on the product: some *${name}* products need a prescription and some don’t.`, intro: 'Each card below says whether it needs a prescription.' };
    }
    return fr
      ? { head: `*${name}* est vendu au Canada, mais la base de données ne le classe ni avec ni sans ordonnance.`, intro: 'Demandez à un pharmacien comment l’obtenir. Voici ce que la base de données indique.' }
      : { head: `*${name}* is sold in Canada, but the database doesn’t list it as prescription or non-prescription.`, intro: 'Ask a pharmacist how to get it. Here’s what the database lists.' };
  }
  return fr
    ? { head: `Oui, *${name}* est autorisé et vendu au Canada.`, intro: 'Voici son DIN, ses ingrédients actifs et s’il faut une ordonnance.' }
    : { head: `Yes, *${name}* is authorized and sold in Canada.`, intro: 'Here are its DIN, active ingredients and whether it needs a prescription.' };
}
