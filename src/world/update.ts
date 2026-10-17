// 매 프레임 상태를 갱신: 줄의 진동, 파동이 오브젝트를 비추는 판정, 입자, 연출 감쇠
import { CHORDS } from '../data/chords';
import { TEXT } from '../data/chapter0';
import { scatterWhisper } from '../render/effects';
import { banner, updateHud } from '../ui/hud';
import { OBJ, S, fx, str, view } from './state';
import { pos } from './geometry';

export function update(dt: number) {
  S.t += dt;
  for (const s of str) { s.amp *= Math.exp(-dt * 3); s.ph += dt * 38; }

  for (const r of fx.rip) {
    r.r += r.sp * dt;
    const k = 1 - r.r / r.max, band = 22 + 30 * (1 - r.t);
    for (const o of OBJ) {
      if (o.kind === 'lamp' && o.lit) continue;
      // 파동 고리가 오브젝트 위를 지나는 중인지
      const p = pos(o), d = Math.hypot(p.x - r.x, (p.y - r.y) / 0.36);
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
      if (o.kind === 'lamp' && !o.found && o.detail > 0.55) {
        o.found = true;
        banner(TEXT.lampFound(CHORDS[o.chord!].label), 'soft', 1500);
        updateHud();
      }
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
  S.sail += (S.sailT - S.sail) * Math.min(1, dt * 2.4);
}
