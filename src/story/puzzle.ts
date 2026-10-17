// 챕터 0 퍼즐 진행: 등불을 곡의 순서대로 울리면 가시가 빠지고, 넷을 다 켜면 돛이 펴진다
import { CHORDS } from '../data/chords';
import { MODES } from '../data/modes';
import { SEQ, TEXT, THORN_OF } from '../data/chapter0';
import { playNote } from '../audio/engine';
import { splash } from '../render/effects';
import { INK, VOLT, reduceMotion } from '../render/palette';
import { banner, updateHud } from '../ui/hud';
import { OBJ, S, fx, obj, str, thorns, view } from '../world/state';
import { boatY, pos } from '../world/geometry';
import { rand } from '../util/math';

/** 한 번의 스트럼(줄 3개 이상)이 끝났을 때 지금 코드로 판정 */
export function evaluateStrum() {
  if (S.finale) return;
  const ch = S.chord;
  if (!SEQ.includes(ch)) return;
  const o = obj(ch);
  if (ch === SEQ[S.progress]) {
    if (!o.found) { o.res = 1; banner(TEXT.lampTremble, 'soft', 1700); return; }
    o.lit = true; S.progress++; pullThorn(THORN_OF[ch]!);
    const p = pos(o);
    splash(p.x, p.y - 20, 24, 0.8);
    S.flash = Math.max(S.flash, reduceMotion ? 0.1 : 0.28); S.flashCol = MODES[S.mode].accent;
    if (S.progress === 4) startFinale(); else banner(TEXT.lampLit(CHORDS[ch].label, S.progress), 'soft', 1500);
    updateHud();
  } else if (!o.lit) {
    o.res = 1;
    if (S.progress > 0) { resetProgress(); banner(TEXT.orderBroken, 'soft', 1600); }
  }
}

function pullThorn(i: number) {
  const th = thorns[i];
  if (th.gone) return;
  th.gone = true;
  th.fly = { t: S.t, vx: rand(-60, 60), vy: -rand(140, 220), rot: rand(-4, 4) };
}

function resetProgress() {
  S.progress = 0;
  SEQ.forEach(c => obj(c).lit = false);
  thorns.forEach(t => { t.gone = false; t.fly = null; });
  updateHud();
}

function startFinale() {
  const { W, H } = view;
  S.finale = S.t; S.sailT = 1;
  S.flash = reduceMotion ? 0.4 : 1; S.flashCol = MODES[S.mode].accent; S.shake = reduceMotion ? 0 : 26;
  splash(W / 2, boatY(), 150, 1.25);
  for (let j = 0; j < 26; j++) {
    fx.lines.push({ x: W / 2, y: boatY() - 40, a: rand(-Math.PI, Math.PI), l: rand(120, Math.max(W, H) * 0.6), life: 1.4, c: j % 3 ? VOLT : INK });
  }
  // F 코드를 한 번 더 크게 긁어 준다
  CHORDS.F.v.forEach((m, i) => setTimeout(() => { playNote(m, 1); str[i].amp = 15; str[i].hot = 1; }, i * 22));
  setTimeout(() => banner(TEXT.sailOpened, 'rock', 3400), 120);
  updateHud();
}

/** '처음부터' 버튼 */
export function restart() {
  S.finale = null; S.sailT = 0;
  resetProgress();
  OBJ.forEach(o => { o.vis = 0; o.detail = 0; o.found = false; o.res = 0; });
  updateHud();
  banner(TEXT.restart, 'soft', 1400);
}
