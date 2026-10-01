/** Appearance preference: system (default) | light | dark. Stored in a first-party cookie, device only.
 * Read it with `useThemePref()` / `useResolvedTheme()` from '@/lib/hooks'. */
import { prefersDark, type ThemePref } from '@/lib/hooks/media';
import { THEME_COOKIE } from '@/lib/i18n/config';

export type { ThemePref };

export function setThemePref(pref: ThemePref) {
  const d = document.documentElement;
  d.dataset.themePref = pref;
  const dark = pref === 'dark' || (pref === 'system' && prefersDark());
  d.dataset.theme = dark ? 'dark' : 'light';
  try {
    document.cookie = pref === 'system' ? `${THEME_COOKIE}=; path=/; max-age=0` : `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}
