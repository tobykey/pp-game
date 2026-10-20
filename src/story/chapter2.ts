// 챕터 2 '멈춘 시간' 장면 진행 (문구·배치는 data/chapter2.ts, 시나리오는 docs/scenario-ch2.md)
// 멈춘 비 → 빗방울 되받아 치기 → 우산 아래(첫 만남) → 쏟아지는 비(팜뮤트 가드) → Csus4 → C → 길게 긁어 후렴으로
import { CHORDS, type ChordId } from '../data/chords';
import {
  C2_START, COLUMN_GAP, COLUMNS, FROZEN_STOP, GUARD_BARS, GUARD_BEATS, P_MEET, TEXT2,
} from '../data/chapter2';
import { before, type StepId } from '../data/steps';
import { audioOut, playNote } from '../audio/engine';
import { crash, scratch } from '../audio/kit';
import { resolveChord } from '../input/chord';
import { setPickFloat } from '../input/pointer';
import { cv } from '../render/canvas';
import { flyPiece, splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { guardWaves } from '../render/chapter2Art';
import { chapterCard, cue, ink, setProgress, unlock } from '../ui/hud';
import { boatX, boatY, pos, toScreenX } from '../world/geometry';
import { judgeBeat } from '../world/judge';
import { grooveBeat, grooveBeatPos, setBarChord, setTempo } from '../world/rhythm';
import { row } from '../world/rowing';
import { OBJ, S, fx, obj, str, thorns, view, type WorldObj } from '../world/state';
import { strumChord } from '../world/strum';
import { rand } from '../util/math';
import { go, registerSteps, type StepHandler } from './director';

const PRE_CHORDS: ChordId[] = ['Db', 'Eb', 'Cm', 'Csus4', 'C'];

const done = new Set<string>();
function once(key: string, cond: boolean, fn: () => void) {
  if (cond && !done.has(key)) { done.add(key); fn(); }
}
let pending: { at: number; to: StepId } | null = null;
function goLater(to: StepId, el: number, delay: number) { if (!pending) pending = { at: el + delay, to }; }
let currentEl = 0;

/** 배를 목표 지점에 스르르 세운다 */
function arrive(target: number) {
  const left = target - S.boat;
  if (left < 0.3) S.vel = Math.min(S.vel, Math.max(0, left * 1.2 + 0.01));
  if (left <= 0.004) { S.boat = target; S.vel = 0; return true; }
  return false;
}

// ---------- 2-1 멈춘 비 ----------
let mutedCount = 0;
const frozen: StepHandler = {
  enter() {
    mutedCount = 0;
    chapterCard('CHAPTER 2', '멈춘 시간', '프리코러스');
    hideChapter1Paintings();
    S.frozen = true; S.frozenVisT = 1; S.silence = false; S.hush = 0;
    S.cruise = 0.05;
    unlock(PRE_CHORDS);
  },
  update(_dt, el) {
    if (arrive(FROZEN_STOP)) S.cruise = 0;
    once('muffled', el > 2.5, () => ink(TEXT2.muffled));
    once('teach', el > 6 && mutedCount === 0, () => ink(TEXT2.hintMute));
  },
  stroke() {
    if (!S.mute) { ink(TEXT2.hintMute); return; }
    if (++mutedCount === 2) { ink(TEXT2.muteOk); goLater('c2echo', currentEl, 2.5); }
  },
};

// ---------- 2-2 빗방울 되받아 치기 ----------
type EchoPhase = 'travel' | 'call' | 'answer' | 'rest';
let ci = 0, k = 0, callI = 0, echoPhase: EchoPhase = 'travel', restUntil = 0;
const col = () => obj('col' + ci);
const echo: StepHandler = {
  enter() {
    ci = 0; k = 0; callI = 0; echoPhase = 'travel';
    OBJ.filter(o => o.kind === 'column').forEach(o => { o.hidden = false; });
    setProgress(TEXT2.progressEcho(0, 3));
  },
  update(_dt, el) {
    if (echoPhase === 'travel') {
      S.cruise = 0.06;
      if (arrive(COLUMNS[ci] - COLUMN_GAP)) { S.cruise = 0; echoPhase = 'call'; callI = 0; }
    } else if (echoPhase === 'rest' && el >= restUntil) {
      if (ci >= COLUMNS.length) { goLater('c2umbrella', el, 0); return; }
      echoPhase = 'travel';
    }
  },
  beat() {
    if (echoPhase !== 'call') return;
    // 기둥이 코드를 하나씩 빛내며 들려준다 (그 사람의 기타 = 머리맡의 연주)
    const c = col(), seq = c.seq!;
    if (callI < seq.length) {
      c.lit = callI + 1; c.res = 1;
      strumChord(seq[callI], 0.45, true);
      callI++;
    } else {
      echoPhase = 'answer'; k = 0; c.lit = 0;
      S.nextChord = seq[0];
      once('echoFirst', true, () => ink(TEXT2.echoFirst));
    }
  },
  stroke(s) {
    if (echoPhase !== 'answer') return;
    if (!S.mute) { ink(TEXT2.hintMute); return; }
    const c = col(), seq = c.seq!;
    if (s.chord === seq[k]) {
      k++; c.lit = k; c.res = 1;
      S.nextChord = seq[k] ?? null;
      if (k >= seq.length) {
        // 기둥이 녹아 흘러내린다. 잠깐 손을 쉬게 한다 (이야기를 볼 틈)
        ink(null);
        c.gone = true; c.play = 0.001;
        const p = pos(c);
        splash(p.x, p.y - 40, 24, 0.6, INK);
        ci++; setProgress(TEXT2.progressEcho(ci, 3));
        S.nextChord = null;
        echoPhase = 'rest'; restUntil = currentEl + 2.6;
      }
    } else if (s.chord !== 'open') {
      // 틀리면 기둥이 한 번 더 들려준다 (실패 없음)
      k = 0; c.lit = 0; echoPhase = 'call'; callI = 0;
      S.nextChord = null;
    }
  },
};

// ---------- 2-3 우산 아래 (이야기, 손은 쉼) ----------
const umbrella: StepHandler = {
  enter() {
    setProgress('');
    obj('pMeet').hidden = false;
    S.cruise = 0.1;
  },
  update(_dt, el) {
    if (arrive(P_MEET)) S.cruise = 0;
    const p = obj('pMeet');
    once('play', S.boat >= P_MEET - 0.01 && el > 2, () => { p.play = 0.001; });
    // 처음 만난 순간의 우산 조각이 날아온다 (조각 4)
    once('piece', p.play >= 1, () => {
      const d = flyPiece(toScreenX(P_MEET - 0.1), view.H * 0.22);
      setTimeout(() => { S.pieces = Math.max(S.pieces, 4); }, d * 1000);
    });
    if (p.play >= 1) goLater('c2guard', el, 5);
  },
};

// ---------- 2-4 쏟아지는 비 (팜뮤트 가드) ----------
let guardBarsDone = false;
const guard: StepHandler = {
  enter() {
    guardBarsDone = false;
    // 우산을 받아든 순간 시간이 풀린다
    S.frozen = false; S.frozenVisT = 0; S.rainFallT = 1;
    setTempo(130, 'pre');
    setBarChord(bar => GUARD_BARS[bar] ?? null);
    S.cruise = 0;
    guardWaves.length = 0;
    GUARD_BEATS.forEach(b => guardWaves.push({ beat: b, blocked: false, hit: false }));
  },
  beat(n) {
    const gb = grooveBeat(n);
    if (gb < 0) return;
    if (gb % 4 === 0) {
      const bar = gb / 4;
      if (bar < GUARD_BARS.length) {
        S.forced = GUARD_BARS[bar]; resolveChord();
        S.nextChord = GUARD_BARS[bar + 1] ?? 'Csus4';
      } else if (!guardBarsDone) { guardBarsDone = true; go('c2resolve'); return; }
    }
    // 막지 못한 빗줄기는 배를 덮친다 (벌은 없다)
    for (const w of guardWaves) {
      if (!w.blocked && !w.hit && gb > w.beat) {
        w.hit = true;
        S.wobble += 0.12;
        splash(boatX(), boatY() - 30, 20, 0.6, INK);
      }
    }
  },
  update() {
    S.vel = Math.min(S.vel, 0.17);
    // 다음 빗줄기가 한 박 남짓 안에 오면 박 안내 원이 노랗게
    const g = grooveBeatPos();
    S.guardCue = guardWaves.some(w => !w.blocked && !w.hit && w.beat - g <= 1.2 && w.beat - g > -0.3);
  },
  stroke(s) {
    if (S.mute) {
      const { j, n } = judgeBeat();
      const gb = grooveBeat(n);
      const w = guardWaves.find(x => x.beat === gb && !x.blocked && !x.hit);
      if (w && j !== 'miss') {
        w.blocked = true; S.shield = 1;
        once('guardOk', true, () => ink(null));
        return;
      }
      once('guardHint', true, () => ink(TEXT2.guardHint));
      return;
    }
    once('guardHint', true, () => ink(TEXT2.guardHint));
    row(s.dir, 0.6);
  },
};

// ---------- 2-5 Csus4 → C → 길게 긁어 후렴으로 ----------
let resolvePhase: 'c' | 'sweep' | 'done' = 'c';
/** C를 친 시각. C를 친 그 손동작이 '길게 긁기'로 잘못 판정되지 않게 */
let cAt = 0;
const resolve: StepHandler = {
  enter() {
    resolvePhase = 'c';
    // Csus4: 비가 다시 공중에서 멈추고, 모든 것이 팽팽하게 매달린다
    setTempo(130, 'none');
    setBarChord(null);
    S.forced = 'Csus4'; resolveChord(); S.forced = null;
    S.frozenVisT = 0.8; S.rainFallT = 0; S.guardCue = false; S.frozen = false;
    S.dimT = 0.35;
    cue('C', 'rock', 'C'); S.nextChord = 'C';
    strumChord('Csus4', 0.7, false);
  },
  stroke(s) {
    if (resolvePhase === 'sweep' && S.pickHeld && S.t - cAt > 0.2) {
      if (s.dyn >= 0.84) finale(); else ink(TEXT2.strikeHarder);
      return;
    }
    if (resolvePhase === 'c' && s.chord === 'C') {
      resolvePhase = 'sweep'; cAt = S.t;
      strumChord('C', 0.8, false);
      // 슬로모션: 세상이 느려지고, 피크가 손에서 빠져나가 화면을 떠다닌다. 겨우 붙잡아 줄에 대고 세게 쳐야 풀린다
      S.timeScale = 0.3; S.slowmoT = 1;
      setPickFloat(true, cv);
      cue(TEXT2.catchCue, 'soft'); ink(TEXT2.catchHint);
      S.nextChord = 'Db';
    }
  },
  update() {
    // 피크를 붙잡았다: 이제 줄에 대고 빠르고 세게
    if (resolvePhase === 'sweep' && S.pickHeld) once('caught', true, () => { cue(TEXT2.strikeCue, 'rock'); ink(TEXT2.strikeHint); });
  },
};
function finale() {
  resolvePhase = 'done';
  cue(null); ink(null);
  // 세게 친 순간, 느려졌던 시간이 한꺼번에 원래대로 돌아온다
  setPickFloat(false, cv);
  S.timeScale = 1; S.slowmoT = 0;
  S.burst = 1;
  const o = audioOut();
  if (o) { scratch(o.ac.currentTime + 0.01, 0.7); crash(o.ac.currentTime + 0.72, 1.2); }
  // 기대를 깨고 후렴(D♭)으로 터진다
  setTimeout(() => {
    const prev = S.mode; S.mode = 'rock';
    CHORDS.Db.v.forEach((m, i) => setTimeout(() => { playNote(m, 1); str[i].amp = 15; str[i].hot = 1; }, i * 20));
    setTimeout(() => { S.mode = prev; }, 200);
    S.dimT = 0; S.frozenVisT = 0;
    S.flash = Math.max(S.flash, reduceMotion ? 0.12 : 0.35); S.flashCol = '#ffffff';
    if (!reduceMotion) S.shake = Math.max(S.shake, 8);
    for (let j = 0; j < 26; j++) fx.lines.push({ x: boatX(), y: boatY() - 40, a: rand(-Math.PI, Math.PI), l: rand(120, view.W * 0.5), life: 1.3, c: j % 3 ? VOLT : INK });
    go('c2end');
  }, 700);
}

const end: StepHandler = {
  enter() {
    S.nextChord = null;
    setTempo(130, 'chorus');
    setBarChord(() => 'Db');
    S.cruise = 0.08;
  },
  update(_dt, el) {
    S.vel = Math.min(S.vel, 0.12);
    // D♭ 폭발의 여운이 가라앉으면 챕터 3으로
    if (el > 2.5) goLater('c3stall', el, 0);
  },
};

// ---------- 공통 래퍼 ----------
const all: Partial<Record<StepId, StepHandler>> = {
  c2frozen: frozen, c2echo: echo, c2umbrella: umbrella, c2guard: guard, c2resolve: resolve, c2end: end,
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

/** 챕터 1의 기억 그림은 거둔다 (특히 비의 섬 액자 밖 '우산을 든 사람'이 챕터 2의 반전을 미리 보여 주지 않게) */
function hideChapter1Paintings() { ['pRoom', 'pStage', 'pRain'].forEach(id => { obj(id).hidden = true; }); }

/** 챕터 2 중간 장면으로 바로 갈 때, 앞 장면들이 끝났을 때의 상태를 만든다 */
export function fastForward2(target: StepId) {
  if (before(target, 'c2frozen')) return;
  const passed = (id: StepId) => before(id, target);
  // 챕터 1이 끝난 상태: 줄이 다시 매어져 있다
  S.silence = false; S.hush = 0; S.zoom = S.zoomT = 0;
  S.boat = C2_START; S.pieces = 3; S.crack = 1; S.pose = 1;
  thorns[1].gone = true;
  unlock(PRE_CHORDS);
  hideChapter1Paintings();
  if (passed('c2frozen')) { S.boat = FROZEN_STOP; S.frozen = true; S.frozenVis = S.frozenVisT = 1; }
  if (passed('c2echo')) { OBJ.filter((o: WorldObj) => o.kind === 'column').forEach(o => { o.hidden = false; o.gone = true; o.play = 1; }); S.boat = P_MEET; }
  if (passed('c2umbrella')) { const p = obj('pMeet'); p.hidden = false; p.play = 1; S.pieces = 4; }
  if (passed('c2guard')) { S.frozen = false; S.boat = P_MEET + 1.1; }
}
