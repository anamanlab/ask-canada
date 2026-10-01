/**
 * Snapshot of the live IRCC feeds, taken 2026-10-01. Used only when a feed is down (the widget then says
 * "Last known" instead of "Live"), and to build lab fixtures. Sources: see data.ts.
 */
import type { CountryTimes } from "./times";

/** The day this snapshot was taken (lab fixtures built from it say so in their name). */
export const SNAPSHOT_DATE = "2026-10-01";

/** ee_rounds_123_{en,fr}.json: 12 most recent rounds. */
export const DRAWS_SNAPSHOT = [
  {
    "number": 447,
    "date": "2026-10-01",
    "en": "Trades Occupations, 2026-Version 3",
    "fr": "Métiers spécialisés 2026-Version 3",
    "size": 3500,
    "crs": 476
  },
  {
    "number": 446,
    "date": "2026-09-29",
    "en": "Canadian Experience Class",
    "fr": "Catégorie de l’expérience canadienne",
    "size": 2000,
    "crs": 518
  },
  {
    "number": 445,
    "date": "2026-09-28",
    "en": "Provincial Nominee Program",
    "fr": "Programme des candidats des provinces",
    "size": 733,
    "crs": 725
  },
  {
    "number": 444,
    "date": "2026-09-16",
    "en": "Senior managers with Canadian Work Experience, 2026-Version 1",
    "fr": "Cadres supérieurs/cadres supérieures ayant de l’expérience de travail au Canada 2026-version 1",
    "size": 250,
    "crs": 389
  },
  {
    "number": 443,
    "date": "2026-09-15",
    "en": "Canadian Experience Class",
    "fr": "Catégorie de l’expérience canadienne",
    "size": 2000,
    "crs": 519
  },
  {
    "number": 442,
    "date": "2026-09-14",
    "en": "Provincial Nominee Program",
    "fr": "Programme des candidats des provinces",
    "size": 576,
    "crs": 734
  },
  {
    "number": 441,
    "date": "2026-09-04",
    "en": "Healthcare and Social Services Occupations, 2026-Version 3",
    "fr": "Professions de la santé et des services sociaux 2026-version 3",
    "size": 3500,
    "crs": 475
  },
  {
    "number": 440,
    "date": "2026-09-03",
    "en": "Physicians with Canadian Work Experience, 2026-Version 1",
    "fr": "Médecins ayant de l’expérience de travail au Canada 2026-Version 1",
    "size": 229,
    "crs": 198
  },
  {
    "number": 439,
    "date": "2026-09-01",
    "en": "Canadian Experience Class",
    "fr": "Catégorie de l’expérience canadienne",
    "size": 2000,
    "crs": 521
  },
  {
    "number": 438,
    "date": "2026-08-31",
    "en": "Provincial Nominee Program",
    "fr": "Programme des candidats des provinces",
    "size": 562,
    "crs": 697
  },
  {
    "number": 437,
    "date": "2026-08-19",
    "en": "French-Language proficiency 2026-Version 2",
    "fr": "Compétence linguistique en français 2026-Version 2",
    "size": 5000,
    "crs": 382
  },
  {
    "number": 436,
    "date": "2026-08-18",
    "en": "Canadian Experience Class",
    "fr": "Catégorie de l’expérience canadienne",
    "size": 1000,
    "crs": 523
  }
];

/** Pool distribution (dd1…dd17 without the bold totals) as of the latest round. */
export const POOL_SNAPSHOT = { asOf: "2026-09-27", bands: [728,21070,12745,12817,16465,16257,14847,13677,13419,12173,11888,11454,47298,17359,7707], total: 229904 };

/** flpt-en.json (updated 2026-09-03), data-ptime-non-country-en.json (2026-10-01), flpt-by-week-en.json (2026-09-26). */
export const TIMES_SNAPSHOT: Record<string, string | null> = {
  eta: "5 minutes",
  "visitor-extension": "385 days",
  "study-extension": "8 weeks",
  "work-extension": "12 weeks",
  iec: "6 weeks",
  cec: "About 6 months",
  fsw: "About 7 months",
  "pnp-ee": "About 7 months",
  pnp: "About 13 months",
  "spouse-inside": "About 26 months",
  "spouse-outside": "About 18 months",
  parents: "About 28 months",
  "pr-card": "34 days",
  citizenship: "About 12 months",
  "citizenship-proof": "About 33 months",
};
/** Same feed, Quebec values (pgp-quebec, spousal-canada-quebec, spousal-abroad-quebec). */
export const QUEBEC_SNAPSHOT: Record<string, string> = { parents: "About 63 months", "spouse-inside": "About 32 months", "spouse-outside": "About 33 months" };
export const WAITING_SNAPSHOT: Record<string, number> = { cec: 58900, fsw: 53800, "pnp-ee": 12800, pnp: 101500, "spouse-inside": 54700, "spouse-outside": 62600, parents: 37500, citizenship: 327100, "citizenship-proof": 136000 };
/** When each feed was last updated: pr = flpt, tr = by country, other = non-country, ext = by week. */
export const TIMES_UPDATED_SNAPSHOT = { pr: "2026-09-03", tr: "2026-10-01", other: "2026-10-01", ext: "2026-09-26" };

/** data-ptime-en.json by country (updated 2026-10-01): ISO → "58d" / "5w". */
export const COUNTRY_TIMES_SNAPSHOT: Record<"visitor" | "supervisa" | "study" | "work", CountryTimes> = {"visitor":{"AF":"53d","AL":"52d","DZ":"27d","AO":"168d","AG":"24d","AR":"22d","AM":"10d","AU":"10d","AT":"38d","AZ":"85d","BS":"27d","BH":"59d","BD":"36d","BB":"35d","BY":"19d","BE":"42d","BZ":"23d","BJ":"128d","BM":"20d","BT":"30d","BO":"23d","BA":"42d","BW":"560d","BR":"30d","BG":"38d","BF":"40d","MM":"43d","BI":"66d","KH":"47d","CM":"43d","KY":"28d","CF":"113d","TD":"112d","CL":"27d","CN":"36d","CO":"21d","CG":"41d","CR":"20d","CI":"52d","CU":"22d","CY":"48d","CZ":"30d","DK":"30d","DJ":"75d","DM":"22d","DO":"23d","EC":"29d","EG":"63d","SV":"26d","GQ":"119d","ER":"135d","EE":"36d","ET":"74d","FJ":"12d","FI":"25d","FR":"38d","GA":"40d","GM":"91d","GE":"79d","DE":"34d","GH":"83d","GR":"49d","GD":"24d","GT":"22d","GN":"74d","GY":"15d","HT":"23d","HN":"24d","HK":"20d","HU":"39d","IS":"57d","IN":"30d","ID":"25d","IR":"98d","IQ":"81d","IE":"20d","IL":"45d","IT":"45d","JM":"28d","JP":"56d","JO":"58d","KZ":"10d","KE":"91d","XK":"41d","KW":"60d","KG":"9d","LA":"42d","LV":"28d","LB":"71d","LS":"110d","LR":"98d","LY":"36d","LT":"20d","LU":"37d","MO":"15d","MK":"39d","MG":"134d","MW":"198d","MY":"21d","ML":"83d","MT":"29d","MR":"93d","MU":"99d","MX":"23d","MD":"40d","MN":"19d","ME":"24d","MA":"21d","MZ":"292d","NA":"228d","NP":"42d","NL":"28d","NZ":"9d","NI":"21d","NE":"76d","NG":"97d","NO":"61d","OM":"59d","PK":"75d","PS":"1d","WB":"1d","PA":"29d","PY":"23d","PE":"25d","PH":"26d","PL":"9d","PT":"39d","QA":"60d","RO":"38d","RU":"16d","RW":"48d","LC":"15d","SA":"52d","SN":"59d","RS":"38d","SL":"109d","SG":"19d","SK":"20d","SO":"118d","ZA":"117d","KR":"57d","ES":"38d","LK":"46d","KN":"13d","VC":"26d","SD":"64d","SR":"27d","SZ":"359d","SE":"30d","CH":"39d","SY":"95d","TW":"56d","TJ":"20d","TZ":"47d","TH":"42d","TG":"123d","TT":"15d","TN":"38d","TR":"78d","TC":"28d","UA":"11d","AE":"56d","GB":"24d","US":"18d","UY":"24d","UZ":"14d","VE":"34d","VN":"37d","YE":"52d","ZM":"205d","ZW":"137d"},"supervisa":{"DZ":"57d","BD":"55d","BR":"28d","BI":"79d","CM":"100d","CN":"83d","CO":"71d","CI":"37d","CU":"58d","EG":"39d","ET":"38d","GH":"28d","HT":"37d","HK":"61d","IN":"65d","IR":"231d","JM":"47d","LB":"24d","MX":"78d","MA":"21d","NP":"51d","NG":"44d","PK":"100d","PH":"97d","RU":"66d","SA":"92d","SN":"35d","LK":"40d","SY":"761d","TN":"18d","TR":"69d","UA":"63d","AE":"80d","GB":"91d","US":"72d","VN":"43d"},"study":{"AF":"3w","DZ":"7w","AU":"3w","AT":"5w","AZ":"6w","BS":"4w","BD":"5w","BB":"4w","BE":"6w","BJ":"17w","BR":"5w","BF":"4w","MM":"6w","BI":"6w","KH":"6w","CM":"7w","CA":"8w","TD":"3w","CL":"4w","CN":"4w","CO":"6w","CG":"7w","CI":"8w","CZ":"3w","DK":"3w","DO":"4w","EC":"7w","EG":"8w","ET":"8w","FR":"4w","GM":"4w","DE":"4w","GH":"6w","GN":"7w","HT":"3w","HK":"5w","IN":"6w","ID":"7w","IR":"15w","IQ":"10w","IE":"4w","IL":"6w","IT":"7w","JM":"2w","JP":"4w","JO":"8w","KZ":"5w","KE":"6w","KW":"4w","KG":"3w","LB":"8w","LY":"4w","MG":"17w","MY":"5w","ML":"5w","MU":"12w","MX":"3w","MN":"3w","MA":"7w","NP":"5w","NL":"4w","NE":"5w","NG":"10w","NO":"3w","OM":"4w","PK":"6w","PA":"6w","PE":"5w","PH":"5w","PL":"3w","QA":"6w","RU":"4w","RW":"6w","SA":"4w","SN":"7w","SG":"10w","SK":"3w","ZA":"16w","KR":"4w","ES":"2w","LK":"5w","CH":"5w","TW":"7w","TZ":"7w","TH":"6w","TG":"16w","TT":"6w","TN":"4w","TR":"6w","UA":"7w","AE":"6w","GB":"4w","US":"5w","UZ":"5w","VN":"4w","ZM":"12w","ZW":"15w"},"work":{"DZ":"9w","AU":"7w","BD":"12w","BE":"2w","BR":"3w","CM":"8w","CA":"15w","CL":"5w","CN":"4w","CO":"5w","CI":"11w","DO":"6w","EC":"6w","EG":"9w","FR":"3w","DE":"6w","GH":"21w","GT":"1w","HT":"5w","HN":"1w","HK":"19w","IN":"10w","IR":"27w","IL":"5w","IT":"8w","JM":"7w","JP":"3w","KE":"5w","LB":"7w","LY":"3w","MG":"42w","MY":"9w","MU":"10w","MX":"2w","MD":"6w","MA":"7w","NP":"9w","NI":"3w","NG":"10w","PK":"8w","PE":"5w","PH":"7w","PL":"6w","QA":"16w","RU":"6w","RW":"10w","SA":"4w","SN":"12w","SG":"22w","ZA":"14w","KR":"5w","ES":"2w","LK":"9w","TW":"4w","TH":"12w","TT":"2w","TN":"5w","TR":"10w","AE":"15w","GB":"4w","US":"4w","VN":"5w","ZW":"42w"}};
