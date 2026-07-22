"use client";

// ============================================================================
// orbit-view.tsx — 궤도 모니터 화면 본체 (§8-3)
//
// 오케스트레이터 역할: 가상 시계(시간 가속)·줌 레벨·telemetry·툴팁을 관리하고,
// 실제 그림은 lib(globe·worldmap·solar)에 맡긴다. 게임 본체와 같은 원칙(§12) —
// 캔버스는 매 프레임(rAF), React state는 가끔(telemetry·시계는 스로틀)만 갱신.
// ============================================================================

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "@/lib/canvas";
import { drawBackdrop } from "@/lib/backdrop";
import { COLORS } from "@/lib/constants";
import { drawGlobeScene } from "@/lib/globe";
import { drawWorldMap } from "@/lib/worldmap";
import { drawEarthMoon, drawSolarSystem } from "@/lib/solar";
import {
  type OrbitElements,
  type OrbitState,
  generateOrbitElements,
  getLocalSolarTime,
  getOrbitState,
  sampleGroundTrack,
} from "@/lib/orbit";
import { type StoredPet, type StoredSettings, loadPet, loadSettings } from "@/lib/storage";
import type { DictKey } from "@/lib/i18n";
import { useT } from "../i18n-provider";

/** telemetry·시계 React state 갱신 주기(초) — 캔버스는 매 프레임, 숫자는 가끔. */
const TELEMETRY_INTERVAL = 0.25;
/** 캔버스 dt 상한(초) — 백그라운드 탭 복귀 시 순간이동 방지 (§12). */
const MAX_DT = 0.05;

/** 시간 가속 단계 (기능 4) — 1배(실시간)부터 하루/초까지. */
const TIME_SCALES: Array<{ mult: number; label: string }> = [
  { mult: 1, label: "1×" },
  { mult: 60, label: "60×" },
  { mult: 3600, label: "1h/s" },
  { mult: 86400, label: "1d/s" },
];

/** 줌 레벨 (기능 6) — 0 근접 지구본 / 1 지구+달 / 2 태양계. (영어 라벨 고정) */
const ZOOM_LABELS = ["EARTH VIEW", "EARTH · MOON", "SOLAR SYSTEM"];

function TelemetryCard({
  label,
  value,
  hint,
  open,
  onToggle,
}: {
  label: string;
  value: string;
  hint: string;
  open: boolean;
  onToggle: (label: string | null) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(open ? null : label)}
        onMouseEnter={() => onToggle(label)}
        onMouseLeave={() => onToggle(null)}
        aria-describedby={open ? `hint-${label}` : undefined}
        className="flex w-full flex-col items-start gap-1 border-2 border-white/15 bg-black/30 px-3 py-2 text-left focus-visible:border-white/60"
      >
        <span className="font-pixel text-[9px] tracking-widest text-gray-400">
          {label} <span className="text-gray-600">ⓘ</span>
        </span>
        <span className="font-pixel text-sm text-white">{value}</span>
      </button>
      {open && (
        <div
          id={`hint-${label}`}
          role="tooltip"
          className="font-pixel-ko absolute bottom-full left-0 z-20 mb-1 w-52 border-2 px-3 py-2 text-left text-xs leading-relaxed text-white shadow-lg"
          style={{ backgroundColor: COLORS.space, borderColor: COLORS.accent }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function OrbitView() {
  const { t } = useT();
  // undefined = 아직 localStorage를 못 읽음 (서버/첫 클라 렌더 불일치 방지)
  const [pet, setPet] = useState<StoredPet | null | undefined>(undefined);
  const [telemetry, setTelemetry] = useState<OrbitState | null>(null);
  const [clock, setClock] = useState<{
    local: string;
    secondLabel: string;
    secondValue: string;
  } | null>(null);
  // 궤도가 도는 걸 바로 보고 싶으니 60×가 기본 (task 4).
  const [timeScale, setTimeScale] = useState(60);
  const [zoom, setZoom] = useState(0);
  const [openHint, setOpenHint] = useState<string | null>(null);

  const sceneRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);

  // 루프가 항상 최신 값을 읽도록 ref로 미러링 (state가 바뀌어도 effect 재시작 X)
  const timeScaleRef = useRef(timeScale);
  const zoomRef = useRef(zoom);
  const resyncRef = useRef(false);
  timeScaleRef.current = timeScale;
  zoomRef.current = zoom;

  useEffect(() => {
    setPet(loadPet());
  }, []);

  useEffect(() => {
    if (!pet) return;
    const scene = sceneRef.current;
    const sctx = scene?.getContext("2d");
    const map = mapRef.current;
    const mctx = map?.getContext("2d");
    if (!scene || !sctx || !map || !mctx) return;

    let sSize = fitCanvas(scene);
    let mSize = fitCanvas(map);
    const elements: OrbitElements = generateOrbitElements(pet.id);

    // 설정 (§8-4) — 캐릭터·시간 형식·기지국 위치. 마운트 시 1회.
    const settings: StoredSettings = loadSettings();
    const variant = settings.character;

    let elapsed = 0;
    let virtualMs = Date.now();
    let telemetryTimer = TELEMETRY_INTERVAL; // 첫 프레임에 바로 한 번 갱신
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      elapsed += dt;

      // 가상 시계: 1배속이면 실제 시각에 붙고, 가속 중이면 자체 전진 (기능 4)
      const scale = timeScaleRef.current;
      if (scale <= 1 || resyncRef.current) {
        virtualMs = Date.now();
        resyncRef.current = false;
      } else {
        virtualMs += dt * 1000 * scale;
      }

      const state = getOrbitState(elements, virtualMs);
      const track = sampleGroundTrack(elements, virtualMs);
      // 카메라가 줍스를 따라간다 — 줍스 경도를 정면 중앙에 두어 지구본에서
      // 늘 보이게 하고(기능 3), 줍스가 움직이면 그 아래로 대륙이 흘러간다.
      const spinDeg = -state.lonDeg;
      const z = zoomRef.current;

      // --- 씬 캔버스 (줌 레벨별) ---
      drawBackdrop(sctx, sSize.w, sSize.h, elapsed, 0, false, z === 0);
      if (z === 0) {
        sctx.save();
        sctx.translate(sSize.w / 2, sSize.h * 0.5);
        drawGlobeScene(
          sctx,
          Math.min(sSize.w, sSize.h) * 0.34,
          state,
          track,
          spinDeg,
          elapsed,
          variant,
        );
        sctx.restore();
      } else if (z === 1) {
        drawEarthMoon(sctx, sSize.w, sSize.h, virtualMs);
      } else {
        drawSolarSystem(sctx, sSize.w, sSize.h, virtualMs);
      }

      // --- 2D 세계지도 캔버스 (기능 2) — 줌과 무관하게 항상 궤적을 보여준다 ---
      drawWorldMap(mctx, mSize.w, mSize.h, state, track, virtualMs, variant);

      telemetryTimer += dt;
      if (telemetryTimer >= TELEMETRY_INTERVAL) {
        telemetryTimer = 0;
        setTelemetry(state);
        // LOCAL = 줍스 발밑 지점의 현지 태양시 (위성추적기다운 값, 항상 표시)
        const lt = getLocalSolarTime(state.lonDeg, virtualMs);
        const d = new Date(virtualMs);
        const hm = (hh: number, mm: number) =>
          `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

        // 두 번째 칸은 설정(§8-4)에 따라 UTC / 기기 현지 / 기지국 태양시 (task 3c)
        let secondLabel = "UTC";
        let secondValue = `${hm(d.getUTCHours(), d.getUTCMinutes())} · ${ymd}`;
        if (settings.timeFormat === "device") {
          secondLabel = "DEVICE";
          secondValue = hm(d.getHours(), d.getMinutes());
        } else if (settings.timeFormat === "home" && settings.lon !== null) {
          const ht = getLocalSolarTime(settings.lon, virtualMs);
          secondLabel = "HOME";
          secondValue = hm(ht.hours, ht.minutes);
        }
        setClock({ local: hm(lt.hours, lt.minutes), secondLabel, secondValue });
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      sSize = fitCanvas(scene);
      mSize = fitCanvas(map);
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
        <p className="font-pixel-ko whitespace-pre-line text-sm text-gray-300">
          {t("orbit.noPet")}
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

      {/* 씬 캔버스 + 줌 조작·라벨 오버레이 (기능 6) */}
      <div className="relative w-full">
        <canvas ref={sceneRef} aria-hidden className="h-72 w-full touch-none" />
        <span className="font-pixel absolute left-2 top-2 text-[9px] tracking-widest text-gray-400">
          {ZOOM_LABELS[zoom]}
        </span>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0, z - 1))}
            disabled={zoom === 0}
            aria-label={t("orbit.ariaZoomIn")}
            className="font-pixel h-8 w-8 border-2 text-sm text-white/80 disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.4)" }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, z + 1))}
            disabled={zoom === 2}
            aria-label={t("orbit.ariaZoomOut")}
            className="font-pixel h-8 w-8 border-2 text-sm text-white/80 disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.4)" }}
          >
            −
          </button>
        </div>
      </div>

      {/* 시계 + 시간 가속 (기능 4) */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between gap-2 border-2 border-white/15 bg-black/30 px-3 py-2">
          <div className="text-left">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">
              LOCAL
            </span>
            <p className="font-pixel text-sm" style={{ color: COLORS.accent }}>
              {clock ? clock.local : "--:--"}
            </p>
          </div>
          <div className="text-right">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">
              {clock ? clock.secondLabel : "UTC"}
            </span>
            <p className="font-pixel text-[10px] text-white/80">
              {clock ? clock.secondValue : "--:--"}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-1">
          {TIME_SCALES.map((ts) => (
            <button
              key={ts.mult}
              type="button"
              onClick={() => {
                if (ts.mult === 1) resyncRef.current = true;
                setTimeScale(ts.mult);
              }}
              className="font-pixel flex-1 border-2 px-1 py-1 text-[10px] transition-colors"
              style={
                timeScale === ts.mult
                  ? { borderColor: COLORS.accent, color: COLORS.accent }
                  : { borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {ts.label}
            </button>
          ))}
        </div>
        <p className="font-pixel-ko text-[11px] text-gray-500">
          {t("orbit.timeHint")}
        </p>
      </div>

      {/* telemetry (툴팁) — 기능 1 */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["LAT", telemetry ? `${telemetry.latDeg.toFixed(2)}°` : "--"],
            ["LON", telemetry ? `${telemetry.lonDeg.toFixed(2)}°` : "--"],
            ["ALT", telemetry ? `${telemetry.altitudeKm.toFixed(0)} km` : "--"],
            ["VEL", telemetry ? `${telemetry.speedKmS.toFixed(2)} km/s` : "--"],
            ["PERIOD", telemetry ? `${(telemetry.periodSec / 60).toFixed(1)} min` : "--"],
            ["REV", telemetry ? `#${telemetry.revCount.toLocaleString()}` : "--"],
          ] as const
        ).map(([label, value]) => (
          <TelemetryCard
            key={label}
            label={label}
            value={value}
            hint={t(`orbit.hint.${label}` as DictKey)}
            open={openHint === label}
            onToggle={setOpenHint}
          />
        ))}
      </div>

      <span
        className="font-pixel text-xs"
        style={{ color: telemetry?.sunlit ? COLORS.accent : COLORS.moonRock }}
      >
        {telemetry ? (telemetry.sunlit ? "☀ SUNLIT" : "🌑 ECLIPSE") : "..."}
      </span>

      {/* 2D 세계지도 (기능 2) */}
      <div className="flex w-full flex-col items-center gap-2">
        <span className="font-pixel self-start text-[9px] tracking-widest text-gray-400">
          GROUND TRACK
        </span>
        <canvas
          ref={mapRef}
          aria-hidden
          className="h-40 w-full touch-none border-2 border-white/10"
        />
      </div>
    </div>
  );
}
