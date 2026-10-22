// 챕터 6 그림: 두 사람 몫의 열두 줄, 가세하는 조각들, 마지막 선택의 두 문장, 엔딩(에필로그 · 해설 · pp)
import { EPILOGUE, EXPLAIN, TEXT6 } from '../data/chapter6';
import { S, str, view } from '../world/state';
import { boatScale, boatX, boatY, seaY, stringY, sx0, sx1 } from '../world/geometry';
import { ctx } from './canvas';
import { BRUSH, INK, INK_SOFT, MONO, PAPER, VOLT, reduceMotion } from './palette';
import { otherScene } from './chapter5Art';
import type { PaintingScene } from '../data/defs';

const PINK = '#ff2a7f';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 그 사람의 여섯 줄: 내 줄 사이사이에 핑크로 (함께 긁는다) */
export function drawDuetStrings() {
  if (S.duet < 0.01) return;
  const x0 = sx0(), x1 = sx1(), gap = (stringY(1) - stringY(0)) / 2;
  ctx.save(); ctx.strokeStyle = PINK; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const y = stringY(i) + gap, s = str[i], N = 40;
    ctx.globalAlpha = S.duet * 0.85; ctx.lineWidth = 1.2 + (5 - i) * 0.35;
    ctx.beginPath();
    for (let k = 0; k <= N; k++) {
      const u = k / N, d = -s.amp * 0.8 * Math.sin(Math.PI * u) * Math.cos(s.ph * 1.07 + 1);
      k ? ctx.lineTo(x0 + (x1 - x0) * u, y + d) : ctx.moveTo(x0, y);
    }
    ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 함께 긁을 때 하나씩 날아가 물벽을 밀어내는 것들 */
export const allies: { label: string; t0: number; hit?: boolean }[] = [];
const ALLY_FLY = 0.9;
export function drawAllies(wallX: number) {
  const s = boatScale(), sx = boatX(), sy = boatY() - 90 * s;
  for (const a of allies) {
    const k = (S.t - a.t0) / ALLY_FLY;
    if (k < 0 || k > 1.6) continue;
    const e = Math.min(1, k), x = sx + (wallX - sx) * e, y = sy - Math.sin(Math.PI * e) * 120 * s;
    ctx.save(); ctx.globalAlpha = k > 1 ? Math.max(0, 1 - (k - 1) / 0.6) : 1;
    ctx.translate(x, y); ctx.rotate(e * 4);
    ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-16, -10); ctx.quadraticCurveTo(0, -18, 16, -8); ctx.lineTo(12, 12); ctx.quadraticCurveTo(0, 6, -14, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-e * 4); ctx.fillStyle = INK; ctx.font = `20px ${BRUSH}`; ctx.textAlign = 'center'; ctx.fillText(a.label, 0, -24);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
export const allyArrived = (a: { t0: number }) => S.t - a.t0 >= ALLY_FLY;

/** 마지막 선택: 물 위에 그 사람의 붓글씨로 두 문장. ← →로 바라보는 쪽이 고를 문장 */
export const choice = { on: false, shakeT: -9, chosenT: -1 };
export function drawChoice() {
  if (!choice.on && choice.chosenT < 0) return;
  const { W } = view, y = seaY(0.86), size = Math.round(Math.min(44, W / 20));
  const side = S.look < -0.12 ? 'keep' : S.look > 0.12 ? 'give' : '';
  const shake = !reduceMotion && S.t - choice.shakeT < 0.6 ? Math.sin(S.t * 50) * 4 : 0;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // 세상은 배를 따라 움직이므로, 문장도 배를 기준으로 좌우에
  const items: ['keep' | 'give', string, number][] = [['keep', TEXT6.keep, boatX() - W * 0.3], ['give', TEXT6.give, boatX() + W * 0.3]];
  for (const [id, txt, x] of items) {
    const chosen = S.ending === id, other = S.ending && !chosen, on = !S.ending && side === id;
    const a = other ? Math.max(0, 1 - (S.t - choice.chosenT) / 1.5) : 1;
    ctx.globalAlpha = a * (on || chosen ? 1 : 0.55);
    ctx.font = `${Math.round(size * (on || chosen ? 1.2 : 1))}px ${BRUSH}`;
    if (on || chosen) { ctx.shadowColor = chosen ? PINK : VOLT; ctx.shadowBlur = chosen ? 22 : 12; }
    ctx.fillStyle = INK; ctx.fillText(txt, x + shake, y); ctx.shadowBlur = 0;
    if (on) { const w = ctx.measureText(txt).width; ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, y + 10); ctx.lineTo(x + w / 2, y + 10); ctx.stroke(); }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/** 엔딩: 에필로그 → 제작 의도 해설 → pp */
export const ending = { phase: '' as '' | 'epi' | 'explain' | 'logo', t0: 0, idx: 0 };
export const EPI_LINE = 3.2, EXPLAIN_SLIDE = 5.2;
export function drawEnding() {
  if (!ending.phase) return;
  const { W, H } = view, t = S.t - ending.t0;
  ctx.save();
  // 한지 판: 에필로그가 시작될 때만 천천히 덮이고, 그 뒤로는 게임 화면이 비치지 않게
  ctx.globalAlpha = ending.phase === 'epi' ? clamp01(t / 1.5) : 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
  if (ending.phase === 'epi') {
    const lines = EPILOGUE[S.ending || 'keep'], size = Math.round(Math.min(34, W / 24));
    ctx.font = `${size}px ${BRUSH}`;
    lines.forEach((l, i) => {
      const a = clamp01((t - 1 - i * EPI_LINE) / 1.4);
      if (a <= 0) return;
      ctx.globalAlpha = a; ctx.fillStyle = i === lines.length - 1 ? INK : INK_SOFT;
      ctx.fillText(l, W / 2, H * 0.3 + i * size * 2.1);
    });
  } else if (ending.phase === 'explain') {
    const e = EXPLAIN[ending.idx], k = clamp01(t / 0.8), out = clamp01((EXPLAIN_SLIDE - t) / 0.6);
    ctx.globalAlpha = Math.min(k, out);
    ctx.font = `${Math.round(Math.min(130, W / 7))}px ${BRUSH}`; ctx.fillStyle = e.mark === 'F' || e.mark === 'pp' ? PINK : INK;
    ctx.fillText(e.mark, W / 2, H * 0.32);
    ctx.fillStyle = INK; ctx.font = `${Math.round(Math.min(44, W / 18))}px ${BRUSH}`; ctx.fillText(e.title, W / 2, H * 0.55);
    ctx.fillStyle = INK_SOFT; ctx.font = `${Math.round(Math.min(24, W / 34))}px ${BRUSH}`; ctx.fillText(e.line, W / 2, H * 0.65);
    // 몇 번째 장인지
    ctx.globalAlpha = 0.6; ctx.font = `13px ${MONO}`; ctx.fillText(`${ending.idx + 1} / ${EXPLAIN.length}`, W / 2, H * 0.86);
  } else {
    // pp: 품으면 한 p가 다른 p에 기대고, 맡기면 하나가 흐려진다
    const keep = S.ending !== 'give', size = Math.round(Math.min(300, W / 3.2)), a = clamp01(t / 2);
    ctx.font = `${size}px ${BRUSH}`; ctx.globalAlpha = a;
    ctx.fillText('p', W / 2 - size * 0.24, H * 0.42);
    ctx.save(); ctx.translate(W / 2 + size * 0.2, H * 0.42);
    if (keep) ctx.rotate(-0.16 * clamp01(t / 3)); else ctx.globalAlpha = a * (1 - 0.75 * clamp01((t - 1.5) / 3));
    ctx.fillText('p', 0, 0); ctx.restore();
    // 낙관 (그 사람의 색 하나)
    ctx.globalAlpha = clamp01((t - 2.5) / 1.5); ctx.fillStyle = PINK; ctx.fillRect(W / 2 + size * 0.5, H * 0.42 - size * 0.42, size * 0.09, size * 0.09);
    ctx.globalAlpha = clamp01((t - 4) / 1.5); ctx.fillStyle = INK_SOFT; ctx.font = `${Math.round(Math.min(22, W / 40))}px ${BRUSH}`;
    ctx.fillText(TEXT6.end, W / 2, H * 0.8);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/**
 * 회상 한 마디: 함께 밀어낸 뒤의 정적 속에, 지나온 기억들이 그 사람 쪽에서 본 모습으로 한 장씩 스쳐 간다
 * (번쩍이지 않게 천천히 겹쳐 바뀐다)
 */
export const recall = { t0: -1 };
const RECALL: PaintingScene[] = ['meet', 'room', 'stage', 'rain'];
export const RECALL_EACH = 1.5, RECALL_DUR = RECALL.length * RECALL_EACH + 1.2;
export function drawRecall() {
  if (recall.t0 < 0) return;
  const t = S.t - recall.t0;
  if (t > RECALL_DUR + 1) return;
  const { W, H } = view, fw = Math.min(W * 0.46, 560), fh = fw * 0.55, f = { x: (W - fw) / 2, y: H * 0.16, w: fw, h: fh };
  const whole = clamp01(t / 0.8) * clamp01((RECALL_DUR + 1 - t) / 1);
  ctx.save();
  ctx.globalAlpha = 0.45 * whole; ctx.fillStyle = '#14120f'; ctx.fillRect(0, 0, W, H);
  RECALL.forEach((scene, i) => {
    const a = clamp01((t - i * RECALL_EACH) / 0.6) * clamp01(((i + 1) * RECALL_EACH + 0.6 - t) / 0.6) * whole;
    if (a <= 0.01) return;
    ctx.globalAlpha = a; ctx.fillStyle = PAPER; ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(f.x, f.y, f.w, f.h);
    ctx.save(); ctx.beginPath(); ctx.rect(f.x + 5, f.y + 5, f.w - 10, f.h - 10); ctx.clip();
    otherScene((u, v) => [f.x + u * f.w, f.y + v * f.h] as const, f, scene, 1);
    ctx.restore();
  });
  ctx.restore(); ctx.globalAlpha = 1;
}
