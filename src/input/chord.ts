// 누르고 있는 키 조합으로 지금 잡은 코드를 정한다
import { CHORDS, type ChordId } from '../data/chords';
import { updateChips } from '../ui/hud';
import { S } from '../world/state';

export function resolveChord() {
  // 키가 모두 눌린 코드 중 키 개수가 가장 많은 것 (D♭6의 4키가 D♭의 3키보다 우선)
  let best: ChordId | null = null, bs = 0;
  for (const [k, c] of Object.entries(CHORDS) as [ChordId, typeof CHORDS[ChordId]][]) {
    if (c.keys.length && c.keys.every(x => S.held.has(x)) && c.keys.length > bs) { best = k; bs = c.keys.length; }
  }
  // 장면이 잡아 주는 코드(후렴 예고)가 있으면 그것이 우선
  const nc = S.forced || best || S.sticky || 'open';
  if (nc !== S.chord) { S.chord = nc; S.seal = 1; }
  updateChips();
}

/** 터치용: 칩을 눌러 코드 고정/해제 */
export function toggleSticky(k: ChordId) {
  S.sticky = S.sticky === k ? null : k;
  resolveChord();
}
