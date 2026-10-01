/** Privacy, under the night sky: what stays on this device, and the four promises. */
import { Eraser, Lock, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';
import { pack } from '@/countries/active';
import { getLandingCopy } from '../copy';
import { DeviceCard } from '../islands';
import { Scene } from '../Scene';

const PROMISES = [
  ['account', UserRound],
  ['stored', Eraser],
  ['tracking', ShieldCheck],
  ['numbers', TriangleAlert],
] as const;

export async function PrivacyNight() {
  const { t, sp } = await getLandingCopy();
  return (
    <section className="l-night" aria-labelledby="t-privacy">
      <Scene art={pack.art.night} sun={false} stars land={false} />
      <div className="l-night__inner">
        <div className="l-night__grid">
          <div>
            <div className="l-lockmark" aria-hidden>
              <Lock className="size-7 text-white" strokeWidth={1.5} />
            </div>
            <p className="eyebrow">{t('privacy.eyebrow')}</p>
            <h2 className="l-h2" id="t-privacy">
              {t('privacy.title')}
              {sp}
              <em>{t('privacy.titleEm')}</em>
            </h2>
            <p className="l-sub">{t('privacy.sub')}</p>
          </div>
          <DeviceCard />
        </div>
        <ul className="l-promises">
          {PROMISES.map(([k, Icon]) => (
            <li className="l-promise" key={k}>
              <Icon className="size-[22px]" strokeWidth={1.7} aria-hidden />
              <h3>{t(`privacy.${k}.t`)}</h3>
              <p>{t(`privacy.${k}.p`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
