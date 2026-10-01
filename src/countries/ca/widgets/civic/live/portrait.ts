/**
 * A member's official portrait for the screen (SERVER ONLY). The page's CSP only allows images from our own
 * origin, so the portrait travels inside the tool output as a data: URI and has to stay small: the House of
 * Commons file is a 142 × 230 JPEG whose pixels weigh 25 to 45 KB (30 KB is typical), wrapped in another 20 to
 * 190 KB of editing metadata (EXIF, XMP, Photoshop; sampled across the House on 2026-10-01). We drop that metadata, byte for byte, and keep the picture untouched.
 * Binary, so core `fetchText` / `fetchJson` don't apply; same timeout, cache and never-throws contract.
 */
import 'server-only';
import { withTimeout } from '@/lib/server/fetch-json';
import { UA } from './http';

/** Largest portrait we inline (bytes, after the metadata is gone); anything bigger falls back to a monogram. */
const MAX_BYTES = 48_000;
/** Don't read an upstream file larger than this at all. */
const MAX_UPSTREAM = 400_000;

const SOI = 0xd8;
const SOS = 0xda;
/** Segments a decoder needs for colour: JFIF (APP0), the ICC profile (APP2) and Adobe's transform flag (APP14). */
const KEEP_APP = new Set([0xe0, 0xe2, 0xee]);
const isMetadata = (marker: number) => marker === 0xfe || (marker >= 0xe0 && marker <= 0xef && !KEEP_APP.has(marker));

/** The same JPEG without its comment and application metadata, or null when the bytes aren't a JPEG we can walk. */
export function stripJpegMetadata(jpeg: Uint8Array): Uint8Array | null {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== SOI) return null;
  const kept: Uint8Array[] = [jpeg.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= jpeg.length) {
    if (jpeg[i] !== 0xff) return null;
    const marker = jpeg[i + 1];
    // From the first scan on, everything is picture data.
    if (marker === SOS) {
      kept.push(jpeg.subarray(i));
      const out = new Uint8Array(kept.reduce((n, part) => n + part.length, 0));
      let at = 0;
      for (const part of kept) {
        out.set(part, at);
        at += part.length;
      }
      return out;
    }
    const end = i + 2 + ((jpeg[i + 2] << 8) | jpeg[i + 3]);
    if (end > jpeg.length) return null;
    if (!isMetadata(marker)) kept.push(jpeg.subarray(i, end));
    i = end;
  }
  return null;
}

/** The official portrait as a small data: URI, or undefined (the card then shows a monogram). */
export async function portrait(url: string, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: withTimeout(signal, 3500), headers: UA, next: { revalidate: 604_800 } });
    if (!res.ok || !/image\/jpe?g/i.test(res.headers.get('content-type') ?? '')) return undefined;
    const raw = new Uint8Array(await res.arrayBuffer());
    if (raw.length > MAX_UPSTREAM) return undefined;
    const lean = stripJpegMetadata(raw) ?? raw;
    if (lean.length > MAX_BYTES) return undefined;
    return `data:image/jpeg;base64,${Buffer.from(lean.buffer, lean.byteOffset, lean.length).toString('base64')}`;
  } catch {
    return undefined;
  }
}
