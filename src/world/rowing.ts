// 노 젓기: 다운 스트로크 = 왼쪽 노, 업 스트로크 = 오른쪽 노. 박에 맞춰 번갈아 저으면 배가 나아간다
import { BEAT_WINDOW } from '../data/chapter0';
import { splash } from '../render/effects';
import { boatScale, boatX, boatY } from './geometry';
import { nearestBeat } from './rhythm';
import { S } from './state';

export type RowResult = 'perfect' | 'good' | 'sameOar' | 'miss';

/** 같은 박에 두 번 젓는 것 방지 */
let usedBeat = -999;

/** 스트로크 한 번을 노 젓기로 처리하고 결과를 돌려준다 */
export function row(dir: number, power = 1): RowResult {
  const { n, off } = nearestBeat();
  const a = Math.abs(off);
  const oarX = boatX() - 96 * boatScale();
  if (a > BEAT_WINDOW || n === usedBeat) {
    // 박을 놓침: 노가 물을 헛치고 배가 기우뚱
    S.vel *= 0.7;
    S.wobble += 0.06 * dir;
    splash(oarX, boatY() + 14, 3, 0.25);
    S.lastOar = dir;
    return 'miss';
  }
  usedBeat = n;
  const same = dir === S.lastOar;
  S.lastOar = dir;
  const q = a < 0.06 ? 1 : 0.7;
  // 같은 쪽 노만 저으면 배가 돌기만 하고 덜 나아간다
  S.vel += 0.085 * q * power * (same ? 0.3 : 1);
  // 같은 쪽 노는 배가 크게 기우뚱한다 (다운·업을 번갈아 저어야 곧게 간다)
  S.wobble += (same ? 0.13 : 0.015) * dir;
  splash(oarX, boatY() + (dir > 0 ? 18 : 8), same ? 4 : 7, q * 0.35);
  return same ? 'sameOar' : a < 0.06 ? 'perfect' : 'good';
}

/** 매 프레임: 물의 저항과 기우뚱함이 잦아든다 */
export function updateBoat(dt: number) {
  S.vel = S.cruise + (S.vel - S.cruise) * Math.exp(-dt * 0.9);
  S.vel = Math.min(S.vel, 0.32);
  S.boat += S.vel * dt;
  S.wobble = Math.max(-0.3, Math.min(0.3, S.wobble)) * Math.exp(-dt * 2.5);
}
