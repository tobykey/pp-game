// 원곡 반주(MR): 챕터마다 클라이맥스에서만 원곡 구간을 튼다 (Toby 결정 2026-10-22, (나)안)
// MR을 틀면 게임의 박 시계를 MR에 맞춘다. 합성 드럼·베이스는 쉬고, 플레이어의 기타만 원곡 위에 얹는다
// MR 파일이 없거나 못 불러오면 false를 돌려주고, 장면은 지금까지의 합성음으로 그대로 간다
import { acAt, audioOut, mrVolume, onMrVolume } from './engine';

/** MR 분석값 (2026-10-22): 템포와, 게임이 쓰는 구간의 첫 박이 MR에서 몇 초인지 (베이스 근음으로 맞춤) */
export const MR_BPM = 130.798;
export const MR_SECTIONS = {
  chorus1: 20.795,
  interlude: 50.153,
  chorus2: 108.870,
  riffRap: 153.366,
  chorus3: 182.724,
  coda: 209.789,
} as const;
export type MrSection = keyof typeof MR_SECTIONS;
const BAR = 4 * 60 / MR_BPM;
/** MR 원음이 합성 기타보다 훨씬 커서, 설정 100%일 때의 크기 (Toby: MR이 너무 크다 → 낮춤) */
const LEVEL = 0.55;
// 메뉴에서 원곡 음량을 바꾸면 지금 나오는 MR에도 바로
onMrVolume(v => { const o = audioOut(); if (!o) return; for (const p of playing) p.gain.gain.setTargetAtTime(LEVEL * v, o.ac.currentTime, 0.05); });

let buffer: AudioBuffer | null = null, loading: Promise<void> | null = null;
let playing: { src: AudioBufferSourceNode; gain: GainNode }[] = [];

/** 시작할 때 한 번 (소리가 켜진 뒤) */
export function loadMR(): Promise<void> {
  const o = audioOut();
  if (!o) return Promise.resolve();
  if (loading) return loading;
  loading = fetch('/audio/pianissimo-mr.mp3')
    .then(r => { if (!r.ok) throw new Error('no MR'); return r.arrayBuffer(); })
    .then(b => o.ac.decodeAudioData(b))
    .then(b => { buffer = b; })
    .catch(() => { buffer = null; });
  return loading;
}
export const mrReady = () => buffer !== null;

/**
 * 구간들을 이어서 튼다. segs: [구간, 마디 수(생략하면 끝까지)]
 * 돌려주는 값: 첫 박이 울리는 시각(performance.now 기준 초). 박 시계를 여기에 맞춘다. MR이 없으면 null
 */
export function playMR(segs: [MrSection, number?][], lead = 0.12): number | null {
  const o = audioOut();
  if (!o || !buffer) return null;
  stopMR(0.05);
  // 게임 시계의 t0Perf에 첫 박이 울리도록, 드럼과 같은 시계 변환으로 오디오 시각을 정한다
  const t0Perf = performance.now() / 1000 + lead, t0 = acAt(t0Perf);
  let at = t0;
  for (const [sec, bars] of segs) {
    const src = o.ac.createBufferSource(), g = o.ac.createGain();
    src.buffer = buffer; g.gain.value = LEVEL * mrVolume();
    src.connect(g); g.connect(o.out);
    const dur = bars ? bars * BAR : undefined;
    src.start(at, MR_SECTIONS[sec], dur);
    // 이어 붙이는 구간끼리 끊김이 들리지 않게 끝을 아주 짧게 줄인다
    if (dur) { g.gain.setValueAtTime(LEVEL * mrVolume(), at + dur - 0.02); g.gain.linearRampToValueAtTime(0, at + dur); }
    playing.push({ src, gain: g });
    if (dur) at += dur;
  }
  return t0Perf;
}

/** 지금 나는 MR을 서서히 끈다 */
export function stopMR(fade = 0.6) {
  const o = audioOut();
  if (!o) { playing = []; return; }
  const t = o.ac.currentTime;
  for (const p of playing) {
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + fade);
    try { p.src.stop(t + fade + 0.05); } catch { /* 이미 멈춤 */ }
  }
  playing = [];
}

/** 코다처럼 끝까지 틀 때, 곡이 끝나기까지 남은 시간(초) */
export const mrTail = (sec: MrSection) => (buffer ? buffer.duration - MR_SECTIONS[sec] : 0);
