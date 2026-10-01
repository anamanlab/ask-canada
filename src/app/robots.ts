import type { MetadataRoute } from 'next';
import { pack } from '@/countries/active';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/lab'] }],
    sitemap: `${pack.brand.url}/sitemap.xml`,
    host: pack.brand.url,
  };
}
