// 오른손: 마우스/터치 드래그가 줄을 가로지르는 순간을 잡아 튕긴다
import { evaluateStrum } from '../story/puzzle';
import { pluck, dynFrom } from '../world/strum';
import { S } from '../world/state';
import { stringY, sx0, sx1 } from '../world/geometry';

interface Ptr {
  x: number; y: number; t: number;
  /** 부드럽게 만든 긁는 속도 (px/ms) */
  v: number;
  /** 이번 드래그에서 튕긴 줄 수 */
  hits: number;
  /** 이번 드래그를 퍼즐 판정했는지 */
  done: boolean;
  /** 줄마다 마지막으로 튕긴 시각 (너무 빠른 중복 방지) */
  last: Record<number, number>;
}

let ptr: Ptr | null = null;
const inSpan = (x: number) => x >= sx0() - 6 && x <= sx1() + 6;

export function bindPointer(cv: HTMLCanvasElement) {
  cv.addEventListener('pointerdown', e => {
    if (!S.started) return;
    cv.setPointerCapture(e.pointerId);
    ptr = { x: e.clientX, y: e.clientY, t: performance.now(), v: 0, hits: 0, done: false, last: {} };
    // 줄 바로 위를 누르면 그 줄 하나를 튕긴다
    for (let i = 0; i < 6; i++) {
      if (Math.abs(e.clientY - stringY(i)) < 7 && inSpan(e.clientX)) {
        pluck(i, 0.26, 1, e.clientX); ptr.last[i] = ptr.t; ptr.hits++;
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
          ptr.last[i] = now; pluck(i, dynFrom(ptr.v), dir, cx); ptr.hits++;
        }
      }
    }
    ptr.x = x; ptr.y = y; ptr.t = now;
    if (ptr.hits >= 3 && !ptr.done) { ptr.done = true; evaluateStrum(); }
  });

  const endPtr = () => { ptr = null; };
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
}
