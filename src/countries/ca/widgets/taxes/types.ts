/** Tool output shapes for the `taxes` widget (what each tool in tools/taxes.ts returns). */
import type { ToolSource } from '@/lib/widgets/types';
import type { DeadlinesOutput } from './calc/deadlines';
import type { Estimate } from './calc/estimate';
import type { Complexity, FreeFilingOutput } from './calc/free-filing';
import type { RefundOutput } from './calc/refund';
import type { RoomOutput } from './calc/room';
import type { Lang, ProvinceCode } from './data';

type Sourced = { sources: ToolSource[]; lang: Lang };

export type DeadlinesFocus = 'file' | 'rrsp';
export type DeadlinesResult = DeadlinesOutput & Sourced & { focus: DeadlinesFocus };
export type DeadlinesInput = { selfEmployed?: boolean; focus?: DeadlinesFocus; lang?: Lang; timeZone?: string };

export type EstimatorResult = Sourced & { estimate: Estimate; provinceGiven: boolean; incomeGiven: boolean };
export type EstimatorInput = {
  province?: ProvinceCode;
  employmentIncome?: number;
  otherIncome?: number;
  rrspContribution?: number;
  fhsaContribution?: number;
  taxDeducted?: number;
  lang?: Lang;
};

export type RoomFocus = 'tfsa' | 'rrsp' | 'fhsa';
export type RoomResult = RoomOutput & Sourced & { focus: RoomFocus };
export type RoomInputArgs = {
  focus?: RoomFocus;
  birthYear?: number;
  age?: number;
  residentSince?: number;
  tfsaContributed?: number;
  earnedIncome?: number;
  fhsaOpenedYear?: number;
  fhsaContributed?: number;
  lang?: Lang;
};

export type FreeFilingResult = FreeFilingOutput & Sourced;
export type FreeFilingArgs = { province?: ProvinceCode; familySize?: number; familyIncome?: number; age65?: boolean; complex?: Complexity[]; lang?: Lang };

export type RefundResult = RefundOutput & Sourced & { methodGiven: boolean };
export type RefundArgs = { filedOn?: string; method?: 'online' | 'paper'; abroad?: boolean; onTime?: boolean; lang?: Lang; timeZone?: string };
