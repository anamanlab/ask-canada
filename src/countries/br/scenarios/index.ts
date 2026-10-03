/**
 * Scripted scenario registry for the Brazil pack.
 *
 * `withTitles()` rewrites every citation to `[n](url "Page title")` so a source card reads as a page name.
 * Widget scenarios come first at higher priority; the foundation-owned starters and the general answers sit
 * below them, so a real answer always beats the fallback.
 */
import type { Scenario } from '@/lib/scripted/types';
import camara from './camara';
import catalogo from './catalogo';
import servico from './servico';
import economia from './economia';
import general from './general';
import holidays from './holidays';
import ibge from './ibge';
import starters from './starters';
import { withTitles } from './titles';

export const scenarios: Scenario[] = withTitles([
  ...holidays,
  ...camara,
  ...catalogo,
  ...servico,
  ...economia,
  ...ibge,
  ...starters,
  ...general,
]);

export default scenarios;