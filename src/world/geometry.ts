// 화면 배치: 수평선, 바다, 배, 여섯 줄의 위치, 세계 좌표 ↔ 화면 좌표
import { S, view } from './state';
import type { WorldObj } from './state';

/** 수평선 y */
export const hz = () => view.H * 0.2;
/** 바다 아래 끝 y */
export const sb = () => view.H * 0.655;
export const boatY = () => hz() + (sb() - hz()) * 0.5;
/** 화면이 바라보는 세계 위치 = 배 위치 + 둘러본 만큼 */
export const camX = () => S.boat + S.look;
/** 배는 화면 가운데에 있고, 세상이 움직인다. 둘러보면 배도 화면에서 비켜난다 */
export const boatX = () => view.W * (0.5 - S.look);
/** 배 그림 크기 배율 */
export const boatScale = () => Math.min(1.15, Math.max(0.62, view.W / 900));

/** 세계 가로 위치(화면 너비 단위) → 화면 x */
export const toScreenX = (wx: number) => boatX() + (wx - S.boat) * view.W;
/** 화면 x → 세계 가로 위치 */
export const toWorldX = (x: number) => S.boat + (x - boatX()) / view.W;
/** 바다 높이 비율(0 수평선 ~ 1 바다 아래 끝) → 화면 y */
export const seaY = (ry: number) => hz() + (sb() - hz()) * ry;

/** 줄의 왼쪽·오른쪽 끝 x */
export const sx0 = () => Math.max(22, view.W * 0.05);
export const sx1 = () => view.W - Math.max(22, view.W * 0.05);

/** i번째 줄의 y (0 = 6번 줄, 5 = 1번 줄) */
export const stringY = (i: number) => {
  const top = view.H * 0.705, bot = view.H - Math.max(52, view.H * 0.075);
  return top + (bot - top) * i / 5;
};

/** 배 위에서 기타를 안은 '나'의 위치 (배 뒤쪽). 물그림자도 여기 아래에 생긴다 */
export const playerX = () => boatX() - 62 * boatScale();

export function pos(o: WorldObj) {
  if (o.kind === 'refl') return { x: playerX(), y: boatY() + 38 };
  if (o.rx != null) return { x: boatX() + (o.rx - 0.5) * view.W, y: seaY(o.ry ?? 0) };
  return { x: toScreenX(o.wx ?? 0), y: seaY(o.ry ?? 0) };
}
