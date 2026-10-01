/** Bank of Canada rates as the mortgage tool returns them (types only + the "no live data" value). */
export type Rate = { value: number; date: string };
export type LiveRates = { live: boolean; posted5y: Rate | null; policy: Rate | null; prime: Rate | null };

export const NO_RATES: LiveRates = { live: false, posted5y: null, policy: null, prime: null };
