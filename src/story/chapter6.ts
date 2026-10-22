// 챕터 6 '깨어남' 장면 진행 (문구는 data/chapter6.ts, 시나리오는 docs/scenario-ch6.md)
// 마지막 후렴 → 마지막 관문(배운 기믹이 빨라지며 섞임, 코드 칩이 흐려짐) → 격돌 ②(혼자서는 못 이김)
// → 그 사람이 일어나 함께 긁음(열두 줄, 모아 온 것들이 가세) → 두 박동 → B♭ 앞의 선택(pp) → 코다(F) → 엔딩
import { CHORDS, type ChordId } from '../data/chords';
import { endTrial, fail, startTrial } from './rewind';
import { leaveSong, playSong } from './music';
import { mrTail } from '../audio/mr';
import { later } from '../world/timers';
import { ALLIES, C6_START, CHORUS, CHORUS3, CHORUS_COUNTERS, CLASH2_BPMS, CODA, EXPLAIN, GAUNTLET, RIFF6, TEXT6 } from '../data/chapter6';
import { before, type StepId } from '../data/steps';
import { playNote } from '../audio/engine';
import { resolveChord } from '../input/chord';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { counterWaves } from '../render/chapter3Art';
import { guardWaves } from '../render/chapter2Art';
import { allies, allyArrived, choice, ending, EPI_LINE, EXPLAIN_SLIDE, RECALL_DUR, RECALL_EACH, recall } from '../render/chapter6Art';
import { chapterCard, cue, ink, setObjective, setProgress, unlock } from '../ui/hud';
import { boatScale, boatX, boatY } from '../world/geometry';
import { grooveBeat, setBarChord, setTempo } from '../world/rhythm';
import { row } from '../world/rowing';
import { S, fx, thorns, view } from '../world/state';
import { rand } from '../util/math';
import { go, type StepHandler } from './director';
import { sceneKit } from './scene';
import { chordSound } from './sfx';
import { counterSoon, guardSoon, settleWaves, showWaves, tryCounter, tryGuard } from './counter';
import { fBurst } from './chapter3';

const PINK = '#ff2a7f';
/** 이 챕터의 장면 도구 (story/scene.ts) */
const { once, goLater, register, el: elNow } = sceneKit();

const ALL: ChordId[] = ['Db', 'Eb', 'Cm', 'F', 'Fsus4', 'Db6', 'Ab'];
function chipsFade(on: boolean) { document.body.classList.toggle('chipsfade', on); }

// ---------- 6-1 마지막 후렴 ----------
let chorusEnded = false;
const chorus: StepHandler = {
  enter() {
    chapterCard('CHAPTER 6', '깨어남', '후렴 3 · 코다');
    // 잠깐 본 진실(바뀐 자리)이 걷히고, 다시 꿈의 바다로. 안개는 하나도 없다
    S.swapT = 0; S.sunkT = 0; S.fogT = 0; S.fog = 0; S.frozenVisT = 0; S.rest = -1;
    // 원곡의 후렴 3, 앞 8마디 (MR이 없으면 합성 그루브)
    playSong([['chorus3', 8]], 130, 'chorus'); chorusEnded = false;
    setBarChord(bar => CHORUS3[bar] ?? null);
    S.cruise = 0.1; S.glow = 0; S.hopeSail = true; S.sail = S.sailT = 1;
    unlock(ALL);
    counterWaves.length = 0; CHORUS_COUNTERS.forEach(c => counterWaves.push({ ...c, shown: false, done: false, hit: false }));
    guardWaves.length = 0;
    later(() => ink(TEXT6.back), 1200);
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0 || chorusEnded) return;
    settleWaves(gb);
    if (gb % 4) return;
    const bar = gb / 4;
    if (bar >= 8) { chorusEnded = true; go('c6gauntlet'); return; }
    S.forced = CHORUS3[bar]; resolveChord(); S.nextChord = CHORUS3[bar + 1] ?? null;
    if (bar === 2) ink(null);
  },
  update() { showWaves(); S.counterCue = counterSoon(); S.vel = Math.min(S.vel, 0.2); },
  stroke(s) { if (tryCounter(s)) return; row(s.dir, 0.6); },
};

// ---------- 6-2 마지막 관문 ----------
// 후렴 16마디를 네 단계로. 단계마다 빨라지고, 파란 빛·노란 빛이 반 박 간격까지 촘촘해진다. 뒤 두 단계에선 코드 칩이 흐려진다
let stage = 0, fOpen = false, fDone = false, gHits = 0;
function startStage(i: number) {
  const g = GAUNTLET[i];
  stage = i; fOpen = false; fDone = false;
  if (i === 0) leaveSong(g.bpm, 'chorus', 0.3); else setTempo(g.bpm, 'chorus');
  counterWaves.length = 0; g.counters.forEach(c => counterWaves.push({ ...c, shown: false, done: false, hit: false }));
  gHits = 0; guardWaves.length = 0; g.guards.forEach(b => guardWaves.push({ beat: b, blocked: false, hit: false }));
  if (g.fade) { chipsFade(true); once('fadeInk', true, () => ink(TEXT6.gauntletChips)); }
}
const gauntlet: StepHandler = {
  enter() {
    S.gaugeOn = true; S.rainFallT = 0.6; // 노란 빗줄기가 보이도록
    gHits = 0;
    startTrial('c6gauntlet', ['노란 빛엔 Shift 누른 채 · 파란 빛엔 아주 세게', '노란 원 = 막기 · 파란 원 = 받아치기 · 원이 닿는 박에']);
    setBarChord(bar => CHORUS[(stage * 4 + bar) % 16] ?? null);
    startStage(0);
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0) return;
    settleWaves(gb);
    // 놓친 빛마다 박 하나가 쉼표로 (단계가 바뀌면 빛 목록이 새로 채워지므로 그 단계 안에서 센다)
    { const hits = counterWaves.filter(w => w.hit).length + guardWaves.filter(w => w.hit).length; while (gHits < hits) { gHits++; if (fail()) return; } }
    const g = GAUNTLET[stage];
    if (gb % 4 === 0) {
      const bar = stage * 4 + gb / 4, c = CHORUS[bar % 16];
      setProgress(`${CHORDS[c].label} · ${bar + 1} / 16`);
      if (g.fBar && gb === 12) { fOpen = true; S.forced = null; resolveChord(); cue('F!', 'rock', 'F'); }
      else { if (fOpen && !fDone) cue(null); fOpen = false; S.forced = c; resolveChord(); }
      S.nextChord = CHORUS[(bar + 1) % 16];
    }
    // 단계의 마지막 박에 다음 단계의 빠르기를 건다 (다음 마디 첫 박부터 새 템포)
    if (gb === 15) {
      if (stage < GAUNTLET.length - 1) startStage(stage + 1);
      else { cue(null); S.gaugeOn = false; endTrial(); go('c6clash'); }
    }
  },
  update() {
    showWaves(); S.vel = Math.min(S.vel, 0.22);
    S.guardCue = guardSoon(); S.counterCue = !S.guardCue && counterSoon();
  },
  stroke(s) {
    if (fOpen && !fDone && s.chord === 'F') { fDone = true; cue(null); fBurst(); return; }
    if (tryGuard()) return;
    if (tryCounter(s)) return;
    row(s.dir, 0.6);
  },
};

// ---------- 6-3 격돌 ② (혼자서는 감당할 수 없다) ----------
let ci = 0, inStage = 0, clashBeats = 0, lows = 0, rose = false;
const clash: StepHandler = {
  enter() {
    ci = 0; inStage = 0; clashBeats = 0; lows = 0; rose = false;
    counterWaves.length = 0; guardWaves.length = 0; S.guardCue = S.counterCue = false; S.rainFallT = 1; S.stormT = 1;
    S.tug = 0.35; S.cruise = 0; S.vel = 0; S.glow = 0;
    setTempo(CLASH2_BPMS[0], 'storm'); setBarChord(null);
    S.forced = RIFF6[0]; resolveChord(); S.nextChord = null; setProgress('');
    S.pressT = 0.3; cue('긁어!', 'rock'); ink(TEXT6.clashHint);
  },
  beat() {
    if (rose) return;
    if (clashBeats % 4 === 0) { S.forced = RIFF6[(clashBeats / 4) % RIFF6.length]; resolveChord(); }
    clashBeats++;
    if (++inStage >= 8 && ci < CLASH2_BPMS.length - 1) { inStage = 0; ci++; setTempo(CLASH2_BPMS[ci], 'storm'); S.pressT = 0.3 + 0.18 * ci; }
  },
  update(dt, el) {
    if (rose) return;
    once('hintOff', el > 3, () => ink(null));
    // 혼자서는 이길 수 없게: 미는 힘이 점점 세지고, 게이지가 0.6 위로는 올라가지 않는다
    S.tug = Math.min(0.6, S.tug - dt * (0.12 + 0.035 * ci));
    if (!reduceMotion) S.shake = Math.max(S.shake, 2 + 2.5 * ci);
    if (S.tug <= 0.04) { S.tug = 0.22; lows++; S.wobble += 0.25; splash(boatX() + 80, boatY() - 30, 40, 1, INK); ink(TEXT6.clashAgain); }
    // 포기하기 직전: 마지막 빠르기에서 두 번 밀렸거나, 오래 버텼을 때 그 사람이 일어난다
    if ((ci >= CLASH2_BPMS.length - 1 && lows >= 1) || lows >= 3 || el > 22) riseUp();
  },
  stroke(s) {
    if (rose) return;
    S.tug += 0.03 + 0.03 * s.dyn;
    const sc = boatScale(), x = boatX() + 120 * sc, y = boatY() - 40 * sc;
    for (let i = 0; i < 5; i++) { const a = rand(-0.6, 0.3), v = rand(300, 700); fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 5), life: 0.8, dec: 1.6, c: i % 2 ? PINK : VOLT }); }
  },
};
function riseUp() {
  rose = true;
  S.riseT = 1; S.duetT = 1;
  cue(null); ink(TEXT6.rise);
  // 그 사람의 기타가 처음으로 내 기타와 함께 울린다
  chordSound('F', 1);
  if (!reduceMotion) S.shake = Math.max(S.shake, 6);
  goLater('c6together', elNow(), 2.2);
}

// ---------- 6-4 두 사람의 줄 ----------
let allyN = 0, nextAlly = 0, together = false, wonT = -1;
const togetherStep: StepHandler = {
  enter() {
    allyN = 0; nextAlly = 0.8; together = true; wonT = -1; allies.length = 0;
    S.riseT = 1; S.duetT = 1; S.tug = Math.max(S.tug, 0.3);
    setTempo(CLASH2_BPMS[CLASH2_BPMS.length - 1], 'storm');
    cue(TEXT6.together, 'rock'); later(() => cue(null), 1600);
  },
  update(dt, el) {
    if (!together) return;
    S.tug -= dt * 0.14;
    if (S.tug < 0.15) S.tug = 0.15; // 함께니까 더는 밀리지 않는다
    // 모아 온 것들이 하나씩 날아가 물벽을 민다
    if (el > nextAlly && allyN < ALLIES.length) { allies.push({ label: ALLIES[allyN], t0: S.t }); allyN++; nextAlly = el + 1.1; }
    for (const a of allies) if (allyArrived(a) && !a.hit) {
      a.hit = true; S.tug += 0.07;
      const s = boatScale(), near = boatX() + 150 * s, wx = near + (view.W * 0.95 - near) * S.tug;
      splash(wx, boatY() - 40, 24, 0.9, PINK); playNote(72 + (allyN % 5) * 2, 0.4);
    }
    if (S.tug >= 1 && wonT < 0) win(el);
  },
  stroke(s) {
    if (!together) return;
    // 두 사람이 함께 긁으니 한 번이 두 번 몫
    S.tug += (0.03 + 0.03 * s.dyn) * 2.4;
  },
};
function win(el: number) {
  wonT = el; together = false;
  S.tug = 1; ink(TEXT6.won);
  S.pressT = 0; S.punchT = 1; later(() => { S.punchT = 0; }, 250);
  S.fburst = 0.8; S.burst = 1; S.stormT = 0; S.rainFallT = 0;
  if (!reduceMotion) S.shake = Math.max(S.shake, 12);
  const x = boatX() + 200, y = boatY() - 60;
  for (let j = 0; j < 40; j++) fx.lines.push({ x, y, a: rand(-Math.PI, Math.PI), l: rand(150, view.W * 0.7), life: 1.5, c: j % 3 ? VOLT : PINK });
  // 곡이 To Coda에서 끊기듯, 정적
  setTempo(65, 'none');
  later(() => { S.tug = -1; allies.length = 0; }, 900);
  goLater('c6heart', el, 3);
}

// ---------- 6-5 두 박동 ----------
const heartStep: StepHandler = {
  enter() {
    ink(null); S.forced = null; resolveChord(); setProgress('');
    // 회상 한 마디: 정적 속에 지나온 기억이 그 사람 쪽에서 본 모습으로 스쳐 간다 (그 사람의 기타가 여리게)
    setTempo(65, 'none'); S.duetT = 0; recall.t0 = S.t;
    (['Db6', 'Ab', 'Db6', 'Ab'] as ChordId[]).forEach((c, i) => later(() => chordSound(c, 0.35), i * RECALL_EACH * 1000));
  },
  update(_dt, el) {
    const e = el - RECALL_DUR;
    // 회상이 끝나면 두 심장이 나란히
    once('hearts', e > 0, () => { recall.t0 = -1; setTempo(65, 'heart'); S.heart2 = 2.2; S.heart2Off = 0.02; S.heart2Every = 1; });
    once('i1', e > 1.5, () => ink(TEXT6.heart1));
    // 하나가 느려진다: 두 박에 한 번 → 세 박에 한 번 → 멎는 듯 아주 약하게
    once('slow1', e > 7, () => { S.heart2Every = 2; S.heart2Off = 0.25; ink(TEXT6.heart2); });
    once('slow2', e > 12, () => { S.heart2Every = 3; S.heart2 = 1.2; S.riseT = 0.6; });
    once('slow3', e > 16, () => { S.heart2 = 0.5; S.bflatT = 1; ink(null); });
    if (e > 18) goLater('c6choice', el, 0);
  },
};

// ---------- 6-6 B♭ · 선택 ----------
let hardN = 0;
const choiceStep: StepHandler = {
  enter() {
    S.ending = ''; choice.on = true; choice.chosenT = -1; hardN = 0;
    S.lookable = true; S.lookHold = true; S.bflatT = 1;
    later(() => ink(TEXT6.choiceHint), 2500);
  },
  stroke(s) {
    if (S.ending) return;
    const side = S.look < -0.12 ? 'keep' : S.look > 0.12 ? 'give' : '';
    if (s.dyn >= 0.38) { choice.shakeT = S.t; hardN++; if (hardN <= 2) ink(TEXT6.choiceHard); return; }
    if (!side) { ink(TEXT6.choiceHint); return; }
    choose(side);
  },
};
function choose(side: 'keep' | 'give') {
  S.ending = side; choice.chosenT = S.t; ink(null);
  try { localStorage.setItem('pp.ending', side); } catch { /* 무시 */ }
  S.lookHold = false;
  const th = thorns[0];
  if (side === 'give') {
    // 마지막 가시도 그 사람이 삼킨다
    th.gone = true; th.fly = { t: S.t, vx: 0, vy: 0, rot: 3, toBow: true };
    S.bflatT = 0; S.heart2 = 0.25;
  } else {
    // 내가 다시 품는다: B♭은 내 오선에 남아, 핑크에서 먹빛으로 가라앉는다
    S.bflatT = 0.35; S.heart2 = 1.4; S.heart2Every = 1; S.heart2Off = 0.12; S.riseT = 1;
  }
  chordSound('Db6', 0.5);
  goLater('c6coda', elNow(), 4);
}

// ---------- 6-7 코다 ----------
let codaBar = -1, finalOpen = false, finalDone = false, withMR = false;
const coda: StepHandler = {
  enter() {
    choice.on = false; codaBar = -1; finalOpen = false; finalDone = false;
    // 원곡의 코다를 끝까지: 마지막 F가 길게 떨며 곡이 정말로 끝난다
    withMR = playSong([['coda']], 130, 'chorus'); setBarChord(bar => CODA[bar] ?? null);
    S.cruise = 0.08; chipsFade(false);
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0 || gb % 4 || finalDone) return;
    codaBar = gb / 4;
    // 첫 마디의 F와 마지막 마디의 F는 플레이어가 직접 (곡이 F로 시작해 F로 끝난다)
    const last = CODA.length - 1;
    if (codaBar === 0 || codaBar === last) { finalOpen = true; S.forced = null; resolveChord(); cue(TEXT6.codaF, 'rock', 'F'); return; }
    if (codaBar > last) { if (!finalDone) finish(); return; }
    if (finalOpen) cue(null);
    finalOpen = false; S.forced = CODA[codaBar]; resolveChord(); S.nextChord = CODA[codaBar + 1] ?? null;
  },
  stroke(s) {
    if (finalOpen && s.chord === 'F') {
      cue(null); finalOpen = false;
      if (codaBar >= CODA.length - 1) finish();
      else splash(boatX(), boatY() - 60, 30, 0.9, PINK);
      return;
    }
    row(s.dir, 0.4);
  },
};
function finish() {
  finalDone = true; cue(null); S.cruise = 0;
  // 마지막 F를 길게 떨며 끝. 원곡이 나오고 있으면 원곡의 마지막 화음이 다 울릴 때까지, 그리고 한 번 더 숨을 쉬고
  // (Toby: 코다의 마지막 여운이 참 좋다 → 서두르지 않는다)
  if (withMR) {
    for (let k = 0; k < 6; k++) later(() => chordSound('F', 0.5 - k * 0.07), k * 170);
    const ring = Math.max(2, mrTail('coda') - CODA.length * 4 * 60 / S.bpm);
    goLater('c6end', elNow(), ring + 2.5);
  } else {
    setTempo(65, 'none');
    for (let k = 0; k < 14; k++) later(() => chordSound('F', 0.9 - k * 0.06), k * 160);
    goLater('c6end', elNow(), 6.5);
  }
}

// ---------- 엔딩 ----------
const end: StepHandler = {
  enter() {
    ink(null); setObjective(''); setProgress('');
    ending.phase = 'epi'; ending.t0 = S.t; ending.idx = 0;
    document.body.classList.add('cutting'); // 화면 위 글자·칩을 숨긴다
  },
  update() {
    const t = S.t - ending.t0;
    if (ending.phase === 'epi' && t > 1 + 4 * EPI_LINE + 2) { ending.phase = 'explain'; ending.t0 = S.t; ending.idx = 0; }
    else if (ending.phase === 'explain' && t > EXPLAIN_SLIDE) {
      if (ending.idx < EXPLAIN.length - 1) { ending.idx++; ending.t0 = S.t; }
      else { ending.phase = 'logo'; ending.t0 = S.t; }
    }
  },
  // 긁으면 해설을 한 장 넘긴다
  stroke() { if (ending.phase === 'explain' && S.t - ending.t0 > 1) ending.t0 = S.t - EXPLAIN_SLIDE; },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = {
  c6chorus: chorus, c6gauntlet: gauntlet, c6clash: clash, c6together: togetherStep, c6heart: heartStep, c6choice: choiceStep, c6coda: coda, c6end: end,
};
register(all);

/** 챕터 6 중간 장면으로 바로 갈 때 */
export function fastForward6(target: StepId) {
  if (before(target, 'c6chorus')) return;
  const passed = (id: StepId) => before(id, target);
  S.boat = C6_START; S.swap = S.swapT = 0; S.fog = S.fogT = 0; S.natural = true; S.crack = 4;
  S.hopeSail = true; S.sail = S.sailT = 1; S.pieces = 6; S.bare = true;
  unlock(ALL);
  if (passed('c6together')) { S.rise = S.riseT = 1; }
  if (passed('c6heart')) { S.bflat = S.bflatT = 1; }
}
