// ============================================================================
// worldmap.ts — 2D 정방형(equirectangular) 세계지도 (§8-3 기능 2)
//
// 지구본(globe.ts)이 "지금 보이는 반구"만 보여준다면, 이 평평한 지도는 줍스의
// 궤도 전체가 지구를 어떻게 가로지르는지 한눈에 보여준다 (위성추적기의 그
// S자 지상궤적). 대륙은 GeoJSON 같은 실제 데이터 없이, 몇 개의 "대륙 얼룩
// (blob)"으로 픽셀 격자를 칠해 만든다 — 지리적 정확도가 아니라 "그럴듯한
// 픽셀 지구"가 목적이라는 §11 정신 그대로.
// ============================================================================

import { CANVAS_FONT, COLORS, type MascotVariantId } from "./constants";
import { drawMascot } from "./mascot";
import type { OrbitState } from "./orbit";

/** 지도 격자 해상도 — 칸이 굵어야 픽셀 톤이 산다. */
const COLS = 64;
const ROWS = 32;

/** 대륙 얼룩 — (경도중심, 위도중심, 경도반경, 위도반경). 지리 근사일 뿐. */
const BLOBS: Array<[number, number, number, number]> = [
  [-100, 45, 35, 26], // 북미
  [-140, 62, 24, 14], // 알래스카·캐나다 북서
  [-60, -20, 17, 32], // 남미
  [-42, 72, 15, 9], // 그린란드
  [20, 3, 22, 33], // 아프리카
  [15, 52, 22, 12], // 유럽
  [95, 50, 55, 24], // 아시아
  [78, 22, 12, 14], // 인도
  [118, 2, 20, 10], // 동남아·인도네시아
  [134, -25, 20, 12], // 호주
];

/** 0~1 결정론적 해시 (backdrop.ts와 같은 공식) — 해안선 지터용. */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 한 칸이 육지인지 — 얼룩 안이면 육지, 가장자리는 살짝 흐트러뜨려 도트 해안선. */
function isLand(lon: number, lat: number, idx: number): boolean {
  // 남극 — 아래쪽 위도대는 통째로 육지
  if (lat < -62) return true;
  for (const [blon, blat, rlon, rlat] of BLOBS) {
    let dl = lon - blon;
    if (dl > 180) dl -= 360;
    if (dl < -180) dl += 360;
    const d = (dl / rlon) ** 2 + ((lat - blat) / rlat) ** 2;
    // 경계(0.8~1.0)에서 해시로 들쭉날쭉하게 — 완벽한 타원은 인공적이다
    if (d < 0.8 || (d < 1.05 && hash(idx) < 0.5)) return true;
  }
  return false;
}

/** 육지 격자를 모듈 로드 시 한 번만 계산한다 (매 프레임 재계산 방지). */
const LANDMASK: boolean[] = (() => {
  const mask: boolean[] = [];
  for (let r = 0; r < ROWS; r++) {
    const lat = 90 - (r + 0.5) * (180 / ROWS);
    for (let c = 0; c < COLS; c++) {
      const lon = -180 + (c + 0.5) * (360 / COLS);
      mask[r * COLS + c] = isLand(lon, lat, r * COLS + c);
    }
  }
  return mask;
})();

/** 위경도 → 평면 지도 화면 좌표. */
function lonLatToXY(lon: number, lat: number, w: number, h: number) {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

/** 부태양점(경도) — 지금 태양이 머리 위인 경도. 주야 경계(터미네이터)용. */
function subsolarLonDeg(atMs: number): number {
  const d = new Date(atMs);
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60;
  let lon = 180 - utcHours * 15;
  lon = ((lon + 540) % 360) - 180;
  return lon;
}

/**
 * 세계지도 한 프레임을 그린다 (draw 전용, §12). 자체 배경까지 칠하므로
 * 호출부는 이 캔버스에 대해 따로 배경을 그릴 필요가 없다.
 */
export function drawWorldMap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: OrbitState,
  track: Array<{ latDeg: number; lonDeg: number }>,
  atMs: number,
  variant: MascotVariantId = "mint",
): void {
  const cw = w / COLS;
  const ch = h / ROWS;

  // 바다 바탕
  ctx.fillStyle = COLORS.space;
  ctx.fillRect(0, 0, w, h);

  // 육지 칸
  ctx.fillStyle = COLORS.land;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (LANDMASK[r * COLS + c]) {
        ctx.fillRect(Math.floor(c * cw), Math.floor(r * ch), Math.ceil(cw), Math.ceil(ch));
      }
    }
  }

  // 밤 반구 — 부태양점에서 경도로 90° 넘게 떨어진 칸을 어둡게 덮는다
  const subLon = subsolarLonDeg(atMs);
  ctx.save();
  ctx.globalAlpha *= 0.38;
  ctx.fillStyle = COLORS.space;
  for (let c = 0; c < COLS; c++) {
    const lon = -180 + (c + 0.5) * (360 / COLS);
    let dl = Math.abs(lon - subLon);
    if (dl > 180) dl = 360 - dl;
    if (dl > 90) ctx.fillRect(Math.floor(c * cw), 0, Math.ceil(cw), h);
  }
  ctx.restore();

  // 경위도 격자 — 아주 연하게
  ctx.save();
  ctx.globalAlpha *= 0.12;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lon = -120; lon < 180; lon += 60) {
    const x = ((lon + 180) / 360) * w;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let lat = -60; lat < 90; lat += 30) {
    const y = ((90 - lat) / 180) * h;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();

  // 지상궤적 — 도트 나열(선이 아니라 점이라 경도 wrap 걱정이 없다, §11)
  ctx.fillStyle = COLORS.accent;
  for (const pt of track) {
    const { x, y } = lonLatToXY(pt.lonDeg, pt.latDeg, w, h);
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  }

  // 줍스 마커 — 지구본과 똑같이 마스코트로 (기능 3)
  const { x, y } = lonLatToXY(state.lonDeg, state.latDeg, w, h);
  const mr = 6;
  ctx.save();
  ctx.globalAlpha *= 0.75 + 0.25 * Math.sin((atMs / 1000) * 4);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 9, 2, 2);
  ctx.fillRect(Math.round(x) - 1, Math.round(y) + 7, 2, 2);
  ctx.fillRect(Math.round(x) - 9, Math.round(y) - 1, 2, 2);
  ctx.fillRect(Math.round(x) + 7, Math.round(y) - 1, 2, 2);
  ctx.restore();
  drawMascot(
    ctx,
    Math.round(x),
    Math.round(y - 1),
    mr,
    1,
    { gazeX: 0, gazeY: 0, blink: false, mouthOpen: 0 },
    variant,
  );

  // 좌상단 라벨
  ctx.save();
  ctx.globalAlpha *= 0.5;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `6px ${CANVAS_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("EQUIRECTANGULAR", 4, 4);
  ctx.restore();
}
