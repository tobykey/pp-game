// 컷신: 게임 화면 위에 한지 판이 덮이고 그 안에서 짧은 장면이 흐른다 (가시 뽑기, 가시를 받는 손)
// 무슨 일이 벌어졌는지 플레이어가 정확히 알아보게 하려는 것. 번쩍임 없이 번지고 걷힌다
import { view } from '../world/state';
import { backdrop, ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, MONO, PAPER, VOLT, reduceMotion } from './palette';
import { rand } from '../util/math';
import { figure } from './figure';

const PINK = '#ff2a7f';

export interface ThornCut {
  /** 뽑는 코드 (예: 'C') */
  chord: string;
  /** 빠지는 음 (예: 'E♭') → 되돌아간 음 (예: 'E') */
  from: string; to: string;
  /** 뽑힌 ♭을 그 사람의 손이 받는 장면까지 (챕터 3부터) */
  hand: boolean;
}

// 장면 시간표 (초)
// 박힌 ♭을 충분히 보여 주고(~0.9초), ♮이 박힌 채 버티다가(~0.7초), 천천히 솟구쳐 사라진다(~1.3초)
const IN = 0.35, SLAM = 0.9, YANK = 1.6, OUT_GONE = 2.9;
/** ♮이 내리꽂히는 순간 (장면이 이때 코드 소리를 낸다) */
export const CUT_SLAM_MS = SLAM * 1000;
const HAND0 = 3.4, HAND_DUR = 3.0;
const FADE = 0.45;

/** 진실 컷신: 꿈 바깥의 머리맡 (잠든 나, 기타를 치는 그 사람) */
const TRUTH_DUR = 8.5;

type Cut = (ThornCut & { kind: 'thorn' } | { kind: 'truth' }) & { t: number; end: number };
let cut: Cut | null = null;
let drops: { x: number; y: number; vx: number; vy: number; r: number; c: string }[] = [];
let onEnd: (() => void) | null = null;

/** 가시 뽑기 컷신을 시작한다. 끝나면 done을 부른다 */
export function playThornCut(c: ThornCut, done?: () => void) {
  cut = { ...c, kind: 'thorn', t: 0, end: c.hand ? HAND0 + HAND_DUR + FADE : OUT_GONE + 1.4 + FADE };
  drops = []; onEnd = done ?? null;
  document.body.classList.add('cutting');
}
/** 진실 컷신: 화면 가득 꿈 바깥의 머리맡을 보여 준다 */
export function playTruthCut(done?: () => void) {
  // 끝까지 다 보여 준 뒤 클릭해야 넘어간다 (미리 넘겨 버리지 않게)
  cut = { kind: 'truth', t: 0, end: Infinity };
  drops = []; onEnd = done ?? null;
  document.body.classList.add('cutting');
}
export const cutActive = () => cut !== null;
/** 0.8초가 지나면 클릭으로 건너뛸 수 있다 */
export function skipCut() {
  if (!cut) return;
  if (cut.kind === 'truth') { if (cut.t >= TRUTH_DUR) cut.end = cut.t + FADE; return; }
  if (cut.t > 0.8) cut.t = Math.max(cut.t, cut.end - FADE);
}

export function tickCut(dt: number) {
  if (!cut) return;
  const before = cut.t;
  cut.t += dt;
  // ♮이 박히는 순간과 ♭이 뽑히는 순간에 먹물이 튄다
  const { W, H } = view, px = W * 0.5, py = H * 0.6;
  if (cut.kind === 'thorn' && before < SLAM && cut.t >= SLAM) for (let i = 0; i < 40; i++) { const a = rand(-Math.PI, 0), v = rand(200, 700); drops.push({ x: px, y: py - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(3, 9), c: i % 4 ? INK : VOLT }); }
  if (cut.kind === 'thorn' && before < YANK && cut.t >= YANK) for (let i = 0; i < 50; i++) { const a = rand(-Math.PI * 0.9, -Math.PI * 0.1), v = rand(250, 900); drops.push({ x: px + rand(-40, 40), y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 8), c: i % 3 ? INK : PINK }); }
  for (const d of drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 1400 * dt; d.vx *= 0.98; }
  drops = drops.filter(d => d.y < H + 40);
  if (cut.t >= cut.end) { cut = null; document.body.classList.remove('cutting'); const f = onEnd; onEnd = null; f?.(); }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);

export function drawCut() {
  if (!cut) return;
  const { W, H } = view, t = cut.t;
  const alpha = t < IN ? t / IN : t > cut.end - FADE ? (cut.end - t) / FADE : 1;
  // 뒤의 게임 화면은 어둡게 가라앉는다
  ctx.save();
  ctx.globalAlpha = 0.6 * clamp01(alpha); ctx.fillStyle = '#0b0a08'; ctx.fillRect(0, 0, W, H);
  // 한지 판이 가운데에서 좌우로 펼쳐진다
  const m = Math.min(W, H) * 0.035, pw = (W - m * 2) * easeOut(t / IN), ph = H - m * 2;
  const x0 = (W - pw) / 2, y0 = m;
  ctx.globalAlpha = clamp01(alpha);
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.save(); ctx.clip();
  if (backdrop.paper) ctx.drawImage(backdrop.paper, 0, 0, W, H); else { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); }
  if (cut.kind === 'truth') {
    drawBedside(t);
    // 다 보여 준 뒤: 클릭해서 넘기기
    if (t >= TRUTH_DUR && cut.end === Infinity) {
      ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 3); ctx.fillStyle = INK; ctx.font = `20px ${BRUSH}`; ctx.textAlign = 'center';
      ctx.fillText('클릭하면 넘어갑니다', W / 2, H * 0.92); ctx.restore();
    }
  }
  else if (t < HAND0 || !cut.hand) drawPull(t, cut); else drawHand(t - HAND0);
  for (const d of drops) { ctx.fillStyle = d.c; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 1.6, d.r, Math.atan2(d.vy, d.vx), 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  // 판 테두리: 붓으로 그은 먹 선
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.strokeRect(x0, y0, pw, ph);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 가시 모양의 ♭: 위가 뾰족한 줄기 + 둥근 배 */
function flatThorn(x: number, y: number, s: number, rot: number, glow: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (glow > 0) { ctx.shadowColor = PINK; ctx.shadowBlur = 40 * glow; }
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(13, 60); ctx.lineTo(-13, 60); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 22;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(40, -25, 92, -10, 70, 25); ctx.bezierCurveTo(52, 52, 18, 62, 0, 62); ctx.stroke();
  ctx.restore();
}
/** ♮ */
function natural(x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.08);
  ctx.lineCap = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-28, -95); ctx.lineTo(-28, 45);
    ctx.moveTo(28, -45); ctx.lineTo(28, 95);
    ctx.moveTo(-28, -18); ctx.lineTo(28, -38);
    ctx.moveTo(-28, 42); ctx.lineTo(28, 22);
  };
  ctx.strokeStyle = INK; ctx.lineWidth = 30; path(); ctx.stroke();
  ctx.strokeStyle = VOLT; ctx.lineWidth = 17; path(); ctx.stroke();
  ctx.restore();
}
function brushText(txt: string, x: number, y: number, size: number, fill: string, stroke: number) {
  ctx.font = `${size}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}

/** 1컷: 물에 박힌 ♭ → 코드의 ♮이 내리꽂힘 → ♭이 뽑혀 날아간다 */
function drawPull(t: number, c: ThornCut) {
  const { W, H } = view, cx = W * 0.5, wy = H * 0.62, sc = Math.min(W, H) / 800 * 1.6;
  // 물: 가로로 그은 먹 물결
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = wy + i * 18 + 6, a = 0.55 - i * 0.05;
    ctx.globalAlpha = Math.max(0.08, a); ctx.lineWidth = 3 - i * 0.2;
    ctx.beginPath(); ctx.moveTo(W * 0.06 + (i % 2) * 40, y); ctx.quadraticCurveTo(cx, y - 6 + Math.sin(t * 3 + i) * 4, W * 0.94 - (i % 3) * 30, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // ♭: 박혀서 떨다가(SLAM 전), 뽑혀 위로 솟구쳐 화면 밖으로
  let fx = cx, fy = wy - 20, rot = 0, s = sc;
  const shake = !reduceMotion && t < YANK ? Math.sin(t * 60) * (t > SLAM ? 6 : 2) : 0;
  if (t >= YANK) {
    const k = (t - YANK) / (OUT_GONE - YANK);
    fy = wy - 20 - k * k * H * 1.1; fx = cx + k * W * 0.25; rot = k * 2.4; s = sc * (1 + 0.3 * k);
    // 솟구치는 속도선
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const ox = (i - 4) * 18; ctx.globalAlpha = 0.5 * (1 - k); ctx.beginPath(); ctx.moveTo(fx + ox, fy + 160 * s / sc); ctx.lineTo(fx + ox - k * 40, fy + (260 + i * 22) * s / sc); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (t < OUT_GONE + 0.2) {
    // 물 아래로 잠긴 부분은 옅게
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, wy); ctx.clip();
    flatThorn(fx + shake, fy, s, rot, t < YANK ? 1 : 0.6);
    ctx.restore();
    if (t < YANK) { ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.rect(0, wy, W, H); ctx.clip(); flatThorn(fx + shake, fy, s, rot, 0); ctx.restore(); }
  }
  // 위쪽: 빠지는 음 이름
  ctx.globalAlpha = t < YANK ? 1 : clamp01(1 - (t - YANK) * 2);
  brushText(c.from, cx, H * 0.14, 46, INK, 0);
  ctx.globalAlpha = 1;
  // 코드와 ♮이 위에서 내리꽂힌다
  if (t > SLAM - 0.18) {
    const k = easeOut((t - (SLAM - 0.18)) / 0.18);
    const ny = lerp(-H * 0.2, wy - 120 * sc, k);
    if (t < YANK + 0.5) natural(cx - 150 * sc, ny + (t > SLAM && !reduceMotion ? Math.sin(t * 50) * 3 * clamp01(YANK - t + 0.3) : 0), sc * 0.95);
    brushText(c.chord, W * 0.2, lerp(-H * 0.2, H * 0.3, k), Math.round(170 * sc / 1.6), VOLT, 10);
  }
  // 뽑힌 뒤: 큰 글씨로 결과
  if (t > OUT_GONE - 0.35) {
    const k = easeOut((t - OUT_GONE + 0.35) / 0.35);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, H * 0.34); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k);
    brushText('가시 뽑기 성공', 0, 0, Math.round(Math.min(110, W / 9)), PINK, 9);
    ctx.font = `600 22px ${MONO}`; ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.fillText(`${c.from}  →  ${c.to}`, 0, 76);
    ctx.restore();
  }
}

/** 2컷: 떨어지는 ♭을 손이 받는다. 잠든 줄 알았던 그 사람의 손. 손목에 금 */
function drawHand(t: number) {
  const { W, H } = view, sc = Math.min(W, H) / 800 * 1.5;
  const cx = W * 0.5, cy = H * 0.6;
  // 아주 천천히 다가가는 카메라
  const z = 1 + 0.06 * (t / HAND_DUR);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
  // 옅은 먹 번짐 배경
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(W, H) * 0.6);
  g.addColorStop(0, 'rgba(23,20,15,0)'); g.addColorStop(1, 'rgba(23,20,15,.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 손이 오므라드는 정도: ♭이 닿은 뒤 천천히
  const land = 0.9, curl = 0.85 * easeOut((t - land - 0.25) / 1.5);
  hand(cx, cy, sc, Math.max(0, curl), t);
  // ♭이 위에서 떨어져 손바닥에 닿는다
  const fk = clamp01(t / land);
  const fy = lerp(-H * 0.15, cy - 20 * sc, fk * fk);
  const bounce = t > land ? Math.sin((t - land) * 9) * Math.exp(-(t - land) * 5) * 10 : 0;
  flatThorn(cx - 6 * sc, fy - bounce, sc * 0.42, 0.5 - fk * 0.4, 0.7);
  // 손가락이 ♭ 위로 덮이도록 다시 그린다
  if (curl > 0.2) fingers(cx, cy, sc, curl, true);
  ctx.restore();
}

// 손 모양 (손바닥이 위, 오른쪽 아래에서 팔이 들어온다)
const FINGERS = [
  { a: -2.35, len: 105, w: 26 },
  { a: -2.0, len: 122, w: 28 },
  { a: -1.7, len: 116, w: 27 },
  { a: -1.42, len: 96, w: 24 },
];
function hand(cx: number, cy: number, s: number, curl: number, t: number) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const skin = '#efe9dd';
  // 팔
  ctx.fillStyle = skin; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(30, 40); ctx.quadraticCurveTo(160, 120, 360, 330); ctx.lineTo(260, 380); ctx.quadraticCurveTo(110, 170, -20, 85); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 손목에서 팔로 번지는 금 (복선 12)
  const crackK = clamp01((t - 1.2) / 1.2);
  if (crackK > 0) {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    const pts = [[20, 66], [48, 80], [62, 98], [92, 108], [110, 132], [140, 146], [160, 172], [196, 190], [214, 220]];
    const n = Math.max(2, Math.ceil(pts.length * crackK));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(62, 98); ctx.lineTo(70, 120); ctx.moveTo(140, 146); ctx.lineTo(128, 166); ctx.stroke();
  }
  // 손바닥
  ctx.fillStyle = skin; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(-5, 10, 88, 66, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 손바닥 그늘
  ctx.fillStyle = 'rgba(23,20,15,.07)'; ctx.beginPath(); ctx.ellipse(-12, 18, 52, 34, -0.35, 0, Math.PI * 2); ctx.fill();
  // 엄지
  ctx.fillStyle = skin;
  ctx.save(); ctx.translate(-70, 40); ctx.rotate(1.25 + curl / 0.85 * 2.6);
  ctx.beginPath(); ctx.roundRect(-15, 0, 30, 78, 15); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
  fingers(cx, cy, s, curl, false);
}
function fingers(cx: number, cy: number, s: number, curl: number, front: boolean) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = '#efe9dd'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  FINGERS.forEach((f, i) => {
    // 손바닥 가장자리에서 시작하는 두 마디 손가락
    const bx = -5 + Math.cos(f.a) * 70, by = 10 + Math.sin(f.a) * 52;
    if (front && i > 2) return;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(f.a + Math.PI / 2 + curl * 1.1);
    ctx.beginPath(); ctx.roundRect(-f.w / 2, -f.len * 0.55, f.w, f.len * 0.55, f.w / 2); ctx.fill(); ctx.stroke();
    ctx.translate(0, -f.len * 0.5); ctx.rotate(curl * 1.3);
    ctx.beginPath(); ctx.roundRect(-f.w / 2 + 1, -f.len * 0.5, f.w - 2, f.len * 0.5, f.w / 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * clamp01(k);

/**
 * 진실 컷: 꿈 바깥의 밤. 침대에 잠든 나(덮인 담요는 그 핫핑크), 머리맡 의자에서 기타를 치는 그 사람.
 * 기타에서 퍼지는 소리의 파동이 내 머리에 닿는다 — 게임 내내 긁어 온 소나가 바로 이것이었다
 */
function drawBedside(t: number) {
  const { W, H } = view, s = Math.min(W, H) / 800;
  // 밤: 위가 조금 어두운 먹빛
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(23,20,15,.28)'); g.addColorStop(1, 'rgba(23,20,15,.06)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 창과 달
  const wx = W * 0.62, wy = H * 0.14;
  ctx.lineWidth = 3; ctx.strokeRect(wx, wy, 150 * s, 190 * s);
  ctx.beginPath(); ctx.moveTo(wx + 75 * s, wy); ctx.lineTo(wx + 75 * s, wy + 190 * s); ctx.stroke();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(wx + 40 * s, wy + 50 * s, 18 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 바닥
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.06, H * 0.84); ctx.lineTo(W * 0.94, H * 0.84); ctx.stroke();
  // 침대: 머리 쪽이 왼쪽
  const bx = W * 0.4, by = H * 0.6, bw = W * 0.46, bh = 70 * s;
  ctx.fillStyle = PAPER; ctx.lineWidth = 4;
  ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
  ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx, H * 0.84); ctx.moveTo(bx + bw, by + bh); ctx.lineTo(bx + bw, H * 0.84); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - 4, by - 70 * s); ctx.lineTo(bx - 4, H * 0.84); ctx.stroke(); // 머리판
  // 베개와 잠든 나
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(bx + 50 * s, by - 6 * s, 44 * s, 18 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx + 54 * s, by - 18 * s, 17 * s, 0, Math.PI * 2); ctx.fill();
  // 덮인 담요: 밤의 방에서 내가 거절했던 그 색
  ctx.fillStyle = PINK; ctx.beginPath();
  ctx.moveTo(bx + 80 * s, by + 4 * s); ctx.quadraticCurveTo(bx + bw * 0.5, by - 34 * s, bx + bw - 10 * s, by - 6 * s);
  ctx.lineTo(bx + bw - 6 * s, by + bh * 0.7); ctx.lineTo(bx + 76 * s, by + bh * 0.7); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  // 머리맡 의자에 앉아 기타를 치는 그 사람 (얼굴은 그리지 않는다)
  const px = W * 0.2, py = H * 0.8, k = 3.4 * s;
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px - 20 * s, py); ctx.lineTo(px - 20 * s, H * 0.84); ctx.moveTo(px + 90 * s, py); ctx.lineTo(px + 90 * s, H * 0.84); ctx.moveTo(px - 26 * s, py); ctx.lineTo(px + 96 * s, py); ctx.stroke();
  const strum = Math.sin(t * 7) * 3 * s;
  ctx.save(); ctx.translate(px, py - 4 * s + strum * 0.2); ctx.scale(k, k); ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT; figure(); ctx.restore();
  // 소리의 파동: 기타에서 내 머리로 (게임 내내 긁어 온 소나)
  const gx = px + 30 * k * 0.4, gy = py - 30 * s, hx = bx + 54 * s, hy = by - 18 * s;
  ctx.save(); ctx.strokeStyle = PINK; ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const ph = ((t * 0.55 + i / 4) % 1);
    const r = 20 * s + ph * Math.hypot(hx - gx, hy - gy);
    ctx.globalAlpha = (1 - ph) * 0.8 * clamp01(t / 1.2);
    ctx.beginPath(); ctx.arc(gx, gy, r, -0.55, 0.25); ctx.stroke();
  }
  ctx.restore();
  // 글
  const a1 = clamp01((t - 2.4) / 1.2), a2 = clamp01((t - 4.6) / 1.4);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (a1 > 0) { ctx.globalAlpha = a1; brushText('잠든 건, 나였다', W * 0.4, H * 0.2, Math.round(Math.min(78, W / 12)), INK, 0); }
  if (a2 > 0) { ctx.globalAlpha = a2 * 0.85; brushText('머리맡에서, 이 노래가 들려오고 있었다', W * 0.4, H * 0.3, Math.round(Math.min(32, W / 26)), INK_SOFT, 0); }
  ctx.globalAlpha = 1;
}
