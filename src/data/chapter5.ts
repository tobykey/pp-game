// 챕터 5 '다시, 그 순간' — 장면 순서, 배치, 화면 문구, 기억 테스트 (시나리오: docs/scenario-ch5.md)
// 곡: 프리코러스 D.S. (50–57마디 재방문). 진실이 드러나는 챕터
import type { ChordId } from './chords';
import type { ObjDef, PaintingScene, StepDef } from './defs';
import { HALF_BPM, SONG_BPM } from './song';

export type Step5Id = 'c5return' | 'c5other' | 'c5creep' | 'c5natural' | 'c5test' | 'c5truth' | 'c5rewrite' | 'c5after';

export const STEPS5: StepDef<Step5Id>[] = [
  { id: 'c5return', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'c5other', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'c5creep', objective: '다가오는 기억을 맞이하세요', bpm: HALF_BPM, mode: 'korean' },
  { id: 'c5natural', objective: '들려주는 코드를 따라 치세요', bpm: SONG_BPM, mode: 'acoustic' },
  { id: 'c5test', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c5truth', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c5rewrite', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c5after', objective: '', bpm: HALF_BPM, mode: 'strings' },
];

export const STEP5_NAMES: Record<Step5Id, string> = {
  c5return: '챕터 5 · D.S.', c5other: '우산을 든 쪽', c5creep: '다가오는 것', c5natural: '제자리표',
  c5test: '붓글씨의 질문', c5truth: '잠든 건 나였다', c5rewrite: '고쳐 쓰는 글', c5after: 'B♭',
};

/** 챕터 5가 시작되는 곳 (챕터 4 끝) */
export const C5_START = 29.0;
/** 우산을 든 쪽: 뒤집힌 기억 그림 넷이 걸린 곳 */
export const OTHER_AT = C5_START + 0.9;
export const OTHER_GAP = 1.0;
/** 제자리표 퍼즐: 둘러보는 정도(S.look)가 이 값일 때 흩어진 획이 ♮로 맞춰진다 */
export const NAT_LOOK = 0.38;
/** 되받아 치기 두 번 (프리코러스 진행) */
export const ECHO5: ChordId[][] = [['Db', 'Eb', 'Cm', 'Db'], ['Db', 'Eb', 'Csus4', 'C']];
/** 쉼표 퍼즐: 이만큼의 박 동안 긁지 않으면 쉼표가 다 찬다 */
export const REST_BEATS = 8;

const OTHER_SCENES: PaintingScene[] = ['meet', 'room', 'stage', 'rain'];
export const OBJECTS5: ObjDef[] = [
  ...OTHER_SCENES.map((scene, i) => ({ id: 'o5' + scene, kind: 'painting' as const, wx: OTHER_AT + i * OTHER_GAP, scene, w: 0.8, other: true, hidden: true })),
  // 기억 테스트의 답: 안개 속에 잠겨 있어 여리게(pp) 비춰야만 떠오른다
  ...(['Db', 'Eb', 'Cm', 'Ab'] as ChordId[]).map((chord, i) => ({
    id: 'ans' + i, kind: 'answer' as const, chord, pp: true, hidden: true,
    wx: 0, ry: i < 2 ? 0.2 : 0.62,
  })),
];

/** 기억 테스트: 질문마다 어느 기억 그림(액자 밖을 둘러봤는지)과 이어지는지, 답 그림 넷 (첫째가 정답) */
export type AnswerPic =
  | { kind: 'blanket' | 'umbrella'; color: string }
  | { kind: 'coil' | 'flower' | 'ticket' | 'pick' }
  | { kind: 'prints' | 'walker' | 'road' | 'puddle' };
export const QUESTIONS: { text: string; painting: string; answers: AnswerPic[] }[] = [
  {
    text: '그때 건넨 담요는 무슨 색이었지?', painting: 'pRoom',
    answers: [{ kind: 'blanket', color: '#ff2a7f' }, { kind: 'blanket', color: '#4a6fa5' }, { kind: 'blanket', color: '#c8a24a' }, { kind: 'blanket', color: '#8a857c' }],
  },
  {
    text: '무대 옆에서 내가 들고 있던 건?', painting: 'pStage',
    answers: [{ kind: 'coil' }, { kind: 'flower' }, { kind: 'ticket' }, { kind: 'pick' }],
  },
  {
    text: '비 오던 날, 내 우산은 무슨 색이었지?', painting: 'pRain',
    answers: [{ kind: 'umbrella', color: '#ff2a7f' }, { kind: 'umbrella', color: '#17140f' }, { kind: 'umbrella', color: '#4a6fa5' }, { kind: 'umbrella', color: '#e6e1d6' }],
  },
  {
    text: '처음 만난 날, 누가 먼저 와 있었지?', painting: 'pMeet',
    answers: [{ kind: 'prints' }, { kind: 'walker' }, { kind: 'road' }, { kind: 'puddle' }],
  },
];
/** 질문마다 정답이 놓이는 자리 (0 왼위 D♭, 1 오른위 E♭, 2 왼아래 Cm, 3 오른아래 A♭) */
export const ANSWER_SLOT = [2, 1, 3, 0];

export const TEXT5 = {
  ret: '같은 순간으로',
  creepHint1: '보고 있으면, 다가오지 않는다',
  creepHint2: '← → 로 다른 쪽을 바라보세요',
  progressCreep: (n: number) => `다가온 기억 ${n} / 4`,
  echoListen: '들려주는 대로',
  echoAgain: '다시 들어 봐',
  natHint: '← → 로 돌려, 흩어진 획을 맞춰 보세요',
  reflHint: '가는 줄로, 배 아래를',
  testSoft: '아주 여리게 비춰 보세요',
  testPick: '떠오른 그림의 코드로',
  testThanks: '기억해 줘서 고마워',
  testOkay: '괜찮아',
  testBlur: '그때 액자 밖을 보지 않은 기억은, 흐릿하다',
  restHint: '긁지 말고, 들어 보세요',
  whisper: '나는 여기 있어',
  rewriteBefore: '나를 잊어 줘',
  rewriteWord: '잊어',
  rewriteNew: '기억해',
  rewriteHard: '세게 울려도, 글은 그대로다',
  rewriteSoft: '흔들리는 한 단어를, 여리게',
  lyric: '(기억해 줘, 기억해 줘)',
  after: '가시 하나가, 남았다',
  nextChapter: '챕터 6 · 깨어남 — 준비 중',
};
