// 챕터 2 '멈춘 시간' — 장면 순서, 오브젝트 배치, 화면 문구 (시나리오: docs/scenario-ch2.md)
// 곡: 프리코러스 (악보 50–57마디, 세뇨 첫 방문). 기타는 팜뮤트
import type { ChordId } from './chords';
import type { ObjDef, StepDef } from './defs';
import { HALF_BPM, SONG_BPM, section } from './song';
import { P_RAIN } from './chapter1';

export type Step2Id = 'c2frozen' | 'c2echo' | 'c2umbrella' | 'c2guard' | 'c2resolve' | 'c2end';

export const STEPS2: StepDef<Step2Id>[] = [
  { id: 'c2frozen', objective: '', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c2echo', objective: '빗방울이 들려주는 순서대로 되받아 치세요', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c2umbrella', objective: '', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c2guard', objective: '노랗게 빛나는 비를 막으며 노를 저으세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c2resolve', objective: 'C로 풀고, 천천히 길게 긁으세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c2end', objective: '챕터 3 · 돛 — 준비 중', bpm: SONG_BPM, mode: 'rock' },
];

export const STEP2_NAMES: Record<Step2Id, string> = {
  c2frozen: '챕터 2 · 멈춘 비', c2echo: '빗방울 되받아 치기', c2umbrella: '우산 아래',
  c2guard: '쏟아지는 비', c2resolve: 'Csus4 → C', c2end: '챕터 2 끝',
};

export const C2_START = P_RAIN;
/** 멈춘 비 속으로 들어가 배가 서는 곳 */
export const FROZEN_STOP = C2_START + 0.45;
/** 빗방울 기둥 셋 (배는 각 기둥 조금 앞에 선다) */
export const COLUMNS = [C2_START + 0.85, C2_START + 1.35, C2_START + 1.85];
export const COLUMN_GAP = 0.28;
/** 첫 만남의 기억 그림 */
export const P_MEET = C2_START + 2.7;
/** 멈춘 빗방울이 떠 있는 구간 */
export const DROPS_FROM = C2_START + 0.2, DROPS_TO = P_MEET + 0.3;

const PRE = section('prechorus').chords; // D♭ E♭ Cm D♭ / D♭ E♭ Csus4 C
/** 되받아 치기: 3개 → 4개 → 5개. 마지막 기둥은 프리코러스 끝의 Csus4까지 (2026-10-20: 조금 더 어렵게) */
export const ECHO_SEQS: ChordId[][] = [PRE.slice(0, 3), PRE.slice(0, 4), [...PRE.slice(0, 4), 'Csus4']];
/** 쏟아지는 비: 프리코러스 앞 6마디 */
export const GUARD_BARS: ChordId[] = PRE.slice(0, 6);
/** 노란 빗줄기가 덮치는 박 (그루브 시작부터 센 박). 처음엔 드문드문, 뒤로 갈수록 자주 */
export const GUARD_BEATS = [6, 12, 16, 19, 22];

export const OBJECTS2: ObjDef[] = [
  { id: 'col0', kind: 'column', wx: COLUMNS[0], ry: 0.5, seq: ECHO_SEQS[0], hidden: true },
  { id: 'col1', kind: 'column', wx: COLUMNS[1], ry: 0.5, seq: ECHO_SEQS[1], hidden: true },
  { id: 'col2', kind: 'column', wx: COLUMNS[2], ry: 0.5, seq: ECHO_SEQS[2], hidden: true },
  { id: 'isleMeet', kind: 'isle', wx: P_MEET, ry: 0.06, s: 1.7, seed: 71 },
  { id: 'pMeet', kind: 'painting', wx: P_MEET, scene: 'meet', w: 0.9, edge: 'left', hidden: true },
];

export const TEXT2 = {
  muffled: '소리가 빗방울에 막힌다',
  hintMute: 'Shift를 누른 채 짧게 끊어 치세요',
  muteOk: '짧게, 또렷하게 · 빗방울이 울린다',
  echoFirst: '들려준 순서대로 · Shift를 누른 채',
  guardHint: '노랗게 빛나면 · Shift를 누른 채',
  sweepHint: '여섯 줄을 위에서 아래로, 아주 천천히',
  sweepSlower: '더 천천히, 길게',
  sweepCue: '천천히, 길게',
  slowHint: '시간이 느려졌다 · 여섯 줄을 끝까지',
  lyric: '그대를 만난 순간',
  progressEcho: (n: number, total: number) => `${n} / ${total}`,
};
