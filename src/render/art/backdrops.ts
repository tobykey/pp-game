// 배경 그림 (화면 크기가 바뀔 때 한 번만 그려 둔다): 한지, 수묵 산, 물빛, 물결 붓 자국
import { view } from '../../world/state';
import { hz, sb } from '../../world/geometry';
import { bleed, canvas, dryBrush, smooth, type Pt } from './brush';
import { fbm, rng } from './noise';

const INK = '#17140f';

/**
 * 한지: 따뜻한 바탕 + 큰 얼룩(종이가 고르지 않게 빨아들인 자국) + 긴 닥나무 섬유 + 잔 티 + 가장자리 바램
 */
export function makePaperArt(): HTMLCanvasElement {
  const { W, H, DPR } = view;
  const { c, g } = canvas(W, H, DPR);
  // 위는 조금 밝고 아래는 조금 따뜻하게
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#ece8e0'); base.addColorStop(1, '#e6e0d5');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // 큰 얼룩: 낮은 해상도의 노이즈를 늘려 붙인다
  {
    const lw = Math.ceil(W / 6), lh = Math.ceil(H / 6), m = document.createElement('canvas'); m.width = lw; m.height = lh;
    const mg = m.getContext('2d')!, img = mg.createImageData(lw, lh);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const n = fbm(x / 26, y / 26, 7, 5), k = (y * lw + x) * 4;
      // 어두운 얼룩만 아주 옅게 (0~0.07)
      const a = Math.max(0, n - 0.5) * 0.16;
      img.data[k] = 110; img.data[k + 1] = 92; img.data[k + 2] = 66; img.data[k + 3] = Math.round(a * 255);
    }
    mg.putImageData(img, 0, 0);
    g.imageSmoothingQuality = 'high'; g.drawImage(m, 0, 0, W, H);
  }
  const r = rng(11);
  // 긴 닥나무 섬유: 밝은 것과 어두운 것
  g.lineCap = 'round';
  for (let i = 0; i < W * H / 1800; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI * 2, l = 10 + r() * 46, bend = (r() - 0.5) * 1.2;
    const light = r() < 0.45;
    g.strokeStyle = light ? `rgba(255,253,248,${0.25 + r() * 0.35})` : `rgba(60,48,32,${0.04 + r() * 0.07})`;
    g.lineWidth = 0.3 + r() * 0.7;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + bend) * l * 0.5, y + Math.sin(a + bend) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  // 잔 티
  for (let i = 0; i < W * H / 320; i++) {
    g.fillStyle = `rgba(40,32,22,${0.02 + r() * 0.06})`;
    g.fillRect(r() * W, r() * H, 0.4 + r() * 1.2, 0.4 + r() * 1.2);
  }
  // 가장자리가 오래된 종이처럼 바램
  const v = g.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.32, W / 2, H * 0.5, Math.max(W, H) * 0.82);
  v.addColorStop(0, 'rgba(90,70,45,0)'); v.addColorStop(1, 'rgba(90,70,45,.17)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

/** 수묵 산 세 겹 (먼 산일수록 옅고 흐림). 가로로 이어 붙여 끝없이 흐른다 */
export interface MountainLayer { img: HTMLCanvasElement; w: number; top: number; h: number; par: number }
export function makeMountainsArt(): MountainLayer[] {
  const { W, H, DPR } = view;
  const P = Math.round(W * 2); // 한 장의 폭 = 이어 붙는 주기
  const top = hz() - H * 0.13, h = hz() - top + 6;
  const specs = [
    { amp: 0.75, lift: 0.18, alpha: 0.12, blur: 3, par: 0.025, seed: 3, dots: 0, k: 6 },
    { amp: 0.7, lift: 0.08, alpha: 0.2, blur: 1.4, par: 0.05, seed: 9, dots: 0.4, k: 9 },
    { amp: 0.45, lift: 0, alpha: 0.3, blur: 0.6, par: 0.09, seed: 21, dots: 1, k: 14 },
  ];
  return specs.map(sp => {
    const { c, g } = canvas(P, h, DPR);
    const ridge: Pt[] = [];
    // 능선: 주기 P로 이어지는 노이즈 (k = 한 주기 안의 큰 봉우리 수)
    for (let x = 0; x <= P; x += 4) {
      const n = fbm((x / P) * sp.k, sp.seed, sp.seed, 5, sp.k);
      ridge.push([x, h - h * sp.lift - h * sp.amp * Math.pow(n, 1.5)]);
    }
    // 1) 먹 번짐: 능선이 가장 진하고 아래로 갈수록 안개에 묻힌다
    const grad = g.createLinearGradient(0, h * 0.15, 0, h);
    grad.addColorStop(0, `rgba(23,20,15,${sp.alpha})`); grad.addColorStop(0.7, `rgba(23,20,15,${sp.alpha * 0.4})`); grad.addColorStop(1, 'rgba(23,20,15,0)');
    g.fillStyle = grad; g.beginPath(); g.moveTo(0, h);
    for (const [x, y] of ridge) g.lineTo(x, y);
    g.lineTo(P, h); g.closePath(); g.fill();
    // 2) 먹이 고르지 않게 스민 결: 노이즈로 군데군데 덜어 낸다
    {
      const lw = Math.ceil(P / 4), lh = Math.ceil(h / 4), m = document.createElement('canvas'); m.width = lw; m.height = lh;
      const mg = m.getContext('2d')!, img = mg.createImageData(lw, lh);
      for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
        const n = fbm((x / lw) * sp.k * 6, y / 9, sp.seed + 40, 4, sp.k * 6), k = (y * lw + x) * 4;
        img.data[k + 3] = Math.round(Math.max(0, n - 0.42) * 1.6 * 255);
      }
      mg.putImageData(img, 0, 0);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.75; g.drawImage(m, 0, 0, P, h); g.restore();
    }
    // 3) 능선을 따라 한 번 더 진하게 (붓이 처음 닿은 자리)
    g.save(); g.globalAlpha = sp.alpha * 1.6; g.strokeStyle = INK; g.lineWidth = 1.2 + sp.dots * 1.4; g.lineJoin = 'round';
    g.filter = `blur(${1 + sp.dots}px)`;
    g.beginPath(); ridge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
    // 4) 미점: 가까운 산 능선에 찍은 작은 먹점 (나무·이끼)
    const r = rng(sp.seed * 5);
    g.fillStyle = INK;
    for (let i = 0; i < ridge.length; i += 2) {
      if (r() > 0.22 * sp.dots) continue;
      const [x, y] = ridge[i];
      g.globalAlpha = sp.alpha * (0.8 + r() * 0.8);
      g.beginPath(); g.ellipse(x + (r() - 0.5) * 6, y + 1 + r() * 5, 1.2 + r() * 2.2, 0.8 + r() * 1.2, 0, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    return { img: bleed(c, sp.blur * DPR, 0.7), w: P, top, h, par: sp.par };
  });
}

/** 물빛: 수평선 쪽은 먹이 옅게 비치고 아래로 갈수록 한지로, 그 위에 아주 옅은 가로 붓결 */
export function makeWaterArt(): HTMLCanvasElement {
  const { W, DPR } = view, top = hz(), bot = sb() + 30, h = bot - top;
  const { c, g } = canvas(W, h, DPR);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(70,72,74,.13)'); grad.addColorStop(0.18, 'rgba(70,72,74,.05)'); grad.addColorStop(1, 'rgba(70,72,74,0)');
  g.fillStyle = grad; g.fillRect(0, 0, W, h);
  const r = rng(77);
  for (let i = 0; i < 60; i++) {
    const y = Math.pow(r(), 1.6) * h * 0.95, x = r() * W, len = 80 + r() * 260;
    dryBrush(g, [[x, y], [x + len * 0.5, y + (r() - 0.5) * 2], [x + len, y]], 2 + r() * 4, INK, { seed: i, bristles: 4, dry: 0.6, alpha: 0.045 });
  }
  return c;
}

/** 물결 붓 자국 여덟 가지 (가늘게 시작해 눌렀다가 들리는 마른 붓). 매 프레임 늘려 붙인다 */
export function makeSeaStrokes(): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  const w = 160, h = 16, sc = Math.max(1.5, view.DPR * 1.25);
  for (let v = 0; v < 8; v++) {
    const { c, g } = canvas(w, h, sc), r = rng(v * 13 + 5);
    const lift = (r() - 0.5) * 4;
    const pts: Pt[] = smooth([[4, h / 2 + 1], [w * 0.35, h / 2 - 1.5 + lift], [w * 0.7, h / 2 - 1 + lift * 0.5], [w - 4, h / 2 + 1]], 10);
    // 먹이 머금은 몸통 + 마른 털 자국
    dryBrush(g, pts, 5 + r() * 4, INK, { seed: v, bristles: 9, dry: 0.35 + r() * 0.3, alpha: 1 });
    out.push(c);
  }
  return out;
}
