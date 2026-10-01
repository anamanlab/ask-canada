/**
 * Runs before every page request:
 *  1. Generates a per-request CSP nonce and sets a strict Content-Security-Policy.
 *  2. Passes `?lang=` and `?theme=` overrides to the app as request headers (not persisted;
 *     only the explicit language/theme controls write cookies).
 *  3. Answers `/lab/<unknown widget>` with the server-rendered 404 (see `UNMATCHED`).
 * No personal data is read, logged or stored here.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { pack } from '@/countries/active';
import { mapTiles } from '@/countries/active.map';

const isDev = process.env.NODE_ENV === 'development';

function csp(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    // data: for inline icons. Basemap tiles come from our own /tiles route, unless the pack can't be proxied.
    `img-src 'self' blob: data:${mapTiles.proxy === false ? ` ${mapTiles.hosts.join(' ')}` : ''}`,
    `font-src 'self' data:`,
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    `media-src 'self' blob:`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

/**
 * A path no route matches. A `notFound()` thrown by a dynamic page reaches the browser as Next's empty error
 * shell and the 404 is only painted by JavaScript; a request that matches no route gets the not-found page
 * rendered on the server, inside the layout. So a dynamic segment with a known set of values is checked here
 * and sent to this path instead (the address bar keeps the URL the person asked for).
 */
const UNMATCHED = '/404/unmatched';

function isUnknownLabWidget(pathname: string) {
  const id = /^\/lab\/([^/]+)\/?$/.exec(pathname)?.[1];
  return id !== undefined && !pack.widgetIds.includes(id);
}

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = csp(nonce);
  const requestHeaders = new Headers(request.headers);
  // The app trusts these headers because only this proxy sets them: drop any a client sent.
  for (const h of ['x-nonce', 'x-ac-locale', 'x-ac-dir', 'x-ac-theme']) requestHeaders.delete(h);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const params = request.nextUrl.searchParams;
  const lang = params.get('lang');
  if (lang && /^[a-zA-Z-]{2,10}$/.test(lang)) requestHeaders.set('x-ac-locale', lang);
  const dir = params.get('dir');
  if (dir === 'rtl' || dir === 'ltr') requestHeaders.set('x-ac-dir', dir);
  const theme = params.get('theme');
  if (theme === 'dark' || theme === 'light') requestHeaders.set('x-ac-theme', theme);

  const forward = { request: { headers: requestHeaders } };
  const response = isUnknownLabWidget(request.nextUrl.pathname)
    ? NextResponse.rewrite(new URL(`${UNMATCHED}${request.nextUrl.search}`, request.url), forward)
    : NextResponse.next(forward);
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      // The long id is Vercel BotID's own path (rewritten to Vercel by `withBotId`); it sets its own framing headers.
      source: '/((?!api/|tiles/|149e9513-01fa-4fb0-aad4-566afd725d1b/|_next/static|_next/image|art/|favicon.ico|icon/|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|opengraph-image|twitter-image).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
