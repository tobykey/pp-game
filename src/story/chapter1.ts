// 챕터 1 '고집의 섬' 장면 진행 (문구·배치는 data/chapter1.ts, 시나리오는 docs/scenario-ch0-1.md 챕터 1)
// 간주: 기타가 가장 크게 우는 마지막 구간 → 섬에 닿는 순간 줄이 끊어짐 → 1절: 베이스로 탐색
import { CHORDS, type ChordId } from '../data/chords';
import { BEAT_WINDOW } from '../data/chapter0';
import {
  C1_START, INTERLUDE_BARS, P_RAIN, P_ROOM, P_STAGE, RAIN_BARS, ROOM_SEQ, SNAP_AT, STAGE_BARS, STAGE_SEQ, TEXT1,
} from '../data/chapter1';
import { before, type StepId } from '../data/steps';
import { audioOut, playNote } from '../audio/engine';
import { snap } from '../audio/kit';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { banner, ink, setObjective, setProgress, unlock } from '../ui/hud';
import { pos, stringY, toScreenX } from '../world/geometry';
import { grooveBeat, nearestBeat, setBarChord, setTempo, spb } from '../world/rhythm';
import { row } from '../world/rowing';
import { OBJ, S, fx, obj, str, thorns, view, type WorldObj } from '../world/state';
import { bassStroke } from '../world/strum';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler, type Stroke } from './director';

const PINK = '#ff2a7f';
const VERSE_CHORDS: ChordId[] = ['Fm', 'Db', 'Eb', 'Ab', 'C'];

const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }
let currentEl = 0;

const onBeat = () => Math.abs(nearestBeat().off) <= Math.min(BEAT_WINDOW, spb() * 0.28);

/** 1절 동안: 스트로크는 늘 베이스를 울린다 (줄이 끊어져 기타 소리 대신) */
function verseStroke(s: Stroke) { if (S.silence) bassStroke(s.chord, s.x); }

/** 배를 목표 지점에 스르르 세운다 */
function arrive(target: number) {
  const left = target - S.boat;
  if (left < 0.3) S.vel = Math.min(S.vel, Math.max(0, left * 1.2 + 0.01));
  if (left <= 0.004) { S.boat = target; S.vel = 0; return true; }
  return false;
}

/** 부표 퍼즐: 정해진 순서대로 근음을 박에 맞춰 울린다 */
function buoyPuzzle(seq: ChordId[], buoys: () => WorldObj[]) {
  let k = 0;
  return {
    get k() { return k; },
    get solved() { return k >= seq.length; },
    stroke(chord: ChordId) {
      if (k >= seq.length) return;
      const b = buoys().find(o => o.chord === chord);
      if (!b) return;
      b.res = 1; // 자기 음이 울리면 부표가 떤다
      if (chord === seq[k]) {
        if (!onBeat()) { ink(TEXT1.onBeat); return; }
        b.lit = 1; k++;
        const p = pos(b);
        splash(p.x, p.y - 10, 10, 0.4, INK);
        setProgress(TEXT1.progressBuoys(k, seq.length));
      } else if (k > 0 && !b.lit) {
        k = 0; buoys().forEach(o => o.lit = 0);
        setProgress(TEXT1.progressBuoys(0, seq.length));
        banner(TEXT1.orderBroken, 'soft', 1400);
      }
    },
  };
}

// ---------- 1-1 간주 항해 ----------
let arrived = false;
const sail: StepHandler = {
  enter() {
    arrived = false;
    S.lookable = true;
    setTempo(130, 'chorus');
    setBarChord(bar => INTERLUDE_BARS[bar % INTERLUDE_BARS.length]);
    unlock(['Db', 'Eb', 'Cm', 'F', 'Fsus4']);
    S.cruise = -0.012; // 섬 쪽에서 해류가 밀려온다
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0 || gb % 4 !== 0) return;
    if (arrived) { go('c1snap'); return; }
    const bar = Math.floor(gb / 4), c = INTERLUDE_BARS[bar % INTERLUDE_BARS.length];
    S.forced = c; resolveChord();
    setProgress(CHORDS[c].label);
    if (c === 'F') { S.flash = Math.max(S.flash, reduceMotion ? 0.05 : 0.18); S.flashCol = PINK; }
  },
  update(_dt, el) {
    S.vel = Math.min(S.vel, 0.17);
    once('look', el > 3, () => ink(TEXT1.lookHint));
    once('lookOff', el > 9, () => ink(null));
    // 먹 바위가 길을 막는다
    for (const r of OBJ.filter(o => o.kind === 'rock' && !o.gone)) {
      const stop = (r.wx ?? 0) - 0.2;
      if (S.boat > stop) { S.boat = stop; S.vel = Math.min(S.vel, 0); once('rock' + r.id, true, () => ink(TEXT1.rockHint)); }
    }
    if (S.boat >= SNAP_AT) arrived = true;
  },
  stroke(s) {
    row(s.dir, 0.6);
    // 아주 세게(ff) 긁으면 가까운 바위가 부서진다
    if (s.dyn >= 0.84) {
      const r = OBJ.find(o => o.kind === 'rock' && !o.gone && (o.wx ?? 0) - S.boat < 0.45 && (o.wx ?? 0) > S.boat);
      if (r) {
        r.gone = true;
        const p = pos(r);
        splash(p.x, p.y, 34, 1, INK);
        for (let j = 0; j < 12; j++) fx.lines.push({ x: p.x, y: p.y, a: rand(-Math.PI, 0), l: rand(60, 180), life: 1, c: j % 3 ? VOLT : INK });
        ink(null);
        banner(TEXT1.rockBroken, 'soft', 900);
      }
    }
  },
};

// ---------- 줄이 끊어짐 ----------
const snapStep: StepHandler = {
  enter() {
    S.forced = null; resolveChord(); setBarChord(null);
    setTempo(65, 'none'); // 음악이 뚝 끊긴다
    const o = audioOut(); if (o) snap(o.ac.currentTime + 0.02);
    for (let i = 0; i < 6; i++) splash(view.W * rand(0.3, 0.7), stringY(i), 3, 0.35, INK);
    if (!reduceMotion) S.shake = Math.max(S.shake, 5);
    S.silence = true; S.zoomT = 1; S.cruise = 0.05;
    obj('pRoom').hidden = false;
    unlock(VERSE_CHORDS);
  },
  update(_dt, el) {
    if (arrive(P_ROOM)) S.cruise = 0;
    once('line', el > 2.2, () => ink(TEXT1.snapLine));
    once('zoomOut', el > 5, () => { S.zoomT = 0; });
    if (el > 7) goLater('c1room', el, 0);
  },
};

// ---------- 1-2 밤의 방 ----------
const roomBuoys = () => OBJ.filter(o => o.kind === 'buoy' && o.id.startsWith('bRoom'));
let roomPuzzle = buoyPuzzle(ROOM_SEQ, roomBuoys);
const room: StepHandler = {
  enter() {
    roomPuzzle = buoyPuzzle(ROOM_SEQ, roomBuoys);
    setTempo(65, 'verse');
    setBarChord(bar => ROOM_SEQ[bar % 4]);
    roomBuoys().forEach(o => { o.hidden = false; o.lit = 0; });
    setProgress(TEXT1.progressBuoys(0, 4));
    S.cruise = 0;
    ink(TEXT1.bassHint);
  },
  update(_dt, el) {
    arrive(P_ROOM);
    once('clear', el > 9, () => ink(null));
    const p = obj('pRoom');
    if (roomPuzzle.solved) {
      once('play', true, () => { p.play = 0.001; ink(null); });
      if (p.play >= 1) goLater('c1stage', el, 1.2);
    }
  },
  stroke(s) { verseStroke(s); roomPuzzle.stroke(s.chord); },
};

// ---------- 1-3 빈 무대 ----------
const stageBuoys = () => OBJ.filter(o => o.kind === 'buoy' && o.id.startsWith('bStage'));
let stagePuzzle = buoyPuzzle(STAGE_SEQ, stageBuoys);
let stagePhase: 'travel' | 'puzzle' = 'travel';
let goodRows = 0;
const stage: StepHandler = {
  enter() {
    stagePuzzle = buoyPuzzle(STAGE_SEQ, stageBuoys);
    stagePhase = 'travel'; goodRows = 0;
    setTempo(65, 'verse');
    setBarChord(bar => STAGE_BARS[bar % 4]);
    obj('pStage').hidden = false;
    S.cruise = 0;
  },
  update(_dt, el) {
    if (stagePhase === 'travel') {
      if (arrive(P_STAGE)) {
        stagePhase = 'puzzle';
        setObjective(TEXT1.stagePuzzle);
        setProgress(TEXT1.progressBuoys(0, 2));
        stageBuoys().forEach(o => { o.hidden = false; o.lit = 0; });
        obj('thorn').hidden = false;
      }
      return;
    }
    const p = obj('pStage');
    if (stagePuzzle.solved) {
      once('play', true, () => { p.play = 0.001; });
      if (p.play > 0.85) goLater('c1thorn', el, 0.5);
    }
  },
  stroke(s) {
    verseStroke(s);
    if (stagePhase === 'travel') { if (row(s.dir) !== 'miss') goodRows++; return; }
    stagePuzzle.stroke(s.chord);
  },
};

// ---------- 1-3 첫 번째 가시 (C에서 130으로) ----------
let meter = 0, thornPhase: 'hold' | 'pull' | 'done' = 'hold';
const thornStep: StepHandler = {
  enter() {
    meter = 0; thornPhase = 'hold';
    setTempo(130, 'chorus');
    setBarChord(bar => STAGE_BARS[bar % 4]);
    S.vortexT = 1;
    obj('thorn').hidden = false;
    setProgress(TEXT1.progressHold(0));
  },
  beat() {
    // 소용돌이가 배를 흔든다
    if (thornPhase !== 'done' && !reduceMotion) S.wobble += rand(-1, 1) * 0.025;
  },
  update(dt) {
    S.vel = 0;
    if (thornPhase === 'hold') {
      meter = Math.max(0, meter - dt * 0.03);
      setProgress(TEXT1.progressHold(Math.round(meter * 6)));
    }
  },
  stroke(s) {
    verseStroke(s);
    if (thornPhase === 'hold') {
      const r = row(s.dir);
      S.vel = 0;
      meter = Math.max(0, Math.min(1, meter + (r === 'miss' ? -0.08 : 1 / 6)));
      setProgress(TEXT1.progressHold(Math.round(meter * 6)));
      if (meter >= 1) { thornPhase = 'pull'; setObjective(TEXT1.pull); ink(TEXT1.pullHint); }
    } else if (thornPhase === 'pull' && s.chord === 'C') {
      if (!onBeat()) { ink(TEXT1.onBeat); return; }
      pullThorn();
    }
  },
};

function pullThorn() {
  thornPhase = 'done';
  const t = obj('thorn'), tp = pos(t);
  t.gone = true;
  ink(null); setProgress(''); setObjective('');
  // 가시가 뽑히는 순간, 딱 한 번 기타가 C 화음으로 크게 울린다 (복선: 가시를 받아 삼킨 그 사람의 소리)
  const prevMode = S.mode;
  S.mode = 'rock'; S.silence = false;
  CHORDS.C.v.forEach((m, i) => setTimeout(() => { playNote(m, 1); str[i].amp = 15; str[i].hot = 1; }, i * 22));
  setTimeout(() => { S.mode = prevMode; }, 200);
  setTimeout(() => { S.silence = true; }, 900);
  S.flash = Math.max(S.flash, reduceMotion ? 0.06 : 0.25); S.flashCol = PINK;
  if (!reduceMotion) S.shake = Math.max(S.shake, 8);
  splash(tp.x, tp.y - 20, 60, 1.2, PINK);
  for (let j = 0; j < 22; j++) fx.lines.push({ x: tp.x, y: tp.y - 20, a: rand(-Math.PI, 0), l: rand(80, view.W * 0.35), life: 1.2, c: j % 3 ? VOLT : INK });
  // 조표의 E♭이 빠져 뱃머리 쪽으로 떨어진다 (복선: 그 사람이 삼켰다)
  const th = thorns[1];
  th.gone = true; th.fly = { t: S.t, vx: 0, vy: 0, rot: 3, toBow: true };
  // 이 폭발에 그림 속 '새 줄을 든 손'이 흩어진다 (복선: ff가 지운 것)
  const p = obj('pStage');
  if (!p.gone) {
    const hx = toScreenX((p.wx ?? 0) - (p.w ?? 0.9) / 2 - 0.09);
    splash(hx, view.H * 0.3, 16, 0.6, PINK);
    p.gone = true;
  }
  S.crack = 1; S.pose = 2; S.vortexT = 0;
  goLater('c1rain', currentEl, 3.2);
}

// ---------- 1-4 비 ----------
let rk = 0, hit = false, stalls = 0, rainTarget = 0, rainDone = false;
const rain: StepHandler = {
  enter() {
    rk = 0; hit = false; stalls = 0; rainTarget = S.boat; rainDone = false;
    setTempo(65, 'verse');
    setBarChord(() => RAIN_BARS[Math.min(rk, RAIN_BARS.length - 1)]);
    obj('pRain').hidden = false;
    setProgress(TEXT1.progressRain(CHORDS[RAIN_BARS[0]].label, 0));
  },
  beat(n) {
    if (rainDone) return;
    const gb = grooveBeat(n);
    if (gb <= 0 || gb % 4 !== 0) return;
    if (hit) {
      rk++; hit = false; stalls = 0;
      rainTarget += (P_RAIN - P_STAGE) / RAIN_BARS.length;
      if (rk >= RAIN_BARS.length) {
        // 마지막 Fm Fm: 해결되지 않은 채 음악이 멈춘다
        rainDone = true; setTempo(65, 'none'); setProgress('');
        goLater('c1after', currentEl, 1.5);
        return;
      }
      ink(null);
    } else {
      stalls++;
      S.wobble -= 0.04;
      if (stalls >= 2) ink(TEXT1.rainStall(CHORDS[RAIN_BARS[rk]].label));
    }
    setProgress(TEXT1.progressRain(CHORDS[RAIN_BARS[rk]].label, rk));
  },
  update() {
    S.cruise = 0;
    S.vel = Math.max(0, Math.min(0.2, (rainTarget - S.boat) * 1.2));
  },
  stroke(s) {
    verseStroke(s);
    if (!rainDone && s.chord === RAIN_BARS[rk] && onBeat()) hit = true;
  },
};

// ---------- 1-5 여운 → 다시 매어진 줄 ----------
const after: StepHandler = {
  enter() { setTempo(65, 'none'); S.vel = 0; S.cruise = 0; },
  update(dt, el) {
    once('line', el > 1.5, () => { ink(TEXT1.afterLine); S.whisperFade = 1; });
    once('heart', el > 3, () => setTempo(65, 'heart'));
    if (el > 6.5 && el < 8.2) S.black = Math.min(1, S.black + dt / 1.2);
    once('restring', el > 8, () => {
      // 어두워진 사이 끊어졌던 줄이 다시 매어져 있다. 누가 맸는지는 보여 주지 않는다. 그 사람의 자세가 또 바뀌어 있다
      ink(null);
      S.silence = false; S.hush = 0; S.zoomT = 0;
      S.pose = S.pose === 2 ? 1 : 2;
    });
    if (el > 8.2) S.black = Math.max(0, S.black - dt / 1.5);
    once('end', el > 10.5, () => { banner(TEXT1.chapterEnd, 'soft', 4000); setObjective(TEXT1.nextChapter); });
  },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = {
  c1sail: sail, c1snap: snapStep, c1room: room, c1stage: stage, c1thorn: thornStep, c1rain: rain, c1after: after,
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

/** 챕터 1 중간 장면으로 바로 갈 때, 앞 장면들이 끝났을 때의 상태를 만든다 (챕터 0은 fastForward0이 맡음) */
export function fastForward1(target: StepId) {
  if (before(target, 'c1sail')) return;
  const passed = (id: StepId) => before(id, target);
  S.lookable = true;
  S.boat = C1_START;
  if (passed('c1sail')) { OBJ.filter(o => o.kind === 'rock').forEach(o => o.gone = true); S.boat = SNAP_AT; }
  if (passed('c1snap')) { S.boat = P_ROOM; S.silence = true; S.hush = 1; obj('pRoom').hidden = false; unlock(VERSE_CHORDS); }
  if (passed('c1room')) { roomBuoys().forEach(o => { o.hidden = false; o.lit = 1; }); obj('pRoom').play = 1; }
  if (passed('c1stage')) {
    S.boat = P_STAGE; const p = obj('pStage'); p.hidden = false; p.play = 1;
    stageBuoys().forEach(o => { o.hidden = false; o.lit = 1; }); obj('thorn').hidden = false;
  }
  if (passed('c1thorn')) {
    obj('thorn').gone = true; thorns[1].gone = true; obj('pStage').gone = true;
    S.crack = 1; S.pose = 2;
  }
  if (passed('c1rain')) { S.boat = P_RAIN; obj('pRain').hidden = false; }
}
