// 시작점: 모듈을 연결하고 게임 루프를 돌린다
import './style.css';
import { initAudio } from './audio/engine';
import { TEXT } from './data/chapter0';
import { bindKeyboard } from './input/keyboard';
import { bindPointer } from './input/pointer';
import { toggleSticky } from './input/chord';
import { cv, resize } from './render/canvas';
import { draw } from './render/draw';
import { restart } from './story/puzzle';
import { banner, initHud, setMode, updateChips, updateHud } from './ui/hud';
import { S } from './world/state';
import { update } from './world/update';

initHud({ onChip: toggleSticky, onMode: setMode, onReset: restart });
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
resize(); updateChips(); updateHud(); requestAnimationFrame(frame);
document.fonts?.load(`30px "Nanum Brush Script"`).catch(() => {});

document.querySelector('#go')!.addEventListener('click', () => {
  try { initAudio(); } catch { /* 소리가 안 나도 화면은 계속 */ }
  S.started = true;
  document.querySelector<HTMLElement>('#start')!.hidden = true;
  setTimeout(() => banner(TEXT.firstHint, 'soft', 2000), 300);
});
