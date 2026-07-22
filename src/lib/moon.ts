// ============================================================================
// moon.ts — 달 위상 계산 + 픽셀 달 그리기 (§11 배경 달)
//
// 배경의 잠자는 달을 날짜에 따라 진짜 위상(신월→보름→그믐)으로 그리고,
// 사용자 위치(반구)에 따라 밝은 쪽을 뒤집는다. 남반구에서는 같은 초승달도
// 좌우가 반대로 보이기 때문이다. 클릭하면 음력 날짜(근사)를 알려주는
// 이스터에그의 계산도 여기서 맡는다.
//
// 정확한 한국 음력이 아니라 "달 나이(삭 이후 며칠)" 근사다 — 천문 위상은
// 맞지만 공식 음력과 하루쯤 다를 수 있어 표기는 "음력 약 N일"로 한다.
// ============================================================================

import { COLORS } from "./constants";

/** 삭망월(신월→신월) 평균 길이(일). */
const SYNODIC_MONTH = 29.530588853;
/** 기준 삭(신월) 시각 — 2000-01-06 18:14 UTC. 여기서부터 나이를 센다. */
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14);

/** 달의 위상 한 벌 — 그리기와 이스터에그가 함께 쓴다. */
export type MoonPhase = {
  /** 삭 이후 경과일 (0 ~ 29.53). */
  age: number;
  /** 밝은 면 비율 (0=신월, 1=보름). */
  illum: number;
  /** 차는 중인가? (참=초승→보름, 거짓=보름→그믐) */
  waxing: boolean;
  /** 위상 이름의 i18n 사전 키 (§2 — 표시는 화면 쪽에서 번역). */
  nameKey:
    | "moon.newMoon"
    | "moon.waxingCrescent"
    | "moon.firstQuarter"
    | "moon.waxingGibbous"
    | "moon.fullMoon"
    | "moon.waningGibbous"
    | "moon.lastQuarter"
    | "moon.waningCrescent";
  /** 위상 이모지. */
  emoji: string;
  /** 음력 근사 날짜 (1 ~ 30). */
  lunarDayApprox: number;
};

/** 특정 시각의 달 위상을 계산한다 (순수 함수). */
export function getMoonPhase(atMs: number): MoonPhase {
  const days = (atMs - NEW_MOON_EPOCH_MS) / 86400000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  // 위상각으로 밝은 면 비율 — (1 - cos)/2 (신월 0, 보름 1)
  const illum = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const waxing = age < SYNODIC_MONTH / 2;

  let nameKey: MoonPhase["nameKey"] = "moon.fullMoon";
  let emoji = "🌕";
  if (age < 1.5) {
    nameKey = "moon.newMoon";
    emoji = "🌑";
  } else if (age < 6.5) {
    nameKey = "moon.waxingCrescent";
    emoji = "🌒";
  } else if (age < 9) {
    nameKey = "moon.firstQuarter";
    emoji = "🌓";
  } else if (age < 13.5) {
    nameKey = "moon.waxingGibbous";
    emoji = "🌔";
  } else if (age < 16.5) {
    nameKey = "moon.fullMoon";
    emoji = "🌕";
  } else if (age < 20.5) {
    nameKey = "moon.waningGibbous";
    emoji = "🌖";
  } else if (age < 23) {
    nameKey = "moon.lastQuarter";
    emoji = "🌗";
  } else if (age < 28) {
    nameKey = "moon.waningCrescent";
    emoji = "🌘";
  } else {
    nameKey = "moon.newMoon";
    emoji = "🌑";
  }

  return { age, illum, waxing, nameKey, emoji, lunarDayApprox: Math.floor(age) + 1 };
}

/** 클릭 판정 — (px,py)가 달 중심(cx,cy) 반경 r 안인가? */
export function moonHitTest(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  return Math.hypot(px - cx, py - cy) < r;
}

/**
 * 픽셀 달을 그린다 (draw 전용, §12). 위상을 5단계 버킷으로 나눠 "밝은 면"과
 * "그늘"을 각각 채운다 — 픽셀 아트는 단계가 분명해야 산다 (§11).
 *
 * 밝은 쪽 방향: 북반구에서 차는 달(waxing)은 오른쪽이 밝다. 지는 달이거나
 * 남반구면 반대. 두 조건의 XOR로 "오른쪽이 밝은지"를 정한다.
 *
 * @param cx,cy 달 중심(px)
 * @param pixel 가상 픽셀 1칸 크기(px). 반지름은 4칸.
 * @param illum 밝은 면 비율 0~1
 * @param waxing 차는 중인가
 * @param south 남반구인가 (밝은 쪽을 뒤집는다)
 * @param t 누적 시간(초) — 잠자는 눈 표시 유지용(현재는 정적)
 */
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pixel: number,
  illum: number,
  waxing: boolean,
  south: boolean,
  t = 0,
): void {
  void t;
  // 위상 버킷: 0 신월 / 1 초승 / 2 반달 / 3 볼록 / 4 보름
  let bucket: 0 | 1 | 2 | 3 | 4;
  if (illum < 0.06) bucket = 0;
  else if (illum < 0.35) bucket = 1;
  else if (illum < 0.65) bucket = 2;
  else if (illum < 0.94) bucket = 3;
  else bucket = 4;

  // 오른쪽이 밝은가 — 북반구 차는 달=오른쪽. 지는 달/남반구면 반전(XOR).
  const litRight = waxing !== south;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pixel, pixel);

  // 원판 각 행의 반너비(가상 격자, 반지름 4칸의 계단식 원)
  const rows: Array<[number, number]> = [
    [-4, 2],
    [-3, 3],
    [-2, 4],
    [-1, 4],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 3],
    [4, 2],
  ];

  /** 한 행에서 [x0,x1) 구간을 채운다. */
  const fillRow = (y: number, x0: number, x1: number) => {
    if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
  };

  for (const [y, half] of rows) {
    // 신월이 아니면 밝은 면을, 아니면 어두운 테두리만
    if (bucket === 0) {
      // 신월 — 아주 흐린 원판 테두리만 (있는 듯 없는 듯)
      ctx.save();
      ctx.globalAlpha *= 0.18;
      ctx.fillStyle = COLORS.moonRock;
      fillRow(y, -half, half);
      ctx.restore();
      continue;
    }

    // 밝은 면의 경계 x (밝은 폭이 illum에 비례). litRight면 오른쪽부터 채운다.
    // bucket으로 폭을 양자화: 초승=가장자리 1칸, 반달=절반, 볼록=대부분, 보름=전부.
    let litFrac: number;
    if (bucket === 1) litFrac = 0.28;
    else if (bucket === 2) litFrac = 0.5;
    else if (bucket === 3) litFrac = 0.78;
    else litFrac = 1;

    const litWidth = Math.round(half * 2 * litFrac);
    // 어두운 부분 먼저(흐린 회색), 그 위에 밝은 부분
    ctx.save();
    ctx.globalAlpha *= 0.2;
    ctx.fillStyle = COLORS.moonRock;
    fillRow(y, -half, half);
    ctx.restore();

    ctx.fillStyle = COLORS.accent;
    if (bucket === 4) {
      fillRow(y, -half, half);
    } else if (litRight) {
      fillRow(y, half - litWidth, half);
    } else {
      fillRow(y, -half, -half + litWidth);
    }
  }

  // 잠자는 눈 — 밝은 면 위에 (신월엔 없음). 자는 중이라는 표시.
  if (bucket !== 0) {
    ctx.fillStyle = COLORS.space;
    const eyeX = litRight ? 1.5 : -2.5;
    ctx.fillRect(eyeX, -0.5, 1, 0.5);
  }

  ctx.restore();
}
