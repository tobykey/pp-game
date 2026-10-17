// 챕터 0 '안개' — 퍼즐 정의, 오브젝트 배치, 화면 문구
import type { ChordId } from './chords';

/** 등불을 울려야 하는 순서 (후렴 2회차 진행) */
export const SEQ: ChordId[] = ['Db', 'Eb', 'Cm', 'F'];

/** 각 등불이 뽑는 조표의 플랫(가시) 번호: B E A D 순서 중 */
export const THORN_OF: Partial<Record<ChordId, number>> = { Db: 3, Eb: 1, Cm: 0, F: 2 };

/** 조표의 플랫 넷 = 심장의 가시 넷. p는 오선 위 높이 */
export const THORNS = [
  { n: 'B', p: 2 },
  { n: 'E', p: 0.5 },
  { n: 'A', p: 2.5 },
  { n: 'D', p: 1 },
];

export type ObjKind = 'isle' | 'lamp' | 'refl' | 'whisper';

export interface ObjDef {
  id: string;
  kind: ObjKind;
  /** 화면 비율 위치 (rx: 가로, ry: 수평선~바다 아래 사이) */
  rx?: number;
  ry?: number;
  /** 섬 크기 배율 */
  s?: number;
  /** 섬 모양 난수 seed */
  seed?: number;
  /** 등불이 반응하는 코드 */
  chord?: ChordId;
  /** 발견 전에 보이는 기호 */
  hint?: string;
  /** pp(아주 여리게)로만 보이는 것 */
  pp?: boolean;
}

export const OBJECTS: ObjDef[] = [
  { id: 'isleL', kind: 'isle', rx: 0.18, ry: 0.36, s: 1, seed: 7 },
  { id: 'isleR', kind: 'isle', rx: 0.85, ry: 0.18, s: 0.62, seed: 19 },
  { id: 'Db', kind: 'lamp', rx: 0.32, ry: 0.74, chord: 'Db' },
  { id: 'Eb', kind: 'lamp', rx: 0.66, ry: 0.3, chord: 'Eb' },
  { id: 'Cm', kind: 'lamp', rx: 0.17, ry: 0.7, chord: 'Cm' },
  { id: 'F', kind: 'lamp', rx: 0.85, ry: 0.7, chord: 'F', hint: '♮' },
  { id: 'refl', kind: 'refl' },
  { id: 'whisper', kind: 'whisper', rx: 0.5, ry: 0.86, pp: true },
];

export const TEXT = {
  objective: '안개 속 등불 넷을 찾아, 곡의 순서대로 울리세요',
  objectiveDone: '첫 번째 돛 완성. 음색을 바꿔 같은 코드를 다시 울려 보세요',
  progress: (found: number, lit: number) => `발견 ${found} / 4 · 점등 ${lit} / 4`,
  firstHint: '아래 여섯 줄을 긁어 보세요',
  lampFound: (label: string) => `등불 발견 · ${label}`,
  lampTremble: '어딘가에서 등불이 떨렸다',
  lampLit: (label: string, n: number) => `${label} 등불 · ${n} / 4`,
  orderBroken: '순서가 흐트러졌다',
  sailOpened: '돛이 펴졌다',
  restart: '다시, 안개 속으로',
  whisper: '아주 여리게 · 나는 여기 있어',
  whisperScattered: '세게 울리자 흩어져 버렸다',
};
