// 그리기 부하 측정 (개발 서버에서 주소에 ?prof 를 붙였을 때만 켜진다)
// 구간마다 캔버스를 강제로 그려 내게 해서(getImageData), 각 구간이 실제로 몇 ms 걸리는지 모은다
import { ctx } from './canvas';

const ON = import.meta.env.DEV && location.search.includes('prof');
const sums: Record<string, number> = {};
let last = 0, frames = 0;

/** 한 프레임 그리기를 시작할 때 */
export function profStart() {
  if (!ON) return;
  ctx.getImageData(0, 0, 1, 1);
  last = performance.now(); frames++;
}
/** 지금까지 그린 구간에 이름을 붙여 시간을 더한다 */
export function mark(name: string) {
  if (!ON) return;
  ctx.getImageData(0, 0, 1, 1);
  const now = performance.now();
  sums[name] = (sums[name] ?? 0) + now - last;
  last = now;
}
/** 구간별 프레임당 평균 ms (큰 순서) */
export function profReport() {
  return Object.entries(sums).map(([k, v]) => [k, +(v / Math.max(1, frames)).toFixed(2)] as const).sort((a, b) => b[1] - a[1]);
}
export function profReset() { for (const k in sums) delete sums[k]; frames = 0; }
