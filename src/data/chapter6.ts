// 챕터 6 '깨어남' — 장면 순서, 마지막 관문의 패턴, 화면 문구, 엔딩 (시나리오: docs/scenario-ch6.md)
// 곡: 후렴 3 (To Coda에서 끊김) → 코다. 마지막 화음은 조성 밖의 F
import type { ChordId } from './chords';
import type { StepDef } from './defs';
import { HALF_BPM, SONG_BPM, section } from './song';

export type Step6Id = 'c6chorus' | 'c6gauntlet' | 'c6clash' | 'c6together' | 'c6heart' | 'c6choice' | 'c6coda' | 'c6end';

export const STEPS6: StepDef<Step6Id>[] = [
  { id: 'c6chorus', objective: '마지막 후렴 · 바람을 타세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c6gauntlet', objective: '노란 빛엔 Shift · 파란 빛엔 세게 · F를 기다려', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c6clash', objective: '쉬지 말고 긁으세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c6together', objective: '함께 긁으세요', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c6heart', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c6choice', objective: '', bpm: HALF_BPM, mode: 'strings' },
  { id: 'c6coda', objective: '', bpm: SONG_BPM, mode: 'rock' },
  { id: 'c6end', objective: '', bpm: HALF_BPM, mode: 'strings' },
];

export const STEP6_NAMES: Record<Step6Id, string> = {
  c6chorus: '챕터 6 · 마지막 후렴', c6gauntlet: '마지막 관문', c6clash: '격돌 ②', c6together: '두 사람의 줄',
  c6heart: '두 박동', c6choice: 'B♭ · 선택', c6coda: '코다', c6end: '엔딩',
};

/** 챕터 6이 시작되는 곳 (챕터 5 끝) */
export const C6_START = 34.0;
/** 후렴 3: 앞 8마디는 '마지막 후렴', 이어서 후렴 16마디를 네 단계로 빨라지며 '마지막 관문' */
export const CHORUS3: ChordId[] = section('chorus3').chords;
export const CHORUS: ChordId[] = section('chorus2').chords;
export const CODA: ChordId[] = section('coda').chords;
export const RIFF6: ChordId[] = section('riffRap').chords;

/** 마지막 후렴: 듬성듬성 파란 빛 (그루브 박) */
export const CHORUS_COUNTERS = [{ beat: 10, lead: 1 }, { beat: 22, lead: 1 }];

/**
 * 마지막 관문: 네 단계(각 4마디 = 16박), 단계마다 빨라진다. 박은 그 단계 안에서 0~15.
 * 단계 1·3의 마지막 마디(12~15박)는 F 마디 (F 폭발)
 */
export const GAUNTLET: { bpm: number; counters: { beat: number; lead: number }[]; guards: number[]; fBar: boolean; fade: boolean }[] = [
  { bpm: 130, counters: [{ beat: 4, lead: 1 }, { beat: 8, lead: 1 }, { beat: 12, lead: 1 }], guards: [6, 14], fBar: false, fade: false },
  { bpm: 140, counters: [{ beat: 2, lead: 1 }, { beat: 5, lead: 1 }, { beat: 8, lead: 0.5 }], guards: [3, 7, 10], fBar: true, fade: false },
  { bpm: 150, counters: [{ beat: 1, lead: 0.5 }, { beat: 4, lead: 0.5 }, { beat: 7, lead: 1 }, { beat: 10, lead: 0.5 }, { beat: 13, lead: 0.5 }], guards: [2, 5, 8, 11, 14], fBar: false, fade: true },
  { bpm: 160, counters: [{ beat: 1, lead: 0.5 }, { beat: 3, lead: 0.5 }, { beat: 5, lead: 0.5 }, { beat: 8, lead: 0.5 }], guards: [2, 4, 6, 9, 10], fBar: true, fade: true },
];

/** 격돌 ②: 혼자서는 감당할 수 없는 빠르기 */
export const CLASH2_BPMS = [160, 180, 200, 215, 230];

/** 그 사람과 함께 긁을 때 하나씩 가세하는 것들 (모아 온 조각과 기억) */
export const ALLIES = ['담요', '새 줄', '우산', '첫 만남', '띠', '겉옷', '붓글씨', '피크의 ♭', '두 번째 심장'];

export const TEXT6 = {
  back: '다시, 꿈의 바다',
  gauntletChips: '손이 기억한다',
  clashHint: '박은 잊고 · 쉬지 말고!',
  clashAgain: '조금만 더…',
  rise: '그 사람이, 일어났다',
  together: '함께!',
  won: '함께, 밀어냈다',
  heart1: '두 박동이, 나란히',
  heart2: '하나가, 느려진다',
  choiceHint: '← → 로 바라보고, 아주 여리게',
  choiceHard: '세게 울리면, 흔들릴 뿐',
  keep: '내가 다시 품는다',
  give: '너에게 맡긴다',
  codaF: 'F',
  end: '끝 · 처음부터 다시 하려면 새로고침',
};

/** 엔딩: 고른 쪽의 에필로그 (docs/story.md 5장) */
export const EPILOGUE: Record<'keep' | 'give', string[]> = {
  keep: [
    '눈을 떴을 때 처음 들린 건 기타 소리였다.',
    '머리맡에서 누군가 아주 여리게, 같은 노래를 치고 있었다.',
    '가슴 한가운데가 아팠다. 그 아픔이 반가웠다.',
    '손을 뻗었다. 이번에는 내 쪽에서.',
  ],
  give: [
    '아침은 가벼웠다. 아픈 데가 없었다.',
    '창가에 기타 한 대가 세워져 있었다. 누구 것인지 기억나지 않았다.',
    '줄을 한 번 긁어 보았다. 손끝이 먼저 코드를 잡았다.',
    '왜인지 F였다.',
  ],
};

/** 엔딩 뒤 제작 의도 해설: 곡의 장치가 게임의 무엇이었는지 (음악을 몰라도 알 수 있게) */
export const EXPLAIN: { mark: string; title: string; line: string }[] = [
  { mark: '♭♭♭♭', title: '조표의 플랫 넷 = 가시 넷', line: '이 곡의 조표에는 플랫이 넷. 하나씩 뽑을 때마다 그 사람이 삼켰다' },
  { mark: 'F', title: '조성 밖의 F = 그 사람', line: '곡에 어울리지 않는 듯 끼어드는 화음. 가장 큰 순간마다 울리고, 곡의 마지막 화음도 F다' },
  { mark: '𝄽', title: '1절의 쉼 = 듣지 않던 시간', line: '악보에서 1절엔 기타가 없다. 그 사람의 소리를 듣지 않고 혼자 버티던 시간' },
  { mark: 'D♭ E♭ Cm', title: '닿지 않는 후렴', line: '후렴은 한 번도 으뜸화음(A♭)에 도착하지 않는다. 해결되지 않는 그리움' },
  { mark: 'D.S.', title: '세뇨로 돌아가라', line: '곡이 같은 구절로 돌아가듯, 이야기도 같은 순간으로 돌아가 다른 쪽에서 보았다' },
  { mark: 'pp', title: '피아니시모, 아주 여리게', line: '세게 울리는 데 익숙해진 손에는 들리지 않는 목소리가 있었다' },
];
