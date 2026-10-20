// 공명 카운터(파란 빛)와 팜뮤트 가드(노란 빛): 여러 챕터가 같은 약속으로 쓴다
// 파란 빛 = '짠!' 하고 나타난 뒤 받아칠 박에 아주 세게 · 노란 빛 = 덮치는 박에 Shift 누른 채 긁기
import { audioOut } from '../audio/engine';
import { crash } from '../audio/kit';
import { splash } from '../render/effects';
import { INK, reduceMotion } from '../render/palette';
import { counterWaves } from '../render/chapter3Art';
import { guardWaves } from '../render/chapter2Art';
import { boatScale, boatX, boatY } from '../world/geometry';
import { judgeBeat } from '../world/judge';
import { grooveBeat, grooveBeatPos } from '../world/rhythm';
import { S, fx } from '../world/state';
import { rand } from '../util/math';
import type { Stroke } from './director';

const BLUE = '#2f6bff';

/** 파란 빛을 받아쳤는지 (아주 세게 + 그 박). 성공하면 돛 조각 하나가 빛난다 */
export function tryCounter(s: Stroke): boolean {
  if (s.dyn < 0.84) return false;
  const { j, n } = judgeBeat();
  const gb = grooveBeat(n);
  const w = counterWaves.find(x => x.beat === gb && x.shown && !x.done && !x.hit);
  if (!w || j === 'miss') return false;
  w.done = true;
  const sc = boatScale(), x = boatX() + 150 * sc, y = boatY() - 40 * sc;
  for (let i = 0; i < 30; i++) {
    const a = rand(-Math.PI, 0), v = rand(180, 520);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 6), life: 1, dec: 1.1, c: i % 3 ? BLUE : INK });
  }
  S.glow = Math.min(6, S.glow + 1); S.glowPop = 1;
  return true;
}

/** 나타날 때가 된 파란 빛을 '짠!' 하고 띄운다 (매 프레임) */
export function showWaves() {
  const g = grooveBeatPos();
  for (const w of counterWaves) {
    if (w.shown || g < w.beat - w.lead) continue;
    w.shown = true;
    const a = audioOut(); if (a) crash(a.ac.currentTime, 0.7);
    const sc = boatScale();
    splash(boatX() + 150 * sc, boatY() - 30 * sc, 16, 0.7, BLUE);
    if (!reduceMotion) S.shake = Math.max(S.shake, 3);
  }
}

/** 박이 지나간 파란 빛·노란 빛은 배를 덮친다 (벌은 없다) */
export function settleWaves(gb: number) {
  for (const w of counterWaves) if (w.shown && !w.done && !w.hit && gb > w.beat) { w.hit = true; S.wobble += 0.1; splash(boatX() + 30, boatY() - 20, 14, 0.5, INK); }
  for (const w of guardWaves) if (!w.blocked && !w.hit && gb > w.beat) { w.hit = true; S.wobble += 0.12; splash(boatX(), boatY() - 30, 20, 0.6, INK); }
}

/** 받아칠 파란 빛이 떠 있는지 (박 안내 원을 파랗게) */
export function counterSoon() {
  const g = grooveBeatPos();
  return counterWaves.some(w => w.shown && !w.done && !w.hit && w.beat - g > -0.3);
}
/** 노란 빛이 한 박 남짓 안에 덮치는지 (박 안내 원을 노랗게) */
export function guardSoon() {
  const g = grooveBeatPos();
  return guardWaves.some(w => !w.blocked && !w.hit && w.beat - g <= 1.2 && w.beat - g > -0.3);
}

/** 노란 빛을 막았는지 (Shift 누른 채 + 그 박) */
export function tryGuard(): boolean {
  if (!S.mute) return false;
  const { j, n } = judgeBeat();
  const gb = grooveBeat(n);
  const w = guardWaves.find(x => x.beat === gb && !x.blocked && !x.hit);
  if (!w || j === 'miss') return false;
  w.blocked = true; S.shield = 1;
  return true;
}
