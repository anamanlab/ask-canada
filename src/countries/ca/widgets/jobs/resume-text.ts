'use client';
/**
 * Reads a resume on the device: .txt/.md/.rtf directly, .docx by unzipping word/document.xml, and text
 * PDFs by inflating their content streams and collecting the text operators. Uses only browser built-ins
 * (File, DecompressionStream) — nothing is uploaded and no library is loaded.
 * Scanned (image) PDFs and PDFs with embedded CID fonts can't be read this way; the caller then asks
 * the person to paste their text instead.
 */
import { looksReadable } from './match';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export type ReadResult = { ok: true; text: string } | { ok: false; reason: 'too-big' | 'unsupported' | 'unreadable' };

async function inflate(bytes: Uint8Array, format: 'deflate' | 'deflate-raw'): Promise<Uint8Array | null> {
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- DOCX */

async function readDocx(buf: ArrayBuffer): Promise<string | null> {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  // Walk local file headers (PK\x03\x04).
  for (let i = 0; i + 30 < u8.length; ) {
    if (dv.getUint32(i, true) !== 0x04034b50) {
      i++;
      continue;
    }
    const method = dv.getUint16(i + 8, true);
    const flags = dv.getUint16(i + 6, true);
    let size = dv.getUint32(i + 18, true);
    const nameLen = dv.getUint16(i + 26, true);
    const extraLen = dv.getUint16(i + 28, true);
    const name = new TextDecoder().decode(u8.subarray(i + 30, i + 30 + nameLen));
    const start = i + 30 + nameLen + extraLen;
    if (flags & 0x08 && size === 0) {
      // Sizes live in a data descriptor after the data: find the next header.
      let j = start;
      while (j + 4 < u8.length && !(u8[j] === 0x50 && u8[j + 1] === 0x4b && (u8[j + 2] === 0x03 || u8[j + 2] === 0x01) && (u8[j + 3] === 0x04 || u8[j + 3] === 0x02))) j++;
      size = Math.max(0, j - start - 16);
    }
    if (name === 'word/document.xml') {
      const data = u8.subarray(start, start + size);
      const out = method === 0 ? data : await inflate(data, 'deflate-raw');
      if (!out) return null;
      const xml = new TextDecoder().decode(out);
      return xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    }
    i = start + Math.max(size, 1);
  }
  return null;
}

/* ---------------------------------------------------------------- PDF */

type PdfObj = { dict: string; data?: Uint8Array };
type CMap = { len: number; map: Map<number, string> };

const latin1 = (u8: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192));
  return s;
};

/** Scan every `n 0 obj … endobj`, using /Length to jump over binary stream data. */
function scanObjects(u8: Uint8Array, text: string): Map<number, PdfObj> {
  const objs = new Map<number, PdfObj>();
  const re = /(\d+)\s+\d+\s+obj\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index + m[0].length;
    const endobj = text.indexOf('endobj', start);
    const streamAt = text.indexOf('stream', start);
    if (streamAt >= 0 && (endobj < 0 || streamAt < endobj)) {
      const dict = text.slice(start, streamAt);
      let dataStart = streamAt + 6;
      if (text[dataStart] === '\r') dataStart++;
      if (text[dataStart] === '\n') dataStart++;
      const direct = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
      let dataEnd = direct ? dataStart + Number(direct[1]) : text.indexOf('endstream', dataStart);
      if (dataEnd < dataStart || dataEnd > u8.length) dataEnd = text.indexOf('endstream', dataStart);
      if (dataEnd < 0) break;
      objs.set(Number(m[1]), { dict, data: u8.subarray(dataStart, dataEnd) });
      re.lastIndex = dataEnd;
    } else {
      objs.set(Number(m[1]), { dict: text.slice(start, endobj < 0 ? undefined : endobj) });
      if (endobj >= 0) re.lastIndex = endobj;
    }
  }
  return objs;
}

async function streamBytes(o: PdfObj): Promise<Uint8Array | null> {
  if (!o.data) return null;
  if (!/\/Filter/.test(o.dict)) return o.data;
  if (!/\/FlateDecode/.test(o.dict) || /\/Filter\s*\[[^\]]*\/\w+[^\]]*\/\w+/.test(o.dict)) return null;
  let data = o.data;
  // Trailing end-of-line bytes before `endstream` upset strict inflaters.
  while (data.length && (data[data.length - 1] === 0x0a || data[data.length - 1] === 0x0d)) data = data.subarray(0, -1);
  return inflate(data, 'deflate');
}

/** Pull the value of `/Key` out of a dictionary: a nested << >>, an array, or a dereferenced object. */
function dictValue(dict: string, key: string, objs: Map<number, PdfObj>): string | undefined {
  const i = dict.search(new RegExp(`/${key}(?![A-Za-z0-9])`));
  if (i < 0) return undefined;
  let j = i + key.length + 1;
  while (/\s/.test(dict[j] ?? '')) j++;
  if (dict.startsWith('<<', j)) {
    let depth = 0;
    for (let k = j; k < dict.length - 1; k++) {
      if (dict[k] === '<' && dict[k + 1] === '<') {
        depth++;
        k++;
      } else if (dict[k] === '>' && dict[k + 1] === '>') {
        depth--;
        k++;
        if (depth === 0) return dict.slice(j, k + 1);
      }
    }
    return undefined;
  }
  if (dict[j] === '[') return dict.slice(j, dict.indexOf(']', j) + 1);
  const ref = dict.slice(j).match(/^(\d+)\s+\d+\s+R/);
  if (ref) return objs.get(Number(ref[1]))?.dict;
  return dict.slice(j).match(/^[^\s/<>[\]]+/)?.[0];
}

const hexToStr = (hex: string) => {
  let s = '';
  for (let i = 0; i + 3 < hex.length + 1; i += 4) s += String.fromCharCode(parseInt(hex.slice(i, i + 4).padEnd(4, '0'), 16));
  return s;
};

function parseCMap(src: string): CMap {
  const map = new Map<number, string>();
  let len = 1;
  for (const block of src.match(/beginbfchar[\s\S]*?endbfchar/g) ?? []) {
    for (const m of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) {
      len = Math.max(len, m[1].length / 2);
      map.set(parseInt(m[1], 16), hexToStr(m[2]));
    }
  }
  for (const block of src.match(/beginbfrange[\s\S]*?endbfrange/g) ?? []) {
    for (const m of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g)) {
      len = Math.max(len, m[1].length / 2);
      const lo = parseInt(m[1], 16);
      const hi = Math.min(parseInt(m[2], 16), lo + 4096);
      if (m[3].startsWith('[')) {
        [...m[3].matchAll(/<([0-9a-fA-F]*)>/g)].forEach((d, k) => map.set(lo + k, hexToStr(d[1])));
      } else {
        const base = m[3].slice(1, -1);
        const first = parseInt(base.slice(-4), 16);
        const prefix = hexToStr(base.slice(0, -4));
        for (let c = lo; c <= hi; c++) map.set(c, prefix + String.fromCharCode(first + (c - lo)));
      }
    }
  }
  return { len, map };
}

const unescapeLiteral = (s: string) =>
  s.replace(/\\(\d{1,3}|.)/gs, (_, c: string) => (/^\d/.test(c) ? String.fromCharCode(parseInt(c, 8) & 0xff) : ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' } as Record<string, string>)[c] ?? (c === '\n' ? '' : c)));

function decodeBytes(bytes: string, cmap?: CMap): string {
  if (!cmap) return bytes;
  let out = '';
  for (let i = 0; i < bytes.length; i += cmap.len) {
    let code = 0;
    for (let k = 0; k < cmap.len; k++) code = (code << 8) | (bytes.charCodeAt(i + k) & 0xff);
    out += cmap.map.get(code) ?? (cmap.len === 1 ? bytes[i] : '');
  }
  return out;
}

/** Text of one content stream, decoding strings through the current font's ToUnicode map. */
function contentText(content: string, fonts: Record<string, CMap | undefined>): string {
  const out: string[] = [];
  let font: CMap | undefined;
  const TOK = /\/([^\s/<>[\]()]+)\s+[-\d.]+\s+Tf|\(((?:\\[\s\S]|[^\\)])*)\)|<([0-9a-fA-F\s]*)>|(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+T[dD]\b|\b(T\*|Tm|ET)\b|(-\d{3,}(?:\.\d+)?)(?=[\s(<\]])/g;
  let inArray = false;
  for (let i = 0; i < content.length; ) {
    const ch = content[i];
    if (ch === '[') inArray = true;
    if (ch === ']') inArray = false;
    TOK.lastIndex = i;
    const m = TOK.exec(content);
    if (!m) break;
    // Keep array state in step with brackets we skipped.
    const skipped = content.slice(i, m.index);
    if (skipped.includes('[')) inArray = true;
    if (skipped.lastIndexOf(']') > skipped.lastIndexOf('[')) inArray = false;
    if (m[1]) font = fonts[m[1]];
    else if (m[2] != null) out.push(decodeBytes(unescapeLiteral(m[2]), font));
    else if (m[3] != null && (inArray || /^\s*(Tj|'|")/.test(content.slice(m.index + m[0].length, m.index + m[0].length + 4)))) {
      const hex = m[3].replace(/\s+/g, '');
      let bytes = '';
      for (let k = 0; k < hex.length; k += 2) bytes += String.fromCharCode(parseInt(hex.slice(k, k + 2).padEnd(2, '0'), 16));
      out.push(decodeBytes(bytes, font));
    } else if (m[5] != null) out.push(Number(m[5]) !== 0 ? '\n' : ' ');
    else if (m[6]) out.push(m[6] === 'T*' || m[6] === 'Tm' ? '\n' : ' ');
    else if (m[7] && inArray && Number(m[7]) < -180) out.push(' ');
    i = m.index + Math.max(1, m[0].length);
  }
  return out.join('');
}

async function readPdf(buf: ArrayBuffer): Promise<string | null> {
  const u8 = new Uint8Array(buf);
  const text = latin1(u8);
  const objs = scanObjects(u8, text);
  // Expand compressed object streams (PDF 1.5+).
  for (const o of [...objs.values()]) {
    if (!/\/Type\s*\/ObjStm/.test(o.dict)) continue;
    const bytes = await streamBytes(o);
    if (!bytes) continue;
    const s = latin1(bytes);
    const first = Number(o.dict.match(/\/First\s+(\d+)/)?.[1] ?? 0);
    const nums = s.slice(0, first).trim().split(/\s+/).map(Number);
    for (let k = 0; k + 1 < nums.length; k += 2) {
      const from = first + nums[k + 1];
      const to = k + 3 < nums.length ? first + nums[k + 3] : s.length;
      if (!objs.has(nums[k])) objs.set(nums[k], { dict: s.slice(from, to) });
    }
  }
  const cmapCache = new Map<number, CMap | undefined>();
  const fontCMap = async (fontDict: string | undefined) => {
    const ref = fontDict?.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
    if (!ref) return undefined;
    const n = Number(ref[1]);
    if (!cmapCache.has(n)) {
      const o = objs.get(n);
      const b = o ? await streamBytes(o) : null;
      cmapCache.set(n, b ? parseCMap(latin1(b)) : undefined);
    }
    return cmapCache.get(n);
  };
  const parts: string[] = [];
  for (const o of objs.values()) {
    if (!/\/Type\s*\/Page(?![s\w])/.test(o.dict)) continue;
    // Resources may be inherited from the parent /Pages node.
    let res = dictValue(o.dict, 'Resources', objs);
    let parent = o.dict;
    for (let hop = 0; !res && hop < 8; hop++) {
      const p = parent.match(/\/Parent\s+(\d+)\s+\d+\s+R/);
      const pd = p ? objs.get(Number(p[1]))?.dict : undefined;
      if (!pd) break;
      res = dictValue(pd, 'Resources', objs);
      parent = pd;
    }
    const fonts: Record<string, CMap | undefined> = {};
    const fontDict = res ? dictValue(res, 'Font', objs) : undefined;
    for (const f of fontDict?.matchAll(/\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g) ?? []) fonts[f[1]] = await fontCMap(objs.get(Number(f[2]))?.dict);
    const contents = o.dict.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/)?.[1] ?? '';
    for (const r of contents.matchAll(/(\d+)\s+\d+\s+R/g)) {
      const c = objs.get(Number(r[1]));
      const b = c ? await streamBytes(c) : null;
      if (b) parts.push(contentText(latin1(b), fonts));
    }
    parts.push('\n');
  }
  return parts.join('');
}

/* ---------------------------------------------------------------- entry */

export async function readResumeFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_RESUME_BYTES) return { ok: false, reason: 'too-big' };
  const name = file.name.toLowerCase();
  try {
    let text: string | null = null;
    if (/\.(txt|md|markdown|text)$/.test(name) || file.type.startsWith('text/')) text = await file.text();
    else if (name.endsWith('.rtf')) text = (await file.text()).replace(/\\[a-z]+-?\d* ?|[{}]/g, ' ');
    else if (name.endsWith('.docx')) text = await readDocx(await file.arrayBuffer());
    else if (name.endsWith('.pdf') || file.type === 'application/pdf') text = await readPdf(await file.arrayBuffer());
    else return { ok: false, reason: 'unsupported' };
    if (!text || !looksReadable(text)) return { ok: false, reason: 'unreadable' };
    return { ok: true, text: text.replace(/[ \t]+/g, ' ').trim() };
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}
