// 게임 전체가 함께 읽고 쓰는 상태
import type { ChordId } from '../data/chords';
import type { ModeId } from '../data/modes';
import { OBJECTS, type ObjDef, type StepId } from '../data/chapter0';
import { seeded } from '../util/math';

/** 화면 크기 (CSS 픽셀)와 화면 배율 */
export const view = { W: 0, H: 0, DPR: 1 };

export type Groove = 'none' | 'heart' | 'hook' | 'chorus';

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
  /** 장면이 먹으로 그려지는 정도 (0 빈 한지 ~ 1) */
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
  /** 천 조각 돛 */
  scrap: 0,
  /** 그 사람의 띠 길이 (천 조각을 얻으면 조금 짧아짐) */
  sash: 1, sashT: 1,
};

export interface StringState { amp: number; ph: number; hot: number }
export const str: StringState[] = [...Array(6)].map(() => ({ amp: 0, ph: 0, hot: 0 }));

/** 파동은 세계 좌표(wx)에 남는다. 배가 움직여도 물 위 제자리에서 퍼진다 */
export interface Ripple { wx: number; y: number; r: number; max: number; sp: number; dyn: number; t: number; acc: string }
export interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; dec: number; c: string }
export interface SpeedLine { x: number; y: number; a: number; l: number; life: number; c: string }

/** 파동 · 먹 방울 · 집중선 */
export const fx = { rip: [] as Ripple[], parts: [] as Particle[], lines: [] as SpeedLine[] };

/** 조표의 플랫 넷 = 심장의 가시 넷. p는 오선 위 높이. 챕터 0에서는 하나도 빠지지 않는다 */
export interface Thorn { n: string; p: number; gone: boolean; fly: { t: number; vx: number; vy: number; rot: number } | null }
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
}

export const OBJ: WorldObj[] = OBJECTS.map(o => ({ ...o, vis: 0, detail: 0, found: false, lit: 0, res: 0, pts: [] }));
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
