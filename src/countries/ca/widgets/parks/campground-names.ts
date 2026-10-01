/**
 * French names of reservable campgrounds, as in the French 2026 launch table
 * (https://parcs.canada.ca/voyage-travel/reserve, modified 2026-08-06, checked 2026-09-30). Keys are the
 * English names used in data.ts; a campground that isn't listed has the same name in both languages.
 */
import type { Lang } from './data';

const FR: Record<string, string> = {
  'Tunnel Mountain': 'Mont-Tunnel',
  'Lake Louise': 'Lac Louise',
  'Two Jack Lakeside': 'Two Jack bord-du-lac',
  'Two Jack Main': 'Two Jack Principal',
  'Johnston Canyon': 'Canyon Johnston',
  'Protection Mountain': 'Mont-Protection',
  'Rampart Creek': 'Ruisseau-Rampart',
  'Silverhorn Creek': 'Ruisseau-Silverhorn',
  Overflow: 'Camping auxiliaire',
  'Astotin Lake': 'Lac Astotin',
  'Takakkaw Falls': 'Chutes Takakkaw',
  'Marble Canyon': 'Marble-Canyon',
  'McLeod Meadows': 'Prés-McLeod',
  'Loop Brook': 'Ruisseau-Brook',
  'Hermit Meadows': 'Prés-Hermit',
  Snowforest: 'Forêt de Neige',
  'Green Point': 'Pointe-Green',
  'Sidney Spit': 'Flèche Sidney',
  'Frenchman Valley': 'Vallée-de-la-Frenchman',
  'Rock Creek': 'Ruisseau-Rock',
  'Cyprus Lake': 'Lac Cyprus',
  'Cedar Spring': 'Source aux cèdres',
  'Christian Beach': 'Plage Christian',
  'Camelot Island': 'Île Camelot',
  'Gordon Island': 'Île Gordon',
  'McDonald Island': 'Île McDonald',
  'Mulcaster Island': 'Île Mulcaster',
  'Georgina Island': 'Île Georgina',
  'Aubrey Island': 'Île Aubrey',
  'Beau Rivage Island': 'Île Beau Rivage',
  'Grenadier Island - East': 'Île Grenadier - Est',
  'Île Quarry - Baie Quarry East': 'Île Quarry - Baie Quarry Est',
  'Île Quarry - Baie Quarry West': 'Île Quarry - Baie Quarry Ouest',
  Headquarters: 'Administration',
  'Chignecto North': 'Chignecto Nord',
  'Point Wolfe': 'Pointe-Wolfe',
  'Lakeview (Wolfe Lake)': 'Lac Wolfe (Lake View)',
  'South Kouchibouguac': 'Kouchibouguac Sud',
  Cheticamp: 'Chéticamp',
  "Jeremy's Bay": 'Baie de Jeremy',
  'Trout River Pond': 'Étang Trout River',
  'Pine Lake': 'Lac Pine',
  'Kathleen Lake': 'Lac Kathleen',
  'Hattie Cove': 'L’anse Hattie',
};

export const campgroundName = (name: string, lang: Lang) => (lang === 'fr' ? (FR[name] ?? name) : name);
