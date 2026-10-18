// 매 프레임 화면 전체를 그린다: 한지 → 산·섬 → 바다 → 파동 → 물길·오브젝트 → 배 → 안개 → 이펙트 → 악보 → 줄
import { CHORDS } from '../data/chords';
import { MODES } from '../data/modes';
import { TEXT } from '../data/chapter0';
import { OBJ, S, cloth, fx, obj, str, thorns, view, type WorldObj } from '../world/state';
import { boatScale, boatX, boatY, camX, hz, playerX, pos, sb, seaY, stringY, sx0, sx1, toScreenX } from '../world/geometry';
import { drawBuoy, drawPainting, drawPaintingEdges, drawRock, drawThorn, drawThornGlow } from './chapter1Art';
import { figure } from './figure';
import { clamp, lerp, rand } from '../util/math';
import { backdrop, ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, MONO, PAPER, VOLT } from './palette';

/** 그 사람의 색. 띠와 천 조각이 같은 색이어야 한다 (복선 7) */
const PINK = '#ff2a7f';
const wrap = (v: number, lo: number, hi: number) => { const p = hi - lo; return ((((v - lo) % p) + p) % p) + lo; };

export function draw() {
  const { W, H } = view;
  ctx.drawImage(backdrop.paper!, 0, 0, W, H);
  ctx.save();
  if (S.shake > 0.3) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
  const acc = MODES[S.mode].accent;
  const camPx = camX() * W;
  // 인물 줌인 (1절의 기타 침묵): 기타를 안은 '나'에게 다가간다
  ctx.save();
  if (S.zoom > 0.001) {
    const fx0 = playerX(), fy0 = boatY() - 20, z = 1 + 0.9 * S.zoom;
    ctx.translate(fx0, fy0); ctx.scale(z, z); ctx.translate(-fx0, -fy0);
  }
  // far mountains (always visible, faint) — 아주 느리게 흘러간다
  ctx.save(); ctx.translate(-camPx * 0.05, 0);
  for (const m of backdrop.mountains) {
    const g = ctx.createLinearGradient(0, hz() - H * 0.12, 0, hz() + 4);
    g.addColorStop(0, `rgba(23,20,15,${m.al})`); g.addColorStop(1, 'rgba(23,20,15,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, hz() + 6);
    m.pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(m.pts[m.pts.length - 1][0], hz() + 6); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(23,20,15,.35)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, hz() + 2); ctx.lineTo(W, hz() + 2); ctx.stroke();
  OBJ.filter(o => o.kind === 'isle').forEach(drawIsle);
  OBJ.filter(o => o.kind === 'painting').forEach(drawPainting);
  // sea strokes — 가까운 물결일수록 빨리 지나간다
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const s of backdrop.sea) {
    const sx = wrap(s.x - camPx * (0.35 + 0.65 * s.d), -60 - s.len, W + 60);
    const xx = sx + Math.sin(S.t * 0.55 + s.ph) * 10 * (0.3 + s.d);
    ctx.globalAlpha = s.a; ctx.lineWidth = s.w;
    ctx.beginPath(); ctx.moveTo(xx, s.y); ctx.quadraticCurveTo(xx + s.len / 2, s.y - 1.6 * s.w, xx + s.len, s.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  drawRipples();
  drawRoad();
  OBJ.forEach(o => {
    if (o.kind === 'lamp') drawLamp(o);
    else if (o.kind === 'refl') drawRefl(o);
    else if (o.kind === 'whisper') drawWhisper(o);
    else if (o.kind === 'rock') drawRock(o);
    else if (o.kind === 'buoy') drawBuoy(o);
    else if (o.kind === 'thorn') drawThorn(o);
  });
  drawCloth();
  drawBoat(acc);
  drawMist();
  // speed lines
  for (const l of fx.lines) {
    ctx.globalAlpha = Math.min(1, l.life); ctx.strokeStyle = l.c; ctx.lineWidth = l.c === INK ? 2.5 : 4;
    const r0 = 30, r1 = r0 + l.l * (1.2 - l.life * 0.4);
    ctx.beginPath();
    ctx.moveTo(l.x + Math.cos(l.a) * r0, l.y + Math.sin(l.a) * r0);
    ctx.lineTo(l.x + Math.cos(l.a) * r1, l.y + Math.sin(l.a) * r1);
    ctx.stroke();
  }
  // ink drops
  for (const p of fx.parts) {
    ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = p.c;
    const sp = Math.min(3, Math.hypot(p.vx, p.vy) / 180);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.beginPath(); ctx.ellipse(0, 0, p.r * (1 + sp), p.r, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // 기타 침묵: 세상의 색이 빠지고 조금 어두워진다 (그 사람의 핑크도 사라진다)
  if (S.hush > 0.01) {
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = S.hush; ctx.fillStyle = '#808080';
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.22 * S.hush; ctx.fillStyle = '#78736b';
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  drawPaintingEdges();
  // 가시를 뽑을 순간: 세상이 어두워지고 가시만 빛난다
  if (S.dim > 0.01) {
    ctx.globalAlpha = S.dim * 0.75; ctx.fillStyle = '#14120f'; ctx.fillRect(-40, -40, W + 80, H + 80); ctx.globalAlpha = 1;
    drawThornGlow();
  }
  // 후렴 예고: 화면 전체에 형광이 번진다
  if (S.vision > 0.01) {
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = S.vision * 0.13; ctx.fillStyle = PINK;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  if (S.flash > 0.01) {
    const white = S.flashCol === '#ffffff';
    ctx.globalCompositeOperation = white ? 'source-over' : 'multiply'; ctx.globalAlpha = S.flash * 0.75; ctx.fillStyle = white ? PAPER : S.flashCol;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  drawScore(acc);
  drawDyn(acc);
  // 눈뜸: 하얀 빛 속에서 세상이 떠오른다
  if (S.reveal < 1) { ctx.globalAlpha = 1 - S.reveal; ctx.drawImage(backdrop.paper!, -40, -40, W + 80, H + 80); ctx.globalAlpha = 1; }
  drawStrings(acc);
  ctx.restore();
  // 눈뜸: 눈을 감은 어둠
  if (S.black > 0.001) { ctx.globalAlpha = S.black; ctx.fillStyle = '#0b0a08'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

function drawIsle(o: WorldObj) {
  if (o.vis < 0.01) return;
  const p = pos(o), w = Math.min(view.W * 0.3, 260) * (o.s ?? 1), h = w * 0.5;
  if (p.x < -w || p.x > view.W + w) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const g = ctx.createLinearGradient(0, -h, 0, 4);
  g.addColorStop(0, `rgba(23,20,15,${0.85 * o.vis})`); g.addColorStop(0.75, `rgba(23,20,15,${0.35 * o.vis})`); g.addColorStop(1, 'rgba(23,20,15,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, 4);
  o.pts.forEach(([u, v]) => ctx.lineTo(-w / 2 + u * w, -v * h));
  ctx.lineTo(w / 2, 4); ctx.fill();
  ctx.strokeStyle = `rgba(23,20,15,${0.7 * o.vis})`; ctx.lineWidth = 2; ctx.beginPath();
  o.pts.forEach(([u, v], i) => { const x = -w / 2 + u * w, y = -v * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  // pines along the ridge, a thin-string detail
  if (o.detail > 0.05) {
    ctx.globalAlpha = o.detail; ctx.fillStyle = INK;
    o.pts.slice(2, 8).forEach(([u, v], i) => {
      const x = -w / 2 + u * w, y = -v * h;
      ctx.beginPath(); ctx.moveTo(x, y - 10 - i % 2 * 4); ctx.lineTo(x - 4, y + 1); ctx.lineTo(x + 4, y + 1); ctx.fill();
    });
  }
  // reflection
  ctx.globalAlpha = o.vis * 0.22; ctx.scale(1, -0.28); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-w / 2, -4);
  o.pts.forEach(([u, v]) => ctx.lineTo(-w / 2 + u * w, -v * h));
  ctx.lineTo(w / 2, -4); ctx.fill();
  ctx.restore();
}

function drawRipples() {
  ctx.save(); ctx.beginPath(); ctx.rect(0, hz() + 2, view.W, sb() - hz() + 10); ctx.clip();
  for (const r of fx.rip) {
    const k = 1 - r.r / r.max, a = k * (0.18 + 0.55 * r.dyn + 0.12), x = toScreenX(r.wx);
    ctx.strokeStyle = INK; ctx.globalAlpha = a; ctx.lineWidth = 0.8 + (1 - r.t) * 2.4 + r.dyn * 2.2;
    ctx.beginPath(); ctx.ellipse(x, r.y, r.r, r.r * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = a * 0.45; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(x, r.y, r.r * 0.9, r.r * 0.324, 0, 0, Math.PI * 2); ctx.stroke();
    if (r.dyn > 0.62) {
      ctx.strokeStyle = r.acc; ctx.globalAlpha = k * (r.dyn - 0.5) * 1.6; ctx.lineWidth = 1.6 + r.dyn * 2;
      ctx.beginPath(); ctx.ellipse(x, r.y, r.r * 0.96, r.r * 0.346, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 훅을 다 울리면 두 등불 사이에서 앞쪽으로 열리는 빛의 물길 */
function drawRoad() {
  if (S.road < 0.01) return;
  const a = obj('Db6'), x0 = toScreenX(a.wx ?? 0), y = seaY(0.55);
  const len = view.W * 3 * S.road;
  ctx.save();
  ctx.globalAlpha = 0.5 * S.road; ctx.strokeStyle = '#d9a72b'; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.lineWidth = 3 - k; ctx.setLineDash([22 + k * 7, 14 + k * 5]); ctx.lineDashOffset = -S.t * 30 - k * 9;
    ctx.beginPath(); ctx.moveTo(x0, y + k * 6 - 6);
    for (let x = 0; x <= len; x += 40) ctx.lineTo(x0 + x, y + k * 6 - 6 + Math.sin(x * 0.01 + S.t + k) * 3);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // 등불 빛이 배 아래 물을 비춘다 (물그림자 장면)
  const g = ctx.createRadialGradient(playerX(), boatY() + 40, 4, playerX(), boatY() + 40, 120);
  g.addColorStop(0, 'rgba(255,214,120,.35)'); g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.globalAlpha = S.road; ctx.fillStyle = g; ctx.fillRect(playerX() - 120, boatY() - 80, 240, 240);
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawLamp(o: WorldObj) {
  if (o.hidden) return;
  const p = pos(o), acc = MODES[S.mode].accent, a = Math.max(o.vis, o.lit ? 1 : 0, o.found ? 0.32 : 0);
  if (p.x < -100 || p.x > view.W + 100) return;
  if (o.res > 0.01) {
    const pulse = 0.5 + 0.5 * Math.sin(S.t * 14);
    ctx.globalAlpha = o.res * (0.25 + 0.25 * pulse);
    const g = ctx.createRadialGradient(p.x, p.y - 20, 2, p.x, p.y - 20, 70);
    g.addColorStop(0, acc); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(p.x - 70, p.y - 90, 140, 140);
  }
  if (a < 0.01) { ctx.globalAlpha = 1; return; }
  ctx.save(); ctx.translate(p.x, p.y + Math.sin(S.t * 1.6 + p.x) * 1.5);
  if (o.lit) {
    const big = o.lit >= 2 ? 1.25 : 1;
    const g = ctx.createRadialGradient(0, -26, 2, 0, -26, 58 * big);
    g.addColorStop(0, acc); g.addColorStop(0.4, acc + '66'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(S.t * 3); ctx.fillStyle = g; ctx.fillRect(-80, -100, 160, 150);
    ctx.globalAlpha = 0.55; ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.beginPath();
    for (let y = 4; y < 70; y += 3) ctx.lineTo(Math.sin(y * 0.35 + S.t * 4) * 3, y);
    ctx.stroke();
  }
  ctx.globalAlpha = a; ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(0, 2, 14, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-5, -26); ctx.lineTo(5, -26); ctx.lineTo(7, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-11, -26); ctx.lineTo(0, -38); ctx.lineTo(11, -26); ctx.fill();
  ctx.fillStyle = o.lit ? VOLT : PAPER; ctx.fillRect(-3.5, -22, 7, 8);
  const showName = o.lit || o.found || o.detail > 0.15, lab = CHORDS[o.chord!].label;
  const la = o.lit ? 1 : showName ? Math.max(o.detail, o.found ? 0.65 : 0) * a : 0;
  if (la > 0.02) {
    ctx.globalAlpha = la; ctx.font = `${o.lit ? 34 : 28}px ${BRUSH}`; ctx.textAlign = 'center';
    if (o.lit) { ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText(lab, 0, -46); ctx.fillStyle = VOLT; } else ctx.fillStyle = INK;
    ctx.fillText(lab, 0, -46);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}


function drawRefl(o: WorldObj) {
  const v = Math.min(o.vis, o.detail);
  if (v < 0.02) return;
  const p = pos(o), s = boatScale();
  ctx.save(); ctx.translate(p.x - 14 * s + Math.sin(S.t * 2) * 2, p.y); ctx.scale(s, -s);
  ctx.globalAlpha = v * 0.55; ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT;
  // one seated figure holding a guitar. The bow sleeper casts nothing.
  figure();
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawWhisper(o: WorldObj) {
  if (o.vis < 0.02) return;
  const p = pos(o), txt = TEXT.whisper;
  ctx.save(); ctx.font = `${Math.min(30, view.W / 15)}px ${BRUSH}`; ctx.textAlign = 'center';
  const w = ctx.measureText(txt).width;
  let x = p.x - w / 2;
  ctx.textAlign = 'left';
  const chars = [...txt];
  chars.forEach((ch, ci) => {
    const cw = ctx.measureText(ch).width;
    // 가시를 삼킬수록 속삭임이 흐려진다. 마지막 글자는 거의 지워진다 (복선)
    const fade = (1 - 0.4 * S.whisperFade) * (ci === chars.length - 1 ? 1 - 0.85 * S.whisperFade : 1);
    ctx.globalAlpha = o.vis * fade * (0.55 + 0.25 * Math.sin(S.t * 2 + x * 0.05)); ctx.fillStyle = INK_SOFT;
    ctx.fillText(ch, x, p.y + Math.sin(S.t * 1.4 + x * 0.03) * 2);
    x += cw;
  });
  ctx.globalAlpha = o.vis; ctx.fillStyle = PINK; ctx.fillRect(p.x + w / 2 + 8, p.y - 16, 10, 10);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 물길을 따라 떠내려오는 핫핑크 천 조각 */
function drawCloth() {
  if (!cloth.active) return;
  const x = toScreenX(cloth.wx), y = seaY(cloth.ry) + Math.sin(S.t * 1.7) * 3;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(S.t * 1.3) * 0.15);
  ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-18, -2);
  for (let k = 0; k <= 6; k++) ctx.lineTo(-18 + k * 6, -4 + Math.sin(S.t * 4 + k) * 2);
  ctx.lineTo(18, 5); ctx.quadraticCurveTo(0, 9, -18, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 0.25; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 9, 22, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 배: 오른쪽이 뱃머리. 뒤쪽엔 기타를 안은 '나', 뱃머리엔 잠든 그 사람 */
function drawBoat(acc: string) {
  const bx = boatX(), by = boatY() + Math.sin(S.t * 1.1) * 3, s = boatScale();
  ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(S.t * 0.9) * 0.025 + S.wobble); ctx.scale(s, s);
  ctx.globalAlpha = 0.18; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 10, 112, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  const mx = -8;
  // full sail — 후렴 예고에서만 활짝 펴진다
  if (S.sail > 0.01) {
    const p = S.sail;
    ctx.fillStyle = 'rgba(234,230,222,.96)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mx, -128); ctx.quadraticCurveTo(mx + 110 * p, -80, mx + 70 * p, -16); ctx.lineTo(mx, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = acc; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(mx + 2, -122); ctx.quadraticCurveTo(mx + 100 * p, -78, mx + 64 * p, -20); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(mx, -128 + k * 27); ctx.lineTo(mx + (60 + 20 * Math.sin(k)) * p, -128 + k * 29); ctx.stroke(); }
  }
  // mast
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(mx, -6); ctx.lineTo(mx, -132); ctx.stroke();
  // furled sail (돛이 아직 없을 때의 감긴 천)
  if (S.sail < 0.2 && S.scrap < 0.5) {
    ctx.lineWidth = 9; ctx.globalAlpha = (1 - S.sail * 5) * (1 - S.scrap * 2);
    ctx.beginPath(); ctx.moveTo(mx + 2, -118); ctx.lineTo(mx + 2, -40); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // 천 조각 돛: 돛대 위쪽에 묶여 나부끼는 작은 핑크 천
  if (S.scrap > 0.01 && S.sail < 0.6) {
    const p = S.scrap, fl = Math.sin(S.t * 3.2) * 4;
    ctx.globalAlpha = Math.min(1, p * 1.5) * (1 - S.sail);
    ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx, -126); ctx.quadraticCurveTo(mx + 30 * p, -116 + fl, mx + 44 * p, -100 + fl);
    ctx.quadraticCurveTo(mx + 22 * p, -98, mx, -88); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 나: 배 뒤쪽에 앉아 기타를 안고 있다
  ctx.save(); ctx.translate(-76, -6); ctx.fillStyle = INK; ctx.strokeStyle = INK; figure(); ctx.restore();
  // 노
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-70, -16); ctx.lineTo(-104 + S.wobble * 80, 16); ctx.stroke();
  // 그 사람: 뱃머리에 누워 있다. 한 손이 내 쪽으로 뻗어 있다 (복선 1)
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(74, -13, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(46, -9, 26, 7, -0.04, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
  // 자세는 내가 보지 않을 때 바뀐다: 0 내 쪽으로 뻗은 손, 1 가슴에 얹은 손, 2 뱃전 아래로 늘어진 손
  const arm = ([[36, -26, 12, -22], [54, -22, 47, -15], [40, -4, 22, -2]] as const)[S.pose] ?? [36, -26, 12, -22];
  ctx.beginPath(); ctx.moveTo(62, -14); ctx.quadraticCurveTo(arm[0], arm[1], arm[2], arm[3]); ctx.stroke();
  ctx.beginPath(); ctx.arc(arm[2] - 2, arm[3], 2.6, 0, Math.PI * 2); ctx.fill();
  // 손목의 가는 금 (가시를 삼킨 흔적)
  if (S.crack > 0) {
    ctx.strokeStyle = 'rgba(234,230,222,.85)'; ctx.lineWidth = 0.7;
    const hx = arm[2] + 4, hy = arm[3];
    ctx.beginPath(); ctx.moveTo(hx - 1, hy - 2.5); ctx.lineTo(hx + 1, hy - 0.5); ctx.lineTo(hx - 0.5, hy + 0.8); ctx.lineTo(hx + 1.2, hy + 2.6); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
  }
  // 핫핑크 띠. 천 조각을 얻을 때마다 조금씩 짧아진다 (복선 7)
  const sl = S.sash;
  ctx.strokeStyle = PINK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(54, -15); ctx.quadraticCurveTo(44, -4, 54 - 24 * sl, -12 + 4 * (1 - sl)); ctx.stroke();
  // hull: one loaded brush stroke
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(104, -10); ctx.quadraticCurveTo(60, 4, 0, 0); ctx.quadraticCurveTo(-60, 4, -100, -14);
  ctx.quadraticCurveTo(-80, 18, 0, 20); ctx.quadraticCurveTo(78, 18, 104, -10); ctx.fill();
  ctx.strokeStyle = 'rgba(234,230,222,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 6); ctx.quadraticCurveTo(0, 13, -78, 2); ctx.stroke();
  ctx.restore();
}

const mist = [...Array(8)].map((_, i) => ({ u: Math.random(), v: rand(0.05, 0.85), r: rand(0.18, 0.38), sp: rand(0.004, 0.012) * (i % 2 ? 1 : -1) }));
function drawMist() {
  const { W, H } = view;
  for (const m of mist) {
    // 안개는 천천히 흘러간다. 화면 밖으로 완전히 나간 뒤에야 반대편으로 돌아온다 (순간 이동이 보이지 않게)
    // (이전 식은 매 프레임 화면 너비의 20%씩 건너뛰어 안개가 깜빡였다)
    m.u += m.sp * 0.016;
    const u = wrap(m.u - camX() * 0.6, -0.7, 1.7);
    const x = u * W, y = hz() + (sb() - hz()) * m.v, r = m.r * Math.max(W, H);
    // 배 바로 위에 짙은 안개가 앉으면 주인공이 사라져 보여서, 배 근처 안개는 조금 옅게
    const dist = Math.hypot((x - boatX()) / W, (y - boatY()) / H);
    const near = 0.5 + 0.5 * clamp((dist - 0.1) / 0.25, 0, 1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(234,230,222,${0.62 * S.fog * near})`); g.addColorStop(1, 'rgba(234,230,222,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function drawStrings(acc: string) {
  if (S.stringsVis < 0.01) return;
  const { W, H } = view;
  ctx.save(); ctx.globalAlpha = S.stringsVis;
  const top = H * 0.675;
  ctx.fillStyle = 'rgba(23,20,15,.045)'; ctx.fillRect(0, top, W, H - top);
  // 기타 침묵(1절)에는 줄이 흐려진다
  const base = S.stringsVis * (1 - 0.55 * S.hush);
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.globalAlpha = 0.75 * base; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = 0; x <= W; x += 12) ctx.lineTo(x, top + Math.sin(x * 0.04) * 1.2 + Math.sin(x * 0.13) * 0.6);
  ctx.stroke(); ctx.globalAlpha = base;
  const x0 = sx0(), x1 = sx1();
  ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(x0, stringY(0) - 10); ctx.lineTo(x0, stringY(5) + 10); ctx.moveTo(x1, stringY(0) - 10); ctx.lineTo(x1, stringY(5) + 10);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const y = stringY(i), s = str[i], th = lerp(4.4, 1.3, i / 5), N = 56;
    const path = () => {
      ctx.beginPath();
      for (let k = 0; k <= N; k++) {
        const u = k / N;
        const d = s.amp * Math.sin(Math.PI * u) * Math.cos(s.ph) + s.amp * 0.3 * Math.sin(2 * Math.PI * u) * Math.cos(s.ph * 1.9);
        k ? ctx.lineTo(lerp(x0, x1, u), y + d) : ctx.moveTo(x0, y);
      }
    };
    if (S.hush > 0.3) {
      // 끊어진 줄: 가운데가 끊겨 양쪽 끝이 늘어진다
      const gx = lerp(x0, x1, 0.36 + 0.055 * i + 0.03 * Math.sin(i * 2.3)), droop = (15 + i * 3) * S.hush;
      ctx.strokeStyle = INK; ctx.globalAlpha = 0.85 * base; ctx.lineWidth = th;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(gx - 30, y + s.amp * 0.3); ctx.bezierCurveTo(gx - 16, y, gx - 12, y + droop * 0.6, gx - 16, y + droop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(gx + 30, y - s.amp * 0.3); ctx.bezierCurveTo(gx + 16, y, gx + 12, y + droop * 0.7, gx + 18, y + droop * 1.15); ctx.stroke();
      ctx.globalAlpha = 0.5 * base; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
      ctx.fillText(String(6 - i), x0 + 6, y - 5);
      continue;
    }
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.92 * base; ctx.lineWidth = th; path(); ctx.stroke();
    ctx.globalAlpha = 0.25 * base; ctx.lineWidth = th * 0.5; ctx.setLineDash([26, 7, 10, 5]); ctx.lineDashOffset = i * 13;
    ctx.save(); ctx.translate(0, th * 0.45); path(); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
    if (s.hot > 0.62 && s.amp > 1.2) {
      ctx.globalAlpha = clamp(s.amp / 9, 0, 1) * (s.hot - 0.4) * base; ctx.strokeStyle = acc; ctx.lineWidth = th + 2;
      ctx.shadowColor = acc; ctx.shadowBlur = 14; path(); ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 0.5 * base; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
    ctx.fillText(String(6 - i), x0 + 6, y - 5);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawScore(acc: string) {
  const sx = Math.max(16, view.W * 0.03), sy = sb() - 34, pop = 1 + S.seal * 0.35, c = CHORDS[S.chord];
  // chord seal
  ctx.save(); ctx.translate(sx + 30, sy + 30); ctx.rotate(-0.06); ctx.scale(pop, pop);
  if (S.chord === 'open') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(-28, -28, 56, 56); ctx.fillStyle = INK; ctx.font = `26px ${BRUSH}`;
  } else {
    ctx.fillStyle = acc; ctx.fillRect(-29, -29, 58, 58); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-29, -29, 58, 58);
    const n = c.label.length;
    ctx.fillStyle = PAPER; ctx.font = `${n > 4 ? 19 : n > 2 ? 26 : 36}px ${BRUSH}`;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.label, 0, 2); ctx.restore();
  // key signature: four flats are four thorns
  const kx = sx + 76, ky = sy + 12, gap = 7, w = 118;
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
  for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(kx, ky + l * gap); ctx.lineTo(kx + w, ky + l * gap + Math.sin(l) * 0.6); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.font = `22px "Gowun Batang",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  thorns.forEach((t, i) => {
    let x = kx + 14 + i * 15, y = ky + t.p * gap + 5, rot = 0, a = 1, col = INK;
    if (t.gone && !t.fly) return;
    if (t.fly?.toBow) {
      // 뽑힌 가시는 화면 밖이 아니라 뱃머리의 그 사람 쪽으로 떨어져 사라진다 (복선: 그 사람이 삼켰다)
      const e = S.t - t.fly.t, k = Math.min(1, e / 1.4);
      if (e > 1.6) return;
      const tx = boatX() + 56 * boatScale(), ty = boatY() - 16;
      x = lerp(x, tx, k); y = lerp(y, ty, k) - Math.sin(Math.PI * k) * 120; rot = t.fly.rot * e;
      a = e < 1.1 ? 1 : 1 - (e - 1.1) / 0.5; col = '#ff2a7f';
    } else if (t.fly) {
      const e = S.t - t.fly.t;
      if (e > 1.6) return;
      x += t.fly.vx * e; y += t.fly.vy * e + 260 * e * e; rot = t.fly.rot * e; a = 1 - e / 1.6; col = acc;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText('♭', 0, 0); ctx.restore();
  });
  const left = thorns.filter(t => !t.gone).length;
  ctx.globalAlpha = 0.65; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
  ctx.fillText(left ? `가시 ${left}` : '가시 없음', kx + w + 8, ky + gap * 2.6); ctx.globalAlpha = 1;
  // 박 표시: 박이 울릴 때마다 먹 점이 번진다
  if (S.groove !== 'none') {
    const px = kx + w + 70, py = ky + gap * 2;
    ctx.globalAlpha = 0.25 + 0.6 * S.pulse; ctx.fillStyle = S.groove === 'heart' ? INK : acc;
    ctx.beginPath(); ctx.arc(px, py, 5 + 5 * S.pulse, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.35 * S.pulse; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 10 + 14 * (1 - S.pulse), 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawDyn(acc: string) {
  if (!S.dyn) return;
  const e = S.t - S.dyn.t;
  if (e > 1.3) return;
  const a = 1 - e / 1.3, m = S.dyn.m, loud = m === 'ff' || m === 'f';
  const x = view.W - Math.max(20, view.W * 0.04), y = sb() + 2;
  ctx.save(); ctx.translate(x, y); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = a;
  if (m === 'ff') {
    ctx.rotate(-0.12);
    const sc = 1 + Math.max(0, 0.4 - e) * 1.2;
    ctx.scale(sc, sc); ctx.font = `72px ${BRUSH}`; ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText('ff', 0, 0);
    ctx.fillStyle = VOLT; ctx.fillText('ff', 0, 0);
    ctx.fillStyle = acc; ctx.fillRect(-60, 6, 62, 6);
  } else {
    ctx.font = `italic ${loud ? 52 : m === 'pp' ? 34 : 42}px "Gowun Batang",serif`;
    ctx.fillStyle = m === 'pp' ? INK_SOFT : INK; ctx.globalAlpha = a * (m === 'pp' ? 0.6 : 0.9); ctx.fillText(m, 0, 0);
  }
  ctx.restore();
}
