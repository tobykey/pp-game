// 게임 안의 시간으로 재는 예약: 일시정지(메뉴)하면 같이 멈춘다 (setTimeout은 실제 시간이라 멈추지 않는다)
// 슬로모션·히트스톱과 상관없이 실제로 흐른 시간만큼 간다 (세상이 느려져도 연출 박자는 그대로)
let clock = 0;
const queue: { at: number; fn: () => void }[] = [];

/** ms 뒤에 fn (setTimeout과 같은 모양) */
export function later(fn: () => void, ms = 0) { queue.push({ at: clock + ms / 1000, fn }); }

/** 매 프레임 (일시정지가 아닐 때만) */
export function tickTimers(dt: number) {
  clock += dt;
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].at <= clock) { const { fn } = queue[i]; queue.splice(i--, 1); fn(); }
  }
}
