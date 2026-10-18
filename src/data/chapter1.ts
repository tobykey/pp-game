// 챕터 1 '고집의 섬' — 장면 순서, 오브젝트 배치, 화면 문구 (시나리오: docs/scenario-ch0-1.md 챕터 1 v0.3.1)
// 곡: 간주(악보 26–33마디) + 1절(34–49마디). 1절에서는 기타가 쉰다
import type { ChordId } from './chords';
import type { ObjDef, StepDef } from './defs';
import { HALF_BPM, SONG_BPM, section } from './song';

export type Step1Id = 'c1sail' | 'c1snap' | 'c1room' | 'c1stage' | 'c1thorn' | 'c1rain' | 'c1after';

export const STEPS1: StepDef<Step1Id>[] = [
  { id: 'c1sail', objective: '박에 맞춰 노를 저어 섬으로', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c1snap', objective: '', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c1room', objective: '부표 넷을 1절 순서대로 · Fm → D♭ → E♭ → A♭', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c1stage', objective: '다음 섬으로 노를 저으세요', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c1thorn', objective: '박에 맞춰 버티세요', bpm: SONG_BPM, mode: 'acoustic' },
  { id: 'c1rain', objective: '흐르는 베이스를 따라 · 마디마다 그 코드를 울리세요', bpm: HALF_BPM, mode: 'acoustic' },
  { id: 'c1after', objective: '', bpm: HALF_BPM, mode: 'acoustic' },
];

export const STEP1_NAMES: Record<Step1Id, string> = {
  c1sail: '챕터 1 · 간주 항해', c1snap: '줄이 끊어짐', c1room: '밤의 방', c1stage: '빈 무대',
  c1thorn: '첫 번째 가시', c1rain: '비', c1after: '여운',
};

/** 챕터 1이 시작되는 곳 (챕터 0의 섬 앞) */
export const C1_START = 5.0;
/** 길을 막는 먹 바위 */
export const ROCKS = [5.95, 6.85];
/** 기억 그림 세 곳의 가운데 (배가 멈추는 곳) */
export const P_ROOM = 7.9, P_STAGE = 9.4, P_RAIN = 10.9;
/** 이 지점에 닿으면 줄이 끊어진다 */
export const SNAP_AT = P_ROOM - 0.45;
/** 기억 그림 너비 (화면 너비 단위). 액자 밖 그 사람은 화면 밖에 있어 둘러봐야 보인다 */
export const PAINT_W = 0.9;

const VERSE = section('verse').chords;
/** 1절 구절들 */
export const ROOM_SEQ: ChordId[] = VERSE.slice(0, 4);   // Fm D♭ E♭ A♭
export const STAGE_BARS: ChordId[] = VERSE.slice(4, 8); // D♭ E♭ C C
export const STAGE_SEQ: ChordId[] = ['Db', 'Eb'];
export const RAIN_BARS: ChordId[] = VERSE.slice(8, 16); // Fm D♭ E♭ A♭ D♭ E♭ Fm Fm
export const INTERLUDE_BARS: ChordId[] = section('interlude').chords;

export const OBJECTS1: ObjDef[] = [
  { id: 'rock0', kind: 'rock', wx: ROCKS[0], ry: 0.5 },
  { id: 'rock1', kind: 'rock', wx: ROCKS[1], ry: 0.5 },
  { id: 'isleRoom', kind: 'isle', wx: P_ROOM, ry: 0.06, s: 1.6, seed: 53 },
  { id: 'isleStage', kind: 'isle', wx: P_STAGE, ry: 0.06, s: 1.5, seed: 61 },
  { id: 'isleRain', kind: 'isle', wx: P_RAIN, ry: 0.06, s: 1.7, seed: 67 },
  { id: 'pRoom', kind: 'painting', wx: P_ROOM, scene: 'room', w: PAINT_W, edge: 'left', hidden: true },
  { id: 'pStage', kind: 'painting', wx: P_STAGE, scene: 'stage', w: PAINT_W, edge: 'left', hidden: true },
  { id: 'pRain', kind: 'painting', wx: P_RAIN, scene: 'rain', w: PAINT_W, edge: 'right', hidden: true },
  // 밤의 방 부표: 왼쪽부터 순서대로가 아니게 섞어 둔다
  { id: 'bRoomDb', kind: 'buoy', wx: P_ROOM - 0.3, ry: 0.8, chord: 'Db', hidden: true },
  { id: 'bRoomAb', kind: 'buoy', wx: P_ROOM - 0.1, ry: 0.8, chord: 'Ab', hidden: true },
  { id: 'bRoomFm', kind: 'buoy', wx: P_ROOM + 0.1, ry: 0.8, chord: 'Fm', hidden: true },
  { id: 'bRoomEb', kind: 'buoy', wx: P_ROOM + 0.3, ry: 0.8, chord: 'Eb', hidden: true },
  { id: 'bStageEb', kind: 'buoy', wx: P_STAGE - 0.22, ry: 0.8, chord: 'Eb', hidden: true },
  { id: 'bStageDb', kind: 'buoy', wx: P_STAGE + 0.22, ry: 0.8, chord: 'Db', hidden: true },
  { id: 'thorn', kind: 'thorn', wx: P_STAGE + 0.24, ry: 0.6, hidden: true },
];

export const TEXT1 = {
  lookHint: '바다 위를 끌면 둘러볼 수 있어요',
  rockHint: '바위가 길을 막았다 · 아주 빠르게 긁어 부수세요',
  rockBroken: '부서졌다',
  snapLine: '줄이… 끊어졌다',
  bassHint: '왼손으로 코드를 잡고 긁으면, 낮은 소리가 바다를 울린다',
  onBeat: '박에 맞춰',
  orderBroken: '순서가 흐트러졌다',
  stagePuzzle: '부표를 1절 순서대로 · D♭ → E♭',
  hold: '박에 맞춰 버티세요',
  pull: 'C로 가시를 뽑으세요 · Q S C',
  pullHint: '조성 밖의 C · 그 안의 E♮가 E♭을 되돌린다',
  rainStall: (label: string) => `해류가 되돌아간다 · 지금은 ${label}`,
  afterLine: '가시 하나가 빠졌다. 숨이 조금 가볍다',
  chapterEnd: '챕터 1 · 고집의 섬',
  nextChapter: '챕터 2 · 멈춘 시간 — 준비 중',
  progressBuoys: (n: number, total: number) => `${n} / ${total}`,
  progressHold: (n: number) => '버티기 ' + '▮'.repeat(n) + '▯'.repeat(Math.max(0, 6 - n)),
  progressRain: (label: string, n: number) => `${label} · ${n} / 8`,
};
