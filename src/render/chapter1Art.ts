// 챕터 1 그림: 기억 그림(액자)과 그 안의 장면, 액자 밖의 그 사람, 먹 바위, 공명 부표, 가시와 소용돌이
import { OBJ, S, view, type WorldObj } from '../world/state';
import { pos, toScreenX } from '../world/geometry';
import { ctx } from './canvas';
import { BRUSH } from './palette';
import { figure } from './figure';
import { footprints, meetScene, segno } from './chapter2Art';
import { otherScene } from './chapter5Art';
import { INK, INK_SOFT, PAPER } from './palette';

/** 그 사람의 색. 액자 밖에서만 보인다 (둘러본 사람만) */
const PINK = '#ff2a7f';
const ramp = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/** 기억 그림 액자가 걸린 높이 */
const frameBox = (o: WorldObj) => {
  const { W, H } = view;
  const w = (o.w ?? 0.9) * W, x = toScreenX(o.wx ?? 0) - w / 2;
  return { x, y: H * 0.135, w, h: H * 0.235 };
};

export function drawPainting(o: WorldObj) {
  if (o.hidden) return;
  const f = frameBox(o), { W } = view;
  if (f.x > W * 1.4 || f.x + f.w < -W * 0.4) return;
  const a = Math.min(1, o.vis);
  ctx.save();
  // 표구: 비단 테두리(옅은 쪽빛 회색) 안에 한지 그림, 위아래에 나무 축. 물 위에 뜬 그림자
  const m = 7;
  ctx.globalAlpha = 0.18 * a; ctx.fillStyle = INK; ctx.fillRect(f.x - m + 5, f.y - m + 7, f.w + m * 2, f.h + m * 2);
  ctx.globalAlpha = 0.92 * a; ctx.fillStyle = '#c9cbc6'; ctx.fillRect(f.x - m, f.y - m, f.w + m * 2, f.h + m * 2);
  ctx.globalAlpha = 0.25 * a; ctx.strokeStyle = '#8d918c'; ctx.lineWidth = 1;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(f.x - m, f.y - m + 2 + k * 1.5); ctx.lineTo(f.x + f.w + m, f.y - m + 2 + k * 1.5); ctx.stroke(); }
  ctx.globalAlpha = 0.95 * a; ctx.fillStyle = PAPER; ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(f.x, f.y, f.w, f.h);
  // 나무 축
  ctx.globalAlpha = a; ctx.fillStyle = '#3a2f24';
  ctx.fillRect(f.x - m - 6, f.y - m - 4, f.w + m * 2 + 12, 4); ctx.fillRect(f.x - m - 8, f.y + f.h + m, f.w + m * 2 + 16, 5);
  ctx.fillStyle = '#1e1913'; ctx.fillRect(f.x - m - 12, f.y + f.h + m - 1, 6, 7); ctx.fillRect(f.x + f.w + m + 6, f.y + f.h + m - 1, 6, 7);
  // 장면은 액자 안에만
  ctx.save(); ctx.beginPath(); ctx.rect(f.x + 6, f.y + 6, f.w - 12, f.h - 12); ctx.clip();
  ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.strokeStyle = INK;
  const P = (u: number, v: number) => [f.x + u * f.w, f.y + v * f.h] as const;
  if (o.other) otherScene(P, f, o.scene!, o.play);
  else if (o.scene === 'room') roomScene(P, f, o.play);
  else if (o.scene === 'stage') stageScene(P, f, o.play, o.gone);
  else if (o.scene === 'meet') meetScene(P, f, o.play);
  else rainScene(P, f);
  ctx.restore();
  // 첫 만남의 그림이 다 움직이고 나면 액자 모서리에 세뇨가 찍힌다
  if (o.scene === 'meet' && !o.other && o.play >= 1) segno(f.x + f.w - 22, f.y + 26, Math.min(1, a));
  ctx.restore(); ctx.globalAlpha = 1;
}

/**
 * 액자 밖의 그 사람: 둘러봐서 화면 안에 들어왔을 때만 서서히 보인다.
 * 1절의 '색이 빠진 세상' 처리 뒤에 따로 그려서, 그 사람의 핑크만은 색이 남는다 (둘러본 사람에게 주는 보상)
 */
export function drawPaintingEdges() {
  for (const o of OBJ) {
    if (o.kind !== 'painting' || o.hidden || !o.edge || o.gone || o.look < 0.01) continue;
    ctx.save(); edgeFigure(o, frameBox(o)); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

type PFn = (u: number, v: number) => readonly [number, number];
type Box = { x: number; y: number; w: number; h: number };

/** 밤의 방: 혼자 기타를 연습하는 아이. 액자 왼쪽 가장자리에서 담요를 든 팔이 들어왔다 물러난다 */
function roomScene(P: PFn, f: Box, p: number) {
  const s = f.h / 120;
  // 창문과 달, 바닥, 책상
  let [x, y] = P(0.72, 0.18); ctx.lineWidth = 2; ctx.strokeRect(x, y, f.w * 0.12, f.h * 0.32);
  ctx.beginPath(); ctx.moveTo(x + f.w * 0.06, y); ctx.lineTo(x + f.w * 0.06, y + f.h * 0.32); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + f.w * 0.09, y + f.h * 0.09, 5 * s, 0, Math.PI * 2); ctx.fill();
  [x, y] = P(0.05, 0.86); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.9, y); ctx.stroke();
  // 아이: 기타를 안고 앉아 있다. 담요를 내밀면 고개를 젓는다
  [x, y] = P(0.52, 0.86);
  const shake = p > 0.38 && p < 0.6 ? Math.sin(p * 120) * 3 : 0;
  ctx.save(); ctx.translate(x + shake * s, y); ctx.scale(1.15 * s, 1.15 * s); figure(); ctx.restore();
  // 팔: 평소엔 가장자리에서 조금 들어와 있고, 그림이 움직이면 담요를 내밀었다 물러난다
  const e = p <= 0 ? 0.25 : p < 0.35 ? 0.25 + 0.75 * ramp(p, 0.08, 0.35) : p < 0.6 ? 1 : 1 - 0.75 * ramp(p, 0.6, 0.85);
  [x, y] = P(0, 0.55);
  const hx = f.x + f.w * (0.02 + 0.16 * e), hy = y + f.h * 0.06;
  ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(f.x - 10, y); ctx.quadraticCurveTo(f.x + (hx - f.x) * 0.5, y - 6 * s, hx, hy); ctx.stroke();
  // 담요 (액자 안에서는 먹빛. 색은 액자 밖에서만 보인다)
  ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.ellipse(hx + 6 * s, hy + 4 * s, 9 * s, 6 * s, 0.3, 0, Math.PI * 2); ctx.fill();
}

/** 빈 무대: 혼자 연주하던 사람의 줄이 끊어지고 무너져 앉는다. 무대 옆 어둠 속에 누군가 서 있다 */
function stageScene(P: PFn, f: Box, p: number, gone: boolean) {
  const s = f.h / 120;
  // 텅 빈 객석
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 14; c++) {
    const [x, y] = P(0.08 + c * 0.065 + (r % 2) * 0.03, 0.82 + r * 0.06);
    ctx.beginPath(); ctx.arc(x, y, 4 * s, Math.PI, 0); ctx.stroke();
  }
  // 무대와 조명
  let [x, y] = P(0.1, 0.66); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.8, y); ctx.stroke();
  [x, y] = P(0.5, 0.02);
  ctx.save(); ctx.globalAlpha *= 0.12; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - f.w * 0.1, y + f.h * 0.64); ctx.lineTo(x + f.w * 0.1, y + f.h * 0.64); ctx.lineTo(x + 8, y); ctx.fill(); ctx.restore();
  // 연주하던 사람: 줄이 끊어지고 무너진다
  [x, y] = P(0.48, 0.66);
  const fall = ramp(p, 0.25, 0.55);
  ctx.save(); ctx.translate(x, y + fall * 6 * s); ctx.rotate(fall * 0.5); ctx.scale(1.15 * s, (1.15 - fall * 0.35) * s); figure(); ctx.restore();
  if (p > 0.15 && p < 0.6) {
    ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      const t = ramp(p, 0.15, 0.45), a0 = -0.4 - k * 0.35;
      ctx.beginPath(); ctx.moveTo(x + 20 * s, y - 14 * s);
      ctx.lineTo(x + 20 * s + Math.cos(a0) * 40 * t * s, y - 14 * s + Math.sin(a0) * 40 * t * s); ctx.stroke();
    }
  }
  // 무대 옆 어둠 속의 그림자 (손에 무엇을 들었는지는 액자 밖을 봐야 안다)
  if (!gone) {
    [x, y] = P(0.02, 0.66);
    ctx.save(); ctx.globalAlpha *= 0.55; ctx.beginPath(); ctx.ellipse(x, y - 34 * s, 10 * s, 34 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

/** 비: 우산 없이 혼자 걷는 사람. 액자 오른쪽 끝에서 우산 끝이 내밀어져 있다 */
function rainScene(P: PFn, f: Box) {
  const s = f.h / 120;
  ctx.lineWidth = 1; ctx.save(); ctx.globalAlpha *= 0.5;
  for (let k = 0; k < 60; k++) {
    const u = ((k * 0.137 + S.t * 0.25) % 1), v = ((k * 0.291 + S.t * 0.9) % 1);
    const [x, y] = P(u, v);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4 * s, y + 12 * s); ctx.stroke();
  }
  ctx.restore();
  let [x, y] = P(0.03, 0.84); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.94, y); ctx.stroke();
  // 걷는 사람: 고개를 숙이고 오른쪽으로
  const walk = (S.t * 0.04) % 1;
  [x, y] = P(0.15 + walk * 0.6, 0.84);
  const leg = Math.sin(S.t * 5) * 6 * s;
  ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x + leg, y); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x - leg, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 22 * s); ctx.lineTo(x + 2 * s, y - 46 * s); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 5 * s, y - 52 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  // 액자 오른쪽 끝에서 내밀어진 우산 끝
  [x, y] = P(1, 0.45);
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x - f.w * 0.05, y + f.h * 0.04); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4, y - 10 * s); ctx.quadraticCurveTo(x - f.w * 0.03, y - 18 * s, x - f.w * 0.05, y - 2 * s); ctx.lineTo(x + 4, y); ctx.fill();
}

/** 액자 밖에 서 있는 그 사람. 손에 든 것(담요·새 줄·우산)이 핫핑크로 보인다 */
function edgeFigure(o: WorldObj, f: Box) {
  const s = f.h / 120, left = o.edge === 'left';
  const x = left ? f.x - view.W * 0.09 : f.x + f.w + view.W * 0.09, y = f.y + f.h * 0.86;
  // 첫 만남: 사람 대신, 먼저 와서 기다리던 발자국
  if (o.scene === 'meet') { footprints(x, y, o.look); return; }
  ctx.save(); ctx.translate(x, y); if (!left) ctx.scale(-1, 1);
  ctx.globalAlpha = o.look * 0.7; ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT;
  // 서 있는 사람의 실루엣 (얼굴은 그리지 않는다)
  ctx.beginPath(); ctx.arc(0, -78 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9 * s, -66 * s); ctx.quadraticCurveTo(-14 * s, -30 * s, -8 * s, 0); ctx.lineTo(8 * s, 0); ctx.quadraticCurveTo(14 * s, -30 * s, 9 * s, -66 * s); ctx.fill();
  // 액자 쪽으로 뻗은 팔
  ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(6 * s, -56 * s); ctx.quadraticCurveTo(view.W * 0.04, -50 * s, view.W * 0.08, -44 * s); ctx.stroke();
  // 손에 든 것: 그 사람의 색
  ctx.globalAlpha = o.look; ctx.fillStyle = PINK; ctx.strokeStyle = PINK;
  const hx = view.W * 0.08, hy = -44 * s;
  if (o.scene === 'room') { ctx.beginPath(); ctx.ellipse(hx + 6 * s, hy + 6 * s, 14 * s, 9 * s, 0.3, 0, Math.PI * 2); ctx.fill(); }
  else if (o.scene === 'stage') { ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(hx, hy + 4 * s, (5 + k * 3) * s, 0, Math.PI * 2); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy - 30 * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx - 26 * s, hy - 28 * s); ctx.quadraticCurveTo(hx, hy - 52 * s, hx + 26 * s, hy - 28 * s); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** 길을 막는 먹 바위 */
export function drawRock(o: WorldObj) {
  if (o.gone) return;
  const p = pos(o);
  if (p.x < -100 || p.x > view.W + 100) return;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.globalAlpha = Math.max(0.6, o.vis); ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(-38, 8); ctx.lineTo(-30, -26); ctx.lineTo(-8, -46); ctx.lineTo(14, -38); ctx.lineTo(34, -18); ctx.lineTo(40, 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = PAPER; ctx.globalAlpha *= 0.35; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-14, -36); ctx.lineTo(-4, -10); ctx.moveTo(12, -30); ctx.lineTo(22, -8); ctx.stroke();
  ctx.globalAlpha = 0.2; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 10, 50, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
  // 길을 막은 바위: 바위에서 줄까지 점선. 이 자리에서 긁어야 파동이 바위에 닿는다
  if (S.rockGuide === o.id) {
    const pulse = 0.55 + 0.45 * Math.sin(S.t * 5), yEnd = view.H * 0.69;
    ctx.save(); ctx.strokeStyle = INK; ctx.globalAlpha = 0.5 + 0.3 * pulse; ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]); ctx.lineDashOffset = -S.t * 40;
    ctx.beginPath(); ctx.moveTo(p.x, p.y + 16); ctx.lineTo(p.x, yEnd); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(p.x - 10, yEnd - 12); ctx.lineTo(p.x, yEnd); ctx.lineTo(p.x + 10, yEnd - 12); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `26px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText('여기서 세게', p.x, yEnd - 22);
    ctx.restore(); ctx.globalAlpha = 1;
  }
}

/** 공명 부표: 자기 음(근음)이 울리면 떨고, 순서가 맞으면 불이 켜진다 */
export function drawBuoy(o: WorldObj) {
  if (o.hidden) return;
  const p = pos(o);
  if (p.x < -60 || p.x > view.W + 60) return;
  const shake = Math.sin(S.t * 40) * 4 * o.res;
  ctx.save(); ctx.translate(p.x + shake, p.y + Math.sin(S.t * 1.8 + p.x) * 2);
  ctx.globalAlpha = Math.max(0.55, o.vis); ctx.fillStyle = INK; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -18); ctx.quadraticCurveTo(0, -32, 7, -18); ctx.closePath(); ctx.fill();
  if (o.lit) {
    const g = ctx.createRadialGradient(0, -22, 1, 0, -22, 26);
    g.addColorStop(0, 'rgba(255,226,61,.9)'); g.addColorStop(1, 'rgba(255,226,61,0)');
    ctx.globalAlpha = 0.8; ctx.fillStyle = g; ctx.fillRect(-28, -48, 56, 52);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 첫 번째 가시: 조표의 ♭ 모양을 한 굵은 먹 가시. 둘레에 소용돌이 */
export function drawThorn(o: WorldObj) {
  if (o.hidden || o.gone) return;
  const p = pos(o);
  if (S.vortex > 0.01) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.strokeStyle = INK; ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const r = 40 + k * 26, a0 = S.t * (1.6 - k * 0.2) + k;
      ctx.globalAlpha = S.vortex * (0.45 - k * 0.07); ctx.lineWidth = 2.2 - k * 0.3;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.36, 0, a0, a0 + Math.PI * 1.2); ctx.stroke();
    }
    ctx.restore();
  }
  // 버티기 게이지: 가시 밑동을 감싸는 고리가 차오른다
  if (S.meter > 0.01 && S.dim < 0.05) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.18; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.85; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 24, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.meter); ctx.stroke();
    ctx.restore();
  }
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.globalAlpha = Math.max(0.75, o.vis); ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(-16, 6); ctx.quadraticCurveTo(-8, -50, 2, -118); ctx.quadraticCurveTo(6, -50, 16, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAPER; ctx.globalAlpha = 0.85; ctx.font = '28px "Gowun Batang",serif'; ctx.textAlign = 'center';
  ctx.fillText('♭', 1, -18);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 다 버틴 순간: 어두워진 세상 위로 가시만 핑크로 빛난다 (C로 뽑으라는 신호) */
export function drawThornGlow() {
  const o = OBJ.find(x => x.kind === 'thorn' && !x.hidden && !x.gone);
  if (!o || o.hidden || o.gone || S.dim < 0.02) return;
  const p = pos(o), pulse = 0.7 + 0.3 * Math.sin(S.t * 6);
  ctx.save(); ctx.translate(p.x, p.y);
  const g = ctx.createRadialGradient(0, -50, 4, 0, -50, 150);
  g.addColorStop(0, 'rgba(255,42,127,.55)'); g.addColorStop(1, 'rgba(255,42,127,0)');
  ctx.globalAlpha = S.dim * pulse * 1.6; ctx.fillStyle = g; ctx.fillRect(-150, -200, 300, 300);
  ctx.globalAlpha = Math.min(1, S.dim * 2); ctx.fillStyle = INK; ctx.strokeStyle = PINK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-16, 6); ctx.quadraticCurveTo(-8, -50, 2, -118); ctx.quadraticCurveTo(6, -50, 16, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAPER; ctx.font = '28px "Gowun Batang",serif'; ctx.textAlign = 'center'; ctx.fillText('♭', 1, -18);
  ctx.restore(); ctx.globalAlpha = 1;
}
