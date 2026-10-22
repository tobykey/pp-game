// 배 그림: 먹을 듬뿍 먹인 붓으로 한 번에 그은 배 몸통 + 길이 방향의 마른 붓 결 + 번진 가장자리
// 배 좌표계(배 가운데 = 0,0, 오른쪽이 뱃머리)에서 그려 두고, 매 프레임 그 자리에 붙인다
import { view } from '../../world/state';
import { boatScale } from '../../world/geometry';
import { bleed, canvas, dryBrush, smooth, type Pt } from './brush';

const X0 = -114, Y0 = -22, W = 228, H = 50;
let hull: HTMLCanvasElement | null = null, hullKey = '';

function hullPath(g: CanvasRenderingContext2D) {
  g.beginPath(); g.moveTo(104, -10); g.quadraticCurveTo(60, 4, 0, 0); g.quadraticCurveTo(-60, 4, -100, -14);
  g.quadraticCurveTo(-80, 18, 0, 20); g.quadraticCurveTo(78, 18, 104, -10); g.closePath();
}

function makeHull(scale: number) {
  const { c, g } = canvas(W, H, scale);
  g.translate(-X0, -Y0);
  // 먹 몸통: 위(뱃전)가 조금 옅고 아래가 진하다
  const grad = g.createLinearGradient(0, -12, 0, 20);
  grad.addColorStop(0, '#2b2620'); grad.addColorStop(0.5, '#17140f'); grad.addColorStop(1, '#0e0c09');
  g.fillStyle = grad; hullPath(g); g.fill();
  // 길이 방향 마른 붓 결 (몸통 안에서만)
  g.save(); hullPath(g); g.clip();
  const lines: Pt[][] = [
    [[-96, -8], [-50, 6], [10, 9], [70, 5], [102, -8]],
    [[-90, 0], [-40, 11], [20, 13], [80, 7]],
    [[-70, 8], [-20, 15], [40, 15], [88, 4]],
  ];
  lines.forEach((pts, i) => dryBrush(g, smooth(pts, 6), 5 + i * 2, '#6b6256', { seed: 30 + i, bristles: 8, dry: 0.55, alpha: 0.32 }));
  g.restore();
  // 뱃전: 붓이 지나간 밝은 테두리 한 줄
  g.strokeStyle = 'rgba(234,230,222,.42)'; g.lineWidth = 1.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(98, -8); g.quadraticCurveTo(60, 3, 0, 1); g.quadraticCurveTo(-60, 3, -94, -11); g.stroke();
  g.strokeStyle = 'rgba(234,230,222,.22)'; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(80, 6); g.quadraticCurveTo(0, 13, -78, 2); g.stroke();
  return bleed(c, 1.2 * scale, 0.55);
}

/** 배 좌표계에서 몸통을 그린다 (drawBoat 안에서, 배의 회전·크기 변환이 걸린 상태로) */
export function drawHull(ctx: CanvasRenderingContext2D) {
  const scale = boatScale() * view.DPR * 1.5, key = scale.toFixed(3);
  if (!hull || key !== hullKey) { hull = makeHull(scale); hullKey = key; }
  ctx.drawImage(hull, X0, Y0, W, H);
}
