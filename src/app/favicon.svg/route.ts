import { pack } from '@/countries/active';

export const dynamic = 'force-static';

export async function GET() {
  const svg = pack.brand.markSvg(pack.brand.flagColor);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
    },
  });
}
