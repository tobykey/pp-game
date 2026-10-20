// 모든 챕터의 장면을 한 줄로 이은 목록 (진행 순서 = 배열 순서)
import { STEPS0, STEP0_NAMES, type Step0Id } from './chapter0';
import { STEPS1, STEP1_NAMES, type Step1Id } from './chapter1';
import { STEPS2, STEP2_NAMES, type Step2Id } from './chapter2';
import { STEPS3, STEP3_NAMES, type Step3Id } from './chapter3';
import type { StepDef } from './defs';

export type StepId = Step0Id | Step1Id | Step2Id | Step3Id;

export const STEPS: StepDef<StepId>[] = [...STEPS0, ...STEPS1, ...STEPS2, ...STEPS3];
export const STEP_NAMES: Record<StepId, string> = { ...STEP0_NAMES, ...STEP1_NAMES, ...STEP2_NAMES, ...STEP3_NAMES };

/** a가 b보다 앞선 장면인지 */
export const before = (a: StepId, b: StepId) => STEPS.findIndex(s => s.id === a) < STEPS.findIndex(s => s.id === b);
