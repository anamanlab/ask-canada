/**
 * Site footer (Server Component): brand, links, privacy controls, emergency line and the honest
 * independent-service disclaimer from the country pack messages.
 */
import './footer.css';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { pack } from '@/countries/active';
import { getT } from '@/lib/i18n/server-t';
import { disclaimerKey } from '@/lib/brand';
import { ClearDeviceButton } from './ClearDevice';
import { LangSwitchLink } from './LangSwitchLink';

export async function Footer() {
  const { t, locale } = await getT();
  const Mark = pack.brand.Mark;
  return (
    <footer className="l-foot">
      <div className="l-foot__top">
        <div>
          <Link href="/" className="ac-brand" aria-label={t('brand.home', { brand: pack.brand.name })}>
            <Mark className="ac-brand__leaf" />
            <span className="ac-brand__name">{pack.brand.name}</span>
          </Link>
          <p className="l-foot__tag">{t('footer.tagline')}</p>
        </div>
        <nav aria-labelledby="f-about">
          <h2 id="f-about">{pack.brand.name}</h2>
          <ul>
            <li>
              <Link href="/about">{t('footer.about')}</Link>
            </li>
            <li>
              <Link href="/accessibility">{t('footer.accessibility')}</Link>
            </li>
            <li>
              <a href={pack.officialHome[locale] ?? pack.officialHome.en}>{t('footer.official', { site: pack.officialHomeLabel })}</a>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="f-privacy">
          <h2 id="f-privacy">{t('footer.privacyControls')}</h2>
          <ul>
            <li>
              <Link href="/privacy">{t('footer.privacy')}</Link>
            </li>
            <li>
              <Link href="/terms">{t('footer.terms')}</Link>
            </li>
            <li>
              <ClearDeviceButton variant="link" />
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="f-lang">
          <h2 id="f-lang">{t('footer.language')}</h2>
          <ul>
            <li>
              <LangSwitchLink />
            </li>
          </ul>
        </nav>
      </div>
      <p className="l-foot__sos">
        <Phone className="size-4 text-maple" aria-hidden />
        <span>
          {t('footer.emergencyA')} <span className="whitespace-nowrap"><a href={`tel:${pack.emergency.number}`}>{pack.emergency.number}</a>.</span> {t('footer.emergencyB')}{' '}
          {/* The number never breaks at its hyphens, or across lines from its period. */}
          <span className="whitespace-nowrap">
            <a href={`tel:${pack.emergency.crisisTel}`}>{pack.emergency.crisis.replace(/-/g, '\u2011')}</a>.
          </span>
        </span>
      </p>
      <div className="l-foot__bottom">
        <p className="l-foot__disc">
          <Mark />
          {t(disclaimerKey)}
        </p>
        <span className="l-foot__domain">{pack.brand.domain}</span>
      </div>
    </footer>
  );
}
