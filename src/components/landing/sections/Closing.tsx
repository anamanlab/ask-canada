/** Closing: What do you need? / On vous écoute. A last question box over the prairie at dusk. */
import { pack } from '@/countries/active';
import { localeInfo } from '@/lib/i18n/config';
import { getLandingCopy } from '../copy';
import { ClosingComposer, LanguageCTA } from '../islands';
import { Prairie } from '../Prairie';
import { Scene } from '../Scene';

export async function Closing() {
  const { t, fr, locale } = await getLandingCopy();
  const Mark = pack.brand.Mark;
  return (
    <section className="l-closing" aria-labelledby="t-close">
      <Scene art={pack.art.dusk} sun={false} land={false} />
      <Prairie className="l-prairie" />
      <Mark className="l-closing__leaf" />
      <p className="eyebrow l-center" style={{ justifyContent: 'center' }}>
        {pack.locales.official.map((l) => localeInfo(l).endonym).join(' · ')}
      </p>
      <h2 className="l-closing__h" id="t-close">
        <span lang={fr ? 'fr' : 'en'}>{fr ? 'De quoi avez‑vous besoin?' : 'What do you need?'}</span>
        <em lang={fr ? 'en' : 'fr'}>{fr ? 'We’re listening.' : 'On vous écoute.'}</em>
      </h2>
      <p className="l-sub">{t('closing.sub')}</p>
      <div className="l-closing__composer">
        <ClosingComposer label={t('composer.labelClosing')} placeholder={t('closing.placeholder')} compact={t('closing.placeholder.short')} lang={locale} />
      </div>
      <div className="l-closing__alt">
        <LanguageCTA />
      </div>
    </section>
  );
}
