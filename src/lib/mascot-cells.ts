// ============================================================================
// mascot-cells.ts — 마스코트 도트 좌표 (ImageResponse용, §11·§13)
//
// next/og ImageResponse는 캔버스가 아니라 div로 그린다. drawMascot(mascot.ts)의
// fillRect 좌표를 그대로 [x,y,w,h,color] 배열로 옮긴 것 — pwa-icon(아이콘)과
// opengraph-image(소셜 프리뷰)가 함께 쓴다(중복 제거). mascot.ts의 기본(mint)
// 도트를 바꾸면 여기도 함께 바꿔야 아이콘·OG·게임이 같은 얼굴이 된다.
// 브랜드 고정이라 항상 mint 변형이다.
// ============================================================================

import { COLORS } from "./constants";

/** [x, y, w, h, color] — drawMascot(§6-3) mint 변형의 fillRect 좌표. */
export const MASCOT_CELLS: Array<[number, number, number, number, string]> = [
  // 안테나 (몸보다 먼저 = 아래 레이어)
  [-0.5, -5.5, 1, 2, COLORS.mascot],
  [-1, -7, 2, 1.5, COLORS.accent],
  // 몸통 슬라임 실루엣
  [-2, -4, 4, 1, COLORS.mascot],
  [-3, -3, 6, 1, COLORS.mascot],
  [-4, -2, 8, 5, COLORS.mascot],
  [-3, 3, 2, 1, COLORS.mascot],
  [1, 3, 2, 1, COLORS.mascot],
  // 볼터치 — 캔버스에선 알파 0.6, 여기선 8자리 hex로 같은 느낌
  [-3.5, 0, 1, 1, "#ff8fab99"],
  [2.5, 0, 1, 1, "#ff8fab99"],
  // 눈·입
  [-2, -1, 1, 1, COLORS.space],
  [1, -1, 1, 1, COLORS.space],
  [-1, 1, 2, 2, COLORS.space],
];
