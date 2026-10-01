/** Localized country name for display (falls back to the ISO code). Isomorphic and tiny: safe in the widgets. */
export function countryName(code: string, locale: string): string {
  try {
    const n = new Intl.DisplayNames([locale], { type: 'region' }).of(code);
    return n && n !== code ? n : code;
  } catch {
    return code;
  }
}
