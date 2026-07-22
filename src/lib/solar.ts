// ============================================================================
// solar.ts — 줌아웃 씬: 지구+공전 달, 태양계 (§8-3 기능 6)
//
// 지구본에서 줌아웃하면 스케일이 커진다: 레벨 1은 지구와 "진짜로 공전하는
// 달"(배경의 잠자던 가짜 달 말고), 레벨 2는 태양계 전체. 시간 가속(기능 4)을
// 걸면 달과 행성이 실제 주기 비율대로 돈다 — 안쪽 행성일수록 빠르게.
//
// 거리는 실제 비율이 아니라 등간격으로 눌러 담는다(바깥 행성까지 화면에
// 담기게). "진짜(약간) 시뮬레이션"이 목적이지 축척 모형이 아니다 (§8-3 정신).
// ============================================================================

import { CANVAS_FONT, COLORS } from "./constants";

const DAY_MS = 86400000;

/** 0~1 결정론적 해시 — 행성 초기 위상을 제각각으로 (다 일직선이면 가짜 같다). */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 공전 각도 — 주기(일)와 현재 시각(ms)으로. 씨앗 위상을 더해 흩는다. */
function angleAt(periodDays: number, atMs: number, phaseSeed: number): number {
  return 2 * Math.PI * (atMs / DAY_MS / periodDays + hash(phaseSeed));
}

/** 색 픽셀 원판 — globe.ts의 지구 원판을 임의 색·반지름으로 일반화. */
function drawDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const r = Math.round(radius);
  for (let y = -r; y <= r; y++) {
    const halfW = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    if (halfW > 0) ctx.fillRect(Math.round(cx) - halfW, Math.round(cy) + y, halfW * 2, 1);
  }
}

/** 점선 궤도 링 — 작은 사각 도트를 원둘레에 나열 (곡선 금지 §11). */
function drawOrbitRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dots = 48,
): void {
  ctx.save();
  ctx.globalAlpha *= 0.28;
  ctx.fillStyle = COLORS.ink;
  for (let i = 0; i < dots; i++) {
    const a = (i / dots) * 2 * Math.PI;
    ctx.fillRect(
      Math.round(cx + Math.cos(a) * radius) - 1,
      Math.round(cy + Math.sin(a) * radius) - 1,
      2,
      2,
    );
  }
  ctx.restore();
}

/**
 * 줌 레벨 1 — 지구와 공전하는 달. 원점은 캔버스 중심이라 가정(호출부에서
 * translate). size는 min(w,h). draw 전용(§12).
 */
export function drawEarthMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  atMs: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const earthR = Math.max(10, Math.min(w, h) * 0.09);
  const moonOrbit = Math.min(w, h) * 0.36;

  drawOrbitRing(ctx, cx, cy, moonOrbit);

  // 지구 — 파란 원판 + 대륙 몇 조각
  drawDisc(ctx, cx, cy, earthR, COLORS.earth);
  ctx.fillStyle = COLORS.land;
  for (let i = 0; i < 8; i++) {
    const a = hash(i * 5 + 1) * 2 * Math.PI;
    const rr = hash(i * 5 + 2) * earthR * 0.7;
    const s = 2 + Math.floor(hash(i * 5 + 3) * 2) * 2;
    ctx.fillRect(
      Math.round(cx + Math.cos(a) * rr - s / 2),
      Math.round(cy + Math.sin(a) * rr - s / 2),
      s,
      s,
    );
  }

  // 달 — 회색 원판이 실제 주기(27.32일) 비율로 공전
  const ma = angleAt(27.32, atMs, 71);
  const mx = cx + Math.cos(ma) * moonOrbit;
  const my = cy + Math.sin(ma) * moonOrbit;
  drawDisc(ctx, mx, my, Math.max(3, earthR * 0.27), COLORS.moonRock);

  // 줍스 — 지구 바로 위 저궤도(빠른 안쪽 링)의 작은 노란 점
  const ja = angleAt(92.8 / 1440, atMs, 12); // 92.8분을 일로 환산
  const jr = earthR + Math.max(6, earthR * 0.5);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(
    Math.round(cx + Math.cos(ja) * jr) - 2,
    Math.round(cy + Math.sin(ja) * jr) - 2,
    4,
    4,
  );
  ctx.fillStyle = COLORS.mascot;
  ctx.fillRect(
    Math.round(cx + Math.cos(ja) * jr) - 1,
    Math.round(cy + Math.sin(ja) * jr) - 1,
    2,
    2,
  );
}

/** 태양계 행성 데이터 — (이름, 공전주기[일], 색). 거리는 등간격으로 배치. */
const PLANETS: Array<[string, number, string]> = [
  ["MERCURY", 88, COLORS.mercury],
  ["VENUS", 224.7, COLORS.venus],
  ["EARTH", 365.25, COLORS.earth],
  ["MARS", 687, COLORS.mars],
  ["JUPITER", 4333, COLORS.jupiter],
  ["SATURN", 10759, COLORS.saturn],
  ["URANUS", 30687, COLORS.uranus],
  ["NEPTUNE", 60190, COLORS.neptune],
];

/** 줌 레벨 2 — 태양계 전체. 지구에 "YOU ARE HERE". draw 전용(§12). */
export function drawSolarSystem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  atMs: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.46;
  const innerR = Math.min(w, h) * 0.12;
  const step = (maxR - innerR) / (PLANETS.length - 1);

  // 태양 — 가운데, 은은한 글로우
  ctx.save();
  ctx.globalAlpha *= 0.25;
  drawDisc(ctx, cx, cy, Math.min(w, h) * 0.09, COLORS.sun);
  ctx.restore();
  drawDisc(ctx, cx, cy, Math.max(5, Math.min(w, h) * 0.05), COLORS.sun);

  PLANETS.forEach(([name, period, color], i) => {
    const ringR = innerR + step * i;
    drawOrbitRing(ctx, cx, cy, ringR, 40);
    const a = angleAt(period, atMs, i * 13 + 3);
    const px = cx + Math.cos(a) * ringR;
    const py = cy + Math.sin(a) * ringR;
    const pr = name === "JUPITER" || name === "SATURN" ? 4 : 3;
    drawDisc(ctx, px, py, pr, color);

    if (name === "EARTH") {
      // 지구 강조 — 노란 표적 링 + 작은 달 + "YOU ARE HERE"
      ctx.save();
      ctx.globalAlpha *= 0.9;
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 7, 2, 2);
      ctx.fillRect(Math.round(px) - 1, Math.round(py) + 5, 2, 2);
      ctx.fillRect(Math.round(px) - 7, Math.round(py) - 1, 2, 2);
      ctx.fillRect(Math.round(px) + 5, Math.round(py) - 1, 2, 2);
      ctx.font = `6px ${CANVAS_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = COLORS.accent;
      ctx.fillText("YOU ARE HERE", px, py - 8);
      ctx.restore();
    }
  });
}
