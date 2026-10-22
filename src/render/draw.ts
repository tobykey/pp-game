// 매 프레임 화면 전체를 그린다: 한지 → 산·섬 → 바다 → 파동 → 물길·오브젝트 → 배 → 안개 → 이펙트 → 악보 → 줄
import { CHORDS } from '../data/chords';
import { MODES } from '../data/modes';
import { TEXT } from '../data/chapter0';
import { OBJ, S, cloth, fx, obj, str, thorns, view, type WorldObj } from '../world/state';
import { boatScale, boatX, boatY, camX, hz, playerX, pos, sb, seaY, stringY, sx0, sx1, toScreenX } from '../world/geometry';
import { drawBuoy, drawPainting, drawPaintingEdges, drawRock, drawThorn, drawThornGlow } from './chapter1Art';
import { figure } from './figure';
import { drawCounterWaves, drawFBurst, drawLights, drawLyric, drawSailGauge, drawWhite, hopeSailPatches } from './chapter3Art';
import { drawBurst, drawColumn, drawFallingRain, drawFrozenRain, drawGuardWaves, drawHeavyPick, drawShield, drawSlowmo } from './chapter2Art';
import { clamp, lerp, rand } from '../util/math';
import { beatPos, spb } from '../world/rhythm';
import { backdrop, ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, MONO, PAPER, VOLT, reduceMotion } from './palette';
import { drawCut } from './cutscene';
import { mark, profStart } from './prof';
import { allies, drawAllies, drawChoice, drawDuetStrings, drawEnding, drawRecall } from './chapter6Art';
import { crackToShoulder, drawClashGauge, drawClashWall, drawCrackTexts, drawDrySea, drawGrounded, drawRelic, drawSign, drawStorm, drawTrails } from './chapter4Art';
import { drawAnswer, drawCreepers, drawNatural, drawQuestion, drawRest, drawRewrite, drawSunk, drawTruth, meLying, personWithGuitar, secondReflection } from './chapter5Art';

/** 그 사람의 색. 띠와 천 조각이 같은 색이어야 한다 (복선 7) */
const PINK = '#ff2a7f';
const wrap = (v: number, lo: number, hi: number) => { const p = hi - lo; return ((((v - lo) % p) + p) % p) + lo; };

export function draw() {
  const { W, H } = view;
  profStart();
  ctx.drawImage(backdrop.paper!, 0, 0, W, H);
  mark('paper');
  ctx.save();
  if (S.shake > 0.3) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
  const acc = MODES[S.mode].accent;
  const camPx = camX() * W;
  // 인물 줌인 (1절의 기타 침묵): 기타를 안은 '나'에게 다가간다
  ctx.save();
  // 폭주 스트로크: 화면이 배 쪽으로 점점 조여 온다 (동작 줄이기에선 조금만)
  if (S.press > 0.001) {
    const fx0 = boatX(), fy0 = boatY() - 40, z = 1 + (reduceMotion ? 0.08 : 0.3) * S.press;
    ctx.translate(fx0, fy0); ctx.scale(z, z); ctx.translate(-fx0, -fy0);
  }
  // F 폭발: 배를 향해 화면이 확 당겨졌다가 풀린다
  if (S.punch > 0.001) {
    const fx0 = boatX(), fy0 = boatY() - 40, z = 1 + (reduceMotion ? 0.06 : 0.32) * S.punch;
    ctx.translate(fx0, fy0); ctx.scale(z, z); ctx.translate(-fx0, -fy0);
  }
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
  mark('mountains');
  drawStorm();
  OBJ.filter(o => o.kind === 'isle').forEach(drawIsle);
  OBJ.filter(o => o.kind === 'painting').forEach(drawPainting);
  drawLights();
  mark('isles+paintings+lights');
  // sea strokes — 가까운 물결일수록 빨리 지나간다
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const s of backdrop.sea) {
    const sx = wrap(s.x - camPx * (0.35 + 0.65 * s.d), -60 - s.len, W + 60);
    const xx = sx + Math.sin(S.t * 0.55 + s.ph) * 10 * (0.3 + s.d);
    ctx.globalAlpha = s.a; ctx.lineWidth = s.w;
    ctx.beginPath(); ctx.moveTo(xx, s.y); ctx.quadraticCurveTo(xx + s.len / 2, s.y - 1.6 * s.w, xx + s.len, s.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  mark('sea');
  drawDrySea();
  drawTrails();
  drawCrackTexts();
  mark('dry sea');
  drawRipples();
  mark('ripples');
  drawFrozenRain();
  drawRoad();
  mark('frozen rain+road');
  OBJ.forEach(o => {
    if (o.kind === 'lamp') drawLamp(o);
    else if (o.kind === 'refl') drawRefl(o);
    else if (o.kind === 'whisper') drawWhisper(o);
    else if (o.kind === 'rock') drawRock(o);
    else if (o.kind === 'buoy') drawBuoy(o);
    else if (o.kind === 'thorn') drawThorn(o);
    else if (o.kind === 'column') drawColumn(o);
    else if (o.kind === 'relic') drawRelic(o);
    else if (o.kind === 'sign') drawSign(o);
    else if (o.kind === 'answer') drawAnswer(o);
  });
  mark('objects');
  drawCreepers();
  drawCloth();
  drawClashWall();
  if (allies.length && S.tug >= 0) { const s = boatScale(), near = boatX() + 150 * s; drawAllies(near + (view.W * 0.95 - near) * S.tug); }
  drawGrounded();
  drawBoat(acc);
  mark('boat');
  drawSunk();
  drawNatural();
  drawTruth();
  drawQuestion();
  drawRewrite();
  drawChoice();
  mark('ch5 text');
  drawShield();
  drawCounterWaves();
  drawLyric();
  drawSailGauge();
  drawGuardWaves();
  drawMist();
  drawFallingRain();
  mark('mist+rain+waves');
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
  mark('lines+particles');
  // 기타 침묵: 세상의 색이 빠지고 조금 어두워진다 (그 사람의 핑크도 사라진다)
  if (S.hush > 0.01) {
    // 줄과 악보는 이 뒤에 그리므로, 그 위(바다까지)만 색을 뺀다 (화면 전체를 칠하면 무거움)
    const hh = sb() + 60;
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = S.hush; ctx.fillStyle = '#808080';
    ctx.fillRect(-40, -40, W + 80, hh + 40);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.22 * S.hush; ctx.fillStyle = '#78736b';
    ctx.fillRect(-40, -40, W + 80, hh + 40);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  drawPaintingEdges();
  // 날아오는 천 조각도 색이 빠진 세상 위에 핑크로 (그 사람의 색)
  drawFlyers();
  drawFBurst();
  drawClashGauge();
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
  // 박이 울릴 때 화면 가장자리가 은은하게 조여 든다 (심장 박동을 몸으로 느끼게)
  // 한순간에 확 어두워지지 않게, 박에서 0.06초에 걸쳐 스며들었다가 천천히 풀린다 (광과민성 배려)
  if (S.started && S.groove !== 'none') {
    const since = (((beatPos() % 1) + 1) % 1) * spb();
    const env = since < 0.06 ? since / 0.06 : Math.exp(-(since - 0.06) * 4);
    if (env > 0.01) {
      vignette((reduceMotion ? 0.04 : 0.11) * env);
    }
  }
  mark('overlays');
  drawScore(acc);
  drawDyn(acc);
  mark('score+dyn');
  // 눈뜸: 하얀 빛 속에서 세상이 떠오른다
  if (S.reveal < 1) { ctx.globalAlpha = 1 - S.reveal; ctx.drawImage(backdrop.paper!, -40, -40, W + 80, H + 80); ctx.globalAlpha = 1; }
  drawSlowmo();
  drawStrings(acc);
  drawDuetStrings();
  mark('strings');
  // 쉼표가 차오를수록 화면 가장자리가 어두워진다 (침묵의 긴장)
  if (S.rest > 0) vignette(0.5 * S.rest);
  drawRest();
  drawBurst();
  drawHeavyPick();
  ctx.restore();
  drawWhite();
  // 눈뜸: 눈을 감은 어둠
  if (S.black > 0.001) { ctx.globalAlpha = S.black; ctx.fillStyle = '#0b0a08'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  drawRecall();
  drawEnding();
  drawCut();
  mark('end overlays+cut');
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
  // 제자리표(♮)를 얻은 뒤에는 원래 모습: 두 사람이 비친다 (복선 6 회수)
  if (S.natural) secondReflection();
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
    // 희망의 돛: 여섯 조각을 기웠다 (빛나는 조각 수 = F 폭발 게이지)
    if (S.hopeSail) hopeSailPatches(mx, p);
  }
  // mast
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(mx, -6); ctx.lineTo(mx, -132); ctx.stroke();
  // furled sail (돛이 아직 없을 때의 감긴 천)
  if (S.sail < 0.2 && S.scrap < 0.5) {
    ctx.lineWidth = 9; ctx.globalAlpha = (1 - S.sail * 5) * (1 - S.scrap * 2);
    ctx.beginPath(); ctx.moveTo(mx + 2, -118); ctx.lineTo(mx + 2, -40); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // 천 조각 돛: 모은 조각만큼 돛대에 핑크 천이 묶여 나부낀다 ('희망의 돛' 여섯 조각)
  const nPieces = Math.max(S.pieces, S.scrap > 0.01 ? 1 : 0);
  for (let i = 0; i < nPieces && S.sail < 0.6; i++) {
    const p = i === 0 ? S.scrap || 1 : 1, fl = Math.sin(S.t * 3.2 + i * 1.3) * 4, y0 = -126 + i * 17, len = 44 - i * 3;
    ctx.globalAlpha = Math.min(1, p * 1.5) * (1 - S.sail);
    ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx, y0); ctx.quadraticCurveTo(mx + len * 0.7 * p, y0 + 10 + fl, mx + len * p, y0 + 26 + fl);
    ctx.quadraticCurveTo(mx + len * 0.5 * p, y0 + 28, mx, y0 + 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 나: 배 뒤쪽에 앉아 기타를 안고 있다
  ctx.globalAlpha = 1 - S.swap; ctx.save(); ctx.translate(-76, -6); ctx.fillStyle = INK; ctx.strokeStyle = INK; figure(); ctx.restore();
  // 자리가 바뀐다 (챕터 5): 누워 있는 건 나, 기타를 안고 머리맡에 앉은 건 그 사람
  if (S.swap > 0.01) { ctx.globalAlpha = S.swap; meLying(); personWithGuitar(); }
  // 격돌 ②: 잠든 줄 알았던 그 사람이 일어나 기타를 안고 내 옆에 앉는다
  if (S.rise > 0.01 && S.swap < 0.5) { ctx.globalAlpha = S.rise; personWithGuitar(); }
  ctx.globalAlpha = 1;
  // 노
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-70, -16); ctx.lineTo(-104 + S.wobble * 80, 16); ctx.stroke();
  // 그 사람: 뱃머리에 누워 있다. 한 손이 내 쪽으로 뻗어 있다 (복선 1)
  // 겉옷을 풀어 돛에 준 뒤에는 몸이 가늘어지고 옅어지며, 아주 조금 떤다 (복선 7 회수)
  const shiver = S.bare ? Math.sin(S.t * 31) * 0.5 : 0;
  ctx.save(); ctx.globalAlpha = (1 - S.swap) * (1 - S.rise);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(74, -13 + shiver, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = S.bare ? INK_SOFT : INK;
  ctx.beginPath(); ctx.ellipse(46, -9 + shiver, S.bare ? 24 : 26, S.bare ? 5 : 7, -0.04, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
  // 자세는 내가 보지 않을 때 바뀐다: 0 내 쪽으로 뻗은 손, 1 가슴에 얹은 손, 2 뱃전 아래로 늘어진 손
  let arm: readonly number[] = ([[36, -26, 12, -22], [54, -22, 47, -15], [40, -4, 22, -2]] as const)[S.pose] ?? [36, -26, 12, -22];
  // 가시를 받는 손: 날아온 가시를 향해 손이 아주 조금 들린다 (잠결의 움직임처럼 짧게)
  if (S.catchT > 0) { const k = Math.sin(Math.PI * S.catchT); arm = [arm[0] + 6 * k, arm[1] - 22 * k, arm[2] + 34 * k, arm[3] - 30 * k]; }
  ctx.beginPath(); ctx.moveTo(62, -14); ctx.quadraticCurveTo(arm[0], arm[1], arm[2], arm[3]); ctx.stroke();
  ctx.beginPath(); ctx.arc(arm[2] - 2, arm[3], 2.6, 0, Math.PI * 2); ctx.fill();
  // 손목의 가는 금 (가시를 삼킨 흔적)
  if (S.crack > 0) {
    ctx.strokeStyle = 'rgba(234,230,222,.85)'; ctx.lineWidth = 0.7;
    const hx = arm[2] + 4, hy = arm[3];
    ctx.beginPath(); ctx.moveTo(hx - 1, hy - 2.5); ctx.lineTo(hx + 1, hy - 0.5); ctx.lineTo(hx - 0.5, hy + 0.8); ctx.lineTo(hx + 1.2, hy + 2.6); ctx.stroke();
    // 금이 팔꿈치까지 번졌다 (가시를 둘 삼킨 뒤)
    if (S.crack > 1) { ctx.beginPath(); ctx.moveTo(hx + 1.2, hy + 2.6); ctx.lineTo(hx + 8, hy + 1); ctx.lineTo(hx + 14, hy + 3); ctx.lineTo(hx + 22, hy + 1); ctx.lineTo(hx + 30, hy + 2); ctx.stroke(); }
    // 금이 어깨까지 (가시를 셋 삼킨 뒤)
    if (S.crack > 2) crackToShoulder(hx, hy);
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
  }
  // 핫핑크 띠. 천 조각을 얻을 때마다 조금씩 짧아진다 (복선 7)
  const sl = S.sash;
  ctx.strokeStyle = PINK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(54, -15); ctx.quadraticCurveTo(44, -4, 54 - 24 * sl, -12 + 4 * (1 - sl)); ctx.stroke();
  ctx.restore();
  // hull: one loaded brush stroke
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(104, -10); ctx.quadraticCurveTo(60, 4, 0, 0); ctx.quadraticCurveTo(-60, 4, -100, -14);
  ctx.quadraticCurveTo(-80, 18, 0, 20); ctx.quadraticCurveTo(78, 18, 104, -10); ctx.fill();
  ctx.strokeStyle = 'rgba(234,230,222,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 6); ctx.quadraticCurveTo(0, 13, -78, 2); ctx.stroke();
  ctx.restore();
}

/** 날아오는 천 조각: 돛대 꼭대기로 곡선을 그리며. 타 버리는 조각은 도중에 재가 된다 */
function drawFlyers() {
  const s = boatScale(), tx = boatX() - 8 * s, ty = boatY() - 118 * s;
  for (const f of fx.flyers) {
    const k = Math.min(1, (S.t - f.t) / f.dur);
    const x = lerp(f.x, tx, k), y = lerp(f.y, ty, k) - Math.sin(Math.PI * k) * 90;
    const burnt = f.burn ? Math.max(0, (k - 0.35) / 0.4) : 0;
    if (f.burn && k > 0.75) {
      if (Math.random() < 0.6) fx.parts.push({ x, y, vx: rand(-40, 40), vy: rand(-80, -20), r: rand(1, 2.5), life: 0.8, dec: 1.4, c: INK_SOFT });
      continue;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(S.t * 6 + f.t) * 0.6);
    ctx.globalAlpha = 1 - burnt * 0.6; ctx.fillStyle = burnt > 0.3 ? INK_SOFT : PINK; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, -12, 14, -4); ctx.lineTo(10, 8); ctx.quadraticCurveTo(-2, 4, -12, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (burnt > 0) { ctx.fillStyle = '#ffb347'; ctx.globalAlpha = 0.7 * (1 - burnt); ctx.beginPath(); ctx.arc(8, 4, 5 * burnt + 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

const mist = [...Array(8)].map((_, i) => ({ u: Math.random(), v: rand(0.05, 0.85), r: rand(0.18, 0.38), sp: rand(0.004, 0.012) * (i % 2 ? 1 : -1) }));
/** 안개·비네트처럼 넓고 부드러운 층은 화면의 1/4 해상도로 따로 그린 뒤 늘려 붙인다 (부드러운 그림이라 티가 안 나고, 그리는 양은 1/16) */
const LO = 4;
function lowRes(c: HTMLCanvasElement) {
  const w = Math.ceil(view.W / LO), h = Math.ceil(view.H / LO);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const g = c.getContext('2d')!;
  g.setTransform(1 / LO, 0, 0, 1 / LO, 0, 0); g.clearRect(0, 0, view.W, view.H);
  return g;
}
const mistCv = document.createElement('canvas');
function drawMist() {
  if (S.fog < 0.01) { for (const m of mist) m.u += m.sp * 0.016; return; }
  const { W, H } = view, g = lowRes(mistCv);
  for (const m of mist) {
    // 안개는 천천히 흘러간다. 화면 밖으로 완전히 나간 뒤에야 반대편으로 돌아온다 (순간 이동이 보이지 않게)
    // (이전 식은 매 프레임 화면 너비의 20%씩 건너뛰어 안개가 깜빡였다)
    m.u += m.sp * 0.016;
    const u = wrap(m.u - camX() * 0.6, -0.7, 1.7);
    const x = u * W, y = hz() + (sb() - hz()) * m.v, r = m.r * Math.max(W, H);
    // 배 바로 위에 짙은 안개가 앉으면 주인공이 사라져 보여서, 배 근처 안개는 조금 옅게
    const dist = Math.hypot((x - boatX()) / W, (y - boatY()) / H);
    const near = 0.5 + 0.5 * clamp((dist - 0.1) / 0.25, 0, 1);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(234,230,222,${0.62 * S.fog * near})`); gr.addColorStop(1, 'rgba(234,230,222,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 안개가 앉는 띠(수평선 위아래)만 붙인다
  const y0 = Math.max(0, hz() - H * 0.12), y1 = Math.min(H, sb() + H * 0.08);
  ctx.drawImage(mistCv, 0, y0 / LO, mistCv.width, (y1 - y0) / LO, 0, y0, W, y1 - y0);
}

/** 박의 비네트: 화면 크기가 바뀔 때만 실제 해상도로 한 번 그려 두고, 매 박에는 투명도만 바꿔 1:1로 붙인다 (늘려 붙이는 것보다 훨씬 가벼움) */
const vigCv = document.createElement('canvas');
let vigKey = '';
function vignette(alpha: number) {
  const { W, H, DPR } = view, key = W + 'x' + H + '@' + DPR;
  if (key !== vigKey) {
    vigKey = key;
    vigCv.width = Math.ceil(W * DPR); vigCv.height = Math.ceil(H * DPR);
    const g = vigCv.getContext('2d')!;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const gr = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.75);
    gr.addColorStop(0, 'rgba(20,18,15,0)'); gr.addColorStop(1, 'rgba(20,18,15,1)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = alpha; ctx.drawImage(vigCv, 0, 0, W, H); ctx.globalAlpha = 1;
}

function drawStrings(acc: string) {
  if (S.stringsVis < 0.01) return;
  const { W, H } = view;
  ctx.save(); ctx.globalAlpha = S.stringsVis;
  const top = H * 0.675;
  ctx.fillStyle = 'rgba(23,20,15,.045)'; ctx.fillRect(0, top, W, H - top);
  // 기타 침묵(1절)에는 줄이 흐려진다
  const base = S.stringsVis * (1 - 0.55 * S.hush);
  if (S.groove !== 'none' && S.pulse > 0.02) {
    ctx.strokeStyle = S.groove === 'heart' ? INK : acc; ctx.lineCap = 'round'; ctx.globalAlpha = 0.55 * S.pulse * base; ctx.lineWidth = 3 + 7 * S.pulse; ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, top + Math.sin(x * 0.04) * 1.2 + Math.sin(x * 0.13) * 0.6);
    ctx.stroke();
  }
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
  const sx = Math.max(16, view.W * 0.03), sy = sb() - 34, pop = 1 + S.seal * 0.35 + (S.groove !== 'none' ? 0.12 * S.pulse : 0), c = CHORDS[S.chord];
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
    // 마지막 가시 B♭: 심장 박동에 맞춰 핑크로 빛난다 (챕터 5 끝)
    if (i === 0 && S.bflat > 0.01) {
      ctx.save(); ctx.globalAlpha = S.bflat * (0.5 + 0.5 * S.pulse); ctx.shadowColor = PINK; ctx.shadowBlur = 18; ctx.fillStyle = PINK;
      ctx.translate(x, y); ctx.scale(1 + 0.25 * S.pulse, 1 + 0.25 * S.pulse); ctx.fillText('♭', 0, 0); ctx.restore();
    }
  });
  // 제자리표: 얻은 ♮이 오선 위에 놓인다
  if (S.natural) { ctx.save(); ctx.fillStyle = PINK; ctx.fillText('♮', kx + 14 + 4 * 15 + 4, ky + 2 * gap + 8); ctx.restore(); }
  const left = thorns.filter(t => !t.gone).length;
  ctx.globalAlpha = 0.65; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
  ctx.fillText(left ? `가시 ${left}` : '가시 없음', kx + w + 8, ky + gap * 2.6); ctx.globalAlpha = 1;
  drawHeart(kx + w + 66, ky + gap * 1.6, acc);
  drawBeatGuide(sx + 30, sy + 30, acc);
}

/** 먹 심장. 심장 소리처럼 박에 한 번(쿵), 바로 뒤에 한 번 더(쿵) 뛴다. 드럼 구간에선 박마다 한 번 */
function drawHeart(x: number, y: number, acc: string) {
  if (S.groove === 'none' || S.stringsVis < 0.5) return;
  const since = (((beatPos() % 1) + 1) % 1) * spb();
  const lub = S.pulse, dub = S.groove === 'heart' ? Math.max(0, 1 - Math.abs(since - 0.17) / 0.09) : 0;
  const k = 1.35 * (1 + 0.45 * lub + 0.25 * dub);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.globalAlpha = 0.45 + 0.55 * Math.max(lub, dub * 0.8); ctx.fillStyle = S.groove === 'heart' ? INK : acc;
  ctx.beginPath(); ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-11, 0, -10, -10, -5, -10); ctx.bezierCurveTo(-2, -10, 0, -7, 0, -5);
  ctx.bezierCurveTo(0, -7, 2, -10, 5, -10); ctx.bezierCurveTo(10, -10, 11, 0, 0, 8); ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
}

/**
 * 코드 도장 둘레의 박 안내 (리듬 게임의 '접근 원'):
 * 원이 줄어들다가 박에 딱 맞춰 도장 테두리에 닿는다. 그 위엔 다음에 칠 코드, 옆엔 판정 먹 도장
 */
function drawBeatGuide(cx: number, cy: number, acc: string) {
  if (S.groove !== 'none' && S.stringsVis > 0.5) {
    const ph = ((beatPos() % 1) + 1) % 1;
    const r = 44 + 70 * (1 - ph);
    // 노란 빗줄기가 곧 덮칠 때는 원이 노랗게 (팜뮤트 가드 신호)
    // 곧 덮칠 파도가 있으면: 노랑 = 가드(Shift), 파랑 = 카운터(세게)
    const cueCol = S.guardCue ? '#e0b800' : S.counterCue ? '#2f6bff' : null;
    ctx.save(); ctx.strokeStyle = cueCol ?? (S.groove === 'heart' ? INK : acc); ctx.lineWidth = (cueCol ? 5 : 3) + 3 * ph;
    ctx.globalAlpha = 0.2 + 0.7 * ph * ph;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // 박이 울린 순간: 도장 테두리가 번진다
    if (S.pulse > 0.05) { ctx.globalAlpha = 0.85 * S.pulse; ctx.lineWidth = 5 * S.pulse + 1; ctx.beginPath(); ctx.arc(cx, cy, 42 + 14 * (1 - S.pulse), 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  // 다음에 칠 코드
  if (S.nextChord) {
    const lab = CHORDS[S.nextChord].label, y = cy - 64;
    ctx.save(); ctx.translate(cx, y); ctx.rotate(-0.04);
    ctx.globalAlpha = 0.85; ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillRect(-26, -15, 52, 30); ctx.strokeRect(-26, -15, 52, 30);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${lab.length > 3 ? 15 : 20}px ${BRUSH}`; ctx.fillText(lab, 0, 1);
    ctx.font = `9px ${MONO}`; ctx.globalAlpha = 0.6; ctx.fillText('다음', 0, -22);
    ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(-5, 19); ctx.lineTo(0, 25); ctx.lineTo(5, 19); ctx.stroke();
    ctx.restore();
  }
  // 판정 먹 도장: 딱 맞음 ◎, 맞음 ○, 놓침은 번진 먹
  for (const m of fx.marks) {
    const e = S.t - m.t;
    if (e > 0.7) continue;
    const a = 1 - e / 0.7, mx = cx + 58, my = cy - 30 - e * 30;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = m.kind === 'miss' ? INK_SOFT : INK; ctx.lineWidth = 2.5;
    if (m.kind === 'miss') {
      ctx.fillStyle = INK_SOFT; ctx.globalAlpha = a * 0.5;
      ctx.beginPath(); ctx.ellipse(mx, my, 9, 5, 0.6, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.stroke();
      if (m.kind === 'perfect') { ctx.strokeStyle = acc; ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
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
