// 박 판정: 지금 친 것이 박에 맞았는지. 모든 장면이 같은 기준을 쓴다
import { BEAT_WINDOW } from '../data/chapter0';
import { nearestBeat, spb } from './rhythm';
import { S, fx } from './state';

export type Judge = 'perfect' | 'good' | 'miss';

/** 연속으로 놓친 횟수. 많이 놓칠수록 판정이 조금씩 너그러워진다 (도움 모드처럼, 화면엔 알리지 않음) */
let misses = 0;

/** record가 참이면 판정 먹 도장을 찍고 도움 계산에 반영한다 */
export function judgeBeat(record = true): { j: Judge; n: number; off: number } {
  const { n, off } = nearestBeat();
  const a = Math.abs(off);
  const base = Math.min(BEAT_WINDOW, spb() * 0.28);
  const win = base * (1 + Math.min(0.6, misses * 0.15));
  const j: Judge = a <= Math.min(0.06, win * 0.4) ? 'perfect' : a <= win ? 'good' : 'miss';
  if (record) {
    misses = j === 'miss' ? misses + 1 : 0;
    fx.marks.push({ kind: j, t: S.t });
    if (fx.marks.length > 6) fx.marks.shift();
  }
  return { j, n, off };
}
