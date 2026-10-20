// 챕터 3 그림: 후렴 등대, 파란 파도(공명 카운터), 여섯 조각을 기운 희망의 돛, 돛에 번지는 가사, 하얀 빛
import { CHORDS, type ChordId } from '../data/chords';
import { TEXT3 } from '../data/chapter3';
import { S, view } from '../world/state';
import { boatScale, boatX, boatY, hz, sb, toScreenX } from '../world/geometry';
import { grooveBeatPos } from '../world/rhythm';
import { ctx } from './canvas';
import { BRUSH, INK, PAPER, VOLT } from './palette';

const PINK = '#ff2a7f', BLUE = '#2f6bff';

/** 덮쳐 오는 파란 파도 (장면이 채운다) */
export const counterWaves: { beat: number; done: boolean; hit: boolean }[] = [];
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
    ctx.globalAlpha = l.lit ? 1 : 0.45; ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-6, -38); ctx.lineTo(6, -38); ctx.lineTo(9, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, -38); ctx.lineTo(0, -54); ctx.lineTo(12, -38); ctx.fill();
    ctx.fillStyle = l.lit ? VOLT : PAPER; ctx.fillRect(-3.5, -34, 7, 9);
    ctx.globalAlpha = l.lit ? 0.95 : 0.5; ctx.fillStyle = INK; ctx.font = `22px ${BRUSH}`; ctx.textAlign = 'center';
    ctx.fillText(CHORDS[l.chord].label, 0, -60);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** 파란 파도: 박 두 개 전에 앞쪽에서 밀려와 박에 맞춰 배에 닿는다 */
export function drawCounterWaves() {
  if (!counterWaves.length) return;
  const g = grooveBeatPos(), tx = boatX() + 50, ty = boatY() - 10;
  for (const w of counterWaves) {
    if (w.done || w.hit) continue;
    const k = 1 - (w.beat - g) / 2;
    if (k < 0 || k > 1.15) continue;
    const x = tx + view.W * 0.55 * (1 - k), h = 40 + 30 * k;
    ctx.save(); ctx.translate(x, ty); ctx.globalAlpha = Math.min(1, k * 1.4);
    ctx.fillStyle = 'rgba(47,107,255,.18)'; ctx.strokeStyle = BLUE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-40, 20); ctx.quadraticCurveTo(-30, -h, 10, -h * 0.8); ctx.quadraticCurveTo(-10, -h * 0.4, 20, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = BLUE; ctx.font = `24px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText('ff', -8, -h - 8);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
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
    ctx.fillStyle = lit ? VOLT : PINK; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    // 평소엔 한지에 옅게 물든 조각, 빛날 때만 형광
    ctx.globalAlpha = (lit ? 0.9 : 0.32) * p;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
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
