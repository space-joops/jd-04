// ============================================================================
// mascot.ts — 주인공(입 큰 민트색 우주 친구) 그리기
//
// MVP 버전: 민트 원 + 눈 2개 + 벌린 입 (§6-3).
// 생명력 연출(시선 추적·깜빡임·입벌림·볼터치·안테나)은 백로그(§16)이며,
// 그때 이 파일만 갈아 끼우면 되도록 그리기를 여기에 격리해 둔다.
// ============================================================================

import { COLORS } from "./constants";

/**
 * 주인공을 그린다. draw 단계 전용 — 상태를 바꾸지 않는다 (§12).
 *
 * @param r 몸 반지름(px) — 성장 시스템(§6-2)이 이 값을 키운다
 * @param alpha 무적 깜빡임용 투명도. globalAlpha에 "곱해서" 적용한다 (§12)
 */
export function drawMascot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 몸통 — 민트 원 + 어두운 외곽선 (배경과 분리돼 보이게)
  ctx.fillStyle = COLORS.mascot;
  ctx.strokeStyle = COLORS.space;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 눈 — 흰자 + 눈동자. 치수는 전부 r의 배수 (비례 기반, §11)
  const eyeX = r * 0.38;
  const eyeY = -r * 0.18;
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, r * 0.2, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.space;
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // 입 — "입 큰" 친구답게 아래쪽 절반을 크게 차지하는 반원
  ctx.fillStyle = COLORS.space;
  ctx.beginPath();
  ctx.arc(0, r * 0.22, r * 0.42, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
