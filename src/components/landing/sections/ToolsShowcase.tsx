/** Answers you can act on: three live widget cards (tax deadline, passport, holidays) on an aurora stage. */
import { Calendar, Check, FileText } from '@phosphor-icons/react';
import { pack } from '@/countries/active';
import { Aurora } from '../Aurora';
import { getLandingCopy } from '../copy';
import { taxCountdown, todayInPack, upcomingHolidays } from '../data';
import { DateTileServer, PassportGlyph } from '../glyphs';
import { BrCard, BrCardContent, BrCardFooter } from '@/components/ui/br';

export async function ToolsShowcase() {
  const { t, fmt, sp, d, L, dataLang, checked } = await getLandingCopy();
  const today = todayInPack();
  const tax = taxCountdown(today);
  const holidays = upcomingHolidays(3, today);
  const isBrazil = pack.id === 'br';
  const accentColor = isBrazil ? 'text-[var(--maple)]' : 'text-pine';
  const accentBg = isBrazil ? 'bg-[var(--maple-wash)]' : 'bg-pine-wash';

  return (
    <section className="l-section l-center" id="tools" aria-labelledby="t-tools">
      <p className="eyebrow">{t('tools.eyebrow')}</p>
      <h2 className="l-h2 l-center" id="t-tools">
        {t('tools.title')}
        {sp}
        <em>{t('tools.titleEm')}</em>
      </h2>
      <p className="l-sub l-center">{t('tools.sub')}</p>

      <div className="l-stage">
        <Aurora src={pack.art.hero.aurora} />
        <div className="l-cards">
          {tax ? (
          <BrCard variant="outlined" padding="md" hoverable className="l-wcard" aria-labelledby="w-tax">
            <BrCardContent>
              <div className="l-wc-head">
                <span className={`grid size-9 place-items-center rounded-[11px] ${accentBg} ${accentColor}`}>
                  <FileText className="size-5" strokeWidth={1.7} aria-hidden />
                </span>
                <div>
                  <h3 className="l-wc-title m-0" id="w-tax">
                    {t('showcase.tax.title', { year: String(tax.taxYear) })}
                  </h3>
                  <div className="l-wc-sub">{t('showcase.tax.sub')}</div>
                </div>
              </div>
              <div className="l-wc-body">
                <p className="m-0 l-bignum">
                  {fmt.number(tax.days)}
                  <small>{t('showcase.tax.daysLeft', { count: tax.days })}</small>
                </p>
                <div className="l-bar" aria-hidden>
                  <i style={{ width: `${Math.round(tax.progress * 100)}%` }} />
                </div>
                <div className="l-rowline">
                  <span>{t('showcase.tax.fileBy')}</span>
                  <b>{d(tax.deadline, { month: 'long', day: 'numeric', year: 'numeric' })}</b>
                </div>
                <div className="l-rowline">
                  <span>{t('showcase.tax.selfEmployed')}</span>
                  <b>{d(tax.selfEmployed, { month: 'long', day: 'numeric', year: 'numeric' })}</b>
                </div>
              </div>
              <BrCardFooter className="l-wc-foot">
                <a href={tax.url} target="_blank" rel="noopener noreferrer">{tax.source}</a>
                <span className="ok">
                  <Check className={`size-3 ${accentColor}`} aria-hidden /> {checked}
                </span>
              </BrCardFooter>
            </BrCardContent>
          </BrCard>
          ) : null}

          <BrCard variant="outlined" padding="md" hoverable className="l-wcard l-wcard--center aurora-rule" aria-labelledby="w-pp">
            <BrCardContent>
              <div className="l-wc-head">
                <PassportGlyph />
                <div>
                  <h3 className="l-wc-title m-0" id="w-pp">
                    {t('showcase.passport.title')}
                  </h3>
                  <div className="l-wc-sub">{t('showcase.passport.sub')}</div>
                </div>
              </div>
              <div className="l-wc-body">
                <div className="l-status">
                  <Check className={`size-[18px] ${accentColor}`} strokeWidth={2.4} aria-hidden />
                  {t('showcase.passport.status')}
                </div>
                <div className="l-seg" aria-hidden>
                  <span className="on">
                    {t('showcase.passport.online')}
                    <small>{t('showcase.passport.onlineSub')}</small>
                  </span>
                  <span>
                    {t('showcase.passport.inPerson')}
                    <small>{t('showcase.passport.inPersonSub')}</small>
                  </span>
                  <span>
                    <span className="l-wide">{t('showcase.passport.mail')}</span>
                    <span className="l-narrow">{t('showcase.passport.mailShort')}</span>
                    <small>{t('showcase.passport.mailSub')}</small>
                  </span>
                </div>
                {/* The fee figures are the pack's: Canada reads "$163.50 · $122.50",
                    Brazil "R$ 257,25". Never hardcode a country's money in core. */}
                <div className="l-rowline l-wide">
                  <span>{t('showcase.passport.fee')}</span>
                  <b>{t('showcase.passport.feeValue')}</b>
                </div>
                <div className="l-rowline l-narrow">
                  <span>{t('showcase.passport.feeShort')}</span>
                  <b>{t('showcase.passport.feeValueShort')}</b>
                </div>
                <div className="l-rowline">
                  <span>{t('showcase.passport.processing')}</span>
                  {/* Written out in full at every width (narrow cards stack label over value, so it fits). */}
                  <b>{t('showcase.passport.processingValue')}</b>
                </div>
                <div className="l-rowline">
                  <span>{t('showcase.passport.ready')}</span>
                  <b>{t('showcase.passport.readyValue', { date: d('2026-10-29', { month: 'short', day: 'numeric' }) })}</b>
                </div>
              </div>
              <BrCardFooter className="l-wc-foot">
                <span>{`${pack.officialHomeLabel}/servicos`}</span>
                <span className="ok">
                  <Check className={`size-3 ${accentColor}`} aria-hidden /> {checked}
                </span>
              </BrCardFooter>
            </BrCardContent>
          </BrCard>

          <BrCard variant="outlined" padding="md" hoverable className="l-wcard" aria-labelledby="w-hol">
            <BrCardContent>
              <div className="l-wc-head">
                <span className={`grid size-9 place-items-center rounded-[11px] ${accentBg} ${accentColor}`}>
                  <Calendar className="size-5" strokeWidth={1.7} aria-hidden />
                </span>
                <div>
                  <h3 className="l-wc-title m-0" id="w-hol">
                    {t('showcase.holidays.title')}
                  </h3>
                  <div className="l-wc-sub">{t('showcase.holidays.sub')}</div>
                </div>
              </div>
              <div className="l-wc-body">
                {holidays.map((h) => (
                  <div className="l-hol" key={h.date}>
                    <DateTileServer iso={h.date} month={d(h.date, { month: 'short' })} />
                    <div>
                      <div className="l-hol-name" lang={dataLang}>
                        {h.name[L] ?? h.name.en}
                      </div>
                      <div className="l-hol-day">{d(h.date, { weekday: 'long' })}</div>
                    </div>
                  </div>
                ))}
              </div>
              <BrCardFooter className="l-wc-foot">
                <span>{pack.officialHomeLabel}</span>
                <span className="ok">
                  <Check className={`size-3 ${accentColor}`} aria-hidden /> {checked}
                </span>
              </BrCardFooter>
            </BrCardContent>
          </BrCard>
        </div>
      </div>
    </section>
  );
}
