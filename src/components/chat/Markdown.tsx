'use client';
/**
 * Streamed markdown for assistant answers (streamdown).
 * - `# Heading` becomes the serif verdict line; one *italic* phrase inside it is set in maple italic.
 * - Links whose text is a number (`[2](https://…)`) become citation chips pointing at the numbered source.
 *   A rehype pass keeps each chip group on the line of the word before it (never orphaned on its own
 *   line), and merges adjacent citations into one chip ("2·3") that opens a small list of both sources
 *   (`CitationGroup`).
 * - Other links open in a new tab with an accessible note.
 * - French blocks get French typography: no-break spaces inside « » and before : ; ! ?.
 */
import { memo, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { defaultRehypePlugins, Streamdown } from 'streamdown';
import { useT } from '@/lib/i18n/provider';
import { CitationGroup } from './CitationGroup';
import type { MarkdownProps } from './useMarkdown';

/* ---------- rehype: group + merge citation chips ---------- */

type HText = { type: 'text'; value: string };
type HElement = { type: 'element'; tagName: string; properties: Record<string, unknown>; children: HNode[] };
type HNode = HText | HElement | { type: string; children?: HNode[]; value?: string };

const CITE_RE = /^\d{1,2}$/;
const isCite = (n: HNode | undefined): n is HElement =>
  !!n &&
  n.type === 'element' &&
  (n as HElement).tagName === 'a' &&
  (n as HElement).children.length === 1 &&
  (n as HElement).children[0].type === 'text' &&
  CITE_RE.test(((n as HElement).children[0] as HText).value.trim());
const isSpace = (n: HNode | undefined) => !!n && n.type === 'text' && !(n as HText).value.trim();

function groupCitations(parent: { children?: HNode[] }) {
  const kids = parent.children;
  if (!kids) return;
  const out: HNode[] = [];
  for (let i = 0; i < kids.length; i++) {
    const node = kids[i];
    if (!isCite(node)) {
      if ('children' in node && node.children) groupCitations(node);
      out.push(node);
      continue;
    }
    // Collect a run: cite (space cite)*
    const run: HElement[] = [node];
    let k = i + 1;
    while (isSpace(kids[k]) && isCite(kids[k + 1])) {
      run.push(kids[k + 1] as HElement);
      k += 2;
    }
    i = k - 1;
    // Unique by number, in order.
    const seen = new Set<string>();
    const cites = run
      .map((a) => ({ n: ((a.children[0] as HText).value || '').trim(), href: String(a.properties.href ?? '') }))
      .filter((c) => (seen.has(c.n) ? false : (seen.add(c.n), true)));
    const chip: HElement =
      cites.length > 1
        ? {
            type: 'element',
            tagName: 'a',
            properties: { ...run[0].properties, dataCites: cites.map((c) => `${c.n}|${c.href}`).join(' ') },
            children: [{ type: 'text', value: cites.map((c) => c.n).join('·') }],
          }
        : run[0];
    // Pull the last word (and its punctuation) before the chip into a no-wrap span with it.
    let lead = '';
    const prev = out[out.length - 1];
    if (prev && prev.type === 'text') {
      const m = /(\S+)(\s*)$/.exec((prev as HText).value);
      if (m) {
        (prev as HText).value = (prev as HText).value.slice(0, m.index);
        lead = m[1] + (m[2] ? ' ' : '');
      }
    }
    out.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['ac-cites'] },
      children: lead ? [{ type: 'text', value: lead }, chip] : [chip],
    });
  }
  parent.children = out;
}

const rehypeCitations = () => (tree: HNode) => groupCitations(tree as { children?: HNode[] });
/**
 * Answers are markdown, so rehype-raw is left out: re-parsing every block's HTML through parse5 on each
 * streamed chunk was the most expensive step of rendering. Without it, HTML in an answer stays literal
 * text (never markup). The one tag models do write, `<br>` (in table cells), still becomes a line break.
 */
const BR_RE = /<br\s*\/?>/gi;
function lineBreaks(parent: { children?: HNode[] }) {
  if (!parent.children) return;
  parent.children = parent.children.flatMap((node): HNode[] => {
    if (node.type === 'element' && ((node as HElement).tagName === 'code' || (node as HElement).tagName === 'pre')) return [node];
    if (node.type !== 'text') {
      if ('children' in node && node.children) lineBreaks(node);
      return [node];
    }
    const parts = ((node as HText).value ?? '').split(BR_RE);
    if (parts.length === 1) return [node];
    return parts.flatMap((value, i): HNode[] => {
      const text: HNode[] = value ? [{ type: 'text', value }] : [];
      return i ? [{ type: 'element', tagName: 'br', properties: {}, children: [] }, ...text] : text;
    });
  });
}
const rehypeLineBreaks = () => (tree: HNode) => lineBreaks(tree as { children?: HNode[] });

const rehypePlugins = [defaultRehypePlugins.sanitize, defaultRehypePlugins.harden, rehypeLineBreaks, rehypeCitations];

/* ---------- French typography ---------- */

/** No-break spaces for French: inside « », before : (U+00A0) and a narrow one before ; ! ? (U+202F). */
export function frenchTypography(s: string) {
  return s
    .replace(/«[   ]*/g, '« ')
    .replace(/[   ]*»/g, ' »')
    .replace(/ +:(?=\s|$)/g, ' :')
    .replace(/ +([;!?])/g, ' $1');
}

/* ---------- Components ---------- */

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return '';
}

function Anchor({ href, children, 'data-cites': group, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown; 'data-cites'?: string }) {
  const t = useT();
  // `node` is the syntax-tree element streamdown hands every component, not an attribute.
  const props = { ...rest, node: undefined };
  const label = textOf(children).trim();
  if (group && /^\d{1,2}(·\d{1,2})+$/.test(label)) {
    return <CitationGroup cites={group.split(' ').map((c) => ({ n: c.split('|')[0], href: c.slice(c.indexOf('|') + 1) }))} />;
  }
  if (CITE_RE.test(label) && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="ac-cite" aria-label={t('chat.citation', { n: label })} {...props}>
        {label}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="sr-only"> {t('a11y.newTab')}</span>
    </a>
  );
}

function Lead({ children }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className="ac-lead">{children}</h2>;
}

/** Short emphasized phrases (the maple accent in a lead) never split across two lines. */
function Em({ children }: HTMLAttributes<HTMLElement> & { node?: unknown }) {
  return <em className={textOf(children).length <= 24 ? 'ac-keep' : undefined}>{children}</em>;
}

const components = {
  a: Anchor,
  h1: Lead,
  em: Em,
};

export const Markdown = memo(function Markdown({ text, streaming, lang, dir = 'auto' }: MarkdownProps) {
  // Streamdown renders a wrapper div; `lang`/`dir` on it tag this block's language for fonts, hyphenation and bidi.
  // (No `dir` on Streamdown itself: it would wrap each streaming block in a display:contents div, so the
  // paragraphs lose their spacing mid-stream and snap apart when the answer completes.)
  const body = lang?.startsWith('fr') ? frenchTypography(text) : text;
  return (
    <div lang={lang} dir={dir} className="ac-answer-block">
      <StreamdownBlock text={body} streaming={streaming} />
    </div>
  );
});

const StreamdownBlock = memo(function StreamdownBlock({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <Streamdown
      className="ac-answer"
      mode={streaming ? 'streaming' : 'static'}
      isAnimating={streaming}
      parseIncompleteMarkdown
      controls={false}
      linkSafety={{ enabled: false }}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {text}
    </Streamdown>
  );
});
