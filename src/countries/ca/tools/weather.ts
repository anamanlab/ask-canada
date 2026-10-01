/**
 * AI tools for the `weather` widget: LIVE Environment and Climate Change Canada data.
 *   weatherForecast   — current conditions, hourly, 7-day forecast, alerts in effect, AQHI, sunrise/sunset.
 *   weatherAlerts     — colour-coded weather alerts for a place, a province/territory, or all of Canada.
 *   weatherAirQuality — Air Quality Health Index (now + forecast) and wildfire smoke signals near a place.
 * Sources and verified facts: widgets/weather/data.ts. Fetching and fallbacks: widgets/weather/live.ts.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { PROVINCES } from '../widgets/weather/data';
import { buildAir, buildAlerts, buildForecast } from '../widgets/weather/live';

const lang = z.enum(['en', 'fr']).optional().describe('Language of the answer (en or fr). Place names and forecast text come back in this language.');
const location = z
  .string()
  .max(80)
  .optional()
  .describe(
    'Where, as the person said it: a city, town or community ("Kelowna", "Saint-Jérôme", "Iqaluit"), optionally with a province ("Windsor, NS"), or a postal code (only the first 3 characters are used). Omit if they gave no place.',
  );
const latitude = z.number().min(41).max(84).optional().describe('Latitude, only if the person shared their location.');
const longitude = z.number().min(-142).max(-52).optional().describe('Longitude, only if the person shared their location.');

export const tools = {
  weatherForecast: tool({
    description:
      'LIVE official Environment Canada weather for a place in Canada: current conditions (temperature, feels-like, wind, humidity), the next 24 hours hour by hour, the 7-day forecast with highs, lows and chance of precipitation, any weather alerts in effect there (colour-coded yellow/orange/red), the Air Quality Health Index, and sunrise/sunset. Use it for any question about the weather, temperature, rain, snow, the forecast, or what to wear/plan in a Canadian place ("weather in Calgary", "will it rain in Halifax tomorrow?", "météo à Québec ce week-end"). Pass the place as the person said it; if they gave none, call it without a location and the widget asks them to pick one (or use their device location). Never invent numbers: describe only what this tool returns.',
    inputSchema: z.object({
      location,
      latitude,
      longitude,
      focus: z
        .enum(['now', 'week', 'hourly', 'tomorrow', 'weekend'])
        .optional()
        .describe('What they care about: now (default), the next hours, the week ahead, tomorrow, or this weekend. tomorrow and weekend open that day in the 7-day list: answer from that day’s row in `days`, not from the current conditions.'),
      lang,
    }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => buildForecast({ ...rest, lang: l ?? 'en' }, { abortSignal }),
  }),

  weatherAlerts: tool({
    description:
      'LIVE official Environment Canada weather alerts (warnings, watches and advisories, colour-coded yellow/orange/red since November 26, 2025) with the full alert text, impact level, forecast confidence and timing. With a location: alerts in effect for that place, or a clear "none in effect". With a province/territory code and no location: every alert in that province. With neither: a summary of all alerts in effect across Canada, grouped by hazard. Use it for "any weather warnings near me?", "is there a storm warning in Nova Scotia?", "alertes météo au Québec", heat, wind, snowfall, fog, frost or air quality warnings.',
    inputSchema: z.object({
      location,
      latitude,
      longitude,
      province: z.enum(PROVINCES).optional().describe('Two-letter province/territory code (lowercase) when they asked about a whole province, e.g. "ns".'),
      lang,
    }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => buildAlerts({ ...rest, lang: l ?? 'en' }, { abortSignal }),
  }),

  weatherAirQuality: tool({
    description:
      'LIVE air quality and wildfire smoke near a place in Canada: the Air Quality Health Index (AQHI, 1 to 10+) observed now and forecast for the next periods (including the in-smoke forecast when issued), the official health advice for the general population and for people at risk (children, people over 65, people with health conditions), air quality warnings in effect, and satellite fire hotspots detected within 100 km in the last 24 hours. Use it for "is the air safe to run outside in Kelowna?", "wildfire smoke in Yellowknife", "qualité de l’air à Montréal", or whether kids can play outside. Québec mostly uses Info-Smog; the widget explains that when there is no AQHI community nearby.',
    inputSchema: z.object({
      location,
      latitude,
      longitude,
      focus: z.enum(['aqhi', 'smoke']).optional().describe('smoke when they asked about wildfire smoke or fires; otherwise aqhi.'),
      lang,
    }),
    execute: async ({ lang: l, ...rest }, { abortSignal }) => buildAir({ ...rest, lang: l ?? 'en' }, { abortSignal }),
  }),
} satisfies ToolSet;
