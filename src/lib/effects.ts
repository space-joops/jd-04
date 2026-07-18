// ============================================================================
// effects.ts — 팝업 글자 ("냠!", "아야!" 등)
//
// age/life 수명 패턴: 태어날 때 age=0, 매 프레임 age += dt,
// age가 life에 닿으면 게임 본체가 배열에서 제거한다.
// 스파크 입자는 백로그(§16) — 추가될 때도 이 파일에 같은 패턴으로 들어온다.
// ============================================================================

import { CANVAS_FONT, COLORS } from "./constants";

/** 떠오르는 팝업 글자 하나. */
export type Popup = {
  text: string;
  x: number;
  y: number;
  age: number; // 태어난 뒤 흐른 시간(초)
  life: number; // 수명(초)
  color: string;
};

/** 팝업 수명 0.85초, 위로 34px/s, 수명의 70%까진 완전 불투명 (§10). */
const LIFE = 0.85;
const RISE_SPEED = 34;
const SOLID_UNTIL = 0.7;

export function makePopup(
  text: string,
  x: number,
  y: number,
  color: string = COLORS.ink,
): Popup {
  return { text, x, y, age: 0, life: LIFE, color };
}

/** 위로 떠오르며 나이를 먹는다. 제거 판단(age >= life)은 게임 본체가 한다. */
export function stepPopup(p: Popup, dt: number): void {
  p.age += dt;
  p.y -= RISE_SPEED * dt;
}

/**
 * 팝업을 그린다. "충분히 보여준 다음 사라진다" — 수명의 70%까지는 완전
 * 불투명을 유지하고 남은 30% 동안만 페이드아웃한다 (§10).
 */
export function drawPopup(ctx: CanvasRenderingContext2D, p: Popup): void {
  const t = p.age / p.life;
  const alpha = t < SOLID_UNTIL ? 1 : Math.max(0, 1 - (t - SOLID_UNTIL) / (1 - SOLID_UNTIL));

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `700 22px ${CANVAS_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 배경색 두꺼운 테두리 + 채움 — 어떤 배경 위에서도 읽힌다 (§10)
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.space;
  ctx.strokeText(p.text, p.x, p.y);
  ctx.fillStyle = p.color;
  ctx.fillText(p.text, p.x, p.y);
  ctx.restore();
}
