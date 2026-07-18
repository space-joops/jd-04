// ============================================================================
// debris.ts — 낙하물(우주쓰레기) 데이터 + 물리 + 종류별 그림
//
// 클래스/상속 없이 "평범한 객체 + 순수 함수(make/step/draw)" 구조 (§12).
// - makeJunk: 데이터 만들기
// - stepJunk: 물리 한 걸음 (상태만 바꾸고 캔버스는 안 건드림)
// - drawJunk: 그리기 (읽기만 하고 상태는 안 바꿈)
// ============================================================================

import { COLORS, FOOD_KINDS, JUNK_COLORS, type JunkKind } from "./constants";

/** 낙하물 하나. */
export type Junk = {
  kind: JunkKind;
  /**
   * x는 "매 프레임 x0 + sin 흔들림"으로 다시 계산되는 파생값이다.
   * 자석 효과 등으로 낙하물을 옮기고 싶으면 x가 아니라 중심축 x0를 옮겨야
   * 한다 — x를 옮겨봐야 다음 프레임에 도로 튕겨 돌아온다 (§7 ⚠️).
   */
  x: number;
  x0: number; // 좌우 흔들림의 중심축
  y: number;
  vy: number; // 낙하 속도(px/s)
  size: number; // 판정·그림의 기준 크기(px)
  sway: number; // 흔들림 진폭(px)
  swayT: number; // 흔들림 위상(누적 시간)
  swaySpeed: number; // 흔들림 각속도
  rot: number; // 자체 회전 각(rad)
  rotSpeed: number; // 회전 속도(rad/s)
  /** -1이면 평소. 0 이상이면 "꿀꺽"(입으로 빨려 들어가는 중) 경과 시간(초). */
  eatT: number;
};

/** 먹이인가? (가시만 위험물이고 나머지는 전부 먹이) */
export function isFood(j: Junk): boolean {
  return j.kind !== "hazard";
}

/**
 * 이번에 스폰할 종류를 고른다 (§9).
 * 1) 별 보너스 7% 고정 (난이도 무관 — 언제나 같은 희망)
 * 2) 가시: 10%에서 시작해 난이도에 비례해 최대 23%
 * 3) 나머지: 먹이 5종(연료 포함) 균등
 *
 * @param allowHazard 타이틀 데모에서는 false — 구경 중 찔리는 연출 방지 (§4)
 */
export function pickKind(difficulty: number, allowHazard: boolean): JunkKind {
  if (Math.random() < 0.07) return "star";
  const hazardChance = allowHazard ? 0.1 + 0.13 * difficulty : 0;
  if (Math.random() < hazardChance) return "hazard";
  return FOOD_KINDS[Math.floor(Math.random() * FOOD_KINDS.length)];
}

/**
 * 낙하물을 하나 만든다. 화면 위 바깥(y=-60)에서 등장한다 (§5).
 *
 * @param w 화면 너비 — 등장 x 범위를 정하는 데 쓴다
 * @param speedScale 낙하 속도 배율 (난이도 반영 값, 데모는 0.6배)
 */
export function makeJunk(kind: JunkKind, w: number, speedScale: number): Junk {
  // 먹이 13~19px, 가시 16~24px (§5)
  const size =
    kind === "hazard" ? 16 + Math.random() * 8 : 13 + Math.random() * 6;
  const x0 = 20 + Math.random() * Math.max(1, w - 40); // 가장자리 20px는 피해서
  return {
    kind,
    x: x0,
    x0,
    y: -60,
    vy: (55 + Math.random() * 45) * speedScale, // 기본 55~100px/s (§9)
    size,
    sway: 10 + Math.random() * 18,
    swayT: Math.random() * Math.PI * 2, // 위상을 흩어 놓아야 군무가 안 된다
    swaySpeed: 1 + Math.random() * 1.4,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() * 2 - 1) * 1.6, // 시계/반시계 랜덤
    eatT: -1,
  };
}

/**
 * 물리 한 걸음: 낙하 + 좌우 sin 흔들림 + 자체 회전 (§5).
 * 모든 이동은 ×dt — 프레임레이트가 달라도 같은 속도 (§12).
 * "꿀꺽" 중의 이동(입으로 빨려 들어가기)은 게임 본체가 담당한다.
 */
export function stepJunk(j: Junk, dt: number): void {
  j.y += j.vy * dt;
  j.swayT += j.swaySpeed * dt;
  j.rot += j.rotSpeed * dt;
  j.x = j.x0 + Math.sin(j.swayT) * j.sway; // x는 언제나 x0에서 파생
}

/**
 * X자 눈 하나를 그린다 (캔의 어질어질한 표정용).
 * 도트(fillRect)만으로는 대각선이 안 나오므로, 십자 막대를 45° 돌려서 만든다.
 * 픽셀 문법의 예외지만 이 크기(2~3px)에서는 도트 X와 구분되지 않는다.
 */
function drawXEye(ctx: CanvasRenderingContext2D, ex: number, ey: number): void {
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-0.75, -0.25, 1.5, 0.5);
  ctx.fillRect(-0.25, -0.75, 0.5, 1.5);
  ctx.restore();
}

/**
 * 낙하물 그리기. 픽셀 아트 — 종류는 색+도트 실루엣+표정으로 구분한다 (§11).
 * "무표정한 물체는 없다" (§5) — 종류마다 성격이 다른 도트 얼굴을 갖는다.
 * 그리기 함수를 이 파일에 격리해 두었으므로, 아트 스타일을 갈아탈 때
 * 여기만 갈아 끼우면 된다.
 *
 * 픽셀 격자 방식(마스코트와 동일): 도형을 -4~+4 범위의 "가상 픽셀" 좌표로
 * 찍고 ctx.scale(s/4)로 확대한다. size가 달라도 도트 실루엣은 같다.
 *
 * @param scale "꿀꺽" 연출용 축소 배율 (1이 원래 크기)
 */
export function drawJunk(
  ctx: CanvasRenderingContext2D,
  j: Junk,
  scale = 1,
): void {
  const s = j.size;
  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.rotate(j.rot);

  // 가상 픽셀 1칸 = s/4 px. 꿀꺽 축소(scale)도 여기에 곱한다
  ctx.scale(scale * (s / 4), scale * (s / 4));

  switch (j.kind) {
    case "satellite": {
      // 몸통 세로 사각형 + 양쪽 태양전지판 — 전지판을 몸통과 1칸 띄워
      // "날개 달린" 실루엣을 만든다
      ctx.fillStyle = JUNK_COLORS.satellite;
      ctx.fillRect(-4, -1, 3, 2); // 왼쪽 전지판
      ctx.fillRect(1, -1, 3, 2); // 오른쪽 전지판
      ctx.fillRect(-2, -3, 4, 6); // 몸통
      // 웃는 얼굴 — 눈 두 개 + 입꼬리가 올라간 ∪ 입 (§5 "무표정한 물체는 없다")
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-2, -2, 1, 1); // 왼눈
      ctx.fillRect(1, -2, 1, 1); // 오른눈
      ctx.fillRect(-2, 0, 1, 1); // 입꼬리 왼쪽 (한 칸 위 — 이게 웃음을 만든다)
      ctx.fillRect(1, 0, 1, 1); // 입꼬리 오른쪽
      ctx.fillRect(-1, 1, 2, 1); // 입 가운데
      break;
    }
    case "bolt": {
      // 세로+가로 사각형을 십자로 겹쳐 팔각형(볼트 머리)을 근사
      ctx.fillStyle = JUNK_COLORS.bolt;
      ctx.fillRect(-2, -3, 4, 6);
      ctx.fillRect(-3, -2, 6, 4);
      // 놀란 얼굴 — 볼트의 정체성인 가운데 구멍이 그대로 "오!" 하는 입이 된다
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-2, -2, 1, 1); // 왼눈
      ctx.fillRect(1, -2, 1, 1); // 오른눈
      ctx.fillRect(-1, 0, 2, 2); // 구멍 = 동그란 입 (원래보다 한 칸 아래)
      break;
    }
    case "can": {
      // 캔 몸통 + 위아래 뚜껑 띠(배경색 가로줄)로 "캔 주름"을 표현
      ctx.fillStyle = JUNK_COLORS.can;
      ctx.fillRect(-2, -3, 4, 6);
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-2, -2, 4, 1); // 위 뚜껑 선
      ctx.fillRect(-2, 2, 4, 1); // 아래 뚜껑 선
      // 어질어질한 얼굴 — 다 마셔서 버려진 캔이니까 X자 눈 (§5)
      drawXEye(ctx, -1, -0.5);
      drawXEye(ctx, 1, -0.5);
      ctx.fillRect(-0.5, 0.75, 1, 0.75); // 반쯤 벌어진 작은 입
      break;
    }
    case "spring": {
      // 좌우 번갈아 찍는 2×1 도트 8개 — 지그재그 코일
      ctx.fillStyle = JUNK_COLORS.spring;
      ctx.fillRect(-2, -4, 2, 1);
      ctx.fillRect(0, -3, 2, 1);
      ctx.fillRect(-2, -2, 2, 1);
      ctx.fillRect(0, -1, 2, 1);
      ctx.fillRect(-2, 0, 2, 1);
      ctx.fillRect(0, 1, 2, 1);
      ctx.fillRect(-2, 2, 2, 1);
      ctx.fillRect(0, 3, 2, 1);
      // 맨 위 코일이 얼굴 — 몸이 다 용수철이라 얼굴 자리는 여기뿐 (§5)
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-1.75, -3.75, 0.5, 0.5); // 왼눈 (점눈 — 코일 폭에 맞춘 미니 사이즈)
      ctx.fillRect(-0.75, -3.75, 0.5, 0.5); // 오른눈
      break;
    }
    case "hazard": {
      // 십자 스파이크 + 코어. 그림은 ±4칸(=size)까지 뻗지만 판정은
      // size×0.75 — "보이는 것보다 판정이 작게"의 황금률 (§7)
      ctx.fillStyle = JUNK_COLORS.hazard;
      ctx.fillRect(-1, -4, 2, 8); // 세로 가시
      ctx.fillRect(-4, -1, 8, 2); // 가로 가시
      ctx.fillRect(-2, -2, 4, 4); // 코어
      // 화난 얼굴 — 유일하게 못된 표정. 색(빨강)과 표정이 같은 말을 해야
      // 0.3초 안에 "저건 피해야 해"가 전달된다 (§5)
      ctx.fillStyle = COLORS.space;
      // 안쪽이 내려간 눈썹 = 화남. 대각선은 회전 막대로 (drawXEye와 같은 트릭)
      ctx.save();
      ctx.translate(-1, -1.4);
      ctx.rotate(0.45);
      ctx.fillRect(-0.7, -0.2, 1.4, 0.45);
      ctx.restore();
      ctx.save();
      ctx.translate(1, -1.4);
      ctx.rotate(-0.45);
      ctx.fillRect(-0.7, -0.2, 1.4, 0.45);
      ctx.restore();
      ctx.fillRect(-1.5, -0.6, 1, 1); // 왼눈
      ctx.fillRect(0.5, -0.6, 1, 1); // 오른눈
      ctx.fillRect(-1, 0.8, 2, 1); // 으르렁 입
      break;
    }
    case "fuel": {
      // 배터리 실루엣 — 몸통 + 위 전극 돌기
      ctx.fillStyle = JUNK_COLORS.fuel;
      ctx.fillRect(-2, -3, 4, 6); // 배터리 몸통
      ctx.fillRect(-1, -4, 2, 1); // 전극
      // 활짝 웃는 얼굴 — 에너지 만땅이라 제일 신났다 (§5)
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-2, -2, 1, 1); // 왼눈
      ctx.fillRect(1, -2, 1, 1); // 오른눈
      ctx.fillRect(-1.5, 0, 3, 1.5); // 크게 벌린 입
      break;
    }
    case "star": {
      // 별 보너스 (§5). 맥박 뛰듯 커졌다 작아진다 — "특별한 아이"라는 신호.
      // swayT를 심장 박동 시계로 재활용 (별도 타이머를 늘리지 않기 위해).
      const pulse = 1 + 0.12 * Math.sin(j.swayT * 5);
      ctx.scale(pulse, pulse);
      // 5각 별 — 가로줄을 계단식으로 쌓아 만든 도트 별.
      // ⚠️ 가시(십자 실루엣)와 절대 닮으면 안 된다 — 하나는 잡고 하나는 피한다.
      ctx.fillStyle = JUNK_COLORS.star;
      ctx.fillRect(-0.5, -4, 1, 1); // 꼭대기 꼭짓점
      ctx.fillRect(-1, -3, 2, 1);
      ctx.fillRect(-4, -2, 8, 1); // 좌우 꼭짓점 (가장 넓은 줄)
      ctx.fillRect(-3, -1, 6, 1);
      ctx.fillRect(-2, 0, 4, 1);
      ctx.fillRect(-2.5, 1, 2, 1); // 왼 다리 (여기서 둘로 갈라진다)
      ctx.fillRect(0.5, 1, 2, 1); // 오른 다리
      ctx.fillRect(-3.5, 2, 2, 1); // 왼 다리 끝
      ctx.fillRect(1.5, 2, 2, 1); // 오른 다리 끝
      // 반짝반짝 신난 얼굴 (§5)
      ctx.fillStyle = COLORS.space;
      ctx.fillRect(-1.5, -1.5, 1, 1); // 왼눈
      ctx.fillRect(0.5, -1.5, 1, 1); // 오른눈
      ctx.fillRect(-1, -0.25, 2, 0.75); // 방긋 입
      break;
    }
  }

  ctx.restore();
}
