// 붓의 언어: 미리 그려 두는(프리렌더) 그림에 쓰는 붓 도구
// 매 프레임이 아니라 시작할 때·화면 크기가 바뀔 때 한 번만 쓰므로, 무거운 효과(흐림·여러 겹)도 괜찮다
import { rng } from './noise';

export type G = CanvasRenderingContext2D;
export type Pt = [number, number];

/** 새 오프스크린 캔버스 (css 픽셀 w×h, 배율 scale) */
export function canvas(w: number, h: number, scale = 1) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * scale)); c.height = Math.max(1, Math.ceil(h * scale));
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  return { c, g };
}

/**
 * 붓 한 획: 점들을 따라 굵기가 변하는 획을 다각형으로 칠한다.
 * width(t): 0~1 위치에서의 굵기. ragged: 가장자리 떨림. 끝은 붓이 들리듯 가늘게
 */
export function stroke(g: G, pts: Pt[], width: (t: number) => number, color: string, seed = 1, ragged = 0.18) {
  if (pts.length < 2) return;
  const r = rng(seed);
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    const [x, y] = pts[i], [x0, y0] = pts[Math.max(0, i - 1)], [x1, y1] = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(y1 - y0), ny = x1 - x0; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const w = width(t) * (1 + (r() - 0.5) * ragged);
    left.push([x + nx * w / 2, y + ny * w / 2]); right.push([x - nx * w / 2 * (1 + (r() - 0.5) * ragged), y - ny * w / 2]);
  }
  g.fillStyle = color; g.beginPath();
  g.moveTo(left[0][0], left[0][1]);
  for (const p of left) g.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
  g.closePath(); g.fill();
}

/**
 * 마른 붓(갈필): 같은 길을 가는 털 자국 여러 줄. 먹이 모자라 군데군데 비는 결
 * bristles: 털 수, spread: 붓 폭, dry: 0~1 (클수록 더 많이 빔)
 */
export function dryBrush(g: G, pts: Pt[], spread: number, color: string, opts: { seed?: number; bristles?: number; dry?: number; alpha?: number; taper?: boolean } = {}) {
  const { seed = 1, bristles = 14, dry = 0.4, alpha = 1, taper = true } = opts;
  const r = rng(seed);
  g.save(); g.strokeStyle = color; g.lineCap = 'round';
  for (let b = 0; b < bristles; b++) {
    const off = (b / (bristles - 1) - 0.5) * spread, lw = 0.6 + r() * 1.6;
    // 털마다 먹이 끊기는 구간
    const gapAt = r(), gapLen = dry * (0.2 + r() * 0.6);
    g.globalAlpha = alpha * (0.35 + r() * 0.65); g.lineWidth = lw;
    g.beginPath(); let pen = false;
    for (let i = 0; i < pts.length; i++) {
      const t = i / (pts.length - 1);
      const inGap = t > gapAt && t < gapAt + gapLen;
      const ta = taper ? Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)) : 1;
      const [x, y] = pts[i], [x0, y0] = pts[Math.max(0, i - 1)], [x1, y1] = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(y1 - y0), ny = x1 - x0; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const px = x + nx * off * (0.4 + 0.6 * ta), py = y + ny * off * (0.4 + 0.6 * ta);
      if (inGap) { pen = false; continue; }
      if (!pen) { g.moveTo(px, py); pen = true; } else g.lineTo(px, py);
    }
    g.stroke();
  }
  g.restore();
}

/** 점들을 부드러운 곡선 위의 촘촘한 점으로 (붓 획에 쓰기 좋게) */
export function smooth(pts: Pt[], per = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** 번짐: 이미 그린 그림을 흐리게 한 겹 더 깔아, 젖은 한지에 먹이 퍼진 가장자리를 만든다 (프리렌더 전용) */
export function bleed(src: HTMLCanvasElement, blurPx: number, alpha: number) {
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const g = out.getContext('2d')!;
  g.globalAlpha = alpha; g.filter = `blur(${blurPx}px)`; g.drawImage(src, 0, 0);
  g.filter = 'none'; g.globalAlpha = 1; g.drawImage(src, 0, 0);
  return out;
}
