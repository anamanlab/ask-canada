/**
 * "a, b and c" / "a, b et c" in the given locale. Core's formatters (`@/lib/i18n/format`) cover numbers,
 * money and dates but not lists; `Intl.ListFormat` is costly to build, so one instance per locale is kept.
 * Isomorphic: used by the mortgage widget and by the scripted scenarios.
 */
const formats = new Map<string, Intl.ListFormat>();

export function listAnd(items: string[], intl: string): string {
  let format = formats.get(intl);
  if (!format) {
    format = new Intl.ListFormat(intl, { type: 'conjunction' });
    formats.set(intl, format);
  }
  return format.format(items);
}

/**
 * A string kept in its own direction inside a right-to-left line: the text form of `<bdi>` (FSI … PDI), for
 * slots that only take a string (a slider's value). Without it "5 years" reads "years 5" in an RTL page.
 */
export const isolate = (text: string) => `\u2068${text}\u2069`;
