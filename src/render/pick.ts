// 6현을 긁는 피크 = 마우스 커서.
// 복선(잠정, docs/design.md 4장): 먹빛 피크에 조표의 ♭ 획이 새겨져 있고, 그 사람의 핫핑크 점이 찍혀 있다.
// 1회차엔 그냥 예쁜 커서. 진실은 그 사람이 내게서 처음 뽑아낸 가시를 갈아 만든 피크 — 아픔을 소리로 바꾸는 도구
const SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
<g transform='rotate(-25 16 16)'>
<path d='M16 30 C9 22 3 14 4 8 C5 3 11 2 16 2 C21 2 27 3 28 8 C29 14 23 22 16 30 Z' fill='#17140f' stroke='#eae6de' stroke-width='1.2'/>
<path d='M13 7 L13 20 M13 14.5 C17 12.5 19.5 15.5 17.5 18 C16.5 19.2 14.5 20 13 20' fill='none' stroke='#eae6de' stroke-width='1.3' stroke-linecap='round' opacity='.6'/>
<circle cx='21.5' cy='8' r='1.9' fill='#ff2a7f'/>
</g></svg>`;

/** 피크 끝(커서가 가리키는 점)은 회전한 피크의 뾰족한 끝 */
export const PICK_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(SVG)}") 22 28, crosshair`;
