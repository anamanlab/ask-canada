/**
 * Lab fixture inputs for alerts, the AQHI and fire hotspots, in the exact shape of the live feeds
 * (weather-alerts, aqhi-observations/forecasts, CWFIS hotspots). The fog, storm surge and frost alerts are
 * the real ones from 2026-09-30; the others are written in Environment Canada's style for the full range.
 */
import { HEAT_NOW, NOW, SMOKE_NOW, WINTER_NOW, at, type Bi } from './fixture-city';
import type { RawAlert, RawAqhiForecast, RawAqhiObservation, RawHotspot } from './schemas';

/* ------------------------------------------------------------------ alerts */

type AlertSpec = {
  code: string;
  type: 'warning' | 'watch' | 'advisory' | 'statement';
  colour: 'yellow' | 'orange' | 'red' | null;
  name: Bi;
  short: Bi;
  area: Bi;
  prov: string;
  text?: Bi;
  impact?: Bi;
  confidence?: Bi;
  endsIn?: number;
  status?: string;
  /** The fixture's clock (default NOW). */
  base?: Date;
};

export function alertFeature(a: AlertSpec, i = 0): RawAlert {
  return {
    id: `fx-${a.code}-${i}`,
    properties: {
      alert_code: a.code,
      alert_type: a.type,
      alert_name_en: a.name[0],
      alert_name_fr: a.name[1] ?? a.name[0],
      alert_short_name_en: a.short[0],
      alert_short_name_fr: a.short[1] ?? a.short[0],
      publication_datetime: at(-2, a.base),
      expiration_datetime: at(8, a.base),
      event_end_datetime: a.endsIn != null ? at(a.endsIn, a.base) : null,
      alert_text_en: a.text?.[0] ?? '',
      alert_text_fr: a.text?.[1] ?? a.text?.[0] ?? '',
      risk_colour_en: a.colour,
      impact_en: a.impact?.[0] ?? null,
      impact_fr: a.impact?.[1] ?? null,
      confidence_en: a.confidence?.[0] ?? null,
      confidence_fr: a.confidence?.[1] ?? null,
      feature_name_en: a.area[0],
      feature_name_fr: a.area[1] ?? a.area[0],
      province: a.prov,
      status_en: a.status ?? 'issued',
      feature_id: `fea-${a.code}-${i}`,
    },
  };
}

const HIGH: Bi = ['High', 'élevée'];

export const BLIZZARD = alertFeature({
  code: 'BZW',
  type: 'warning',
  colour: 'orange',
  name: ['blizzard warning', 'avertissement de blizzard'],
  short: ['Blizzard (warning)', 'Blizzard (avertissement)'],
  area: ['City of Winnipeg', 'ville de Winnipeg'],
  prov: 'MB',
  impact: ['High', 'élevé'],
  confidence: HIGH,
  endsIn: 8,
  base: WINTER_NOW,
  text: [
    'Blizzard conditions with near-zero visibility in snow and blowing snow are expected.\n\nWhat: Northwest winds gusting to 80 km/h combined with 5 to 10 cm of snow. Wind chill values near minus 38 overnight.\n\nWhen: Continuing this evening, easing near midnight.\n\nTravel is expected to be hazardous due to reduced visibility. If visibility is reduced while driving, slow down, watch for tail lights ahead and be prepared to stop. Frostbite can develop within minutes on exposed skin.\n\nPlease continue to monitor alerts and forecasts issued by Environment Canada.',
    'On prévoit des conditions de blizzard avec une visibilité quasi nulle dans la neige et la poudrerie.\n\nQuoi : Vents du nord-ouest avec rafales à 80 km/h, combinés à 5 à 10 cm de neige. Refroidissement éolien près de moins 38 pendant la nuit.\n\nQuand : Ce soir, diminuant vers minuit.\n\nLes déplacements risquent d’être dangereux en raison de la visibilité réduite. Si la visibilité est réduite pendant que vous conduisez, ralentissez, surveillez les feux arrière devant vous et soyez prêts à vous arrêter. Des engelures peuvent se développer en quelques minutes sur la peau exposée.\n\nVeuillez continuer à surveiller les alertes et les prévisions émises par Environnement Canada.',
  ],
});

export const EXTREME_COLD = alertFeature({
  code: 'ECW',
  type: 'warning',
  colour: 'yellow',
  name: ['extreme cold warning', 'avertissement de froid extrême'],
  short: ['Extreme cold (warning)', 'Froid extrême (avertissement)'],
  area: ['City of Winnipeg', 'ville de Winnipeg'],
  prov: 'MB',
  impact: ['Moderate', 'modéré'],
  confidence: HIGH,
  endsIn: 15,
  base: WINTER_NOW,
  text: [
    'Wind chill values of minus 38 to minus 42 are expected tonight and Thursday morning.\n\nDress warmly in layers and cover as much exposed skin as possible. Watch for cold-related symptoms: shortness of breath, chest pain, muscle pain and weakness, numbness and colour change in fingers and toes.',
    'On prévoit des valeurs de refroidissement éolien de moins 38 à moins 42 cette nuit et jeudi matin.\n\nHabillez-vous chaudement en plusieurs couches et couvrez le plus de peau exposée possible. Surveillez les symptômes liés au froid : essoufflement, douleur à la poitrine, douleurs et faiblesse musculaires, engourdissement et changement de couleur des doigts et des orteils.',
  ],
});

export const HEAT = alertFeature({
  code: 'HWW',
  type: 'warning',
  colour: 'yellow',
  name: ['heat warning', 'avertissement de chaleur'],
  short: ['Heat (warning)', 'Chaleur (avertissement)'],
  area: ['City of Toronto', 'ville de Toronto'],
  prov: 'ON',
  impact: ['Moderate', 'modéré'],
  confidence: HIGH,
  endsIn: 28,
  base: HEAT_NOW,
  text: [
    'A period of very hot and humid weather is expected today and Thursday.\n\nDaytime highs of 32 to 34°C with humidex values of 40 to 43. Overnight lows near 24°C will provide little relief.\n\nDrink plenty of water even before you feel thirsty and stay in a cool place. Check on older family, friends and neighbours. Never leave people or pets inside a parked vehicle.',
    'Une période de temps très chaud et humide est prévue aujourd’hui et jeudi.\n\nMaximums diurnes de 32 à 34 °C avec des valeurs d’humidex de 40 à 43. Des minimums nocturnes près de 24 °C n’offriront que peu de répit.\n\nBuvez beaucoup d’eau avant même d’avoir soif et restez dans un endroit frais. Prenez des nouvelles des membres âgés de votre famille, de vos amis et de vos voisins. Ne laissez jamais de personnes ou d’animaux dans un véhicule stationné.',
  ],
});

export const AIR_QUALITY = alertFeature({
  code: 'AQW',
  type: 'warning',
  colour: 'orange',
  name: ['air quality warning', 'avertissement sur la qualité de l’air'],
  short: ['Air quality (warning)', 'Qualité de l’air (avertissement)'],
  area: ['Central Okanagan including Kelowna', 'Okanagan - centre incluant Kelowna'],
  prov: 'BC',
  impact: ['High', 'élevé'],
  confidence: HIGH,
  endsIn: 21,
  base: SMOKE_NOW,
  text: [
    'Wildfire smoke is causing poor air quality and reduced visibility.\n\nSmoke levels are expected to stay high through Thursday as winds keep smoke from nearby fires over the valley.\n\nLimit time outdoors. If you must be outside, reduce strenuous activity. People with lung or heart conditions, older adults, children, pregnant people and people who work outdoors are at higher risk.',
    'La fumée des feux de forêt entraîne une mauvaise qualité de l’air et une visibilité réduite.\n\nLes concentrations de fumée devraient demeurer élevées jusqu’à jeudi, car les vents maintiennent la fumée des feux voisins au-dessus de la vallée.\n\nLimitez le temps passé à l’extérieur. Si vous devez sortir, réduisez les activités intenses. Les personnes ayant des problèmes pulmonaires ou cardiaques, les personnes âgées, les enfants, les personnes enceintes et les personnes qui travaillent à l’extérieur sont plus à risque.',
  ],
});

export const WIND_NS = alertFeature({
  code: 'WDW',
  type: 'warning',
  colour: 'orange',
  name: ['wind warning', 'avertissement de vent'],
  short: ['Wind (warning)', 'Vent (avertissement)'],
  area: ['Halifax Metro and Halifax County West', 'Halifax Metro et comté de Halifax Ouest'],
  prov: 'NS',
  impact: ['High', 'élevé'],
  confidence: ['Moderate', 'modérée'],
  endsIn: 18,
  text: [
    'Strong southerly winds gusting to 110 km/h are expected tonight into Thursday morning.\n\nWidespread power outages, some roof damage and snapped trees are possible. Secure loose objects outdoors and avoid coastal areas.',
    'On prévoit de forts vents du sud avec des rafales jusqu’à 110 km/h cette nuit et jeudi matin.\n\nDes pannes de courant généralisées, des dommages à certaines toitures et des arbres cassés sont possibles. Fixez les objets extérieurs et évitez les zones côtières.',
  ],
});

export const RAIN_NS = alertFeature({
  code: 'RFW',
  type: 'warning',
  colour: 'yellow',
  name: ['rainfall warning', 'avertissement de pluie'],
  short: ['Rainfall (warning)', 'Pluie (avertissement)'],
  area: ['Halifax Metro and Halifax County West', 'Halifax Metro et comté de Halifax Ouest'],
  prov: 'NS',
  impact: ['Moderate', 'modéré'],
  confidence: HIGH,
  endsIn: 20,
  text: ['Rain, heavy at times, with total amounts of 50 to 70 mm is expected.', 'On prévoit de la pluie, parfois forte, avec des quantités totales de 50 à 70 mm.'],
});

/** Today's real alerts across Canada (2026-09-30) plus a synthetic red for the full palette. */
const FOG_TEXT: Bi = [
  'Dense fog patches have formed in these areas.\n\nThe fog will clear during the morning.\n\nBe prepared for areas of near-zero visibility and allow extra time to reach your destination. If driving, turn on your lights, slow down and maintain a safe following distance.',
  'Des nappes de brouillard dense se sont formées dans ces secteurs.\n\nLe brouillard se dissipera au cours de la matinée.\n\nSoyez prêts à composer avec des zones où la visibilité est quasi nulle et prévoyez plus de temps pour vous rendre à destination. Si vous conduisez, allumez vos phares, ralentissez et maintenez une distance sécuritaire.',
];
const FOG_AREAS: Bi[] = [
  ['Amqui area', 'secteur d’Amqui'], ['Baie-Saint-Paul area', 'secteur de Baie-Saint-Paul'], ['Kamouraska area', 'secteur de Kamouraska'],
  ['La Malbaie area', 'secteur de La Malbaie'], ['La Tuque area', 'secteur de La Tuque'], ['Louiseville area', 'secteur de Louiseville'],
  ['Rivière-du-Loup area', 'secteur de Rivière-du-Loup'], ['Shawinigan area', 'secteur de Shawinigan'], ['Trois-Pistoles area', 'secteur de Trois-Pistoles'],
  ['Trois-Rivières area', 'secteur de Trois-Rivières'],
];
export const CANADA_TODAY = [
  ...FOG_AREAS.map((area, i) =>
    alertFeature({ code: 'FGA', type: 'advisory', colour: 'yellow', name: ['fog advisory', 'avis de brouillard'], short: ['Fog (advisory)', 'Brouillard (avis)'], area, prov: 'QC', text: FOG_TEXT, endsIn: 4, impact: ['Moderate', 'modéré'], confidence: HIGH }, i),
  ),
  // The same fog advisory in Ontario, ending an hour before Quebec's: one hazard, two provinces, two end times.
  alertFeature({ code: 'FGA', type: 'advisory', colour: 'yellow', name: ['fog advisory', 'avis de brouillard'], short: ['Fog (advisory)', 'Brouillard (avis)'], area: ['Marathon - Schreiber'], prov: 'ON', text: FOG_TEXT, endsIn: 3, impact: ['Moderate', 'modéré'], confidence: HIGH }, 11),
  alertFeature({ code: 'CFW', type: 'warning', colour: 'yellow', name: ['storm surge warning', 'avertissement d’onde de tempête'], short: ['Storm surge (warning)', 'Onde de tempête (avertissement)'], area: ['Coastline of Yukon incl. Herschel Island', 'Littoral du Yukon incluant l’île Herschel'], prov: 'YT', endsIn: 31 }, 20),
  alertFeature({ code: 'CFW', type: 'warning', colour: 'yellow', name: ['storm surge warning', 'avertissement d’onde de tempête'], short: ['Storm surge (warning)', 'Onde de tempête (avertissement)'], area: ['Coastline from Mackenzie Bay to McKinley Bay incl. Tuktoyaktuk', 'Littoral de la baie Mackenzie à la baie McKinley incluant Tuktoyaktuk'], prov: 'NT', endsIn: 31 }, 21),
  alertFeature({ code: 'FTA', type: 'advisory', colour: 'yellow', name: ['frost advisory', 'avis de gel'], short: ['Frost (advisory)', 'Gel (avis)'], area: ['Rocky View Co. near Cochrane', 'cté de Rocky View près de Cochrane'], prov: 'AB', status: 'ended' }, 22),
  { ...WIND_NS, id: 'fx-wind-2', properties: { ...WIND_NS.properties, feature_name_en: 'Lunenburg County', feature_name_fr: 'comté de Lunenburg', feature_id: 'w2' } },
  WIND_NS,
  alertFeature({ code: 'TOW', type: 'warning', colour: 'red', name: ['tornado warning', 'avertissement de tornade'], short: ['Tornado (warning)', 'Tornade (avertissement)'], area: ['Grande Prairie County near Beaverlodge', 'comté de Grande Prairie près de Beaverlodge'], prov: 'AB', endsIn: 1, impact: ['Extreme', 'extrême'], confidence: HIGH }, 30),
  // The same area under a second alert: counted once (at red), not twice.
  alertFeature({ code: 'SVW', type: 'watch', colour: 'yellow', name: ['severe thunderstorm watch', 'veille d’orages violents'], short: ['Severe thunderstorm (watch)', 'Orages violents (veille)'], area: ['Grande Prairie County near Beaverlodge', 'comté de Grande Prairie près de Beaverlodge'], prov: 'AB', endsIn: 6 }, 32),
  alertFeature({ code: 'SWS', type: 'statement', colour: null, name: ['special weather statement', 'bulletin météorologique spécial'], short: ['Special weather statement', 'Bulletin météorologique spécial'], area: ['Fundy National Park', 'Parc national de Fundy'], prov: 'NB' }, 31),
];

/* ------------------------------------------------------------------ AQHI + hotspots */

/**
 * When the AQHI forecast in effect at `now` was issued: forecasts are issued at 6 a.m. and 5 p.m. local
 * time (air-quality-health-index/about.html), so the latest of those at or before `now` in `tz`.
 */
function aqhiIssuedAt(now: Date, tz: string): string {
  const hourIn = (d: Date) => Number(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d));
  const top = new Date(Math.floor(now.getTime() / 3600_000) * 3600_000);
  for (let h = 0; h < 24; h++) {
    const d = new Date(top.getTime() - h * 3600_000);
    if ([6, 17].includes(hourIn(d))) return d.toISOString().replace('.000Z', 'Z');
  }
  return top.toISOString();
}

export const aqhiObs = (aqhi: number, hoursAgo = 1, base: Date = NOW): RawAqhiObservation => ({
  properties: { observation_datetime: at(-hoursAgo, base), aqhi, special_notes_en: '', special_notes_fr: '' },
});

export const aqhiFcst = (periods: [Bi, number, number?][], base: Date = NOW, tz = 'America/Toronto'): RawAqhiForecast => ({
  properties: {
    publication_datetime: aqhiIssuedAt(base, tz),
    forecast_period: Object.fromEntries(
      periods.map(([label, aqhi, smoke], i) => [
        `period_${i + 1}`,
        { forecast_period_en: label[0], forecast_period_fr: label[1] ?? label[0], aqhi, aqhi_insmoke: smoke ?? null },
      ]),
    ),
  },
});

export const PERIODS: Record<string, Bi> = {
  today: ['Today', 'Aujourd’hui'],
  tonight: ['Tonight', 'Ce soir et cette nuit'],
  tomorrow: ['Tomorrow', 'Demain'],
  tomorrowNight: ['Tomorrow Night', 'Demain soir et nuit'],
  day3: ['Day 3', 'Jour 3'],
};

/** Hotspots scattered at given distances (km) north-east of a point. */
export const hotspotsAround = (lat: number, lon: number, kms: number[]): RawHotspot[] =>
  kms.map((km, i) => ({ properties: { lat: lat + (km / 111) * Math.cos(i), lon: lon + (km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(i) } }));
