/**
 * Ask Brasil mark geometry: a four-point compass star, on its own.
 *
 * Deliberately NOT any state symbol: no coat of arms, no Ordem do Progresso band, no "Brasil — Governo
 * Federal" lockup. A navigation star is what this product actually does — it points at the right office,
 * page or deadline — and it reads clearly at 15px in the header and as a monochrome app icon.
 */
export const MARK_VIEWBOX = '0 0 24 24';

/** The star, drawn as four concave-sided points so it stays crisp at small sizes. */
export const MARK_PATH =
  'M12 0.6c.86 5.4 5.14 9.68 10.54 10.54-5.4.86-9.68 5.14-10.54 10.54-.86-5.4-5.14-9.68-10.54-10.54C6.86 10.28 11.14 6 12 .6Z';

/** A small diamond at the centre, so the star has a "you are here" point even at 15px. */
export const MARK_CORE_PATH = 'M12 9.4 14.6 12 12 14.6 9.4 12Z';