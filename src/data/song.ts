// 「피아니시모」 곡 구성 (docs/song-map.md를 게임이 읽는 형태로 옮긴 것)
import type { ChordId } from './chords';

/** MR 기준 실제 템포 */
export const SONG_BPM = 130;
/** 느린 장면용 템포 = 원곡의 절반 (박이 원곡과 맞물린다) */
export const HALF_BPM = 65;

export type SectionId =
  | 'pianoIntro' | 'hook' | 'chorus1' | 'interlude' | 'verse' | 'prechorus'
  | 'chorus2' | 'hookRap' | 'riffRap' | 'prechorusDS' | 'chorus3' | 'coda';

export interface Section {
  id: SectionId;
  name: string;
  /** 악보 마디 번호 (기타·베이스·드럼·멜로디 악보 기준) */
  bars: [number, number];
  /** 마디마다의 코드 */
  chords: ChordId[];
}

const CHORUS: ChordId[] = [
  'Db', 'Eb', 'Cm', 'Db',
  'Db', 'Eb', 'Cm', 'F',
  'Db', 'Eb', 'Cm', 'Db',
  'Db', 'Eb', 'Fsus4', 'F',
];
const RIFF: ChordId[] = ['Db', 'Eb', 'Cm', 'Db', 'Db', 'Eb', 'Fsus4', 'F'];
const HOOK: ChordId[] = ['Db6', 'Db6', 'Ab', 'Ab', 'Db6', 'Db6', 'Ab', 'Ab'];
const PRE: ChordId[] = ['Db', 'Eb', 'Cm', 'Db', 'Db', 'Eb', 'Csus4', 'C'];

/** 실제 연주 순서 */
export const SONG: Section[] = [
  { id: 'pianoIntro', name: '피아노 도입', bars: [0, 0], chords: ['Ab'] },
  { id: 'hook', name: '훅', bars: [1, 9], chords: ['Ab', ...HOOK] },
  { id: 'chorus1', name: '후렴 1', bars: [10, 25], chords: CHORUS },
  { id: 'interlude', name: '간주', bars: [26, 33], chords: RIFF },
  {
    id: 'verse', name: '1절', bars: [34, 49], chords: [
      'Fm', 'Db', 'Eb', 'Ab', 'Db', 'Eb', 'C', 'C',
      'Fm', 'Db', 'Eb', 'Ab', 'Db', 'Eb', 'Fm', 'Fm',
    ],
  },
  { id: 'prechorus', name: '프리코러스', bars: [50, 57], chords: PRE },
  { id: 'chorus2', name: '후렴 2', bars: [58, 73], chords: CHORUS },
  { id: 'hookRap', name: '훅 + 랩', bars: [74, 81], chords: HOOK },
  { id: 'riffRap', name: '리프 + 랩', bars: [82, 89], chords: RIFF },
  { id: 'prechorusDS', name: '프리코러스 (D.S.)', bars: [50, 57], chords: PRE },
  { id: 'chorus3', name: '후렴 3', bars: [58, 72], chords: CHORUS.slice(0, 15) },
  { id: 'coda', name: '코다', bars: [90, 98], chords: ['F', ...RIFF] },
];

export const section = (id: SectionId) => SONG.find(s => s.id === id)!;
