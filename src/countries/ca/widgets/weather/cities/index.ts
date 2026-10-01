/**
 * Environment and Climate Change Canada city-page forecast locations (844), generated 2026-09-30 from
 * https://api.weather.gc.ca/collections/citypageweather-realtime/items (identifier, name EN/FR, point).
 * Row: [id, English name, French name when different (else 0), lat, lon]. Province = id prefix.
 * The rows are split by region (one file each) and joined here in the feed's own order.
 */
import { AB, BC } from './west';
import { MB, SK, NT, NU, YT } from './prairies-north';
import { ON } from './ontario';
import { QC } from './quebec';
import { NB, NL, NS, PE } from './atlantic';
import type { CityRow } from './row';

export type { CityRow };

export const CITIES: readonly CityRow[] = [...AB, ...BC, ...MB, ...NB, ...NL, ...NS, ...NT, ...NU, ...ON, ...PE, ...QC, ...SK, ...YT];
