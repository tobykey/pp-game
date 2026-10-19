// 파동, 먹 스플래시, 집중선, 섬광·흔들림 같은 순간 연출을 만들어 내는 함수들
import { MODES } from '../data/modes';
import { S, fx, view, type WorldObj } from '../world/state';
import { boatY, pos, toWorldX } from '../world/geometry';
import { clamp, rand } from '../util/math';
import { INK, VOLT, reduceMotion } from './palette';

/** i번 줄을 긁었을 때 바다에 퍼지는 파동 */
export function spawnRipple(i: number, dyn: number, dir: number, x: number, dead: boolean) {
  const { W } = view;
  const t = i / 5;
  const max = (1.0 - 0.74 * t) * W * (0.45 + 0.55 * dyn) * (S.mute ? 0.45 : 1) * (dead ? 0.3 : 1);
  fx.rip.push({
    wx: toWorldX(clamp(x, W * 0.05, W * 0.95)), y: boatY() + (dir > 0 ? 24 : -44), r: 4, max,
    sp: (170 + 260 * (1 - t)) + 220 * dyn, dyn, t, acc: MODES[S.mode].accent,
  });
  if (fx.rip.length > 90) fx.rip.shift();
}

/** ff 연출이 마지막으로 터진 시각. 줄 6개를 한 번에 긁어도 연출은 한 번만 */
let lastRock = -1;

/** ff로 세게 쳤을 때: 섬광 + 흔들림 + 먹 스플래시 + 집중선 */
export function rockHit(x: number, dyn: number) {
  if (S.t - lastRock < 0.35) return;
  lastRock = S.t;
  const { W } = view;
  const k = (dyn - 0.84) / 0.16;
  // 화면 전체 섬광은 은은하게 (자주 반짝이면 눈이 피로하다)
  S.flash = Math.max(S.flash, (0.08 + 0.1 * k) * (reduceMotion ? 0.4 : 1));
  S.flashCol = MODES[S.mode].accent;
  S.shake = Math.max(S.shake, reduceMotion ? 0 : 4 + 5 * k);
  splash(clamp(x, W * 0.05, W * 0.95), boatY() + 10, 14 + k * 16, 0.7 + k * 0.4);
  for (let j = 0; j < 10; j++) {
    fx.lines.push({ x: clamp(x, W * 0.05, W * 0.95), y: boatY(), a: rand(-Math.PI, 0), l: rand(60, 200), life: 1, c: j % 3 ? VOLT : INK });
  }
}

/**
 * 천 조각이 (x, y)에서 돛대로 날아온다. burn이면 도중에 타 버린다 (잃은 조각).
 * 날아오는 데 걸리는 시간(초)을 돌려준다
 */
export function flyPiece(x: number, y: number, burn = false) {
  const dur = burn ? 1.1 : 1.5;
  fx.flyers.push({ x, y, t: S.t, dur, burn });
  return dur;
}

/** 먹 방울이 위로 튀는 스플래시 */
export function splash(x: number, y: number, n: number, pow: number, color?: string) {
  const acc = color ?? MODES[S.mode].accent;
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI * 0.95, -Math.PI * 0.05), v = rand(120, 520) * pow;
    fx.parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.5, 6) * pow, life: 1, dec: rand(0.6, 1.3),
      c: Math.random() < 0.22 ? acc : Math.random() < 0.1 ? VOLT : INK,
    });
  }
}

/** pp 문장이 세게 친 파동에 흩어지는 연출 */
export function scatterWhisper(o: WorldObj) {
  const p = pos(o);
  for (let i = 0; i < 40; i++) {
    const a = rand(-Math.PI, 0), v = rand(60, 260);
    fx.parts.push({
      x: p.x + rand(-110, 110), y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      r: rand(1.5, 3.5), life: 1, dec: 0.7, c: MODES[S.mode].accent,
    });
  }
}
