// 캔버스 준비와 크기가 바뀔 때마다 새로 그리는 배경(한지, 바다 붓질, 먼 산)
import { view } from '../world/state';
import { hz, sb } from '../world/geometry';
import { clamp, lerp, rand, seeded } from '../util/math';
import { PAPER } from './palette';
import { makeMountainsArt, makePaperArt, makeSeaStrokes, makeWaterArt, type MountainLayer } from './art/backdrops';

export const cv = document.querySelector<HTMLCanvasElement>('#c')!;
export const ctx = cv.getContext('2d')!;

export interface SeaStroke { y: number; x: number; len: number; w: number; a: number; ph: number; d: number }
export interface Mountain { pts: [number, number][]; al: number }

export const backdrop = {
  paper: null as HTMLCanvasElement | null,
  sea: [] as SeaStroke[],
  mountains: [] as Mountain[],
  /** 그림 작업(2026-10-23): 수묵 산 세 겹, 물빛, 물결 붓 자국 */
  hills: [] as MountainLayer[],
  water: null as HTMLCanvasElement | null,
  seaSprites: [] as HTMLCanvasElement[],
};

export function resize() {
  view.DPR = Math.min(2, devicePixelRatio || 1);
  view.W = innerWidth;
  view.H = innerHeight;
  cv.width = view.W * view.DPR;
  cv.height = view.H * view.DPR;
  ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
  makePaper();
  makeSea();
  makeMountains();
  // 한지·산·물빛은 붓으로 그린 그림으로 (한 번만 그려 두고 매 프레임 붙인다)
  backdrop.paper = makePaperArt();
  backdrop.hills = makeMountainsArt();
  backdrop.water = makeWaterArt();
  if (!backdrop.seaSprites.length) backdrop.seaSprites = makeSeaStrokes();
}

function makePaper() {
  const { W, H, DPR } = view;
  const paper = document.createElement('canvas');
  paper.width = W * DPR;
  paper.height = H * DPR;
  const p = paper.getContext('2d')!;
  p.scale(DPR, DPR);
  p.fillStyle = PAPER;
  p.fillRect(0, 0, W, H);
  // 한지 섬유 점
  for (let i = 0; i < W * H / 260; i++) {
    p.fillStyle = `rgba(23,20,15,${rand(0.015, 0.06)})`;
    p.fillRect(rand(0, W), rand(0, H), rand(0.5, 1.6), rand(0.5, 1.6));
  }
  // 한지 섬유 결
  p.lineCap = 'round';
  for (let i = 0; i < W * H / 2600; i++) {
    const x = rand(0, W), y = rand(0, H), a = rand(0, Math.PI * 2), l = rand(6, 22);
    p.strokeStyle = `rgba(23,20,15,${rand(0.03, 0.07)})`;
    p.lineWidth = rand(0.3, 0.8);
    p.beginPath();
    p.moveTo(x, y);
    p.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    p.stroke();
  }
  // 가장자리 어둡게
  const g = p.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgba(23,20,15,0)');
  g.addColorStop(1, 'rgba(60,45,30,.16)');
  p.fillStyle = g;
  p.fillRect(0, 0, W, H);
  backdrop.paper = paper;
}

function makeSea() {
  const { W, H } = view;
  backdrop.sea = [];
  const rows = Math.round(30 + H / 40);
  for (let k = 0; k < rows; k++) {
    const d = Math.pow(k / rows, 1.5);
    const y = lerp(hz() + 4, sb(), d);
    const n = Math.round(3 + W / 160);
    for (let j = 0; j < n; j++) {
      backdrop.sea.push({
        y, x: rand(-40, W),
        len: lerp(14, 90, d) * rand(0.6, 1.4),
        w: lerp(0.5, 2.1, d) * rand(0.7, 1.3),
        a: rand(0.07, 0.26) * (0.5 + d * 0.7),
        ph: rand(0, 6.28), d,
      });
    }
  }
}

function makeMountains() {
  const { W, H } = view;
  backdrop.mountains = [];
  [[0.55, 0.07, 0.15], [0.32, 0.11, 0.25]].forEach(([amp, base, al], li) => {
    const r = seeded(31 + li * 11);
    const pts: [number, number][] = [];
    let h = r();
    for (let x = -20; x <= W * 1.7 + 20; x += 18) {
      h = clamp(h + (r() - 0.5) * 0.35, 0, 1);
      pts.push([x, hz() - H * base * h * amp * 1.6 - H * 0.004]);
    }
    backdrop.mountains.push({ pts, al });
  });
}
