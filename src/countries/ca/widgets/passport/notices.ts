/**
 * Live passport service notices, read server-side from canada.ca's Canadian passports page.
 *
 * canada.ca posts disruptions (wildfires, Canada Post strikes, call-centre outages) as `.alert` blocks near
 * the top of canadian-passports.html and switches them off by wrapping them in HTML comments. So: strip the
 * comments, then read every remaining `<div class="alert alert-…">` block (title from its <summary>/<h2>/
 * <strong>, body from the rest, its <li> items as a list, link from its first <a>). Timeout 3.5 s, cached 30 min. If anything fails
 * we return `live: false` and the widget says nothing about disruptions, only "check canada.ca".
 */
import 'server-only';
import { fetchText } from '@/lib/server/fetch-json';
import type { Lang, Notice, NoticeFeed, NoticeFeeds } from './types';
import { URLS } from './data';

const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: '’',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  lt: '<',
  gt: '>',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
};

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, k: string) => ENTITIES[k.toLowerCase()] ?? m);

const text = (html: string) =>
  decode(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();

/** The HTML of each `<div class="alert …">` block, with nested divs balanced. */
function alertBlocks(html: string): { kind: string; html: string }[] {
  const out: { kind: string; html: string }[] = [];
  const open = /<div\b[^>]*class="[^"]*\balert\b[^"]*\balert-(warning|danger|info|success)\b[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = open.exec(html))) {
    const tag = /<(\/?)div\b[^>]*>/gi;
    tag.lastIndex = m.index + m[0].length;
    let depth = 1;
    let t: RegExpExecArray | null;
    let end = html.length;
    while ((t = tag.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    out.push({ kind: m[1].toLowerCase(), html: html.slice(m.index + m[0].length, end) });
    open.lastIndex = end;
  }
  return out;
}

/** Pure parser: the live alert blocks of the page, at most three. */
function parseNotices(html: string, base = 'https://www.canada.ca'): Notice[] {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
  const live = main.replace(/<!--[\s\S]*?-->/g, '');
  return alertBlocks(live)
    .map(({ kind, html: block }): Notice | null => {
      const head = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ?? block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) ?? block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      const title = head ? text(head[1]) : text(block).slice(0, 160);
      if (!title) return null;
      const rest = head ? block.replace(head[0], '') : '';
      // Lists stay lists ("…and you: • can’t access your mail, and • asked to have it mailed to you"):
      // flattened into one sentence they read as broken copy.
      const list = [...rest.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => text(li[1])).filter(Boolean).slice(0, 6);
      let body = text(list.length ? rest.replace(/<(ul|ol)\b[\s\S]*?<\/\1>/gi, ' ') : rest);
      if (body.length > 320) body = `${body.slice(0, 300).replace(/\s+\S*$/, '')}…`;
      const href = block.match(/<a\b[^>]*href="([^"]+)"/i)?.[1];
      let url: string | undefined;
      try {
        url = href ? new URL(decode(href).replace(/^\/content\/canadasite/, ''), base).toString() : undefined;
      } catch {
        url = undefined;
      }
      return { tone: kind === 'warning' || kind === 'danger' ? 'warn' : 'info', title, body: body || undefined, list: list.length ? list : undefined, url };
    })
    .filter((n): n is Notice => n !== null)
    .slice(0, 3);
}

async function readFeed(lang: Lang, today: string, signal?: AbortSignal): Promise<NoticeFeed> {
  const page = URLS.home[lang];
  const offline: NoticeFeed = { live: false, checked: today, page, items: [] };
  const res = await fetchText(page, {
    revalidate: 1800,
    timeout: 3500,
    signal,
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; AskCanada/1.0; +https://www.canada.ca)' },
  });
  // A page without the usual template isn't something we can vouch for either way.
  if (!res.ok || !/<main\b/i.test(res.data)) return offline;
  try {
    return { live: true, checked: today, page, items: parseNotices(res.data) };
  } catch {
    return offline;
  }
}

/** Both languages (the planner can switch language after it renders). Never throws. */
export async function fetchPassportNotices(today: string, signal?: AbortSignal): Promise<NoticeFeeds> {
  const [en, fr] = await Promise.all([readFeed('en', today, signal), readFeed('fr', today, signal)]);
  return { en, fr };
}
