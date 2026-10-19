// Web Audio로 기타 음색을 합성한다. 편곡 모드마다 다른 신호 경로(체인)를 거친다
import type { ModeId } from '../data/modes';
import { S } from '../world/state';
import { lerp } from '../util/math';

let AC: AudioContext | null = null;
let bus: GainNode;
/** 드럼·베이스·심장 소리가 나가는 출력 (기타 음색 체인을 거치지 않음) */
let kitBus: GainNode;

/** 소리가 준비됐으면 오디오 컨텍스트와 드럼 출력을 돌려준다 */
export function audioOut() { return AC ? { ac: AC, out: kitBus } : null; }

/** 전체 음량 0~1 */
let masterVol = 0.85, masterGain: GainNode | null = null;
export function setMasterVolume(v: number) {
  masterVol = v;
  if (AC && masterGain) masterGain.gain.setTargetAtTime(v, AC.currentTime, 0.03);
}
/** 일시정지: 소리를 통째로 멈췄다가 이어 간다 */
export function suspendAudio() { AC?.suspend(); }
export function resumeAudio() { AC?.resume(); }

/** 6현(기타) 음량 0~1. 심장·드럼·베이스와 따로 조절한다 */
let guitarVol = 0.45;
export function setGuitarVolume(v: number) {
  guitarVol = v;
  if (AC && bus) bus.gain.setTargetAtTime(v, AC.currentTime, 0.03);
}
const chains = {} as Record<ModeId, GainNode>;
const ksCache: Record<string, { buf: AudioBuffer; rate: number }[]> = {};

/** 사용자가 클릭한 뒤에만 호출한다 (브라우저 자동재생 정책) */
export function initAudio() {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ac = AC = new Ctor();
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  const master = masterGain = ac.createGain(); master.gain.value = masterVol; comp.connect(master); master.connect(ac.destination);
  const rev = ac.createConvolver(); rev.buffer = impulse(ac, 3, 2.6);
  const rg = ac.createGain(); rg.gain.value = 0.3; rev.connect(rg); rg.connect(comp);
  bus = ac.createGain(); bus.gain.value = guitarVol; bus.connect(comp); bus.connect(rev);
  kitBus = ac.createGain(); kitBus.gain.value = 0.9; kitBus.connect(comp);
  { const g = ac.createGain(); g.gain.value = 0.12; kitBus.connect(g); g.connect(rev); }

  const send = (node: AudioNode, amt: number) => { const g = ac.createGain(); g.gain.value = amt; node.connect(g); g.connect(rev); };
  const bq = (type: BiquadFilterType, f: number, q = 0.7, gain = 0) => {
    const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain; return b;
  };
  const chain = (...n: AudioNode[]) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n; };

  // rock: drive into a tanh shaper, cab-ish filtering
  {
    const i = ac.createGain(), sh = ac.createWaveShaper(); sh.curve = curve(10); sh.oversample = '4x';
    const o = ac.createGain(); o.gain.value = 0.2;
    chain(i, bq('highpass', 95), sh, bq('peaking', 850, 1, 4), bq('lowpass', 4200, 0.9), o, bus); chains.rock = i;
  }
  {
    const i = ac.createGain(), o = ac.createGain(); o.gain.value = 0.95;
    chain(i, bq('peaking', 190, 1, 5), bq('highshelf', 3500, 0.7, 2), bq('lowpass', 8500), o, bus); chains.acoustic = i;
  }
  {
    const i = ac.createGain(), o = ac.createGain(); o.gain.value = 1;
    chain(i, bq('lowpass', 3400, 0.6), o, bus); send(o, 0.55); chains.strings = i;
  }
  {
    const i = ac.createGain(), o = ac.createGain(); o.gain.value = 1;
    chain(i, bq('peaking', 1200, 1.2, 3), bq('lowpass', 5200), o, bus); send(o, 0.45); chains.korean = i;
  }
  ac.resume?.();
}

function curve(k: number) {
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}

/** 리버브용 잔향 (감쇠하는 노이즈) */
function impulse(ac: AudioContext, sec: number, dec: number) {
  const len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec);
  }
  return b;
}

/** Karplus-Strong: 짧은 노이즈를 되먹여 현을 튕긴 소리를 만든다. 음마다 3개까지 만들어 번갈아 쓴다 */
function ks(ac: AudioContext, midi: number, mode: ModeId) {
  const key = mode + midi;
  const list = ksCache[key] || (ksCache[key] = []);
  if (list.length >= 3) return list[(Math.random() * 3) | 0];
  const sr = ac.sampleRate, f = 440 * Math.pow(2, (midi - 69) / 12), N = Math.max(2, Math.round(sr / f));
  const dur = ({ rock: 3.4, acoustic: 2.6, korean: 3 } as Partial<Record<ModeId, number>>)[mode] || 2.6;
  const damp = ({ rock: 0.9988, acoustic: 0.9962, korean: 0.9975 } as Partial<Record<ModeId, number>>)[mode] || 0.996;
  const len = Math.floor(sr * dur), buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
  let lp = 0;
  const sm = mode === 'acoustic' ? 0.55 : mode === 'korean' ? 0.05 : 0.25;
  for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; lp = lp * sm + n * (1 - sm); ring[i] = lp; }
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx], nx = ring[(idx + 1) % N];
    d[i] = cur; ring[idx] = damp * 0.5 * (cur + nx); idx = (idx + 1) % N;
  }
  const item = { buf, rate: f / (sr / (N + 0.5)) };
  list.push(item);
  return item;
}

/** midi가 null이면 뮤트된 줄의 '틱' 소리 */
export function playNote(midi: number | null, dyn: number) {
  if (!AC) return;
  const ac = AC, t = ac.currentTime, mode = S.mode, dest = chains[mode], mute = S.mute;

  if (midi == null) { // muted string: a dead click
    const len = ac.sampleRate * 0.035, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; g.gain.value = 0.08 + 0.25 * dyn; s.connect(g); g.connect(dest); s.start(t);
    return;
  }

  if (mode === 'strings') {
    const f = 440 * Math.pow(2, (midi - 69) / 12), g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700 + 2600 * dyn;
    const peak = 0.035 + 0.08 * dyn, atk = lerp(0.32, 0.05, dyn), rel = mute ? 0.35 : 2.6;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);
    [-8, 7, 0].forEach((dt, k) => {
      const o = ac.createOscillator(); o.type = k === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = k === 2 ? f / 2 : f; o.detune.value = dt;
      o.connect(lp); o.start(t); o.stop(t + atk + rel + 0.1);
    });
    lp.connect(g); g.connect(dest);
    return;
  }

  const k = ks(ac, midi, mode), s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = k.buf;
  const vel = mode === 'rock' ? 0.25 + 1.7 * Math.pow(dyn, 1.2) : 0.1 + 0.42 * Math.pow(dyn, 1.3);
  g.gain.setValueAtTime(vel, t);
  if (mute) g.gain.setTargetAtTime(0, t + 0.04, 0.05);
  if (mode === 'korean') { // nonghyeon: a pitch scoop then a slow vibrato
    s.playbackRate.setValueAtTime(k.rate * 1.04, t); s.playbackRate.exponentialRampToValueAtTime(k.rate, t + 0.14);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(k.rate * 0.014, t + 0.7);
    lfo.connect(lg); lg.connect(s.playbackRate); lfo.start(t); lfo.stop(t + 3.2);
  } else s.playbackRate.value = k.rate;
  s.connect(g); g.connect(dest); s.start(t);
}
