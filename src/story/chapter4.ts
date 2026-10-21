// 챕터 4 '마른 바다 → 폭풍' 장면 진행 (문구는 data/chapter4.ts, 시나리오는 docs/scenario-ch4.md)
// 물이 빠진다 → 마른 바다(자유 솔로) → 물이 돌아온다 → 폭풍(가드 + 카운터) → 격돌 ①(폭주 스트로크) → D♭ 가시 → D.S.
import { CHORDS, type ChordId } from '../data/chords';
import { C4_START, CLASH_BPMS, RIFF, SOLO_DIST, STORM_COUNTERS, STORM_GUARDS, TEXT4 } from '../data/chapter4';
import { before, type StepId } from '../data/steps';
import { playNote } from '../audio/engine';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { counterWaves } from '../render/chapter3Art';
import { guardWaves } from '../render/chapter2Art';
import { crackTexts, trails } from '../render/chapter4Art';
import { CUT_SLAM_MS, playThornCut } from '../render/cutscene';
import { banner, chapterCard, cue, ink, pullCue, setObjective, setProgress, unlock } from '../ui/hud';
import { boatScale, boatX, boatY, pos } from '../world/geometry';
import { judgeBeat } from '../world/judge';
import { grooveBeat, setBarChord, setTempo } from '../world/rhythm';
import { row } from '../world/rowing';
import { S, fx, obj, str, thorns, view } from '../world/state';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler } from './director';
import { counterSoon, guardSoon, settleWaves, showWaves, tryCounter, tryGuard } from './counter';

const PINK = '#ff2a7f';
const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }
let currentEl = 0;

const ALL_CHORDS: ChordId[] = ['Db6', 'Ab', 'Db', 'Eb', 'Cm', 'F', 'Fsus4'];

// ---------- 4-1 물이 빠진다 ----------
const ebb: StepHandler = {
  enter() {
    chapterCard('CHAPTER 4', '마른 바다', '훅 + 랩 · 2절');
    setTempo(65, 'heart'); setBarChord(null); S.forced = null; resolveChord();
    S.cruise = 0.05; S.dryT = 1; S.stormT = 0; S.tug = -1;
  },
  update(dt, el) {
    S.cruise = Math.max(0, S.cruise - dt * 0.01);
    once('ink1', el > 3, () => ink(TEXT4.ebb1));
    // 바닥에 얹히는 순간 배가 기우뚱
    once('ground', el > 5.5, () => { S.cruise = 0; S.vel = 0; S.wobble += 0.18; splash(boatX(), boatY() + 10, 18, 0.5, INK); });
    once('ink2', el > 7, () => ink(TEXT4.ebb2));
    if (el > 10.5) goLater('c4solo', el, 0);
  },
};

// ---------- 4-2 마른 바다 (자유 솔로) ----------
/** 코드마다 물길이 흐르는 균열의 높이 (다른 코드는 다른 틈으로) */
const LANE: Partial<Record<ChordId, number>> = { Db6: 0.42, Ab: 0.62, Db: 0.5, Eb: 0.72, Cm: 0.82, F: 0.3, Fsus4: 0.36, open: 0.56 };
let soloStart = 0, strokes = 0, chordsUsed = new Set<ChordId>(), textN = 0;
const solo: StepHandler = {
  enter() {
    setTempo(130, 'hook'); setBarChord(null); S.forced = null; resolveChord();
    S.dryT = 1; S.cruise = 0;
    unlock(ALL_CHORDS);
    soloStart = S.boat; strokes = 0; chordsUsed = new Set(); textN = 0;
    trails.length = 0; crackTexts.length = 0;
    ['relicScore', 'relicCase', 'relicPick'].forEach(id => { obj(id).hidden = false; });
    ink(TEXT4.soloHint);
    setProgress(TEXT4.progressSolo(0));
  },
  update(_dt, el) {
    const p = Math.max(0, Math.min(1, (S.boat - soloStart) / SOLO_DIST));
    setProgress(TEXT4.progressSolo(Math.floor(p * 8)));
    // 나아간 만큼 균열에 글줄이 하나씩 흐른다
    const marks = [0.08, 0.28, 0.48, 0.68, 0.86];
    if (textN < marks.length && p >= marks[textN]) {
      crackTexts.push({ wx: S.boat + 0.3, ry: 0.22 + 0.15 * textN, txt: TEXT4.cracks[textN], t0: S.t });
      textN++;
    }
    once('hintOff', el > 6 && strokes > 3, () => ink(null));
    once('chordHint', strokes >= 8 && chordsUsed.size < 2, () => ink(TEXT4.soloChord));
    if (p >= 1) { setProgress(''); go('c4turn'); }
  },
  stroke(s) {
    strokes++;
    chordsUsed.add(s.chord);
    const onBeat = judgeBeat(false).j !== 'miss';
    const len = 0.1 + 0.2 * s.dyn + (onBeat ? 0.07 : 0);
    const col = s.dyn > 0.7 ? PINK : VOLT;
    const lane = (LANE[s.chord] ?? 0.55) + rand(-0.06, 0.06);
    trails.push({ wx: S.boat + 0.04, ry: Math.max(0.12, Math.min(0.95, lane)), len, w: 2 + 7 * s.dyn, col, t0: S.t, seed: rand(0, 100) });
    if (trails.length > 60) trails.shift();
    // 그린 물길 위로 배가 미끄러진다
    S.vel += 0.016 + 0.024 * s.dyn + (onBeat ? 0.01 : 0);
    S.wobble += s.dir * 0.02;
  },
};

// ---------- 4-3 물이 돌아온다 ----------
const turn: StepHandler = {
  enter() {
    setTempo(130, 'none'); S.cruise = 0; S.vel *= 0.3;
    ink(TEXT4.turn);
    S.stormT = 0.45;
  },
  update(_dt, el) {
    once('rumble', el > 2.2, () => { if (!reduceMotion) S.shake = Math.max(S.shake, 4); });
    if (el > 5) goLater('c4storm', el, 0);
  },
};

// ---------- 4-4 폭풍 (가드 + 카운터 + 노) ----------
let stormEnded = false;
const storm: StepHandler = {
  enter() {
    ink(null); stormEnded = false;
    setTempo(130, 'storm');
    setBarChord(bar => RIFF[bar % RIFF.length]);
    S.dryT = 0; S.stormT = 1; S.rainFallT = 1; S.cruise = 0.1; S.glow = 0;
    // 물이 한꺼번에 돌아온다
    splash(boatX(), boatY(), 40, 1, INK);
    if (!reduceMotion) S.shake = Math.max(S.shake, 8);
    guardWaves.length = 0; STORM_GUARDS.forEach(b => guardWaves.push({ beat: b, blocked: false, hit: false }));
    counterWaves.length = 0; STORM_COUNTERS.forEach(c => counterWaves.push({ ...c, shown: false, done: false, hit: false }));
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0 || stormEnded) return;
    settleWaves(gb);
    if (gb % 4 !== 0) return;
    const bar = gb / 4;
    if (bar >= RIFF.length * 2) { stormEnded = true; S.guardCue = S.counterCue = false; go('c4clash'); return; }
    const c = RIFF[bar % RIFF.length];
    S.forced = c; resolveChord();
    S.nextChord = RIFF[(bar + 1) % RIFF.length];
    setProgress(TEXT4.progressStorm(CHORDS[c].label, bar + 1));
  },
  update() {
    showWaves();
    S.vel = Math.min(S.vel, 0.2);
    S.guardCue = guardSoon();
    S.counterCue = !S.guardCue && counterSoon();
  },
  stroke(s) {
    if (tryGuard()) return;
    if (tryCounter(s)) return;
    row(s.dir, 0.6);
  },
};

// ---------- 4-5 격돌 ① (폭주 스트로크) ----------
let ci = 0, beatsInStage = 0, clashBeats = 0, clashEnded = false, lastLost = 0;
const clash: StepHandler = {
  enter() {
    ci = 0; beatsInStage = 0; clashBeats = 0; clashEnded = false; lastLost = 0;
    // 격돌 중에도 리프 코드를 마디마다 자동으로 잡아 준다: 정신없이 긁는 동안 나도 모르게 반주가 된다
    S.tug = 0.35; S.forced = RIFF[0]; resolveChord(); S.nextChord = null; setProgress('');
    S.cruise = 0; S.vel = 0; S.glow = 0;
    guardWaves.length = 0; counterWaves.length = 0;
    setTempo(CLASH_BPMS[0], 'storm');
    setBarChord(null); // 템포가 바뀔 때마다 그루브 마디 세기가 처음으로 돌아가므로, 베이스는 장면이 잡은 코드(S.forced)를 따른다
    S.pressT = 0.2;
    cue(TEXT4.clashCue, 'rock');
    ink(TEXT4.clashHint);
  },
  beat() {
    if (clashEnded) return;
    // 마디가 바뀌면 리프의 다음 코드
    if (clashBeats % 4 === 0) { const bar = clashBeats / 4; S.forced = RIFF[bar % RIFF.length]; resolveChord(); }
    clashBeats++;
    // 세 마디마다 박이 빨라지고 화면이 조여 온다
    if (++beatsInStage >= 12 && ci < CLASH_BPMS.length - 1) {
      beatsInStage = 0; ci++;
      setTempo(CLASH_BPMS[ci], 'storm');
      S.pressT = 0.2 + 0.2 * ci;
    }
  },
  update(dt, el) {
    if (clashEnded) return;
    S.vel = 0;
    once('hintOff', el > 3, () => ink(null));
    // 손을 멈추면 물벽이 밀려온다. 오래 버티면 몰래 조금 덜 밀린다
    const assist = Math.max(0.6, 1 - Math.max(0, el - 25) * 0.02);
    S.tug -= dt * (0.09 + 0.022 * ci) * assist;
    // 마지막 템포 전에는 끝까지 밀어낼 수 없다 (몰아치는 시간을 지킨다)
    const cap = ci < CLASH_BPMS.length - 1 ? 0.55 + 0.1 * ci : 1;
    S.tug = Math.min(cap, S.tug);
    if (!reduceMotion) S.shake = Math.max(S.shake, 1 + 2 * ci * (1 - S.tug));
    if (S.tug <= 0) {
      // 밀렸다: 배가 크게 흔들리지만 끝은 아니다
      S.tug = 0.3; S.wobble += 0.25; lastLost = el;
      splash(boatX() + 80, boatY() - 30, 40, 1, INK);
      ink(TEXT4.clashAgain);
    }
    if (lastLost && el - lastLost > 2.5) { lastLost = 0; ink(null); }
    if (S.tug >= 1) winClash();
  },
  stroke(s) {
    if (clashEnded) return;
    // 박은 상관없다. 긁을수록, 세게 긁을수록 밀어낸다
    S.tug += 0.03 + 0.035 * s.dyn;
    const sc = boatScale(), x = boatX() + 120 * sc, y = boatY() - 40 * sc;
    for (let i = 0; i < 6; i++) { const a = rand(-0.6, 0.3), v = rand(300, 700); fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 5), life: 0.8, dec: 1.6, c: i % 2 ? PINK : VOLT }); }
  },
};

function winClash() {
  clashEnded = true;
  S.tug = 1;
  cue(null); ink(TEXT4.clashWon);
  S.pressT = 0; S.punchT = 1; setTimeout(() => { S.punchT = 0; }, 250);
  S.fburst = 0.7; S.burst = 1;
  if (!reduceMotion) S.shake = Math.max(S.shake, 12);
  const x = boatX() + 200, y = boatY() - 60;
  for (let j = 0; j < 40; j++) fx.lines.push({ x, y, a: rand(-Math.PI, Math.PI), l: rand(150, view.W * 0.7), life: 1.5, c: j % 3 ? VOLT : PINK });
  splash(x, y, 80, 1.5, PINK);
  setTempo(65, 'heart');
  setTimeout(() => { S.tug = -1; }, 900);
  goLater('c4thorn', currentEl, 2.2);
}

// ---------- 4-6 D♭ 가시 ----------
let thornDone = false;
const thornStep: StepHandler = {
  enter() {
    thornDone = false; ink(null);
    S.rainFallT = 0; S.stormT = 0.3; S.tug = -1; S.pressT = 0;
    setTempo(65, 'heart'); setBarChord(null); S.forced = null; resolveChord();
    const t = obj('thorn4');
    t.hidden = false; t.gone = false; t.wx = S.boat + 0.3;
    S.vortexT = 0.4; S.dimT = 0.55;
    unlock(['D']);
    setObjective(TEXT4.pullObj);
    pullCue('D'); S.nextChord = 'D';
  },
  stroke(s) {
    if (thornDone || s.chord !== 'D') return;
    if (judgeBeat().j === 'miss') { ink('박에 맞춰'); return; }
    pullDflat();
  },
};

function pullDflat() {
  thornDone = true;
  const t = obj('thorn4'), tp = pos(t);
  t.gone = true;
  cue(null); ink(null); setObjective(''); S.nextChord = null;
  S.dimT = 0; S.vortexT = 0;
  // D의 D♮가 D♭을 원래 음으로 되돌린다 (곡에 없는 화음 = 폭풍 속에서 혼자 쥔 낯선 화음)
  CHORDS.D.v.forEach((m, i) => setTimeout(() => { playNote(m, 1); str[i].amp = 15; str[i].hot = 1; }, CUT_SLAM_MS + i * 22));
  splash(tp.x, tp.y - 20, 60, 1.2, PINK);
  const th = thorns[3]; // D♭
  th.gone = true; th.fly = { t: S.t, vx: 0, vy: 0, rot: 3, toBow: true };
  // 받는 손은 나오지 않는다 (혼자였으니까). 그 사이 금은 어깨까지 번진다
  playThornCut({ chord: 'D', from: 'D♭', to: 'D', hand: false }, () => {
    S.crack = 3;
    banner(TEXT4.pulled, 'soft', 2200);
    goLater('c4after', currentEl, 1.5);
  });
}

// ---------- 4-7 D.S. ----------
const after: StepHandler = {
  enter() {
    setTempo(65, 'heart'); S.stormT = 0; S.rainFallT = 0; S.cruise = 0.03;
    const sign = obj('dsSign');
    sign.hidden = false; sign.wx = S.boat + 0.8;
    S.dsT = 1; S.whisperFade = Math.max(S.whisperFade, 1.7);
  },
  update(dt, el) {
    if (S.glow > 0) S.glow = Math.max(0, S.glow - dt * 1.5);
    once('ink1', el > 2, () => ink(TEXT4.after1));
    once('ink2', el > 6.5, () => ink(TEXT4.after2));
    if (el > 8) S.cruise = Math.max(0, S.cruise - dt * 0.02);
    // D.S.: 세뇨로 돌아간다 → 챕터 5
    once('inkOff', el > 11, () => ink(null));
    if (el > 12.5) goLater('c5return', el, 0);
  },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = { c4ebb: ebb, c4solo: solo, c4turn: turn, c4storm: storm, c4clash: clash, c4thorn: thornStep, c4after: after };
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

/** 챕터 4 중간 장면으로 바로 갈 때 */
export function fastForward4(target: StepId) {
  if (before(target, 'c4ebb')) return;
  const passed = (id: StepId) => before(id, target);
  S.boat = C4_START;
  unlock(ALL_CHORDS);
  if (passed('c4ebb')) { S.dry = S.dryT = 1; }
  if (passed('c4solo')) S.boat = C4_START + SOLO_DIST;
  if (passed('c4turn')) { S.dry = S.dryT = 0; S.boat += 0.5; }
  if (passed('c4storm')) S.boat += 2;
  if (passed('c4thorn')) { thorns[3].gone = true; obj('thorn4').gone = true; S.crack = 3; unlock(['D']); }
}
