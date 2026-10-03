/**
 * Ask. / Demandez. (in French, Demandez. / Ask.): the flag's proportions (1:2:1), with a sample bilingual answer in the white band and two
 * live cards floating beside it (the next holiday, and a travel advisory streamed in from travel.gc.ca).
 */
import { Suspense, type CSSProperties } from 'react';
import { Calendar, Check, Plane } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { packServer as pack } from '@/countries/active.server';
import { getLandingCopy } from '../copy';
import { todayInPack, upcomingHolidays } from '../data';
import { PassportGlyph } from '../glyphs';
import { DemoForm, DemoTry } from '../islands';

/**
 * The live advisory card. It waits on a third-party feed (cached, but slow or down on a cold cache), so it
 * streams in behind a skeleton of the same size instead of holding up the page.
 */
async function AdvisoryCard() {
  const advisory = pack.showcase.advisory ? await pack.showcase.advisory() : null;
  if (!advisory) return null;
  const { t, d, L, dataLang } = await getLandingCopy();
  return (
    <aside className="l-float l-float--b" aria-label={t('flag.advisoryLabel')}>
      <p className="l-float__k m-0">
        <Plane className="size-3.5 text-maple" aria-hidden />
        {t('flag.advisory')}
      </p>
      <p className="l-float__t" lang={dataLang}>
        {advisory.country[L]}
      </p>
      <div className="l-risk" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= advisory.level ? `on-${advisory.level}` : undefined} />
        ))}
      </div>
      <p className="l-float__d" lang={dataLang}>
        {advisory.text[L]}
      </p>
      <a href={advisory.url[L]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-pine no-underline">
        <span className="size-1.5 rounded-full bg-pine" aria-hidden />
        {t('flag.live', { date: d(advisory.updated, { month: 'short', day: 'numeric' }) })}
      </a>
    </aside>
  );
}

/** The advisory card's outline while the feed answers: the same card, with bars where its lines will be. */
function AdvisorySkeleton() {
  return (
    <div className="l-float l-float--b l-float--skel" aria-hidden>
      <i className="w-1/2" />
      <i className="l-float__skel-t w-2/3" />
      <i className="l-float__skel-risk" />
      <i />
      <i className="w-4/5" />
      <i className="w-1/3" />
    </div>
  );
}

export async function FlagDemo() {
  const { t, fmt, sp, d, L, locale, dataLang, checked, fr } = await getLandingCopy();
  // The reader's own language leads the flag; the pack's other official language follows. Canada reads
  // "Ask." / "Demandez.", Brazil "Pergunte." / "Ask." — both from `brand.ask`.
  const endonym = (l: Locale) => new Intl.DisplayNames([l], { type: 'language' }).of(l) ?? l;
  const words = pack.locales.official.map((l) => ({ tag: endonym(l), word: pack.brand.ask?.[l] ?? pack.brand.name, lang: l }));
  // Swap only for the pack's *second* official language: a reader in any other locale keeps the first,
  // which is how Brazil's English readers get "Ask." rather than "Pergunte.".
  const [lead, second] = words[0] && words[1] ? (locale === words[1].lang ? [words[1], words[0]] : words) : [words[0], words[0]];
  const Mark = pack.brand.Mark;
  const [nextHoliday] = upcomingHolidays(1, todayInPack());
  // The demo plan's figures are the pack's. `demo.unit` keeps the "business days" wording next to the number;
  // `demo.unitLabel` is the wording on its own, for a pack whose demoed thing takes no wait at all.
  const demo = pack.showcase.demo;
  const proc = t('showcase.passport.processingValue').split(/\s+\+\s+/)[0].match(/^(\d+)\s*(\S.*)$/);
  const procDays = demo?.unit
    ? { n: demo.unit, unit: '' }
    : proc
      ? { n: proc[1], unit: proc[2] }
      : { n: t('flag.demo.days'), unit: '' };

  return (
    <section className={fr ? 'l-flag l-flag--long-lead' : 'l-flag'} aria-labelledby="t-flag" style={{ '--flag': pack.brand.flagColor } as CSSProperties}>
      <h2 id="t-flag" className="sr-only">
        {t('flag.sr')}
      </h2>
      <div className="l-flag__band l-flag__band--start" aria-hidden>
        <span className="l-flag__tag" lang={lead.lang}>
          {lead.tag}
        </span>
        <span className="l-flag__word" lang={lead.lang}>
          {lead.word}
        </span>
      </div>
      <div className="l-flag__white">
        {/* The flag's rhombus, for packs whose flag carries one. It sits behind the
          cards (first in paint order) and never holds content: green field, yellow
          losango, white answer — the flag, with a question where the globe would be. */}
        {pack.brand.flagDiamond ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 'min(460px, 80%)',
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%) rotate(45deg)',
              background: pack.brand.flagDiamond,
              borderRadius: 32,
            }}
          />
        ) : null}
        <div className="relative w-full max-w-[560px]">
          {nextHoliday ? (
            <aside className="l-float l-float--a" aria-label={t('flag.holidayLabel')}>
              <p className="l-float__k m-0">
                <Calendar className="size-3.5 text-maple" aria-hidden />
                {t('flag.nextHoliday')}
              </p>
              <p className="l-float__t" lang={dataLang}>
                {nextHoliday.name[L] ?? nextHoliday.name.en}
              </p>
              <p className="l-float__d">{t('flag.holidayBody', { date: d(nextHoliday.date, { weekday: 'long', month: 'long', day: 'numeric' }) })}</p>
            </aside>
          ) : null}
          <Suspense fallback={<AdvisorySkeleton />}>
            <AdvisoryCard />
          </Suspense>
          <figure className="l-demo m-0" aria-labelledby="l-demo-cap">
            <figcaption id="l-demo-cap" className="sr-only">
              {t('flag.demo.caption')}
            </figcaption>
            <div className="l-demo__head">
              <span className="grid size-7 place-items-center rounded-[9px] bg-maple text-white">
                <Mark className="size-4" />
              </span>
              {pack.brand.name}
              <span className="l-demo__lang">{pack.locales.official.map((l) => l.toUpperCase()).join(' · ')}</span>
            </div>
            <div className="l-demo__body">
              <p className="l-demo__q">{t('flag.demo.q')}</p>
              <p className="l-demo__a">
                {t('flag.demo.a1')}
                {sp}
                <b>{t('flag.demo.a2')}</b>
                {sp}
                {t('flag.demo.a3')}
                {sp}
                <b>{t('flag.demo.a4')}</b>
              </p>
              <div className="l-demo__plan">
                <div className="l-demo__plan-head">
                  <PassportGlyph />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold leading-tight">{t('showcase.passport.title')}</div>
                    <div className="text-[12.5px] text-ink-3">{t('showcase.passport.sub')}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-pine-wash px-2.5 py-1 text-[12px] font-semibold text-pine">
                    <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
                    {t('flag.demo.eligible')}
                  </span>
                </div>
                <div className="l-demo__stats">
                  <div>
                    <small>{t('flag.demo.fee')}</small>
                    <b>{demo?.amountLabel ?? fmt.currency(demo?.amount ?? 163.5, { minimumFractionDigits: 2 })}</b>
                  </div>
                  <div>
                    <small>{t('flag.demo.processing')}</small>
                    <b>
                      {procDays.n}
                      <span>{procDays.unit}</span>
                    </b>
                  </div>
                  <div>
                    <small>{t('flag.demo.ready')}</small>
                    <b>{demo?.dateLabel ?? d(demo?.date ?? '2026-10-29', { month: 'short', day: 'numeric' })}</b>
                  </div>
                </div>
                <div className="l-demo__plan-foot">
                  <span className="truncate">
                    <span className="l-mono">{pack.officialHomeLabel}</span>
                    <span className="l-demo__checked"> · {t('source.checked', { date: checked })}</span>
                  </span>
                  <DemoTry label={t('flag.demo.try')} question={t('flag.demo.q')} />
                </div>
              </div>
            </div>
            <DemoForm placeholder={t('flag.demo.placeholder')} />
          </figure>
        </div>
      </div>
      <div className="l-flag__band l-flag__band--end" aria-hidden>
        <span className="l-flag__word" lang={second.lang}>
          {second.word}
        </span>
        <span className="l-flag__tag" lang={second.lang}>
          {second.tag}
        </span>
      </div>
      <p className="l-flag__caption">
        <span>{t('flag.caption')}</span>
        {/* The date never breaks across lines ("29, 2026." alone on the last one). */}
        <span>{t('flag.figures', { date: d(pack.showcase.factsChecked, { month: 'long', day: 'numeric', year: 'numeric' }).replace(/ /g, ' ') })}</span>
      </p>
    </section>
  );
}
