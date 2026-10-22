// 진실 컷의 방 (꿈 바깥의 밤): 창으로 든 달빛이 침대에 내려앉고, 핑크 담요를 덮고 잠든 나, 머리맡의 빈 의자
// 움직이지 않는 부분만 붓으로 미리 그려 둔다. 기타를 치는 그 사람과 소리의 파동, 글씨는 컷이 매 프레임 그린다
import { view } from '../../world/state';
import { bleed, canvas, dryBrush, smooth, stroke, type Pt } from './brush';
import { fbm, rng } from './noise';

const INK = '#17140f', PAPER = '#eae6de', PINK = '#ff2a7f';
let cached: HTMLCanvasElement | null = null, key = '';

/** 붓으로 그은 선 하나 (가운데가 조금 굵고 양 끝이 들린다) */
function line(g: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, seed: number, color = INK) {
  const r = rng(seed), m: Pt = [(a[0] + b[0]) / 2 + (r() - 0.5) * 3, (a[1] + b[1]) / 2 + (r() - 0.5) * 3];
  stroke(g, smooth([a, m, b], 8), t => w * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05))), color, seed, 0.25);
}

export function bedroom(): HTMLCanvasElement {
  const { W, H, DPR } = view, k = W + 'x' + H + '@' + DPR;
  if (cached && key === k) return cached;
  const s = Math.min(W, H) / 800, { c, g } = canvas(W, H, Math.min(DPR, 1.5));
  // 밤의 먹빛: 위가 짙고, 고르지 않게 스민 결
  {
    const lw = Math.ceil(W / 8), lh = Math.ceil(H / 8), m = document.createElement('canvas'); m.width = lw; m.height = lh;
    const mg = m.getContext('2d')!, img = mg.createImageData(lw, lh);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const n = fbm(x / 14, y / 14, 5, 4), k2 = (y * lw + x) * 4, base = 0.32 - 0.24 * (y / lh);
      img.data[k2] = 23; img.data[k2 + 1] = 20; img.data[k2 + 2] = 15; img.data[k2 + 3] = Math.round(Math.max(0, base + (n - 0.5) * 0.12) * 255);
    }
    mg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(m, 0, 0, W, H);
  }
  // 창과 달, 그리고 침대로 비스듬히 내려오는 달빛
  const wx = W * 0.62, wy = H * 0.14, ww = 150 * s, wh = 190 * s;
  const bx = W * 0.4, by = H * 0.6, bw = W * 0.46, bh = 70 * s;
  g.fillStyle = 'rgba(244,240,232,.16)';
  g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww, wy); g.lineTo(bx + bw * 0.95, by + bh); g.lineTo(bx + bw * 0.18, by + bh); g.closePath(); g.fill();
  g.fillStyle = 'rgba(244,240,232,.55)'; g.fillRect(wx, wy, ww, wh);
  g.fillStyle = PAPER; g.beginPath(); g.arc(wx + 40 * s, wy + 50 * s, 18 * s, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(23,20,15,.35)'; g.lineWidth = 1; g.stroke();
  line(g, [wx, wy], [wx + ww, wy], 4 * s, 1); line(g, [wx, wy + wh], [wx + ww, wy + wh], 4 * s, 2);
  line(g, [wx, wy], [wx, wy + wh], 4 * s, 3); line(g, [wx + ww, wy], [wx + ww, wy + wh], 4 * s, 4);
  line(g, [wx + ww / 2, wy], [wx + ww / 2, wy + wh], 3 * s, 5);
  // 바닥 (마른 붓 한 획)
  dryBrush(g, smooth([[W * 0.05, H * 0.84], [W * 0.5, H * 0.845], [W * 0.95, H * 0.84]], 8), 7 * s, INK, { seed: 9, bristles: 10, dry: 0.3, alpha: 0.7 });
  // 침대: 한지 빛 요, 먹 테두리, 머리판
  g.fillStyle = 'rgba(234,230,222,.95)'; g.fillRect(bx, by, bw, bh);
  line(g, [bx, by], [bx + bw, by], 3.5 * s, 11); line(g, [bx, by + bh], [bx + bw, by + bh], 5 * s, 12);
  line(g, [bx, by + bh], [bx, H * 0.84], 5 * s, 13); line(g, [bx + bw, by + bh], [bx + bw, H * 0.84], 5 * s, 14);
  line(g, [bx - 4, by - 70 * s], [bx - 4, H * 0.84], 6 * s, 15);
  // 베개와 잠든 나 (머리칼이 베개에 흩어진다)
  g.fillStyle = 'rgba(240,236,228,1)'; g.beginPath(); g.ellipse(bx + 50 * s, by - 6 * s, 44 * s, 18 * s, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2 * s; g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(bx + 54 * s, by - 18 * s, 16 * s, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 5; i++) line(g, [bx + 44 * s, by - 22 * s + i * 3 * s], [bx + 24 * s - i * 3 * s, by - 10 * s + i * 4 * s], 2.2 * s, 20 + i);
  // 핑크 담요 (밤의 방에서 거절했던 그 색) + 주름
  g.fillStyle = PINK; g.beginPath();
  g.moveTo(bx + 80 * s, by + 4 * s); g.quadraticCurveTo(bx + bw * 0.5, by - 34 * s, bx + bw - 10 * s, by - 6 * s);
  g.lineTo(bx + bw - 6 * s, by + bh * 0.7); g.lineTo(bx + 76 * s, by + bh * 0.7); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,10,50,.35)'; g.lineWidth = 2 * s; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(bx + (130 + i * 90) * s, by - (14 - i * 3) * s); g.quadraticCurveTo(bx + (150 + i * 90) * s, by + 12 * s, bx + (140 + i * 90) * s, by + bh * 0.6); g.stroke(); }
  line(g, [bx + 80 * s, by + 4 * s], [bx + bw - 10 * s, by - 6 * s], 2.5 * s, 30);
  // 머리맡의 의자
  const px = W * 0.2, py = H * 0.8;
  line(g, [px - 26 * s, py], [px + 96 * s, py], 5 * s, 40);
  line(g, [px - 20 * s, py], [px - 20 * s, H * 0.84], 4 * s, 41); line(g, [px + 90 * s, py], [px + 90 * s, H * 0.84], 4 * s, 42);
  cached = bleed(c, 1.4 * Math.min(DPR, 1.5), 0.45); key = k;
  return cached;
}
