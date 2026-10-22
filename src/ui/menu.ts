// 일시정지 메뉴와 설정 (브라우저에 기억)
import { STEPS, STEP_NAMES } from '../data/steps';
import { resumeAudio, setGuitarVolume, setMasterVolume, setMrVolume, suspendAudio } from '../audio/engine';
import { setReduceMotion, reduceMotion } from '../render/palette';
import { now } from '../world/rhythm';
import { S } from '../world/state';
import { setHelpPinned } from './hud';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const KEY = 'pp.settings';

interface Settings { master: number; guitar: number; mr: number; offset: number; calm: boolean; help: boolean }
const settings: Settings = { master: 85, guitar: 45, mr: 50, offset: 0, calm: reduceMotion, help: false };

function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* 무시 */ } }
function load() {
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
    // 예전 버전의 6현 음량 기억값
    const g = localStorage.getItem('pp.guitarVol'); if (g != null && !localStorage.getItem(KEY)) settings.guitar = +g;
  } catch { /* 무시 */ }
}

/** 설정을 게임에 적용한다 */
function apply() {
  setMasterVolume(settings.master / 100);
  setGuitarVolume(settings.guitar / 100);
  setMrVolume(settings.mr / 100);
  S.offset = settings.offset / 1000;
  setReduceMotion(settings.calm);
  setHelpPinned(settings.help);
  $<HTMLInputElement>('#mvol').value = String(settings.master);
  $<HTMLInputElement>('#gvol').value = String(settings.guitar);
  $<HTMLInputElement>('#rvol').value = String(settings.mr);
  $<HTMLInputElement>('#vol').value = String(settings.guitar);
  $<HTMLInputElement>('#offset').value = String(settings.offset);
  $('#offsetOut').textContent = `${settings.offset > 0 ? '+' : ''}${settings.offset} ms`;
  $<HTMLInputElement>('#calm').checked = settings.calm;
  $<HTMLInputElement>('#showHelp').checked = settings.help;
}

let pausedAt = 0;
export function isMenuOpen() { return !$('#menu').hidden; }

/** 멈춤: 박 시계와 소리를 함께 멈췄다가, 멈춘 시간만큼 박을 미뤄서 이어 간다 */
export function openMenu() {
  if (!S.started || isMenuOpen()) return;
  S.paused = true; pausedAt = now();
  suspendAudio();
  $<HTMLSelectElement>('#menuJump').value = S.step;
  $('#menu').hidden = false;
  $<HTMLButtonElement>('#resume').focus();
}
export function closeMenu() {
  if (!isMenuOpen()) return;
  $('#menu').hidden = true;
  S.clock0 += now() - pausedAt;
  S.paused = false;
  resumeAudio();
}

export function initMenu() {
  load(); apply();
  const num = (id: string, key: 'master' | 'guitar' | 'mr' | 'offset') => $<HTMLInputElement>(id).addEventListener('input', e => {
    settings[key] = +(e.target as HTMLInputElement).value; apply(); save();
  });
  num('#mvol', 'master'); num('#gvol', 'guitar'); num('#rvol', 'mr'); num('#vol', 'guitar'); num('#offset', 'offset');
  $<HTMLInputElement>('#calm').addEventListener('change', e => { settings.calm = (e.target as HTMLInputElement).checked; apply(); save(); });
  $<HTMLInputElement>('#showHelp').addEventListener('change', e => { settings.help = (e.target as HTMLInputElement).checked; apply(); save(); });
  $('#menuBtn').addEventListener('click', () => (isMenuOpen() ? closeMenu() : openMenu()));
  $('#resume').addEventListener('click', closeMenu);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    isMenuOpen() ? closeMenu() : openMenu();
  });
  // 장면 고르기: 그 장면을 고른 채 시작 화면으로 (소리는 클릭해야 시작되므로)
  const sel = $<HTMLSelectElement>('#menuJump');
  sel.innerHTML = STEPS.map(s => `<option value="${s.id}">${STEP_NAMES[s.id]}</option>`).join('');
  sel.value = S.step;
  $('#menuGo').addEventListener('click', () => { location.href = `${location.pathname}?step=${sel.value}`; });
}
