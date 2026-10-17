// 줄 하나를 튕겼을 때 일어나는 일: 소리 + 줄 진동 + 파동 (+ 세면 ff 연출)
import { CHORDS } from '../data/chords';
import { playNote } from '../audio/engine';
import { rockHit, spawnRipple } from '../render/effects';
import { clamp } from '../util/math';
import { S, str } from './state';

/** 긁는 속도(px/ms) → 세기 0.04~1 */
export function dynFrom(v: number) { return clamp((v - 0.06) / 2.3, 0.04, 1); }

/** 세기 → 셈여림 기호 */
export function dynMark(d: number) { return d < 0.15 ? 'pp' : d < 0.3 ? 'p' : d < 0.48 ? 'mp' : d < 0.66 ? 'mf' : d < 0.84 ? 'f' : 'ff'; }

/** i: 줄 번호(0 = 6번 줄), dir: 1 다운 / -1 업, x: 긁은 위치 */
export function pluck(i: number, dyn: number, dir: number, x: number) {
  const midi = CHORDS[S.chord].v[i];
  playNote(midi, dyn);
  const s = str[i];
  s.amp = Math.min(15, 2.5 + dyn * 14) * (S.mute ? 0.45 : 1); s.hot = dyn; s.ph = 0;
  spawnRipple(i, dyn, dir, x, midi == null);
  S.dyn = { m: dynMark(dyn), d: dyn, t: S.t };
  if (dyn > 0.84 && !S.mute) rockHit(x, dyn);
}
