// ============================================================================
// effects.ts — 팝업 글자 ("YUM!", "OUCH!" 등) + 스파크 입자
//
// age/life 수명 패턴: 태어날 때 age=0, 매 프레임 age += dt,
// age가 life에 닿으면 게임 본체가 배열에서 제거한다.
// 팝업과 스파크 모두 같은 패턴 — 이펙트는 전부 이 파일에 모은다.
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

// ----------------------------------------------------------------------------
// 스파크 입자 (§10) — 먹기/피격 순간 사방으로 튀는 네모 도트
// ----------------------------------------------------------------------------

/** 스파크 도트 하나. Popup과 같은 age/life 수명 패턴. */
export type Spark = {
  x: number;
  y: number;
  vx: number; // 방사 속도(px/s) — 감쇠하며 흩어진다
  vy: number;
  age: number;
  life: number;
  size: number; // 도트 한 변(px) — 픽셀 아트답게 정수만
  color: string;
};

/**
 * 한 지점에서 사방으로 스파크를 터뜨린다.
 * 먹으면 먹이색 7개, 피격이면 빨강 10개 (§10).
 */
export function makeSparks(
  x: number,
  y: number,
  color: string,
  count: number,
): Spark[] {
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    // 각도를 균등 분할하고 지터만 살짝 — 완전 랜덤이면 한쪽에 뭉치고,
    // 완전 균등이면 기계 같다. 불규칙성도 설계다 (§9와 같은 정신).
    const a = ((i + Math.random() * 0.8) / count) * Math.PI * 2;
    const speed = 70 + Math.random() * 110;
    sparks.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      age: 0,
      life: 0.3 + Math.random() * 0.25,
      size: 2 + Math.floor(Math.random() * 3), // 2~4px 정수
      color,
    });
  }
  return sparks;
}

/** 흩어지며 감속한다 — 우주라 중력 대신 지수 감쇠. 제거 판단은 게임 본체가. */
export function stepSpark(s: Spark, dt: number): void {
  s.age += dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.vx -= s.vx * 4 * dt;
  s.vy -= s.vy * 4 * dt;
}

/** 수명 마지막 40%에서 페이드아웃. 원이 아니라 네모 도트 — 픽셀 문법 (§11). */
export function drawSpark(ctx: CanvasRenderingContext2D, s: Spark): void {
  const t = s.age / s.life;
  ctx.save();
  ctx.globalAlpha *= t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
  ctx.fillStyle = s.color;
  // 좌표 내림 — 소수 좌표는 안티앨리어싱으로 도트가 뭉개진다 (§11)
  ctx.fillRect(
    Math.floor(s.x - s.size / 2),
    Math.floor(s.y - s.size / 2),
    s.size,
    s.size,
  );
  ctx.restore();
}
