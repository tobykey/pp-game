// 장면이 내는 기타 소리: 화음을 줄 하나씩 빠르게 긁는다 (그 사람이 치는 기타, 결정 코드의 울림)
import { CHORDS, type ChordId } from '../data/chords';
import { later } from '../world/timers';
import { playNote } from '../audio/engine';
import { str } from '../world/state';

/** 화음을 줄마다 22~24ms 간격으로 울리고 화면의 줄도 떨게 한다. delay: 시작까지 기다릴 ms */
export function chordSound(c: ChordId, dyn = 0.8, delay = 0) {
  CHORDS[c].v.forEach((m, i) => later(() => { playNote(m, dyn); str[i].amp = Math.max(str[i].amp, 9 * dyn); str[i].hot = 1; }, delay + i * 23));
}
