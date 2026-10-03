/**
 * Canada country pack: the client-safe half (brand, locales, services, art, sources). It is bundled for the
 * browser, so it must never hold server-only content; the system prompt, UI catalogs and live data loaders live in
 * `./pack.server.ts`. The identity (`brand`) is its own module, `./brand`.
 */
import {
  Baby,
  BookUser,
  Briefcase,
  Building2,
  CloudSun,
  Earth,
  FlaskConical,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Medal,
  PiggyBank,
  Plane,
  Receipt,
  Scale,
  Shield,
  Sunset,
  TrainFront,
  Trees,
  Globe,
} from 'lucide-react';
import type { ClientPack } from '../types';
import { brand } from './brand';

export const WIDGET_IDS = [
  'benefits',
  'passport',
  'immigration',
  'citizenship',
  'jobs',
  'taxes',
  'weather',
  'travel',
  'offices',
  'life-events',
  'dates',
  'health',
  'parks',
  'business',
  'documents',
  'contact',
  'civic',
  'money',
  'veterans-defence',
  'transport',
] as const;

export const pack: ClientPack = {
  id: 'ca',
  region: 'CA',
  currency: 'CAD',
  timeZone: 'America/Toronto',
  locales: {
    supported: [
      'en', 'fr', 'zh-Hans', 'zh-Hant', 'pa', 'es', 'ar', 'tl', 'ur', 'fa', 'hi',
      'pt', 'it', 'vi', 'ko', 'ta', 'uk', 'ru', 'gu', 'de', 'iu', 'cr',
    ],
    official: ['en', 'fr'],
    default: 'en',
  },
  brand,
  emergency: { number: '911', crisis: '9-8-8', crisisTel: '988' },
  sources: {
    allowlist: [
      'canada.ca',
      'gc.ca',
      'elections.ca',
      'parl.ca',
      'ourcommons.ca',
      'sencanada.ca',
      'bankofcanada.ca',
      'forces.ca',
      'canada-holidays.ca',
      'cer-rec.gc.ca',
      '988.ca',
    ],
    showcase: [
      'canada.ca',
      'travel.gc.ca',
      'weather.gc.ca',
      'recalls-rappels.canada.ca',
      'statcan.gc.ca',
      'jobbank.gc.ca',
      'bankofcanada.ca',
      'parks.canada.ca',
      'elections.ca',
      'veterans.gc.ca',
      'cra-arc.gc.ca',
      'health-infobase.canada.ca',
    ],
  },
  officialHome: { en: 'https://www.canada.ca/en.html', fr: 'https://www.canada.ca/fr.html' },
  officialHomeLabel: 'canada.ca',
  services: [
    // Canada.ca themes (all listed in the Menu)
    { id: 'benefits', icon: HandCoins, featured: true },
    { id: 'taxes', icon: Receipt, featured: true },
    { id: 'passports', icon: BookUser, featured: true },
    { id: 'immigration', icon: Globe, featured: true },
    { id: 'family', icon: Baby, featured: true },
    { id: 'retirement', icon: Sunset, featured: true },
    { id: 'health', icon: HeartPulse, featured: true },
    { id: 'jobs', icon: Briefcase, featured: true },
    { id: 'business', icon: Building2, featured: true },
    { id: 'veterans', icon: Medal, featured: true },
    { id: 'environment', icon: CloudSun, featured: true },
    { id: 'housing', icon: House, featured: true },
    { id: 'travel', icon: Plane },
    { id: 'defence', icon: Shield },
    { id: 'culture', icon: Landmark },
    { id: 'justice', icon: Scale },
    { id: 'transport', icon: TrainFront },
    { id: 'world', icon: Earth },
    { id: 'money', icon: PiggyBank },
    { id: 'science', icon: FlaskConical },
    { id: 'parks', icon: Trees },
  ],
  art: {
    hero: {
      land: { light: '/art/ca/land-hero-light.svg', dark: '/art/ca/land-hero-dark.svg' },
      aurora: '/art/ca/aurora-day.svg',
      auroraDark: '/art/ca/aurora-night.svg',
    },
    night: {
      land: { light: '/art/ca/land-night.svg', dark: '/art/ca/land-night.svg' },
      aurora: '/art/ca/aurora-night.svg',
    },
    dusk: {
      land: { light: '/art/ca/land-dusk-light.svg', dark: '/art/ca/land-dusk-dark.svg' },
      aurora: '/art/ca/aurora-dusk.svg',
      auroraDark: '/art/ca/aurora-night.svg',
    },
  },
  // Canada's refined landing wording, which overrides the pack's own catalog for the keys it names.
  landing: {
    en: () => import('./landing/en.json'),
    fr: () => import('./landing/fr.json'),
  },
  silentTools: ['officialGuidance'],
  widgetIds: WIDGET_IDS,
};

export default pack;
