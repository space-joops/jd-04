// ============================================================================
// mascot.ts — 주인공(입 큰 민트색 우주 친구) 그리기
//
// 픽셀 아트 버전: 8×8 픽셀 격자에 fillRect로 찍은 민트색 슬라임 (§6-3, §11).
// 생명력 연출(시선 추적·깜빡임·입벌림·볼터치·안테나)은 백로그(§16)이며,
// 그때 이 파일만 갈아 끼우면 되도록 그리기를 여기에 격리해 둔다.
// ============================================================================

import { COLORS } from "./constants";

/**
 * 주인공을 그린다. draw 단계 전용 — 상태를 바꾸지 않는다 (§12).
 *
 * 픽셀 격자 방식: 도형을 -4~+4 범위의 "가상 픽셀" 좌표로 찍고,
 * ctx.scale(r/4)로 확대한다. 반지름 r이 커지면(성장 §6-2) 픽셀도 같이
 * 굵어져서, 어떤 크기에서도 같은 도트 실루엣이 유지된다.
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

  // 반지름 4 = 가상 픽셀 1칸 — r이 곧 몸의 절반 폭이 되게 하는 환산
  const scale = r / 4;
  ctx.scale(scale, scale);

  ctx.fillStyle = COLORS.mascot;

  // 몸통 — 위가 둥글고 아래가 퍼진 슬라임 실루엣.
  // 원(arc) 대신 가로줄 사각형을 계단식으로 쌓아 도트 느낌을 낸다.
  ctx.fillRect(-2, -4, 4, 1); // 정수리 (가장 좁은 줄)
  ctx.fillRect(-3, -3, 6, 1); // 어깨
  ctx.fillRect(-4, -2, 8, 5); // 몸통 본체 (가장 넓은 블록)
  ctx.fillRect(-3, 3, 2, 1); // 왼발 — 가운데를 비워 두 발처럼 보이게
  ctx.fillRect(1, 3, 2, 1); // 오른발

  // 눈 — 1×1 도트 두 개. 배경색으로 찍어 "뚫린" 느낌
  ctx.fillStyle = COLORS.space;
  ctx.fillRect(-2, -1, 1, 1);
  ctx.fillRect(1, -1, 1, 1);

  // 입 — "입 큰" 친구답게 2×2 도트 (눈보다 큰 유일한 구멍)
  ctx.fillRect(-1, 1, 2, 2);

  ctx.restore();
}
