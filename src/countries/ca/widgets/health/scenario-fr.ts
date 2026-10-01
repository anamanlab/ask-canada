/**
 * French wording helpers for the scripted health answers (pure, server only): Canada.ca typography (non-breaking
 * spaces in amounts and before $, %, : and »), and the grammar of places and months (« au Mexique », « d’août »).
 */
export const NB = '\u00a0';
/** "90 000 $", "40 %" with non-breaking spaces, as Canada.ca writes them (from Intl, fr-CA). */
export const moneyFr = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
export const pctFr = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'percent' }).format(n / 100);
/**
 * French replies never break a line inside an amount or before $, %, : or », or after «: every such space
 * becomes a non-breaking one.
 */
export const typoFr = (s: string) =>
  s
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`)
    .replace(/([\d*]) ([$%])/g, `$1${NB}$2`)
    .replace(/(\S) :(?=\s|$)/g, `$1${NB}:`)
    .replace(/« /g, `«${NB}`)
    .replace(/ »/g, `${NB}»`);

/** Places that take « à » (islands and city-states), « à la », or « aux » (plural names). */
const FR_A = /^(Cuba|Haïti|Madagascar|Singapour|Chypre|Malte|Bahreïn|Taïwan|Hong Kong|Macao|Maurice|Monaco|Oman|Djibouti|Nauru|Tuvalu|Kiribati|Vanuatu|Tonga|Porto Rico|Aruba|Curaçao|Bonaire|Sainte?-|Saint-|Sao Tomé|Trinité|Antigua|Israël)/;
const FR_A_LA = /^(Barbade|Grenade|Dominique|Réunion|Martinique|Guadeloupe)/;
const FR_AUX = /^(États-Unis|Pays-Bas|Philippines|Émirats|Maldives|Bahamas|Seychelles|Comores|Fidji|Samoa|Bermudes|Palaos|Îles|Antilles)/;
/** Masculine names that end in -e (« au Mexique »). */
const FR_AU_E = /^(Mexique|Cambodge|Mozambique|Zimbabwe|Belize|Suriname|Bélize)/;

/** « à Cuba », « au Mexique », « en France », « aux États-Unis », « en Iran ». */
export function inPlaceFr(place: string): string {
  const p = place.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (p === 'Israël') return `en ${place}`;
  if (FR_AUX.test(p)) return `aux ${place}`;
  if (FR_A_LA.test(p)) return `à la ${place}`;
  if (FR_A.test(p)) return `à ${place}`;
  if (/^[AEIOUYÉÈÂÎÔ]/i.test(p)) return `en ${place}`;
  if (FR_AU_E.test(p)) return `au ${place}`;
  const first = p.split(/[\s-]/)[0];
  return /e$/.test(first) ? `en ${place}` : `au ${place}`;
}

/** "October 2021" / "octobre 2021". */
export const monthYear = (iso: string, lang: 'en' | 'fr') =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
/** « de mars 2026 », « d’août 2026 », « d’octobre 2021 ». */
export const deFr = (s: string) => (/^[aeiouyéèâ]/i.test(s) ? `d’${s}` : `de ${s}`);
