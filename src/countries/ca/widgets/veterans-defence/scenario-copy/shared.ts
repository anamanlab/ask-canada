/** Shared by the scripted answers of the `veterans-defence` widget (server only: imported by scenarios/veterans-defence.ts). */
export type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };

/**
 * `\b` in JavaScript only knows ASCII letters, so `\bétudes` or `santé\b` never match. Rebuild each
 * pattern with Unicode-aware word boundaries (letters with accents count as letters).
 */
const B = String.raw`(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))`;
export const uni = (re: RegExp) => new RegExp(re.source.replace(/\\b/g, B), re.flags.includes('u') ? re.flags : `${re.flags}u`);

export const MILITARY = String.raw`(forces|military|CAF|army|navy|air force|reserves?|RCAF|RCN)`;
export const MILITAIRE = String.raw`(forces|FAC|armée|marine|aviation|réserve|militaires?)`;
