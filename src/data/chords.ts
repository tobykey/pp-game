// 코드(화음) 정의. v는 6번 줄(굵은 줄)부터 1번 줄까지의 MIDI 음높이, null은 소리 없는 줄(뮤트)
export type ChordId =
  | 'open' | 'Db' | 'Db6' | 'Eb' | 'Cm' | 'F' | 'Fsus4' | 'Fm' | 'Ab' | 'C' | 'Csus4' | 'D';

export interface Chord {
  label: string;
  /** 왼손으로 함께 누르는 키보드 키 */
  keys: string[];
  v: (number | null)[];
  /** 조성 밖의 코드 (핑크로 표시) */
  oos?: boolean;
}

export const CHORDS: Record<ChordId, Chord> = {
  open: { label: '개방', keys: [], v: [40, 45, 50, 55, 59, 64] },
  Db: { label: 'D♭', keys: ['A', 'S', 'D'], v: [null, 49, 56, 61, 65, 68] },
  // D♭6 = D♭ F A♭ B♭. D♭ 키에 F 키를 더한다
  Db6: { label: 'D♭6', keys: ['A', 'S', 'D', 'F'], v: [null, 49, 56, 58, 65, 68] },
  Eb: { label: 'E♭', keys: ['W', 'E', 'R'], v: [null, 51, 58, 63, 67, 70] },
  Cm: { label: 'Cm', keys: ['Z', 'X', 'C', 'V'], v: [null, 48, 55, 60, 63, 67] },
  F: { label: 'F', keys: ['Q', 'A', 'Z'], v: [41, 48, 53, 57, 60, 65], oos: true },
  Fsus4: { label: 'Fsus4', keys: ['Q', 'A', 'Z', 'X'], v: [41, 48, 53, 58, 60, 65] },
  Fm: { label: 'Fm', keys: ['A', 'Z', 'X'], v: [41, 48, 53, 56, 60, 65] },
  Ab: { label: 'A♭', keys: ['W', 'S', 'X'], v: [44, 51, 56, 60, 63, 68] },
  C: { label: 'C', keys: ['Q', 'S', 'C'], v: [null, 48, 52, 55, 60, 64], oos: true },
  Csus4: { label: 'Csus4', keys: ['Q', 'S', 'C', 'V'], v: [null, 48, 53, 55, 60, 65] },
  D: { label: 'D', keys: ['S', 'Z', 'C'], v: [null, null, 50, 57, 62, 66] },
};

/** 베이스가 치는 근음 (MIDI) */
export const ROOT: Record<ChordId, number> = {
  open: 28, Db: 37, Db6: 37, Eb: 39, Cm: 36, F: 41, Fsus4: 41, Fm: 41, Ab: 32, C: 36, Csus4: 36, D: 38,
};

/** 코드 키로 쓰는 글자들 */
export const CHORD_LETTERS = new Set('QWERASDFZXCV'.split(''));

/** 운지표 칩 순서. '|'는 구분선. 실제로 보이는 칩은 챕터에서 연 것만 */
export const CHIP_ORDER: (ChordId | '|')[] = ['Db6', 'Db', 'Eb', 'Cm', 'Fm', 'Ab', '|', 'F', 'Fsus4', 'C', 'Csus4'];
