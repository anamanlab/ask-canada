/**
 * Parks Canada facts for the `parks` widget, verified on the official pages on 2026-09-30 (CHECKED in
 * sources.ts). Isomorphic: used by the tools (server) and the renderers (client: instant filtering, the park
 * card for any pin on the map, loading headers and the calculator). Server-only tables live next door:
 * known starting places (places.ts), source entries (sources.ts), endpoints and timeouts (upstream.ts). Official
 * URLs and page titles are in urls.ts; French campground names in campground-names.ts.
 *
 * Verified facts (URL → "Date modified")
 * - The 48 national parks, national park reserves and the national urban park, with the official map
 *   coordinates (data-geometry POINT on the park search page). Names in English and French.
 *   https://parks.canada.ca/pn-np/recherche-parcs-parks-search · https://parcs.canada.ca/pn-np/recherche-parcs-parks-search
 *   French names follow each park's own page where the search page differs: « Parc national du Gros-Morne »
 *   (title and H1 of https://parcs.canada.ca/pn-np/nl/grosmorne, checked 2026-09-30; the search page omits
 *   the hyphen). Matching folds hyphens, so "Gros Morne" still finds it.
 * - Daily admission (adult 18–64, senior 65+, family/group = up to 7 people arriving in one vehicle; youth 17
 *   and under free) from each park's fees page https://parks.canada.ca/pn-np/<prov>/<park>/visit/tarifs-fees
 *   (Date modified listed per park below as `feesUpdated`). Three tiers exist:
 *     $12.25 / $10.75 / $24.50 (Banff, Jasper, Waterton Lakes, Glacier, Kootenay, Pacific Rim, Mount Revelstoke,
 *       Yoho, Gros Morne)
 *     $10.00 / $8.75 / $19.50 (Elk Island, Riding Mountain, Fundy, Kouchibouguac peak season, Cape Breton
 *       Highlands, Bruce Peninsula, Point Pelee April–October, Prince Edward Island, Forillon peak season,
 *       La Mauricie, Prince Albert)
 *     $7.25 / $6.25 / $15.00 (Terra Nova, Kejimkujik, Georgian Bay Islands, Pukaskwa, Mingan Archipelago, Grasslands)
 *   No entry fee: Gulf Islands ("Parks Canada doesn't charge entrance fees"), Wapusk ("No Entry Fee at This
 *   Location"), Rouge ("free and open to the public 365 days a year", https://parks.canada.ca/pn-np/on/rouge).
 *   Kluane, Wood Buffalo and Thaidene Nëné list no daily admission (camping/permit fees only).
 *   Northern Park Backcountry Excursion/Camping: $37.00 per person per night (Aulavik, Auyuittuq, Ivvavik,
 *   Nááts'įhch'oh, Quttinirpaaq, Sirmilik, Tuktut Nogait, Vuntut, Qausuittuq, Ukkusiksalik; Nahanni lists it
 *   as "Daily $37.00"). Northern Park Backcountry Daily Excursions: $17.75 per person per day (no overnight),
 *   listed on the Auyuittuq, Quttinirpaaq, Ukkusiksalik and Qausuittuq fees pages (all 2025-06-16; Sirmilik
 *   lists it for commercial groups only). Re-checked 2026-09-30.
 *   Sable Island day use $37.00 per person. Gwaii Haanas excursion/camping $29.00 adult per day.
 *   Thousand Islands: no admission, parking $9.50 per vehicle per day.
 * - Parks Canada Discovery Pass (12 months, 80+ destinations): adult $83.50, senior $71.50, family/group $167.50
 *   (same on every fees page, e.g. Banff tarifs-fees, 2026-02-12).
 *   https://parks.canada.ca/voyage-travel/admission (2026-09-16): "Regular fees apply as of September 8, 2026";
 *   the Canada Strong Pass (free admission + discounted camping) ended September 7, 2026; free admission for
 *   youth 17 and under, new permanent residents/citizens (Canoo app, 1 year), support persons, CAF members,
 *   Veterans and immediate families. Same page: "If you have a Discovery Pass that was valid during any of the
 *   Canada Strong Pass periods in 2025 or 2026, the pass was automatically extended. See expiry date calculator"
 *   (#calculator; FR « la carte a été automatiquement prolongée », #calculateur). Rechecked 2026-09-30.
 *   Sub-pages admission/jeunes-youth, admission/cultur,
 *   admission/forces-veteran (all 2026-09-21).
 * - Reservations: https://parks.canada.ca/voyage-travel/reserve (2026-08-06): "Reserve camping, accommodations,
 *   and more, at 40 Parks Canada destinations"; online (reservation.pc.gc.ca) or 1-877-737-3783
 *   (1-519-826-5391 outside North America); launch dates for the 2026 season (Jan 20 – Feb 12, 2026 for
 *   national park campgrounds) per campground. 2027 dates are not posted yet. Campground names are the launch
 *   table's own; where it splits one campground by equipment (Banff's Tunnel Mountain and Lake Louise) the
 *   campground is listed once.
 *   Terra Nova: two rows. "Newman Sound (long term campsites, Loops G, J & M)" Monday, February 9, 2026 at
 *   8:30 am NT; "Malady Head, Newman Sound (excluding long term campsites), Backcountry" Wednesday, February 11,
 *   2026 at 8:30 am NT. `launch2026` is the date most campers needed (Feb 11); `launchEarly` is the Feb 9 row.
 *   Pukaskwa: the table lists only "Backcountry Hiking, Backcountry Paddling, Hattie Cove - oTENTiks", and
 *   https://parks.canada.ca/pn-np/on/pukaskwa/visit/reserver-reserve (2026-02-24) says "Hattie Cove campground
 *   operates on a first-come, first-stay basis. Frontcountry reservations are not available." So Pukaskwa has
 *   no reservable campground here: oTENTik and backcountry reservations only (`firstCome`).
 *   Mingan Archipelago: 7 reservable locations (the 8th, "Île à la Chasse - Havre à Landry", is commented out
 *   in the page source).
 *   Point Pelee: "Camp Henry" is the park's oTENTik campground (24 oTENTiks, /pn-np/on/pelee/activ/otentik).
 *   Jasper: the launch table lists "Whistlers Miette Wapiti Overflow" (Jan 27, 2026), and
 *   https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/camping (2026-09-23) marks Overflow "Reservable",
 *   280 sites, June 17 to September 7: 4 reservable campgrounds.
 *   Wood Buffalo (Pine Lake): the launch table lists it twice, under Alberta as "New date Tuesday, February 3,
 *   2026 at 8 am MT" and under Northwest Territories as "Wednesday, January 21, 2026 at 8 am MT" (both visible
 *   on the page, rechecked 2026-09-30). The page contradicts itself, so no launch date is shown for this park
 *   (the widget falls back to the season window and links the launch table).
 *   Banff: the launch table (Feb 12, 2026) leaves out Castle Mountain, but Banff's own camping page
 *   https://parks.canada.ca/pn-np/ab/banff/activ/camping (no "Date modified" shown; checked 2026-09-30) gives it
 *   "2026 Reservable dates June 18 to September 20" with a "Reserve your campsite here" link, so it is listed
 *   (9 campgrounds). Mosquito Creek and Waterfowl Lakes are "First come first served" there and are not listed.
 *   https://parks.canada.ca/voyage-travel/reserve/instructions (2026-08-06): queue opens 30 minutes before;
 *   at 8 am local time (8:30 am in Newfoundland and Labrador) people waiting are placed in random order;
 *   30 minutes to proceed when it's your turn; availability notifications; split your stay across sites;
 *   sign in with GCKey, a bank partner, Google or Facebook; call-centre fees are higher.
 *   Fees pages: "Online Reservation, Modification or Cancellation $11.50"; "by phone $13.50".
 * - Before you go: https://parks.canada.ca/voyage-travel/conseils-tips/faune-wildlife (2025-05-08): 30 m from
 *   deer, moose, elk; 100 m from bears, wolves, coyotes, cougars; feeding wildlife is illegal ("you may be
 *   charged under the Canada National Parks Act"); dogs on leash at all times and drones prohibited in all
 *   Parks Canada places (for these two the page adds "fines up to $25 000").
 * - Count: https://parks.canada.ca/pn-np (2026-08-05): "There are 37 national parks and 11 national park
 *   reserves in Canada". PARKS below has 48 entries: those 48 minus one (Kluane National Park and Kluane
 *   National Park Reserve are one entry, as on the park search page) plus Rouge National Urban Park.
 * - Free admission for CAF members and Veterans: "By presenting the CF One Platinum card … or the Veteran's
 *   Service Card" (admission/forces-veteran, 2026-09-21).
 *   https://parks.canada.ca/voyage-travel/regles-rules (2025-10-31): fires only in designated fire boxes.
 *   https://parks.canada.ca/voyage-travel/securite-safety/urgence-emergency (2026-09-24): call 911; cell
 *   coverage is not always reliable in the backcountry or remote areas.
 * - Live: Important bulletins (fire bans, closures, wildlife warnings), scraped from
 *   https://parks.canada.ca/voyage-travel/securite-safety/bulletins (EN) and parcs.canada.ca (FR).
 * - Live: Canadian Wildland Fire Information System (NRCan) GeoServer https://cwfis.cfs.nrcan.gc.ca/geoserver/public/ows
 *   fdr_current_shp (GRIDCODE 0 Low, 1 Moderate, 2 High, 3 Very High, 4 Extreme per the layer legend,
 *   updated daily), hotspots_last24hrs (satellite hotspots) and m3_polygons_current (fire perimeter estimates).
 */
export type Lang = 'en' | 'fr';
export type Province = 'ab' | 'bc' | 'mb' | 'nb' | 'nl' | 'ns' | 'nt' | 'nu' | 'on' | 'pe' | 'qc' | 'sk' | 'yt';
export const PROVINCES: readonly Province[] = ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'nt', 'nu', 'on', 'pe', 'qc', 'sk', 'yt'];
export type Landscape = 'mountains' | 'coast' | 'lakes' | 'prairie' | 'north';
export const LANDSCAPES: readonly Landscape[] = ['mountains', 'coast', 'lakes', 'prairie', 'north'];
export type Designation = 'np' | 'npr' | 'nup';

/** Daily admission. `tier` parks charge per person (youth free) or per vehicle (family/group). */
export type Admission =
  | { kind: 'daily'; tier: 1 | 2 | 3; season?: 'peak' | 'aprOct' }
  | { kind: 'free' }
  | { kind: 'noDaily' }
  /** Northern park backcountry permit. `dayTrip`: the park also lists a $17.75 daily excursion fee; `perDay`: the permit is listed per day (Nahanni). */
  | { kind: 'northern'; dayTrip?: boolean; perDay?: boolean }
  | { kind: 'sable' }
  | { kind: 'gwaii' }
  | { kind: 'parking' }
  | { kind: 'check' };

export const TIERS = {
  1: { adult: 12.25, senior: 10.75, family: 24.5 },
  2: { adult: 10, senior: 8.75, family: 19.5 },
  3: { adult: 7.25, senior: 6.25, family: 15 },
} as const;
export type Tier = keyof typeof TIERS;
/** The tiers in order, for choice controls. */
export const TIER_KEYS = [1, 2, 3] as const satisfies readonly Tier[];

export const DISCOVERY = { adult: 83.5, senior: 71.5, family: 167.5, destinations: 80, months: 12 } as const;
export const OTHER_FEES = { northernNight: 37, northernDay: 17.75, sableDay: 37, gwaiiDay: 29, parkingDay: 9.5 } as const;
/** A family/group rate covers up to this many people arriving in a single vehicle. */
export const FAMILY_MAX = 7;
export const STRONG_PASS = { ended: '2026-09-07', regularFrom: '2026-09-08' } as const;

export const RESERVATION = {
  online: 11.5,
  phone: 13.5,
  phoneNumber: '1-877-737-3783',
  phoneIntl: '1-519-826-5391',
  destinations: 40,
  season2026: { first: '2026-01-20', last: '2026-02-12' },
  /** The next season, and the day from which its launch dates are usually up (posted in December or January). */
  nextSeason: 2027,
  nextSeasonDatesFrom: '2026-12-01',
  queueOpensMinutes: 30,
  turnMinutes: 30,
} as const;

export const SAFETY = { smallAnimalsM: 30, predatorsM: 100, maxFine: 25_000 } as const;

export type Park = {
  id: string;
  prov: Province;
  /** Path under /pn-np/ on parks.canada.ca and parcs.canada.ca. */
  path: string;
  name: { en: string; fr: string };
  short: { en: string; fr: string };
  lat: number;
  lng: number;
  des: Designation;
  land: Landscape[];
  admission: Admission;
  /** Reservable campgrounds, named as in the 2026 launch table (French names: campground-names.ts). */
  campgrounds?: string[];
  /** Campgrounds that can't be reserved: first come, first served. Listed only where the park has no reservable one. */
  firstCome?: string[];
  backcountry?: boolean;
  otentik?: boolean;
  /** 2026-season reservation launch for the park's campgrounds (local time 8 am, 8:30 am in NL). */
  launch2026?: string;
  /** A small part of the park's sites that opened on an earlier day than `launch2026`. */
  launchEarly?: { date: string; what: { en: string; fr: string } };
  /** Other words people use for the place (towns, lakes, trails). Lower-case, no accents. */
  aka?: string[];
  feesUpdated?: string;
};

export const PARKS: Park[] = [
  // Alberta
  { id: 'banff', prov: 'ab', path: 'ab/banff', name: { en: 'Banff National Park', fr: 'Parc national Banff' }, short: { en: 'Banff', fr: 'Banff' }, lat: 51.178002, lng: -115.570421, des: 'np', land: ['mountains', 'lakes'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Tunnel Mountain', 'Lake Louise', 'Two Jack Lakeside', 'Two Jack Main', 'Johnston Canyon', 'Castle Mountain', 'Protection Mountain', 'Rampart Creek', 'Silverhorn Creek'], backcountry: true, otentik: true, launch2026: '2026-02-12', aka: ['lake louise', 'moraine lake', 'johnston canyon', 'banff townsite', 'icefields parkway', 'bow valley'], feesUpdated: '2026-02-12' },
  { id: 'jasper', prov: 'ab', path: 'ab/jasper', name: { en: 'Jasper National Park', fr: 'Parc national Jasper' }, short: { en: 'Jasper', fr: 'Jasper' }, lat: 52.873735, lng: -118.081022, des: 'np', land: ['mountains', 'lakes'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Whistlers', 'Wapiti', 'Miette', 'Overflow'], backcountry: true, otentik: true, launch2026: '2026-01-27', aka: ['maligne', 'athabasca falls', 'columbia icefield', 'miette hot springs'], feesUpdated: '2025-12-04' },
  { id: 'waterton', prov: 'ab', path: 'ab/waterton', name: { en: 'Waterton Lakes National Park', fr: 'Parc national des Lacs-Waterton' }, short: { en: 'Waterton Lakes', fr: 'Lacs-Waterton' }, lat: 49.08, lng: -113.93, des: 'np', land: ['mountains', 'lakes', 'prairie'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Townsite'], backcountry: true, launch2026: '2026-02-03', aka: ['waterton'], feesUpdated: '2026-09-08' },
  { id: 'elkisland', prov: 'ab', path: 'ab/elkisland', name: { en: 'Elk Island National Park', fr: 'Parc national Elk Island' }, short: { en: 'Elk Island', fr: 'Elk Island' }, lat: 53.6078, lng: -112.8616, des: 'np', land: ['lakes', 'prairie'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Astotin Lake'], backcountry: true, otentik: true, launch2026: '2026-02-03', aka: ['astotin'], feesUpdated: '2025-12-01' },
  // British Columbia
  { id: 'yoho', prov: 'bc', path: 'bc/yoho', name: { en: 'Yoho National Park', fr: 'Parc national Yoho' }, short: { en: 'Yoho', fr: 'Yoho' }, lat: 51.398117, lng: -116.491798, des: 'np', land: ['mountains', 'lakes'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Kicking Horse', 'Monarch', 'Takakkaw Falls'], backcountry: true, launch2026: '2026-01-20', aka: ['lake ohara', 'emerald lake', 'field', 'takakkaw', 'burgess shale'] },
  { id: 'kootenay', prov: 'bc', path: 'bc/kootenay', name: { en: 'Kootenay National Park', fr: 'Parc national Kootenay' }, short: { en: 'Kootenay', fr: 'Kootenay' }, lat: 50.944013, lng: -115.983967, des: 'np', land: ['mountains'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Redstreak', 'Marble Canyon', 'McLeod Meadows'], backcountry: true, otentik: true, launch2026: '2026-01-20', aka: ['radium', 'radium hot springs', 'marble canyon'] },
  { id: 'glacier', prov: 'bc', path: 'bc/glacier', name: { en: 'Glacier National Park', fr: 'Parc national des Glaciers' }, short: { en: 'Glacier', fr: 'Glaciers' }, lat: 51.2679, lng: -117.5235, des: 'np', land: ['mountains'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Illecillewaet', 'Loop Brook', 'Hermit Meadows'], launch2026: '2026-01-29', aka: ['rogers pass'], feesUpdated: '2026-03-11' },
  { id: 'revelstoke', prov: 'bc', path: 'bc/revelstoke', name: { en: 'Mount Revelstoke National Park', fr: 'Parc national du Mont-Revelstoke' }, short: { en: 'Mount Revelstoke', fr: 'Mont-Revelstoke' }, lat: 51.0938, lng: -118.0451, des: 'np', land: ['mountains'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Snowforest'], backcountry: true, launch2026: '2026-01-29', aka: ['revelstoke', 'meadows in the sky'], feesUpdated: '2026-03-11' },
  { id: 'pacificrim', prov: 'bc', path: 'bc/pacificrim', name: { en: 'Pacific Rim National Park Reserve', fr: 'Réserve de parc national Pacific Rim' }, short: { en: 'Pacific Rim', fr: 'Pacific Rim' }, lat: 49.060406, lng: -125.722799, des: 'npr', land: ['coast'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Green Point'], backcountry: true, otentik: true, launch2026: '2026-01-29', aka: ['tofino', 'ucluelet', 'long beach', 'west coast trail', 'broken group'], feesUpdated: '2025-12-03' },
  { id: 'gulf', prov: 'bc', path: 'bc/gulf', name: { en: 'Gulf Islands National Park Reserve', fr: 'Réserve de parc national des Îles-Gulf' }, short: { en: 'Gulf Islands', fr: 'Îles-Gulf' }, lat: 48.66552, lng: -123.407929, des: 'npr', land: ['coast'], admission: { kind: 'free' }, campgrounds: ['SMONEĆTEN', 'Prior Centennial', 'Sidney Spit'], backcountry: true, launch2026: '2026-01-29', aka: ['sidney spit', 'pender island', 'saturna', 'mayne island'], feesUpdated: '2025-12-17' },
  { id: 'gwaiihaanas', prov: 'bc', path: 'bc/gwaiihaanas', name: { en: 'Gwaii Haanas National Park Reserve and Haida Heritage Site', fr: 'Réserve de parc national et site du patrimoine haïda Gwaii Haanas' }, short: { en: 'Gwaii Haanas', fr: 'Gwaii Haanas' }, lat: 52.39, lng: -131.41, des: 'npr', land: ['coast'], admission: { kind: 'gwaii' }, aka: ['haida gwaii', 'sgang gwaay'], feesUpdated: '2026-09-10' },
  // Prairies
  { id: 'riding', prov: 'mb', path: 'mb/riding', name: { en: 'Riding Mountain National Park', fr: 'Parc national du Mont-Riding' }, short: { en: 'Riding Mountain', fr: 'Mont-Riding' }, lat: 50.65768, lng: -99.97219, des: 'np', land: ['lakes', 'prairie'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Wasagaming'], backcountry: true, otentik: true, launch2026: '2026-01-30', aka: ['wasagaming', 'clear lake'], feesUpdated: '2026-09-04' },
  { id: 'wapusk', prov: 'mb', path: 'mb/wapusk', name: { en: 'Wapusk National Park', fr: 'Parc national Wapusk' }, short: { en: 'Wapusk', fr: 'Wapusk' }, lat: 57.8, lng: -93.23, des: 'np', land: ['north', 'coast'], admission: { kind: 'free' }, aka: ['churchill', 'polar bears'], feesUpdated: '2025-06-16' },
  { id: 'princealbert', prov: 'sk', path: 'sk/princealbert', name: { en: 'Prince Albert National Park', fr: 'Parc national de Prince Albert' }, short: { en: 'Prince Albert', fr: 'Prince Albert' }, lat: 53.92296, lng: -106.08319, des: 'np', land: ['lakes'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Beaver Glen', 'Red Deer'], backcountry: true, otentik: true, launch2026: '2026-01-30', aka: ['waskesiu', 'grey owl'], feesUpdated: '2025-12-01' },
  { id: 'grasslands', prov: 'sk', path: 'sk/grasslands', name: { en: 'Grasslands National Park', fr: 'Parc national des Prairies' }, short: { en: 'Grasslands', fr: 'Prairies' }, lat: 49.15088, lng: -107.50903, des: 'np', land: ['prairie'], admission: { kind: 'daily', tier: 3 }, campgrounds: ['Frenchman Valley', 'Rock Creek'], backcountry: true, otentik: true, launch2026: '2026-01-30', aka: ['val marie', 'dark sky'], feesUpdated: '2025-06-19' },
  // Ontario
  { id: 'bruce', prov: 'on', path: 'on/bruce', name: { en: 'Bruce Peninsula National Park', fr: 'Parc national de la Péninsule-Bruce' }, short: { en: 'Bruce Peninsula', fr: 'Péninsule-Bruce' }, lat: 45.2294, lng: -81.5248, des: 'np', land: ['lakes', 'coast'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Cyprus Lake'], backcountry: true, launch2026: '2026-02-02', aka: ['tobermory', 'grotto', 'cyprus lake', 'bruce trail'], feesUpdated: '2025-12-05' },
  { id: 'georg', prov: 'on', path: 'on/georg', name: { en: 'Georgian Bay Islands National Park', fr: 'Parc national des Îles-de-la-Baie-Georgienne' }, short: { en: 'Georgian Bay Islands', fr: 'Îles-de-la-Baie-Georgienne' }, lat: 44.8515, lng: -79.8636, des: 'np', land: ['lakes'], admission: { kind: 'daily', tier: 3 }, campgrounds: ['Cedar Spring', 'Christian Beach'], backcountry: true, otentik: true, launch2026: '2026-02-02', aka: ['beausoleil island', 'honey harbour'], feesUpdated: '2026-02-02' },
  { id: 'pelee', prov: 'on', path: 'on/pelee', name: { en: 'Point Pelee National Park', fr: 'Parc national de la Pointe-Pelée' }, short: { en: 'Point Pelee', fr: 'Pointe-Pelée' }, lat: 41.96284, lng: -82.51847, des: 'np', land: ['lakes', 'coast'], admission: { kind: 'daily', tier: 2, season: 'aprOct' }, campgrounds: ['Camp Henry'], otentik: true, launch2026: '2026-02-02', aka: ['leamington', 'monarch butterflies'], feesUpdated: '2025-06-16' },
  { id: 'pukaskwa', prov: 'on', path: 'on/pukaskwa', name: { en: 'Pukaskwa National Park', fr: 'Parc national Pukaskwa' }, short: { en: 'Pukaskwa', fr: 'Pukaskwa' }, lat: 48.603344, lng: -86.289945, des: 'np', land: ['lakes'], admission: { kind: 'daily', tier: 3 }, firstCome: ['Hattie Cove'], backcountry: true, otentik: true, launch2026: '2026-02-02', aka: ['marathon', 'hattie cove', 'lake superior'], feesUpdated: '2025-06-16' },
  { id: '1000', prov: 'on', path: 'on/1000', name: { en: 'Thousand Islands National Park', fr: 'Parc national des Mille-Îles' }, short: { en: 'Thousand Islands', fr: 'Mille-Îles' }, lat: 44.452961, lng: -75.860812, des: 'np', land: ['lakes'], admission: { kind: 'parking' }, campgrounds: ['Mallorytown Landing', 'Camelot Island', 'Gordon Island', 'McDonald Island', 'Mulcaster Island', 'Georgina Island', 'Aubrey Island', 'Beau Rivage Island', 'Grenadier Island - East'], otentik: true, launch2026: '2026-02-02', aka: ['1000 islands', 'mallorytown', 'st lawrence'], feesUpdated: '2026-04-30' },
  { id: 'rouge', prov: 'on', path: 'on/rouge', name: { en: 'Rouge National Urban Park', fr: 'Parc urbain national de la Rouge' }, short: { en: 'Rouge', fr: 'Rouge' }, lat: 43.848142, lng: -79.199373, des: 'nup', land: ['lakes'], admission: { kind: 'free' }, aka: ['toronto', 'scarborough', 'markham', 'pickering'] },
  // Quebec
  { id: 'mauricie', prov: 'qc', path: 'qc/mauricie', name: { en: 'La Mauricie National Park', fr: 'Parc national de la Mauricie' }, short: { en: 'La Mauricie', fr: 'La Mauricie' }, lat: 46.733253, lng: -72.770799, des: 'np', land: ['lakes'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Rivière-à-la-Pêche', 'Wapizagonke', 'Mistagance'], backcountry: true, otentik: true, launch2026: '2026-02-04', aka: ['shawinigan', 'saint-jean-des-piles', 'wapizagonke'], feesUpdated: '2026-09-25' },
  { id: 'forillon', prov: 'qc', path: 'qc/forillon', name: { en: 'Forillon National Park', fr: 'Parc national Forillon' }, short: { en: 'Forillon', fr: 'Forillon' }, lat: 48.89, lng: -64.35, des: 'np', land: ['coast', 'mountains'], admission: { kind: 'daily', tier: 2, season: 'peak' }, campgrounds: ['Cap-Bon-Ami', 'Des-Rosiers', 'Petit-Gaspé'], backcountry: true, otentik: true, launch2026: '2026-02-04', aka: ['gaspe', 'gaspesie', 'cap gaspe'], feesUpdated: '2026-01-19' },
  { id: 'mingan', prov: 'qc', path: 'qc/mingan', name: { en: 'Mingan Archipelago National Park Reserve', fr: "Réserve de parc national de l'Archipel-de-Mingan" }, short: { en: 'Mingan Archipelago', fr: 'Archipel-de-Mingan' }, lat: 50.2246, lng: -63.5523, des: 'npr', land: ['coast'], admission: { kind: 'daily', tier: 3 }, campgrounds: ['Grande Île - Havre à Petit-Henri', 'Île du Havre - Anse des Noyés', 'Île du Havre - Havre au Sauvage', 'Île Niapiskau - Anse du Noroît', 'Île Nue de Mingan', 'Île Quarry - Baie Quarry East', 'Île Quarry - Baie Quarry West'], otentik: true, launch2026: '2026-02-04', aka: ['havre-saint-pierre', 'longue-pointe-de-mingan', 'monoliths'], feesUpdated: '2025-06-16' },
  // Atlantic
  { id: 'fundy', prov: 'nb', path: 'nb/fundy', name: { en: 'Fundy National Park', fr: 'Parc national Fundy' }, short: { en: 'Fundy', fr: 'Fundy' }, lat: 45.6191, lng: -65.0353, des: 'np', land: ['coast', 'lakes'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Headquarters', 'Chignecto North', 'Point Wolfe', 'Lakeview (Wolfe Lake)', 'Cannontown'], backcountry: true, otentik: true, launch2026: '2026-02-06', aka: ['alma', 'bay of fundy'], feesUpdated: '2025-12-09' },
  { id: 'kouchibouguac', prov: 'nb', path: 'nb/kouchibouguac', name: { en: 'Kouchibouguac National Park', fr: 'Parc national Kouchibouguac' }, short: { en: 'Kouchibouguac', fr: 'Kouchibouguac' }, lat: 46.773001, lng: -65.005412, des: 'np', land: ['coast'], admission: { kind: 'daily', tier: 2, season: 'peak' }, campgrounds: ['South Kouchibouguac', 'Côte-à-Fabien'], backcountry: true, otentik: true, launch2026: '2026-02-06', aka: ['kellys beach'], feesUpdated: '2025-12-09' },
  { id: 'cbreton', prov: 'ns', path: 'ns/cbreton', name: { en: 'Cape Breton Highlands National Park', fr: 'Parc national des Hautes-Terres-du-Cap-Breton' }, short: { en: 'Cape Breton Highlands', fr: 'Hautes-Terres-du-Cap-Breton' }, lat: 46.73, lng: -60.64, des: 'np', land: ['coast', 'mountains'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Cheticamp', 'Broad Cove', 'Ingonish Beach', 'Mkwesaqtuk / Cap-Rouge'], backcountry: true, otentik: true, launch2026: '2026-02-09', aka: ['cabot trail', 'skyline trail', 'ingonish', 'cheticamp'], feesUpdated: '2026-03-11' },
  { id: 'kejimkujik', prov: 'ns', path: 'ns/kejimkujik', name: { en: 'Kejimkujik National Park and National Historic Site', fr: 'Parc national et lieu historique national Kejimkujik' }, short: { en: 'Kejimkujik', fr: 'Kejimkujik' }, lat: 44.43829, lng: -65.2086, des: 'np', land: ['lakes', 'coast'], admission: { kind: 'daily', tier: 3 }, campgrounds: ["Jeremy's Bay", 'Jakes Landing'], backcountry: true, otentik: true, launch2026: '2026-02-11', aka: ['keji', 'kejimkujik seaside'], feesUpdated: '2026-09-08' },
  { id: 'sable', prov: 'ns', path: 'ns/sable', name: { en: 'Sable Island National Park Reserve', fr: "Réserve de parc national de l'Île-de-Sable" }, short: { en: 'Sable Island', fr: 'Île-de-Sable' }, lat: 43.92788, lng: -59.91591, des: 'npr', land: ['coast'], admission: { kind: 'sable' }, aka: ['sable', 'wild horses'], feesUpdated: '2025-09-03' },
  { id: 'pei', prov: 'pe', path: 'pe/pei-ipe', name: { en: 'Prince Edward Island National Park', fr: "Parc national de l'Île-du-Prince-Édouard" }, short: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard' }, lat: 46.4156, lng: -63.0742, des: 'np', land: ['coast'], admission: { kind: 'daily', tier: 2 }, campgrounds: ['Cavendish', 'Stanhope'], otentik: true, launch2026: '2026-02-09', aka: ['cavendish', 'brackley', 'greenwich', 'pei'], feesUpdated: '2022-03-15' },
  { id: 'grosmorne', prov: 'nl', path: 'nl/grosmorne', name: { en: 'Gros Morne National Park', fr: 'Parc national du Gros-Morne' }, short: { en: 'Gros Morne', fr: 'Gros-Morne' }, lat: 49.689444, lng: -57.738056, des: 'np', land: ['mountains', 'coast'], admission: { kind: 'daily', tier: 1 }, campgrounds: ['Berry Hill', 'Green Point', 'Shallow Bay', 'Trout River Pond', 'Lomond'], backcountry: true, otentik: true, launch2026: '2026-02-11', aka: ['western brook pond', 'tablelands', 'rocky harbour', 'bonne bay'], feesUpdated: '2025-12-12' },
  { id: 'terranova', prov: 'nl', path: 'nl/terranova', name: { en: 'Terra Nova National Park', fr: 'Parc national Terra-Nova' }, short: { en: 'Terra Nova', fr: 'Terra-Nova' }, lat: 48.5256, lng: -53.9638, des: 'np', land: ['coast', 'lakes'], admission: { kind: 'daily', tier: 3 }, campgrounds: ['Newman Sound', 'Malady Head'], backcountry: true, otentik: true, launch2026: '2026-02-11', launchEarly: { date: '2026-02-09', what: { en: 'Newman Sound long-term campsites (loops G, J and M)', fr: 'emplacements de longue durée de Newman Sound (boucles G, J et M)' } }, aka: ['newman sound', 'glovertown'], feesUpdated: '2025-06-16' },
  { id: 'torngats', prov: 'nl', path: 'nl/torngats', name: { en: 'Torngat Mountains National Park', fr: 'Parc national du Canada des Monts-Torngat' }, short: { en: 'Torngat Mountains', fr: 'Monts-Torngat' }, lat: 59.4358, lng: -63.6964, des: 'np', land: ['north', 'mountains'], admission: { kind: 'check' }, aka: ['torngat', 'nain', 'saglek'] },
  { id: 'mealy', prov: 'nl', path: 'nl/mealy', name: { en: 'Akami-Uapishkᵁ-KakKasuak-Mealy Mountains National Park Reserve', fr: 'Réserve de parc national Akami-Uapishkᵁ – KakKasuak – Monts Mealy' }, short: { en: 'Mealy Mountains', fr: 'Monts Mealy' }, lat: 53.572076, lng: -58.348138, des: 'npr', land: ['north', 'mountains'], admission: { kind: 'check' }, aka: ['mealy', 'akami-uapishku', 'kakkasuak', 'happy valley-goose bay'] },
  // North
  { id: 'kluane', prov: 'yt', path: 'yt/kluane', name: { en: 'Kluane National Park and Reserve', fr: 'Parc national et réserve de parc national Kluane' }, short: { en: 'Kluane', fr: 'Kluane' }, lat: 60.76, lng: -137.51, des: 'np', land: ['mountains', 'north'], admission: { kind: 'noDaily' }, campgrounds: ['Kathleen Lake'], backcountry: true, otentik: true, launch2026: '2026-01-20', aka: ['haines junction', 'mount logan', 'kathleen lake'], feesUpdated: '2026-06-18' },
  { id: 'ivvavik', prov: 'yt', path: 'yt/ivvavik', name: { en: 'Ivvavik National Park', fr: 'Parc national Ivvavik' }, short: { en: 'Ivvavik', fr: 'Ivvavik' }, lat: 69.026095, lng: -139.72997, des: 'np', land: ['north'], admission: { kind: 'northern' }, aka: ['firth river', 'inuvik'], feesUpdated: '2026-04-29' },
  { id: 'vuntut', prov: 'yt', path: 'yt/vuntut', name: { en: 'Vuntut National Park', fr: 'Parc national Vuntut' }, short: { en: 'Vuntut', fr: 'Vuntut' }, lat: 68.39, lng: -139.86, des: 'np', land: ['north'], admission: { kind: 'northern' }, aka: ['old crow'], feesUpdated: '2025-09-18' },
  { id: 'nahanni', prov: 'nt', path: 'nt/nahanni', name: { en: 'Nahanni National Park Reserve', fr: 'Réserve de parc national Nahanni' }, short: { en: 'Nahanni', fr: 'Nahanni' }, lat: 61.6101, lng: -125.9035, des: 'npr', land: ['north', 'mountains'], admission: { kind: 'northern', perDay: true }, aka: ['virginia falls', 'south nahanni', 'fort simpson'], feesUpdated: '2025-06-16' },
  { id: 'naatsihchoh', prov: 'nt', path: 'nt/naatsihchoh', name: { en: "Nááts'įhch'oh National Park Reserve", fr: "Réserve de parc national Nááts'įhch'oh" }, short: { en: "Nááts'įhch'oh", fr: "Nááts'įhch'oh" }, lat: 62.74438, lng: -128.20169, des: 'npr', land: ['north', 'mountains'], admission: { kind: 'northern' }, aka: ['naats ihch oh', 'naatsihchoh'], feesUpdated: '2026-02-25' },
  { id: 'woodbuffalo', prov: 'nt', path: 'nt/woodbuffalo', name: { en: 'Wood Buffalo National Park', fr: 'Parc national Wood Buffalo' }, short: { en: 'Wood Buffalo', fr: 'Wood Buffalo' }, lat: 59.36, lng: -113.2581, des: 'np', land: ['north', 'lakes'], admission: { kind: 'noDaily' }, campgrounds: ['Pine Lake'], backcountry: true, aka: ['fort smith', 'fort chipewyan', 'dark sky preserve'], feesUpdated: '2025-06-16' },
  { id: 'thaidene', prov: 'nt', path: 'nt/thaidene-nene', name: { en: 'Thaidene Nëné National Park Reserve', fr: 'Réserve de parc national Thaidene Nëné' }, short: { en: 'Thaidene Nëné', fr: 'Thaidene Nëné' }, lat: 62.40354, lng: -110.694782, des: 'npr', land: ['north', 'lakes'], admission: { kind: 'noDaily' }, aka: ['thaidene nene', 'lutselke', 'great slave lake'], feesUpdated: '2025-06-16' },
  { id: 'tuktutnogait', prov: 'nt', path: 'nt/tuktutnogait', name: { en: 'Tuktut Nogait National Park', fr: 'Parc national Tuktut Nogait' }, short: { en: 'Tuktut Nogait', fr: 'Tuktut Nogait' }, lat: 68.75, lng: -121.8127, des: 'np', land: ['north'], admission: { kind: 'northern' }, aka: ['paulatuk'], feesUpdated: '2025-06-16' },
  { id: 'aulavik', prov: 'nt', path: 'nt/aulavik', name: { en: 'Aulavik National Park', fr: 'Parc national Aulavik' }, short: { en: 'Aulavik', fr: 'Aulavik' }, lat: 73.727, lng: -119.5956, des: 'np', land: ['north'], admission: { kind: 'northern' }, aka: ['banks island', 'sachs harbour'], feesUpdated: '2025-06-16' },
  { id: 'auyuittuq', prov: 'nu', path: 'nu/auyuittuq', name: { en: 'Auyuittuq National Park', fr: 'Parc national Auyuittuq' }, short: { en: 'Auyuittuq', fr: 'Auyuittuq' }, lat: 67.3683, lng: -66.0107, des: 'np', land: ['north', 'mountains'], admission: { kind: 'northern', dayTrip: true }, aka: ['pangnirtung', 'qikiqtarjuaq', 'akshayuk pass', 'mount thor'], feesUpdated: '2025-06-16' },
  { id: 'sirmilik', prov: 'nu', path: 'nu/sirmilik', name: { en: 'Sirmilik National Park', fr: 'Parc national Sirmilik' }, short: { en: 'Sirmilik', fr: 'Sirmilik' }, lat: 73.08, lng: -79.83, des: 'np', land: ['north'], admission: { kind: 'northern' }, aka: ['pond inlet', 'bylot island'], feesUpdated: '2025-06-16' },
  { id: 'quttinirpaaq', prov: 'nu', path: 'nu/quttinirpaaq', name: { en: 'Quttinirpaaq National Park', fr: 'Parc national Quttinirpaaq' }, short: { en: 'Quttinirpaaq', fr: 'Quttinirpaaq' }, lat: 82.1323, lng: -71.6481, des: 'np', land: ['north', 'mountains'], admission: { kind: 'northern', dayTrip: true }, aka: ['ellesmere island', 'lake hazen'], feesUpdated: '2025-06-16' },
  { id: 'ukkusiksalik', prov: 'nu', path: 'nu/ukkusiksalik', name: { en: 'Ukkusiksalik National Park', fr: 'Parc national Ukkusiksalik' }, short: { en: 'Ukkusiksalik', fr: 'Ukkusiksalik' }, lat: 65.85, lng: -89.76, des: 'np', land: ['north', 'coast'], admission: { kind: 'northern', dayTrip: true }, aka: ['wager bay', 'naujaat'], feesUpdated: '2025-06-16' },
  { id: 'qausuittuq', prov: 'nu', path: 'nu/qausuittuq', name: { en: 'Qausuittuq National Park', fr: 'Parc national Qausuittuq' }, short: { en: 'Qausuittuq', fr: 'Qausuittuq' }, lat: 76, lng: -100, des: 'np', land: ['north'], admission: { kind: 'northern', dayTrip: true }, aka: ['bathurst island', 'resolute'], feesUpdated: '2025-06-16' },
];

/** Parks where something can be reserved: a campground, oTENTiks or backcountry sites. */
export const hasReservations = (p: Park) => !!(p.campgrounds?.length || p.otentik || p.backcountry);

/** What can be reserved in a park that has no reservable campground: oTENTiks, backcountry sites, both, or nothing. */
export const staysOnly = (p: Park) => (p.campgrounds?.length ? null : p.otentik && p.backcountry ? 'both' : p.otentik ? 'otentik' : p.backcountry ? 'backcountry' : null);

/** No fire boxes to point people to: northern parks, and parks without a frontcountry campground. */
export const isRemote = (p: Park) => p.admission.kind === 'northern' || !(p.campgrounds?.length || p.firstCome?.length);

export const parkById = (id: string | undefined | null) => (id ? PARKS.find((p) => p.id === id) : undefined);

export const HOTSPOT_RADIUS_KM = 50;

/** How people write each province and territory, in English and French ("parks in Alberta", "au Québec"). */
export const PROVINCE_NAMES: Record<Province, string[]> = {
  ab: ['alberta'],
  bc: ['british columbia', 'colombie-britannique', 'b.c.', 'bc'],
  mb: ['manitoba'],
  nb: ['new brunswick', 'nouveau-brunswick'],
  nl: ['newfoundland', 'labrador', 'terre-neuve'],
  ns: ['nova scotia', 'nouvelle-ecosse', 'nouvelle-écosse'],
  nt: ['northwest territories', 'territoires du nord-ouest', 'nwt', 't.n.-o.'],
  nu: ['nunavut'],
  on: ['ontario'],
  pe: ['prince edward island', 'ile-du-prince-edouard', 'île-du-prince-édouard', 'p.e.i.'],
  qc: ['quebec', 'québec'],
  sk: ['saskatchewan'],
  yt: ['yukon'],
};
