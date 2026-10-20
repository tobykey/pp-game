// 챕터 3 '돛' 장면 진행 (문구는 data/chapter3.ts, 시나리오는 docs/scenario-ch3.md)
// 바람이 모자라다 → 희망의 돛(하얀 빛 속 두 조각) → 등대의 바다(공명 카운터 + F 폭발) → F의 문과 A♭ 가시 → 바람을 안고
import { CHORDS, type ChordId } from '../data/chords';
import { C3_START, CHORUS2, COUNTERS, F_BARS, GATE_BARS, TEXT3 } from '../data/chapter3';
import { before, type StepId } from '../data/steps';
import { audioOut, playNote } from '../audio/engine';
import { crash } from '../audio/kit';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { counterWaves, lights } from '../render/chapter3Art';
import { playThornCut } from '../render/cutscene';
import { chapterCard, cue, ink, pullCue, setObjective, setProgress, unlock } from '../ui/hud';
import { boatScale, boatX, boatY, pos } from '../world/geometry';
import { judgeBeat } from '../world/judge';
import { grooveBeat, grooveBeatPos, setBarChord, setTempo } from '../world/rhythm';
import { row } from '../world/rowing';
import { S, fx, obj, str, thorns, view } from '../world/state';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler, type Stroke } from './director';

const PINK = '#ff2a7f', BLUE = '#2f6bff';
const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }
let currentEl = 0;

/** 파란 빛을 받아쳤는지 (아주 세게 + 그 박) */
function tryCounter(s: Stroke): boolean {
  if (s.dyn < 0.84) return false;
  const { j, n } = judgeBeat();
  const gb = grooveBeat(n);
  const w = counterWaves.find(x => x.beat === gb && x.shown && !x.done && !x.hit);
  if (!w || j === 'miss') return false;
  w.done = true;
  // 파도가 되받아쳐져 흩어진다
  const sc = boatScale(), x = boatX() + 150 * sc, y = boatY() - 40 * sc;
  for (let i = 0; i < 30; i++) {
    const a = rand(-Math.PI, 0), v = rand(180, 520);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 6), life: 1, dec: 1.1, c: i % 3 ? BLUE : INK });
  }
  S.glow = Math.min(6, S.glow + 1); S.glowPop = 1;
  return true;
}
/** 받아칠 박이 되면 파란 빛이 '짠!' 하고 솟는다 (소리도 함께) */
function showWaves() {
  const g = grooveBeatPos();
  for (const w of counterWaves) {
    if (w.shown || g < w.beat - w.lead) continue;
    w.shown = true;
    const a = audioOut(); if (a) crash(a.ac.currentTime, 0.7);
    const sc = boatScale();
    splash(boatX() + 150 * sc, boatY() - 30 * sc, 16, 0.7, BLUE);
    if (!reduceMotion) S.shake = Math.max(S.shake, 3);
  }
}
/** 지나간 파도는 배를 덮친다 (벌은 없다) */
function settleWaves(gb: number) {
  for (const w of counterWaves) if (w.shown && !w.done && !w.hit && gb > w.beat) { w.hit = true; S.wobble += 0.1; splash(boatX() + 30, boatY() - 20, 14, 0.5, INK); }
}
function counterSoon() {
  const g = grooveBeatPos();
  return counterWaves.some(w => w.shown && !w.done && !w.hit && w.beat - g > -0.3);
}

// ---------- 3-1 바람이 모자라다 ----------
const stall: StepHandler = {
  enter() {
    chapterCard('CHAPTER 3', '돛', '후렴 2');
    setTempo(130, 'chorus');
    setBarChord(() => 'Db');
    S.forced = 'Db'; resolveChord();
    S.cruise = 0.1; S.sailT = 0.35; // 조각 넷으로 바람을 안아 보려 한다
  },
  beat(n) {
    const gb = grooveBeat(n);
    // 한 마디 만에 바람이 돛을 빠져나가고 음악이 잦아든다
    once('fade', gb >= 4, () => {
      setTempo(130, 'none'); S.forced = null; resolveChord(); setBarChord(null);
      S.cruise = 0; S.sailT = 0; S.wobble += 0.2;
      ink(TEXT3.stall);
    });
  },
  update(_dt, el) { if (done.has('fade') && el > 6) goLater('c3sail', el, 0); },
};

// ---------- 3-2 희망의 돛 (하얀 빛이 덮은 사이) ----------
// 하얀 빛은 천천히 차오르고 한참 머물렀다가 천천히 걷힌다. 그 사이에 무슨 일이 있었는지는 보여 주지 않는다
const sail: StepHandler = {
  enter() {
    ink(null);
    S.whiteT = 1;
  },
  update(_dt, el) {
    once('stitch', el > 3.2, () => {
      // 모자랐던 두 조각이 채워져 있다. 그 사람의 띠와 겉옷이 사라져 있다
      S.pieces = 6; S.bare = true;
      S.hopeSail = true; S.sail = 0.2; S.sailT = 1;
    });
    once('clear', el > 4.6, () => { S.whiteT = 0; });
    once('lyric', el > 7, () => { S.lyricT = 1; });
    once('lyricOff', el > 12.5, () => { S.lyricT = 0; });
    if (el > 13.5) goLater('c3sea', el, 0);
  },
};

// ---------- 3-3·3-4 등대의 바다 (공명 카운터 + F 폭발) ----------
let fBar = -1, fDone = false, seaEnded = false;
const sea: StepHandler = {
  enter() {
    fBar = -1; fDone = false; seaEnded = false;
    S.glow = 0; S.gaugeOn = true;
    setTempo(130, 'chorus');
    setBarChord(bar => CHORUS2[bar] ?? null);
    S.cruise = 0.12;
    unlock(['Db', 'Eb', 'Cm', 'F', 'Fsus4']);
    counterWaves.length = 0;
    COUNTERS.forEach(c => counterWaves.push({ ...c, shown: false, done: false, hit: false }));
    lights.length = 0;
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0 || seaEnded) return;
    settleWaves(gb);
    if (gb % 4 !== 0) return;
    const bar = gb / 4;
    if (bar >= CHORUS2.length) { seaEnded = true; S.forced = null; S.gaugeOn = false; cue(null); go('c3gate'); return; }
    const c = CHORUS2[bar];
    // 마디마다 그 마디의 등대가 앞에 서서 켜진다
    lights.forEach(l => { l.lit = true; });
    lights.push({ wx: S.boat + 0.42, chord: c, lit: true, up: bar % 2 === 0 });
    if (lights.length > 6) lights.shift();
    setProgress(TEXT3.progressSea(CHORDS[c].label, bar + 1));
    S.nextChord = CHORUS2[bar + 1] ?? null;
    if (F_BARS.includes(bar)) {
      // F 마디: 코드를 자동으로 잡아 주지 않는다. 플레이어가 F를 쳐야 폭발
      fBar = bar; fDone = false;
      S.forced = null; resolveChord();
      cue(TEXT3.fCue, 'rock', 'F');
      once('fHint', true, () => ink(TEXT3.fHint));
    } else {
      if (fBar >= 0 && !fDone) cue(null);
      fBar = -1;
      S.forced = c; resolveChord();
    }
  },
  update() {
    showWaves();
    S.vel = Math.min(S.vel, 0.2);
    S.counterCue = counterSoon();
    once('counterHint', S.counterCue, () => ink(TEXT3.counterHint));
    once('glowHint', S.glow >= 1, () => ink(TEXT3.glowHint));
    once('glowFull', S.glow >= 6 && fBar < 0, () => ink(TEXT3.glowFull));
  },
  stroke(s) {
    if (fBar >= 0 && !fDone && s.chord === 'F') { fDone = true; cue(null); fBurst(); return; }
    if (tryCounter(s)) return;
    const r = row(s.dir, 0.5);
    if (r === 'perfect' && S.glow < 6) { const before = Math.floor(S.glow); S.glow = Math.min(6, S.glow + 0.34); if (Math.floor(S.glow) > before) S.glowPop = 1; }
  },
};

/** F 폭발: 돛의 여섯 조각이 다 빛났으면 화면 전체가 형광으로, 아니면 작게 */
function fBurst() {
  const full = S.glow >= 6;
  const x = boatX(), y = boatY() - 60;
  if (full) {
    ink(null);
    // 한순간 시간이 멈췄다가(히트스톱) 터진다
    S.timeScale = 0.06;
    setTimeout(() => {
      S.timeScale = 1;
      S.fburst = 1; S.burst = 1;
      S.punchT = 1; setTimeout(() => { S.punchT = 0; }, 260);
      S.visionT = 1; setTimeout(() => { S.visionT = 0; }, 2200);
      if (!reduceMotion) S.shake = Math.max(S.shake, 16);
      const a = audioOut(); if (a) crash(a.ac.currentTime, 1.6);
      for (let j = 0; j < 60; j++) fx.lines.push({ x, y, a: rand(-Math.PI, Math.PI), l: rand(200, view.W * 0.9), life: 1.8, c: j % 3 ? VOLT : PINK });
      splash(x, y, 120, 1.8, PINK);
      splash(x, y, 60, 1.4, VOLT);
      S.vel += 0.25;
    }, 140);
    S.glow = 0;
  } else {
    S.burst = 0.45;
    splash(x, y, 24, 0.8, PINK);
    S.glow = Math.max(0, S.glow - 2);
  }
}

// ---------- 3-5 F의 문과 A♭ 가시 ----------
let gatePhase: 'hold' | 'pull' | 'done' = 'hold', nextWave = 0;
const gate: StepHandler = {
  enter() {
    gatePhase = 'hold';
    S.meter = 0;
    setTempo(130, 'chorus');
    setBarChord(bar => GATE_BARS[bar % GATE_BARS.length]);
    S.cruise = 0; S.vel = 0;
    const t = obj('thorn3');
    t.hidden = false; t.gone = false; t.wx = S.boat + 0.26;
    lights.length = 0;
    lights.push({ wx: S.boat + 0.5, chord: 'F', lit: false, up: true });
    S.vortexT = 0.4;
    counterWaves.length = 0; nextWave = 3;
    setProgress(TEXT3.progressGate(0));
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0) return;
    settleWaves(gb);
    if (gb % 4 === 0) { const c = GATE_BARS[(gb / 4) % GATE_BARS.length]; if (gatePhase === 'hold') { S.forced = c; resolveChord(); } }
    // 버티는 동안 두 박마다 파란 빛 (정박에 나타나 다음 정박에 받아치기)
    if (gatePhase === 'hold' && gb + 2 >= nextWave) { counterWaves.push({ beat: nextWave, lead: 1, shown: false, done: false, hit: false }); nextWave += 2; }
  },
  update() {
    S.vel = 0;
    if (gatePhase === 'hold') showWaves();
    S.counterCue = gatePhase === 'hold' && counterSoon();
  },
  stroke(s) {
    if (gatePhase === 'hold') {
      if (tryCounter(s)) {
        S.meter = Math.min(1, S.meter + 1 / 6);
        setProgress(TEXT3.progressGate(Math.round(S.meter * 6)));
        if (S.meter >= 1) {
          // 다 버텼다: 세상이 어두워지고 가시만 빛난다. 화면 가득 '가시 뽑기 F'
          gatePhase = 'pull';
          S.forced = null; resolveChord();
          counterWaves.length = 0; S.counterCue = false;
          S.dimT = 0.55;
          setObjective(TEXT3.fGate); setProgress('');
          pullCue('F'); S.nextChord = 'F';
        }
      }
      return;
    }
    if (gatePhase === 'pull' && s.chord === 'F') {
      if (judgeBeat().j === 'miss') { ink('박에 맞춰'); return; }
      pullAflat();
    }
  },
};

function pullAflat() {
  gatePhase = 'done';
  const t = obj('thorn3'), tp = pos(t);
  t.gone = true;
  cue(null); ink(null); setObjective(''); S.nextChord = null;
  S.dimT = 0; S.vortexT = 0;
  // F의 A♮가 A♭을 원래 음으로 되돌린다
  CHORDS.F.v.forEach((m, i) => setTimeout(() => { playNote(m, 1); str[i].amp = 15; str[i].hot = 1; }, i * 22));
  if (!reduceMotion) S.shake = Math.max(S.shake, 9);
  splash(tp.x, tp.y - 20, 60, 1.2, PINK);
  for (let j = 0; j < 24; j++) fx.lines.push({ x: tp.x, y: tp.y - 20, a: rand(-Math.PI, 0), l: rand(100, view.W * 0.4), life: 1.3, c: j % 3 ? VOLT : INK });
  const th = thorns[2]; // A♭
  th.gone = true; th.fly = { t: S.t, vx: 0, vy: 0, rot: 3, toBow: true };
  lights.forEach(l => { l.lit = true; });
  // 화면 가득 컷신: 뽑힌 ♭ → 잠든 줄 알았던 그 사람의 손이 받는다. 끝나면 게임 속 손도 살짝 오므린다
  playThornCut({ chord: 'F', from: 'A♭', to: 'A', hand: true }, () => {
    S.catchT = 1;
    goLater('c3after', currentEl, 1.5);
  });
}

// ---------- 3-6 바람을 안고 ----------
const after: StepHandler = {
  enter() { setTempo(65, 'heart'); setBarChord(null); S.forced = null; resolveChord(); S.cruise = 0.07; S.crack = 2; S.whisperFade = 1.4; },
  update(dt, el) {
    // 형광이 천천히 걷히고 돛은 다시 한지 빛으로
    if (S.glow > 0) S.glow = Math.max(0, S.glow - dt * 1.5);
    once('line', el > 2, () => ink(TEXT3.after));
    if (el > 7) S.cruise = Math.max(0, S.cruise - dt * 0.03);
    once('end', el > 9, () => { ink(null); setObjective(TEXT3.nextChapter); });
  },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = { c3stall: stall, c3sail: sail, c3sea: sea, c3gate: gate, c3after: after };
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

/** 챕터 3 중간 장면으로 바로 갈 때 */
export function fastForward3(target: StepId) {
  if (before(target, 'c3stall')) return;
  const passed = (id: StepId) => before(id, target);
  S.boat = C3_START; S.frozen = false; S.frozenVis = S.frozenVisT = 0;
  unlock(['Db', 'Eb', 'Cm', 'F', 'Fsus4'] as ChordId[]);
  if (passed('c3sail')) { S.pieces = 6; S.bare = true; S.hopeSail = true; S.sail = S.sailT = 1; }
  if (passed('c3sea')) S.boat = C3_START + 4;
  if (passed('c3gate')) { thorns[2].gone = true; obj('thorn3').gone = true; S.crack = 2; }
}
