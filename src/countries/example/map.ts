/**
 * Example basemap: CARTO's OpenStreetMap-based tiles (worldwide, no key, light + dark styles).
 * A real pack should prefer its national mapping agency's open tiles (see `src/countries/ca/map.ts`).
 */
import type { MapTiles } from '@/lib/country/types';

const map: MapTiles = {
  base: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  },
  subdomains: 'abcd',
  tileSize: 256,
  minZoom: 3,
  maxZoom: 17,
  // CARTO's free basemaps must be loaded directly (no proxying), so the browser calls the host.
  proxy: false,
  hosts: ['https://*.basemaps.cartocdn.com'],
  attribution: {
    label: { en: '© OpenStreetMap contributors © CARTO' },
    href: { en: 'https://carto.com/attributions' },
  },
};

export default map;
