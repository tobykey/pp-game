// 마우스 커서. 평소에는 붓끝, 줄을 누르고 긁는 동안에만 피크.
// 복선(잠정, docs/design.md 4장)
// - 피크: 먹빛 피크에 조표의 ♭ 획이 새겨져 있고, 그 사람의 핫핑크 점이 찍혀 있다.
//   1회차엔 그냥 예쁜 커서. 진실은 그 사람이 내게서 처음 뽑아낸 가시를 갈아 만든 피크 — 아픔을 소리로 바꾸는 도구
// - 붓끝: 안내 문구와 같은 붓 (복선 2: 모든 안내는 그 사람의 손글씨)
const svgCursor = (svg: string, x: number, y: number, fallback: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`;

const PICK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
<g transform='rotate(-25 16 16)'>
<path d='M16 30 C9 22 3 14 4 8 C5 3 11 2 16 2 C21 2 27 3 28 8 C29 14 23 22 16 30 Z' fill='#17140f' stroke='#eae6de' stroke-width='1.2'/>
<path d='M13 7 L13 20 M13 14.5 C17 12.5 19.5 15.5 17.5 18 C16.5 19.2 14.5 20 13 20' fill='none' stroke='#eae6de' stroke-width='1.3' stroke-linecap='round' opacity='.6'/>
<circle cx='21.5' cy='8' r='1.9' fill='#ff2a7f'/>
</g></svg>`;

const BRUSH_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
<path d='M28.5 3.5 L15 17' stroke='#eae6de' stroke-width='5.5' stroke-linecap='round'/>
<path d='M28.5 3.5 L15 17' stroke='#5d564c' stroke-width='3.2' stroke-linecap='round'/>
<path d='M17.6 13.4 C13.5 14 9.5 18 6.8 22.8 C5.4 25.4 3.8 28.2 3 29 C4.6 28.3 7.8 26.6 10.8 24.4 C14.6 21.6 17.8 18.6 18.6 15.4 Z' fill='#17140f' stroke='#eae6de' stroke-width='1'/>
<path d='M18.4 12.6 L16 15' stroke='#17140f' stroke-width='4.6' stroke-linecap='round'/>
</svg>`;

/** 피크 끝(커서가 가리키는 점)은 회전한 피크의 뾰족한 끝 */
export const PICK_CURSOR = svgCursor(PICK_SVG, 22, 28, 'crosshair');
/** 붓끝이 가리키는 점 */
export const BRUSH_CURSOR = svgCursor(BRUSH_SVG, 3, 29, 'default');
