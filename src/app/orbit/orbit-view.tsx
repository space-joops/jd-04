"use client";

// ============================================================================
// orbit-view.tsx — 궤도 모니터 화면 본체 (§8-3)
//
// 펫의 uuid로 만든 궤도(src/lib/orbit.ts)를 캔버스에 픽셀아트 지구본으로,
// 수치는 HTML telemetry 카드로 보여준다. 게임 본체와 같은 원칙(§12)을
// 따른다 — 캔버스는 매 프레임(rAF), React state는 가끔(telemetry는 초당
// 2회로 스로틀)만 갱신한다.
// ============================================================================

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "@/lib/canvas";
import { drawBackdrop } from "@/lib/backdrop";
import { COLORS } from "@/lib/constants";
import {
  type OrbitElements,
  type OrbitState,
  generateOrbitElements,
  getOrbitState,
  sampleGroundTrack,
} from "@/lib/orbit";
import { type StoredPet, loadPet } from "@/lib/storage";

/** telemetry React state 갱신 주기(초) — 캔버스는 매 프레임, 숫자는 가끔(§12). */
const TELEMETRY_INTERVAL = 0.5;
/** 캔버스 dt 상한(초) — 백그라운드 탭 복귀 시 순간이동 방지 (§12). */
const MAX_DT = 0.05;
/** 지구본 장식용 자전 속도(도/초) — 실제 자전과 무관, "보는 맛"용. */
const GLOBE_SPIN_DEG_PER_SEC = 6;

/** 대륙 조각 장식 — 지리적 정확도는 목표가 아니다 (§11, backdrop.ts와 같은 정신).
 * (lat, lon, size)를 해시로 고정해 두어 매번 같은 모양의 지구가 보이게 한다. */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
// 전체 구를 8분면쯤으로 나눠 보이니, 어느 각도에서 봐도 앞면에 몇 개는
// 걸리도록 넉넉히 40개를 뿌린다 (14개로는 대부분 텅 빈 파란 공만 보였다).
const CONTINENT_PATCHES = Array.from({ length: 40 }, (_, i) => ({
  lat: hash(i * 3 + 1) * 160 - 80,
  lon: hash(i * 3 + 2) * 360 - 180,
  size: 2 + hash(i * 3 + 3) * 2.5,
}));

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * -180~180 범위로 접어 넣는다. `(deg+540)%360-180` 트릭은 JS `%`의 부호가
 * 피제수를 따라가는 특성 때문에 큰 입력에서 범위를 벗어난다(orbit.ts와
 * 같은 함정) — 먼저 `%360`으로 크기만 줄인 다음 부호에 따라 한 번만 보정.
 */
function normalizeDeg(deg: number): number {
  const d = deg % 360;
  if (d > 180) return d - 360;
  if (d < -180) return d + 360;
  return d;
}

/** 위/경도를 화면 정면 기준 직교 투영으로 변환한다 (z<0이면 지구 반대편). */
function projectToGlobe(
  latDeg: number,
  lonDeg: number,
  spinDeg: number,
  radius: number,
): { x: number; y: number; z: number } {
  const latRad = toRad(latDeg);
  const lonRad = toRad(normalizeDeg(lonDeg + spinDeg));
  return {
    x: radius * Math.cos(latRad) * Math.sin(lonRad),
    y: -radius * Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lonRad),
  };
}

/** 지구본 원판 — 정수 행마다 폭을 계산해 찍는 계단식 원 (backdrop.ts 정지궤도 지구의 확장판). */
function drawGlobeDisc(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = COLORS.earth;
  const r = Math.round(radius);
  for (let y = -r; y <= r; y++) {
    const halfW = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    if (halfW > 0) ctx.fillRect(-halfW, y, halfW * 2, 1);
  }
}

function TelemetryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-1 border-2 border-white/15 bg-black/30 px-3 py-2 text-left">
      <span className="font-pixel text-[9px] tracking-widest text-gray-400">
        {label}
      </span>
      <span className="font-pixel text-sm text-white">{value}</span>
    </div>
  );
}

export function OrbitView() {
  // undefined = 아직 localStorage를 못 읽음 (서버 렌더와 첫 클라이언트 렌더 불일치 방지)
  const [pet, setPet] = useState<StoredPet | null | undefined>(undefined);
  const [telemetry, setTelemetry] = useState<OrbitState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPet(loadPet());
  }, []);

  useEffect(() => {
    if (!pet) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let { w, h } = fitCanvas(canvas);
    const elements: OrbitElements = generateOrbitElements(pet.id);

    let elapsed = 0;
    let telemetryTimer = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (
      spinDeg: number,
      state: OrbitState,
      track: Array<{ latDeg: number; lonDeg: number }>,
    ) => {
      // 별·격자만(surface=false) — 지구본은 여기서 직접 큰 원으로 그린다
      drawBackdrop(ctx, w, h, elapsed, 0, false);

      const cx = w / 2;
      const cy = h * 0.42;
      const radius = Math.min(w, h) * 0.3;

      ctx.save();
      ctx.translate(cx, cy);
      drawGlobeDisc(ctx, radius);

      // 대륙 조각 — 뒷면(z<0.12)은 건너뛴다
      for (const patch of CONTINENT_PATCHES) {
        const p = projectToGlobe(patch.lat, patch.lon, spinDeg, radius);
        if (p.z < 0.12) continue;
        const s = Math.max(1, Math.round(patch.size * p.z * 2));
        ctx.fillStyle = COLORS.land;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }

      // 궤도 점선 — 작은 사각 도트 나열 (§10 스파크와 같은 문법, 곡선 금지)
      ctx.fillStyle = COLORS.accent;
      for (const pt of track) {
        const p = projectToGlobe(pt.latDeg, pt.lonDeg, spinDeg, radius);
        if (p.z < 0.1) continue;
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
      }

      // 펫(위성) 마커 — 앞면일 때만, 맥박 알파로 강조.
      // 대륙 조각(COLORS.land)과 마스코트 민트가 색이 비슷해 묻히기 쉬우니
      // 잉크색 테두리 + 노란 표적 도트 4개(십자 방향)로 눈에 띄게 한다.
      const marker = projectToGlobe(state.latDeg, state.lonDeg, spinDeg, radius);
      if (marker.z > 0.05) {
        const mx = Math.round(marker.x);
        const my = Math.round(marker.y);
        ctx.save();
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 4);
        ctx.globalAlpha *= pulse;
        ctx.fillStyle = COLORS.accent;
        const reach = 9;
        ctx.fillRect(mx - 1, my - reach, 2, 2);
        ctx.fillRect(mx - 1, my + reach - 2, 2, 2);
        ctx.fillRect(mx - reach, my - 1, 2, 2);
        ctx.fillRect(mx + reach - 2, my - 1, 2, 2);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(mx - 3, my - 3, 6, 6);
        ctx.fillStyle = COLORS.mascot;
        ctx.fillRect(mx - 2, my - 2, 4, 4);
        ctx.restore();
      }

      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      elapsed += dt;

      const nowMs = Date.now(); // 실제 시계 기준 — 궤도는 "지금"을 산다
      const state = getOrbitState(elements, nowMs);
      const track = sampleGroundTrack(elements, nowMs);
      const spinDeg = elapsed * GLOBE_SPIN_DEG_PER_SEC;

      telemetryTimer += dt;
      if (telemetryTimer >= TELEMETRY_INTERVAL) {
        telemetryTimer = 0;
        setTelemetry(state);
      }

      draw(spinDeg, state, track);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      ({ w, h } = fitCanvas(canvas));
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [pet]);

  if (pet === undefined) {
    return <p className="animate-pulse font-pixel text-xs text-gray-400">LOADING...</p>;
  }

  if (pet === null) {
    return (
      <div className="flex flex-col items-center gap-4 border-2 border-white/15 bg-black/30 px-6 py-10">
        <p className="font-pixel-ko text-sm text-gray-300">
          아직 궤도로 올라간 펫이 없어요.
          <br />
          플레이를 시작하면 펫이 태어나요.
        </p>
        <Link
          href="/play?start=1"
          className="font-pixel border-2 px-4 py-2 text-sm"
          style={{ color: COLORS.accent, borderColor: COLORS.accent }}
        >
          TAP TO START
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="font-pixel-ko text-lg text-white">{pet.name}</p>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="h-72 w-full touch-none"
      />

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        <TelemetryCard label="LAT" value={telemetry ? `${telemetry.latDeg.toFixed(2)}°` : "--"} />
        <TelemetryCard label="LON" value={telemetry ? `${telemetry.lonDeg.toFixed(2)}°` : "--"} />
        <TelemetryCard label="ALT" value={telemetry ? `${telemetry.altitudeKm.toFixed(0)} km` : "--"} />
        <TelemetryCard label="VEL" value={telemetry ? `${telemetry.speedKmS.toFixed(2)} km/s` : "--"} />
        <TelemetryCard label="PERIOD" value={telemetry ? `${(telemetry.periodSec / 60).toFixed(1)} min` : "--"} />
        <TelemetryCard label="REV" value={telemetry ? `#${telemetry.revCount.toLocaleString()}` : "--"} />
      </div>

      <span
        className="font-pixel text-xs"
        style={{ color: telemetry?.sunlit ? COLORS.accent : COLORS.moonRock }}
      >
        {telemetry ? (telemetry.sunlit ? "☀ SUNLIT" : "🌑 ECLIPSE") : "..."}
      </span>
    </div>
  );
}
