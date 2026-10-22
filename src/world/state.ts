// 게임 전체가 함께 읽고 쓰는 상태
import type { ChordId } from '../data/chords';
import type { ModeId } from '../data/modes';
import { OBJECTS } from '../data/chapter0';
import { OBJECTS1 } from '../data/chapter1';
import { OBJECTS2 } from '../data/chapter2';
import { OBJECTS3 } from '../data/chapter3';
import { OBJECTS4 } from '../data/chapter4';
import { OBJECTS5 } from '../data/chapter5';
import type { ObjDef } from '../data/defs';
import type { StepId } from '../data/steps';
import { seeded } from '../util/math';

/** 화면 크기 (CSS 픽셀)와 화면 배율 */
export const view = { W: 0, H: 0, DPR: 1 };

export type Groove = 'none' | 'heart' | 'hook' | 'chorus' | 'verse' | 'pre' | 'storm' | 'mr';

export const S = {
  started: false,
  t: 0,
  mode: 'korean' as ModeId,
  chord: 'open' as ChordId,
  /** 지금 누르고 있는 코드 키 */
  held: new Set<string>(),
  /** 터치용: 칩을 눌러 고정한 코드 */
  sticky: null as ChordId | null,
  /** 장면이 자동으로 잡아 주는 코드 (후렴 예고) */
  forced: null as ChordId | null,
  /** 운지표에 열린 코드 */
  unlocked: new Set<ChordId>(),
  /** Shift 팜뮤트 */
  mute: false,
  shake: 0,
  flash: 0,
  flashCol: '#ff2a7f',
  /** 마지막으로 친 세기 표시 (pp~ff) */
  dyn: null as { m: string; d: number; t: number } | null,
  /** 코드가 바뀔 때 도장이 튀는 연출 */
  seal: 0,

  /** 지금 장면 */
  step: 'wake' as StepId,

  // 박
  bpm: 65,
  /** 박 0번의 시각 (performance.now 기준 초) */
  clock0: 0,
  groove: 'none' as Groove,
  /** 박이 울릴 때마다 1이 되었다가 줄어듦 (화면의 박 표시) */
  pulse: 0,

  // 배와 항해
  /** 배의 세계 가로 위치 (화면 너비 단위) */
  boat: 0,
  /** 배 속도 (화면/초) */
  vel: 0,
  /** 장면이 정하는 기본 속도 (후렴 예고에서 저절로 나아감) */
  cruise: 0,
  /** 배가 기우뚱하는 정도 */
  wobble: 0,
  /** 직전 노의 방향 (1 다운 = 왼쪽 노, -1 업 = 오른쪽 노) */
  lastOar: 0,

  // 연출
  /** 눈 감은 어둠 (1 완전히 검음 ~ 0) */
  black: 0,
  /** 장면이 떠오르는 정도 (0 하얀 빛 ~ 1) */
  reveal: 1,
  stringsVis: 1,
  /** 안개 짙기 */
  fog: 1, fogT: 1,
  /** 등불 사이 물길 */
  road: 0,
  /** 후렴 예고의 형광 */
  vision: 0, visionT: 0,
  /** 활짝 편 돛 (예고에서만) */
  sail: 0, sailT: 0,
  /** 천 조각 돛 (첫 조각이 감기는 연출) */
  scrap: 0,
  /** 모은 '희망의 돛' 조각 수 (0~6). 조각이 늘 때마다 그 사람의 띠가 짧아진다 */
  pieces: 0,
  /** 그 사람의 띠 길이 (천 조각을 얻으면 조금 짧아짐) */
  sash: 1, sashT: 1,
  /** 기타 침묵 (1절): 줄을 긁어도 소리 대신 먹먹한 틱만 */
  silence: false,
  /** 화면에 보이는 침묵 정도 (줄이 흐려지고 끊어짐, 색이 빠짐) */
  hush: 0,
  /** 인물 줌인 (0 ~ 1) */
  zoom: 0, zoomT: 0,

  // 챕터 1
  /** 둘러보기: 화면을 배 기준에서 옆으로 돌려 본 정도 (화면 너비 단위) */
  look: 0,
  /** 둘러보기를 쓸 수 있는지 (챕터 1부터) */
  lookable: false,
  /** 지금 둘러보는 중인지 (← → 키를 누르고 있음) */
  dragLook: false,
  /** 둘러보는 방향: -1 왼쪽(지나온 쪽), 1 오른쪽(앞쪽), 0 안 봄 */
  lookDir: 0,
  /** 가시 클라이맥스: 버티기 게이지 (0~1), 세상이 어두워진 정도 */
  meter: 0,
  dim: 0, dimT: 0,
  /** 길을 막은 바위 (그 자리를 점선으로 안내) */
  rockGuide: null as string | null,

  // 화면 안내
  /** 다음에 칠 코드 (코드 도장 위에 미리보기) */
  nextChord: null as ChordId | null,
  /** 일시정지 */
  paused: false,
  /** 박 보정 (초). 메뉴에서 조절. +면 늦게 쳐도 맞음 */
  offset: 0,
  /** 그 사람의 자세 (0 손을 내 쪽으로 뻗음, 1 가슴에 손, 2 기타 쪽으로). 내가 보지 않을 때 바뀐다 */
  pose: 0,
  /** 그 사람의 손목에 간 금 */
  crack: 0,
  /** 가시 둘레 소용돌이 */
  vortex: 0, vortexT: 0,
  /** 속삭임이 흐려진 정도 */
  whisperFade: 0,

  // 챕터 2
  /** 멈춘 시간: 평소 스트로크는 빗방울에 막혀 뭉개지고, 팜뮤트만 또렷하다 */
  frozen: false,
  /** 멈춘 비가 화면에 보이는 정도 */
  frozenVis: 0, frozenVisT: 0,
  /** 쏟아지는 비 */
  rainFall: 0, rainFallT: 0,
  /** 곧 노란 빗줄기가 덮친다 (박 안내 원이 노랗게) */
  guardCue: false,
  /** 막았을 때 배 위에 펴지는 우산 모양 먹 번짐 */
  shield: 0,
  /** 슬로모션: 세상이 흐르는 빠르기 (1 보통) */
  timeScale: 1,
  /** 슬로모션 연출 정도 (0~1) */
  slowmo: 0, slowmoT: 0,
  /** 떠다니는 피크: 손에서 빠져나간 피크가 화면 네 벽에 부딪히며 떠다닌다 */
  pickFree: false,
  /** 떠다니던 피크를 붙잡았다 (마우스를 따라온다) */
  pickHeld: false,
  /** 떠다니는 피크의 화면 위치와 속도 */
  hx: 0, hy: 0, pvx: 0, pvy: 0,
  /** 슬로모션이 풀리는 순간의 폭발 (1 → 0) */
  burst: 0,

  // 챕터 3
  /** 희망의 돛: 여섯 조각을 기워 만든 돛 */
  hopeSail: false,
  /** F 폭발 게이지 = 돛의 조각 중 형광으로 빛나는 수 (0~6) */
  glow: 0,
  /** 곧 파란 파도가 덮친다 (박 안내 원이 파랗게) */
  counterCue: false,
  /** 그 사람의 띠와 겉옷이 사라졌다 (모자란 두 조각이 되었다) */
  bare: false,
  /** 가시를 받는 손 (1 → 0) */
  catchT: 0,
  /** 화면을 덮는 하얀 빛 (보여 주지 않는 장면을 가린다) */
  white: 0, whiteT: 0,
  /** 돛에 번지는 가사 */
  lyric: 0, lyricT: 0,
  /** 돛 게이지 표시 (등대의 바다에서만) */
  gaugeOn: false,
  /** 돛 조각이 막 빛났을 때 튀어 오르는 연출 (1 → 0) */
  glowPop: 0,
  /** F 폭발: 화면 배율이 확 당겨졌다 풀린다 */
  punch: 0, punchT: 0,
  /** F 폭발: 형광이 화면 전체로 번졌다가 걷힌다 (1 → 0) */
  fburst: 0,

  // 챕터 4
  /** 바다가 말라 갈라진 바닥이 드러난 정도 */
  dry: 0, dryT: 0,
  /** 폭풍: 어두운 하늘, 갈필 바람, 수평선의 물벽 */
  storm: 0, stormT: 0,
  /** 폭주 스트로크: 화면이 배 쪽으로 조여 오는 정도 */
  press: 0, pressT: 0,
  /** 격돌 게이지 (0 = 물벽에 밀림, 1 = 다 밀어냄). 음수면 격돌 중이 아님 */
  tug: -1,
  /** D.S. 표지가 빛나는 정도 */
  dsT: 0, ds: 0,

  // 챕터 5
  /** 제자리표(♮)를 얻었다: 물그림자에 두 사람이 비친다, 오선에 ♮ */
  natural: false,
  /** 둘러보기를 놓아도 배 쪽으로 돌아오지 않는다 (시점 맞추기 퍼즐) */
  lookHold: false,
  /** 멈춘 비를 지금 배 근처로 옮겨 그리는 거리 (D.S.: 같은 순간으로 돌아옴) */
  rainShift: 0,
  /** 자리가 바뀐다: 0 = 내가 기타를 안고 그 사람이 누움, 1 = 그 사람이 기타를 안고 내가 누움 */
  swap: 0, swapT: 0,
  /** 뱃머리 아래 물속에 가라앉아 빛나는, 내가 뽑은 ♭ 셋 */
  sunk: 0, sunkT: 0,
  /** 쉼표(침묵) 퍼즐: 차오른 정도 (음수면 꺼짐), 깨진 순간 */
  rest: -1, restCrackT: -9,
  /** 마지막 가시 B♭이 심장 박동에 맞춰 빛난다 */
  bflat: 0, bflatT: 0,
  /** 두 번째 심장 소리의 크기 (기본 1) */
  heart2: 1,

  // 챕터 6
  /** 그 사람이 일어나 기타를 안고 앉는다 (격돌 ②) */
  rise: 0, riseT: 0,
  /** 줄이 두 사람 몫으로: 열두 줄 */
  duet: 0, duetT: 0,
  /** 두 번째 심장: 첫째와의 어긋남(초), 몇 박마다 뛰는지 (0 = 멈춤) */
  heart2Off: 0.29, heart2Every: 1,
  /** 마지막 선택 (빈 문자열 = 아직) */
  ending: '' as '' | 'keep' | 'give',
};

export interface StringState { amp: number; ph: number; hot: number }
export const str: StringState[] = [...Array(6)].map(() => ({ amp: 0, ph: 0, hot: 0 }));

/** 파동은 세계 좌표(wx)에 남는다. 배가 움직여도 물 위 제자리에서 퍼진다 */
export interface Ripple { wx: number; y: number; r: number; max: number; sp: number; dyn: number; t: number; acc: string }
export interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; dec: number; c: string }
export interface SpeedLine { x: number; y: number; a: number; l: number; life: number; c: string }
/** 날아오는 천 조각 (burn이면 도중에 타 버린다 = 잃은 조각) */
export interface Flyer { x: number; y: number; t: number; dur: number; burn: boolean }
/** 박 판정 먹 도장 */
export interface Mark { kind: 'perfect' | 'good' | 'miss'; t: number }

/** 파동 · 먹 방울 · 집중선 */
export const fx = { rip: [] as Ripple[], parts: [] as Particle[], lines: [] as SpeedLine[], marks: [] as Mark[], flyers: [] as Flyer[] };

/** 조표의 플랫 넷 = 심장의 가시 넷. p는 오선 위 높이. 챕터 0에서는 하나도 빠지지 않는다 */
export interface Thorn { n: string; p: number; gone: boolean; fly: { t: number; vx: number; vy: number; rot: number; toBow?: boolean } | null }
export const thorns: Thorn[] = [
  { n: 'B', p: 2 }, { n: 'E', p: 0.5 }, { n: 'A', p: 2.5 }, { n: 'D', p: 1 },
].map(o => ({ ...o, gone: false, fly: null }));

export interface WorldObj extends ObjDef {
  vis: number;
  detail: number;
  found: boolean;
  /** 등불이 켜진 횟수 */
  lit: number;
  /** 등불이 공명해 떨리는 정도 */
  res: number;
  /** 섬 능선 점들 */
  pts: [number, number][];
  /** 바위: 부서짐 · 그림 속 '새 줄을 든 손': 흩어짐 */
  gone: boolean;
  /** 기억 그림이 움직이는 진행 (0~1) */
  play: number;
  /** 액자 밖 그 사람이 보인 정도 (0~1) — 둘러본 사람만 */
  look: number;
  /** 액자 밖 그 사람을 한 번이라도 제대로 봤는지 (기억 테스트용) */
  seen: boolean;
}

export const OBJ: WorldObj[] = [...OBJECTS, ...OBJECTS1, ...OBJECTS2, ...OBJECTS3, ...OBJECTS4, ...OBJECTS5].map(o => ({
  ...o, vis: 0, detail: 0, found: false, lit: 0, res: 0, pts: [], gone: false, play: 0, look: 0, seen: false,
}));
OBJ.filter(o => o.kind === 'isle').forEach(o => {
  const r = seeded(o.seed ?? 1);
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    o.pts.push([u, Math.pow(Math.sin(Math.PI * u), 0.8) * (0.45 + r() * 0.55)]);
  }
});

export const obj = (id: string) => OBJ.find(o => o.id === id)!;

/** 천 조각: 물길을 따라 떠내려오는 것 */
export const cloth = { active: false, wx: 0, ry: 0.55, tied: false };
