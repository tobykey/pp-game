// 큰 기믹의 '네 박': 한 마디의 네 박이 곧 네 번의 기회. 실패할 때마다 박 하나가 쉼표가 되고,
// 넷 다 쉼표가 되면 꿈이 되감겨 그 기믹의 처음으로 돌아간다 (기시감). 되감길수록 판정이 너그러워지고 안내가 붙는다
// 적용: 첫 가시의 버티기(1), F의 문 버티기(3), 격돌 ①(4), 마지막 관문(6) — Toby 결정 2026-10-22
import type { StepId } from '../data/steps';
import { audioOut } from '../audio/engine';
import { scratch, thump } from '../audio/kit';
import { ink } from '../ui/hud';
import { S } from '../world/state';
import { later } from '../world/timers';
import { reduceMotion } from '../render/palette';
import { go } from './director';

const retries: Partial<Record<StepId, number>> = {};
let trial: StepId | null = null, rewinding = false;

/** 기믹이 시작될 때: 네 박을 채운다. 되감겨 다시 온 거라면 도움 안내를 돌려준다 (없으면 null) */
export function startTrial(step: StepId, hints: string[] = []): string | null {
  trial = step; rewinding = false;
  S.lives = 4;
  const n = retries[step] ?? 0;
  S.assist = Math.min(3, n);
  if (n > 0) {
    // 기시감: 같은 장면을 본 적이 있다 → 도움 안내
    const hint = hints[Math.min(n, hints.length) - 1] ?? null;
    later(() => ink(hint ?? '…이 장면을, 본 적이 있다'), 600);
    return hint;
  }
  return null;
}

/** 기믹을 해냈을 때 (기회 표시를 거두고, 다음에 다시 와도 처음부터) */
export function endTrial() {
  if (trial) retries[trial] = 0;
  trial = null; S.lives = -1; S.assist = 0;
}

/** 실패 한 번: 박 하나가 쉼표가 된다. 넷 다 쉼표가 되면 꿈이 되감긴다. 되감기면 true */
export function fail(): boolean {
  if (!trial || rewinding || S.lives <= 0) return rewinding;
  S.lives--;
  const o = audioOut(); if (o) thump(o.ac.currentTime, 90, 40, 0.25, 0.5);
  if (!reduceMotion) S.shake = Math.max(S.shake, 4);
  if (S.lives > 0) return false;
  // 되감기: 먹이 거꾸로 빨려 들고, 기시감의 한 줄, 그리고 그 기믹의 처음으로
  rewinding = true;
  const step = trial;
  retries[step] = (retries[step] ?? 0) + 1;
  S.rewind = 1;
  if (o) scratch(o.ac.currentTime, 1.4);
  ink('…이 장면을, 본 적이 있다');
  later(() => { rewinding = false; go(step); }, 2000);
  return true;
}
export const isRewinding = () => rewinding;
