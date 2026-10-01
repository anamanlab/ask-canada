/**
 * Translation for Server Components:
 *   const { t, fmt, locale } = await getT();
 */
import 'server-only';
import { pack } from '@/countries/active';
import { intlTag } from './config';
import { loadMessages } from './catalog';
import { formatMessage, type MessageValues } from './format';
import { makeFormatters } from './provider-formatters';
import { getRequestLocale } from './server';

export async function getT() {
  const locale = await getRequestLocale();
  const { messages } = await loadMessages(locale);
  const intl = intlTag(locale, pack.region);
  const t = (key: string, values?: MessageValues) => {
    const tpl = messages[key];
    if (tpl == null) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    return formatMessage(tpl, values, intl);
  };
  return { t, locale, intl, fmt: makeFormatters(intl, pack.currency) };
}
