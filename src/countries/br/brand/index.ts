/**
 * Ask Brasil's identity (`pack.brand`), in a module of its own: the site header is on every page and needs
 * this without the rest of the pack (which would drag in the service icons and art paths).
 *
 * `mode: 'independent'` is deliberate. This is not the Governo Federal: no coat of arms, no government
 * lockup, and one honest line in the footer saying where the answers come from. Switching to
 * `mode: 'official'` (plus an `OfficialSignature`) is what a federal deployment would do.
 */
import type { ClientPack } from '../../types';
import { MARK_CORE_PATH, MARK_PATH, MARK_VIEWBOX } from './mark';
import { Mark } from './Mark';
import { Flag } from './Flag';

export const brand: ClientPack['brand'] = {
  mode: 'independent',
  name: 'Ask Brasil',
  domain: 'gov.br',
  url: 'https://ask-brasil.example.gov.br',
  contact: 'mailto:contato@ask-brasil.example.gov.br',
  greeting: { en: 'Hello, Brazil', pt: 'Olá, Brasil' },
  ask: { en: 'Ask.', pt: 'Pergunte.' },
  Mark,
  Flag,
  currencySymbol: 'R$ ',
  exampleFee: '257,25',
  currency: 'BRL',
  officialHomeUrl: 'https://www.gov.br/pt-br',
  // Two-tone for the favicons and social cards: the star in the brand colour, the core in the flag's yellow.
  // The core is drawn after the star, not before it: the star's concave sides reach past the centre, so a
  // core underneath it was completely hidden and the mark came out flat green.
  markSvg: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path fill="${color}" d="${MARK_PATH}"/><path fill="#FFDF00" d="${MARK_CORE_PATH}"/></svg>`,
  themeColor: { light: '#F7F5F0', dark: '#0B1220' },
  // Bandeira do Brasil green, in place of core's default red: the mark, the send button, focus rings and the
  // italic in a lead all follow these three variables. `dark` is the same green lifted for the dark hero —
  // the flag green is only 3.9:1 on core's dark card, these clear 4.5:1 on it and on the ink above it.
  accent: {
    base: '#009C3B',
    ink: '#007A2E',
    wash: 'rgba(0, 156, 59, 0.1)',
    dark: { base: '#2fbf6b', ink: '#7fd7a4', wash: 'rgba(47, 191, 107, 0.14)' },
  },
  // Bandeira do Brasil green: the accent colour for the flag-proportion band and the mark in icons.
  flagColor: '#009C3B',
  // The flag's yellow rhombus, drawn behind the flag band's answer card. Without it the
  // band is green stripes claiming flag proportions; with it, green field, yellow
  // losango, white answer — the flag, with a question where the globe would be.
  flagDiamond: '#FFDF00',
};