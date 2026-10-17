// 매 프레임 화면 전체를 그린다: 한지 → 산·섬 → 바다 → 파동 → 오브젝트 → 배 → 안개 → 이펙트 → 줄·악보 HUD
import { CHORDS } from '../data/chords';
import { MODES } from '../data/modes';
import { TEXT } from '../data/chapter0';
import { OBJ, S, fx, str, thorns, view, type WorldObj } from '../world/state';
import { boatY, hz, pos, sb, stringY, sx0, sx1 } from '../world/geometry';
import { clamp, lerp, rand } from '../util/math';
import { backdrop, ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, MONO, PAPER, VOLT } from './palette';

export function draw() {
  const { W, H } = view;
  ctx.drawImage(backdrop.paper!, 0, 0, W, H);
  ctx.save();
  if (S.shake > 0.3) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
  const acc = MODES[S.mode].accent;
  // far mountains (always visible, faint)
  for (const m of backdrop.mountains) {
    const g = ctx.createLinearGradient(0, hz() - H * 0.12, 0, hz() + 4);
    g.addColorStop(0, `rgba(23,20,15,${m.al})`); g.addColorStop(1, 'rgba(23,20,15,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, hz() + 6);
    m.pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W + 20, hz() + 6); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(23,20,15,.35)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, hz() + 2); ctx.lineTo(W, hz() + 2); ctx.stroke();
  OBJ.filter(o => o.kind === 'isle').forEach(drawIsle);
  // sea strokes
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const s of backdrop.sea) {
    const xx = s.x + Math.sin(S.t * 0.55 + s.ph) * 10 * (0.3 + s.d);
    ctx.globalAlpha = s.a; ctx.lineWidth = s.w;
    ctx.beginPath(); ctx.moveTo(xx, s.y); ctx.quadraticCurveTo(xx + s.len / 2, s.y - 1.6 * s.w, xx + s.len, s.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  drawRipples();
  OBJ.forEach(o => {
    if (o.kind === 'lamp') drawLamp(o);
    else if (o.kind === 'refl') drawRefl(o);
    else if (o.kind === 'whisper') drawWhisper(o);
  });
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
  if (S.flash > 0.01) {
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = S.flash * 0.75; ctx.fillStyle = S.flashCol;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  drawStrings(acc);
  drawScore(acc);
  drawDyn(acc);
  ctx.restore();
}

function drawIsle(o: WorldObj) {
  if (o.vis < 0.01) return;
  const p = pos(o), w = Math.min(view.W * 0.3, 260) * (o.s ?? 1), h = w * 0.5;
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
    const k = 1 - r.r / r.max, a = k * (0.18 + 0.55 * r.dyn + 0.12);
    ctx.strokeStyle = INK; ctx.globalAlpha = a; ctx.lineWidth = 0.8 + (1 - r.t) * 2.4 + r.dyn * 2.2;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = a * 0.45; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 0.9, r.r * 0.324, 0, 0, Math.PI * 2); ctx.stroke();
    if (r.dyn > 0.62) {
      ctx.strokeStyle = r.acc; ctx.globalAlpha = k * (r.dyn - 0.5) * 1.6; ctx.lineWidth = 1.6 + r.dyn * 2;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 0.96, r.r * 0.346, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawLamp(o: WorldObj) {
  const p = pos(o), acc = MODES[S.mode].accent, a = Math.max(o.vis, o.lit ? 1 : 0, o.found ? 0.32 : 0);
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
    const g = ctx.createRadialGradient(0, -26, 2, 0, -26, 58);
    g.addColorStop(0, acc); g.addColorStop(0.4, acc + '66'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(S.t * 3); ctx.fillStyle = g; ctx.fillRect(-60, -86, 120, 120);
    ctx.globalAlpha = 0.55; ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.beginPath();
    for (let y = 4; y < 70; y += 3) ctx.lineTo(Math.sin(y * 0.35 + S.t * 4) * 3, y);
    ctx.stroke();
  }
  ctx.globalAlpha = a; ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(0, 2, 14, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-5, -26); ctx.lineTo(5, -26); ctx.lineTo(7, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-11, -26); ctx.lineTo(0, -38); ctx.lineTo(11, -26); ctx.fill();
  ctx.fillStyle = o.lit ? VOLT : PAPER; ctx.fillRect(-3.5, -22, 7, 8);
  const showName = o.lit || o.found || o.detail > 0.15, lab = (o.hint && !showName) ? o.hint : CHORDS[o.chord!].label;
  const la = o.lit ? 1 : showName ? Math.max(o.detail, o.found ? 0.65 : 0) * a : (o.hint ? a : 0);
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
  const p = pos(o);
  ctx.save(); ctx.translate(p.x + Math.sin(S.t * 2) * 2, p.y); ctx.scale(1, -1);
  ctx.globalAlpha = v * 0.55; ctx.fillStyle = INK_SOFT; ctx.strokeStyle = INK_SOFT;
  // one seated figure holding a guitar. The bow sleeper casts nothing.
  ctx.beginPath(); ctx.arc(14, -34, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -27); ctx.quadraticCurveTo(2, -10, 6, -2); ctx.lineTo(24, -2); ctx.quadraticCurveTo(24, -16, 20, -27); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(34, -26); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(2, -8, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawWhisper(o: WorldObj) {
  if (o.vis < 0.02) return;
  const p = pos(o), txt = TEXT.whisper;
  ctx.save(); ctx.font = `${Math.min(30, view.W / 15)}px ${BRUSH}`; ctx.textAlign = 'center';
  const w = ctx.measureText(txt).width;
  let x = p.x - w / 2;
  ctx.textAlign = 'left';
  for (const ch of txt) {
    const cw = ctx.measureText(ch).width;
    ctx.globalAlpha = o.vis * (0.55 + 0.25 * Math.sin(S.t * 2 + x * 0.05)); ctx.fillStyle = INK_SOFT;
    ctx.fillText(ch, x, p.y + Math.sin(S.t * 1.4 + x * 0.03) * 2);
    x += cw;
  }
  ctx.globalAlpha = o.vis; ctx.fillStyle = MODES[S.mode].accent; ctx.fillRect(p.x + w / 2 + 8, p.y - 16, 10, 10);
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawBoat(acc: string) {
  const bx = view.W / 2, by = boatY() + Math.sin(S.t * 1.1) * 3, s = clamp(view.W / 900, 0.62, 1.15);
  ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(S.t * 0.9) * 0.025); ctx.scale(s, s);
  ctx.globalAlpha = 0.18; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 10, 112, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  // sail
  if (S.sail > 0.01) {
    const p = S.sail;
    ctx.fillStyle = 'rgba(234,230,222,.96)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(12, -128); ctx.quadraticCurveTo(12 + 110 * p, -80, 12 + 70 * p, -16); ctx.lineTo(12, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = acc; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(14, -122); ctx.quadraticCurveTo(12 + 100 * p, -78, 12 + 64 * p, -20); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(12, -128 + k * 27); ctx.lineTo(12 + (60 + 20 * Math.sin(k)) * p, -128 + k * 29); ctx.stroke(); }
  }
  // mast
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(12, -132); ctx.stroke();
  // furled sail
  if (S.sail < 0.2) {
    ctx.lineWidth = 9; ctx.globalAlpha = 1 - S.sail * 5;
    ctx.beginPath(); ctx.moveTo(14, -118); ctx.lineTo(14, -40); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // sleeper at the bow, with a sash in the accent color
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-74, -13, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-46, -9, 26, 7, 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = acc; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-54, -15); ctx.quadraticCurveTo(-44, -4, -30, -12); ctx.stroke();
  // hull: one loaded brush stroke
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-104, -10); ctx.quadraticCurveTo(-60, 4, 0, 0); ctx.quadraticCurveTo(60, 4, 100, -14);
  ctx.quadraticCurveTo(80, 18, 0, 20); ctx.quadraticCurveTo(-78, 18, -104, -10); ctx.fill();
  ctx.strokeStyle = 'rgba(234,230,222,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-80, 6); ctx.quadraticCurveTo(0, 13, 78, 2); ctx.stroke();
  ctx.restore();
}

const mist = [...Array(8)].map((_, i) => ({ u: Math.random(), v: rand(0.05, 0.85), r: rand(0.18, 0.38), sp: rand(0.004, 0.012) * (i % 2 ? 1 : -1) }));
function drawMist() {
  const { W, H } = view;
  for (const m of mist) {
    m.u = (m.u + m.sp * 0.016 + 1.4) % 1.4 - 0.2;
    const x = m.u * W, y = hz() + (sb() - hz()) * m.v, r = m.r * Math.max(W, H);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(234,230,222,.62)'); g.addColorStop(1, 'rgba(234,230,222,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function drawStrings(acc: string) {
  const { W, H } = view;
  const top = H * 0.675;
  ctx.fillStyle = 'rgba(23,20,15,.045)'; ctx.fillRect(0, top, W, H - top);
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.globalAlpha = 0.75; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = 0; x <= W; x += 12) ctx.lineTo(x, top + Math.sin(x * 0.04) * 1.2 + Math.sin(x * 0.13) * 0.6);
  ctx.stroke(); ctx.globalAlpha = 1;
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
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.92; ctx.lineWidth = th; path(); ctx.stroke();
    ctx.globalAlpha = 0.25; ctx.lineWidth = th * 0.5; ctx.setLineDash([26, 7, 10, 5]); ctx.lineDashOffset = i * 13;
    ctx.save(); ctx.translate(0, th * 0.45); path(); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
    if (s.hot > 0.62 && s.amp > 1.2) {
      ctx.globalAlpha = clamp(s.amp / 9, 0, 1) * (s.hot - 0.4); ctx.strokeStyle = acc; ctx.lineWidth = th + 2;
      ctx.shadowColor = acc; ctx.shadowBlur = 14; path(); ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 0.5; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
    ctx.fillText(String(6 - i), x0 + 6, y - 5);
  }
  ctx.globalAlpha = 1;
}

function drawScore(acc: string) {
  const sx = Math.max(16, view.W * 0.03), sy = sb() - 34, pop = 1 + S.seal * 0.35, c = CHORDS[S.chord];
  // chord seal
  ctx.save(); ctx.translate(sx + 30, sy + 30); ctx.rotate(-0.06); ctx.scale(pop, pop);
  if (S.chord === 'open') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(-28, -28, 56, 56); ctx.fillStyle = INK; ctx.font = `26px ${BRUSH}`;
  } else {
    ctx.fillStyle = acc; ctx.fillRect(-29, -29, 58, 58); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-29, -29, 58, 58);
    ctx.fillStyle = PAPER; ctx.font = `${c.label.length > 2 ? 28 : 36}px ${BRUSH}`;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.label, 0, 2); ctx.restore();
  // key signature: four flats are four thorns
  const kx = sx + 76, ky = sy + 12, gap = 7, w = 118;
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
  for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(kx, ky + l * gap); ctx.lineTo(kx + w, ky + l * gap + Math.sin(l) * 0.6); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.font = `22px "Gowun Batang",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  thorns.forEach((t, i) => {
    let x = kx + 14 + i * 15, y = ky + t.p * gap + 5, rot = 0, a = 1, col = INK;
    if (t.fly) {
      const e = S.t - t.fly.t;
      if (e > 1.6) return;
      x += t.fly.vx * e; y += t.fly.vy * e + 260 * e * e; rot = t.fly.rot * e; a = 1 - e / 1.6; col = acc;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText('♭', 0, 0); ctx.restore();
  });
  const left = thorns.filter(t => !t.gone).length;
  ctx.globalAlpha = 0.65; ctx.fillStyle = INK; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
  ctx.fillText(left ? `가시 ${left}` : '가시 없음', kx + w + 8, ky + gap * 2.6); ctx.globalAlpha = 1;
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
