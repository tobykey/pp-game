export const INK = '#17140f';
export const INK_SOFT = '#5d564c';
export const PAPER = '#eae6de';
export const VOLT = '#ffe23d';

export const BRUSH = '"Nanum Brush Script","Gowun Batang",serif';
export const MONO = '"IBM Plex Mono",monospace';

/** 흔들림·섬광 줄이기. 운영체제의 '동작 줄이기'가 기본값이고, 메뉴에서 바꿀 수 있다 */
export let reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function setReduceMotion(v: boolean) { reduceMotion = v; }
