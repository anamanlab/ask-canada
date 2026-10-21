import type { MetadataRoute } from 'next';
import { pack } from '@/countries/active';
import { DOCS } from './_doc/DocPage';

export default function sitemap(): MetadataRoute.Sitemap {
  // An unconfigured Brazil deployment must not publish localhost or made-up URLs.
  if (pack.id === 'br' && pack.brand.url.startsWith('http://localhost')) return [];
  const base = pack.brand.url.replace(/\/+$/, '');
  const pages = ['', ...DOCS.map((doc) => `/${doc}`)];
  return pages.map((p) => {
    const path = p || '/';
    return {
      url: `${base}${path}`,
      changeFrequency: p ? 'monthly' : 'weekly',
      priority: p ? 0.5 : 1,
      // Country-specific official *product* locales: CA en/fr, BR pt/en.
      // Do not publish Canadian hreflang alternates for the Brazil pack.
      alternates: {
        languages: Object.fromEntries(
          pack.locales.official.map((locale) => [
            `${locale}-${pack.region}`,
            `${base}${path}?lang=${locale}`,
          ]),
        ),
      },
    };
  });
}
