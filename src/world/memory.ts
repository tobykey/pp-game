// 둘러본 기록: 기억 그림의 액자 밖을 봤는지를 브라우저에 남긴다
// 챕터 5 기억 테스트가 이어하기 뒤에도 공정하도록 (본 사람만 답 그림이 또렷하다)
import { OBJ } from './state';

const KEY = 'pp.seen';

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

/** 시작할 때: 저장된 기록을 그림에 되살린다 */
export function loadSeen() {
  const ids = new Set(read());
  for (const o of OBJ) if (ids.has(o.id)) o.seen = true;
}

/** 액자 밖을 처음 봤을 때 */
export function markSeen(id: string) {
  const ids = new Set(read());
  if (ids.has(id)) return;
  ids.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch { /* 무시 */ }
}

/** 처음부터 할 때 */
export function clearSeen() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
  for (const o of OBJ) o.seen = false;
}
