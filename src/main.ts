// 시작점: 모듈을 연결하고 게임 루프를 돌린다
import './style.css';
import { initAudio, setGuitarVolume } from './audio/engine';
import { STEPS, STEP_NAMES, type StepId } from './data/chapter0';
import { bindKeyboard } from './input/keyboard';
import { bindPointer } from './input/pointer';
import { resolveChord, toggleSticky } from './input/chord';
import { cv, resize } from './render/canvas';
import { draw } from './render/draw';
import { PICK_CURSOR } from './render/pick';
import { fastForward } from './story/chapter0';
import { go, loadSaved } from './story/director';
import { initHud, setMode, updateChips } from './ui/hud';
import { nearestBeat, setTempo } from './world/rhythm';
import { S } from './world/state';
import { update } from './world/update';

initHud({ onChip: toggleSticky, onMode: setMode, onReset: () => { location.href = location.pathname; } });
bindPointer(cv);
bindKeyboard();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); // 탭을 오래 비워도 한 프레임이 너무 크게 튀지 않게
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
addEventListener('resize', resize);
resize(); updateChips(); requestAnimationFrame(frame);
document.fonts?.load(`30px "Nanum Brush Script"`).catch(() => {});

// 6현 음량 게이지 (브라우저에 기억)
const vol = document.querySelector<HTMLInputElement>('#vol')!;
try { const v = localStorage.getItem('pp.guitarVol'); if (v != null) vol.value = v; } catch { /* 무시 */ }
const applyVol = () => {
  setGuitarVolume(+vol.value / 100);
  try { localStorage.setItem('pp.guitarVol', vol.value); } catch { /* 무시 */ }
};
vol.addEventListener('input', applyVol);
applyVol();

// 시작 화면: 처음부터 / 이어서 / 장면 바로 가기
const jump = document.querySelector<HTMLSelectElement>('#jump')!;
for (const s of STEPS.slice(1)) jump.insertAdjacentHTML('beforeend', `<option value="${s.id}">${STEP_NAMES[s.id]}</option>`);
const urlStep = new URLSearchParams(location.search).get('step') as StepId | null;
if (urlStep && STEPS.some(s => s.id === urlStep)) jump.value = urlStep;
const saved = loadSaved();
const cont = document.querySelector<HTMLButtonElement>('#cont')!;
if (saved && saved !== 'wake') { cont.hidden = false; cont.textContent = `이어서 · ${STEP_NAMES[saved]}`; }

function start(step: StepId) {
  try { initAudio(); } catch { /* 소리가 안 나도 화면은 계속 */ }
  S.started = true;
  cv.style.cursor = PICK_CURSOR;
  document.querySelector<HTMLElement>('#start')!.hidden = true;
  setTempo(65, 'heart');
  fastForward(step);
  resolveChord();
  go(step);
}
document.querySelector('#go')!.addEventListener('click', () => start((jump.value || 'wake') as StepId));
cont.addEventListener('click', () => start(saved!));

// 자동 테스트용 (개발 서버에서만)
if (import.meta.env.DEV) Object.assign(window, { __pp: { S, nearestBeat, go } });
