/**
 * Example country pack: "Republic of Example". The smallest complete pack, used to prove the
 * core/country seam and as the template in docs/NEW_COUNTRY.md. Run it with COUNTRY=example.
 * This is the client-safe half; the system prompt, catalogs and showcase data live in `./pack.server.ts`.
 */
import { CalendarDays, HandCoins, Receipt } from 'lucide-react';
import type { ClientPack } from '../types';
import { brand } from './brand';

export const pack: ClientPack = {
  id: 'example',
  region: 'XX',
  currency: 'XTS',
  timeZone: 'UTC',
  locales: { supported: ['en', 'fr'], official: ['en', 'fr'], default: 'en' },
  brand,
  emergency: { number: '112', crisis: '112', crisisTel: '112' },
  sources: { allowlist: ['example.org'], showcase: ['example.org', 'data.example.org'] },
  officialHome: { en: 'https://example.org/en', fr: 'https://example.org/fr' },
  officialHomeLabel: 'example.org',
  services: [
    { id: 'benefits', icon: HandCoins, featured: true },
    { id: 'taxes', icon: Receipt, featured: true },
    { id: 'holidays', icon: CalendarDays, featured: true },
  ],
  art: {
    hero: { land: { light: '/art/ca/land-hero-light.svg', dark: '/art/ca/land-hero-dark.svg' }, aurora: '/art/ca/aurora-day.svg', auroraDark: '/art/ca/aurora-night.svg' },
    night: { land: { light: '/art/ca/land-night.svg', dark: '/art/ca/land-night.svg' }, aurora: '/art/ca/aurora-night.svg' },
    dusk: { land: { light: '/art/ca/land-dusk-light.svg', dark: '/art/ca/land-dusk-dark.svg' }, aurora: '/art/ca/aurora-dusk.svg' },
  },
  widgetIds: ['holidays'],
};

export default pack;
