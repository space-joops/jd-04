// ============================================================================
// backdrop.ts — 우주 배경 (배경색 + 모눈 격자 + 반짝이는 별 + 잠자는 달)
//
// 별의 위치는 매 프레임 똑같아야 한다. Math.random을 프레임마다 부르면
// 별이 지지직거리며 온 화면을 뛰어다닌다. 그래서 인덱스에서 항상 같은 값이
// 나오는 결정론적 유사난수(hash)를 쓴다 — 같은 씨앗은 항상 같은 결과 (§11).
// 반짝임은 위치가 아니라 "밝기"만 시간(t)에 따라 움직인다.
// ============================================================================

import { CANVAS_FONT, COLORS } from "./constants";

/** 모눈 격자 간격(px)과 투명도 — "모눈종이 노트" 컨셉의 뼈대 (§11). */
const GRID_GAP = 48;
const GRID_ALPHA = 0.045;

/** 별 개수 (§11). 약 1/4은 점이 아니라 ＋(십자) 모양으로 반짝인다. */
const STAR_COUNT = 46;

/**
 * 0~1 사이 결정론적 유사난수. 같은 i에는 언제나 같은 값이 나온다.
 * (sin을 크게 튀겨서 소수부만 취하는 고전적인 해시 트릭.)
 */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 배경 전체를 그린다. draw 단계 전용 — 상태를 바꾸지 않는다 (§12).
 *
 * @param t 누적 시간(초) — 별 반짝임·달 잠꼬대의 시계. 생략하면 정지 화면.
 */
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t = 0,
): void {
  // 1) 우주색 바탕
  ctx.fillStyle = COLORS.space;
  ctx.fillRect(0, 0, w, h);

  // 2) 모눈 격자 — 아주 연하게 (진하면 노트가 아니라 감옥이 된다)
  ctx.save();
  ctx.globalAlpha *= GRID_ALPHA; // 대입이 아니라 곱하기 (§12)
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = GRID_GAP; x < w; x += GRID_GAP) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = GRID_GAP; y < h; y += GRID_GAP) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();

  // 3) 반짝이는 별 — 위치·크기·모양은 해시로 고정, 밝기만 t로 숨쉰다
  ctx.save();
  ctx.fillStyle = COLORS.ink;
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = Math.floor(hash(i * 3 + 1) * w);
    const y = Math.floor(hash(i * 3 + 2) * h);
    // 크기를 2px/4px 두 단계로 양자화 — 픽셀 아트 톤 (§11)
    const size = Math.floor(1 + hash(i * 3 + 3) * 1.6) * 2;
    // 별마다 반짝임 속도·위상을 다르게 — 다 같이 깜빡이면 신호등이 된다
    const twinkle =
      0.55 + 0.45 * Math.sin(t * (0.6 + hash(i * 5 + 4) * 1.8) + hash(i * 7 + 5) * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha *= (0.25 + hash(i * 7 + 5) * 0.5) * twinkle;
    if (hash(i * 11 + 6) < 0.25) {
      // ＋(십자) 별 — 반짝임이 강조되는 큰 별
      ctx.fillRect(x - size, y, size * 2 + 2, 2);
      ctx.fillRect(x, y - size, 2, size * 2 + 2);
    } else {
      // 네모 점 별 — 좌표 정수 내림으로 도트를 또렷하게
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }
  ctx.restore();

  // 4) 잠자는 달 — 오른쪽 위에서 눈 감고 "z z" (§11).
  // 낙하물 별(star)과 헷갈리지 않게: 달은 항상 같은 자리에 있는 큰 초승달.
  // 오른쪽으로 열린 "C" 모양을 가로줄로 직접 쌓는다 — 원판 두 장을 겹쳐
  // 파내는 방식은 계단 모서리 조각이 남아 지저분하다.
  const mx = w - 64;
  const my = 96;
  ctx.save();
  ctx.translate(mx, my);
  ctx.scale(6, 6); // 가상 픽셀 1칸 = 6px, 반지름 4칸 = 24px
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(-2, -4, 4, 1); // 위 뿔
  ctx.fillRect(-3, -3, 3, 1);
  ctx.fillRect(-4, -2, 2, 4); // 왼쪽 두꺼운 몸통
  ctx.fillRect(-3, 2, 3, 1);
  ctx.fillRect(-2, 3, 4, 1); // 아래 뿔
  // 감은 눈 — 자는 중이라는 표시 (두꺼운 몸통 위에)
  ctx.fillStyle = COLORS.space;
  ctx.fillRect(-3.5, -0.5, 1.5, 0.5);
  ctx.restore();

  // "z z" 잠꼬대 — 숨 쉬듯 흐리게 떠올랐다 가라앉는다
  ctx.save();
  ctx.globalAlpha *= 0.45 + 0.2 * Math.sin(t * 1.3);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `10px ${CANVAS_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("z", mx + 20, my - 32 + Math.sin(t * 1.3) * 3);
  ctx.fillText("z", mx + 32, my - 44 + Math.sin(t * 1.3 + 0.9) * 3);
  ctx.restore();
}
