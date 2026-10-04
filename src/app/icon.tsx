/** App icons from the country pack's mark: a 32px favicon and 192/512 PWA icons. */
import { ImageResponse } from 'next/og';
import { pack } from '@/countries/active';

export function generateImageMetadata() {
  return [
    { id: 'favicon', size: { width: 32, height: 32 }, contentType: 'image/png' },
    { id: '192', size: { width: 192, height: 192 }, contentType: 'image/png' },
    { id: '512', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const which = await id;
  const px = which === 'favicon' ? 32 : Number(which);
  const mark = `data:image/svg+xml;base64,${Buffer.from(pack.brand.markSvg(pack.brand.flagColor)).toString('base64')}`;
  const tile = which !== 'favicon';
  const isBr = pack.id === 'br';
  const imgW = which === 'favicon' ? (isBr ? 28 : 32) : Math.round(px * (isBr ? 0.72 : 0.56));
  const imgH = isBr ? Math.round(imgW * (20 / 28)) : (tile ? imgW : px);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tile ? 'linear-gradient(180deg, #F7F5F0, #EDEAE2)' : 'transparent',
        }}
      >
        <img src={mark} alt="" width={imgW} height={imgH} />
      </div>
    ),
    { width: px, height: px },
  );
}
