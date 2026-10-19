// 오른손: 마우스/터치 드래그가 줄을 가로지르는 순간을 잡아 튕긴다.
// 한 방향으로 줄을 3개 이상 긁으면 '스트로크' 한 번 (= 노 한 번, 코드 한 번)
import { onPluck, onStroke, onSweep } from '../story/director';
import { pluck, dynFrom } from '../world/strum';
import { S } from '../world/state';
import { stringY, sx0, sx1 } from '../world/geometry';
import { BRUSH_CURSOR, PICK_CURSOR } from '../render/pick';

interface Ptr {
  x: number; y: number; t: number;
  /** 부드럽게 만든 긁는 속도 (px/ms) */
  v: number;
  /** 줄마다 마지막으로 튕긴 시각 (너무 빠른 중복 방지) */
  last: Record<number, number>;
  /** 지금 같은 방향으로 이어서 긁은 줄 수와 그 세기 합 */
  run: { dir: number; n: number; dyn: number; sent: boolean; t0: number };
}

let ptr: Ptr | null = null;
const inSpan = (x: number) => x >= sx0() - 6 && x <= sx1() + 6;

function hit(i: number, dyn: number, dir: number, x: number) {
  if (!ptr) return;
  pluck(i, dyn, dir, x);
  onPluck();
  const r = ptr.run;
  // 방향이 바뀌면 새 스트로크 시작 (손을 떼지 않고 위아래로 긁어도 매번 한 번씩)
  if (r.dir !== dir) { r.dir = dir; r.n = 0; r.dyn = 0; r.sent = false; }
  if (r.n === 0) r.t0 = performance.now();
  r.n++; r.dyn += dyn;
  // 여섯 줄을 한 방향으로 다 긁었을 때: 얼마나 천천히 긁었는지 (피크 스크래치)
  if (r.n === 6) onSweep({ dir, dur: (performance.now() - r.t0) / 1000 });
  if (r.n >= 3 && !r.sent) {
    r.sent = true;
    onStroke({ dir, dyn: r.dyn / r.n, chord: S.chord, x: ptr.x });
  }
}

export function bindPointer(cv: HTMLCanvasElement) {
  cv.addEventListener('pointerdown', e => {
    if (!S.started || S.paused || S.stringsVis < 0.3) return;
    cv.setPointerCapture(e.pointerId);
    // 누르고 긁는 동안에만 피크를 쥔다
    cv.style.cursor = PICK_CURSOR;
    ptr = { x: e.clientX, y: e.clientY, t: performance.now(), v: 0, last: {}, run: { dir: 0, n: 0, dyn: 0, sent: false, t0: 0 } };
    // 줄 바로 위를 누르면 그 줄 하나를 튕긴다
    for (let i = 0; i < 6; i++) {
      if (Math.abs(e.clientY - stringY(i)) < 7 && inSpan(e.clientX)) {
        ptr.last[i] = ptr.t;
        hit(i, 0.26, 1, e.clientX);
        break;
      }
    }
  });

  cv.addEventListener('pointermove', e => {
    if (!ptr) return;
    const now = performance.now(), x = e.clientX, y = e.clientY, dy = y - ptr.y, dt = Math.max(1, now - ptr.t);
    ptr.v = ptr.v * 0.55 + (Math.hypot(x - ptr.x, dy) / dt) * 0.45;
    if (dy !== 0) {
      const dir = dy > 0 ? 1 : -1, order = dir > 0 ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
      for (const i of order) {
        const sy = stringY(i);
        // 이전 위치와 지금 위치 사이에 줄이 있으면 가로지른 것
        if ((ptr.y < sy && y >= sy) || (ptr.y > sy && y <= sy)) {
          const cx = ptr.x + (x - ptr.x) * ((sy - ptr.y) / dy);
          if (!inSpan(cx)) continue;
          if (ptr.last[i] && now - ptr.last[i] < 45) continue;
          ptr.last[i] = now;
          hit(i, dynFrom(ptr.v), dir, cx);
        }
      }
    }
    ptr.x = x; ptr.y = y; ptr.t = now;
  });

  const endPtr = () => {
    ptr = null;
    if (S.started) cv.style.cursor = BRUSH_CURSOR;
  };
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
}
