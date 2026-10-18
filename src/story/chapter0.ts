// 챕터 0 '안개' 장면 진행 (문구·배치는 data/chapter0.ts, 시나리오는 docs/scenario-ch0-1.md)
import { CHORDS, type ChordId } from '../data/chords';
import { MODES } from '../data/modes';
import { BEAT_WINDOW, CHORUS_BARS, CHORUS_SPEED, HOOK_SEQ, LAMP_X, ROW_DIST, TEXT } from '../data/chapter0';
import { before, type StepId } from '../data/steps';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { banner, ink, setProgress, unlock } from '../ui/hud';
import { pos, boatX, boatY } from '../world/geometry';
import { grooveBeat, nearestBeat, setBarChord, setTempo, spb } from '../world/rhythm';
import { row } from '../world/rowing';
import { OBJ, S, cloth, fx, obj, view } from '../world/state';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler } from './director';

/** 장면마다 '한 번만' 일어나야 하는 일을 기록 */
const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
/** 다음 장면으로 넘어가기를 예약 (같은 장면 안에서 한 번만) */
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }

const PINK = '#ff2a7f';
const lamps = () => OBJ.filter(o => o.kind === 'lamp');

// ---------- 장면들 ----------

/** 눈뜸 연출 시간 (초): 어둠 속 심장 소리 → 흰 빛으로 → 장면이 떠오름 */
const DARK = 3.6, TO_WHITE = 2.4, TO_SCENE = 3;
const wake: StepHandler = {
  enter() { S.black = 1; S.reveal = 0; S.stringsVis = 0; },
  update(dt, el) {
    S.black = el < DARK ? 1 : Math.max(0, 1 - (el - DARK) / TO_WHITE);
    const t2 = el - DARK - TO_WHITE;
    S.reveal = t2 <= 0 ? 0 : Math.min(1, t2 / TO_SCENE);
    if (S.reveal > 0.6) S.stringsVis = Math.min(1, S.stringsVis + dt * 0.6);
    once('hint', S.stringsVis >= 1 && el > 1, () => ink(TEXT.hintStrum));
  },
  pluck() { if (S.stringsVis > 0.5) { S.black = 0; S.reveal = 1; S.stringsVis = 1; go('whisper'); } },
};

const whisper: StepHandler = {
  update(_dt, el) {
    once('clear', el > 2.5, () => ink(null));
    const w = obj('whisper');
    once('soft', el > 9 && w.vis < 0.3 && !done.has('seen'), () => ink(TEXT.hintSoft));
    once('seen', w.vis > 0.6, () => { ink(null); goLater('row', el, 3.5); });
    if (el > 45) goLater('row', el, 0);
  },
};

let goodRows = 0, missRow = 0, sameRow = 0;
const rowStep: StepHandler = {
  enter() { goodRows = 0; missRow = 0; sameRow = 0; S.cruise = 0; ink(TEXT.hintRow); },
  stroke(s) {
    const r = row(s.dir);
    if (r === 'miss') { missRow++; if (missRow >= 3) ink(TEXT.hintRowMiss); return; }
    missRow = 0;
    if (r === 'sameOar') { sameRow++; ink(TEXT.hintSameOar); }
    else if (sameRow > 0) { sameRow = 0; ink(null); }
    if (r !== 'sameOar' && ++goodRows === 4) ink(null);
  },
  update() {
    // 등불 근처에 오면 배가 스르르 멈춘다
    const left = ROW_DIST - S.boat;
    if (left < 0.3) S.vel = Math.min(S.vel, left * 1.2 + 0.012);
    if (left <= 0.005) { S.boat = ROW_DIST; S.vel = 0; go('lamps'); }
  },
};

const lampsStep: StepHandler = {
  enter() {
    S.vel = 0; ink(null);
    lamps().forEach(o => { o.hidden = false; });
    setProgress(TEXT.progressFound(0));
  },
  update(_dt, el) {
    S.vel = 0;
    const found = lamps().filter(o => o.found);
    for (const o of found) once('found' + o.id, true, () => {
      unlock([o.chord!]);
      banner(TEXT.lampFound(CHORDS[o.chord!].label), 'soft', 1500);
      setProgress(TEXT.progressFound(lamps().filter(l => l.found).length));
    });
    once('findHint', el > 12 && found.length === 0, () => ink(TEXT.hintFind));
    if (found.length === 2) { ink(null); goLater('hook', el, 1.6); }
  },
};

let hp = 0;
const hook: StepHandler = {
  enter() {
    hp = 0;
    setTempo(130, 'hook');
    unlock(['Db6', 'Ab']);
    setProgress(TEXT.progressHook(0));
    ink(TEXT.hintChord);
  },
  update(_dt, el) { once('clearHint', el > 6, () => ink(null)); },
  stroke(s) {
    if (hp >= 4) return;
    const expected = HOOK_SEQ[hp];
    if (s.chord === expected) {
      const lamp = obj(expected);
      if (Math.abs(nearestBeat().off) > Math.min(BEAT_WINDOW, spb() * 0.28)) {
        lamp.res = 1; ink(TEXT.hintOnBeat);
        return;
      }
      lamp.lit++; hp++;
      const p = pos(lamp);
      splash(p.x, p.y - 20, 16, 0.6);
      S.flash = Math.max(S.flash, reduceMotion ? 0.05 : 0.1); S.flashCol = MODES[S.mode].accent;
      setProgress(TEXT.progressHook(hp));
      if (hp === 4) { ink(null); banner(TEXT.roadOpen, 'soft', 1800); }
      else banner(TEXT.hookLit(CHORDS[expected].label, hp), 'soft', 1100);
    } else if (HOOK_SEQ.includes(s.chord)) {
      obj(s.chord).res = 1;
      if (hp > 0) { hp = 0; lamps().forEach(o => o.lit = 0); setProgress(TEXT.progressHook(0)); banner(TEXT.orderBroken, 'soft', 1500); }
    }
  },
};
// 물길은 훅을 다 울린 뒤 천천히 열린다
const hookUpdate = hook.update!;
hook.update = (dt, el) => {
  hookUpdate(dt, el);
  if (hp >= 4) { S.road = Math.min(1, S.road + dt * 0.5); goLater('reflect', el, 2.2); }
};

const reflect: StepHandler = {
  update(_dt, el) {
    once('hint', el > 1.2, () => ink(TEXT.hintReflect));
    const r = obj('refl');
    once('seen', Math.min(r.vis, r.detail) > 0.25, () => { ink(TEXT.reflectExcuse); goLater('cloth', el, 4.5); });
    if (el > 24) goLater('cloth', el, 0);
  },
};

let tiedAt = -1;
const clothStep: StepHandler = {
  enter() { ink(null); cloth.active = true; cloth.tied = false; cloth.wx = S.boat + 0.75; tiedAt = -1; },
  update(dt, el) {
    if (cloth.active) {
      const target = S.boat + 0.09;
      cloth.wx = Math.max(target, cloth.wx - dt * 0.1);
      once('arrive', cloth.wx <= target + 0.001, () => ink(TEXT.hintCloth));
    }
    if (tiedAt >= 0) {
      once('line', el - tiedAt > 1.6, () => ink(TEXT.clothLine));
      if (el - tiedAt > 6.5) goLater('chorus', el, 0);
    }
  },
  stroke() {
    if (!cloth.active || cloth.tied || !done.has('arrive')) return;
    cloth.tied = true; cloth.active = false; tiedAt = currentEl;
    S.sashT = 0.8;
    ink(null);
    splash(boatX() + 10, boatY() - 60, 18, 0.5, PINK);
  },
};

let chorusEnded = false;
const chorus: StepHandler = {
  enter() {
    chorusEnded = false;
    setTempo(130, 'chorus');
    unlock(['Db', 'Eb', 'Cm', 'F']);
    setBarChord(bar => CHORUS_BARS[bar] ?? null);
    S.cruise = CHORUS_SPEED;
    S.visionT = 1; S.sailT = 1; S.fogT = 0.3;
    ink(null);
  },
  beat(n) {
    if (chorusEnded) return;
    const gb = grooveBeat(n), bar = Math.floor(gb / 4);
    if (gb < 0 || gb % 4 !== 0) return;
    if (bar < CHORUS_BARS.length) {
      const c = CHORUS_BARS[bar];
      S.forced = c; resolveChord();
      setProgress(`${CHORDS[c].label} · ${bar + 1} / ${CHORUS_BARS.length}`);
      // 마디가 바뀔 때 형광. 조성 밖의 F(= 그 사람)에서 가장 크게
      const big = c === 'F';
      S.flash = Math.max(S.flash, reduceMotion ? 0.06 : big ? 0.3 : 0.1);
      S.flashCol = big ? PINK : bar % 2 ? VOLT : PINK;
      if (big && !reduceMotion) S.shake = Math.max(S.shake, 6);
      const n2 = big ? 22 : 8;
      for (let j = 0; j < n2; j++) fx.lines.push({ x: boatX(), y: boatY() - 30, a: rand(-Math.PI, 0), l: rand(80, view.W * 0.4), life: 1, c: j % 3 ? VOLT : INK });
    } else endVision();
  },
  update() {
    // 예고 구간은 물길을 내달리되, 너무 빨라지지 않게
    S.vel = Math.min(S.vel, 0.17);
  },
  stroke(s) {
    const r = row(s.dir, 0.6);
    if (r === 'perfect' || r === 'good') {
      for (let j = 0; j < 4; j++) fx.lines.push({ x: boatX() - 40, y: boatY(), a: Math.PI + rand(-0.3, 0.3), l: rand(60, 160), life: 0.8, c: VOLT });
    }
  },
};
function endVision() {
  chorusEnded = true;
  S.forced = null; resolveChord();
  setBarChord(null);
  S.flash = reduceMotion ? 0.2 : 0.45; S.flashCol = '#ffffff';
  S.visionT = 0; S.sailT = 0; S.fogT = 1; S.cruise = 0;
  go('island');
}

const island: StepHandler = {
  enter() {
    setTempo(65, 'heart'); ink(TEXT.visionEnd);
    const g = obj('isleGoal');
    g.hidden = false; g.wx = S.boat + 0.78;
    S.cruise = 0.05;
  },
  update(dt, el) {
    const g = obj('isleGoal');
    S.road = Math.max(0, S.road - dt * 0.25);
    if (el > 2.5) { g.vis = Math.max(g.vis, Math.min(1, (el - 2.5) / 3)); g.detail = Math.max(g.detail, 0.4); }
    if (S.boat > (g.wx ?? 0) - 0.42) { S.cruise = Math.max(0, S.cruise - dt * 0.04); S.vel = Math.min(S.vel, S.cruise + 0.02); }
    once('line', el > 5, () => ink(TEXT.islandLine));
    if (el > 11) goLater('end', el, 0);
  },
};

const end: StepHandler = {
  enter() { ink(null); S.cruise = 0; banner(TEXT.chapterEnd, 'soft', 4000); },
  update(_dt, el) {
    const g = obj('isleGoal'); g.vis = Math.max(g.vis, 1); g.detail = Math.max(g.detail, 0.4);
    // 챕터 0이 끝나면 곡처럼 그대로 간주로 이어진다
    if (el > 4.5) goLater('c1sail', el, 0);
  },
};

// ---------- 공통 래퍼: 예약된 장면 전환 처리 ----------
let currentEl = 0;
const all: Partial<Record<StepId, StepHandler>> = {
  wake, whisper, row: rowStep, lamps: lampsStep, hook, reflect, cloth: clothStep, chorus, island, end,
};
for (const h of Object.values(all) as StepHandler[]) {
  const enter = h.enter, update = h.update;
  h.enter = () => { done.clear(); pending = null; enter?.(); };
  h.update = (dt, el) => {
    currentEl = el;
    update?.(dt, el);
    if (pending && el >= pending.at) { const to = pending.to; pending = null; go(to); }
  };
}
registerSteps(all);

/**
 * 중간 장면으로 바로 갈 때(이어하기·장면 고르기), 그 앞 장면들이 끝났을 때의 상태를 만들어 둔다
 */
export function fastForward0(target: StepId) {
  const passed = (id: StepId) => before(id, target);
  if (passed('wake')) { S.black = 0; S.reveal = 1; S.stringsVis = 1; }
  if (passed('row')) { S.boat = ROW_DIST; S.vel = 0; }
  if (passed('lamps')) {
    lamps().forEach(o => { o.hidden = false; o.found = true; });
    unlock(lamps().map(o => o.chord!) as ChordId[]);
  }
  if (passed('hook')) { lamps().forEach(o => o.lit = 2); S.road = 1; }
  if (passed('cloth')) { cloth.tied = true; S.scrap = 1; S.sash = S.sashT = 0.8; }
  if (passed('chorus')) { S.boat = LAMP_X + 1.65; S.road = 0; unlock(['Db', 'Eb', 'Cm', 'F']); }
  if (passed('island')) { const g = obj('isleGoal'); g.hidden = false; g.wx = S.boat + 0.78; }
}
