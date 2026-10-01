// Unit checks for the wait-time feed schema, against both shapes ESDC's feed really sends:
// node --test src/countries/ca/widgets/offices/feed.test.mjs
// Payloads recorded 2026-10-01 from https://api.io.canada.ca/io-server/esdc-edsc/scc/wait-times/v1/office/<id>
// (the per-city flags the widget never reads are trimmed).
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { FeedSchema, measuredAt } = await import('./feed.ts');

/** Kingston (3792), appointment-only: no wait-time posting, so the feed sends `false` where a value would be. */
const KINGSTON = {
  posui: '3792', officeName: 'Kingston', officeType: 'scc', lastUpdated: '2026-10-01',
  waitTimeManualDate: false, waitTimeManualSeconds: false, waitTimeMoment: false, waitTimeNotAvailable: true,
  waitTimeWhenOpen: false, waitTimeWhenMorning: false, waitTimeWhenAfterNoon: false, isClosedUnexpected: false,
  en: { province: 'Ontario', waitTimeMoment: false, waitingTimeManual: 'This office is closed', officeStatus: 'Closed' },
  fr: { province: 'Ontario', waitTimeMoment: false, waitingTimeManual: 'Ce bureau est fermé', officeStatus: 'Fermé' },
  isClosed: true, timezone: '', region: 'ON', isHoliday: false,
};
/** St. John's (1137): a wait posted today (5400 s, measured "at 2:00pm"). */
const ST_JOHNS = {
  posui: '1137', officeName: "St. John's", officeType: 'po', lastUpdated: '2026-10-01',
  waitTimeManualDate: '2026-10-01', waitTimeManualSeconds: 5400, waitTimeMoment: false, waitTimeNotAvailable: false,
  waitTimeWhenOpen: false, waitTimeWhenMorning: false, waitTimeWhenAfterNoon: true, isClosedUnexpected: false,
  en: { province: 'Newfoundland and Labrador', waitTimeMoment: 'at 2:00pm', waitingTimeManual: 'This office is closed', officeStatus: 'Closed' },
  fr: { province: 'Terre-Neuve-et-Labrador', waitTimeMoment: 'à 14 h 00', waitingTimeManual: 'Ce bureau est fermé', officeStatus: 'Fermé' },
  isClosed: true, timezone: 'Canada/Newfoundland', region: 'NL', isHoliday: false,
};

test('an office with no wait posting (false sentinels) keeps its live reading', () => {
  const r = FeedSchema.safeParse(KINGSTON);
  assert.equal(r.success, true);
  assert.equal(r.data.isClosed, true);
  assert.equal(r.data.isHoliday, false);
  assert.equal(r.data.isClosedUnexpected, false);
  assert.equal(r.data.waitTimeNotAvailable, true);
  assert.equal(r.data.waitTimeManualDate, undefined);
  assert.equal(r.data.waitTimeManualSeconds, undefined);
  assert.equal(r.data.lastUpdated, '2026-10-01');
  assert.equal(measuredAt(r.data.en?.waitTimeMoment), undefined);
});

test('an unexpected closure at such an office is not lost', () => {
  const r = FeedSchema.safeParse({ ...KINGSTON, isClosedUnexpected: true });
  assert.equal(r.success, true);
  assert.equal(r.data.isClosedUnexpected, true);
});

test('an office with a posted wait reads as before', () => {
  const r = FeedSchema.safeParse(ST_JOHNS);
  assert.equal(r.success, true);
  assert.equal(r.data.waitTimeManualDate, '2026-10-01');
  assert.equal(r.data.waitTimeManualSeconds, 5400);
  assert.equal(r.data.waitTimeNotAvailable, false);
  assert.equal(measuredAt(r.data.en?.waitTimeMoment), '14:00');
});

test('false, null and missing all mean "not posted"', () => {
  for (const v of [false, null, undefined, '']) {
    const r = FeedSchema.safeParse({ isClosed: false, lastUpdated: v, waitTimeManualDate: v, waitTimeManualSeconds: v === '' ? 0 : v, en: null });
    assert.equal(r.success, true, String(v));
    assert.deepEqual([r.data.lastUpdated, r.data.waitTimeManualDate, r.data.waitTimeManualSeconds, r.data.en], [undefined, undefined, undefined, undefined]);
  }
});

test('a payload that is not the feed is still refused', () => {
  assert.equal(FeedSchema.safeParse({ waitTimeManualSeconds: 'soon' }).success, false);
  assert.equal(FeedSchema.safeParse({ isClosed: false, waitTimeManualSeconds: true }).success, false);
  assert.equal(FeedSchema.safeParse({ isClosed: false, waitTimeManualDate: true }).success, false);
});

test('measuredAt reads the feed’s English moment', () => {
  assert.equal(measuredAt('at 12:00pm'), '12:00');
  assert.equal(measuredAt('at 12:15am'), '00:15');
  assert.equal(measuredAt('at 9:30am'), '09:30');
  assert.equal(measuredAt(false), undefined);
});
