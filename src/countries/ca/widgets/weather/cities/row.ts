/** One forecast location: [id, English name, French name when different (else 0), lat, lon]. Province = id prefix. */
export type CityRow = readonly [id: string, en: string, fr: string | 0, lat: number, lon: number];
