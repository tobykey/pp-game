// 화면 배치: 수평선, 바다, 배, 여섯 줄의 위치
import { view } from './state';
import type { WorldObj } from './state';

/** 수평선 y */
export const hz = () => view.H * 0.2;
/** 바다 아래 끝 y */
export const sb = () => view.H * 0.655;
export const boatY = () => hz() + (sb() - hz()) * 0.5;

/** 줄의 왼쪽·오른쪽 끝 x */
export const sx0 = () => Math.max(22, view.W * 0.05);
export const sx1 = () => view.W - Math.max(22, view.W * 0.05);

/** i번째 줄의 y (0 = 6번 줄, 5 = 1번 줄) */
export const stringY = (i: number) => {
  const top = view.H * 0.705, bot = view.H - Math.max(52, view.H * 0.075);
  return top + (bot - top) * i / 5;
};

export function pos(o: WorldObj) {
  if (o.kind === 'refl') return { x: view.W / 2, y: boatY() + 38 };
  return { x: (o.rx ?? 0) * view.W, y: hz() + (sb() - hz()) * (o.ry ?? 0) };
}
