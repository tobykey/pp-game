// 코드(화음) 정의. v는 6번 줄(굵은 줄)부터 1번 줄까지의 MIDI 음높이, null은 소리 없는 줄(뮤트)
export type ChordId = 'open' | 'Db' | 'Eb' | 'Cm7' | 'F' | 'Ab' | 'C' | 'D';

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
  Eb: { label: 'E♭', keys: ['W', 'E', 'R'], v: [null, 51, 58, 63, 67, 70] },
  Cm7: { label: 'Cm7', keys: ['Z', 'X', 'C', 'V'], v: [null, 48, 55, 58, 63, 67] },
  F: { label: 'F', keys: ['Q', 'A', 'Z'], v: [41, 48, 53, 57, 60, 65], oos: true },
  Ab: { label: 'A♭', keys: ['W', 'S', 'X'], v: [44, 51, 56, 60, 63, 68] },
  C: { label: 'C', keys: ['Q', 'S', 'C'], v: [null, 48, 52, 55, 60, 64] },
  D: { label: 'D', keys: ['S', 'Z', 'C'], v: [null, null, 50, 57, 62, 66] },
};

/** 코드 키로 쓰는 글자들 */
export const CHORD_LETTERS = new Set('QWERASDFZXCV'.split(''));

/** 상단 운지표 칩 순서. '|'는 구분선 */
export const CHIP_ORDER: (ChordId | '|')[] = ['Db', 'Eb', 'Cm7', 'F', 'Ab', '|', 'C', 'D'];
