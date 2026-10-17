// 캔버스 위에 떠 있는 HTML 화면 요소: 목표 문구, 코드 칩(운지표), 음색 버튼, 배너
import { CHIP_ORDER, CHORDS, type ChordId } from '../data/chords';
import { MODES, type ModeId } from '../data/modes';
import { SEQ, TEXT } from '../data/chapter0';
import { S, obj } from '../world/state';

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
    return `<button class="chip${c.oos ? ' oos' : ''}" data-ch="${k}" aria-label="${c.label} 코드: ${c.keys.join(' ')}">`
      + `<b>${c.label}</b><span class="keys">${c.keys.map(x => `<kbd data-k="${x}">${x}</kbd>`).join('')}</span></button>`;
  }).join('');
  chipsEl.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (b) h.onChip(b.dataset.ch as ChordId);
  });
  document.querySelectorAll<HTMLElement>('.modes button').forEach(b => b.addEventListener('click', () => h.onMode(b.dataset.mode as ModeId)));
  $('#reset').addEventListener('click', h.onReset);
}

export function updateChips() {
  chipsEl.querySelectorAll<HTMLElement>('.chip').forEach(b => {
    b.classList.toggle('active', b.dataset.ch === S.chord);
    b.classList.toggle('sticky', b.dataset.ch === S.sticky);
  });
  chipsEl.querySelectorAll<HTMLElement>('kbd').forEach(k => k.classList.toggle('on', S.held.has(k.dataset.k!)));
}

export function setMode(m: ModeId) {
  S.mode = m;
  document.querySelectorAll<HTMLElement>('.modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  document.documentElement.style.setProperty('--accent', MODES[m].accent);
}

export function updateHud() {
  const f = SEQ.filter(c => obj(c).found).length;
  $('#found').textContent = TEXT.progress(f, S.progress);
  $('#objText').textContent = S.finale ? TEXT.objectiveDone : TEXT.objective;
}

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
