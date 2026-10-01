/**
 * Upstream access for the civic tools (SERVER ONLY). Every call goes through core `fetchJson` / `fetchText`
 * (timeout, Next data cache, validation at the boundary) and never throws: builders fall back to the official
 * page when a result is not ok.
 */
import 'server-only';
import type { z } from 'zod';
import { fetchJson, fetchText } from '@/lib/server/fetch-json';

export const UA = { 'user-agent': 'AskCanada/1.0 (+https://canada.ryancampbell.com)' };

type Call = { revalidate: number; timeout: number; signal?: AbortSignal };

export const getJson = <S extends z.ZodType>(url: string, schema: S, o: Call) => fetchJson(url, schema, { ...o, headers: UA });

/** A page or XML document as text, or '' when it can't be read. */
export async function getText(url: string, o: Call): Promise<string> {
  const res = await fetchText(url, { ...o, headers: { ...UA, accept: 'text/html,application/xml' } });
  return res.ok ? res.data : '';
}

export const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

/** Text of the first `<name>…</name>` element. */
export const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return m ? decode(m[1]).trim() : undefined;
};

export const strip = (html: string) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
