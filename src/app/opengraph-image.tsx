/**
 * Social card (Open Graph + X). 1200×630, rendered once and cached.
 *
 * Everything on the card comes from the country pack: the greeting in the pack's two official languages, the
 * tagline from its catalog, the mark in its accent colour, and the artwork from `pack.art`. Nothing about
 * any one country is written into this file.
 */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pack } from '@/countries/active';
import { packServer } from '@/countries/active.server';

/** The greeting lines, pack order: the source language first, then the pack's other official language. */
const greetings = () => {
  const g = pack.brand.greeting;
  const [first, ...rest] = pack.locales.official;
  const alt = rest[0] ?? 'en';
  return [g?.[first] ?? pack.brand.name, g?.[alt] ?? pack.brand.name] as const;
};

export const alt = `${greetings()[0]}. ${greetings()[1]}. ${pack.brand.name}, plain-language answers to government services with the official source.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const dataUri = async (rel: string) =>
  `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), 'public', rel))).toString('base64')}`;

export default async function OpengraphImage() {
  const dir = join(process.cwd(), 'src/app/_og');
  const [serif, serifItalic, sans, land, aurora] = await Promise.all([
    readFile(join(dir, 'Newsreader-Display.ttf')),
    readFile(join(dir, 'Newsreader-DisplayItalic.ttf')),
    readFile(join(dir, 'Geist-Medium.ttf')),
    dataUri(pack.art.hero.land.light),
    dataUri(pack.art.hero.aurora),
  ]);
  const mark = `data:image/svg+xml;base64,${Buffer.from(pack.brand.markSvg(pack.brand.flagColor)).toString('base64')}`;
  const defaultLocale = pack.locales.default;
  const messages = (await (packServer.messages[defaultLocale]?.() ?? packServer.messages.en())).default;
  const tagline = messages['brand.tagline'] ?? pack.brand.name;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          background: 'linear-gradient(180deg, #F7F5F0 0%, #EDF1F1 34%, #E3ECEE 56%, #F6E2D2 76%, #EFE6DE 100%)',
          fontFamily: 'Geist',
          color: '#0E1A2B',
        }}
      >
        <img src={aurora} alt="" width={1300} height={420} style={{ position: 'absolute', left: -50, top: 10, opacity: 0.55 }} />
        <img src={land} alt="" width={1200} height={405} style={{ position: 'absolute', left: 0, bottom: -36 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'absolute', top: 40, left: 52 }}>
          <img src={mark} alt="" width={32} height={32} />
          <div style={{ fontFamily: 'Newsreader', fontSize: 32, letterSpacing: -0.6 }}>{pack.brand.name}</div>
        </div>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 44,
            right: 52,
            fontSize: 20,
            color: '#3E4A5A',
          }}
        >
          {pack.brand.domain}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 112,
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(255,255,255,.8)',
            border: '1px solid rgba(14,26,43,.1)',
            fontSize: 20,
            color: '#3E4A5A',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 10, background: '#1E6B55' }} />
          {tagline}
        </div>
        <div style={{ display: 'flex', fontFamily: 'Newsreader', fontSize: 118, letterSpacing: -5, lineHeight: 1, marginTop: 22 }}>
          {greetings()[0]}<span style={{ color: pack.brand.flagColor }}>.</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Newsreader Italic',
            fontSize: 118,
            letterSpacing: -4,
            lineHeight: 1,
            color: '#3E4A5A',
          }}
        >
          {greetings()[1]}<span style={{ color: pack.brand.flagColor }}>.</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: 640,
            marginTop: 30,
            padding: '14px 14px 14px 28px',
            borderRadius: 32,
            background: 'rgba(255,255,255,.9)',
            boxShadow: '0 20px 50px -18px rgba(14,26,43,.35)',
            fontSize: 24,
            color: '#5A6472',
          }}
        >
          {pack.id === 'br' ? 'Pergunte sobre qualquer serviço federal…' : 'Ask about any federal service…'}
          <div
            style={{
              display: 'flex',
              width: 52,
              height: 52,
              borderRadius: 52,
              background: pack.brand.accent?.base ?? pack.brand.flagColor ?? '#009C3B',
              color: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            ↑
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Newsreader', data: serif, style: 'normal', weight: 400 },
        { name: 'Newsreader Italic', data: serifItalic, style: 'normal', weight: 400 },
        { name: 'Geist', data: sans, style: 'normal', weight: 500 },
      ],
    },
  );
}
