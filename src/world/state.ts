// 게임 전체가 함께 읽고 쓰는 상태
import type { ChordId } from '../data/chords';
import type { ModeId } from '../data/modes';
import { OBJECTS, THORNS, type ObjDef } from '../data/chapter0';
import { seeded } from '../util/math';

/** 화면 크기 (CSS 픽셀)와 화면 배율 */
export const view = { W: 0, H: 0, DPR: 1 };

export const S = {
  started: false,
  t: 0,
  mode: 'rock' as ModeId,
  chord: 'open' as ChordId,
  /** 지금 누르고 있는 코드 키 */
  held: new Set<string>(),
  /** 터치용: 칩을 눌러 고정한 코드 */
  sticky: null as ChordId | null,
  /** Shift 팜뮤트 */
  mute: false,
  shake: 0,
  flash: 0,
  flashCol: '#ff2a7f',
  /** 마지막으로 친 세기 표시 (pp~ff) */
  dyn: null as { m: string; d: number; t: number } | null,
  /** 코드가 바뀔 때 도장이 튀는 연출 */
  seal: 0,
  /** 순서대로 켠 등불 수 */
  progress: 0,
  /** 돛이 펴진 시각 */
  finale: null as number | null,
  sail: 0,
  sailT: 0,
};

export interface StringState { amp: number; ph: number; hot: number }
export const str: StringState[] = [...Array(6)].map(() => ({ amp: 0, ph: 0, hot: 0 }));

export interface Ripple { x: number; y: number; r: number; max: number; sp: number; dyn: number; t: number; acc: string }
export interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; dec: number; c: string }
export interface SpeedLine { x: number; y: number; a: number; l: number; life: number; c: string }

/** 파동 · 먹 방울 · 집중선 */
export const fx = { rip: [] as Ripple[], parts: [] as Particle[], lines: [] as SpeedLine[] };

export interface Thorn {
  n: string;
  p: number;
  gone: boolean;
  fly: { t: number; vx: number; vy: number; rot: number } | null;
}
export const thorns: Thorn[] = THORNS.map(o => ({ ...o, gone: false, fly: null }));

export interface WorldObj extends ObjDef {
  vis: number;
  detail: number;
  found: boolean;
  lit: boolean;
  /** 등불이 공명해 떨리는 정도 */
  res: number;
  /** 섬 능선 점들 */
  pts: [number, number][];
}

export const OBJ: WorldObj[] = OBJECTS.map(o => ({ ...o, vis: 0, detail: 0, found: false, lit: false, res: 0, pts: [] }));
OBJ.filter(o => o.kind === 'isle').forEach(o => {
  const r = seeded(o.seed ?? 1);
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    o.pts.push([u, Math.pow(Math.sin(Math.PI * u), 0.8) * (0.45 + r() * 0.55)]);
  }
});

export const obj = (id: string) => OBJ.find(o => o.id === id)!;
