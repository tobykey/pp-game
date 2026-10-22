// 챕터 3 그림: 후렴 등대, 파란 파도(공명 카운터), 여섯 조각을 기운 희망의 돛, 돛에 번지는 가사, 하얀 빛
import { CHORDS, type ChordId } from '../data/chords';
import { TEXT3 } from '../data/chapter3';
import { S, view } from '../world/state';
import { boatScale, boatX, boatY, hz, sb, toScreenX } from '../world/geometry';
import { grooveBeatPos } from '../world/rhythm';
import { ctx } from './canvas';
import { drawLighthouseBody } from './art/props';
import { BRUSH, INK, INK_SOFT, PAPER, VOLT, reduceMotion } from './palette';

const PINK = '#ff2a7f', BLUE = '#2f6bff';

/** 덮쳐 오는 파란 파도 (장면이 채운다) */
export const counterWaves: { beat: number; lead: number; shown: boolean; done: boolean; hit: boolean }[] = [];
/** 마디마다 하나씩 서는 등대 (장면이 채운다) */
export const lights: { wx: number; chord: ChordId; lit: boolean; up: boolean }[] = [];

/** 후렴 등대: 마디가 오면 그 마디 코드의 등대가 켜진다 */
export function drawLights() {
  for (const l of lights) {
    const x = toScreenX(l.wx);
    if (x < -80 || x > view.W + 80) continue;
    const y = l.up ? hz() + (sb() - hz()) * 0.12 : hz() + (sb() - hz()) * 0.9;
    ctx.save(); ctx.translate(x, y);
    if (l.lit) {
      const g = ctx.createRadialGradient(0, -48, 2, 0, -48, 70);
      g.addColorStop(0, l.chord === 'F' ? PINK : VOLT); g.addColorStop(1, 'rgba(255,226,61,0)');
      ctx.globalAlpha = 0.75; ctx.fillStyle = g; ctx.fillRect(-70, -118, 140, 140);
    }
    // 등대 (art/props.ts). 불 켜는 방의 창만 따로
    ctx.globalAlpha = l.lit ? 1 : 0.45; drawLighthouseBody(ctx);
    ctx.fillStyle = l.lit ? VOLT : PAPER; ctx.fillRect(-4, -52, 8, 7);
    ctx.globalAlpha = l.lit ? 0.95 : 0.5; ctx.fillStyle = INK; ctx.font = `22px ${BRUSH}`; ctx.textAlign = 'center';
    ctx.fillText(CHORDS[l.chord].label, 0, -74);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/**
 * 파란 빛: 받아칠 박의 lead 박 전에 뱃머리 앞에서 '짠!' 하고 솟는다 (옆에서 밀려오지 않는다).
 * 둘레의 원이 좁혀져 닿는 순간이 받아칠 박
 */
export function drawCounterWaves() {
  if (!counterWaves.length) return;
  const g = grooveBeatPos(), s = boatScale(), tx = boatX() + 150 * s, ty = boatY() - 10 * s;
  for (const w of counterWaves) {
    if (w.done || w.hit) continue;
    const k = (g - (w.beat - w.lead)) / w.lead; // 0: 나타남 → 1: 받아칠 박
    if (k < 0 || k > 1.25) continue;
    const age = k * w.lead * 60 / S.bpm; // 나타난 뒤 지난 초
    const pop = age < 0.12 ? 1.35 * (age / 0.12) : 1 + 0.35 * Math.exp(-(age - 0.12) * 14);
    const h = 70 * s;
    ctx.save(); ctx.translate(tx, ty); ctx.scale(pop, pop);
    // 좁혀 드는 원 (닿으면 지금!)
    const r = (46 + 120 * Math.max(0, 1 - k)) * s;
    ctx.globalAlpha = Math.min(1, 0.4 + k); ctx.strokeStyle = BLUE; ctx.lineWidth = 5 + 4 * Math.min(1, k);
    ctx.beginPath(); ctx.ellipse(0, -h * 0.45, r, r * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    // 솟은 파란 물마루
    ctx.fillStyle = 'rgba(47,107,255,.28)'; ctx.strokeStyle = BLUE; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-50 * s, 16 * s); ctx.quadraticCurveTo(-34 * s, -h, 14 * s, -h * 0.86); ctx.quadraticCurveTo(-12 * s, -h * 0.4, 28 * s, 16 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    // 짠! 하고 튀는 물보라 획
    if (age < 0.35) {
      ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.globalAlpha = 1 - age / 0.35;
      for (let i = 0; i < 8; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 7), r0 = 60 * s, r1 = r0 + 50 * s * (age / 0.35 + 0.3); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, -h * 0.4 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, -h * 0.4 + Math.sin(a) * r1); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = BLUE; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.font = `${Math.round(38 * s)}px ${BRUSH}`; ctx.textAlign = 'center';
    ctx.strokeText('ff', -10 * s, -h - 14 * s); ctx.fillText('ff', -10 * s, -h - 14 * s);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** 돛 게이지: 돛 위에 조각 여섯 칸. 무엇을 뜻하는지 글로도 붙인다 */
export function drawSailGauge() {
  if (!S.gaugeOn) return;
  const s = boatScale(), x = boatX() + 30 * s, y = boatY() - 185 * s, n = Math.floor(S.glow), full = n >= 6;
  ctx.save(); ctx.translate(x, y);
  ctx.font = `${Math.round(22 * s)}px ${BRUSH}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = INK; ctx.fillText('돛', -62 * s, 0);
  for (let i = 0; i < 6; i++) {
    const px = (-48 + i * 19) * s, lit = i < n, pop = lit && i === n - 1 ? 1 + 0.6 * S.glowPop : 1;
    ctx.save(); ctx.translate(px, 0); ctx.rotate(Math.PI / 4); ctx.scale(pop, pop);
    ctx.fillStyle = lit ? VOLT : 'rgba(255,42,127,.25)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    if (lit && full) { ctx.shadowColor = PINK; ctx.shadowBlur = 10; }
    ctx.fillRect(-6 * s, -6 * s, 12 * s, 12 * s); ctx.strokeRect(-6 * s, -6 * s, 12 * s, 12 * s);
    ctx.restore();
  }
  ctx.textAlign = 'left';
  if (full) {
    const k = 0.75 + 0.25 * Math.sin(S.t * 6);
    ctx.font = `${Math.round(26 * s)}px ${BRUSH}`; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.globalAlpha = k;
    ctx.strokeText('F 준비!', 72 * s, 0); ctx.fillStyle = VOLT; ctx.fillText('F 준비!', 72 * s, 0);
  } else { ctx.fillStyle = INK_SOFT; ctx.fillText(`${n} / 6`, 72 * s, 0); }
  ctx.restore(); ctx.globalAlpha = 1;
}

/**
 * F 폭발: 큰 붓글씨 F가 찍히고, 핑크·노랑이 배에서 화면 끝까지 번졌다가 천천히 걷힌다.
 * 번쩍이지 않고 번진다 (광과민성). '흔들림·섬광 줄이기'에서는 옅게
 */
export function drawFBurst() {
  if (S.fburst < 0.01) return;
  const { W, H } = view, e = 1 - S.fburst, x = boatX(), y = boatY() - 40;
  ctx.save();
  // 번짐: 처음 0.25 동안 화면 끝까지 퍼진다
  const R = Math.max(W, H) * (0.15 + 1.1 * Math.min(1, e / 0.25));
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, 'rgba(255,226,61,1)'); g.addColorStop(0.45, 'rgba(255,42,127,.9)'); g.addColorStop(1, 'rgba(255,42,127,0)');
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = (reduceMotion ? 0.25 : 0.55) * Math.min(1, S.fburst * 1.6); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  // 갈라지는 바다: 배 앞뒤로 하얀 물살
  ctx.globalAlpha = S.fburst; ctx.strokeStyle = PAPER; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const yy = y + 40 + i * 14, len = W * (0.2 + 0.6 * Math.min(1, e / 0.3)) * (1 - i * 0.1);
    ctx.lineWidth = 10 - i;
    ctx.beginPath(); ctx.moveTo(x - 40, yy); ctx.lineTo(x - 40 - len, yy + i * 6); ctx.stroke();
  }
  // 커다란 붓글씨 F
  const sc = 1 + 0.5 * Math.exp(-e * 12);
  ctx.translate(W * 0.5, H * 0.42); ctx.scale(sc, sc); ctx.rotate(-0.06);
  ctx.globalAlpha = Math.min(1, S.fburst * 1.8) * 0.92;
  ctx.font = `${Math.round(H * 0.62)}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText('F', 0, 0);
  ctx.fillStyle = PINK; ctx.fillText('F', 0, 0);
  ctx.restore(); ctx.globalAlpha = 1;
}

/**
 * 희망의 돛 (배 그림 좌표계 안에서 호출): 한지 바탕에 여섯 조각을 기웠다.
 * 박에 맞출 때마다 조각이 하나씩 형광으로 빛난다 (F 폭발 게이지)
 */
export function hopeSailPatches(mx: number, p: number) {
  const pts = (u: number, v: number) => {
    // 돛 안쪽 좌표 (u: 돛대→바깥, v: 위→아래)
    const top = -128, bot = -16, y = top + (bot - top) * v;
    const outer = mx + (110 * p) * Math.sin(Math.PI * (0.18 + 0.62 * v)) * (0.62 + 0.38 * v);
    return [mx + (outer - mx) * u, y] as const;
  };
  for (let i = 0; i < 6; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const u0 = 0.08 + col * 0.46, u1 = u0 + 0.4, v0 = 0.12 + row * 0.28, v1 = v0 + 0.24;
    const a = pts(u0, v0), b = pts(u1, v0), c = pts(u1, v1), d = pts(u0, v1);
    const lit = i < Math.floor(S.glow);
    ctx.save();
    if (lit) { ctx.shadowColor = VOLT; ctx.shadowBlur = 14; }
    // 평소엔 한지에 옅게 물든 천 조각, 빛날 때만 형광. 가장자리는 바늘땀
    ctx.fillStyle = lit ? VOLT : PINK; ctx.globalAlpha = (lit ? 0.9 : 0.38) * p;
    const j = (i * 0.37) % 0.8 - 0.4; // 조각마다 조금씩 비뚤게 기움
    ctx.beginPath(); ctx.moveTo(a[0] + j, a[1]); ctx.lineTo(b[0], b[1] + j); ctx.lineTo(c[0] - j, c[1]); ctx.lineTo(d[0], d[1] - j); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 0.7 * p; ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.setLineDash([2.2, 2]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
}

/** 돛에 번지는 원곡 가사 한 줄 */
export function drawLyric() {
  if (S.lyric < 0.01) return;
  const s = boatScale();
  ctx.save(); ctx.globalAlpha = 0.85 * S.lyric; ctx.fillStyle = INK; ctx.font = `${Math.round(30 * Math.min(1.2, s))}px ${BRUSH}`; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(234,230,222,1)'; ctx.shadowBlur = 12;
  ctx.fillText(TEXT3.lyric, boatX(), boatY() - 170 * s);
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 화면을 덮는 하얀 빛 (그 사이에 무슨 일이 있었는지는 보여 주지 않는다) */
export function drawWhite() {
  if (S.white < 0.01) return;
  ctx.save(); ctx.globalAlpha = S.white; ctx.fillStyle = '#fbf8f2'; ctx.fillRect(0, 0, view.W, view.H); ctx.restore(); ctx.globalAlpha = 1;
}
