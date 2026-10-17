// 심장 박동, 드럼, 베이스를 Web Audio로 합성한다. 모든 함수는 시각 t(오디오 시계)에 맞춰 소리를 예약한다
import { audioOut } from './engine';

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (noiseBuf) return noiseBuf;
  const len = ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf = b;
}

/** 아래로 떨어지는 사인파 한 번 (심장·킥의 몸통) */
function thump(t: number, f0: number, f1: number, dur: number, peak: number, pan = 0) {
  const o = audioOut(); if (!o) return;
  const { ac, out } = o;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  if (pan) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(out); } else g.connect(out);
  osc.start(t); osc.stop(t + dur + 0.02);
}

function hiss(t: number, type: BiquadFilterType, f: number, dur: number, peak: number, q = 0.8) {
  const o = audioOut(); if (!o) return;
  const { ac, out } = o;
  const s = ac.createBufferSource(), bq = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noise(ac); bq.type = type; bq.frequency.value = f; bq.Q.value = q;
  g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bq); bq.connect(g); g.connect(out);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

/** 쿵-쿵. 내 심장 */
export function heart(t: number) {
  thump(t, 62, 40, 0.2, 0.9);
  thump(t + 0.17, 55, 38, 0.16, 0.5);
}

/** 조금 어긋난 곳에서 아주 희미하게 뛰는 두 번째 심장 (뱃머리 쪽, 오른쪽에서) */
export function heartFar(t: number) {
  thump(t, 58, 38, 0.18, 0.09, 0.55);
  thump(t + 0.16, 52, 36, 0.14, 0.05, 0.55);
}

export function kick(t: number, v = 1) { thump(t, 150, 45, 0.32, 0.95 * v); hiss(t, 'highpass', 3000, 0.012, 0.15 * v); }
export function snare(t: number, v = 1) { hiss(t, 'bandpass', 1900, 0.18, 0.5 * v, 0.7); thump(t, 220, 160, 0.08, 0.3 * v); }
export function hat(t: number, v = 1, open = false) { hiss(t, 'highpass', 7500, open ? 0.22 : 0.035, 0.18 * v); }
export function crash(t: number, v = 1) { hiss(t, 'highpass', 4500, 1.4, 0.22 * v, 0.5); }

/** 베이스 한 음 (8분음표 길이) */
export function bass(t: number, midi: number, dur: number, v = 1) {
  const o = audioOut(); if (!o) return;
  const { ac, out } = o;
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const osc = ac.createOscillator(), sub = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f;
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + dur); lp.Q.value = 2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
  osc.connect(lp); sub.connect(lp); lp.connect(g); g.connect(out);
  osc.start(t); sub.start(t); osc.stop(t + dur); sub.stop(t + dur);
}
