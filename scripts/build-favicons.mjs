import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BRAZIL_FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20" width="100%" height="100%">
  <rect width="28" height="20" rx="2.5" fill="#009C3B"/>
  <polygon points="14,1.8 25.8,10 14,18.2 2.2,10" fill="#FFDF00"/>
  <circle cx="14" cy="10" r="5.2" fill="#002776"/>
  <path d="M 8.8,10.8 A 7,7 0 0,1 19.1,8.3 A 7.3,7.3 0 0,0 8.8,10.8 Z" fill="#FFFFFF"/>
  <path d="M 11.2,10.1 A 6.8,6.8 0 0,1 17.2,8.8" fill="none" stroke="#009C3B" stroke-width="0.4" stroke-linecap="round"/>
  <g fill="#FFFFFF">
    <circle cx="14.8" cy="7.8" r="0.32"/>
    <circle cx="14" cy="9.6" r="0.35"/>
    <circle cx="14" cy="11.4" r="0.35"/>
    <circle cx="13.2" cy="10.4" r="0.3"/>
    <circle cx="14.7" cy="10.5" r="0.32"/>
    <circle cx="14.3" cy="10.9" r="0.25"/>
    <circle cx="12" cy="11.2" r="0.3"/>
    <circle cx="11.3" cy="9.8" r="0.3"/>
    <circle cx="14.2" cy="12.8" r="0.3"/>
    <circle cx="13.4" cy="13.5" r="0.28"/>
    <circle cx="14.9" cy="13.5" r="0.28"/>
    <circle cx="14" cy="14.2" r="0.25"/>
  </g>
</svg>`;

async function main() {
  mkdirSync('public', { recursive: true });
  writeFileSync('public/favicon.svg', BRAZIL_FLAG_SVG.trim() + '\n');
  console.log('Wrote public/favicon.svg');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Render centered in a square canvas preserving aspect ratio
  async function renderPng(size) {
    const flagW = Math.round(size * (size === 16 ? 0.95 : 0.9));
    const flagH = Math.round(flagW * (20 / 28));
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            overflow: hidden;
          }
          svg {
            width: ${flagW}px;
            height: ${flagH}px;
            display: block;
          }
        </style>
      </head>
      <body>
        ${BRAZIL_FLAG_SVG}
      </body>
    </html>`;

    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    return await page.screenshot({ type: 'png', omitBackground: true });
  }

  const png16 = await renderPng(16);
  const png32 = await renderPng(32);
  const png48 = await renderPng(48);

  await browser.close();

  // Pack into standard ICO format
  const images = [
    { size: 16, data: png16 },
    { size: 32, data: png32 },
    { size: 48, data: png48 },
  ];

  // ICO header: 6 bytes
  // Directory entries: 16 bytes each
  let offset = 6 + images.length * 16;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size, 0); // width
    entry.writeUInt8(img.size, 1); // height
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += img.data.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(images.length, 4); // count

  const icoBuffer = Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
  writeFileSync('public/favicon.ico', icoBuffer);
  console.log(`Wrote public/favicon.ico (${icoBuffer.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
