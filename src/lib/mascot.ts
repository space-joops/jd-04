// ============================================================================
// mascot.ts — 주인공(입 큰 민트색 우주 친구) 그리기
//
// 픽셀 아트: 8×8 가상 픽셀 격자에 fillRect로 찍은 민트색 슬라임 (§6-3, §11).
// 생명력 연출(시선·깜빡임·입벌림·볼터치·안테나)도 여기서 그리지만,
// "무엇을 보여줄지"(face 값)는 게임 본체의 update가 매 프레임 계산해서
// 넘겨준다 — 이 파일은 받은 값을 그리기만 한다 (update/draw 분리, §12).
// ============================================================================

import { COLORS, MASCOT_VARIANTS, type MascotVariantId } from "./constants";

/** 생명력 연출 상태 — 게임 본체가 계산해서 넘겨주는 "표정" 한 벌. */
export type MascotFace = {
  /** 시선 방향 -1~1 (단위 벡터). 가장 가까운 먹이 쪽을 본다. 0이면 정면. */
  gazeX: number;
  gazeY: number;
  /** true면 눈을 감고 있다 (깜빡임 — §6-3, 0.13초). */
  blink: boolean;
  /** 입벌림 0~1. 먹이가 사정거리(r+120px)에 들어오면 1로 벌어진다. */
  mouthOpen: number;
};

/** face를 안 넘긴 호출을 위한 무표정 기본값. */
const NEUTRAL: MascotFace = { gazeX: 0, gazeY: 0, blink: false, mouthOpen: 0 };

/** id → 몸통 색. 못 찾으면 민트로 폴백. */
function bodyColor(variant: MascotVariantId): string {
  return MASCOT_VARIANTS.find((v) => v.id === variant)?.body ?? COLORS.mascot;
}

/**
 * 주인공을 그린다. draw 단계 전용 — 상태를 바꾸지 않는다 (§12).
 *
 * 픽셀 격자 방식: 도형을 -4~+4 범위의 "가상 픽셀" 좌표로 찍고,
 * ctx.scale(r/4)로 확대한다. 반지름 r이 커지면(성장 §6-2) 픽셀도 같이
 * 굵어져서, 어떤 크기에서도 같은 도트 실루엣이 유지된다.
 *
 * @param r 몸 반지름(px) — 성장 시스템(§6-2)이 이 값을 키운다
 * @param alpha 무적 깜빡임용 투명도. globalAlpha에 "곱해서" 적용한다 (§12)
 * @param face 생명력 연출 상태 (생략하면 무표정)
 * @param variant 캐릭터 3종 (§6-3) — 색·안테나·눈·입 모양을 바꾼다
 */
export function drawMascot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha = 1,
  face: MascotFace = NEUTRAL,
  variant: MascotVariantId = "mint",
): void {
  const body = bodyColor(variant);

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);

  // 반지름 4 = 가상 픽셀 1칸 — r이 곧 몸의 절반 폭이 되게 하는 환산
  const scale = r / 4;
  ctx.scale(scale, scale);

  // 안테나 — 몸보다 먼저 그려서 줄기 뿌리가 몸 뒤로 자연스럽게 숨는다.
  // 캐릭터마다 다른 안테나 (§6-3): 민초=1개 노란 불빛, 딸기=두 갈래 더듬이,
  // 라벤더=별.
  ctx.fillStyle = body;
  if (variant === "coral") {
    // 두 갈래 더듬이 — 좌우로 벌어진 줄기 + 끝 노랑 점
    ctx.fillRect(-2, -5.5, 1, 2);
    ctx.fillRect(1, -5.5, 1, 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(-2.5, -6.5, 1.5, 1.5);
    ctx.fillRect(1, -6.5, 1.5, 1.5);
  } else if (variant === "lavender") {
    // 별 안테나 — 줄기 + 끝에 십자 별
    ctx.fillRect(-0.5, -5.5, 1, 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(-0.5, -8, 1, 3); // 별 세로
    ctx.fillRect(-2, -6.5, 4, 1); // 별 가로
  } else {
    // 민초(기본) — 줄기 + 끝 노란 동그란 불빛
    ctx.fillRect(-0.5, -5.5, 1, 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(-1, -7, 2, 1.5);
  }

  ctx.fillStyle = body;

  // 몸통 — 위가 둥글고 아래가 퍼진 슬라임 실루엣. (모든 종 공통)
  ctx.fillRect(-2, -4, 4, 1); // 정수리 (가장 좁은 줄)
  ctx.fillRect(-3, -3, 6, 1); // 어깨
  ctx.fillRect(-4, -2, 8, 5); // 몸통 본체 (가장 넓은 블록)
  ctx.fillRect(-3, 3, 2, 1); // 왼발 — 가운데를 비워 두 발처럼 보이게
  ctx.fillRect(1, 3, 2, 1); // 오른발

  // 볼터치 — 종마다 색을 살짝 바꿔 몸통 색과 안 부딪히게.
  // 딸기(분홍 몸)는 분홍 볼이 묻히니 흰(ink) 볼로.
  ctx.save();
  ctx.globalAlpha *= 0.6;
  ctx.fillStyle = variant === "coral" ? COLORS.ink : COLORS.heart;
  ctx.fillRect(-3.5, 0, 1, 1);
  ctx.fillRect(2.5, 0, 1, 1);
  ctx.restore();

  ctx.fillStyle = COLORS.space;

  // 눈 — 종마다 모양이 다르다 (§6-3). 깜빡임은 공통(납작한 눈꺼풀 선).
  if (face.blink) {
    ctx.fillRect(-2, -0.5, 1, 0.5);
    ctx.fillRect(1, -0.5, 1, 0.5);
  } else {
    const ox = Math.max(-1, Math.min(1, Math.round(face.gazeX)));
    const oy = Math.max(-1, Math.min(1, Math.round(face.gazeY)));
    if (variant === "coral") {
      // 반달 웃음눈 (‿‿) — 아래로 볼록한 1px 선
      ctx.fillRect(-2 + ox, oy, 1, 0.5);
      ctx.fillRect(1 + ox, oy, 1, 0.5);
    } else if (variant === "lavender") {
      // 큰 동그란 눈 — 2×2, 가운데 반짝(우주색 구멍은 이미 우주색이라 생략)
      ctx.fillRect(-2.5 + ox, -1.5 + oy, 2, 2);
      ctx.fillRect(0.5 + ox, -1.5 + oy, 2, 2);
    } else {
      // 민초(기본) — 1×1 점눈
      ctx.fillRect(-2 + ox, -1 + oy, 1, 1);
      ctx.fillRect(1 + ox, -1 + oy, 1, 1);
    }
  }

  // 입 — 먹이가 사정거리에 오면 활짝. 다문 모양은 종마다 다르다 (§6-3).
  if (face.mouthOpen > 0.5) {
    ctx.fillRect(-2, 0.5, 4, 2.5); // 활짝 (공통)
  } else if (variant === "coral") {
    ctx.fillRect(-2, 1, 4, 1); // 큰 미소 — 가로로 넓은 선
    ctx.fillRect(-1, 2, 2, 1);
  } else if (variant === "lavender") {
    ctx.fillRect(-0.5, 1.5, 1, 1); // 오므린 작은 입 (o)
  } else {
    ctx.fillRect(-1, 1, 2, 2); // 민초 — 다문 2×2
  }

  ctx.restore();
}
