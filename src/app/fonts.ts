/**
 * Type system: Newsreader (serif display, optical sizes + an italic accent), Geist (UI sans), Geist Mono
 * (sources, stamps). Script fonts for other languages are declared with `preload: false`; the browser
 * downloads them only when a page in that language actually uses them (see the :lang() rules in globals.css).
 */
import {
  Geist,
  Geist_Mono,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Arabic,
  Noto_Sans_Canadian_Aboriginal,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Tamil,
} from 'next/font/google';
import localFont from 'next/font/local';

/*
 * Newsreader is self-hosted (`./_fonts`, built by scripts/build-fonts.py from Google's own subset files).
 * Google serves it with the whole optical-size axis and a variable italic, 280 KB for latin alone. The files
 * here are the same drawings, cut down to what the pages set: the roman keeps its weight axis and optical
 * sizes 18–72 (the display type is set at 'opsz' 24–72 in landing.css and chat.css), and the italic keeps
 * the same optical sizes with only the weights it is set at, 340–400 (the display accent is 340, the text
 * italic 400; anything bolder renders at 400). About 167 KB for latin.
 * Only latin is preloaded: EN/FR need nothing else up front. Latin Extended and Vietnamese are separate
 * families behind it in the stack, limited by `unicode-range` to Google's ranges, so a browser downloads
 * them only for text that needs them.
 */
export const newsreader = localFont({
  src: [
    { path: './_fonts/newsreader-latin.woff2', weight: '200 800', style: 'normal' },
    { path: './_fonts/newsreader-latin-italic.woff2', weight: '200 800', style: 'italic' },
  ],
  display: 'swap',
  // The metric-matched fallback is declared by hand in globals.css, with the measurements next/font/google
  // used for Newsreader (next/font/local derives different ones, which would move text when the font swaps in).
  adjustFontFallback: false,
  fallback: ['Newsreader Fallback'],
});
const newsreaderLatinExt = localFont({
  src: [
    { path: './_fonts/newsreader-latin-ext.woff2', weight: '200 800', style: 'normal' },
    { path: './_fonts/newsreader-latin-ext-italic.woff2', weight: '200 800', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
});
const newsreaderVietnamese = localFont({
  src: [
    { path: './_fonts/newsreader-vietnamese.woff2', weight: '200 800', style: 'normal' },
    { path: './_fonts/newsreader-vietnamese-italic.woff2', weight: '200 800', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
  ],
});
/*
 * `subsets` only decides what is preloaded: next/font still declares every subset's face with its
 * unicode-range, so é/ç/œ come from the preloaded latin file and Vietnamese, Cyrillic or Polish text still
 * downloads its own face on demand.
 */
export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
// Mono only sets small print (source stamps, lab labels), never above-the-fold text: not preloaded.
export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false });

// CJK (zh-Hans, zh-Hant, ko) uses the excellent system fonts (PingFang, Microsoft YaHei, Noto CJK,
// Apple SD Gothic Neo, Malgun Gothic) instead of shipping hundreds of unicode-range font faces.
export const arabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic', display: 'swap', preload: false });
export const nastaliq = Noto_Nastaliq_Urdu({ subsets: ['arabic'], variable: '--font-nastaliq', display: 'swap', preload: false });
export const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ['gurmukhi'], variable: '--font-gurmukhi', display: 'swap', preload: false });
export const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', display: 'swap', preload: false });
export const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], variable: '--font-tamil', display: 'swap', preload: false });
export const gujarati = Noto_Sans_Gujarati({ subsets: ['gujarati'], variable: '--font-gujarati', display: 'swap', preload: false });
export const syllabics = Noto_Sans_Canadian_Aboriginal({
  subsets: ['canadian-aboriginal'],
  variable: '--font-syllabics',
  display: 'swap',
  preload: false,
});

export const fontVariables = [
  geist, geistMono, arabic, nastaliq, gurmukhi, devanagari, tamil, gujarati, syllabics,
]
  .map((f) => f.variable)
  .join(' ');

/**
 * The brand faces on their own, without their metric-matched local fallbacks ("Geist Fallback" is local
 * Arial, "Newsreader Fallback" is Times New Roman). Both of those carry Arabic glyphs, so in a stack like
 * `Geist, Geist Fallback, Noto Sans Arabic` the Arabic text would render in Arial and never reach Noto.
 * Script stacks in globals.css put the script face between the brand face and its fallback instead.
 * `--font-newsreader` is the whole serif family: its three subset families, then the fallback.
 */
const families = (f: { style: { fontFamily: string } }) => f.style.fontFamily.split(',').map((x) => x.trim());
const [geistFace, geistFallback = 'sans-serif'] = families(geist);
const [newsreaderLatin, newsreaderFallback = 'serif'] = families(newsreader);
const newsreaderFace = [newsreaderLatin, ...families(newsreaderLatinExt), ...families(newsreaderVietnamese)].join(', ');
export const fontFaceVars = {
  '--font-geist-face': geistFace,
  '--font-geist-fallback': geistFallback,
  '--font-newsreader': `${newsreaderFace}, ${newsreaderFallback}`,
  '--font-newsreader-face': newsreaderFace,
  '--font-newsreader-fallback': newsreaderFallback,
} as Record<string, string>;
