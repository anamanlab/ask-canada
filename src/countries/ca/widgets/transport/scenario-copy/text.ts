/** Formatting and French-grammar helpers shared by the transport scenario copy (server only). */
export type Lang = 'en' | 'fr';
export type Ctx = { text: string; lang: Lang; timeZone?: string };

export const money = (n: number, lang: Lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
const num = (n: number, lang: Lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { maximumFractionDigits: 1 }).format(n);
/** "895 g", "2.5 kg" / "2,5 kg" (non-breaking space: the number never wraps away from its unit). */
export const weight = (g: number, lang: Lang) => (g >= 1000 ? `${num(g / 1000, lang)}\u00a0kg` : `${num(g, lang)}\u00a0g`);
export const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** French article before a vehicle name, elided before a vowel: « l’Equinox EV », « le Model Y ». Brand names in h (Honda, Hyundai) keep « le ». */
export const elides = (name: string) => /^[aeiouyéèêàâîôû]/i.test(name);
export const le = (name: string) => (elides(name) ? `l’${name}` : `le ${name}`);
export const Le = (name: string) => (elides(name) ? `L’${name}` : `Le ${name}`);
export const du = (name: string) => (elides(name) ? `de l’${name}` : `du ${name}`);
/**
 * French typography: thousands separators are narrow no-break spaces and « $ », « % », units and « : » never wrap away
 * from what they belong to (« 5 000 $ », « 65 % », « 30 g »). Applied to every French string these scenarios produce.
 */
export const frType = (s: string) =>
  s
    .replace(/(\d)[ \u00a0](\d{3})(?!\d)/g, '$1\u202f$2')
    .replace(/(\d)[ \u00a0](\d{3})(?!\d)/g, '$1\u202f$2')
    .replace(/(\d) (\$|%|g\b|kg\b|hp\b|HP\b|ans\b|mois\b|L\b)/g, '$1\u00a0$2')
    .replace(/ ([:;?!»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0');
