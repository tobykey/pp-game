// 매 프레임 상태를 갱신: 줄의 진동, 파동이 오브젝트를 비추는 판정, 배의 항해, 박, 입자, 연출 감쇠
import { TEXT } from '../data/chapter0';
import { scatterWhisper } from '../render/effects';
import { onBeat, updateStory } from '../story/director';
import { banner } from '../ui/hud';
import { OBJ, S, cloth, fx, str, view } from './state';
import { pos, toScreenX } from './geometry';
import { tickRhythm } from './rhythm';
import { updateBoat } from './rowing';

const ease = (v: number, target: number, rate: number, dt: number) => v + (target - v) * Math.min(1, dt * rate);

export function update(dt: number) {
  S.t += dt;

  // 박: 소리 예약 + 새 박이면 장면에 알림
  const b = tickRhythm();
  if (b != null && S.started) { S.pulse = 1; onBeat(b); }
  S.pulse = Math.max(0, S.pulse - dt * 3.2);

  if (S.started) updateStory(dt);

  // 배가 움직인 만큼 화면에 떠 있는 먹 방울·집중선도 함께 밀린다
  const before = S.boat;
  updateBoat(dt);
  const dx = -(S.boat - before) * view.W;
  if (dx) { for (const p of fx.parts) p.x += dx; for (const l of fx.lines) l.x += dx; }

  for (const s of str) { s.amp *= Math.exp(-dt * 3); s.ph += dt * 38; }

  for (const r of fx.rip) {
    r.r += r.sp * dt;
    const k = 1 - r.r / r.max, band = 22 + 30 * (1 - r.t), rx = toScreenX(r.wx);
    for (const o of OBJ) {
      if (o.hidden || (o.kind === 'lamp' && o.lit > 0)) continue;
      // 파동 고리가 오브젝트 위를 지나는 중인지
      const p = pos(o), d = Math.hypot(p.x - rx, (p.y - r.y) / 0.36);
      if (Math.abs(d - r.r) > band) continue;
      if (o.pp) {
        // pp로만 드러나고, ff에는 흩어진다
        if (r.dyn < 0.24) o.vis = Math.min(1, o.vis + dt * 3.2 * k);
        else if (r.dyn > 0.8 && o.vis > 0.08) { scatterWhisper(o); banner(TEXT.whisperScattered, 'soft', 1600); o.vis = 0; }
        continue;
      }
      o.vis = Math.max(o.vis, 0.3 + 0.7 * k);
      // 가는 줄(t가 큼)일수록 디테일까지 보인다
      if (r.t > 0.55) o.detail = Math.max(o.detail, Math.min(1, k * 1.5 * r.t));
      if (o.kind === 'lamp' && o.detail > 0.55) o.found = true;
    }
  }
  fx.rip = fx.rip.filter(r => r.r < r.max);

  for (const o of OBJ) {
    o.vis = Math.max(0, o.vis - dt * (o.pp ? 0.07 : 0.16));
    o.detail = Math.max(0, o.detail - dt * 0.22);
    o.res = Math.max(0, o.res - dt * 0.55);
  }
  for (const p of fx.parts) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.life -= dt * p.dec; }
  fx.parts = fx.parts.filter(p => p.life > 0 && p.y < view.H + 20);
  for (const l of fx.lines) l.life -= dt * 3.2;
  fx.lines = fx.lines.filter(l => l.life > 0);
  S.flash = Math.max(0, S.flash - dt * 2.2);
  S.shake *= Math.exp(-dt * 9);
  S.seal = Math.max(0, S.seal - dt * 4);
  S.sail = ease(S.sail, S.sailT, 2.4, dt);
  S.scrap = ease(S.scrap, cloth.tied ? 1 : 0, 1.6, dt);
  S.sash = ease(S.sash, S.sashT, 0.8, dt);
  S.fog = ease(S.fog, S.fogT, 1.2, dt);
  S.vision = ease(S.vision, S.visionT, 2, dt);
}
