// 장면의 음악: 원곡 MR 구간이 있으면 그걸 틀고 박 시계를 맞추고, 없으면 합성 그루브로
import { MR_BPM, playMR, stopMR, type MrSection } from '../audio/mr';
import { setTempo, syncTempo } from '../world/rhythm';
import type { Groove } from '../world/state';

/** 원곡 구간을 튼다. MR이 없으면 bpm·groove의 합성음으로. 원곡이 나오면 true */
export function playSong(segs: [MrSection, number?][], fallbackBpm: number, fallbackGroove: Groove): boolean {
  const t0 = playMR(segs);
  if (t0 == null) { setTempo(fallbackBpm, fallbackGroove); return false; }
  syncTempo(MR_BPM, 'mr', t0);
  return true;
}
/** 원곡을 서서히 끄고 합성 그루브로 */
export function leaveSong(bpm: number, groove: Groove, fade = 0.5) {
  stopMR(fade);
  setTempo(bpm, groove);
}
