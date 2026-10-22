// 시작점: 모듈을 연결하고 게임 루프를 돌린다
import './style.css';
import { initAudio } from './audio/engine';
import { loadMR, mrReady } from './audio/mr';
import { STEPS, STEP_NAMES, type StepId } from './data/steps';
import { bindKeyboard } from './input/keyboard';
import { bindPointer, tickPointer } from './input/pointer';
import { resolveChord, toggleSticky } from './input/chord';
import { cv, resize } from './render/canvas';
import { draw } from './render/draw';
import { BRUSH_CURSOR } from './render/pick';
import { fastForward0 } from './story/chapter0';
import { fastForward1 } from './story/chapter1';
import { fastForward2 } from './story/chapter2';
import { fastForward3 } from './story/chapter3';
import { fastForward4 } from './story/chapter4';
import { fastForward5 } from './story/chapter5';
import { fastForward6 } from './story/chapter6';
import { clearSeen, loadSeen } from './world/memory';
import { guardWaves } from './render/chapter2Art';
import { counterWaves } from './render/chapter3Art';
import { tickCut } from './render/cutscene';
import { test5 } from './render/chapter5Art';
import { profReport, profReset } from './render/prof';
import { go, lastStroke, loadSaved } from './story/director';
import { initHud, setMode, updateChips } from './ui/hud';
import { initMenu } from './ui/menu';
import { nearestBeat, setTempo } from './world/rhythm';
import { OBJ, S, thorns } from './world/state';
import { update } from './world/update';
import { tickTimers } from './world/timers';

initHud({ onChip: toggleSticky, onMode: setMode, onReset: () => { location.href = location.pathname; } });
bindPointer(cv);
bindKeyboard();
initMenu();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); // 탭을 오래 비워도 한 프레임이 너무 크게 튀지 않게
  last = now;
  // 메뉴가 열려 있으면 세상이 멈춘다 (그림은 그대로)
  // 슬로모션이면 세상이 느리게 흐른다 (박 시계와 입력은 실제 시간 그대로)
  if (!S.paused) { update(dt * S.timeScale); tickPointer(dt); tickCut(dt); tickTimers(dt); }
  S.slowmo += (S.slowmoT - S.slowmo) * Math.min(1, dt * 3);
  draw();
  requestAnimationFrame(frame);
}
addEventListener('resize', resize);
// 제목 화면 뒤로는 줄 없이 바다와 산만 (시작하면 장면이 줄을 다시 띄운다)
S.stringsVis = 0;
resize(); updateChips(); requestAnimationFrame(frame);
document.fonts?.load(`30px "Nanum Brush Script"`).catch(() => {});

// 시작 화면: 처음부터 / 이어서 / 장면 바로 가기
const jump = document.querySelector<HTMLSelectElement>('#jump')!;
for (const s of STEPS.slice(1)) jump.insertAdjacentHTML('beforeend', `<option value="${s.id}">${STEP_NAMES[s.id]}</option>`);
const urlStep = new URLSearchParams(location.search).get('step') as StepId | null;
if (urlStep && STEPS.some(s => s.id === urlStep)) jump.value = urlStep;
const saved = loadSaved();
const cont = document.querySelector<HTMLButtonElement>('#cont')!;
if (saved && saved !== 'wake') { cont.hidden = false; cont.textContent = `이어서 · ${STEP_NAMES[saved]}`; }

async function start(step: StepId) {
  try { initAudio(); } catch { /* 소리가 안 나도 화면은 계속 */ }
  // 원곡 반주를 미리 불러 둔다 (3초 안에 안 되면 합성음으로 시작하고, 다 불러지면 그다음 클라이맥스부터 원곡)
  await Promise.race([loadMR(), new Promise(r => setTimeout(r, 3000))]);
  S.started = true;
  cv.style.cursor = BRUSH_CURSOR;
  document.querySelector<HTMLElement>('#start')!.hidden = true;
  setTempo(65, 'heart');
  // 처음부터 하면 둘러본 기록도 새로, 중간부터면 저장된 기록을 되살린다 (챕터 5 기억 테스트)
  if (step === 'wake') clearSeen(); else loadSeen();
  // 확인용: 주소에 ?seen 을 붙이면 모든 기억 그림의 액자 밖을 둘러본 것으로 (기억 테스트의 또렷한 쪽을 바로 볼 수 있게)
  if (new URLSearchParams(location.search).has('seen')) OBJ.filter(o => o.kind === 'painting').forEach(o => { o.seen = true; });
  fastForward0(step);
  fastForward1(step);
  fastForward2(step);
  fastForward3(step);
  fastForward4(step);
  fastForward5(step);
  fastForward6(step);
  resolveChord();
  go(step);
}
document.querySelector('#go')!.addEventListener('click', () => start((jump.value || 'wake') as StepId));
cont.addEventListener('click', () => start(saved!));

// 자동 테스트용 (개발 서버에서만)
if (import.meta.env.DEV) Object.assign(window, { __pp: { S, nearestBeat, go, OBJ, thorns, guardWaves, counterWaves, test5, profReport, profReset, lastStroke, mrReady } });
