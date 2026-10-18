// 왼손: 코드 키, Shift 팜뮤트, 숫자 1~4 음색 전환
import { CHORD_LETTERS } from '../data/chords';
import { MODE_ORDER } from '../data/modes';
import { setMode } from '../ui/hud';
import { S } from '../world/state';
import { resolveChord } from './chord';

/** e.code는 키보드 배열(한/영)과 상관없이 물리 키 위치를 알려 준다 */
const letterOf = (e: KeyboardEvent) => e.code.startsWith('Key') ? e.code.slice(3) : '';

export function bindKeyboard() {
  addEventListener('keydown', e => {
    if (e.key === 'Shift') { S.mute = true; return; }
    // 둘러보기 (챕터 1부터): ← 지나온 쪽, → 앞쪽
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { S.lookDir = e.key === 'ArrowLeft' ? -1 : 1; e.preventDefault(); return; }
    if (/^Digit[1-4]$/.test(e.code)) { setMode(MODE_ORDER[+e.code.slice(5) - 1]); return; }
    const k = letterOf(e);
    if (!CHORD_LETTERS.has(k) || e.repeat) return;
    S.held.add(k);
    resolveChord();
  });
  addEventListener('keyup', e => {
    if (e.key === 'Shift') { S.mute = false; return; }
    if ((e.key === 'ArrowLeft' && S.lookDir < 0) || (e.key === 'ArrowRight' && S.lookDir > 0)) { S.lookDir = 0; return; }
    if (S.held.delete(letterOf(e))) resolveChord();
  });
  // 창이 포커스를 잃으면 눌린 키를 모두 놓은 것으로
  addEventListener('blur', () => { S.held.clear(); S.mute = false; S.lookDir = 0; resolveChord(); });
}
