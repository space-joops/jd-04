// ============================================================================
// globe.ts — 궤도 모니터의 픽셀아트 지구본 씬 (§8-3, 줌 레벨 0)
//
// 위/경도를 직교 투영(orthographic)으로 화면에 찍는다. 그림 함수는 전부
// lib에 격리한다는 원칙(§11/§14)에 따라 orbit-view.tsx에서 이 파일로 옮겼다.
// 줍스 마커는 게임과 똑같은 drawMascot로 그려, 지구본 위에서도 "우리 애"가
// 한눈에 보이게 한다 (기능 3 — 네모 점 대신 마스코트).
// ============================================================================

import { COLORS } from "./constants";
import { drawMascot } from "./mascot";
import type { OrbitState } from "./orbit";

/** 위경도 한 점을 지구본 화면 좌표로. z<0이면 지구 반대편(안 보임). */
export function projectToGlobe(
  latDeg: number,
  lonDeg: number,
  spinDeg: number,
  radius: number,
): { x: number; y: number; z: number } {
  const latRad = (latDeg * Math.PI) / 180;
  // 카메라 정면 기준 상대 경도 — 큰 값이 들어와도 안전하게 접는다
  let rel = (lonDeg + spinDeg) % 360;
  if (rel > 180) rel -= 360;
  if (rel < -180) rel += 360;
  const lonRad = (rel * Math.PI) / 180;
  return {
    x: radius * Math.cos(latRad) * Math.sin(lonRad),
    y: -radius * Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lonRad),
  };
}

/** 지구본 원판 — 정수 행마다 폭을 계산해 찍는 계단식 원 (§11 도트 문법). */
export function drawGlobeDisc(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = COLORS.earth;
  const r = Math.round(radius);
  for (let y = -r; y <= r; y++) {
    const halfW = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    if (halfW > 0) ctx.fillRect(-halfW, y, halfW * 2, 1);
  }
}

/** 0~1 결정론적 해시 (backdrop.ts와 같은 공식) — 대륙 조각 위치 고정용. */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 지구본 장식용 대륙 조각 — 지리 정확도 아닌 "그럴듯한 파란 공" (§11). */
const CONTINENT_PATCHES = Array.from({ length: 40 }, (_, i) => ({
  lat: hash(i * 3 + 1) * 160 - 80,
  lon: hash(i * 3 + 2) * 360 - 180,
  size: 2 + hash(i * 3 + 3) * 2.5,
}));

/**
 * 지구본 씬 한 프레임을 그린다 (줌 레벨 0). 좌표계 원점이 지구 중심이라고
 * 가정한다 — 호출부에서 translate(cx, cy) 한 뒤 부른다. draw 전용(§12).
 *
 * @param radius 지구본 반지름(px)
 * @param spinDeg 장식용 자전각(도)
 * @param elapsed 누적 시간(초) — 마커 맥박용
 */
export function drawGlobeScene(
  ctx: CanvasRenderingContext2D,
  radius: number,
  state: OrbitState,
  track: Array<{ latDeg: number; lonDeg: number }>,
  spinDeg: number,
  elapsed: number,
): void {
  drawGlobeDisc(ctx, radius);

  // 대륙 조각 — 앞면(z>0.12)만
  for (const patch of CONTINENT_PATCHES) {
    const p = projectToGlobe(patch.lat, patch.lon, spinDeg, radius);
    if (p.z < 0.12) continue;
    const s = Math.max(1, Math.round(patch.size * p.z * 2));
    ctx.fillStyle = COLORS.land;
    ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
  }

  // 궤도 점선 — 작은 사각 도트 (곡선 금지, §11)
  ctx.fillStyle = COLORS.accent;
  for (const pt of track) {
    const p = projectToGlobe(pt.latDeg, pt.lonDeg, spinDeg, radius);
    if (p.z < 0.1) continue;
    ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
  }

  // 줍스 마커 — 앞면일 때만. 게임과 같은 마스코트를 작게(과하지 않게) 찍고,
  // 대륙에 묻히지 않게 노란 표적 도트 4개로 감싼다 (기능 3).
  // 호출부가 카메라를 줍스에 맞춰(spinDeg = -lonDeg) 항상 정면 중앙에 오므로,
  // "지구본에서 줍스가 어디 있는지" 늘 한눈에 보인다.
  const marker = projectToGlobe(state.latDeg, state.lonDeg, spinDeg, radius);
  if (marker.z > 0.05) {
    const mx = Math.round(marker.x);
    const my = Math.round(marker.y);
    const mr = Math.max(7, Math.round(radius * 0.07)); // 과하지 않게
    const reach = mr + 5; // 마스코트를 감싸도록
    const pulse = 0.7 + 0.3 * Math.sin(elapsed * 4);
    ctx.save();
    ctx.globalAlpha *= pulse;
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(mx - 1, my - reach, 2, 2);
    ctx.fillRect(mx - 1, my + reach - 2, 2, 2);
    ctx.fillRect(mx - reach, my - 1, 2, 2);
    ctx.fillRect(mx + reach - 2, my - 1, 2, 2);
    ctx.restore();
    // 마스코트 본체 — 게임과 똑같은 그림. 안테나가 위로 나오니 살짝 내려 앉힌다.
    drawMascot(ctx, mx, my, mr, 1, {
      gazeX: 0,
      gazeY: 0,
      blink: false,
      mouthOpen: 0,
    });
  }
}
