// 챕터 5 그림: 그 사람 쪽에서 본 기억 그림, 보지 않을 때 다가오는 기억, 흩어진 획으로 맞추는 ♮,
// 여리게 비춰야 떠오르는 기억 테스트의 답, 붓글씨 질문, 쉼표(침묵), 고쳐 쓰는 문장, 물속의 ♭ 셋
import { NAT_LOOK, QUESTIONS, TEXT5, type AnswerPic } from '../data/chapter5';
import { CHORDS } from '../data/chords';
import type { PaintingScene } from '../data/defs';
import { S, view, type WorldObj } from '../world/state';
import { boatScale, boatX, boatY, hz, pos, sb, seaY, toScreenX } from '../world/geometry';
import { ctx } from './canvas';
import { figure } from './figure';
import { BRUSH, INK, INK_SOFT, PAPER, VOLT, reduceMotion } from './palette';

const PINK = '#ff2a7f';
const ramp = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
type PFn = (u: number, v: number) => readonly [number, number];
type Box = { x: number; y: number; w: number; h: number };

// ---------------------------------------------------------------- 그 사람 쪽에서 본 기억 그림
/** 서 있는 그 사람 (얼굴은 그리지 않는다). 손 위치를 돌려준다 */
function person(x: number, y: number, s: number, reach: number) {
  ctx.save(); ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT;
  ctx.beginPath(); ctx.arc(x, y - 78 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 66 * s); ctx.quadraticCurveTo(x - 14 * s, y - 30 * s, x - 8 * s, y); ctx.lineTo(x + 8 * s, y); ctx.quadraticCurveTo(x + 14 * s, y - 30 * s, x + 9 * s, y - 66 * s); ctx.fill();
  const hx = x + (12 + 40 * reach) * s, hy = y - (56 - 8 * reach) * s;
  ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 6 * s, y - 56 * s); ctx.quadraticCurveTo(x + 20 * s, y - 58 * s, hx, hy); ctx.stroke();
  ctx.restore();
  return [hx, hy] as const;
}
/** 액자 오른쪽 가장자리에 반쯤 잘린 '나' */
function meAtEdge(P: PFn, s: number, v: number, shake = 0, fallen = 0) {
  const [x, y] = P(0.97, v);
  ctx.save(); ctx.translate(x + shake * s, y); ctx.rotate(fallen * 0.5); ctx.scale(1.1 * s, 1.1 * s); ctx.fillStyle = INK; ctx.strokeStyle = INK; figure(); ctx.restore();
}
function rainLines(P: PFn, s: number, falling: boolean) {
  ctx.save(); ctx.globalAlpha *= 0.4; ctx.lineWidth = 1; ctx.strokeStyle = INK;
  for (let k = 0; k < 50; k++) {
    const u = falling ? (k * 0.137 + S.t * 0.25) % 1 : (k * 0.137) % 1, v = falling ? (k * 0.291 + S.t * 0.9) % 1 : (k * 0.291) % 1;
    const [x, y] = P(u, v); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * s, y + 10 * s); ctx.stroke();
  }
  ctx.restore();
}
function umbrella(x: number, y: number, s: number, col: string) {
  ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 36 * s, y + 8 * s); ctx.quadraticCurveTo(x, y - 28 * s, x + 36 * s, y + 8 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 30 * s); ctx.stroke();
  ctx.restore();
}

/**
 * 같은 기억을 그 사람 쪽에서 본 그림: 이번엔 액자 안에 그 사람(손에 든 것이 핫핑크로)이 있고,
 * 나는 액자 가장자리에 반쯤 잘려 있다. p = 그림이 움직인 정도
 */
export function otherScene(P: PFn, f: Box, scene: PaintingScene, p: number) {
  const s = f.h / 120;
  ctx.fillStyle = INK; ctx.strokeStyle = INK;
  let [x, y] = P(0.03, 0.84);
  if (scene === 'meet') {
    rainLines(P, s, false);
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.94, y); ctx.stroke();
    // 먼저 와서 기다리던 발자국이 그 사람에게로 이어진다
    ctx.save(); ctx.fillStyle = INK_SOFT; ctx.globalAlpha *= 0.7;
    for (let i = 0; i < 6; i++) { const [px, py] = P(0.05 + i * 0.05, 0.86 + (i % 2) * 0.03); ctx.beginPath(); ctx.ellipse(px, py, 5 * s, 2.5 * s, 0.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // 그 사람: 우산을 씌우기 전, 한 번 망설이는 손 (떨림) → 앞으로 내민다
    const go = ramp(p, 0.45, 0.85), hes = p > 0.15 && p < 0.45 && !reduceMotion ? Math.sin(S.t * 22) * 2 * s : 0;
    [x, y] = P(0.42, 0.84);
    const [hx, hy] = person(x, y, s, 0.3 + 0.7 * go);
    umbrella(hx + hes + go * f.w * 0.32, hy - 20 * s, s, PINK);
    meAtEdge(P, s, 0.84);
  } else if (scene === 'room') {
    let [wx, wy] = P(0.08, 0.16); ctx.lineWidth = 2; ctx.strokeRect(wx, wy, f.w * 0.1, f.h * 0.3);
    ctx.beginPath(); ctx.arc(wx + f.w * 0.05, wy + f.h * 0.08, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + f.h * 0.02); ctx.lineTo(x + f.w * 0.94, y + f.h * 0.02); ctx.stroke();
    // 그 사람: 담요를 내민다. 내가 고개를 저으면 천천히 거둔다
    const e = p <= 0 ? 0.4 : p < 0.35 ? 0.4 + 0.6 * ramp(p, 0.05, 0.35) : p < 0.6 ? 1 : 1 - 0.6 * ramp(p, 0.6, 0.9);
    [wx, wy] = P(0.45, 0.86);
    const [hx, hy] = person(wx, wy, s, e);
    ctx.save(); ctx.fillStyle = PINK; ctx.beginPath(); ctx.ellipse(hx + 10 * s, hy + 6 * s, 16 * s, 10 * s, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    meAtEdge(P, s, 0.86, p > 0.35 && p < 0.6 ? Math.sin(p * 120) * 3 : 0);
  } else if (scene === 'stage') {
    // 무대 옆 어둠 (그 사람이 서 있던 곳) — 오른쪽 끝 조명 아래에 무너진 내가
    ctx.save(); ctx.globalAlpha *= 0.18; ctx.fillRect(f.x, f.y, f.w * 0.55, f.h); ctx.restore();
    [x, y] = P(0.97, 0.02);
    ctx.save(); ctx.globalAlpha *= 0.14; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - f.w * 0.12, y + f.h * 0.66); ctx.lineTo(x + f.w * 0.08, y + f.h * 0.66); ctx.fill(); ctx.restore();
    [x, y] = P(0.03, 0.66); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.94, y); ctx.stroke();
    [x, y] = P(0.32, 0.66);
    const [hx, hy] = person(x, y, s, 0.5 + 0.5 * ramp(p, 0.2, 0.6));
    ctx.save(); ctx.strokeStyle = PINK; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(hx + 4 * s, hy + 4 * s, (5 + k * 3) * s, 0, Math.PI * 2); ctx.stroke(); } ctx.restore();
    meAtEdge(P, s, 0.66, 0, 1);
  } else {
    rainLines(P, s, true);
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.w * 0.94, y); ctx.stroke();
    // 그 사람: 비를 맞으며 뒤따라 걷는다. 우산은 내 쪽으로 내민 채
    const walk = (S.t * 0.03) % 0.1;
    [x, y] = P(0.4 + walk, 0.84);
    const [hx, hy] = person(x, y, s, 0.8);
    umbrella(hx + 18 * s, hy - 22 * s, s, PINK);
    meAtEdge(P, s, 0.84);
  }
}

// ---------------------------------------------------------------- 보지 않을 때 다가오는 기억
/** 바다 위에 둥둥 떠 있는 작은 기억 그림. 장면이 채운다 */
export const creepers: { scene: PaintingScene; wx: number; ry: number; gone: number }[] = [];

export function drawCreepers() {
  const { W, H } = view;
  for (const c of creepers) {
    if (c.gone >= 1) continue;
    const fw = W * 0.2, fh = H * 0.15, x = toScreenX(c.wx), y = seaY(c.ry) + Math.sin(S.t * 1.3 + c.wx * 7) * 4;
    if (x < -fw || x > W + fw) continue;
    const f = { x: x - fw / 2, y: y - fh / 2, w: fw, h: fh };
    ctx.save(); ctx.globalAlpha = 1 - c.gone;
    // 녹아들 때 핑크로 번진다
    if (c.gone > 0) { ctx.shadowColor = PINK; ctx.shadowBlur = 30 * c.gone; }
    ctx.fillStyle = PAPER; ctx.fillRect(f.x, f.y, f.w, f.h); ctx.shadowBlur = 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(f.x, f.y, f.w, f.h);
    ctx.save(); ctx.beginPath(); ctx.rect(f.x + 4, f.y + 4, f.w - 8, f.h - 8); ctx.clip();
    otherScene((u, v) => [f.x + u * f.w, f.y + v * f.h] as const, f, c.scene, 1);
    ctx.restore();
    // 물에 비친 그림자
    ctx.globalAlpha = 0.12 * (1 - c.gone); ctx.fillStyle = INK; ctx.fillRect(f.x + 6, f.y + f.h + 4, f.w - 12, 6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 시점 맞추기: 흩어진 획 → ♮
export const nat = { on: false, done: false, tDone: 0, wx: 0 };
const NAT_STROKES: [number, number, number, number][] = [[-24, -64, -24, 34], [24, -34, 24, 64], [-24, -12, 24, -28], [-24, 32, 24, 16]];
const NAT_SCATTER: [number, number, number][] = [[-1.3, -0.7, 1.2], [1.2, 0.9, -1.4], [0.4, -1.4, 2], [-0.6, 1.3, -1.8]];

export function drawNatural() {
  if (!nat.on && !(nat.done && S.t - nat.tDone < 2.6)) return;
  const cx = toScreenX(nat.wx), cy = hz() + (sb() - hz()) * 0.24;
  const err = nat.done ? 0 : S.look - NAT_LOOK, k = Math.min(1, Math.abs(err) / 0.45);
  const close = !nat.done && Math.abs(err) < 0.06;
  ctx.save(); ctx.lineCap = 'round';
  // 맞춰야 할 모양 (옅은 점선): 무엇을 만들지 처음부터 보인다
  if (!nat.done) {
    ctx.setLineDash([6, 8]); ctx.strokeStyle = INK; ctx.globalAlpha = 0.28; ctx.lineWidth = 3;
    for (const [x0, y0, x1, y1] of NAT_STROKES) { ctx.beginPath(); ctx.moveTo(cx + x0, cy + y0); ctx.lineTo(cx + x1, cy + y1); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  // 흩어진 획: 각도가 맞아 갈수록 서로 끌려가 겹친다
  NAT_STROKES.forEach(([x0, y0, x1, y1], i) => {
    const [dx, dy, rot] = NAT_SCATTER[i], off = 240 * k * Math.sign(err || 1);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    ctx.save(); ctx.translate(cx + mx + dx * off, cy + my + dy * Math.abs(off) * 0.3); ctx.rotate(rot * k);
    const dx0 = x0 - mx, dy0 = y0 - my, dx1 = x1 - mx, dy1 = y1 - my;
    const glow = nat.done ? Math.max(0, 1 - (S.t - nat.tDone) / 1.2) : 0;
    ctx.globalAlpha = nat.done ? Math.max(0, 1 - (S.t - nat.tDone - 1.6)) : 1;
    // 핑크 테두리 (이 획들을 움직일 수 있다는 신호)
    ctx.strokeStyle = close || glow > 0 ? VOLT : PINK; ctx.lineWidth = 22;
    if (glow > 0) { ctx.shadowColor = VOLT; ctx.shadowBlur = 30 * glow; }
    ctx.beginPath(); ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy1); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy1); ctx.stroke();
    ctx.restore();
  });
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 물그림자에 두 사람
/** ♮을 얻은 뒤 물그림자에 비치는 두 번째 사람 (draw.ts의 물그림자에서 부른다) */
export function secondReflection() {
  ctx.save(); ctx.translate(120, 0); ctx.scale(-1, 1); figure(); ctx.restore();
}

// ---------------------------------------------------------------- 기억 테스트
export const test5 = {
  /** 지금 질문 (−1 = 없음) */
  q: -1, t0: 0,
  /** 이 질문의 기억 그림 액자 밖을 둘러봤는지 (답 그림이 또렷한지) */
  clear: false,
  picked: -1, result: '' as '' | 'right' | 'blank', resultT: 0,
  end: '' as '' | 'thanks' | 'okay', endT: 0,
  missed: [] as number[],
  /** 질문마다 정답이 놓인 자리 */
  slot: 0,
};

function drawPic(pic: AnswerPic, x: number, y: number, clear: boolean) {
  ctx.save(); ctx.translate(x, y);
  const col = (c: string) => clear ? c : '#9a958c';
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  switch (pic.kind) {
    case 'blanket':
      ctx.fillStyle = col(pic.color); ctx.beginPath(); ctx.moveTo(-26, -14); ctx.quadraticCurveTo(0, -24, 26, -12); ctx.lineTo(22, 16); ctx.quadraticCurveTo(0, 8, -24, 18); ctx.closePath(); ctx.fill(); if (clear) ctx.stroke();
      break;
    case 'umbrella':
      umbrella(0, -4, 0.85, col(pic.color));
      break;
    case 'coil':
      ctx.strokeStyle = col(PINK); ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, 8 + k * 6, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'flower':
      ctx.fillStyle = col('#e9a23b'); for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * 1.26) * 10, Math.sin(k * 1.26) * 10 - 6, 7, 5, k * 1.26, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = col('#4c7a3a'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 24); ctx.stroke();
      break;
    case 'ticket':
      ctx.fillStyle = col('#d8c9a5'); ctx.fillRect(-22, -12, 44, 24); if (clear) { ctx.strokeRect(-22, -12, 44, 24); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(8, 12); ctx.stroke(); ctx.setLineDash([]); }
      break;
    case 'pick':
      ctx.fillStyle = col('#4a6fa5'); ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(0, -22, 14, -14); ctx.quadraticCurveTo(10, 4, 0, 20); ctx.quadraticCurveTo(-10, 4, -14, -14); ctx.fill();
      break;
    case 'prints':
      ctx.fillStyle = col(INK_SOFT); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-24 + i * 11, 6 - (i % 2) * 8, 4, 2.5, 0.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = col(PINK); ctx.beginPath(); ctx.arc(26, -10, 4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'walker':
      ctx.fillStyle = col(INK); ctx.scale(0.9, 0.9); ctx.translate(-14, 22); figure();
      break;
    case 'road':
      ctx.strokeStyle = col(INK_SOFT); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, 12); ctx.lineTo(28, 12); ctx.stroke();
      break;
    case 'puddle':
      ctx.fillStyle = col('#7d93a8'); ctx.beginPath(); ctx.ellipse(0, 8, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
      break;
  }
  // 본 적 없는 기억: 안개가 덮여 윤곽만 (흐림 필터는 너무 무거워서 한지 빛 안개 + 가로 붓 자국으로)
  if (!clear) {
    ctx.globalAlpha *= 0.62; ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(154,149,140,.7)'; ctx.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-26, k * 9); ctx.quadraticCurveTo(0, k * 9 - 4, 26, k * 9 + 1); ctx.stroke(); }
  }
  ctx.restore();
}

/** 답 하나: 안개 속에 잠겨 있다가 여리게 비추면 떠오른다. 아래에 고르는 코드 */
export function drawAnswer(o: WorldObj) {
  if (o.hidden || test5.q < 0 || test5.end) return;
  const i = +o.id.slice(3), p = pos(o), q = QUESTIONS[test5.q];
  const pic = q.answers[(i - test5.slot + 4) % 4];
  // 안개 덩어리: 무언가 잠겨 있다는 신호 (늘 보임)
  ctx.save();
  const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 64);
  g.addColorStop(0, 'rgba(120,114,104,.35)'); g.addColorStop(1, 'rgba(120,114,104,0)');
  ctx.fillStyle = g; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(S.t * 1.5 + i); ctx.fillRect(p.x - 64, p.y - 64, 128, 128);
  const v = Math.min(1, o.vis * 1.4);
  if (v > 0.02) {
    ctx.globalAlpha = v;
    const picked = test5.picked === i;
    ctx.fillStyle = PAPER; ctx.strokeStyle = picked && test5.result === 'right' ? PINK : INK; ctx.lineWidth = picked ? 5 : 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawPic(pic, p.x, p.y, test5.clear);
    ctx.font = `28px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillStyle = INK;
    ctx.fillText(CHORDS[o.chord!].label, p.x, p.y + 72);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 그 사람이 손끝으로 물 위에 쓰는 질문 (화면의 모든 안내와 같은 붓글씨) */
export function drawQuestion() {
  const { W } = view;
  ctx.save(); ctx.textAlign = 'center';
  if (test5.q >= 0 && !test5.end) {
    const txt = QUESTIONS[test5.q].text, n = Math.min(txt.length, Math.floor((S.t - test5.t0) / 0.09));
    const shown = txt.slice(0, n), y = seaY(0.88);
    const tremble = test5.result === 'blank' && !reduceMotion ? Math.sin(S.t * 40) * 2 : 0;
    const fade = test5.result ? Math.max(0.25, 1 - (S.t - test5.resultT) / 2) : 1;
    ctx.font = `${Math.round(Math.min(40, W / 22))}px ${BRUSH}`; ctx.fillStyle = INK; ctx.globalAlpha = fade;
    ctx.shadowColor = 'rgba(234,230,222,1)'; ctx.shadowBlur = 10;
    ctx.fillText(shown, W / 2 + tremble, y);
    // 답 그림이 흐릿한 까닭을 알려 준다 (그 기억의 액자 밖을 보지 않았다)
    if (!test5.clear && n >= txt.length) {
      ctx.font = `${Math.round(Math.min(24, W / 36))}px ${BRUSH}`; ctx.fillStyle = INK_SOFT; ctx.globalAlpha = 0.85 * fade;
      ctx.fillText(TEXT5.testBlur, W / 2, y + 36);
    }
    // 글을 쓰는 손끝 (핫핑크 점)
    if (n < txt.length) {
      const full = ctx.measureText(txt).width, part = ctx.measureText(shown).width;
      ctx.shadowBlur = 0; ctx.fillStyle = PINK; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(W / 2 - full / 2 + part + 4, y - 8, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (test5.end) {
    const a = Math.min(1, (S.t - test5.endT) / 1.2), y = seaY(0.86);
    ctx.globalAlpha = a; ctx.font = `${Math.round(Math.min(64, W / 13))}px ${BRUSH}`; ctx.fillStyle = INK;
    ctx.fillText(test5.end === 'thanks' ? TEXT5.testThanks : TEXT5.testOkay, W / 2, y);
    // 답하지 못한 것들이 이제야 또렷하게 보인다
    if (test5.end === 'okay') {
      test5.missed.forEach((qi, j) => {
        const k = ramp(S.t - test5.endT, 1.5 + j * 0.9, 2.3 + j * 0.9);
        if (k <= 0) return;
        const x = W / 2 + (j - (test5.missed.length - 1) / 2) * 110, yy = hz() + (sb() - hz()) * 0.16;
        ctx.globalAlpha = k; ctx.fillStyle = PAPER; ctx.strokeStyle = PINK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, yy, 40, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        drawPic(QUESTIONS[qi].answers[0], x, yy, true);
      });
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 쉼표 (침묵)
/** 붓으로 그린 4분쉼표 𝄽 모양 */
function restPath() {
  ctx.beginPath();
  ctx.moveTo(-10, -70); ctx.lineTo(16, -36); ctx.quadraticCurveTo(-10, -20, -6, -6); ctx.lineTo(18, 22);
  ctx.quadraticCurveTo(-14, 10, -12, 34); ctx.quadraticCurveTo(-10, 52, 4, 60);
}
export function drawRest() {
  if (S.rest < 0) return;
  const { W, H } = view, x = W * 0.74, y = H * 0.34;
  const cracked = S.t - S.restCrackT < 0.7;
  // 여섯 줄이 회색으로 가라앉는다 (긁지 말라는 신호)
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = PAPER; ctx.fillRect(0, H * 0.68, W, H * 0.32); ctx.restore();
  ctx.save(); ctx.translate(x + (cracked && !reduceMotion ? Math.sin(S.t * 60) * 4 : 0), y);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 빈 쉼표 (윤곽)
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.22; ctx.lineWidth = 16; restPath(); ctx.stroke();
  // 차오른 만큼 먹으로 (아래에서 위로)
  ctx.save(); ctx.beginPath(); ctx.rect(-60, 64 - 140 * S.rest, 120, 140 * S.rest); ctx.clip();
  ctx.globalAlpha = 1; ctx.lineWidth = 16; restPath(); ctx.stroke(); ctx.restore();
  // 남은 박: 점 여덟 개가 하나씩 찬다
  ctx.globalAlpha = 1;
  for (let i = 0; i < 8; i++) { const px = -42 + i * 12, filled = i < Math.round(S.rest * 8); ctx.beginPath(); ctx.arc(px, 88, 4, 0, Math.PI * 2); if (filled) { ctx.fillStyle = INK; ctx.fill(); } else { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); } }
  ctx.strokeStyle = INK;
  // 다 차면 형광 테두리
  if (S.rest >= 1) { ctx.globalAlpha = 0.9; ctx.strokeStyle = VOLT; ctx.lineWidth = 4; restPath(); ctx.stroke(); }
  // 긁으면 금 가며 깨진다
  if (cracked) {
    const k = 1 - (S.t - S.restCrackT) / 0.7;
    ctx.globalAlpha = k; ctx.strokeStyle = PINK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-30, -40); ctx.lineTo(-4, -10); ctx.lineTo(-18, 6); ctx.lineTo(10, 30); ctx.lineTo(-6, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(24, -20); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 진실: 속삭임, 물속의 ♭ 셋
export const truth = { whisperT: -1 };
export function drawTruth() {
  if (truth.whisperT < 0) return;
  const a = Math.min(1, (S.t - truth.whisperT) / 2);
  ctx.save(); ctx.globalAlpha = a * 0.85; ctx.fillStyle = INK_SOFT; ctx.textAlign = 'center';
  ctx.font = `${Math.round(Math.min(34, view.W / 18))}px ${BRUSH}`;
  ctx.fillText(TEXT5.whisper, boatX(), boatY() + 70 * boatScale());
  ctx.restore(); ctx.globalAlpha = 1;
}
/** 뱃머리 아래 물속에 가라앉아 빛나는 ♭ 셋 (내가 뽑은 가시를 그 사람이 삼켜 왔다) */
export function drawSunk() {
  if (S.sunk < 0.01) return;
  const s = boatScale();
  ctx.save(); ctx.font = `30px "Gowun Batang",serif`; ctx.textAlign = 'center';
  ['E', 'A', 'D'].forEach((_, i) => {
    const x = boatX() + (52 + i * 22) * s, y = boatY() + (34 + i * 9) * s + Math.sin(S.t * 1.2 + i) * 3;
    ctx.globalAlpha = S.sunk * (0.6 + 0.3 * Math.sin(S.t * 2 + i));
    ctx.shadowColor = PINK; ctx.shadowBlur = 16; ctx.fillStyle = PINK; ctx.fillText('♭', x, y);
  });
  ctx.restore(); ctx.globalAlpha = 1;
}
/** 자리가 바뀐 뒤: 기타를 안고 앉은 그 사람 (배 그림 좌표계에서 호출). 금이 온몸에 */
export function personWithGuitar() {
  ctx.save(); ctx.translate(60, -6); ctx.scale(-1, 1); ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT; figure();
  if (S.crack > 3) {
    ctx.strokeStyle = 'rgba(234,230,222,.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(10, -38); ctx.lineTo(14, -30); ctx.lineTo(11, -22); ctx.lineTo(16, -12); ctx.lineTo(12, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -26); ctx.lineTo(22, -18); ctx.lineTo(20, -8); ctx.stroke();
  }
  ctx.restore();
}
/** 자리가 바뀐 뒤: 배 뒤쪽에 누운 나 */
export function meLying() {
  ctx.save(); ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(-98, -11, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-70, -8, 26, 6, 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- 붓글씨 문장 바꾸기
export const rewrite = {
  on: false, t0: 0,
  /** 바꿀 단어가 떨리며 번지는 순간 */
  pulseT: -9,
  /** 여리게 비춰 단어가 풀린 정도 */
  loosen: 0,
  /** 새 단어가 찍힌 순간 (−1 = 아직) */
  stampT: -1,
};
/**
 * 문장을 쓰기 전에, 그 사람의 손끝이 게임 내내 보아 온 안내들을 같은 자리에 차례로 다시 쓴다.
 * 뱃머리의 손에서 글 쓰는 손끝까지 핑크 실이 이어져, 안내를 써 온 게 누구였는지 알아보게 한다
 */
const PRE = ['줄을 긁어 보세요', '박동에 맞춰, 아래로 · 위로', '가시 뽑기'];
const PRE_CHAR = 0.07, PRE_HOLD = 0.75, MAIN_CHAR = 0.14;
const preDur = (l: string) => l.length * PRE_CHAR + PRE_HOLD;
const PRE_TOTAL = PRE.reduce((a, l) => a + preDur(l), 0);
/** 그 사람이 문장을 다 썼는지 */
export const rewriteWritten = () => S.t - rewrite.t0 > PRE_TOTAL + '나를 잊어 줘'.length * MAIN_CHAR + 0.6;
/** 뱃머리 그 사람의 손 → 글 쓰는 손끝까지 핑크 실 */
function thread(tx: number, ty: number) {
  const s = boatScale(), hx = boatX() + 42 * s, hy = boatY() - 16 * s;
  ctx.save(); ctx.strokeStyle = PINK; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.7; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + tx) / 2, Math.max(hy, ty) + 40, tx, ty); ctx.stroke();
  ctx.fillStyle = PINK; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
export function drawRewrite() {
  if (!rewrite.on) return;
  const { W } = view, y = seaY(0.88), size = Math.round(Math.min(60, W / 14));
  ctx.save(); ctx.font = `${size}px ${BRUSH}`; ctx.textBaseline = 'alphabetic';
  // 1) 지난 안내들을 같은 손글씨로 다시 쓴다
  let e = S.t - rewrite.t0;
  if (e < PRE_TOTAL) {
    for (const line of PRE) {
      const d = preDur(line);
      if (e < d) {
        const n = Math.min(line.length, Math.floor(e / PRE_CHAR)), part = line.slice(0, n);
        const fade = e > d - 0.25 ? (d - e) / 0.25 : 1, x0 = W / 2 - ctx.measureText(line).width / 2;
        ctx.globalAlpha = fade; ctx.fillStyle = INK; ctx.shadowColor = 'rgba(234,230,222,1)'; ctx.shadowBlur = 10;
        ctx.fillText(part, x0, y);
        thread(x0 + ctx.measureText(part).width + 5, y - size * 0.3);
        break;
      }
      e -= d;
    }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  const stamped = rewrite.stampT >= 0;
  const head = '나를 ', tail = ' 줘', word = stamped ? TEXT5.rewriteNew : TEXT5.rewriteWord;
  const wHead = ctx.measureText(head).width, wWord = ctx.measureText(word).width, wTail = ctx.measureText(tail).width;
  const x0 = W / 2 - (wHead + wWord + wTail) / 2;
  // 그 사람의 손끝이 쓰는 중 (처음 한 번: 이 글씨가 그 사람의 것)
  const full = head + TEXT5.rewriteWord + tail, n = Math.min(full.length, Math.floor((S.t - rewrite.t0 - PRE_TOTAL) / MAIN_CHAR));
  ctx.fillStyle = INK; ctx.shadowColor = 'rgba(234,230,222,1)'; ctx.shadowBlur = 10;
  if (n < full.length && !stamped) {
    const part = full.slice(0, n); ctx.fillText(part, x0, y);
    thread(x0 + ctx.measureText(part).width + 5, y - size * 0.3);
    ctx.restore(); return;
  }
  ctx.fillText(head, x0, y); ctx.fillText(tail, x0 + wHead + wWord, y);
  const wx = x0 + wHead;
  if (!stamped) {
    // 바꿀 수 있는 단어: 떨리며 핑크로 번진다
    const pulse = Math.max(0, 1 - (S.t - rewrite.pulseT) / 0.8), idle = 0.35 + 0.25 * Math.sin(S.t * 3);
    const shake = !reduceMotion ? Math.sin(S.t * 30) * (1.5 + 3 * pulse) : 0;
    [...word].forEach((ch, i) => {
      const cw = ctx.measureText(word.slice(0, i)).width;
      const drift = rewrite.loosen * (i % 2 ? -1 : 1) * 18, rise = -rewrite.loosen * (10 + i * 8);
      ctx.save(); ctx.globalAlpha = 1 - 0.7 * rewrite.loosen;
      ctx.shadowColor = PINK; ctx.shadowBlur = 12 * Math.max(idle, pulse);
      ctx.fillStyle = pulse > 0.3 ? PINK : INK;
      ctx.translate(wx + cw + shake + drift, y + rise); ctx.rotate(rewrite.loosen * (i ? 0.3 : -0.3)); ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    // 단어가 풀리면 새 단어 후보가 떠오른다 (고르는 코드와 함께)
    if (rewrite.loosen >= 1) {
      const k = 0.85 + 0.15 * Math.sin(S.t * 4);
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = INK; ctx.font = `${Math.round(size * 0.8)}px ${BRUSH}`; ctx.textAlign = 'center';
      const cy = y - size * 1.15;
      ctx.shadowColor = VOLT; ctx.shadowBlur = 16; ctx.fillText(TEXT5.rewriteNew, wx + wWord / 2, cy);
      ctx.shadowBlur = 0; ctx.font = `24px ${BRUSH}`; ctx.textAlign = 'left'; ctx.fillStyle = PINK; ctx.fillText(`← ${CHORDS.Db.label} 로 쓰기`, wx + wWord / 2 + size * 1.3, cy);
      ctx.restore();
    }
  } else {
    // 새 단어가 낙관처럼 쾅 찍힌다
    const e = S.t - rewrite.stampT, sc = 1 + 0.8 * Math.exp(-e * 8);
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - e * 1.2) * 0.85; ctx.fillStyle = PINK;
    ctx.fillRect(wx - 10, y - size - 6, wWord + 20, size + 18); ctx.restore();
    ctx.save(); ctx.translate(wx + wWord / 2, y - size * 0.35); ctx.scale(sc, sc); ctx.textAlign = 'center';
    ctx.fillStyle = INK; ctx.fillText(word, 0, size * 0.35); ctx.restore();
    // 원곡 훅 가사가 이어서 번진다
    const la = ramp(e, 1.4, 3);
    if (la > 0) { ctx.globalAlpha = la * 0.8; ctx.font = `${Math.round(size * 0.55)}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillStyle = INK_SOFT; ctx.fillText(TEXT5.lyric, W / 2, y + size * 0.9); }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
