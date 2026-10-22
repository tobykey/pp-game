// 자연스러운 불규칙함(노이즈): 한지의 얼룩, 산 능선, 붓 자국의 거친 결에 쓴다
// 같은 seed면 늘 같은 모양 (화면 크기가 바뀌어도 그림이 덜컥 바뀌지 않게)

/** seed로 고정된 0~1 난수 생성기 */
export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** 정수 격자점의 해시 → 0~1 */
function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const fade = (t: number) => t * t * (3 - 2 * t);

/** 부드러운 값 노이즈 (0~1). period를 주면 x 방향으로 그 길이마다 이어 붙는다 */
export function noise2(x: number, y: number, seed = 0, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const px = (v: number) => (period ? ((v % period) + period) % period : v);
  const a = hash(px(xi), yi, seed), b = hash(px(xi + 1), yi, seed), c = hash(px(xi), yi + 1, seed), d = hash(px(xi + 1), yi + 1, seed);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 여러 크기의 노이즈를 겹친 것 (0~1): 큰 굴곡 + 잔결 */
export function fbm(x: number, y: number, seed = 0, oct = 4, period = 0) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f, seed + i * 17, period ? period * f : 0); n += a; a *= 0.5; f *= 2; }
  return s / n;
}
