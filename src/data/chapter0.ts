// 챕터 0 '안개' — 장면 순서, 오브젝트 배치, 화면 문구 (시나리오: docs/scenario-ch0-1.md)
import type { ChordId } from './chords';
import type { ModeId } from './modes';
import { HALF_BPM, SONG_BPM, section } from './song';

export type StepId = 'wake' | 'whisper' | 'row' | 'lamps' | 'hook' | 'reflect' | 'cloth' | 'chorus' | 'island' | 'end';

export interface StepDef {
  id: StepId;
  /** 화면 위쪽 목표 문구 (빈 문자열이면 숨김) */
  objective: string;
  bpm: number;
  mode: ModeId;
}

export const STEPS: StepDef[] = [
  { id: 'wake', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'whisper', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'row', objective: '박동에 맞춰 노를 저어 안개 속으로', bpm: HALF_BPM, mode: 'korean' },
  { id: 'lamps', objective: '안개 속 등불 둘을 찾으세요', bpm: HALF_BPM, mode: 'korean' },
  { id: 'hook', objective: '박에 맞춰 울리세요 · D♭6 → A♭ → D♭6 → A♭', bpm: SONG_BPM, mode: 'korean' },
  { id: 'reflect', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'cloth', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'chorus', objective: '박에 맞춰 노를 저으세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'island', objective: '', bpm: HALF_BPM, mode: 'korean' },
  { id: 'end', objective: '챕터 1 · 고집의 섬 — 준비 중', bpm: HALF_BPM, mode: 'korean' },
];

/** 장면 이름 (이어하기·건너뛰기 표시용) */
export const STEP_NAMES: Record<StepId, string> = {
  wake: '눈뜸', whisper: '속삭임', row: '노 젓기', lamps: '등불 찾기', hook: '훅',
  reflect: '물그림자', cloth: '천 조각', chorus: '후렴 1, 예고', island: '섬', end: '끝',
};

/** 노 저어 가야 하는 거리 (화면 너비 단위) */
export const ROW_DIST = 2.2;
/** 등불이 있는 곳 = 배가 멈추는 곳 */
export const LAMP_X = ROW_DIST;
/** 훅: 울려야 하는 코드 순서 (악보 훅의 D♭6–A♭ 두 번) */
export const HOOK_SEQ: ChordId[] = ['Db6', 'Ab', 'Db6', 'Ab'];
/** 후렴 1 예고: 후렴 앞 8마디 */
export const CHORUS_BARS: ChordId[] = section('chorus1').chords.slice(0, 8);
/** 후렴 예고 동안 배가 저절로 나아가는 속도 (화면/초) */
export const CHORUS_SPEED = 0.1;
/** 박 판정 허용 오차 (초) */
export const BEAT_WINDOW = 0.16;

export type ObjKind = 'isle' | 'lamp' | 'refl' | 'whisper';

export interface ObjDef {
  id: string;
  kind: ObjKind;
  /** 세계 가로 위치 (화면 너비 단위, 배 출발점 = 0) */
  wx?: number;
  /** 배에 붙어 다니는 것: 배 기준 가로 위치 (0.5 = 배 바로 아래) */
  rx?: number;
  /** 수평선(0)~바다 아래 끝(1) 사이 높이 */
  ry?: number;
  /** 섬 크기 배율 */
  s?: number;
  /** 섬 모양 난수 seed */
  seed?: number;
  /** 등불이 반응하는 코드 */
  chord?: ChordId;
  /** pp(아주 여리게)로만 보이는 것 */
  pp?: boolean;
  /** 장면이 정할 때까지 파동에도 드러나지 않음 */
  hidden?: boolean;
}

export const OBJECTS: ObjDef[] = [
  { id: 'isleA', kind: 'isle', wx: 0.72, ry: 0.36, s: 1, seed: 7 },
  { id: 'isleB', kind: 'isle', wx: 1.55, ry: 0.18, s: 0.62, seed: 19 },
  { id: 'isleC', kind: 'isle', wx: 2.95, ry: 0.3, s: 0.8, seed: 23 },
  { id: 'Db6', kind: 'lamp', wx: LAMP_X - 0.2, ry: 0.74, chord: 'Db6', hidden: true },
  { id: 'Ab', kind: 'lamp', wx: LAMP_X + 0.21, ry: 0.32, chord: 'Ab', hidden: true },
  { id: 'isleGoal', kind: 'isle', wx: LAMP_X + 2.3, ry: 0.22, s: 1.35, seed: 41, hidden: true },
  { id: 'refl', kind: 'refl' },
  { id: 'whisper', kind: 'whisper', rx: 0.5, ry: 0.86, pp: true },
];

export const TEXT = {
  hintStrum: '줄을 긁어 보세요',
  hintSoft: '더 여리게, 천천히',
  hintRow: '박동에 맞춰, 아래로 · 위로',
  hintRowMiss: '쿵, 하고 울릴 때 긁어 보세요',
  hintSameOar: '아래로 한 번, 위로 한 번',
  hintFind: '가는 줄로 비추면 글자가 보입니다',
  hintChord: '왼손으로 코드를 잡고 긁으세요',
  hintOnBeat: '박에 맞춰',
  hintReflect: '등불 빛이 물을 비춘다',
  reflectExcuse: '안개가 물빛을 흐린다',
  hintCloth: '줄을 긁어 돛대에 감으세요',
  clothLine: '어디서 흘러왔을까. 낯익은 색이다',
  visionEnd: '아직은, 닿지 않는 바람',
  islandLine: '안개 너머, 섬 하나',
  chapterEnd: '챕터 0 · 안개',
  lampFound: (label: string) => `등불 발견 · ${label}`,
  lampTremble: '어딘가에서 등불이 떨렸다',
  hookLit: (label: string, n: number) => `${label} · ${n} / 4`,
  orderBroken: '순서가 흐트러졌다',
  roadOpen: '물길이 열렸다',
  whisper: '아주 여리게 · 나는 여기 있어',
  whisperScattered: '세게 울리자 흩어져 버렸다',
  progressFound: (found: number) => `발견 ${found} / 2`,
  progressHook: (n: number) => `${n} / 4`,
};
