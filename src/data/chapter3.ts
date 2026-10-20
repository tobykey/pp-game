// 챕터 3 '돛' — 장면 순서, 화면 문구 (시나리오: docs/scenario-ch3.md)
// 곡: 후렴 2 (악보 58–73마디), 130 BPM. 처음으로 형광이 화면을 덮는 클라이맥스
import type { ChordId } from './chords';
import type { ObjDef, StepDef } from './defs';
import { HALF_BPM, SONG_BPM, section } from './song';

export type Step3Id = 'c3stall' | 'c3sail' | 'c3sea' | 'c3gate' | 'c3after';

export const STEPS3: StepDef<Step3Id>[] = [
  { id: 'c3stall', objective: '', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c3sail', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c3sea', objective: '파란 빛엔 박에 맞춰 세게 · 바람을 타세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c3gate', objective: 'F의 문 · 파란 빛을 받아치세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c3after', objective: '', bpm: HALF_BPM, mode: 'strings' },
];

export const STEP3_NAMES: Record<Step3Id, string> = {
  c3stall: '챕터 3 · 바람이 모자라다', c3sail: '희망의 돛', c3sea: '등대의 바다', c3gate: 'F의 문', c3after: '바람을 안고',
};

/** 챕터 3이 시작되는 곳 (챕터 2 끝) */
export const C3_START = 15.0;
/** 후렴 2 (16마디) */
export const CHORUS2: ChordId[] = section('chorus2').chords;
/** 형광 폭발을 일으키는 F 마디 (0부터 셈: 8마디째, 16마디째) */
export const F_BARS = [7, 15];
/**
 * 파란 빛(공명 카운터): beat 박에 받아쳐야 한다. lead 박 전에 '짠!' 하고 뱃머리 앞에 나타난다.
 * lead 1 = 정박에 나타나 다음 정박에 받아치기. lead 0.5 = 반 박 전에 나타나 빠르게 대처 (뒤로 갈수록)
 * F 마디는 비워 둔다. 앞은 듬성듬성, 뒤는 촘촘히
 */
export const COUNTERS: { beat: number; lead: number }[] = [
  { beat: 6, lead: 1 }, { beat: 14, lead: 1 }, { beat: 22, lead: 1 },
  { beat: 34, lead: 1 }, { beat: 38, lead: 1 }, { beat: 42, lead: 1 }, { beat: 46, lead: 1 },
  { beat: 50, lead: 0.5 }, { beat: 54, lead: 0.5 }, { beat: 57, lead: 0.5 },
];
/** F의 문 앞: 이 진행을 되풀이하며 버틴다 */
export const GATE_BARS: ChordId[] = ['Db', 'Eb', 'Fsus4', 'F'];

export const OBJECTS3: ObjDef[] = [
  { id: 'thorn3', kind: 'thorn', wx: C3_START + 6, ry: 0.6, hidden: true },
];

export const TEXT3 = {
  stall: '바람을 안기엔, 돛이 모자라다',
  lyric: '노 저어 희망의 돛을 펼치네',
  counterHint: '파란 빛이 짠! · 다음 박에 세게!',
  glowHint: '받아칠 때마다 돛이 한 조각씩 빛난다 · 여섯이 다 빛나면 F 마디에 폭발',
  glowFull: '돛이 다 빛났다 · F를 기다려',
  fCue: 'F!',
  fHint: '조성 밖의 F · 왼손 Q A Z',
  fGate: '지금! F로 가시를 뽑으세요',
  pulled: '가시가 빠졌다',
  after: '처음으로, 바람을 탔다',
  nextChapter: '챕터 4 · 마른 바다 — 준비 중',
  progressSea: (label: string, bar: number) => `${label} · ${bar} / 16`,
  progressGate: (n: number) => '버티기 ' + '▮'.repeat(n) + '▯'.repeat(Math.max(0, 6 - n)),
};
