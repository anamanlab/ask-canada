/**
 * Basemap tile proxy: GET /tiles/<layer>/<z>/<x>/<y>
 *
 * Serves the active pack's basemap from our own origin so visitors' browsers never call the tile host
 * (their IP and the places they look at stay with us), and the host sees a fraction of the traffic:
 *   1. CDN: `CDN-Cache-Control` caches each tile at the edge (per region; a new deployment starts cold).
 *   2. Data cache: the upstream fetch is cached server-side for 30 days and survives deployments
 *      (Vercel Data Cache; `.next/cache` locally and when self-hosted). Only 200s are ever cached.
 *   3. Upstream: only on a miss in both.
 * Only the pack's own layers, zooms and `bounds` are served, so this is not an open proxy.
 */
import { TILES_PROXIED, fillTemplate, tileAllowed, upstreamTemplate } from '@/lib/map/tiles';
import { pack } from '@/countries/active';

const DAY = 60 * 60 * 24;

const notFound = () =>
  new Response(null, {
    status: 404,
    headers: { 'Cache-Control': `public, max-age=${DAY}`, 'CDN-Cache-Control': `public, s-maxage=${7 * DAY}` },
  });

const unavailable = () => new Response(null, { status: 502, headers: { 'Cache-Control': 'no-store' } });

export async function GET(_req: Request, { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }) {
  if (!TILES_PROXIED) return notFound();
  const { layer, z: zs, x: xs, y: ys } = await params;
  const [z, x, y] = [zs, xs, ys].map((v) => (/^\d{1,8}$/.test(v) ? Number(v) : NaN));
  const template = upstreamTemplate(layer);
  if (!template || !tileAllowed(z, x, y)) return notFound();

  let upstream: Response;
  try {
    upstream = await fetch(fillTemplate(template, z, x, y), {
      cache: 'force-cache',
      next: { revalidate: 30 * DAY, tags: ['map-tiles'] },
      headers: { 'User-Agent': `${pack.brand.name} tile cache (+${pack.brand.url})` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return unavailable();
  }
  // Outside the service's data (e.g. no tile at this spot): cacheable 404, no body.
  if (upstream.status === 404) return notFound();
  const type = upstream.headers.get('content-type') ?? '';
  // Blocked, rate-limited or erroring upstream, or not an image: never relay it, never cache it.
  if (!upstream.ok || !type.startsWith('image/')) return unavailable();

  return new Response(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': `public, max-age=${DAY}`,
      'CDN-Cache-Control': `public, s-maxage=${30 * DAY}, stale-while-revalidate=${DAY}, stale-if-error=${7 * DAY}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
