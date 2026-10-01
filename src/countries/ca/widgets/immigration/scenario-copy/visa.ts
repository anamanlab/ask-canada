/** Scenario copy for the visa / eTA check (EN + FR). */
import { countryFromText } from '../countries';
import { countryName } from '../country-name';
import { checkEntry } from '../entry';
import { uni, uniAll } from '../text';
import { intl, U, type Ctx } from './shared';

export const VISA_MATCH = uniAll([
  /\b(do|will|would) (i|we|they|my \w+) need an? (visa|visitor visa|tourist visa|e-?ta)\b/i,
  /\b(need|require\w*)\b.*\b(visa|e-?ta)\b.*\b(to )?(visit|travel|come|fly|transit|go) (to |through )?canada\b/i,
  /\b(visa|e-?ta)\b.*\b(to|for) (visit|travel to|come to|fly to|transit through) canada\b/i,
  /\b(visit|visiting|travel(l?ing)? to|come to|fly(ing)? to|transit(ing)? through) canada\b.*\b(visa|e-?ta)\b/i,
  /\be-?ta or (a )?visa\b|\bvisa or (an )?e-?ta\b/i,
  /\bwhat('?s| is) an? e-?ta\b/i,
  /\bqu['’]est-ce qu['’]une ave\b/i,
  /\bbesoin d['’]un visa\b|\bbesoin d['’]une ave\b/i,
  /\b(visa|ave)\b.*\b(pour )?(visiter|voyager au|venir au|aller au|transiter par|entrer au) canada\b/i,
  /\b(visiter|voyager au|venir au|entrer au) canada\b.*\b(visa|ave)\b/i,
  /\bvisa ou (une )?ave\b|\bave ou (un )?visa\b/i,
]);
/** Questions about Canadians travelling abroad belong to the travel widget, not here. */
const ABROAD = uni(/\b(from canada to|canadians? (need|travel\w*)|canadian (citizen|passport)s?\b.*\b(to|visit\w*|travel\w*)\b)|\b(du canada vers|citoyens? canadiens?|passeport canadien)\b/i);
export const VISA_EXCLUDE = uniAll([ABROAD, /\b(processing|wait) times?\b|\bhow long\b|\bd[ée]lais?\b|\bcombien de temps\b/i]);

export const VISA_REPLY = {
  en: `# {headline}

{body} [1](${U('entryByCountry', 'en')})

What you need depends on your passport, how you travel and your travel documents, so IRCC’s questions give the final answer. [2](${U('checkVisaEta', 'en')})

Here’s what applies to you, with fees and the latest processing time. Change your passport or how you’ll arrive to compare.`,
  fr: `# {headline}

{body} [1](${U('entryByCountry', 'fr')})

Ce qu’il vous faut dépend de votre passeport, de votre moyen de transport et de vos documents de voyage : les questions d’IRCC donnent la réponse finale. [2](${U('checkVisaEta', 'fr')})

Voici ce qui s’applique à vous, avec les frais et le délai de traitement le plus récent. Changez de passeport ou de moyen de transport pour comparer.`,
};

export const visaVars = ({ text, lang }: Ctx): Record<string, string> => {
  const code = countryFromText(text);
  const r = checkEntry({ country: code ?? undefined });
  const name = code ? countryName(code, intl(lang)) : '';
  const fx = lang === 'fr';
  switch (r.kind) {
    case 'visa':
      return {
        headline: fx ? `${name} : il vous faut probablement un *visa de visiteur* pour visiter le Canada.` : `${name}: you’ll likely need a *visitor visa* to visit Canada.`,
        body: fx
          ? `Les citoyens de ce pays ont besoin d’un visa de visiteur pour visiter le Canada ou y transiter, peu importe leur moyen de transport. Le visa coûte 100 $, plus 85 $ pour la biométrie dans la plupart des cas.`
          : `Citizens of this country need a visitor visa to visit or transit through Canada, however they travel. It costs $100, plus $85 for biometrics in most cases.`,
      };
    case 'visa-conditional':
      return {
        headline: fx ? `${name} : un *visa de visiteur*, ou une AVE si vous y êtes admissible.` : `${name}: a *visitor visa*, or an eTA if you qualify.`,
        body: fx
          ? `Si vous prenez l’avion et avez eu un visa canadien au cours des 10 dernières années ou avez un visa de non-immigrant des États-Unis valide, vous pouvez demander une AVE à 7 $. Sinon, ou si vous arrivez par voie terrestre ou maritime, il vous faut un visa.`
          : `If you fly and have had a Canadian visa in the last 10 years or have a valid US non-immigrant visa, you can apply for a $7 eTA instead. Otherwise, or if you arrive by land or sea, you need a visa.`,
      };
    case 'eta':
      return {
        headline: fx ? `${name} : il vous faut probablement une *AVE* pour venir au Canada en avion.` : `${name}: you’ll likely need an *eTA* to fly to Canada.`,
        body: fx
          ? `L’AVE coûte 7 $ et la plupart des demandes sont approuvées en quelques minutes. En voiture, en autobus, en train ou en bateau, votre passeport suffit.`
          : `An eTA costs $7 and most are approved within minutes. By car, bus, train or boat, your passport is enough.`,
      };
    case 'none-us':
      return {
        headline: fx ? `${name} : *ni visa ni AVE* requis.` : `${name}: *no visa or eTA* needed.`,
        body: fx
          ? `Les citoyens des États-Unis et les résidents permanents légitimes des États-Unis n’ont pas besoin de visa ni d’AVE. Le passeport reste le meilleur document de voyage.`
          : `US citizens and US lawful permanent residents don’t need a visa or an eTA. A valid passport is still the most reliable travel document.`,
      };
    case 'canadian':
      return {
        headline: fx ? `Les citoyens canadiens voyagent avec leur *passeport canadien*.` : `Canadian citizens travel on their *Canadian passport*.`,
        body: fx
          ? `Les citoyens canadiens, y compris ceux qui ont la double citoyenneté, ne peuvent pas demander d’AVE et ont besoin d’un passeport canadien valide pour venir en avion.`
          : `Canadian citizens, including dual citizens, can’t apply for an eTA and need a valid Canadian passport to fly to Canada.`,
      };
    default:
      return {
        headline: fx ? `Ça dépend de *votre passeport* et de votre moyen de transport.` : `It depends on *your passport* and how you travel.`,
        body: fx
          ? `La plupart des voyageurs ont besoin soit d’un visa de visiteur, soit d’une autorisation de voyage électronique (AVE), pas des deux. Les citoyens des États-Unis n’ont besoin ni de l’un ni de l’autre.`
          : `Most travellers need either a visitor visa or an electronic travel authorization (eTA), not both. US citizens need neither.`,
      };
  }
};

export const visaInput = ({ text, lang }: Ctx) => {
  const c = countryFromText(text);
  const land = uni(/\b(drive|driving|car|bus|train|boat|cruise|voiture|autobus|bateau|croisière|en train)\b/i).test(text);
  return { ...(c ? { country: c } : {}), ...(land ? { travel: 'land-sea' } : {}), lang };
};
