'use client';
/**
 * Renderers for the `weather` widget (live Environment and Climate Change Canada data).
 *   weatherForecast   — conditions, hourly, 7-day, alerts, AQHI, sunrise/sunset for one place
 *   weatherAlerts     — colour-coded alerts for a place, a province/territory or all of Canada
 *   weatherAirQuality — AQHI now + forecast, health advice, wildfire smoke signals
 */
import type { Renderers } from '@/lib/widgets/types';
import { WeatherAirQuality } from './WeatherAirQuality';
import { WeatherAlerts } from './WeatherAlerts';
import { WeatherForecast } from './WeatherForecast';

export const renderers: Renderers = {
  weatherForecast: WeatherForecast,
  weatherAlerts: WeatherAlerts,
  weatherAirQuality: WeatherAirQuality,
};
export default renderers;
