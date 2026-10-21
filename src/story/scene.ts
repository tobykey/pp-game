// 챕터마다 똑같이 쓰는 장면 도구: 한 번만 하기(once), 잠시 뒤 다음 장면으로(goLater), 장면 경과 시간, 등록
// 각 챕터 파일은 sceneKit()을 하나씩 만들어 쓴다 (챕터끼리 상태가 섞이지 않게)
import type { StepId } from '../data/steps';
import { go, registerSteps, type StepHandler } from './director';

export function sceneKit() {
  /** 이 장면에서 이미 한 일 (장면에 들어올 때마다 비운다) */
  const done = new Set<string>();
  let pending: { at: number; to: StepId } | null = null;
  let el = 0;
  return {
    done,
    /** cond가 처음 참이 될 때 한 번만 */
    once(key: string, cond: boolean, fn: () => void) {
      if (cond && !done.has(key)) { done.add(key); fn(); }
    },
    /** at(장면 경과 시간) + delay초 뒤 다음 장면으로. 이미 예약돼 있으면 무시 */
    goLater(to: StepId, at: number, delay: number) { if (!pending) pending = { at: at + delay, to }; },
    /** 지금 장면에 들어온 뒤 지난 시간 (초) */
    el: () => el,
    /** 장면들을 등록한다: 들어올 때 기록을 비우고, 매 프레임 예약된 전환을 처리한다 */
    register(all: Partial<Record<StepId, StepHandler>>) {
      for (const h of Object.values(all) as StepHandler[]) {
        const enter = h.enter, update = h.update;
        h.enter = () => { done.clear(); pending = null; enter?.(); };
        h.update = (dt, t) => {
          el = t;
          update?.(dt, t);
          if (pending && t >= pending.at) { const to = pending.to; pending = null; go(to); }
        };
      }
      registerSteps(all);
    },
  };
}
