/**
 * Ask Brasil's identity (`pack.brand`), in a module of its own: the site header is on every page and needs
 * this without the rest of the pack (which would drag in the service icons and art paths).
 *
 * `mode: 'independent'` is deliberate. This is not the Governo Federal: no coat of arms, no government
 * lockup, and one honest line in the footer saying where the answers come from. Switching to
 * `mode: 'official'` (plus an `OfficialSignature`) is what a federal deployment would do.
 */
import type { ClientPack } from '../../types';
import { MARK_PATH, MARK_VIEWBOX } from './mark';
import { Mark } from './Mark';

export const brand: ClientPack['brand'] = {
  mode: 'independent',
  name: 'Ask Brasil',
  domain: 'gov.br',
  url: 'https://ask-brasil.example.gov.br',
  contact: 'mailto:contato@ask-brasil.example.gov.br',
  greeting: { en: 'Hello, Brazil', pt: 'Olá, Brasil' },
  ask: { en: 'Ask.', pt: 'Pergunte.' },
  Mark,
  // Two-tone for the favicons and social cards: the star in the brand colour, the core in the flag's yellow.
  markSvg: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path fill="#FFDF00" d="M12 9.4 14.6 12 12 14.6 9.4 12Z"/><path fill="${color}" d="${MARK_PATH}"/></svg>`,
  themeColor: { light: '#F7F5F0', dark: '#0B1220' },
  // Bandeira do Brasil green, in place of core's default red: the mark, the send button, focus rings and the
  // italic in a lead all follow these three variables.
  accent: { base: '#009C3B', ink: '#007A2E', wash: 'rgba(0, 156, 59, 0.1)' },
  // Bandeira do Brasil green: the accent colour for the flag-proportion band and the mark in icons.
  flagColor: '#009C3B',
  // The flag's yellow rhombus, drawn behind the flag band's answer card. Without it the
  // band is green stripes claiming flag proportions; with it, green field, yellow
  // losango, white answer — the flag, with a question where the globe would be.
  flagDiamond: '#FFDF00',
};