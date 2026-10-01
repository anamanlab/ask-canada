/** Ask Example's identity (`pack.brand`), in a module of its own (the site header reads it without the rest of the pack). */
import type { ClientPack } from '../../types';
import { Mark, STAR_PATH } from './Mark';

export const brand: ClientPack['brand'] = {
  mode: 'independent',
  name: 'Ask Example',
  domain: 'example.org',
  url: 'https://example.org',
  Mark,
  markSvg: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${STAR_PATH}"/></svg>`,
  themeColor: { light: '#F7F5F0', dark: '#0B1220' },
  flagColor: '#1F5FAD',
};
