// 줄 하나를 튕겼을 때 일어나는 일: 소리 + 줄 진동 + 파동 (+ 세면 ff 연출)
import { later } from './timers';
import { CHORDS, ROOT, type ChordId } from '../data/chords';
import { audioOut } from '../audio/engine';
import { bass } from '../audio/kit';
import { fx, view } from './state';
import { boatY, toWorldX } from './geometry';
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
  // 기타 침묵(1절): 줄은 먹먹하게 틱 소리만 내고, 파동도 짧다
  // 멈춘 시간(챕터 2): 팜뮤트가 아니면 소리가 빗방울에 막혀 뭉개진다
  const muffled = S.silence || (S.frozen && !S.mute);
  const midi = muffled ? null : CHORDS[S.chord].v[i];
  playNote(midi, muffled ? dyn * 0.4 : dyn);
  const s = str[i];
  s.amp = Math.min(15, 2.5 + dyn * 14) * (S.mute ? 0.45 : 1) * (S.silence ? 0.3 : 1); s.hot = S.silence ? 0 : dyn; s.ph = 0;
  spawnRipple(i, dyn, dir, x, midi == null);
  S.dyn = { m: dynMark(dyn), d: dyn, t: S.t };
  if (dyn > 0.84 && !S.mute && !S.silence) rockHit(x, dyn);
}

/**
 * 1절(줄이 끊어진 동안): 스트로크 한 번 = 왼손 코드의 근음을 베이스가 울림.
 * 낮고 넓게 퍼지지만 윤곽만 보이는 파동 (굵은 줄의 성질)
 */
export function bassStroke(chord: ChordId, x: number) {
  if (chord === 'open') return;
  const o = audioOut();
  if (o) bass(o.ac.currentTime + 0.005, ROOT[chord], 0.9, 1.4);
  fx.rip.push({
    wx: toWorldX(Math.max(view.W * 0.05, Math.min(view.W * 0.95, x))), y: boatY() + 24, r: 6,
    max: view.W * 1.1, sp: 420, dyn: 0.55, t: 0, acc: '#5d564c',
  });
}

/**
 * 코드 하나를 한 번 긁어 들려준다 (되받아 치기의 '들려주는 소리' 등). muted면 팜뮤트로 짧게
 */
export function strumChord(chord: ChordId, dyn: number, muted: boolean) {
  CHORDS[chord].v.forEach((m, i) => later(() => {
    const prev = S.mute; S.mute = muted;
    playNote(m, dyn);
    S.mute = prev;
    str[i].amp = Math.max(str[i].amp, 3 + dyn * 6);
  }, i * 18));
}
