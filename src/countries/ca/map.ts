/**
 * Canada's basemap: Natural Resources Canada, Canada Base Map – Transportation (CBMT), Web Mercator.
 * Geometry is one bilingual layer; labels come from the English (CBMT_TXT) or French (CBCT_TXT) overlay.
 * No key, no cookies, Open Government Licence – Canada. Coverage is Canada only; tiles exist to z15
 * (z16+ return 404). Verified 2026-09-30:
 * https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer?f=json
 * Dataset: https://open.canada.ca/data/en/dataset/296de17c-001c-4435-8f9a-f5acab632e85
 */
import type { MapTiles } from '@/lib/country/types';

const BASE = 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps';

const map: MapTiles = {
  base: { light: `${BASE}/CBMT_CBCT_GEOM_3857/MapServer/tile/{z}/{y}/{x}` },
  labels: {
    en: `${BASE}/CBMT_TXT_3857/MapServer/tile/{z}/{y}/{x}`,
    fr: `${BASE}/CBCT_TXT_3857/MapServer/tile/{z}/{y}/{x}`,
  },
  tileSize: 256,
  minZoom: 3,
  maxZoom: 15,
  // NRCan has no dark style: soften for calm in light mode, invert for dark mode.
  filter: {
    light: 'saturate(.45) contrast(.92) brightness(1.04)',
    dark: 'invert(1) hue-rotate(180deg) saturate(.35) brightness(.82) contrast(.92)',
  },
  // Proxied through /tiles (OGL–Canada allows redistribution): visitors' browsers never call NRCan directly.
  proxy: true,
  // Canada plus a margin (Point Pelee to Cape Columbia, Yukon–Alaska border to Cape Spear).
  bounds: [-141.5, 41.0, -52.0, 83.5],
  hosts: ['https://maps-cartes.services.geo.ca'],
  attribution: {
    label: { en: '© Natural Resources Canada', fr: '© Ressources naturelles Canada' },
    href: {
      en: 'https://open.canada.ca/data/en/dataset/296de17c-001c-4435-8f9a-f5acab632e85',
      fr: 'https://ouvert.canada.ca/data/fr/dataset/296de17c-001c-4435-8f9a-f5acab632e85',
    },
  },
};

export default map;
