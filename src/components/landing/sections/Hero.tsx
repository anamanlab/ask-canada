/**
 * Hero: the greeting, the question box, the promises and the starter tasks over the northern scene. On
 * phones, the lake (Shore), with the setting sun and a canoe, fills the band above the tasks.
 */
import type { CSSProperties } from 'react';
import { ArrowRight, Check, CaretDown, Info, Lock, ShieldCheck } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { pack } from '@/countries/active';
import type { Locale } from '@/lib/i18n/config';
import { LandingTitle } from '@/components/chat/LandingTitle';
import { SiteHeader } from '@/components/site/SiteHeader';
import { isOfficial } from '@/lib/brand';
import { getRequestTheme } from '@/lib/i18n/server';
import { Animated } from '../Animated';
import { ribbons, shoreFile } from '../art';
import { getLandingCopy } from '../copy';
import { AskChip, HeroComposer, PreloadImages } from '../islands';
import { oneLineExamples, textEm } from '../measure';
import { Scene } from '../Scene';
import { Shore, ShoreCanoe, ShoreFore } from '../Shore';

/**
 * Canada's starter chips, used when a pack does not name its own (`pack.chips`). Phones keep four
 * (passport, taxes, benefits, travel) plus a link to every service.
 */
const CHIPS_DEFAULT = [
  { id: 'passport' },
  { id: 'taxes' },
  { id: 'ccb', official: true },
  { id: 'ei', wideOnly: true },
  { id: 'travel' },
  { id: 'oas', official: true, wideOnly: true },
] as const;

/** The widths where the lake (Shore) replaces the desktop landscape: the phone breakpoint of landing.css. */
const PHONE = '(max-width: 760px)';

/**
 * The hero's largest paints, fetched from the <head> for the theme the page will show (both, by media query,
 * while it follows the system): the aurora's ribbons and, on phones, the lake.
 */
async function heroArtPreloads() {
  const { aurora, auroraDark = aurora } = pack.art.hero;
  const theme = await getRequestTheme();
  const schemes: ['light' | 'dark', string | undefined][] =
    theme === 'system'
      ? [
          ['light', '(prefers-color-scheme: light)'],
          ['dark', '(prefers-color-scheme: dark)'],
        ]
      : [[theme, undefined]];
  // One artwork for both themes needs no media query (and one hint: React keys preloads by href).
  const auroras: [string, string | undefined][] = aurora === auroraDark ? [[aurora, undefined]] : schemes.map(([scheme, media]) => [scheme === 'dark' ? auroraDark : aurora, media]);
  return [
    ...auroras.flatMap(([src, media]) => ribbons(src).map((r) => ({ href: r.src, media }))),
    ...schemes.map(([scheme, media]) => ({ href: shoreFile[scheme], media: media ? `${PHONE} and ${media}` : PHONE })),
  ];
}

export async function Hero() {
  const [{ t, own, locale, fr, official, sp }, preloads] = await Promise.all([getLandingCopy(), heroArtPreloads()]);
  const greetLang = locale;
  const examples = [1, 2, 3, 4, 5, 6].map((n) => t(`hero.example.${n}`));
  // The short trust line (phones) is a few phrases; each stays whole ("Aucun | compte" never splits).
  const trustParts = t('hero.trust.short').split(' · ');
  // The phone tiles: a name (semibold, about 6% wider than the regular-weight estimate) over a quiet second
  // line (set at 0.82em). The widest of the eight lines sizes the type of all four tiles.
  // The greeting is the pack's, in the reader's language first and its other official language second.
  const greet = pack.brand.greeting?.[locale] ?? pack.brand.name;
  const altLang = (pack.locales.official.find((l) => l !== locale) ?? 'en') as Locale;
  const altGreet = pack.brand.greeting?.[altLang] ?? pack.brand.name;

  const CHIPS = pack.chips ?? CHIPS_DEFAULT;
  const phoneChips = CHIPS.filter((c) => !('wideOnly' in c));
  const chipEm = Math.max(...phoneChips.map((c) => Math.max(textEm(t(`chip.${c.id}.short`)) * 1.06, textEm(own(`chip.${c.id}.sub`) ?? '') * 0.82))).toFixed(2);
  // Phones: one short line (English and French; other languages keep the full lede).
  const ledeShort = own('hero.lede.short');
  // The greeting's width in ems of its own serif, so phones can size it to the column under it.
  const helloEm = fr ? 6.95 : 5.95;
  // Phones rotate only examples that fit the box on one line (see oneLineExamples). English has a short form
  // of each longer question inside the same invitation ("Try “…”"); French sets the whole question on its
  // own (« Comment renouveler mon passeport? »), never a clipped phrase.
  const compactExamples = oneLineExamples(examples.map((e, i) => own(`hero.example.${i + 1}.short`) ?? e));

  return (
    <Animated className="l-hero">
      <PreloadImages images={preloads} />
      <Scene art={pack.art.hero} priority />
      {/* Phones: a quiet statement of status above the header, where an official site would state that it is official: where
          the answers come from first, then, as plainly, that this is not a government site (the link explains
          who runs it). An official deployment shows the Federal Identity Program signature in the header
          instead. */}
      {isOfficial ? null : (
        <Link
          className="l-idstrip"
          href="/about"
          lang={official ? undefined : 'en'}
          dir={official ? undefined : 'ltr'}
          aria-label={`${own('landing.status')} · ${own('landing.statusShort')}. ${own('landing.statusMore')}. ${own('landing.statusLink')}`}
        >
          <ShieldCheck className="l-idstrip__ico" aria-hidden strokeWidth={2} />
          <span className="l-idstrip__k">{own('landing.status')}</span>
          <span className="l-idstrip__sep" aria-hidden>
            ·
          </span>
          <span className="l-idstrip__short">{own('landing.statusShort')}</span>
          <Info className="l-idstrip__info" aria-hidden strokeWidth={2} />
        </Link>
      )}
      <SiteHeader variant="landing" />
      <main id="main" className="l-hero__inner" style={{ '--hello-em': helloEm } as CSSProperties}>
        <p className="l-kicker">
          <span className="l-kicker__dot" aria-hidden />
          {t('hero.kicker')}
        </p>
        <LandingTitle className="l-hello">
          <span lang={greetLang}>
            {greet}
            <span className="l-stop">.</span>
          </span>
          <span className="l-hello__alt" lang={altLang}>
            {altGreet}
            <span className="l-stop">.</span>
          </span>
        </LandingTitle>
        {/* One sentence per line on wider screens, so the lede sits as a balanced pair under the greeting in every language. */}
        <p className={ledeShort ? 'l-lede l-lede--wide' : 'l-lede'}>
          {t('hero.lede')
            .split(/(?<=[。！？])|(?<=[.!?։।۔؟])\s+/)
            .filter(Boolean)
            .map((line, i) => (
              <span key={i} className="l-lede__line">
                {i ? sp : null}
                {line}
              </span>
            ))}
        </p>
        {ledeShort ? <p className="l-lede l-lede--phone">{ledeShort}</p> : null}
        {/* Phones: the lake. The question box and the trust line sit on open sky, and the shore (Shore,
            pinned inside the bay below them) puts the setting sun (by night, a low moon), its path on the
            water, a canoe and the reeds of the near bank between the trust line and the task tiles. Wider screens: a transparent
            wrapper. */}
        <div className="l-lake">
          <div className="l-hero__composer">
            <HeroComposer placeholders={examples} compactPlaceholders={compactExamples} hint={t('hero.hint')} />
          </div>
          <ul className="l-trust">
            {/* Phones: the promises in short form, centred on one line, each with its own check. The privacy
                promise is worded as it is on wider screens. */}
            <li className="l-trust__short">
              {trustParts.map((part, i) => (
                <span key={i} className="l-trust__item">
                  <Check className={`l-trust__check ${pack.id === 'br' ? 'text-[var(--maple)]' : 'text-pine'}`} aria-hidden strokeWidth={2.4} />
                  {part}
                </span>
              ))}
            </li>
            <li>
              <ShieldCheck className={`size-4 ${pack.id === 'br' ? 'text-[var(--maple)]' : 'text-pine'}`} aria-hidden strokeWidth={1.8} />
              {t('hero.trust.source')}
            </li>
            <li>
              <Lock className={`size-4 ${pack.id === 'br' ? 'text-[var(--maple)]' : 'text-pine'}`} aria-hidden strokeWidth={1.8} />
              {t('hero.trust.private')}
            </li>
          </ul>
          <div className="l-lake__open" aria-hidden>
            <Shore className="l-shore" aurora={pack.art.hero.auroraDark ?? pack.art.hero.aurora} />
            <ShoreCanoe className="l-canoe" />
            <ShoreFore className="l-fore" />
          </div>
          <div className="l-hero__tasks">
            {/* --chip-em: the widest line of the phone tiles, so all four share one type size and none wraps. */}
            <ul className="l-chips" aria-label={t('hero.chipsLabel')} style={{ '--chip-em': chipEm } as CSSProperties}>
              {CHIPS.map((c) => (
                <li key={c.id} className={'wideOnly' in c ? 'w-only' : undefined}>
                  <AskChip
                    id={c.id}
                    label={t(`chip.${c.id}`)}
                    short={t(`chip.${c.id}.short`)}
                    sub={'wideOnly' in c ? undefined : own(`chip.${c.id}.sub`)}
                    official={'official' in c ? t(`chip.${c.id}.official`) : undefined}
                    question={t(`chip.${c.id}.q`)}
                  />
                </li>
              ))}
            </ul>
            <a className="l-allsvc" href="#services">
              {t('dir.eyebrow')}
              <ArrowRight className="size-4 flip-rtl" aria-hidden />
            </a>
          </div>
        </div>
      </main>
      <div className="l-hero__foot">
        <a className="l-scroll-cue" href="#tools">
          <CaretDown className="size-4" aria-hidden />
          {t('hero.scroll')}
        </a>
      </div>
    </Animated>
  );
}
