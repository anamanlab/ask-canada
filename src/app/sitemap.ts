import type { MetadataRoute } from 'next';
import { pack } from '@/countries/active';
import { DOCS } from './_doc/DocPage';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = pack.brand.url;
  const pages = ['', ...DOCS.map((doc) => `/${doc}`)];
  return pages.map((p) => ({
    url: `${base}${p || '/'}`,
    changeFrequency: p ? 'monthly' : 'weekly',
    priority: p ? 0.5 : 1,
    alternates: { languages: { 'en-CA': `${base}${p || '/'}?lang=en`, 'fr-CA': `${base}${p || '/'}?lang=fr` } },
  }));
}
