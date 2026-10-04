import type { Metadata, Viewport } from 'next';
import './globals.css';
// Site chrome (header, brand, menu) is on every page. The landing's, the footer's and the chat's own
// sheets load with their components.
import '@/components/site/chrome.css';
import { fontFaceVars, fontVariables } from './fonts';
import { pack } from '@/countries/active';
import { dirOf } from '@/lib/i18n/config';
import { loadCoreMessages, loadMessages } from '@/lib/i18n/catalog';
import { getForcedDir, getNonce, getRequestLocale, getRequestTheme } from '@/lib/i18n/server';
import { formatMessage, type Messages } from '@/lib/i18n/format';
import { I18nProvider } from '@/lib/i18n/provider';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { messages } = await loadMessages(locale);
  const title = formatMessage(messages['meta.title'] ?? pack.brand.name, { brand: pack.brand.name });
  const description = messages['meta.description'];
  return {
    metadataBase: new URL(pack.brand.url),
    title: { default: title, template: `%s · ${pack.brand.name}` },
    description,
    applicationName: pack.brand.name,
    openGraph: {
      type: 'website',
      siteName: pack.brand.name,
      title,
      description,
      locale: pack.id === 'br' ? (locale === 'en' ? 'en_US' : 'pt_BR') : locale === 'fr' ? 'fr_CA' : 'en_CA',
      alternateLocale: pack.id === 'br' ? [locale === 'en' ? 'pt_BR' : 'en_US'] : locale === 'fr' ? ['en_CA'] : ['fr_CA'],
    },
    twitter: { card: 'summary_large_image', title, description },
    appleWebApp: { capable: true, title: pack.brand.name, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/icon/favicon', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    },
  };
}

/**
 * The pack's accent, as a stylesheet. Core's tokens are historically named `maple`; the values are just
 * "the accent", so a pack overrides the three variables and every `text-maple` / `bg-maple-wash` / `maple`
 * ring follows without a single component changing.
 *
 * It has to be a stylesheet, not an inline `style` on <html>: an inline declaration outranks the
 * `[data-theme='dark']` block in globals.css, so a pack accent set inline stayed at its light value in dark
 * mode (Brazil's green send button glowed on the dark hero). These are the same two selectors core itself
 * uses, so the cascade stays in one place.
 */
type Accent = NonNullable<typeof pack.brand.accent>;

function accentCss(accent: Accent | undefined): string | null {
  if (!accent) return null;
  const set = (v: { base: string; ink: string; wash: string }) => `--maple:${v.base};--maple-ink:${v.ink};--maple-wash:${v.wash}`;
  const dark = accent.dark;
  if (!dark) return `:root{${set(accent)}}`;
  return [
    `:root{${set(accent)}}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme='light']){${set(dark)}}}`,
    `:root[data-theme='dark']{${set(dark)}}`,
  ].join('');
}

const ACCENT_CSS = accentCss(pack.brand.accent);

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: pack.brand.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: pack.brand.themeColor.dark },
  ],
};

/**
 * Resolves the "system" theme before first paint (no flash), then follows OS changes for as long as the
 * preference is "system". The preference is read when the OS changes, not at load, so an explicit light/dark
 * choice made later in the Menu is never overridden, and switching back to "system" follows the OS again.
 */
const THEME_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=function(){if(d.dataset.themePref==='system')d.dataset.theme=m.matches?'dark':'light'};s();m.addEventListener('change',s)}catch(e){}})();`;

/**
 * Catalog namespaces only Server Components read (policy pages, metadata, the landing's sections). They stay
 * out of the client payload that every page embeds; everything else is sent, so a new namespace works in
 * client components by default.
 */
const SERVER_ONLY_NAMESPACES = new Set(['doc', 'meta', 'hero', 'how', 'flag', 'showcase', 'closing', 'tools', 'chip', 'sources']);

function clientMessages(messages: Messages): Messages {
  return Object.fromEntries(Object.entries(messages).filter(([key]) => !SERVER_ONLY_NAMESPACES.has(key.slice(0, key.indexOf('.')))));
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [locale, theme, nonce] = await Promise.all([getRequestLocale(), getRequestTheme(), getNonce()]);
  const { messages, translated } = await loadMessages(locale);
  // Other interface languages also get the English core strings, for widgets not yet translated into them.
  const fallback = locale === 'en' || locale === 'fr' || locale === 'pt' ? undefined : translated ? await loadCoreMessages('en') : messages;
  // Until a language has a reviewed UI catalog, the interface stays in the default language while answers
  // use the chosen language (see data-locale). `?dir=rtl` forces mirroring for layout testing.
  const uiLocale = translated ? locale : pack.locales.default;
  const forcedDir = (await getForcedDir()) ?? undefined;
  return (
    <html
      lang={uiLocale}
      dir={forcedDir ?? dirOf(uiLocale)}
      data-country={pack.id}
      data-locale={locale}
      data-theme={theme === 'system' ? undefined : theme}
      data-theme-pref={theme}
      className={fontVariables}
      style={fontFaceVars}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon" />
        {ACCENT_CSS ? <style dangerouslySetInnerHTML={{ __html: ACCENT_CSS }} /> : null}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <I18nProvider
          locale={locale}
          messages={clientMessages(messages)}
          translated={translated}
          fallback={fallback && clientMessages(fallback)}
          region={pack.region}
          currency={pack.currency}
        >
          {children}
</I18nProvider>
       </body>
    </html>
  );
}
