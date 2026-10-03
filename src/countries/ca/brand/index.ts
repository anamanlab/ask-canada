/**
 * Ask Canada's identity (`pack.brand`), in a module of its own: the site header is on every page and needs
 * only this, so it reads it through `@/lib/brand` without bundling the rest of the pack (services, icons).
 * Switch `mode` to 'official' (and supply `OfficialSignature`) for a Government of Canada deployment.
 */
import type { ClientPack } from '../../types';
import { Mark } from './Mark';
import { LEAF_PATH, LEAF_VIEWBOX } from './leaf';

export const brand: ClientPack['brand'] = {
  mode: 'independent',
  name: 'Ask Canada',
  domain: 'canada.ryancampbell.com',
  url: 'https://canada.ryancampbell.com',
  greeting: { en: 'Hello, Canada', fr: 'Bonjour, Canada' },
  ask: { en: 'Ask.', fr: 'Demandez.' },
  Mark,
  markSvg: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LEAF_VIEWBOX}"><path fill="${color}" d="${LEAF_PATH}"/></svg>`,
  themeColor: { light: '#F7F5F0', dark: '#0B1220' },
  flagColor: '#D52B1E',
};
