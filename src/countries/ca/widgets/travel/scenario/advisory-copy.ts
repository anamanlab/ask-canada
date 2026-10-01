/**
 * Answer text for the advisory and entry-requirement scenarios, from the same read of the feed the widget
 * shows (live.ts shares it, failures included). Every sentence, the closing one too, describes the card
 * that follows: a live advisory, a link to the official page, or the destination picker.
 */
import { buildAdvisory } from '../build';
import { LEVEL_TEXT, URLS } from '../data';
import { regionTitle } from '../select';
import type { CountryAdvisory, Lang } from '../types';
import { TITLES, cite, citeUrl, destCite, destTitle, firstSentence, longDate, lowerFirst, safe } from './text';

function advisoryVars(c: CountryAdvisory | null, lang: Lang, url: string, place?: string) {
  const fr = lang === 'fr';
  if (!c) {
    if (place) {
      return fr
        ? {
            headline: `Consultez l’avertissement officiel : *${place}.*`,
            body: `La page officielle de cette destination indique toujours le niveau de risque actuel, les régions à éviter et les exigences d’entrée. ${citeUrl(1, url, destTitle(place, 'fr'))}`,
            closing: 'Voici le lien vers la page officielle, avec les façons de joindre le Canada en cas d’urgence à l’étranger.',
          }
        : {
            headline: `Check the official advisory for *${place}.*`,
            body: `The official page for this destination always shows the current risk level, the areas to avoid and the entry rules. ${citeUrl(1, url, destTitle(place, 'en'))}`,
            closing: 'Here’s the link to the official page, with the ways to reach Canada in an emergency abroad.',
          };
    }
    return fr
      ? {
          headline: 'Où allez-vous? *Chaque destination a son niveau de risque.*',
          body: `Le gouvernement du Canada publie des conseils aux voyageurs pour 230 destinations. Chacune a un niveau de risque de 1 à 4, des avertissements régionaux et les exigences d’entrée pour les Canadiens. ${cite(1, 'advisories', 'fr')}`,
          closing: 'Choisissez votre destination pour voir son avertissement en direct, avec les exigences d’entrée, les numéros d’urgence et une liste de vérification pour votre voyage.',
        }
      : {
          headline: 'Where are you going? *Every destination has its own risk level.*',
          body: `The Government of Canada publishes travel advice for 230 destinations. Each has a risk level from 1 to 4, regional advisories and entry rules for Canadians. ${cite(1, 'advisories', 'en')}`,
          closing: 'Pick your destination to see its live advisory, with entry rules, emergency numbers and a checklist for your trip.',
        };
  }
  const regions = c.regions.length;
  const worst = c.regions.reduce<number>((m, r) => Math.max(m, r.level), c.level);
  const firstRegion = c.regions[0] ? safe(regionTitle(c.regions[0]) ?? firstSentence(c.regions[0].reason)) : '';
  // Official wording for the level (never the feed's stale text; see data.ts).
  const levelName = LEVEL_TEXT[lang][c.level];
  if (fr) {
    return {
      headline: `${safe(c.name)} : *${lowerFirst(levelName)}.*`,
      body: [
        `C’est le niveau ${c.level} sur 4 de l’échelle officielle du gouvernement du Canada, mis à jour le ${longDate(c.updated, 'fr')}. Le conseil officiel : « ${safe(firstSentence(c.summary))} » ${destCite(1, c, 'fr')}`,
        regions
          ? `Certaines régions sont plus à risque : ${regions === 1 ? '1 avertissement régional' : `${regions} avertissements régionaux`}, dont « ${firstRegion} ». ${destCite(1, c, 'fr')}`
          : '',
        worst >= 3
          ? `Un avertissement d’éviter les voyages non essentiels ou tout voyage peut limiter votre assurance voyage s’il est en vigueur au moment de la réservation. ${cite(2, 'explained', 'fr')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      closing: 'Voici l’avertissement en direct, avec les exigences d’entrée, les numéros d’urgence et une liste de vérification pour votre voyage.',
    };
  }
  return {
    headline: `${safe(c.name)}: *${lowerFirst(levelName)}.*`,
    body: [
      `That’s level ${c.level} of 4 on the Government of Canada’s official scale, updated ${longDate(c.updated, 'en')}. The official advice: “${safe(firstSentence(c.summary))}” ${destCite(1, c, 'en')}`,
      regions ? `Some areas carry a higher risk: ${regions === 1 ? '1 regional advisory' : `${regions} regional advisories`}, including “${firstRegion}”. ${destCite(1, c, 'en')}` : '',
      worst >= 3 ? `An advisory to avoid non-essential or all travel can limit your travel insurance if it’s in place when you book. ${cite(2, 'explained', 'en')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    closing: 'Here’s the live advisory, with entry rules, emergency numbers and a checklist for your trip.',
  };
}

export async function advisoryFor(text: string, lang: Lang) {
  const out = await buildAdvisory({ destination: text, lang });
  if (out.kind === 'advisory') return advisoryVars(out.country, lang, out.country.url);
  if (out.kind === 'offline' && out.country) return advisoryVars(null, lang, out.country.url, out.country.name);
  return advisoryVars(null, lang, URLS.advisories[lang]);
}

/** "Do I need a visa for Japan?": the tourist-visa line as the headline, then passport validity. */
export async function entryFor(text: string, lang: Lang) {
  const out = await buildAdvisory({ destination: text, lang, focus: 'entry' });
  const fr = lang === 'fr';
  if (out.kind !== 'advisory') {
    const url = out.kind === 'offline' && out.country ? out.country.url : URLS.advisories[lang];
    if (out.kind === 'offline' && out.country) {
      // The destination is known but its feed didn't answer: the card links to its official page, and so does the text.
      const name = safe(out.country.name);
      const urlTitle = destTitle(name, lang);
      return fr
        ? {
            headline: `Consultez les exigences d’entrée officielles : *${name}.*`,
            body: `La page officielle de cette destination précise la validité exigée du passeport et les visas nécessaires pour les Canadiens. ${citeUrl(1, url, urlTitle)}`,
            url,
            urlTitle,
          }
        : {
            headline: `Check the official entry rules for *${name}.*`,
            body: `The official page for this destination lists the passport validity and visas Canadians need. ${citeUrl(1, url, urlTitle)}`,
            url,
            urlTitle,
          };
    }
    return fr
      ? {
          headline: 'Chaque pays fixe *ses propres exigences d’entrée.*',
          body: `Les conseils aux voyageurs de chaque destination précisent la validité exigée du passeport et les visas nécessaires pour les Canadiens. Dites-moi votre destination. ${citeUrl(1, url, TITLES.advisories!.fr)}`,
          url,
          urlTitle: TITLES.advisories!.fr,
        }
      : {
          headline: 'Every country sets *its own entry rules.*',
          body: `Each destination’s travel advice lists the passport validity and visas Canadians need. Tell me where you’re going. ${citeUrl(1, url, TITLES.advisories!.en)}`,
          url,
          urlTitle: TITLES.advisories!.en,
        };
  }
  const c = out.country;
  const tourist = c.entry.visas.find((v) => /touris/i.test(v.label));
  const headline = tourist
    ? fr
      ? `${safe(c.name)}, ${lowerFirst(safe(tourist.label))} : *${safe(tourist.value)}.*`
      : `${safe(c.name)} ${lowerFirst(safe(tourist.label))}: *${safe(tourist.value)}.*`
    : fr
      ? `${safe(c.name)} : *les exigences d’entrée.*`
      : `${safe(c.name)}: *entry requirements.*`;
  const passport = c.entry.passport ? safe(c.entry.passport) : '';
  const body = fr
    ? `${passport ? `${passport} ` : ''}Votre transporteur aérien peut avoir des règles plus strictes que le pays. ${destCite(1, c, 'fr')}\n\nLes autres types de visa (affaires, travail, études) ont leurs propres règles.`
    : `${passport ? `${passport} ` : ''}Your airline’s rules may be stricter than the country’s. ${destCite(1, c, 'en')}\n\nOther visas (business, work, study) have their own rules.`;
  return { headline, body, url: c.url, urlTitle: destTitle(c.name, lang) };
}
