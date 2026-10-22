// 챕터 4 그림: 갈라진 마른 바닥, 형광 물길(자유 솔로), 묻힌 것들, 폭풍 하늘과 갈필 바람, 물벽과 격돌 게이지, D.S. 표지
import { S, view, type WorldObj } from '../world/state';
import { boatScale, boatX, boatY, camX, hz, pos, sb, toScreenX } from '../world/geometry';
import { ctx } from './canvas';
import { makeDryArt } from './art/backdrops';
import { BRUSH, INK, INK_SOFT, PAPER, VOLT, reduceMotion } from './palette';

const PINK = '#ff2a7f';

/** 자유 솔로로 그린 물길 (세계 좌표). 장면이 채운다 */
export const trails: { wx: number; ry: number; len: number; w: number; col: string; t0: number; seed: number }[] = [];
/** 균열에 흐르는 글줄 (세계 좌표) */
export const crackTexts: { wx: number; ry: number; txt: string; t0: number }[] = [];

/** 같은 자리에 늘 같은 모양이 나오게 하는 작은 난수 */
function rnd(seed: number) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const ryToY = (ry: number) => hz() + (sb() - hz()) * ry;

/** 마른 바닥: 미리 그려 둔 갈라진 진흙(art/backdrops.ts)을 세계에 붙여 흐르게 한다 */
let dryArt: ReturnType<typeof makeDryArt> | null = null, dryKey = '';
export function drawDrySea() {
  if (S.dry < 0.01) return;
  const { W, H } = view, key = W + 'x' + H;
  if (!dryArt || key !== dryKey) { dryArt = makeDryArt(); dryKey = key; }
  const top = hz() + 2, off = ((-camX() * W) % dryArt.w + dryArt.w) % dryArt.w - dryArt.w;
  ctx.save(); ctx.globalAlpha = S.dry;
  for (let x = off; x < W; x += dryArt.w) ctx.drawImage(dryArt.img, x, top, dryArt.w, dryArt.h);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 형광 물길: 그은 직후엔 네온처럼 빛나고, 차츰 물빛(먹)으로 가라앉는다 */
export function drawTrails() {
  if (!trails.length) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const t of trails) {
    const x0 = toScreenX(t.wx), x1 = toScreenX(t.wx + t.len);
    if (x1 < -40 || x0 > view.W + 40) continue;
    const age = S.t - t.t0, grow = Math.min(1, age / 0.35), glow = Math.max(0, 1 - age / 2.5);
    const y0 = ryToY(t.ry), depth = 0.4 + 0.6 * t.ry;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x0, y0);
      const n = 8, xe = x0 + (x1 - x0) * grow;
      for (let j = 1; j <= n; j++) {
        const x = x0 + (xe - x0) * j / n, y = y0 + Math.sin(j * 1.7 + t.seed) * 7 * depth + (rnd(t.seed + j) - 0.5) * 6;
        ctx.lineTo(x, y);
      }
    };
    // 물이 스민 자리 (오래 남음)
    ctx.globalAlpha = 0.45; ctx.strokeStyle = '#6f7f8c'; ctx.lineWidth = (t.w + 3) * depth; path(); ctx.stroke();
    if (glow > 0) {
      ctx.globalAlpha = glow; ctx.strokeStyle = t.col; ctx.lineWidth = t.w * depth;
      if (!reduceMotion) { ctx.shadowColor = t.col; ctx.shadowBlur = 14 * glow; }
      path(); ctx.stroke(); ctx.shadowBlur = 0;
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 균열에 흐르는 먹글씨 한 줄 */
export function drawCrackTexts() {
  for (const c of crackTexts) {
    const x = toScreenX(c.wx), y = ryToY(c.ry), a = Math.min(1, (S.t - c.t0) / 1.5);
    if (x < -300 || x > view.W + 300) continue;
    ctx.save(); ctx.globalAlpha = 0.7 * a * Math.max(0.2, S.dry); ctx.fillStyle = INK;
    ctx.font = `${Math.round(26 * (0.6 + 0.6 * c.ry))}px ${BRUSH}`; ctx.textAlign = 'left';
    ctx.translate(x, y); ctx.rotate(-0.03); ctx.fillText(c.txt, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** 마른 바닥에 반쯤 묻힌 것들: 소나로 비춰야 보이고, 가는 줄로 비추면 이름까지 */
export function drawRelic(o: WorldObj) {
  if (o.hidden || o.vis < 0.02) return;
  const p = pos(o), s = 0.6 + 0.6 * (o.ry ?? 0.5);
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.globalAlpha = o.vis; ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  if (o.relic === 'score') {
    // 반쯤 묻힌 악보 두 장
    ctx.fillStyle = PAPER; ctx.save(); ctx.rotate(-0.25);
    ctx.fillRect(-34, -30, 52, 34); ctx.strokeRect(-34, -30, 52, 34);
    ctx.lineWidth = 0.8; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-30, -24 + i * 4); ctx.lineTo(14, -24 + i * 4); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-18, -18, 2.2, 0, Math.PI * 2); ctx.arc(-6, -14, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (o.relic === 'case') {
    // 기타 케이스: 뚜껑이 열리고 줄이 풀려 늘어짐
    ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-70, -22, -40, -24); ctx.lineTo(10, -16); ctx.quadraticCurveTo(30, -26, 46, -14); ctx.quadraticCurveTo(56, -2, 40, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK_SOFT; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 4, -18); ctx.bezierCurveTo(-30 + i * 6, 10, 10 + i * 5, -6, 30 + i * 4, 12); ctx.stroke(); }
  } else {
    // 깨진 피크 (커서의 피크와 같은 모양, 반으로 갈라짐)
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(-14, -16); ctx.quadraticCurveTo(-2, -22, 2, -14); ctx.lineTo(-2, 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.quadraticCurveTo(14, -20, 20, -12); ctx.lineTo(4, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(10, -10, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (o.label && o.detail > 0.5) {
    ctx.save(); ctx.globalAlpha = Math.min(1, (o.detail - 0.5) * 3) * o.vis; ctx.fillStyle = INK;
    ctx.font = `20px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText(o.label, p.x, p.y - 40 * s);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** D.S. 표지: 물 위에 세뇨와 함께 떠오른다 */
export function drawSign(o: WorldObj) {
  if (o.hidden || S.ds < 0.01) return;
  const p = pos(o), bob = Math.sin(S.t * 1.4) * 3;
  ctx.save(); ctx.translate(p.x, p.y + bob); ctx.globalAlpha = S.ds;
  const g = ctx.createRadialGradient(0, -30, 4, 0, -30, 120);
  g.addColorStop(0, 'rgba(255,226,61,.55)'); g.addColorStop(1, 'rgba(255,226,61,0)');
  ctx.fillStyle = g; ctx.fillRect(-120, -150, 240, 240);
  ctx.fillStyle = INK; ctx.font = `64px ${BRUSH}`; ctx.textAlign = 'center';
  ctx.fillText('D.S.', 0, -10);
  ctx.font = `46px "Gowun Batang",serif`; ctx.fillText('𝄋', 0, -70);
  // 물에 비친 그림자
  ctx.globalAlpha = S.ds * 0.25; ctx.scale(1, -0.4); ctx.font = `64px ${BRUSH}`; ctx.fillText('D.S.', 0, -30);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 폭풍: 하늘이 먹빛으로 가라앉고 갈필 바람이 비스듬히 휘몰아친다 */
export function drawStorm() {
  if (S.storm < 0.01) return;
  const { W, H } = view;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, hz() + 30);
  g.addColorStop(0, 'rgba(20,18,15,.75)'); g.addColorStop(1, 'rgba(20,18,15,.15)');
  ctx.globalAlpha = S.storm; ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz() + 30);
  // 갈필 바람: 비스듬한 마른 붓 자국
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  const speed = S.bpm / 130;
  for (let i = 0; i < 26; i++) {
    const ph = ((S.t * 0.35 * speed + rnd(i) ) % 1 + 1) % 1;
    const x = W * (1.1 - ph * 1.4) + rnd(i + 5) * 200, y = H * (0.05 + rnd(i + 9) * 0.6);
    ctx.globalAlpha = S.storm * (0.15 + 0.25 * rnd(i + 3));
    ctx.lineWidth = 1 + 2.5 * rnd(i + 7);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 60, y + 10, x - 160 - 80 * rnd(i), y + 34); ctx.stroke();
  }
  // 수평선의 물벽 (격돌 중이 아닐 때는 멀리)
  if (S.tug < 0) drawWall(W * 0.92, 0.35 * S.storm);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 물벽: x에 선 먹빛 파도 벽 */
function drawWall(x: number, k: number, a = 1) {
  const { H } = view, top = hz() - H * 0.28 * k - 20, base = sb() + 10;
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.4 + k) * a;
  ctx.fillStyle = 'rgba(23,20,15,.82)';
  ctx.beginPath(); ctx.moveTo(x, base);
  for (let i = 0; i <= 12; i++) {
    const y = base - (base - top) * (i / 12), wob = Math.sin(S.t * 3 + i * 0.9) * 10 + (i === 12 ? -30 : 0);
    ctx.lineTo(x - 40 * Math.sin(i / 12 * Math.PI) + wob, y);
  }
  ctx.quadraticCurveTo(x + 40, top - 40, x + 120, top + 20);
  ctx.lineTo(view.W + 60, top + 20); ctx.lineTo(view.W + 60, base); ctx.closePath(); ctx.fill();
  // 물마루의 흰 거품
  ctx.strokeStyle = PAPER; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const y = top + 20 + i * 26; ctx.globalAlpha = 0.5 * a; ctx.beginPath(); ctx.moveTo(x - 10 + Math.sin(S.t * 4 + i) * 8, y); ctx.lineTo(x + 50, y + 8); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 격돌: 물벽이 배 앞으로 다가온다 (게이지가 낮을수록 가깝다) */
export function drawClashWall() {
  if (S.wallA < 0.01) return;
  const { W } = view, s = boatScale();
  // 게이지가 낮을수록 물벽이 배에 가깝다. 위치·투명도 모두 부드럽게 (한 프레임에 크게 바뀌면 번쩍임처럼 보임)
  const near = boatX() + 150 * s, far = W * 0.95;
  drawWall(near + (far - near) * Math.max(0, Math.min(1, S.tugView)), 1, S.wallA);
}

/** 격돌 게이지: 화면 위 줄다리기 (화면 배율과 상관없이 고정) */
export function drawClashGauge() {
  if (S.tug < 0) return;
  const { W } = view;
  const gw = Math.min(560, W * 0.6), gx = (W - gw) / 2, gy = 178;
  ctx.save();
  ctx.fillStyle = INK; ctx.font = `28px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText('격돌', W / 2, gy - 12);
  ctx.fillStyle = 'rgba(23,20,15,.85)'; ctx.fillRect(gx, gy, gw, 18);
  ctx.fillStyle = PINK; ctx.fillRect(gx, gy, gw * S.tug, 18);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(gx, gy, gw, 18);
  // 경계의 불꽃
  ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(gx + gw * S.tug, gy + 9, 12 + 3 * Math.sin(S.t * 20), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = `18px ${BRUSH}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText('나', gx - 30, gy + 15);
  ctx.textAlign = 'right'; ctx.fillText('물벽', gx + gw + 46, gy + 15);
  ctx.restore();
}

/** 금이 어깨까지 (crack 3): 그 사람의 팔 위로 이어지는 금 (배 그림 좌표계에서 호출) */
export function crackToShoulder(hx: number, hy: number) {
  ctx.beginPath(); ctx.moveTo(hx + 30, hy + 2); ctx.lineTo(hx + 36, hy - 3); ctx.lineTo(hx + 42, hy - 1); ctx.lineTo(hx + 48, hy - 6); ctx.lineTo(hx + 54, hy - 4); ctx.stroke();
}

/** 배를 마른 바닥에 얹은 모습: 배 밑의 그림자 균열 */
export function drawGrounded() {
  if (S.dry < 0.3) return;
  const s = boatScale(), x = boatX(), y = boatY() + 18 * s;
  ctx.save(); ctx.globalAlpha = (S.dry - 0.3) * 0.8; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 22 * s, y); ctx.lineTo(x + i * 30 * s + 6, y + 14 * s); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
}
