// 챕터 2 그림: 멈춘 빗방울, 빗방울 기둥, 하늘의 페르마타, 쏟아지는 비, 덮치는 노란 빗줄기, 우산 모양 막기, 첫 만남의 기억 그림
import { CHORDS } from '../data/chords';
import { DROPS_FROM, DROPS_TO } from '../data/chapter2';
import { S, fx, view, type WorldObj } from '../world/state';
import { boatScale, boatX, boatY, hz, pos, sb, toScreenX } from '../world/geometry';
import { grooveBeatPos } from '../world/rhythm';
import { seeded } from '../util/math';
import { ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, VOLT, reduceMotion } from './palette';

const PINK = '#ff2a7f';
const ramp = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/** 덮쳐 오는 노란 빗줄기 (장면이 채운다) */
export const guardWaves: { beat: number; blocked: boolean; hit: boolean }[] = [];

/** 멈춘 빗방울: 세계 좌표에 고정된 먹점들 */
const drops: { wx: number; ry: number; len: number }[] = [];
{
  const r = seeded(97);
  for (let i = 0; i < 420; i++) drops.push({ wx: DROPS_FROM + r() * (DROPS_TO - DROPS_FROM), ry: -0.25 + r() * 1.2, len: 4 + r() * 6 });
}

/** 하늘에 붓으로 그린 페르마타(𝄐) = 시간 정지 */
function fermata(x: number, y: number, s: number, a: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a; ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 10, 46, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -6, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** 멈춘 비 (멈춘 시간의 장면 전체) */
export function drawFrozenRain() {
  if (S.frozenVis < 0.01) return;
  const { W } = view, a = S.frozenVis;
  fermata(W * 0.8, view.H * 0.165, 0.7, 0.55 * a);
  ctx.save(); ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const d of drops) {
    const x = toScreenX(d.wx);
    if (x < -10 || x > W + 10) continue;
    const y = hz() + (sb() - hz()) * d.ry;
    // 가까이 퍼지는 파동(팜뮤트)이 지나가면 그 빗방울이 울린다 (밝게 번짐)
    let ring = 0;
    for (const r of fx.rip) {
      const dd = Math.hypot(x - toScreenX(r.wx), (y - r.y) / 0.36);
      const band = Math.abs(dd - r.r);
      if (band < 14) ring = Math.max(ring, (1 - band / 14) * (1 - r.r / r.max));
    }
    ctx.globalAlpha = a * (0.32 + 0.6 * ring); ctx.lineWidth = 1.2 + ring * 2;
    ctx.strokeStyle = ring > 0.2 ? VOLT : INK;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1, y + d.len); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 쏟아지는 비 (화면 전체에 비스듬히) */
export function drawFallingRain() {
  if (S.rainFall < 0.01) return;
  const { W, H } = view;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.28 * S.rainFall;
  for (let k = 0; k < 140; k++) {
    const u = (k * 0.1373 + S.t * 0.22) % 1, v = (k * 0.2917 + S.t * 1.6) % 1;
    const x = u * (W + 100) - 50, y = v * (H * 0.7);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 빗방울 기둥: 앞을 막고 있다가, 되받아 치면 녹아 흘러내린다 */
export function drawColumn(o: WorldObj) {
  if (o.hidden) return;
  const p = pos(o), top = hz() + 6, bot = sb() - 6;
  if (p.x < -80 || p.x > view.W + 80) return;
  const melt = o.gone ? Math.min(1, (o.play += 1 / 90)) : 0;
  if (melt >= 1) return;
  const seq = o.seq ?? [], n = seq.length;
  const r = seeded(o.id.charCodeAt(3) * 31);
  ctx.save(); ctx.lineCap = 'round';
  // 기둥 뒤의 옅은 먹 번짐 (기둥이 한눈에 기둥으로 읽히게)
  const g = ctx.createLinearGradient(p.x - 50, 0, p.x + 50, 0);
  g.addColorStop(0, 'rgba(23,20,15,0)'); g.addColorStop(0.5, 'rgba(23,20,15,.16)'); g.addColorStop(1, 'rgba(23,20,15,0)');
  ctx.globalAlpha = 1 - melt; ctx.fillStyle = g; ctx.fillRect(p.x - 50, top, 100, (bot - top) + melt * 200);
  for (let i = 0; i < 150; i++) {
    const dx = (r() - 0.5) * 80, v = r();
    const y = top + (bot - top) * v + melt * melt * 260 * (0.5 + r());
    // 기둥을 코드 수만큼 층으로 나누어, 들려주는/되받은 층이 빛난다
    const layer = Math.min(n - 1, Math.floor(v * n)), lit = layer < o.lit;
    ctx.globalAlpha = (1 - melt) * (lit ? 0.95 : 0.75);
    ctx.strokeStyle = lit ? VOLT : INK; ctx.lineWidth = lit ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(p.x + dx, y); ctx.lineTo(p.x + dx - 1, y + 8); ctx.stroke();
  }
  // 빛나는 층의 코드 글자 (미리보기와 같은 정보)
  if (!o.gone && o.lit > 0 && seq[o.lit - 1] && o.id === 'col0') {
    const layer = o.lit - 1, y = top + (bot - top) * ((layer + 0.5) / n);
    ctx.globalAlpha = 0.9; ctx.fillStyle = INK; ctx.font = `26px ${BRUSH}`; ctx.textAlign = 'center';
    ctx.fillText(CHORDS[seq[layer]].label, p.x + 54, y + 8);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 덮쳐 오는 노란 빗줄기: 박 두 개 전에 화면 오른쪽에서 출발해 박에 맞춰 배에 닿는다 */
export function drawGuardWaves() {
  if (!guardWaves.length || S.rainFall < 0.05) return;
  const g = grooveBeatPos(), tx = boatX() + 30, ty = boatY() - 40;
  for (const w of guardWaves) {
    if (w.blocked || w.hit) continue;
    const k = 1 - (w.beat - g) / 2;
    if (k < 0 || k > 1.15) continue;
    const x = tx + (view.W * 0.6) * (1 - k), y = ty - 60 * (1 - k);
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.min(1, k * 1.4);
    ctx.strokeStyle = VOLT; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.moveTo(-30 + j * 8, -40 + (j % 3) * 6); ctx.lineTo(-38 + j * 8, -10 + (j % 3) * 6); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.moveTo(-30 + j * 8, -40 + (j % 3) * 6); ctx.lineTo(-38 + j * 8, -10 + (j % 3) * 6); ctx.stroke(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** 막았을 때: 배 위에 펴지는 우산 모양 먹 번짐 (처음으로 받아들인 도움이 나를 지킨다) */
export function drawShield() {
  if (S.shield < 0.01) return;
  const s = boatScale(), x = boatX() - 40 * s, y = boatY() - 80 * s, r = 90 * s * (1.2 - S.shield * 0.2);
  ctx.save(); ctx.globalAlpha = S.shield * 0.8; ctx.strokeStyle = PINK; ctx.fillStyle = 'rgba(255,42,127,.12)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y + r * 0.5, r, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - r * 0.45); ctx.lineTo(x, y + r * 0.45); ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 첫 만남: 우산 없이 걷던 나에게 뒤에서 핑크 우산이 씌워진 순간. 그림이 움직이면 내가 고개를 든다 */
export function meetScene(P: (u: number, v: number) => readonly [number, number], f: { x: number; y: number; w: number; h: number }, p: number) {
  const s = f.h / 120;
  // 멈춘 비
  ctx.save(); ctx.globalAlpha *= 0.45; ctx.lineWidth = 1;
  for (let k = 0; k < 50; k++) { const [x, y] = P((k * 0.137) % 1, (k * 0.291) % 1); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * s, y + 9 * s); ctx.stroke(); }
  ctx.restore();
  let [x, y] = P(0.03, 0.84); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.94, y); ctx.stroke();
  // 나: 걷다 멈춘 사람. 그림이 움직이면 고개를 든다
  [x, y] = P(0.55, 0.84);
  const lift = ramp(p, 0.3, 0.7);
  ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x + 4 * s, y); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x - 4 * s, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x + 2 * s, y - 46 * s); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 5 * s - lift * 4 * s, y - 52 * s - lift * 3 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  // 뒤에서 씌워진 핑크 우산 (우산을 든 팔은 왼쪽에서 들어온다. 얼굴은 보이지 않는다)
  const ux = x - 4 * s, uy = y - 70 * s;
  ctx.save(); ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ux - 40 * s, uy + 8 * s); ctx.quadraticCurveTo(ux, uy - 30 * s, ux + 40 * s, uy + 8 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // 우산을 든 사람: 내 바로 뒤에 선 실루엣. 머리는 우산에 가려 얼굴이 보이지 않는다
  const bx = ux - 26 * s, by = y;
  ctx.save(); ctx.globalAlpha *= 0.55; ctx.fillStyle = INK_SOFT;
  ctx.beginPath(); ctx.moveTo(bx - 10 * s, by); ctx.quadraticCurveTo(bx - 14 * s, by - 40 * s, bx - 6 * s, by - 62 * s);
  ctx.lineTo(bx + 8 * s, by - 62 * s); ctx.quadraticCurveTo(bx + 14 * s, by - 40 * s, bx + 10 * s, by); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux - 8 * s, uy + 30 * s); ctx.stroke();
  ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(ux - 8 * s, uy + 30 * s); ctx.lineTo(bx + 4 * s, by - 50 * s); ctx.stroke();
  // 원곡 프리코러스 가사 한 줄이 희미하게 번진다
  const la = ramp(p, 0.45, 0.85);
  if (la > 0) {
    [x, y] = P(0.5, 0.97);
    ctx.save(); ctx.globalAlpha *= 0.65 * la; ctx.fillStyle = INK_SOFT; ctx.font = `${Math.round(22 * s)}px ${BRUSH}`; ctx.textAlign = 'center';
    ctx.fillText('그대를 만난 순간', x, y - 4 * s); ctx.restore();
  }
}

/** 액자 모서리에 찍히는 세뇨(𝄋): 챕터 5에서 이 순간으로 돌아온다 (D.S.) */
export function segno(x: number, y: number, a: number) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.strokeStyle = PINK; ctx.fillStyle = PINK; ctx.lineCap = 'round';
  ctx.lineWidth = 3; ctx.font = `34px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText('S', 0, 12);
  ctx.beginPath(); ctx.moveTo(-12, 14); ctx.lineTo(12, -14); ctx.stroke();
  ctx.beginPath(); ctx.arc(-11, -3, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, 3, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** 액자 밖: 먼저 와서 기다리던 발자국 (둘러본 사람만) */
export function footprints(x: number, y: number, look: number) {
  ctx.save(); ctx.globalAlpha = look * 0.75; ctx.fillStyle = INK_SOFT;
  for (let i = 0; i < 7; i++) {
    const px = x - 120 + i * 22, py = y - 6 + (i % 2) * 10;
    ctx.beginPath(); ctx.ellipse(px, py, 6, 3, 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PINK; ctx.globalAlpha = look * 0.9;
  ctx.beginPath(); ctx.arc(x + 40, y - 20, 4, 0, Math.PI * 2); ctx.fill(); // 우산 끝에서 떨어진 핑크 물방울
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 슬로모션: 세상이 차갑게 가라앉고 가장자리가 조여 든다 */
export function drawSlowmo() {
  if (S.slowmo < 0.01) return;
  const { W, H } = view, a = S.slowmo;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28 * a; ctx.fillStyle = '#7d8696';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(W / 2, H * 0.6, Math.min(W, H) * 0.25, W / 2, H * 0.6, Math.max(W, H) * 0.7);
  g.addColorStop(0, 'rgba(20,18,15,0)'); g.addColorStop(1, 'rgba(20,18,15,1)');
  ctx.globalAlpha = 0.35 * a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 무거운 피크: 화면에 그린 피크가 먹 잔상을 끌며 천천히 따라온다 */
const trail: { x: number; y: number }[] = [];
export function drawHeavyPick() {
  if (!S.heavy) { trail.length = 0; return; }
  trail.push({ x: S.hx, y: S.hy }); if (trail.length > 14) trail.shift();
  trail.forEach((p, i) => {
    const k = (i + 1) / trail.length;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.44); ctx.scale(1.6, 1.6);
    ctx.globalAlpha = k * (i === trail.length - 1 ? 1 : 0.18); ctx.fillStyle = INK; ctx.strokeStyle = '#eae6de'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-7, 6, -12, -2, -11, -8); ctx.bezierCurveTo(-10, -13, -4, -14, 0, -14);
    ctx.bezierCurveTo(4, -14, 10, -13, 11, -8); ctx.bezierCurveTo(12, -2, 7, 6, 0, 14); ctx.fill(); if (i === trail.length - 1) ctx.stroke();
    if (i === trail.length - 1) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(5, -8, 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

/** 시간이 원래대로 돌아오는 순간의 폭발: 배에서 핑크·노랑 고리와 하얀 빛이 퍼진다 */
export function drawBurst() {
  if (S.burst < 0.01) return;
  const { W, H } = view, e = 1 - S.burst, x = boatX(), y = boatY() - 30;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * (0.2 + 0.9 * e));
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,226,61,.35)'); g.addColorStop(1, 'rgba(255,42,127,0)');
  ctx.globalAlpha = S.burst * (reduceMotion ? 0.3 : 0.7); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [col, off, wd] of [[PINK, 0, 10], [VOLT, 0.12, 6], [INK, 0.22, 3]] as const) {
    const r = Math.max(W, H) * Math.max(0, e - off) * 1.1;
    ctx.globalAlpha = S.burst; ctx.strokeStyle = col; ctx.lineWidth = wd * S.burst + 1;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
