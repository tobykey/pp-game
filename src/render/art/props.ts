// 바다 위의 사물 그림 (미리 그려 두고 붙인다): 석등(등불), 먹 바위, 등대
// 모두 사물 좌표계(밑동 가운데 = 0,0)에서 그리고, 붙일 때 같은 자리에 맞춘다
import { view } from '../../world/state';
import { bleed, canvas, dryBrush, smooth, type Pt } from './brush';
import { rng } from './noise';

const INK = '#17140f', PAPER = '#eae6de';

type Sprite = { img: HTMLCanvasElement; x: number; y: number; w: number; h: number };
const cache = new Map<string, Sprite>();
function sprite(key: string, x: number, y: number, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void, blur = 0.8): Sprite {
  const sc = view.DPR * 2, k = key + '@' + sc;
  let s = cache.get(k);
  if (!s) {
    const { c, g } = canvas(w, h, sc);
    g.translate(-x, -y); paint(g);
    s = { img: blur ? bleed(c, blur * sc, 0.5) : c, x, y, w, h };
    cache.set(k, s);
  }
  return s;
}
const put = (ctx: CanvasRenderingContext2D, s: Sprite) => ctx.drawImage(s.img, s.x, s.y, s.w, s.h);

/**
 * 석등: 연꽃 받침 · 가는 기둥 · 받침돌 · 불을 넣는 화사석(창은 따로 그려 불빛을 바꾼다) · 끝이 들린 지붕돌 · 보주
 * 창 자리: (-3, -35) 6×6
 */
export function drawLanternBody(ctx: CanvasRenderingContext2D) {
  put(ctx, sprite('lantern', -20, -52, 40, 60, g => {
    g.fillStyle = INK; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round';
    // 물에 닿은 그림자
    g.globalAlpha = 0.25; g.beginPath(); g.ellipse(0, 4, 16, 3, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    // 연꽃 받침 (꽃잎 다섯)
    g.beginPath(); g.moveTo(-12, 2); g.quadraticCurveTo(0, 5, 12, 2); g.lineTo(9, -3); g.quadraticCurveTo(0, -1, -9, -3); g.closePath(); g.fill();
    g.strokeStyle = PAPER; g.globalAlpha = 0.45; g.lineWidth = 0.7;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 4.5, 1.5); g.quadraticCurveTo(i * 4.5 - 1.5, -1, i * 4.5, -2.5); g.stroke(); }
    g.globalAlpha = 1; g.strokeStyle = INK;
    // 가는 기둥 (한쪽에 빛)
    g.fillRect(-3, -24, 6, 22);
    g.fillStyle = 'rgba(234,230,222,.28)'; g.fillRect(-2.2, -23, 1.4, 20); g.fillStyle = INK;
    // 받침돌
    g.beginPath(); g.moveTo(-9, -24); g.lineTo(9, -24); g.lineTo(7, -27); g.lineTo(-7, -27); g.closePath(); g.fill();
    // 화사석: 창 자리는 비워 둔다
    g.fillRect(-7, -37, 14, 10);
    // 지붕돌: 처마 끝이 살짝 들린다
    g.beginPath(); g.moveTo(-16, -36.5); g.quadraticCurveTo(-11, -38, -6, -43); g.quadraticCurveTo(0, -46, 6, -43); g.quadraticCurveTo(11, -38, 16, -36.5);
    g.quadraticCurveTo(12, -36.8, 9, -37.2); g.lineTo(-9, -37.2); g.quadraticCurveTo(-12, -36.8, -16, -36.5); g.fill();
    // 보주
    g.beginPath(); g.arc(0, -47.5, 2.2, 0, Math.PI * 2); g.fill();
    // 돌의 결 (마른 붓)
    dryBrush(g, smooth([[-6, -36], [-2, -33], [5, -29]], 4), 3, '#6b6256', { seed: 4, bristles: 4, dry: 0.5, alpha: 0.5 });
  }));
}

/** 먹 바위 세 가지: 각진 덩어리 + 마른 붓 준법 + 밝게 남긴 면 */
export function drawRockBody(ctx: CanvasRenderingContext2D, variant: number) {
  const v = Math.abs(variant) % 3;
  put(ctx, sprite('rock' + v, -50, -58, 100, 72, g => {
    const r = rng(v * 7 + 3);
    // 물에 비친 그림자
    g.fillStyle = INK; g.globalAlpha = 0.18; g.beginPath(); g.ellipse(0, 10, 50, 6, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    // 실루엣: 봉우리 2~3개
    const peaks: Pt[] = [[-40, 8]];
    const n = 5 + v;
    for (let i = 1; i < n; i++) { const t = i / n; peaks.push([-40 + 80 * t + (r() - 0.5) * 8, -12 - 34 * Math.sin(Math.PI * t) * (0.6 + r() * 0.5)]); }
    peaks.push([42, 8]);
    const grad = g.createLinearGradient(0, -50, 0, 10);
    grad.addColorStop(0, '#2a2520'); grad.addColorStop(1, '#100e0b');
    g.fillStyle = grad; g.beginPath(); g.moveTo(peaks[0][0], peaks[0][1]);
    for (const p of peaks) g.lineTo(p[0], p[1]);
    g.closePath(); g.fill();
    // 밝게 남긴 면 (빛 받는 쪽)
    g.save(); g.beginPath(); g.moveTo(peaks[0][0], peaks[0][1]); for (const p of peaks) g.lineTo(p[0], p[1]); g.closePath(); g.clip();
    g.fillStyle = 'rgba(234,230,222,.16)';
    for (let i = 1; i < peaks.length - 2; i += 2) { const [x, y] = peaks[i]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y + 26); g.lineTo(x - 4, y + 30); g.closePath(); g.fill(); }
    // 준법: 비탈을 따라 내려가는 마른 붓
    for (let i = 1; i < peaks.length - 1; i++) {
      const [x, y] = peaks[i];
      dryBrush(g, smooth([[x, y + 2], [x + 5 + r() * 4, y + 14], [x + 2, y + 30]], 4), 4 + r() * 3, '#6b6256', { seed: i + v * 10, bristles: 5, dry: 0.5, alpha: 0.5 });
    }
    g.restore();
  }, 0.9));
}

/** 등대: 돌로 쌓은 탑(위로 갈수록 좁음, 띠) + 불을 켜는 방(창은 따로) + 지붕. 창 자리: (-4, -50) 8×8 */
export function drawLighthouseBody(ctx: CanvasRenderingContext2D) {
  put(ctx, sprite('lighthouse', -16, -70, 32, 76, g => {
    g.fillStyle = INK;
    g.globalAlpha = 0.22; g.beginPath(); g.ellipse(0, 3, 15, 3, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    // 탑
    g.beginPath(); g.moveTo(-10, 2); g.lineTo(-6, -42); g.lineTo(6, -42); g.lineTo(10, 2); g.closePath(); g.fill();
    // 돌 띠 (한지 빛)
    g.strokeStyle = 'rgba(234,230,222,.3)'; g.lineWidth = 0.8;
    for (let k = 0; k < 5; k++) { const y = -6 - k * 8, w = 9.5 - k * 0.8; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(234,230,222,.22)'; g.fillRect(-2, -40, 1.5, 40);
    // 난간 · 불 켜는 방 · 지붕
    g.fillStyle = INK; g.fillRect(-9, -44, 18, 2.5);
    g.fillRect(-6, -54, 12, 10);
    g.beginPath(); g.moveTo(-9, -54); g.lineTo(0, -64); g.lineTo(9, -54); g.closePath(); g.fill();
    g.beginPath(); g.arc(0, -65, 1.6, 0, Math.PI * 2); g.fill();
    dryBrush(g, smooth([[-7, -2], [-5, -20], [-4, -38]], 4), 3, '#6b6256', { seed: 8, bristles: 4, dry: 0.5, alpha: 0.45 });
  }, 0.6));
}
