// 챕터 4 '마른 바다 → 폭풍' — 장면 순서, 배치, 화면 문구 (시나리오: docs/scenario-ch4.md)
// 곡: 훅 + 랩 (74–81마디) → 리프 + 랩 (82–89마디, D.S. al Coda), 130 BPM
import type { ChordId } from './chords';
import type { ObjDef, StepDef } from './defs';
import { HALF_BPM, SONG_BPM, section } from './song';

export type Step4Id = 'c4ebb' | 'c4solo' | 'c4turn' | 'c4storm' | 'c4clash' | 'c4thorn' | 'c4after';

export const STEPS4: StepDef<Step4Id>[] = [
  { id: 'c4ebb', objective: '', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c4solo', objective: '마음대로 긁어 마른 바닥에 물길을 그리세요', bpm: SONG_BPM, mode: 'acoustic' },
  { id: 'c4turn', objective: '', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c4storm', objective: '노란 빛엔 Shift · 파란 빛엔 세게 · 폭풍을 건너세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c4clash', objective: '쉬지 말고 긁어 물벽을 밀어내세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c4thorn', objective: '', bpm: HALF_BPM, mode: 'rock' },
  { id: 'c4after', objective: '', bpm: HALF_BPM, mode: 'strings' },
];

export const STEP4_NAMES: Record<Step4Id, string> = {
  c4ebb: '챕터 4 · 물이 빠진다', c4solo: '마른 바다 (자유 솔로)', c4turn: '물이 돌아온다', c4storm: '폭풍',
  c4clash: '격돌 ①', c4thorn: 'D♭ 가시', c4after: 'D.S.',
};

/** 챕터 4가 시작되는 곳 (챕터 3 끝) */
export const C4_START = 21.0;
/** 자유 솔로로 이만큼 나아가면 물이 돌아온다 (화면 너비 단위) */
export const SOLO_DIST = 1.8;
/** 리프 + 랩 (8마디). 폭풍에서 두 바퀴 */
export const RIFF: ChordId[] = section('riffRap').chords;
/** 폭풍의 노란 빛(가드)·파란 빛(카운터). beat = 막거나 받아칠 박, lead = 몇 박 전에 나타나는지 (파란 빛만) */
export const STORM_GUARDS = [6, 14, 21, 30, 38, 45, 53, 60];
export const STORM_COUNTERS: { beat: number; lead: number }[] = [
  { beat: 10, lead: 1 }, { beat: 18, lead: 1 }, { beat: 26, lead: 1 }, { beat: 34, lead: 1 },
  { beat: 42, lead: 0.5 }, { beat: 49, lead: 1 }, { beat: 57, lead: 0.5 },
];
/** 격돌: 세 마디마다 빨라지는 박 */
export const CLASH_BPMS = [130, 146, 162, 178, 194];

export const OBJECTS4: ObjDef[] = [
  { id: 'relicScore', kind: 'relic', relic: 'score', label: '쓰다 만 악보', wx: C4_START + 0.75, ry: 0.55, hidden: true },
  { id: 'relicCase', kind: 'relic', relic: 'case', label: '줄이 다 풀린 기타 케이스', wx: C4_START + 1.3, ry: 0.78, hidden: true },
  { id: 'relicPick', kind: 'relic', relic: 'pick', label: '깨진 피크', wx: C4_START + 1.85, ry: 0.5, hidden: true },
  { id: 'thorn4', kind: 'thorn', wx: C4_START + 4, ry: 0.55, hidden: true },
  { id: 'dsSign', kind: 'sign', wx: C4_START + 4, ry: 0.35, hidden: true },
];

export const TEXT4 = {
  ebb1: '바다가 말라 간다',
  ebb2: '노를 저을 물이 없다',
  soloHint: '정답은 없다 · 마음대로 긁어 보세요',
  soloChord: '다른 코드는 다른 틈으로 흐른다',
  /** 균열에 흐르는 글줄 (✎ 원곡 랩 가사 자리: Toby 확인 후 교체) */
  cracks: ['잊으려 할수록', '더 깊이 갈라지는 바닥', '버린 줄 알았는데', '아직 여기 있었다'],
  turn: '멀리서, 물이 돌아온다',
  clashCue: '긁어!',
  clashHint: '박은 잊고 · 쉬지 말고!',
  clashAgain: '다시, 한 번 더!',
  clashWon: '밀어냈다',
  pullObj: '지금! D로 가시를 뽑으세요',
  pulled: '가시가 빠졌다',
  after1: '폭풍이 지나간 자리',
  after2: '처음으로 돌아가라는 표시',
  nextChapter: '챕터 5 · 다시, 그 순간 — 준비 중',
  progressSolo: (p: number) => '물길 ' + '▮'.repeat(p) + '▯'.repeat(Math.max(0, 8 - p)),
  progressStorm: (label: string, bar: number) => `${label} · ${bar} / 16`,
};
