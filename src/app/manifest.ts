import type { MetadataRoute } from 'next';
import { pack } from '@/countries/active';

/** Installable web app manifest (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${pack.brand.name}: every federal service, in plain language`,
    short_name: pack.brand.name,
    description: 'Ask about any Government of Canada service in plain language, in English or French, with the official source.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: pack.brand.themeColor.light,
    theme_color: pack.brand.themeColor.light,
    lang: pack.locales.default,
    categories: ['government', 'utilities', 'productivity'],
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
