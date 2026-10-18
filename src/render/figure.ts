import { ctx } from './canvas';

/** 기타를 안고 앉은 사람. 배 위의 '나'와 물그림자, 기억 그림 속 '나'가 같은 모양이다 */
export function figure() {
  ctx.beginPath(); ctx.arc(14, -34, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -27); ctx.quadraticCurveTo(2, -10, 6, -2); ctx.lineTo(24, -2); ctx.quadraticCurveTo(24, -16, 20, -27); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(34, -26); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(2, -8, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill();
}
