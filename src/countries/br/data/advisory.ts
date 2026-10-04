/**
 * Official travel guidance and consular notices for Brazil.
 * Sources: Ministério das Relações Exteriores (MRE) - Portal Consular / MGI.
 */
import 'server-only';
import type { Advisory } from '@/lib/country/types';

export async function getAdvisory(): Promise<Advisory | null> {
  return {
    country: {
      en: 'Consular Portal',
      pt: 'Portal Consular',
    },
    level: 1,
    text: {
      en: 'Official guidance and consular assistance for Brazilian travelers abroad.',
      pt: 'Orientações aos viajantes e assistência consular a brasileiros no exterior.',
    },
    updated: '2026-10-02',
    url: {
      en: 'https://www.gov.br/mre/pt-br/assuntos/portal-consular',
      pt: 'https://www.gov.br/mre/pt-br/assuntos/portal-consular',
    },
  };
}
