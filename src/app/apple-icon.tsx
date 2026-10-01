/** Apple touch icon (180×180): the mark on warm paper. */
import { ImageResponse } from 'next/og';
import { pack } from '@/countries/active';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const mark = `data:image/svg+xml;base64,${Buffer.from(pack.brand.markSvg(pack.brand.flagColor)).toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #F7F5F0, #EDEAE2)' }}>
        <img src={mark} alt="" width={104} height={104} />
      </div>
    ),
    size,
  );
}
