/**
 * Lab fixture places, as city-page specs (built by fixture-city.ts into the live feed's shape). The Ottawa and
 * Trois-Rivières values are from the live feeds on 2026-09-30; the other places are realistic seasonal
 * scenarios written in Environment Canada's style for the edge cases. Each one lives on a date its weather
 * is plausible for (a Winnipeg blizzard in January, a Toronto heat warning in July, Okanagan wildfire smoke
 * in August), with that place's real sunrise and sunset for the date (NOAA solar calculation, within a
 * minute of NRC's sunrise/sunset tables).
 */
import { HEAT_NOW, SMOKE_NOW, WINTER_NOW, cityRaw, type Bi } from './fixture-city';

const MC: Bi = ['Mainly cloudy', 'Généralement nuageux'];
const MIX: Bi = ['A mix of sun and cloud', 'Alternance de soleil et de nuages'];

export const OTTAWA = cityRaw({
  id: 'on-118',
  name: ['Ottawa (Kanata - Orléans)'],
  region: ['Ottawa North - Kanata - Orléans', 'ville d’Ottawa Nord - Kanata - Orléans'],
  lat: 45.4,
  lon: -75.69,
  current: {
    temp: 10.5,
    icon: 28,
    condition: ['Light Drizzle', 'Bruine faible'],
    humidity: 99,
    dewpoint: 10.4,
    wind: [5, 'S', 'S', 181, 37],
    pressure: [101.9, ['falling', 'à la baisse']],
    station: ['Ottawa Macdonald-Cartier Int’l Airport'],
  },
  normals: [16, 6],
  periods: [
    { name: ['Today', 'Aujourd’hui'], temp: 21, icon: 28, summary: ['Periods of drizzle', 'Bruine intermittente'], text: ['Mainly cloudy. 40 percent chance of drizzle early this morning. Fog patches dissipating this morning. Wind becoming south 20 km/h this morning. High 21. Humidex 25. UV index 5 or moderate.', 'Généralement nuageux. 40 pour cent de probabilité de bruine tôt ce matin. Nappes de brouillard se dissipant ce matin. Vents devenant du sud à 20 km/h ce matin. Maximum 21. Humidex 25. Indice UV de 5 ou modéré.'], uv: [5, ['moderate', 'modéré']], humidex: 25 },
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: 15, icon: 33, summary: MC, text: ['Mainly cloudy. Low 15.', 'Généralement nuageux. Minimum 15.'] },
    { name: ['Thursday', 'Jeudi'], temp: 21, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy. 30 percent chance of showers late in the morning and in the afternoon. Wind becoming southwest 20 km/h late in the morning. High 21. Humidex 26. UV index 5 or moderate.', 'Nuageux. 30 pour cent de probabilité d’averses tard le matin et en après-midi. Vents devenant du sud-ouest à 20 km/h tard le matin. Maximum 21. Humidex 26. Indice UV de 5 ou modéré.'], uv: [5, ['moderate', 'modéré']] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: 13, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy with 40 percent chance of showers. Low 13.', 'Nuageux avec 40 pour cent de probabilité d’averses. Minimum 13.'] },
    { name: ['Friday', 'Vendredi'], temp: 16, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy with 30 percent chance of showers. High 16.', 'Nuageux avec 30 pour cent de probabilité d’averses. Maximum 16.'] },
    { name: ['Friday night', 'Vendredi soir et nuit'], low: true, temp: 7, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low 7.', 'Dégagé. Minimum 7.'] },
    { name: ['Saturday', 'Samedi'], temp: 17, icon: 0, summary: ['Sunny', 'Ensoleillé'], text: ['Sunny. High 17.', 'Ensoleillé. Maximum 17.'] },
    { name: ['Saturday night', 'Samedi soir et nuit'], low: true, temp: 7, icon: 10, summary: ['Cloudy', 'Nuageux'], text: ['Increasing cloudiness. Low 7.', 'Ennuagement. Minimum 7.'] },
    { name: ['Sunday', 'Dimanche'], temp: 15, icon: 10, summary: ['Cloudy', 'Nuageux'], text: ['Cloudy. High 15.', 'Nuageux. Maximum 15.'] },
    { name: ['Sunday night', 'Dimanche soir et nuit'], low: true, temp: 6, icon: 32, summary: ['Cloudy periods', 'Passages nuageux'], text: ['Cloudy periods. Low 6.', 'Passages nuageux. Minimum 6.'] },
    { name: ['Monday', 'Lundi'], temp: 12, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 12.', 'Alternance de soleil et de nuages. Maximum 12.'] },
    { name: ['Monday night', 'Lundi soir et nuit'], low: true, temp: 2, icon: 32, summary: ['Cloudy periods', 'Passages nuageux'], text: ['Cloudy periods. Low plus 2.', 'Passages nuageux. Minimum plus 2.'] },
    { name: ['Tuesday', 'Mardi'], temp: 14, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 14.', 'Alternance de soleil et de nuages. Maximum 14.'] },
  ],
  hours: [
    [11, 28, 40, ['Periods of drizzle', 'Bruine intermittente'], 5, 'VR'],
    [12, 28, 40, ['Periods of drizzle', 'Bruine intermittente'], 20],
    [14, 10, 10, ['Cloudy', 'Nuageux'], 20],
    [15, 3, 10, MC, 20],
    [17, 3, 10, MC, 20],
    [18, 2, 10, MIX, 20],
    [19, 2, 10, MIX, 20],
    [20, 2, 10, MIX, 20],
    [20, 2, 10, MIX, 20],
    [21, 2, 10, MIX, 20],
    [21, 3, 10, MC, 10],
    [20, 3, 10, MC, 10],
    [19, 33, 10, MC, 10],
    [18, 33, 10, MC, 10, 'SW'],
    [18, 33, 10, MC, 10, 'SW'],
    [19, 33, 10, MC, 10, 'SW'],
    [19, 33, 10, MC, 10, 'SW'],
    [18, 33, 10, MC, 10, 'SW'],
    [18, 33, 10, MC, 10, 'SW'],
    [17, 33, 10, MC, 10, 'SW'],
    [17, 33, 10, MC, 10, 'SW'],
    [16, 33, 10, MC, 10, 'SW'],
    [16, 33, 10, MC, 10],
    [16, 33, 10, MC, 10],
  ],
  sun: [-0.02, 11.75],
});

/** Banff on the fixture morning (Canmore → nearest forecast). Sunrise 7:40 a.m., sunset 7:22 p.m. MDT. */
export const BANFF = cityRaw({
  id: 'ab-49',
  name: ['Banff'],
  region: ['Banff National Park', 'parc national de Banff'],
  lat: 51.18,
  lon: -115.57,
  current: {
    temp: 3.4,
    icon: 1,
    condition: ['Mainly Sunny', 'Généralement ensoleillé'],
    humidity: 86,
    dewpoint: 1.2,
    wind: [6, 'W', 'O', 270],
    pressure: [101.8, ['rising', 'à la hausse']],
    station: ['Banff'],
  },
  normals: [13, -1],
  periods: [
    { name: ['Today', 'Aujourd’hui'], temp: 15, icon: 1, summary: ['Mainly sunny', 'Généralement ensoleillé'], text: ['Mainly sunny. Wind west 20 km/h gusting to 40 in the afternoon. High 15. UV index 3 or moderate.', 'Généralement ensoleillé. Vents d’ouest de 20 km/h avec rafales à 40 en après-midi. Maximum 15. Indice UV de 3 ou modéré.'], uv: [3, ['moderate', 'modéré']] },
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: 1, icon: 31, summary: ['A few clouds', 'Quelques nuages'], text: ['A few clouds. Low plus 1.', 'Quelques nuages. Minimum plus 1.'] },
    { name: ['Thursday', 'Jeudi'], temp: 17, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 17.', 'Alternance de soleil et de nuages. Maximum 17.'] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: 3, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy with 30 percent chance of showers. Low plus 3.', 'Nuageux avec 30 pour cent de probabilité d’averses. Minimum plus 3.'] },
    { name: ['Friday', 'Vendredi'], temp: 11, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy with 40 percent chance of showers. High 11.', 'Nuageux avec 40 pour cent de probabilité d’averses. Maximum 11.'] },
    { name: ['Friday night', 'Vendredi soir et nuit'], low: true, temp: -2, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low minus 2.', 'Dégagé. Minimum moins 2.'] },
    { name: ['Saturday', 'Samedi'], temp: 12, icon: 0, summary: ['Sunny', 'Ensoleillé'], text: ['Sunny. High 12.', 'Ensoleillé. Maximum 12.'] },
  ],
  // From 9 a.m. MDT: warming to 15 by mid-afternoon, then a clear, cold night.
  hours: Array.from({ length: 24 }, (_, i) => [Math.round(i <= 6 ? 4 + i * 1.8 : Math.max(1, 15 - (i - 6) * 1.1)), i < 11 ? (i < 4 ? 1 : 2) : 31, 0, i < 11 ? (i < 4 ? ['Mainly sunny', 'Généralement ensoleillé'] : MIX) : ['A few clouds', 'Quelques nuages'], i > 3 && i < 9 ? 20 : 10, 'W'] as [number, number, number, Bi, number, string]),
  sun: [2.68, 14.38],
  shift: 4,
});

const SNOW: Bi = ['Snow and blowing snow', 'Neige et poudrerie'];
export const WINNIPEG = cityRaw({
  id: 'mb-38',
  name: ['Winnipeg'],
  region: ['City of Winnipeg', 'ville de Winnipeg'],
  lat: 49.89,
  lon: -97.13,
  current: {
    temp: -21.4,
    icon: 40,
    condition: ['Snow and Blowing Snow', 'Neige et poudrerie'],
    humidity: 82,
    dewpoint: -23.8,
    wind: [52, 'NW', 'NO', 315, 74],
    pressure: [101.2, ['rising', 'à la hausse']],
    windChill: -36,
    station: ['Winnipeg Richardson Int’l Airport', 'Aéroport int. Richardson de Winnipeg'],
  },
  normals: [-11, -21],
  periods: [
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: -26, icon: 40, summary: SNOW, text: ['Snow and blowing snow ending near midnight then cloudy. Wind northwest 50 km/h gusting to 80. Low minus 26. Wind chill minus 38.', 'Neige et poudrerie cessant vers minuit, puis nuageux. Vents du nord-ouest de 50 km/h avec rafales à 80. Minimum moins 26. Refroidissement éolien de moins 38.'], windChill: -38 },
    { name: ['Thursday', 'Jeudi'], temp: -19, icon: 25, summary: ['Blowing snow', 'Poudrerie'], text: ['Cloudy. Local blowing snow in the morning. Wind northwest 40 km/h gusting to 60. High minus 19. Wind chill minus 37 in the morning and minus 30 in the afternoon.', 'Nuageux. Poudrerie locale le matin. Vents du nord-ouest de 40 km/h avec rafales à 60. Maximum moins 19. Refroidissement éolien de moins 37 le matin et de moins 30 l’après-midi.'], windChill: -37 },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: -29, icon: 31, summary: ['A few clouds', 'Quelques nuages'], text: ['A few clouds. Low minus 29.', 'Quelques nuages. Minimum moins 29.'] },
    { name: ['Friday', 'Vendredi'], temp: -22, icon: 0, summary: ['Sunny', 'Ensoleillé'], text: ['Sunny. High minus 22.', 'Ensoleillé. Maximum moins 22.'] },
    { name: ['Friday night', 'Vendredi soir et nuit'], low: true, temp: -30, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low minus 30.', 'Dégagé. Minimum moins 30.'] },
    { name: ['Saturday', 'Samedi'], temp: -17, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High minus 17.', 'Alternance de soleil et de nuages. Maximum moins 17.'] },
    { name: ['Saturday night', 'Samedi soir et nuit'], low: true, temp: -24, icon: 38, summary: ['Chance of flurries', 'Possibilité d’averses de neige'], text: ['Cloudy periods with 40 percent chance of flurries. Low minus 24.', 'Passages nuageux avec 40 pour cent de probabilité d’averses de neige. Minimum moins 24.'] },
    { name: ['Sunday', 'Dimanche'], temp: -14, icon: 16, summary: ['Periods of snow', 'Neige intermittente'], text: ['Periods of snow. Amount 2 to 4 cm. High minus 14.', 'Neige intermittente. Accumulation de 2 à 4 cm. Maximum moins 14.'] },
    { name: ['Sunday night', 'Dimanche soir et nuit'], low: true, temp: -20, icon: 33, summary: MC, text: ['Mainly cloudy. Low minus 20.', 'Généralement nuageux. Minimum moins 20.'] },
    { name: ['Monday', 'Lundi'], temp: -12, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High minus 12.', 'Alternance de soleil et de nuages. Maximum moins 12.'] },
  ],
  hours: Array.from({ length: 24 }, (_, i) => [-21 - Math.round(i / 3), i < 6 ? 40 : i < 12 ? 33 : 31, i < 6 ? 90 : 10, i < 6 ? SNOW : MC, i < 6 ? 50 : 30, 'NW'] as [number, number, number, Bi, number, string]),
  // Winnipeg, 14 Jan 2026: sunrise 8:21 a.m., sunset 4:54 p.m. CST (in the hourly strip).
  sun: [-7.64, 0.9],
  base: WINTER_NOW,
});

export const TORONTO_HEAT = cityRaw({
  id: 'on-143',
  name: ['Toronto'],
  region: ['City of Toronto', 'ville de Toronto'],
  lat: 43.65,
  lon: -79.38,
  current: {
    temp: 33.2,
    icon: 1,
    condition: ['Mainly Sunny', 'Généralement ensoleillé'],
    humidity: 52,
    dewpoint: 21.9,
    wind: [15, 'SW', 'SO', 225],
    pressure: [100.8, ['falling', 'à la baisse']],
    humidex: 41,
    station: ['Toronto City Centre Airport', 'Aéroport du centre-ville de Toronto'],
  },
  normals: [27, 18],
  periods: [
    { name: ['Today', 'Aujourd’hui'], temp: 34, icon: 1, summary: ['Mainly sunny', 'Généralement ensoleillé'], text: ['Mainly sunny. Wind southwest 20 km/h. High 34. Humidex 43. UV index 9 or very high.', 'Généralement ensoleillé. Vents du sud-ouest de 20 km/h. Maximum 34. Humidex 43. Indice UV de 9 ou très élevé.'], uv: [9, ['very high', 'très élevé']], humidex: 43 },
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: 24, icon: 31, summary: ['A few clouds', 'Quelques nuages'], text: ['A few clouds. Low 24. Humidex 32 this evening.', 'Quelques nuages. Minimum 24. Humidex 32 ce soir.'] },
    { name: ['Thursday', 'Jeudi'], temp: 33, icon: 9, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['A mix of sun and cloud with 40 percent chance of showers in the afternoon. Risk of a thunderstorm. High 33. Humidex 42.', 'Alternance de soleil et de nuages avec 40 pour cent de probabilité d’averses en après-midi. Risque d’orage. Maximum 33. Humidex 42.'], uv: [8, ['very high', 'très élevé']] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: 22, icon: 39, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy periods with 60 percent chance of showers. Risk of a thunderstorm. Low 22.', 'Passages nuageux avec 60 pour cent de probabilité d’averses. Risque d’orage. Minimum 22.'] },
    { name: ['Friday', 'Vendredi'], temp: 28, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 28.', 'Alternance de soleil et de nuages. Maximum 28.'] },
    { name: ['Friday night', 'Vendredi soir et nuit'], low: true, temp: 19, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low 19.', 'Dégagé. Minimum 19.'] },
    { name: ['Saturday', 'Samedi'], temp: 27, icon: 0, summary: ['Sunny', 'Ensoleillé'], text: ['Sunny. High 27.', 'Ensoleillé. Maximum 27.'] },
    { name: ['Saturday night', 'Samedi soir et nuit'], low: true, temp: 17, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low 17.', 'Dégagé. Minimum 17.'] },
    { name: ['Sunday', 'Dimanche'], temp: 25, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 25.', 'Alternance de soleil et de nuages. Maximum 25.'] },
    { name: ['Sunday night', 'Dimanche soir et nuit'], low: true, temp: 15, icon: 32, summary: ['Cloudy periods', 'Passages nuageux'], text: ['Cloudy periods. Low 15.', 'Passages nuageux. Minimum 15.'] },
    { name: ['Monday', 'Lundi'], temp: 21, icon: 12, summary: ['Chance of showers', 'Possibilité d’averses'], text: ['Cloudy with 40 percent chance of showers. High 21.', 'Nuageux avec 40 pour cent de probabilité d’averses. Maximum 21.'] },
    { name: ['Monday night', 'Lundi soir et nuit'], low: true, temp: 12, icon: 33, summary: MC, text: ['Mainly cloudy. Low 12.', 'Généralement nuageux. Minimum 12.'] },
    { name: ['Tuesday', 'Mardi'], temp: 19, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 19.', 'Alternance de soleil et de nuages. Maximum 19.'] },
  ],
  hours: Array.from({ length: 24 }, (_, i) => [Math.round(33 - Math.abs(i - 1) * 0.6), i < 8 ? 1 : 31, 0, i < 8 ? ['Mainly sunny', 'Généralement ensoleillé'] : ['A few clouds', 'Quelques nuages'], 15, 'SW'] as [number, number, number, Bi, number, string]),
  // Toronto, 15 Jul 2026: sunrise 5:49 a.m., sunset 8:56 p.m. EDT.
  sun: [-7.17, 7.95],
  base: HEAT_NOW,
});

export const KELOWNA_SMOKE = cityRaw({
  id: 'bc-48',
  name: ['Kelowna'],
  region: ['Central Okanagan (Kelowna)', 'Okanagan - centre (Kelowna)'],
  lat: 49.88,
  lon: -119.48,
  current: {
    temp: 27.8,
    icon: 44,
    condition: ['Smoke', 'Fumée'],
    humidity: 24,
    dewpoint: 5.6,
    wind: [9, 'N', 'N', 358],
    pressure: [100.9, ['steady', 'stationnaire']],
    station: ['Kelowna Int’l Airport', 'Aéroport int. de Kelowna'],
  },
  normals: [28, 12],
  periods: [
    { name: ['Today', 'Aujourd’hui'], temp: 30, icon: 44, summary: ['Smoke', 'Fumée'], text: ['Sunny. Smoke. High 30. UV index 7 or high.', 'Ensoleillé. Fumée. Maximum 30. Indice UV de 7 ou élevé.'], uv: [7, ['high', 'élevé']] },
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: 14, icon: 44, summary: ['Smoke', 'Fumée'], text: ['Clear. Smoke. Low 14.', 'Dégagé. Fumée. Minimum 14.'] },
    { name: ['Thursday', 'Jeudi'], temp: 29, icon: 44, summary: ['Smoke', 'Fumée'], text: ['Sunny. Smoke. High 29.', 'Ensoleillé. Fumée. Maximum 29.'] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: 13, icon: 30, summary: ['Clear', 'Dégagé'], text: ['Clear. Low 13.', 'Dégagé. Minimum 13.'] },
    { name: ['Friday', 'Vendredi'], temp: 26, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 26.', 'Alternance de soleil et de nuages. Maximum 26.'] },
  ],
  hours: Array.from({ length: 24 }, (_, i) => [Math.round(28 - Math.abs(i - 1) * 0.6), 44, 0, ['Smoke', 'Fumée'], 9, 'N'] as [number, number, number, Bi, number, string]),
  // Kelowna, 19 Aug 2026: sunrise 5:53 a.m., sunset 8:08 p.m. PDT.
  sun: [-7.11, 7.14],
  base: SMOKE_NOW,
});

export const IQALUIT = cityRaw({
  id: 'nu-21',
  name: ['Iqaluit'],
  region: ['Iqaluit'],
  lat: 63.75,
  lon: -68.52,
  normals: [2, -3],
  periods: [
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: -2, icon: 38, summary: ['Chance of flurries', 'Possibilité d’averses de neige'], text: ['Cloudy with 30 percent chance of flurries. Wind north 20 km/h. Low minus 2.', 'Nuageux avec 30 pour cent de probabilité d’averses de neige. Vents du nord de 20 km/h. Minimum moins 2.'] },
    { name: ['Thursday', 'Jeudi'], temp: 1, icon: 16, summary: ['Flurries', 'Averses de neige'], text: ['Flurries. High plus 1.', 'Averses de neige. Maximum plus 1.'] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: -4, icon: 33, summary: MC, text: ['Mainly cloudy. Low minus 4.', 'Généralement nuageux. Minimum moins 4.'] },
    { name: ['Friday', 'Vendredi'], temp: 0, icon: 10, summary: ['Cloudy', 'Nuageux'], text: ['Cloudy. High zero.', 'Nuageux. Maximum zéro.'] },
  ],
  hours: Array.from({ length: 24 }, (_, i) => [-1 - Math.round(i / 8), 38, 30, ['Chance of flurries', 'Possibilité d’averses de neige'], 20, 'N'] as [number, number, number, Bi, number, string]),
  // Evening issue (6 p.m. EDT), so the forecast opening with "Tonight" is what ECCC would publish.
  shift: 11,
});

export const QUEBEC_FR = cityRaw({
  id: 'qc-133',
  name: ['Québec'],
  region: ['Québec City', 'ville de Québec'],
  lat: 46.81,
  lon: -71.21,
  current: {
    temp: 8.1,
    icon: 24,
    condition: ['Fog', 'Brouillard'],
    humidity: 100,
    dewpoint: 8.1,
    wind: [4, 'NE', 'NE', 45],
    pressure: [102.1, ['rising', 'à la hausse']],
    station: ['Québec Jean Lesage Int’l Airport', 'Aéroport int. Jean-Lesage de Québec'],
  },
  normals: [14, 4],
  periods: [
    { name: ['Today', 'Aujourd’hui'], temp: 17, icon: 20, summary: ['Fog dissipating', 'Brouillard se dissipant'], text: ['Fog patches dissipating this morning then a mix of sun and cloud. High 17. UV index 4 or moderate.', 'Nappes de brouillard se dissipant ce matin, puis alternance de soleil et de nuages. Maximum 17. Indice UV de 4 ou modéré.'], uv: [4, ['moderate', 'modéré']] },
    { name: ['Tonight', 'Ce soir et cette nuit'], low: true, temp: 9, icon: 32, summary: ['Cloudy periods', 'Passages nuageux'], text: ['Cloudy periods. Low 9.', 'Passages nuageux. Minimum 9.'] },
    { name: ['Thursday', 'Jeudi'], temp: 18, icon: 12, summary: ['Showers', 'Averses'], text: ['Showers. Amount 5 to 10 mm. High 18.', 'Averses. Quantité de 5 à 10 mm. Maximum 18.'] },
    { name: ['Thursday night', 'Jeudi soir et nuit'], low: true, temp: 10, icon: 12, summary: ['Showers', 'Averses'], text: ['Showers ending overnight then cloudy. Low 10.', 'Averses cessant pendant la nuit, puis nuageux. Minimum 10.'] },
    { name: ['Friday', 'Vendredi'], temp: 14, icon: 2, summary: MIX, text: ['A mix of sun and cloud. High 14.', 'Alternance de soleil et de nuages. Maximum 14.'] },
  ],
  hours: Array.from({ length: 24 }, (_, i) => [Math.round(8 + Math.min(i, 7) * 1.2 - Math.max(0, i - 9) * 0.6), i < 3 ? 24 : i < 11 ? 2 : 32, i < 3 ? 0 : 10, i < 3 ? ['Fog', 'Brouillard'] : i < 11 ? MIX : ['Cloudy periods', 'Passages nuageux'], 5, 'NE'] as [number, number, number, Bi, number, string]),
  sun: [-0.17, 11.6],
});
