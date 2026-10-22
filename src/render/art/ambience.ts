// 분위기: 하늘의 옅은 해(달), 가끔 하늘을 가로지르는 먹 새 (차분한 장면에서만), 물에 비친 배
import { S, view } from '../../world/state';
import { boatScale, boatX, boatY, hz } from '../../world/geometry';
import { drawHull } from './boatArt';

/** 하늘의 해(달): 아주 옅은 먹 동그라미에 번진 테두리. 산 뒤로 조금씩 흐른다 */
export function drawSun(ctx: CanvasRenderingContext2D, camPx: number) {
  const { W, H } = view;
  const x = W * 0.78 - ((camPx * 0.01) % (W * 1.6)), y = hz() - H * 0.1, r = Math.min(W, H) * 0.045;
  if (x < -r * 2) return;
  const storm = S.storm ?? 0;
  ctx.save(); ctx.globalAlpha = 0.5 * (1 - storm);
  const g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.8);
  g.addColorStop(0, 'rgba(23,20,15,.07)'); g.addColorStop(1, 'rgba(23,20,15,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
  ctx.fillStyle = 'rgba(244,240,232,.9)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(23,20,15,.18)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

/** 먹 새: 차분한 장면(템포가 느릴 때)에 가끔 두세 마리가 하늘을 건너간다 */
const flock: { x: number; y: number; v: number; ph: number; s: number }[] = [];
let nextFlock = 6;
export function drawBirds(ctx: CanvasRenderingContext2D, dt: number) {
  const { W, H } = view;
  const calm = S.started && S.bpm <= 70 && (S.storm ?? 0) < 0.1 && (S.dry ?? 0) < 0.5;
  nextFlock -= dt;
  if (calm && nextFlock <= 0 && !flock.length) {
    const n = 2 + Math.floor(Math.random() * 3), y0 = hz() - H * (0.05 + Math.random() * 0.08);
    for (let i = 0; i < n; i++) flock.push({ x: -30 - i * (18 + Math.random() * 14), y: y0 + (Math.random() - 0.5) * 18, v: 38 + Math.random() * 10, ph: Math.random() * 6, s: 0.8 + Math.random() * 0.4 });
    nextFlock = 18 + Math.random() * 20;
  }
  if (!flock.length) return;
  ctx.save(); ctx.strokeStyle = '#17140f'; ctx.lineCap = 'round'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
  for (const b of flock) {
    b.x += b.v * dt; b.ph += dt * 7;
    const f = Math.sin(b.ph) * 4 * b.s, w = 7 * b.s;
    ctx.beginPath(); ctx.moveTo(b.x - w, b.y - f * 0.6); ctx.quadraticCurveTo(b.x - w * 0.4, b.y - f - 1, b.x, b.y);
    ctx.quadraticCurveTo(b.x + w * 0.4, b.y - f - 1, b.x + w, b.y - f * 0.6); ctx.stroke();
  }
  ctx.restore();
  for (let i = flock.length - 1; i >= 0; i--) if (flock[i].x > W + 40) flock.splice(i, 1);
}

/** 물에 비친 배: 뒤집어 아주 옅게, 물결에 흔들리게 */
export function drawBoatReflection(ctx: CanvasRenderingContext2D) {
  if ((S.dry ?? 0) > 0.5) return;
  const s = boatScale(), x = boatX(), y = boatY() + 16 * s + Math.sin(S.t * 1.1) * 3;
  ctx.save(); ctx.translate(x + Math.sin(S.t * 2.3) * 1.5, y); ctx.scale(s, -0.45 * s); ctx.globalAlpha = 0.1;
  drawHull(ctx);
  ctx.restore(); ctx.globalAlpha = 1;
}
