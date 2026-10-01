/**
 * The two halves of the `CountryPack` contract (`src/lib/country/types.ts`):
 *   - `ClientPack`: `countries/<cc>/pack.ts`, bundled for the browser, read through `@/countries/active`.
 *   - `CountryPack`: `countries/<cc>/pack.server.ts` (`import 'server-only'`), the client pack plus the
 *     server-only fields, read through `packServer` from `@/countries/active.server`.
 */
import type { CountryPack } from '@/lib/country/types';

/** Fields only server code may read: the model's instructions, the UI catalog loaders and the landing's live data. */
export type ServerPackKey = 'systemPrompt' | 'messages' | 'showcase';

export type ClientPack = Omit<CountryPack, ServerPackKey>;
