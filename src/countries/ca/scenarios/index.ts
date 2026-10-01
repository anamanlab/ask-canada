/**
 * Scripted scenario registry for the Canada pack. PRE-STUBBED: widget agents never edit this file.
 * `pnpm check:scenarios` verifies that every promoted question and follow-up chip resolves here.
 */
import type { Scenario } from '@/lib/scripted/types';
import general from './general';
import starters from './starters';
import { withTitles } from './titles';
import benefits from './benefits';
import passport from './passport';
import immigration from './immigration';
import citizenship from './citizenship';
import jobs from './jobs';
import taxes from './taxes';
import weather from './weather';
import travel from './travel';
import offices from './offices';
import lifeEvents from './life-events';
import dates from './dates';
import health from './health';
import parks from './parks';
import business from './business';
import documents from './documents';
import contact from './contact';
import civic from './civic';
import money from './money';
import veteransDefence from './veterans-defence';
import transport from './transport';

export const scenarios: Scenario[] = withTitles([
  ...benefits,
  ...passport,
  ...immigration,
  ...citizenship,
  ...jobs,
  ...taxes,
  ...weather,
  ...travel,
  ...offices,
  ...lifeEvents,
  ...dates,
  ...health,
  ...parks,
  ...business,
  ...documents,
  ...contact,
  ...civic,
  ...money,
  ...veteransDefence,
  ...transport,
  // Foundation-owned answers for every promoted question (low priority: widget scenarios win).
  ...starters,
  ...general,
]);
