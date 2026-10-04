/**
 * Ask Brasil's identity (`pack.brand`), in a module of its own: the site header is on every page and needs
 * this without the rest of the pack (which would drag in the service icons and art paths).
 *
 * `mode: 'independent'` is deliberate. This is not the Governo Federal: no coat of arms, no government
 * lockup, and one honest line in the footer saying where the answers come from. Switching to
 * `mode: 'official'` (plus an `OfficialSignature`) is what a federal deployment would do.
 */
import type { ClientPack } from '../../types';
import { BRAZIL_FLAG_SVG } from './mark';
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
  askPair: {
    pt: { lead: { tag: 'português', word: 'Pergunte.', lang: 'pt' }, second: { tag: 'brasil', word: 'Consulte.', lang: 'pt' } },
    en: { lead: { tag: 'english', word: 'Ask.', lang: 'en' }, second: { tag: 'brazil', word: 'Explore.', lang: 'en' } },
  },
  Mark,
  // Mark (the authentic Brazilian flag emblem) leads the wordmark in the header.
  Flag: undefined,
  currencySymbol: 'R$ ',
  exampleFee: '257,25',
  currency: 'BRL',
  officialHomeUrl: 'https://www.gov.br/pt-br',
  // Authentic Brazilian flag SVG for favicons and app icons
  markSvg: () => BRAZIL_FLAG_SVG,
  themeColor: { light: '#F7F5F0', dark: '#0B1220' },
  // Bandeira do Brasil green: the mark, the send button, focus rings and accents
  accent: {
    base: '#009C3B',
    ink: '#007A2E',
    wash: 'rgba(0, 156, 59, 0.1)',
    dark: { base: '#2fbf6b', ink: '#7fd7a4', wash: 'rgba(47, 191, 107, 0.14)' },
  },
  flagColor: '#009C3B',
};

export { Flag, Mark };