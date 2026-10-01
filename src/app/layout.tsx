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
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      alternateLocale: locale === 'fr' ? ['en_CA'] : ['fr_CA'],
    },
    twitter: { card: 'summary_large_image', title, description },
    appleWebApp: { capable: true, title: pack.brand.name, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
  };
}

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
  const fallback = locale === 'en' || locale === 'fr' ? undefined : translated ? await loadCoreMessages('en') : messages;
  // Until a language has a reviewed UI catalog, the interface stays in English (LTR) while answers
  // use the chosen language (see data-locale). `?dir=rtl` forces mirroring for layout testing.
  const uiLocale = translated ? locale : 'en';
  const forcedDir = (await getForcedDir()) ?? undefined;
  return (
    <html
      lang={uiLocale}
      dir={forcedDir ?? dirOf(uiLocale)}
      data-locale={locale}
      data-theme={theme === 'system' ? undefined : theme}
      data-theme-pref={theme}
      className={fontVariables}
      style={fontFaceVars}
      suppressHydrationWarning
    >
      <head>
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
