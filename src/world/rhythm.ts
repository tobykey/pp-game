// 박 시계와 그루브(박마다 울리는 심장·드럼·베이스)
// 박은 화면 프레임이 아니라 실제 시간(performance.now)으로 잰다. 그래야 입력 판정이 정확하다
import { ROOT, type ChordId } from '../data/chords';
import { audioOut } from '../audio/engine';
import { bass, crash, hat, heart, heartFar, kick, snare } from '../audio/kit';
import { S, type Groove } from './state';

export const now = () => performance.now() / 1000;
export const spb = () => 60 / S.bpm;

/** 템포·그루브 변경. 새 템포의 0번 박은 지금 템포의 다음 박에 맞춘다 (박이 끊기지 않게) */
export function setTempo(bpm: number, groove: Groove) {
  const t = now();
  if (!S.clock0) S.clock0 = t + 0.05;
  else if (bpm !== S.bpm) {
    const k = Math.ceil((t - S.clock0) / spb());
    S.clock0 = S.clock0 + k * spb();
  }
  S.bpm = bpm;
  S.groove = groove;
  // 그루브는 '지금 다음에 오는 첫 박'부터 센다 (박 바로 위에서 바뀌어도 첫 마디를 건너뛰지 않게)
  groove0 = Math.max(0, Math.floor((t - S.clock0) / spb()) + 1);
  lastStep = Math.floor((t - S.clock0) / (spb() / 4));
  lastBeat = Math.floor((t - S.clock0) / spb());
}

/** 지금이 몇 번째 박인지 (소수) */
export const beatPos = (t = now()) => (t - S.clock0) / spb();

/** 소리가 스피커·헤드폰에서 실제로 나오기까지 걸리는 시간. 사람은 들은 소리에 맞춰 치므로 판정에서 뺀다 */
function latency() {
  const o = audioOut();
  if (!o) return 0;
  return Math.min(0.15, (o.ac.outputLatency || 0) + (o.ac.baseLatency || 0));
}

/** 가장 가까운 박과 그 박에서 몇 초 벗어났는지 (출력 지연 보정) */
export function nearestBeat(t = now()) {
  const b = beatPos(t - latency() - S.offset), n = Math.round(b);
  return { n, off: (b - n) * spb() };
}

let lastStep = -1, lastBeat = -1;
/** 지금 그루브가 시작된 박 (마디 세기의 기준) */
let groove0 = 0;
/** 장면이 정하는 '마디 → 코드' (후렴 예고에서 베이스가 따라감) */
let barChord: ((bar: number) => ChordId | null) | null = null;
export function setBarChord(fn: typeof barChord) { barChord = fn; }
/** 그루브 시작 후 몇 번째 박인지 */
export const grooveBeat = (b: number) => b - groove0;

/**
 * 매 프레임 호출. 16분음표 단위로 조금 앞을 내다보며 소리를 예약하고,
 * 새 박이 시작되면 그 박 번호를 돌려준다 (없으면 null)
 */
export function tickRhythm(): number | null {
  const t = now();
  const o = audioOut();
  const step = spb() / 4, look = 0.1;
  const until = Math.floor((t + look - S.clock0) / step);
  for (let i = lastStep + 1; i <= until; i++) {
    if (i < 0) continue;
    const when = S.clock0 + i * step;
    if (o) playStep(i, Math.max(o.ac.currentTime, o.ac.currentTime + (when - t)), step);
  }
  lastStep = Math.max(lastStep, until);
  const b = Math.floor((t - S.clock0) / spb());
  if (b > lastBeat && b >= 0) { lastBeat = b; return b; }
  return null;
}

/** i번째 16분음표에 울릴 소리 */
function playStep(i: number, at: number, step: number) {
  const beat = (i >> 2) - groove0, sub = i & 3, bar = Math.floor(beat / 4), inBar = ((beat % 4) + 4) % 4;
  if (beat < 0) return;
  switch (S.groove) {
    case 'heart':
      if (sub === 0) { heart(at); heartFar(at + 0.29); }
      break;
    case 'hook':
      // 악보의 훅: 킥 4분음표 + 16분 하이햇, 스네어 없음
      if (sub === 0) kick(at, 0.8);
      hat(at, sub === 0 ? 0.7 : 0.4);
      break;
    case 'verse': {
      // 1절: 기타 없이 드럼과 베이스만. 8분 하이햇, 스네어 2·4박, 엇박 킥, 낮은 음역 베이스
      if (sub % 2 === 0) hat(at, sub === 0 ? 0.7 : 0.45, sub === 2 && inBar === 3);
      if (sub === 0 && inBar === 0) kick(at);
      if (sub === 2 && (inBar === 1 || inBar === 2)) kick(at, 0.75);
      if (sub === 0 && (inBar === 1 || inBar === 3)) snare(at, 0.85);
      if (sub % 2 === 0) { const c = barChord?.(bar) ?? S.chord; bass(at, c === 'Fm' ? 29 : ROOT[c], step * 2, 1.1); }
      break;
    }
    case 'chorus': {
      // 후렴: 8분 하이햇, 스네어 2·4박, 킥 1·3박(+엇박 하나), 프레이즈 첫 마디 크래시, 베이스 8분음표 근음
      if (sub % 2 === 0) hat(at, sub === 0 ? 0.9 : 0.6, sub === 2 && inBar === 3);
      if (sub === 0 && (inBar === 0 || inBar === 2)) kick(at);
      if (sub === 2 && inBar === 2) kick(at, 0.7);
      if (sub === 0 && (inBar === 1 || inBar === 3)) snare(at);
      if (sub === 0 && inBar === 0 && bar % 4 === 0) crash(at);
      if (sub % 2 === 0) bass(at, ROOT[barChord?.(bar) ?? S.forced ?? S.chord], step * 2);
      break;
    }
  }
}
