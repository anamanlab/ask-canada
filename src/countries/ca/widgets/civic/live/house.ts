/**
 * The House of Commons, live (SERVER ONLY): who holds each of the 343 seats right now (constituencies XML;
 * an empty seat is vacant) and a member's profile (member XML + profile page: honorific, roles, caucus,
 * portrait, email, offices).
 */
import 'server-only';
import { z } from 'zod';
import { HOUSE, mpProfileUrl, type Lang } from '../data';
import type { Seat } from '../build/ridings';
import { fold } from '../build/text';
import type { Mp, Office } from '../types';
import { fetchText } from '@/lib/server/fetch-json';
import { UA, decode, getText, strip, tag } from './http';
import { portrait } from './portrait';

/*
 * The House of Commons publishes XML and HTML, read here with patterns. What the patterns find is checked against
 * these shapes before it leaves this file, so a markup change is a detected failure (no seat list, or the
 * name-only profile) instead of an answer with blanks in it.
 */
const word = z.string().trim().min(1);
const phone = z.string().regex(/^\d{3}-\d{3}-\d{4}$/);
const SeatShape = z.object({
  personId: z.string().regex(/^\d+$/).optional(),
  name: word,
  province: word,
  first: z.string().optional(),
  last: z.string().optional(),
  honorific: z.string().optional(),
  caucus: z.string().optional(),
}) satisfies z.ZodType<Seat>;
const OfficeShape = z.object({
  kind: z.enum(['hill', 'constituency']),
  label: z.string(),
  lines: z.array(word),
  phone: phone.optional(),
  fax: phone.optional(),
}) satisfies z.ZodType<Office>;
const MpShape = z.object({
  personId: z.string().regex(/^\d+$/),
  name: word,
  honorific: z.string().optional(),
  feminine: z.boolean().optional(),
  caucus: word.optional(),
  since: z.iso.date().optional(),
  roles: z.array(word),
  email: z.email().optional(),
  website: z.url().optional(),
  preferredLanguage: word.optional(),
  photo: z.string().startsWith('data:image/').optional(),
  profileUrl: z.url(),
  offices: z.array(OfficeShape).max(4),
}) satisfies z.ZodType<Mp>;

/** Fewer valid seats than this is not the House (343 seats): the list is treated as unreadable. */
const MIN_SEATS = 300;

const OC = { en: 'https://www.ourcommons.ca/Members/en', fr: 'https://www.noscommunes.ca/Members/fr' };

/** Every seat in the House, or null when the list can't be read (or doesn't look like the full House). */
export async function houseSeats(lang: Lang, signal?: AbortSignal): Promise<Seat[] | null> {
  const xml = await getText(`${OC[lang]}/constituencies/xml`, { revalidate: 3600, timeout: 5000, signal });
  const seats = [...xml.matchAll(/<Constituency>([\s\S]*?)<\/Constituency>/g)].map(([, c]) => ({
    personId: tag(c, 'PersonId') || undefined,
    name: tag(c, 'Name') ?? '',
    province: tag(c, 'ProvinceTerritoryName') ?? '',
    first: tag(c, 'CurrentPersonOfficialFirstName'),
    last: tag(c, 'CurrentPersonOfficialLastName'),
    honorific: tag(c, 'CurrentPersonShortHonorific'),
    caucus: tag(c, 'CurrentCaucusShortName'),
  }));
  const valid = seats.flatMap((seat) => {
    const checked = SeatShape.safeParse(seat);
    return checked.success ? [checked.data] : [];
  });
  if (valid.length < seats.length) console.warn(`[civic] ${seats.length - valid.length} House of Commons seats did not match the expected shape`);
  return valid.length < MIN_SEATS ? null : valid;
}

export const seatCounts = (seats: Seat[]) => {
  const sitting = seats.filter((s) => s.personId).length;
  return { seats: HOUSE.seats, sitting, vacant: HOUSE.seats - sitting };
};

const paragraphs = (html: string) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([, p]) => p);
const phoneOf = (text: string) => text.match(/(?:Telephone|Téléphone)\s*:\s*([\d-]{12})/)?.[1];
const faxOf = (text: string) => text.match(/(?:Fax|Télécopieur)\s*:\s*([\d-]{12})/)?.[1];

/** Hill and constituency offices from a member's profile page (at most four). */
function officesOf(html: string, lang: Lang): Office[] {
  const offices: Office[] = [];
  const hill = html.match(/<h4>(?:Hill Office|Bureau de la colline)<\/h4>([\s\S]*?)<\/div>/);
  if (hill) {
    const paras = paragraphs(hill[1]);
    const addr = (paras[0] ?? '')
      .split(/<br\s*\/?>/i)
      .map((l) => strip(l).replace(/\s*\*$/, '').replace(/,$/, ''))
      .filter((l) => l && !/^canada$/i.test(l));
    const rest = strip(paras.slice(1).join(' '));
    offices.push({ kind: 'hill', label: addr[0] ?? (lang === 'fr' ? 'Chambre des communes' : 'House of Commons'), lines: addr.slice(1), phone: phoneOf(rest), fax: faxOf(rest) });
  }
  for (const [, block] of html.matchAll(/class="ce-mip-contact-constituency-office[^"]*">([\s\S]*?)<\/div>/g)) {
    const paras = paragraphs(block);
    const addr = paras[0] ?? '';
    const rest = strip(paras.slice(1).join(' '));
    offices.push({
      kind: 'constituency',
      label: strip(addr.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? '').replace(/\s*-\s*/, ' – '),
      lines: addr
        .replace(/<strong>[\s\S]*?<\/strong>/, '')
        .split(/<br\s*\/?>/i)
        .map(strip)
        .filter(Boolean),
      phone: phoneOf(rest),
      fax: faxOf(rest),
    });
    if (offices.length >= 4) break;
  }
  return offices;
}

/**
 * Grammatical gender of the title on a member's French profile: "Députée" → true, "Député" → false, and
 * undefined for anything else (page unreadable, or a label we don't know), so nothing is guessed.
 */
function feminineTitle(htmlFr: string): boolean | undefined {
  const title = fold(decode(htmlFr.match(/<div class="ce-mip-roles">\s*<h4>([^<]+)<\/h4>/)?.[1] ?? '').trim());
  return title === 'deputee' ? true : title === 'depute' ? false : undefined;
}

/**
 * A member's own website, over https. The House of Commons lists many of them as http:// links: the same
 * address is upgraded when that host answers over https (any HTTP status counts, the connection is what
 * matters), and kept as listed when it doesn't. Undefined for anything that isn't a web address.
 */
async function secureUrl(listed: string, signal?: AbortSignal): Promise<string | undefined> {
  if (!URL.canParse(listed)) return undefined;
  const url = new URL(listed);
  if (url.protocol === 'https:') return url.href;
  if (url.protocol !== 'http:') return undefined;
  url.protocol = 'https:';
  url.port = '';
  const res = await fetchText(url.href, { revalidate: 604_800, timeout: 3000, signal, headers: UA });
  return res.ok || res.reason === 'http' ? url.href : listed;
}

/** A sitting member's profile, or null when the House of Commons record can't be read. */
export async function memberProfile(personId: string, lang: Lang, signal?: AbortSignal): Promise<Mp | null> {
  const call = { revalidate: 21_600, timeout: 4500, signal };
  // The French profile carries the gendered title ("Député" / "Députée"); English answers read it too, so a
  // French interface over English data still addresses the member correctly.
  const [xml, html, htmlFr] = await Promise.all([
    getText(`${OC[lang]}/${personId}/xml`, call),
    getText(`${OC[lang]}/${personId}`, call),
    lang === 'fr' ? null : getText(`${OC.fr}/${personId}`, call),
  ]);
  const role = xml.match(/<MemberOfParliamentRole>([\s\S]*?)<\/MemberOfParliamentRole>/)?.[1] ?? '';
  const name = [tag(role, 'PersonOfficialFirstName'), tag(role, 'PersonOfficialLastName')].filter(Boolean).join(' ');
  if (!name) return null;
  const roles = [...xml.matchAll(/<ParliamentaryPositionRole>([\s\S]*?)<\/ParliamentaryPositionRole>/g)]
    .map(([, r]) => r)
    .filter((r) => /<ToDateTime xsi:nil="true"\s*\/>/.test(r))
    .map((r) => tag(r, 'Title'))
    .filter((t): t is string => !!t)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  const website = html.match(/<h4>(?:Website|Site Web)<\/h4>\s*<p>\s*<a href="([^"]+)"/)?.[1];
  const prefLang = html.match(/<dt>(?:Preferred Language|Langue pr&#xE9;f&#xE9;r&#xE9;e|Langue préférée):<\/dt>\s*<dd>([^<]*)<\/dd>/i)?.[1];
  const photoPath = html.match(/src="(\/Content\/Parliamentarians\/Images\/OfficialMPPhotos\/[^"]+\.jpe?g)"/i)?.[1];
  const feminine = feminineTitle(htmlFr ?? html);
  // The path can carry entities and accents ("Fran&#xE7;ois"): decode, then percent-encode.
  const [photo, site] = await Promise.all([
    photoPath ? portrait(`https://www.ourcommons.ca${encodeURI(decode(photoPath))}`, signal) : undefined,
    website ? secureUrl(decode(website), signal) : undefined,
  ]);
  const profileUrl = mpProfileUrl(personId, lang);
  const offices = officesOf(html, lang);
  // Every member has an office on the Hill: a page that was read but shows none has changed its markup.
  if (html && !offices.length) console.warn(`[civic] House of Commons profile ${personId}: no offices found on the page`);
  const checked = MpShape.safeParse({
    personId,
    name,
    honorific: tag(role, 'PersonShortHonorific') || undefined,
    ...(feminine == null ? {} : { feminine }),
    caucus: tag(role, 'CaucusShortName') || undefined,
    since: tag(role, 'FromDateTime')?.slice(0, 10) || undefined,
    roles,
    email: html.match(/href="mailto:([^"]+@parl\.gc\.ca)"/i)?.[1],
    ...(site ? { website: site } : {}),
    ...(prefLang?.trim() ? { preferredLanguage: decode(prefLang).trim() } : {}),
    ...(photo ? { photo } : {}),
    profileUrl,
    offices,
  });
  if (checked.success) return checked.data;
  // The record no longer reads as expected: keep what is certain (who the member is) and send people to the profile.
  console.warn(`[civic] House of Commons profile ${personId} did not match the expected shape: ${checked.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  return { personId, name, roles: [], profileUrl, offices: [] };
}
