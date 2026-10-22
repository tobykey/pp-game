// 매 프레임 상태를 갱신: 줄의 진동, 파동이 오브젝트를 비추는 판정, 배의 항해, 박, 입자, 연출 감쇠
import { TEXT } from '../data/chapter0';
import { scatterWhisper } from '../render/effects';
import { onBeat, updateStory } from '../story/director';
import { banner } from '../ui/hud';
import { OBJ, S, cloth, fx, str, view } from './state';
import { camX, pos, toScreenX } from './geometry';
import { tickRhythm } from './rhythm';
import { updateBoat } from './rowing';
import { markSeen } from './memory';

const ease = (v: number, target: number, rate: number, dt: number) => v + (target - v) * Math.min(1, dt * rate);

export function update(dt: number) {
  S.t += dt;

  // 박: 소리 예약 + 새 박이면 장면에 알림
  const b = tickRhythm();
  if (b != null && S.started) { S.pulse = 1; onBeat(b); }
  S.pulse = Math.max(0, S.pulse - dt * 3.2);

  if (S.started) updateStory(dt);

  // 둘러보기: ← → 키를 누르는 동안 옆을 보고, 떼면 천천히 배 쪽으로 돌아온다
  S.dragLook = S.lookable && S.lookDir !== 0;
  if (S.dragLook) S.look = Math.max(-0.65, Math.min(0.65, S.look + S.lookDir * dt * (S.lookHold ? 0.45 : 1.1)));
  else if (!S.lookHold) S.look = ease(S.look, 0, 1.6, dt);
  // 그 사람의 자세는 내가 보지 않을 때(배가 화면 밖으로 비켜났을 때) 바뀐다 (복선: 잠든 게 아니었다)
  if (S.lookable && Math.abs(S.look) > 0.55 && S.pose === 0) S.pose = 1;

  // 배·화면이 움직인 만큼 화면에 떠 있는 먹 방울·집중선도 함께 밀린다
  const before = camX();
  updateBoat(dt);
  const dx = -(camX() - before) * view.W;
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
    if (o.kind === 'painting' && !o.hidden) {
      // 기억 그림이 움직이는 중
      if (o.play > 0 && o.play < 1) o.play = Math.min(1, o.play + dt / 6);
      // 액자 밖 그 사람: 화면 안에 들어와 있는 동안에만 서서히 보인다 (둘러본 사람만)
      if (o.edge && !o.gone) {
        const fx0 = toScreenX((o.wx ?? 0) + (o.edge === 'left' ? -1 : 1) * ((o.w ?? 0.9) / 2 + 0.09));
        const onScreen = fx0 > view.W * 0.06 && fx0 < view.W * 0.94;
        // 실제로 ← → 키로 둘러보는 동안에만 드러난다 (배가 다가가며 저절로 지나치는 것으로는 안 보임)
        o.look = Math.max(0, Math.min(1, o.look + dt * (onScreen && S.dragLook ? 0.9 : -0.25)));
        if (o.look > 0.75 && !o.seen) { o.seen = true; markSeen(o.id); }
      }
      // 그림의 윤곽은 장면에 들어오면 늘 희미하게 남는다
      o.vis = Math.max(o.vis, 0.35);
    }
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
  // 조각이 늘 때마다 그 사람의 띠가 짧아진다 (복선 7)
  if (S.pieces > 0) S.sashT = Math.max(0.25, 0.8 - 0.09 * (Math.min(S.pieces, 4) - 1));
  S.sash = ease(S.sash, S.sashT, 0.8, dt);
  fx.flyers = fx.flyers.filter(f => S.t - f.t < f.dur + 0.1);
  S.fog = ease(S.fog, S.fogT, 1.2, dt);
  S.vision = ease(S.vision, S.visionT, 2, dt);
  S.hush = ease(S.hush, S.silence ? 1 : 0, 2.5, dt);
  S.zoom = ease(S.zoom, S.zoomT, 1.6, dt);
  S.vortex = ease(S.vortex, S.vortexT, 1.5, dt);
  S.dim = ease(S.dim, S.dimT, 2.5, dt);
  S.frozenVis = ease(S.frozenVis, S.frozenVisT, 1.2, dt);
  S.rainFall = ease(S.rainFall, S.rainFallT, 1.5, dt);
  S.shield = Math.max(0, S.shield - dt * 1.8);
  S.burst = Math.max(0, S.burst - dt * 0.9);
  S.catchT = Math.max(0, S.catchT - dt * 0.8);
  S.white = ease(S.white, S.whiteT, S.whiteT > S.white ? 1.6 : 0.7, dt);
  S.glowPop = Math.max(0, S.glowPop - dt * 2.5);
  S.punch = ease(S.punch, S.punchT, S.punchT > S.punch ? 12 : 1.4, dt);
  S.fburst = Math.max(0, S.fburst - dt * 0.38);
  S.rewind = Math.max(0, S.rewind - dt * 0.5);
  S.dry = ease(S.dry, S.dryT, 0.45, dt);
  S.storm = ease(S.storm, S.stormT, 0.8, dt);
  S.press = ease(S.press, S.pressT, 1.2, dt);
  S.ds = ease(S.ds, S.dsT, 0.7, dt);
  S.swap = ease(S.swap, S.swapT, 0.35, dt);
  S.sunk = ease(S.sunk, S.sunkT, 0.8, dt);
  S.bflat = ease(S.bflat, S.bflatT, 1, dt);
  S.rise = ease(S.rise, S.riseT, 0.9, dt);
  S.duet = ease(S.duet, S.duetT, 1.5, dt);
  S.lyric = ease(S.lyric, S.lyricT, 0.8, dt);
  if (S.bare) S.sashT = 0;
}
