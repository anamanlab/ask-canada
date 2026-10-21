import type { MetadataRoute } from 'next';
import { pack } from '@/countries/active';

export default function robots(): MetadataRoute.Robots {
  // Avoid publishing an unconfigured Brazil deployment as though it were an official service.
  // Set NEXT_PUBLIC_BR_SITE_URL to the actual, owned HTTPS origin before launch.
  if (pack.id === 'br' && pack.brand.url.startsWith('http://localhost')) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/lab'] }],
    sitemap: `${pack.brand.url}/sitemap.xml`,
    host: pack.brand.url,
  };
}
