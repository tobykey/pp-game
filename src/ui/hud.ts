// 캔버스 위에 떠 있는 HTML 화면 요소: 목표 문구, 코드 칩(운지표), 음색 버튼, 배너, 붓글씨 안내
import { CHIP_ORDER, CHORDS, type ChordId } from '../data/chords';
import { MODES, type ModeId } from '../data/modes';
import { S } from '../world/state';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const chipsEl = $('#chips');

export interface HudHandlers {
  onChip(chord: ChordId): void;
  onMode(mode: ModeId): void;
  onReset(): void;
}

export function initHud(h: HudHandlers) {
  chipsEl.innerHTML = CHIP_ORDER.map(k => {
    if (k === '|') return '<span class="sep"></span>';
    const c = CHORDS[k];
    return `<button class="chip${c.oos ? ' oos' : ''}" data-ch="${k}" hidden aria-label="${c.label} 코드: ${c.keys.join(' ')}">`
      + `<b>${c.label}</b><span class="keys">${c.keys.map(x => `<kbd data-k="${x}">${x}</kbd>`).join('')}</span></button>`;
  }).join('');
  chipsEl.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (b) h.onChip(b.dataset.ch as ChordId);
  });
  document.querySelectorAll<HTMLElement>('.modes button').forEach(b => b.addEventListener('click', () => h.onMode(b.dataset.mode as ModeId)));
  $('#reset').addEventListener('click', h.onReset);
}

/** 운지표에 코드 칩을 연다 */
export function unlock(chords: ChordId[]) {
  chords.forEach(c => S.unlocked.add(c));
  updateChips();
}

/** 운지표에서 지금 쳐야 할 코드 칩을 깜빡이게 한다 */
let cueChord: ChordId | null = null;

/**
 * 꼭 해야 할 것을 화면에 크게 띄운다. kind 'rock'은 클라이맥스(형광), 'soft'는 차분한 안내.
 * chord를 주면 그 코드의 키를 함께 보여 주고 운지표의 칩도 깜빡인다
 */
export function cue(txt: string | null, kind: 'soft' | 'rock' = 'soft', chord: ChordId | null = null) {
  const el = $('#cue');
  cueChord = txt ? chord : null;
  if (!txt) { el.classList.remove('show'); updateChips(); return; }
  const keys = chord ? CHORDS[chord].keys.join(' · ') : '';
  el.innerHTML = `<b>${txt}</b>${keys ? `<small>${keys}</small>` : ''}`;
  el.className = 'cue ' + kind;
  void el.offsetWidth;
  el.classList.add('show');
  updateChips();
}

export function updateChips() {
  chipsEl.querySelectorAll<HTMLElement>('.chip').forEach(b => {
    const ch = b.dataset.ch as ChordId;
    b.hidden = !S.unlocked.has(ch) && S.forced !== ch;
    b.classList.toggle('cued', ch === cueChord);
    b.classList.toggle('active', ch === S.chord);
    b.classList.toggle('sticky', ch === S.sticky);
  });
  // 구분선은 양쪽에 보이는 칩이 있을 때만
  const sep = chipsEl.querySelector<HTMLElement>('.sep');
  if (sep) {
    const vis = (el: Element | null, dir: 'previousElementSibling' | 'nextElementSibling') => {
      for (let e = el?.[dir]; e; e = e[dir]) if (!(e as HTMLElement).hidden) return true;
      return false;
    };
    sep.hidden = !(vis(sep, 'previousElementSibling') && vis(sep, 'nextElementSibling'));
  }
  chipsEl.querySelectorAll<HTMLElement>('kbd').forEach(k => k.classList.toggle('on', S.held.has(k.dataset.k!)));
}

export function setMode(m: ModeId) {
  S.mode = m;
  document.querySelectorAll<HTMLElement>('.modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  document.documentElement.style.setProperty('--accent', MODES[m].accent);
}

export function setObjective(txt: string) { $('#objText').textContent = txt; }
export function setProgress(txt: string) { $('#found').textContent = txt; }

let bt: ReturnType<typeof setTimeout> | undefined;
export function banner(txt: string, kind: 'soft' | 'rock', ms: number) {
  const b = $('#banner');
  b.textContent = txt;
  b.className = 'banner ' + kind;
  void b.offsetWidth; // 애니메이션을 처음부터 다시 시작하게 하는 트릭
  b.classList.add('show');
  clearTimeout(bt);
  bt = setTimeout(() => b.classList.remove('show'), ms);
}

/**
 * 물 위에 번지듯 떠오르는 붓글씨 안내. null이면 지운다.
 * 이 게임의 모든 안내 문구는 같은 손글씨다 (복선 2: 그 사람의 글씨)
 */
let inkSwap: ReturnType<typeof setTimeout> | undefined;
export function ink(txt: string | null) {
  const el = $('#ink');
  clearTimeout(inkSwap);
  if (el.classList.contains('show')) {
    el.classList.remove('show');
    if (txt) inkSwap = setTimeout(() => { el.textContent = txt; el.classList.add('show'); }, 450);
  } else if (txt) {
    el.textContent = txt;
    void el.offsetWidth;
    el.classList.add('show');
  }
}
