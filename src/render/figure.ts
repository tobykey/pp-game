import { ctx } from './canvas';

/**
 * 기타를 안고 앉은 사람. 배 위의 '나'와 물그림자, 기억 그림 속 '나', 진실 컷의 그 사람이 같은 모양이다.
 * 오른쪽을 보고 앉아 있다. 색은 부르는 쪽이 정한 fillStyle (먹 / 옅은 먹)
 * 2026-10-23 그림 작업: 단순한 도형에서 → 머리칼·옷자락·팔·기타(몸통·울림구멍·넥·헤드)가 있는 붓 실루엣으로
 */
export function figure() {
  const ink = ctx.fillStyle;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 머리와 뒤로 묶은 머리칼
  ctx.beginPath(); ctx.ellipse(15, -35, 5.4, 6.2, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(11, -40); ctx.quadraticCurveTo(5, -38, 6.5, -31); ctx.quadraticCurveTo(9, -33, 11, -32); ctx.fill();
  // 옷: 어깨에서 등을 타고 내려와 앉은 무릎까지 한 획으로
  ctx.beginPath();
  ctx.moveTo(10, -29.5);
  ctx.quadraticCurveTo(3.5, -24, 2.5, -14);
  ctx.quadraticCurveTo(1.5, -6, -2.5, -0.5);
  ctx.lineTo(28, -0.5);
  ctx.quadraticCurveTo(31, -3.5, 27.5, -6.5);
  ctx.quadraticCurveTo(22, -7, 19.5, -9);
  ctx.quadraticCurveTo(22.5, -19, 19.5, -28.5);
  ctx.quadraticCurveTo(15, -31, 10, -29.5);
  ctx.fill();
  // 기타 몸통 (아래 둥근 배 + 위 둥근 배). 몸과 겹치므로 한지 빛 테두리로 갈라 보이게
  ctx.save(); ctx.translate(4.5, -9.5); ctx.rotate(-0.45);
  ctx.beginPath(); ctx.ellipse(-2, 0.5, 8.2, 5.8, 0, 0, Math.PI * 2); ctx.ellipse(6.5, -0.3, 5.6, 4.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(234,230,222,.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(-2, 0.5, 8.2, 5.8, 0, Math.PI * 0.55, Math.PI * 1.9); ctx.stroke();
  // 울림구멍
  ctx.fillStyle = 'rgba(234,230,222,.6)'; ctx.beginPath(); ctx.arc(2.6, 0, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 넥과 헤드
  ctx.strokeStyle = ink as string; ctx.fillStyle = ink;
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -13); ctx.lineTo(34, -26); ctx.stroke();
  ctx.save(); ctx.translate(35.5, -27); ctx.rotate(-0.53); ctx.fillRect(-1, -1.8, 5, 3.6); ctx.restore();
  // 팔: 줄을 긁는 오른팔, 코드를 잡는 왼손
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(17, -25); ctx.quadraticCurveTo(13, -16, 7, -9.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, -26); ctx.quadraticCurveTo(24, -26.5, 27, -22.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(27.4, -22.2, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
