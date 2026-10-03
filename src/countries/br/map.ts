/**
 * Brazil basemap: Esri's World_Street_Map with the Canvas/World_Dark_Gray_Base for dark mode.
 *
 * Why not a Brazilian source: IBGE — the national statistical office, and the obvious choice — publishes
 * boundaries but **no raster XYZ tiles** (`servicodados.ibge.gov.br/api/v3/malhas/…` is GeoJSON/TopoJSON,
 * which is geometry, not a basemap). So the Canada equivalent of NRCan's CBMT does not exist yet. When IBGE
 * or another national provider ships open tiles, point `base`/`labels` at them and keep everything else.
 *
 * Why `proxy: false`: our own `/tiles` route caches and revalidates upstream tiles, which is fine for a
 * source that licenses redistribution (NRCan) but is not something to assume for Esri's free basemap
 * service. Loading it directly keeps us inside the obvious reading of their terms; the cost is that the
 * tile host, not us, sees visitor IPs. Verified 2026-10-02: tiles exist from z0 to at least z19.
 */
import type { MapTiles } from '@/lib/country/types';

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

const map: MapTiles = {
  base: {
    light: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
    dark: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  },
  tileSize: 256,
  minZoom: 3,
  maxZoom: 17,
  // Direct from the browser (see the note above): the host is added to the CSP `img-src` instead.
  proxy: false,
  // Brazil with a margin: mainland plus Fernando de Noronha (-32.4) and Trindade (-29.1).
  bounds: [-75, -34.5, -28, 6],
  hosts: ['https://server.arcgisonline.com'],
  attribution: {
    label: {
      pt: '© Esri, HERE, Garmin, © colaboradores do OpenStreetMap e a comunidade SIG',
      en: '© Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
    },
    href: {
      pt: 'https://www.esri.com/br/pt-br/home.html',
      en: 'https://www.esri.com',
    },
  },
};

export default map;