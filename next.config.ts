import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';
import path from 'node:path';

/**
 * Country pack selection happens at build time.
 * `COUNTRY=ca` (default) resolves every `@country/*` import to `src/countries/ca/*`.
 * Core code never imports a pack directly; it goes through `src/countries/active*.ts`.
 */
const COUNTRY = (process.env.COUNTRY || 'ca').replace(/[^a-z-]/g, '');
const packDir = `./src/countries/${COUNTRY}`;
const countryAlias = {
  '@country/pack': `${packDir}/pack.ts`,
  '@country/pack-server': `${packDir}/pack.server.ts`,
  '@country/mark': `${packDir}/brand/Mark.tsx`,
  '@country/brand': `${packDir}/brand/index.ts`,
  '@country/map': `${packDir}/map.ts`,
  '@country/tools': `${packDir}/tools/index.ts`,
  '@country/scenarios': `${packDir}/scenarios/index.ts`,
  '@country/widgets': `${packDir}/widgets/registry.ts`,
  '@country/fixtures': `${packDir}/widgets/fixtures.ts`,
};

/**
 * The Workers runtime module. It exists only on Cloudflare Workers, so the Next.js build (Vercel, containers)
 * aliases it to a stub with no bindings (src/lib/ai/off-workers-env.ts). The Workers build goes through
 * vite.config.ts, which strips that alias again so the runtime resolves the module for real. Exported so the
 * two files cannot drift on the specifier.
 */
export const WORKERS_RUNTIME_MODULE = 'cloudflare:workers';
const workersRuntimeStub = './src/lib/ai/off-workers-env.ts';

/**
 * Vercel BotID (invisible bot check on POST /api/chat, see src/lib/ai/bot-check.ts) exists only on Vercel.
 * Builds made there (`VERCEL=1`) get the browser challenge and its same-origin rewrites; every other build
 * (Docker, local) gets neither, and the server-side check is a no-op. `BOTID_MODE=off` removes it on Vercel too.
 */
const BOTID = process.env.VERCEL === '1' && process.env.BOTID_MODE?.trim().toLowerCase() !== 'off';

/**
 * Static security headers. The Content-Security-Policy itself is set per request in
 * `src/proxy.ts` because it carries a fresh script nonce.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  {
    key: 'Permissions-Policy',
    // Microphone is used only for voice questions (Web Speech API), on this origin only.
    value: 'camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server for containers (AWS/Azure/GC cloud). Vercel ignores it.
  output: 'standalone',
  outputFileTracingIncludes: {
    '/opengraph-image': ['./src/app/_og/**', './public/art/**'],
    '/twitter-image': ['./src/app/_og/**', './public/art/**'],
  },
  reactStrictMode: true,
  // Memoizes components and hooks at build time (docs/WIDGET_GUIDE.md §4b relies on it: no manual memo).
  reactCompiler: true,
  devIndicators: false,
  env: { NEXT_PUBLIC_COUNTRY: COUNTRY, NEXT_PUBLIC_BOTID: BOTID ? '1' : '' },
  turbopack: { resolveAlias: { ...countryAlias, [WORKERS_RUNTIME_MODULE]: workersRuntimeStub } },
  webpack(config) {
    const abs = Object.fromEntries(Object.entries(countryAlias).map(([k, v]) => [k, path.resolve(v)]));
    config.resolve.alias = { ...config.resolve.alias, ...abs, [WORKERS_RUNTIME_MODULE]: workersRuntimeStub };
    return config;
  },
  /**
   * A language lives in the query (`?lang=fr`): that is the canonical, hreflang-listed URL of every page
   * (see `languageAlternates`). `/fr` and `/fr/about` are friendly aliases people type or share; they redirect
   * there. Temporary (307) so a future path-based scheme isn't blocked by cached permanent redirects.
   */
  async redirects() {
    return [
      { source: '/:lang(en|fr)', destination: '/?lang=:lang', permanent: false },
      { source: '/:lang(en|fr)/:path+', destination: '/:path+?lang=:lang', permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon/favicon' }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/art/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default BOTID ? withBotId(nextConfig) : nextConfig;
