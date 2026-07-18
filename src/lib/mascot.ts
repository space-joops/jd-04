// ============================================================================
// mascot.ts — 주인공(입 큰 민트색 우주 친구) 그리기
//
// 픽셀 아트: 8×8 가상 픽셀 격자에 fillRect로 찍은 민트색 슬라임 (§6-3, §11).
// 생명력 연출(시선·깜빡임·입벌림·볼터치·안테나)도 여기서 그리지만,
// "무엇을 보여줄지"(face 값)는 게임 본체의 update가 매 프레임 계산해서
// 넘겨준다 — 이 파일은 받은 값을 그리기만 한다 (update/draw 분리, §12).
// ============================================================================

import { COLORS } from "./constants";

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
 */
export function drawMascot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha = 1,
  face: MascotFace = NEUTRAL,
): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);

  // 반지름 4 = 가상 픽셀 1칸 — r이 곧 몸의 절반 폭이 되게 하는 환산
  const scale = r / 4;
  ctx.scale(scale, scale);

  // 안테나 — 몸보다 먼저 그려서 줄기 뿌리가 몸 뒤로 자연스럽게 숨는다
  ctx.fillStyle = COLORS.mascot;
  ctx.fillRect(-0.5, -5.5, 1, 2); // 줄기
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(-1, -7, 2, 1.5); // 끝의 노란 불빛 — 궤도 청소부의 작업등

  ctx.fillStyle = COLORS.mascot;

  // 몸통 — 위가 둥글고 아래가 퍼진 슬라임 실루엣.
  // 원(arc) 대신 가로줄 사각형을 계단식으로 쌓아 도트 느낌을 낸다.
  ctx.fillRect(-2, -4, 4, 1); // 정수리 (가장 좁은 줄)
  ctx.fillRect(-3, -3, 6, 1); // 어깨
  ctx.fillRect(-4, -2, 8, 5); // 몸통 본체 (가장 넓은 블록)
  ctx.fillRect(-3, 3, 2, 1); // 왼발 — 가운데를 비워 두 발처럼 보이게
  ctx.fillRect(1, 3, 2, 1); // 오른발

  // 볼터치 — 하트 분홍을 연하게 (진하면 홍조가 아니라 상처처럼 보인다)
  ctx.save();
  ctx.globalAlpha *= 0.6;
  ctx.fillStyle = COLORS.heart;
  ctx.fillRect(-3.5, 0, 1, 1);
  ctx.fillRect(2.5, 0, 1, 1);
  ctx.restore();

  ctx.fillStyle = COLORS.space;

  // 눈 — 1×1 도트 두 개. 시선은 픽셀 단위(-1/0/+1칸)로만 움직인다 —
  // 소수점 이동은 도트 격자를 깨뜨린다 (§11). 반올림이 곧 양자화.
  if (face.blink) {
    // 감은 눈: 도트 대신 납작한 눈꺼풀 선
    ctx.fillRect(-2, -0.5, 1, 0.5);
    ctx.fillRect(1, -0.5, 1, 0.5);
  } else {
    const ox = Math.max(-1, Math.min(1, Math.round(face.gazeX)));
    const oy = Math.max(-1, Math.min(1, Math.round(face.gazeY)));
    ctx.fillRect(-2 + ox, -1 + oy, 1, 1);
    ctx.fillRect(1 + ox, -1 + oy, 1, 1);
  }

  // 입 — "입 큰" 친구답게. 먹이가 사정거리에 오면 활짝 벌어진다 (§6-3).
  // 중간 크기 없이 닫힘/활짝 두 상태만 — 픽셀 아트는 단계가 분명해야 산다.
  if (face.mouthOpen > 0.5) {
    ctx.fillRect(-2, 0.5, 4, 2.5); // 활짝 — 아래 절반을 크게 차지
  } else {
    ctx.fillRect(-1, 1, 2, 2); // 다문 입 (2×2 — 눈보다 큰 유일한 구멍)
  }

  ctx.restore();
}
