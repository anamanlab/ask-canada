/** Every service: the pack's featured services, each a starter question. */
import { pack } from '@/countries/active';
import { getLandingCopy } from '../copy';
import { ServiceRow } from '../islands';

export async function ServicesDirectory() {
  const { t, sp } = await getLandingCopy();
  return (
    <section className="l-section" id="services" aria-labelledby="t-all">
      <p className="eyebrow">{t('dir.eyebrow')}</p>
      <h2 className="l-h2" id="t-all" style={{ maxWidth: '18ch' }}>
        {t('dir.title')}
        {sp}
        <em>{t('dir.titleEm')}</em>
      </h2>
      <ul className="l-dir">
        {pack.services
          .filter((s) => s.featured)
          .map(({ id, icon: Icon }) => (
            <li key={id}>
              <ServiceRow name={t(`services.${id}.name`)} question={t(`services.${id}.starter`)} go={t(`services.${id}.go`)} icon={<Icon className="size-5" strokeWidth={1.7} />} />
            </li>
          ))}
      </ul>
    </section>
  );
}
