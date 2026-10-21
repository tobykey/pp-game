// 챕터 5 '다시, 그 순간' 장면 진행 (문구는 data/chapter5.ts, 시나리오는 docs/scenario-ch5.md)
// D.S. → 우산을 든 쪽 → 보지 않을 때 다가오는 것 → 되받아 치기 + 시점 맞추기(♮) → 물그림자에 두 사람
// → 붓글씨의 질문(기억 테스트) → 쉼표: 잠든 건 나였다 → 붓글씨 문장 바꾸기 → B♭
import { CHORDS, type ChordId } from '../data/chords';
import { DROPS_FROM } from '../data/chapter2';
import { ANSWER_SLOT, C5_START, ECHO5, NAT_LOOK, OTHER_AT, OTHER_GAP, QUESTIONS, REST_BEATS, TEXT5 } from '../data/chapter5';
import { before, type StepId } from '../data/steps';
import { playNote } from '../audio/engine';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, reduceMotion } from '../render/palette';
import { creepers, nat, rewrite, rewriteWritten, test5, truth } from '../render/chapter5Art';
import { playTruthCut } from '../render/cutscene';
import { chapterCard, cue, ink, setProgress, unlock } from '../ui/hud';
import { boatX, boatY } from '../world/geometry';
import { grooveBeat, setBarChord, setTempo } from '../world/rhythm';
import { OBJ, S, fx, obj, str, view } from '../world/state';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler } from './director';

const PINK = '#ff2a7f';
const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }
let currentEl = 0;

const OTHER_IDS = ['o5meet', 'o5room', 'o5stage', 'o5rain'];
/** 화음을 줄 하나씩 빠르게 (그 사람이 치는 기타) */
function chordSound(c: ChordId, dyn = 0.8, at = 0) {
  CHORDS[c].v.forEach((m, i) => setTimeout(() => { playNote(m, dyn); str[i].amp = Math.max(str[i].amp, 8 * dyn); str[i].hot = 1; }, at + i * 24));
}

// ---------- 5-1 D.S. ----------
const ret: StepHandler = {
  enter() {
    chapterCard('CHAPTER 5', '다시, 그 순간', '프리코러스 D.S.');
    setTempo(65, 'heart'); setBarChord(null); S.forced = null; resolveChord();
    S.dsT = 0; S.stormT = 0; S.rainFallT = 0; S.dryT = 0;
    S.cruise = 0.12; S.lookable = true;
    // 챕터 2의 멈춘 비가 다시: 같은 순간으로 돌아왔다
    S.rainShift = C5_START - 0.4 - DROPS_FROM; S.frozenVisT = 1;
  },
  update(_dt, el) {
    once('ink', el > 2.5, () => ink(TEXT5.ret));
    if (S.boat >= OTHER_AT - 0.75 && el > 6) goLater('c5other', el, 0);
  },
};

// ---------- 5-2 우산을 든 쪽 ----------
const other: StepHandler = {
  enter() {
    ink(null);
    S.cruise = 0.11;
    OTHER_IDS.forEach(id => { const o = obj(id); o.hidden = false; o.gone = false; o.play = 0; });
  },
  update(_dt, el) {
    // 손은 쉰다. 배가 저절로 흐르며, 그림 앞에 오면 그림이 움직인다
    for (const id of OTHER_IDS) {
      const o = obj(id), d = Math.abs((o.wx ?? 0) - S.boat);
      o.vis = Math.max(o.vis, Math.max(0.35, 1 - d * 0.8));
      if (d < 0.3 && o.play === 0) o.play = 0.001;
    }
    if (S.boat > OTHER_AT + OTHER_GAP * 3 + 0.55 && el > 10) goLater('c5creep', el, 0);
  },
};

// ---------- 5-3 보지 않을 때 다가오는 것 ----------
let absorbed = 0;
const creep: StepHandler = {
  enter() {
    S.cruise = 0; S.vel = 0; absorbed = 0;
    OTHER_IDS.forEach(id => { obj(id).hidden = true; });
    creepers.length = 0;
    creepers.push(
      { scene: 'room', wx: S.boat - 0.95, ry: 0.22, gone: 0 },
      { scene: 'stage', wx: S.boat - 1.15, ry: 0.72, gone: 0 },
      { scene: 'rain', wx: S.boat + 0.95, ry: 0.22, gone: 0 },
      { scene: 'meet', wx: S.boat + 1.15, ry: 0.72, gone: 0 },
    );
    setProgress(TEXT5.progressCreep(0));
  },
  update(dt, el) {
    S.vel = 0;
    const W = view.W, fw = W * 0.2;
    for (const c of creepers) {
      if (c.gone > 0) { c.gone = Math.min(1, c.gone + dt * 1.2); continue; }
      const x = boatX() + (c.wx - S.boat) * W;
      // 내가 보고 있는 동안(화면 안에 다 들어와 있으면) 멈춘다. 보지 않을 때만 다가온다
      const seen = x > fw * 0.5 && x < W - fw * 0.5;
      if (!seen) c.wx += Math.sign(S.boat - c.wx) * 0.34 * dt;
      if (Math.abs(c.wx - S.boat) < 0.08) {
        c.gone = 0.001; absorbed++;
        setProgress(TEXT5.progressCreep(absorbed));
        splash(boatX(), boatY() - 40, 26, 0.7, PINK);
        playNote([61, 65, 68, 73][absorbed - 1] ?? 73, 0.35);
        ink(null);
      }
    }
    once('hint1', el > 7 && absorbed === 0, () => ink(TEXT5.creepHint1));
    once('hint2', el > 15 && absorbed === 0, () => ink(TEXT5.creepHint2));
    if (absorbed >= 4 && creepers.every(c => c.gone >= 1)) { setProgress(''); goLater('c5natural', el, 1.5); }
  },
};

// ---------- 5-4 제자리표: 되받아 치기 → 시점 맞추기 → 물그림자에 두 사람 ----------
let natPhase: 'call' | 'answer' | 'wait' | 'align' | 'refl' = 'wait', round = 0, idx = 0, alignHold = 0, toneT = 0, reflT = -1;
const natural: StepHandler = {
  enter() {
    natPhase = 'wait'; round = 0; idx = 0; alignHold = 0; reflT = -1;
    S.frozenVisT = 0;
    setTempo(130, 'pre');
    setBarChord(() => S.forced ?? null);
    unlock(['Db', 'Eb', 'Cm', 'Csus4', 'C']);
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0) return;
    // 마디 첫 박에 그 사람의 기타가 진행을 들려준다 (한 박에 한 코드)
    if (natPhase === 'wait' && gb % 4 === 0) { natPhase = 'call'; idx = 0; }
    if (natPhase === 'call') {
      const c = ECHO5[round][idx];
      S.forced = c; resolveChord(); chordSound(c, 0.7);
      cue(CHORDS[c].label, 'soft');
      if (++idx >= 4) {
        natPhase = 'answer'; idx = 0;
        setTimeout(() => { cue(null); S.forced = null; resolveChord(); S.nextChord = ECHO5[round][0]; once('listen', true, () => ink(TEXT5.echoListen)); }, 380);
      }
    }
  },
  update(dt, el) {
    if (natPhase === 'align') {
      const err = Math.abs(S.look - NAT_LOOK);
      // 가까워지면 살짝 끌려간다 (철컥 맞는 손맛)
      if (err < 0.08 && S.lookDir === 0) S.look += (NAT_LOOK - S.look) * Math.min(1, dt * 5);
      // 조율하듯: 맞아 갈수록 음이 올라가 으뜸음에 닿는다
      if (S.t > toneT && err < 0.6) { toneT = S.t + 0.32; playNote(60 + Math.round((1 - Math.min(1, err / 0.5)) * 12), 0.16); }
      alignHold = err < 0.03 ? alignHold + dt : 0;
      if (alignHold > 0.3) {
        natPhase = 'refl'; nat.on = false; nat.done = true; nat.tDone = S.t; S.natural = true;
        S.lookHold = false; ink(null);
        chordSound('C', 1);
        splash(view.W / 2, view.H * 0.3, 40, 1, PINK);
        if (!reduceMotion) S.shake = Math.max(S.shake, 5);
        reflT = el;
      }
    }
    if (natPhase === 'refl') {
      once('reflHint', el - reflT > 3 && !done.has('reflSeen'), () => ink(TEXT5.reflHint));
      const r = obj('refl');
      once('reflSeen', Math.min(r.vis, r.detail) > 0.25, () => { ink(null); goLater('c5test', el, 4.5); });
      if (el - reflT > 24) goLater('c5test', el, 0);
    }
  },
  stroke(s) {
    if (natPhase !== 'answer') return;
    const seq = ECHO5[round];
    if (s.chord === seq[idx]) {
      idx++;
      splash(boatX() + 80, boatY() - 30, 12, 0.5, PINK);
      S.nextChord = seq[idx] ?? null;
      if (idx >= 4) {
        round++; ink(null);
        if (round >= ECHO5.length) startAlign(); else natPhase = 'wait';
      }
    } else if (s.chord !== 'open') { ink(TEXT5.echoAgain); natPhase = 'wait'; S.nextChord = null; }
  },
};
function startAlign() {
  natPhase = 'align'; S.nextChord = null;
  setTempo(65, 'heart'); setBarChord(null);
  S.lookHold = true; nat.on = true; nat.done = false; nat.wx = S.boat + NAT_LOOK;
  ink(TEXT5.natHint);
}

// ---------- 5-5 붓글씨의 질문 (기억 테스트) ----------
let qEl = 0, anyShown = false;
function ask(i: number) {
  const q = QUESTIONS[i];
  Object.assign(test5, { q: i, t0: S.t, clear: obj(q.painting).seen, picked: -1, result: '', slot: ANSWER_SLOT[i] });
  for (let k = 0; k < 4; k++) {
    const o = obj('ans' + k);
    o.hidden = false; o.vis = 0; o.wx = S.boat + (k % 2 ? 0.3 : -0.3);
  }
  qEl = currentEl; anyShown = false;
}
const test: StepHandler = {
  enter() {
    // 음악이 멈추고, 그 사람이 손끝으로 물 위에 글을 쓴다
    setTempo(65, 'none'); S.forced = null; resolveChord();
    // 챕터 0의 속삭임은 여리게 긁으면 또 떠오르므로, 질문과 겹치지 않게 거둔다 (속삭임은 5-6에서 다시)
    OBJ.filter(o => o.kind === 'whisper').forEach(o => { o.hidden = true; });
    ink(null);
    Object.assign(test5, { end: '', missed: [] as number[] });
    ask(0);
  },
  update(_dt, el) {
    if (test5.end) return;
    const shown = OBJ.some(o => o.kind === 'answer' && !o.hidden && o.vis > 0.4);
    if (shown && !anyShown) { anyShown = true; once('pick', true, () => ink(TEXT5.testPick)); }
    if (!test5.result && !anyShown && el - qEl > 9) ink(TEXT5.testSoft);
  },
  stroke(s) {
    if (test5.end || test5.result || test5.q < 0) return;
    const k = [0, 1, 2, 3].find(k => { const o = obj('ans' + k); return o.chord === s.chord && o.vis > 0.4; });
    if (k == null) return;
    ink(null);
    test5.picked = k; test5.resultT = S.t;
    const right = k === test5.slot && test5.clear;
    test5.result = right ? 'right' : 'blank';
    if (right) chordSound(s.chord, 0.6);
    else { test5.missed.push(test5.q); playNote(41, 0.3); }
    const next = test5.q + 1;
    setTimeout(() => {
      if (next < QUESTIONS.length) { ask(next); return; }
      for (let i = 0; i < 4; i++) obj('ans' + i).hidden = true;
      test5.end = test5.missed.length ? 'okay' : 'thanks'; test5.endT = S.t;
      goLater('c5truth', currentEl, 6 + test5.missed.length * 0.9);
    }, 2600);
  },
};

// ---------- 5-6 잠든 건 나였다 (쉼표: 긁기를 멈춰야 그 사람의 기타가 들린다) ----------
// 차오를수록 화면 가장자리가 어두워지고 배 쪽으로 조여 들며, 두 번째 심장이 커진다 (긴장)
// 다 차면 숨을 멈춘 듯한 정적 → 화면 가득 진실 컷(꿈 바깥의 머리맡) → 배 위의 자리가 바뀌어 있다
let restDone = false, restBeat = 0, restEl = 0;
function crackRest() {
  if (restDone || S.rest < 0) return;
  if (S.rest > 0) { S.restCrackT = S.t; playNote(96, 0.35); }
  S.rest = 0; restBeat = 0; S.heart2 = 1.6; S.pressT = 0;
}
const truthStep: StepHandler = {
  enter() {
    Object.assign(test5, { q: -1, end: '' });
    setTempo(65, 'heart'); S.heart2 = 1.6;
    restDone = false; restBeat = 0; S.rest = 0; truth.whisperT = -1;
    ink(TEXT5.restHint);
  },
  beat() {
    if (restDone || S.rest < 0) return;
    // 긁지 않는 박마다 쉼표가 한 겹씩 차오르고, 그 사람의 기타가 조금씩 또렷해진다
    S.rest = Math.min(1, S.rest + 1 / REST_BEATS);
    S.heart2 = 1.6 + 2.2 * S.rest; S.pressT = 0.55 * S.rest;
    const ch: ChordId = Math.floor(restBeat / 4) % 2 ? 'Ab' : 'Db6', notes = CHORDS[ch].v.filter((m): m is number => m != null);
    playNote(notes[restBeat % notes.length] + 12, 0.12 + 0.5 * S.rest);
    restBeat++;
    if (S.rest >= 1) { restDone = true; restEl = currentEl; ink(null); setTempo(65, 'none'); }
  },
  update(_dt, el) {
    if (!restDone) return;
    const e = el - restEl;
    // 숨을 멈춘 정적 1.2초 → 진실 컷 (그 사람의 기타가 이어서 울린다)
    once('cut', e > 1.2, () => {
      [0, 1900, 3800, 5700].forEach((ms, i) => setTimeout(() => chordSound(i % 2 ? 'Ab' : 'Db6', 0.55), ms));
      playTruthCut(() => {
        S.rest = -1; S.pressT = 0; S.swap = S.swapT = 1;
        setTempo(65, 'heart'); S.heart2 = 1.8;
        truth.whisperT = S.t;
        setTimeout(() => { S.sunkT = 1; S.crack = 4; }, 1500);
        goLater('c5rewrite', currentEl, 7);
      });
    });
  },
  stroke() { crackRest(); },
  pluck() { crackRest(); },
};

// ---------- 붓글씨 문장 바꾸기: '나를 잊어 줘' → '나를 기억해 줘' ----------
let hard = 0, writtenEl = -1;
const rewriteStep: StepHandler = {
  enter() {
    truth.whisperT = -1; S.sunkT = 0.3;
    Object.assign(rewrite, { on: true, t0: S.t, pulseT: -9, loosen: 0, stampT: -1 });
    hard = 0; writtenEl = -1;
    unlock(['Db']);
  },
  update(dt, el) {
    const written = rewriteWritten();
    if (written && writtenEl < 0) writtenEl = el;
    if (writtenEl >= 0 && rewrite.stampT < 0) {
      // 아무것도 안 하면 단어가 먼저 떨려 신호를 준다
      if (Math.floor(el * 0.5) !== Math.floor((el - dt) * 0.5)) rewrite.pulseT = S.t;
      once('idle', el - writtenEl > 9 && rewrite.loosen === 0, () => ink(TEXT5.rewriteSoft));
    }
    if (rewrite.stampT >= 0 && S.t - rewrite.stampT > 5) goLater('c5after', el, 0);
  },
  stroke(s) {
    if (writtenEl < 0 || rewrite.stampT >= 0) return;
    if (rewrite.loosen < 1) {
      rewrite.pulseT = S.t;
      if (s.dyn >= 0.4) { hard++; ink(hard === 1 ? TEXT5.rewriteHard : TEXT5.rewriteSoft); return; }
      // 여리게 비추면 단어가 풀려 흩어진다
      rewrite.loosen = Math.min(1, rewrite.loosen + 0.5); ink(null);
      return;
    }
    if (s.chord !== 'Db') return;
    rewrite.stampT = S.t;
    chordSound('Db', 1);
    splash(view.W / 2, view.H * 0.55, 50, 1.1, PINK);
    for (let j = 0; j < 22; j++) fx.lines.push({ x: view.W / 2, y: view.H * 0.55, a: rand(-Math.PI, 0), l: rand(80, view.W * 0.35), life: 1.1, c: j % 3 ? PINK : INK });
    if (!reduceMotion) S.shake = Math.max(S.shake, 7);
  },
};

// ---------- 5-7 B♭ ----------
const after: StepHandler = {
  enter() {
    setTempo(65, 'heart'); S.heart2 = 1.9; S.bflatT = 1;
    // 바뀐 자리는 그대로 둔다 (챕터 6 첫머리에서 꿈의 배로 돌아간다)
    S.sunkT = 0.4;
  },
  update(_dt, el) {
    once('off', el > 3, () => { rewrite.on = false; });
    once('ink', el > 3.5, () => ink(TEXT5.after));
    once('inkOff', el > 9, () => ink(null));
    // 깨어날 시간 → 챕터 6
    if (el > 10.5) goLater('c6chorus', el, 0);
  },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = {
  c5return: ret, c5other: other, c5creep: creep, c5natural: natural, c5test: test, c5truth: truthStep, c5rewrite: rewriteStep, c5after: after,
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

/** 챕터 5 중간 장면으로 바로 갈 때 */
export function fastForward5(target: StepId) {
  if (before(target, 'c5return')) return;
  const passed = (id: StepId) => before(id, target);
  S.boat = C5_START - 0.5; S.lookable = true; S.dsT = S.ds = 0;
  unlock(['Db', 'Eb', 'Cm', 'Csus4', 'C', 'F', 'Ab', 'Db6']);
  if (passed('c5return')) { S.boat = OTHER_AT - 0.7; S.rainShift = C5_START - 0.4 - DROPS_FROM; }
  if (passed('c5other')) S.boat = OTHER_AT + OTHER_GAP * 3 + 0.6;
  if (passed('c5natural')) S.natural = true;
  if (passed('c5truth')) { S.crack = 4; S.heart2 = 1.6; }
}
