/**
 * Web Mercator maths shared by every map (the `Map` primitive, the tile route, widget maps).
 *
 *   const scale = worldSize(zoom, 256);          // world width in px at this zoom
 *   const { x, y } = project(45.42, -75.69, scale);
 *   const { lat, lng } = unproject(x, y, scale);
 *   tileX(-75.69, 11), tileY(45.42, 11)           // slippy-map tile indices
 *
 * Latitudes are clamped to ±85° (the square Mercator world).
 */
const MAX_LAT = 85;
const RAD = Math.PI / 180;

export const worldSize = (zoom: number, tileSize: number) => tileSize * 2 ** zoom;

export function project(lat: number, lng: number, scale: number) {
  const s = Math.sin(Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * RAD);
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale };
}

export function unproject(x: number, y: number, scale: number) {
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return { lat: Math.atan(Math.sinh(n)) / RAD, lng: (x / scale) * 360 - 180 };
}

export const tileX = (lng: number, zoom: number) => Math.floor(project(0, lng, 2 ** zoom).x);
export const tileY = (lat: number, zoom: number) => Math.floor(project(lat, 0, 2 ** zoom).y);
