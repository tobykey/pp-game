// '네 박' 기회 표시와 꿈이 되감기는 연출
import { S, view } from '../world/state';
import { boatX, boatY, sb } from '../world/geometry';
import { ctx } from './canvas';
import { BRUSH, INK, PAPER } from './palette';

const PINK = '#ff2a7f';

/** 악보 오른쪽에 한 마디의 네 박: 남은 기회는 음표(♩), 잃은 기회는 핑크 쉼표 */
export function drawLives() {
  if (S.lives < 0) return;
  const sx = Math.max(16, view.W * 0.03), x0 = sx + 300, y = sb() - 10;
  ctx.save();
  ctx.fillStyle = INK; ctx.font = `18px ${BRUSH}`; ctx.textAlign = 'right'; ctx.fillText('네 박', x0 - 12, y - 4);
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * 24, alive = i < S.lives;
    if (alive) {
      // 4분음표: 비스듬한 머리 + 기둥
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, 6, 4.5, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 5, y - 1); ctx.lineTo(x + 5, y - 24); ctx.stroke();
    } else {
      // 4분쉼표 (잃은 박)
      ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x - 2, y - 24); ctx.lineTo(x + 4, y - 16); ctx.lineTo(x - 2, y - 9); ctx.lineTo(x + 4, y - 2); ctx.quadraticCurveTo(x - 6, y - 2, x - 1, y + 6); ctx.stroke();
    }
  }
  ctx.restore();
}

/** 되감기: 화면이 한지 빛으로 바래며, 먹의 동심원이 바깥에서 배 쪽으로 빨려 든다 (번쩍임 없이) */
export function drawRewind() {
  if (S.rewind < 0.01) return;
  const { W, H } = view, k = S.rewind, e = 1 - k, x = boatX(), y = boatY();
  ctx.save();
  ctx.globalAlpha = 0.55 * Math.sin(Math.PI * Math.min(1, e * 1.1)); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  const maxR = Math.max(W, H) * 0.8;
  for (let i = 0; i < 6; i++) {
    const ph = (e * 1.6 + i / 6) % 1, r = maxR * (1 - ph);
    ctx.globalAlpha = 0.35 * Math.sin(Math.PI * ph) * Math.min(1, k * 2);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
