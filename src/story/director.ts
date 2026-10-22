// 장면 진행 관리: 지금 장면에 입력(줄 튕김·스트로크·박)을 전달하고, 장면을 바꾸고, 진행을 저장한다
import type { ChordId } from '../data/chords';
import { STEPS, before, type StepId } from '../data/steps';
import { setTempo } from '../world/rhythm';
import { S } from '../world/state';
import { cutActive } from '../render/cutscene';
import { fadeHelp, setMode, setObjective, setProgress } from '../ui/hud';

export interface Stroke {
  /** 1 다운, -1 업 */
  dir: number;
  dyn: number;
  chord: ChordId;
  /** 긁은 위치 (화면 x) */
  x: number;
}

/** 여섯 줄을 한 방향으로 다 긁었을 때 */
export interface Sweep { dir: number; dur: number }

export interface StepHandler {
  enter?(): void;
  /** el: 이 장면에 들어온 뒤 지난 시간 (초) */
  update?(dt: number, el: number): void;
  /** 줄을 3개 이상 한 방향으로 긁었을 때 (= 노 한 번, 코드 한 번) */
  stroke?(s: Stroke): void;
  /** 줄 하나라도 튕겼을 때 */
  pluck?(): void;
  /** 여섯 줄을 한 방향으로 다 긁었을 때 (얼마나 천천히 긁었는지) */
  sweep?(s: Sweep): void;
  /** 새 박이 시작될 때 */
  beat?(n: number): void;
}

const SAVE_KEY = 'pp.ch0.step';
let handlers = {} as Record<StepId, StepHandler>;
let cur: StepHandler = {};
let el = 0;

/** 챕터마다 자기 장면들을 등록한다 */
export function registerSteps(h: Partial<Record<StepId, StepHandler>>) { handlers = { ...handlers, ...h }; }

export function go(id: StepId) {
  const def = STEPS.find(s => s.id === id)!;
  S.step = id;
  el = 0;
  setTempo(def.bpm, 'heart');
  setMode(def.mode);
  setObjective(def.objective);
  setProgress('');
  save(id);
  S.nextChord = null;
  // 큰 기믹의 네 박 기회는 그 장면이 다시 채운다 (다른 장면으로 가면 거둠)
  S.lives = -1; S.assist = 0;
  // 기본 조작을 다 배운 뒤(등불 찾기부터)에는 아래 조작 안내 줄이 사라진다
  if (!before(id, 'lamps')) fadeHelp();
  cur = handlers[id];
  cur.enter?.();
}

export const elapsed = () => el;

export function updateStory(dt: number) { el += dt; cur.update?.(dt, el); }
/** 마지막 스트로크 (자동 테스트·조율용) */
export const lastStroke = { dyn: 0, chord: 'open' as ChordId };
export function onStroke(s: Stroke) { lastStroke.dyn = s.dyn; lastStroke.chord = s.chord; if (S.started && !cutActive() && S.rewind < 0.05) cur.stroke?.(s); }
export function onPluck() { if (S.started) cur.pluck?.(); }
export function onSweep(s: Sweep) { if (S.started) cur.sweep?.(s); }
export function onBeat(n: number) { cur.beat?.(n); }

/** 이어하기용 저장. 저장이 막힌 브라우저에서도 게임은 그대로 돈다 */
function save(id: StepId) {
  try { localStorage.setItem(SAVE_KEY, id); } catch { /* 무시 */ }
}
export function loadSaved(): StepId | null {
  try {
    const v = localStorage.getItem(SAVE_KEY) as StepId | null;
    return v && STEPS.some(s => s.id === v) ? v : null;
  } catch { return null; }
}
