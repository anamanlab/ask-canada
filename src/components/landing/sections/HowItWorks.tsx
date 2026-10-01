/** How it works: ask, get the answer with its source, hand off to the official page. */
import { ArrowUpRight, Check, Lock } from 'lucide-react';
import { Animated } from '../Animated';
import { getLandingCopy } from '../copy';

export async function HowItWorks() {
  const { t, sp } = await getLandingCopy();
  return (
    <section className="l-section" id="how" aria-labelledby="t-how">
      <p className="eyebrow">{t('how.eyebrow')}</p>
      <h2 className="l-h2" id="t-how">
        {t('how.title')}
        {sp}
        <em>{t('how.titleEm')}</em>
      </h2>
      <Animated as="ol" className="l-steps">
        <li className="l-step">
          <span className="l-step__n">
            <span className="l-step__num">01</span>
            {t('how.1.k')}
          </span>
          <h3>{t('how.1.t')}</h3>
          <p>{t('how.1.p')}</p>
          <div className="l-step__art" aria-hidden>
            <div>
              <div className="l-mini-bubble">
                {t('how.1.demo')}
                <div className="who">
                  <div className="l-wave">
                    {[6, 12, 18, 9, 14, 5, 11].map((h, i) => (
                      <i key={i} style={{ height: h }} />
                    ))}
                  </div>
                  {t('how.1.spoken')}
                </div>
              </div>
            </div>
          </div>
        </li>
        <li className="l-step">
          <span className="l-step__n">
            <span className="l-step__num">02</span>
            {t('how.2.k')}
          </span>
          <h3>{t('how.2.t')}</h3>
          <p>{t('how.2.p')}</p>
          <div className="l-step__art" aria-hidden>
            <div>
              <div className="l-mini-answer">
                {t('how.2.demo1')}
                {sp}
                <b>{t('how.2.demo2')}</b>
                {sp}
                {t('how.2.demo3')}
                <br />
                <span className="l-src-pill">
                  <i />
                  canada.ca › {t('how.2.src')}
                </span>
              </div>
            </div>
          </div>
        </li>
        <li className="l-step">
          <span className="l-step__n">
            <span className="l-step__num">03</span>
            {t('how.3.k')}
          </span>
          <h3>{t('how.3.t')}</h3>
          <p>{t('how.3.p')}</p>
          {/* The hand-off itself: the answer's button, and the official page it lands on. */}
          <div className="l-step__art" aria-hidden>
            <div className="l-hand">
              <span className="l-handoff">
                {t('how.3.handoff')} <ArrowUpRight className="size-4 flip-rtl" />
              </span>
              <span className="l-hand__link" />
              <span className="l-hand__page">
                <span className="l-hand__bar">
                  <Lock className="size-3" strokeWidth={2.2} />
                  <span translate="no">canada.ca</span>
                  <span className="l-hand__ok">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                </span>
                <span className="l-hand__body">
                  <i className="l-hand__h" />
                  <i />
                  <i className="l-hand__short" />
                  <i className="l-hand__cta" />
                </span>
              </span>
            </div>
          </div>
        </li>
      </Animated>
    </section>
  );
}
