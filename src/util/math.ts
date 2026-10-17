export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 같은 seed면 항상 같은 수열을 내는 난수 (섬 모양처럼 매번 똑같아야 하는 것에 사용) */
export const seeded = (s: number) => () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};
