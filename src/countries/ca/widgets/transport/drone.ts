/**
 * Drone pilot certificate path: pure, isomorphic. Classifies the operation (Part IX of the Canadian Aviation
 * Regulations, as amended Nov 4, 2025) and lays out the steps with the fees the tool sent. Output: build.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './constants';
import type { DroneFeeKey } from './data';

export type DroneSize = 'micro' | 'small' | 'medium' | 'large';
export type DroneOp = 'standard' | 'near-people' | 'controlled-airspace' | 'bvlos' | 'event';
export type DroneCategory = 'micro' | 'basic' | 'advanced' | 'complex' | 'special';

export const SIZES: DroneSize[] = ['micro', 'small', 'medium', 'large'];
export const OPS: DroneOp[] = ['standard', 'near-people', 'controlled-airspace', 'bvlos', 'event'];
export const MIN_AGE: Record<DroneCategory, number | null> = { micro: null, basic: 14, advanced: 16, complex: 18, special: null };

export type DroneFees = Record<DroneFeeKey, number>;

export type DroneInput = { weightGrams?: number | null; size?: DroneSize | null; operation?: DroneOp | null; age?: number | null; lang?: Lang };

export type DroneOutput = {
  version: 1;
  lang: Lang;
  today: string;
  size: DroneSize;
  /** True when the person gave neither a weight nor a size (the widget asks). */
  sizeKnown: boolean;
  weightGrams: number | null;
  operation: DroneOp;
  age: number | null;
  fees: DroneFees;
  feesLive: boolean;
  links: {
    portal: string;
    schools: string;
    register: string;
    exam: string;
    recency: string;
    special: string;
    categories: string;
    micro: string;
    /** CAR sections with the age rules and their direct-supervision exceptions, per category. */
    car: { basic: string; advanced: string; complex: string };
    carOwner: string;
  };
  sources: ToolSource[];
};

export const sizeOf = (g: number): DroneSize => (g < 250 ? 'micro' : g <= 25_000 ? 'small' : g <= 150_000 ? 'medium' : 'large');

export function categoryOf(size: DroneSize, op: DroneOp): DroneCategory {
  if (op === 'event' || size === 'large') return 'special';
  if (size === 'micro') return 'micro';
  if (op === 'bvlos') return 'complex';
  if (size === 'medium' || op === 'near-people' || op === 'controlled-airspace') return 'advanced';
  return 'basic';
}

/**
 * Below the minimum age, CAR 901.54(2) / 901.63(2) still allow flying under the direct supervision of a pilot who may fly
 * that operation; for Level 1 Complex, 901.89(2) allows it only for training, supervised by someone 18 or older.
 */
export const tooYoungFor = (cat: DroneCategory, age: number | null | undefined) => {
  const min = MIN_AGE[cat];
  return age != null && min != null && age < min;
};

type StepKind =
  | 'young-register-owner'
  | 'young-supervisor'
  | 'young-fly'
  | 'young-later'
  | 'register' | 'exam-basic' | 'exam-advanced' | 'ground-school' | 'exam-complex' | 'review' | 'cert-basic' | 'cert-advanced' | 'cert-complex' | 'rpoc' | 'declaration' | 'sfoc' | 'micro-rules' | 'fly';
/** fee: a number (Transport Canada), 'included', 'provider' (set by a school or reviewer), or null (none). */
export type PathStep = { kind: StepKind; fee: number | 'included' | 'provider' | null };

export function dronePath(cat: DroneCategory, fees: DroneFees): PathStep[] {
  switch (cat) {
    case 'micro':
      return [{ kind: 'micro-rules', fee: null }];
    case 'special':
      return [{ kind: 'sfoc', fee: null }];
    case 'basic':
      return [
        { kind: 'register', fee: fees.registration },
        { kind: 'exam-basic', fee: fees.exam },
        { kind: 'cert-basic', fee: 'included' },
        { kind: 'fly', fee: null },
      ];
    case 'advanced':
      return [
        { kind: 'register', fee: fees.registration },
        { kind: 'exam-advanced', fee: fees.exam },
        { kind: 'review', fee: 'provider' },
        { kind: 'cert-advanced', fee: fees.advancedCert },
        { kind: 'declaration', fee: null },
        { kind: 'fly', fee: null },
      ];
    case 'complex':
      return [
        { kind: 'register', fee: fees.registration },
        { kind: 'exam-advanced', fee: fees.exam },
        { kind: 'ground-school', fee: 'provider' },
        { kind: 'exam-complex', fee: fees.complexExam },
        { kind: 'review', fee: 'provider' },
        { kind: 'cert-complex', fee: fees.complexCert },
        { kind: 'rpoc', fee: fees.rpoc },
        { kind: 'fly', fee: null },
      ];
  }
}

/**
 * Below the minimum age there's no certificate to get yet: the drone is registered (by an owner 14 or older, CAR 900.15),
 * a certified pilot supervises every flight (901.54(2), 901.63(2), 901.89(2)), and the exam waits for the birthday.
 */
export function youngPath(age: number, fees: DroneFees): PathStep[] {
  return [
    { kind: age < 14 ? 'young-register-owner' : 'register', fee: fees.registration },
    { kind: 'young-supervisor', fee: null },
    { kind: 'young-fly', fee: null },
    { kind: 'young-later', fee: null },
  ];
}

/** The date the fees in force on `date` took effect (fees are indexed every April 1). */
export function feesSince(date: string): string {
  const y = Number(date.slice(0, 4));
  return date.slice(5) >= '04-01' ? `${y}-04-01` : `${y - 1}-04-01`;
}

/** Sum of Transport Canada's own fees on the path (schools and reviewers set their own prices). */
export const govTotal = (steps: PathStep[]) => Math.round(steps.reduce((s, x) => s + (typeof x.fee === 'number' ? x.fee : 0), 0) * 100) / 100;
