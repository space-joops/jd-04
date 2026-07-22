"use client";

// ============================================================================
// settings-form.tsx — 설정 폼 (§8-4)
//
// 캐릭터 3종·기지국 위치·시간 표시 형식을 고른다. 변경 즉시 localStorage에
// 저장(saveSettings) — "저장 버튼"을 따로 두지 않는다(오락실 문법, 바로 반영).
// 캐릭터 미리보기는 이미지가 아니라 게임의 drawMascot을 미니 캔버스에 그린 것
// (에셋 0개 §11) — 게임 도트가 바뀌면 미리보기도 저절로 같아진다.
// ============================================================================

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COLORS, MASCOT_VARIANTS, type MascotVariantId } from "@/lib/constants";
import { drawMascot } from "@/lib/mascot";
import {
  type StoredSettings,
  type TimeFormat,
  loadSettings,
  saveSettings,
} from "@/lib/storage";

/** 캐릭터 한 종을 미니 캔버스에 그린다 (bag-grid.tsx와 같은 원리). */
function CharacterPreview({ variant }: { variant: MascotVariantId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2); // 레티나 또렷하게
    drawMascot(ctx, 28, 32, 20, 1, { gazeX: 0, gazeY: 0, blink: false, mouthOpen: 0 }, variant);
    ctx.restore();
  }, [variant]);
  return <canvas ref={ref} width={112} height={112} aria-hidden className="h-14 w-14" />;
}

const TIME_FORMATS: Array<{ id: TimeFormat; label: string }> = [
  { id: "utc", label: "UTC" },
  { id: "device", label: "기기 현지" },
  { id: "home", label: "기지국 태양시" },
];

export function SettingsForm() {
  // null = 아직 localStorage를 못 읽음 (서버/첫 클라 렌더 불일치 방지)
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  if (!settings) {
    return <p className="animate-pulse font-pixel text-xs text-gray-400">LOADING...</p>;
  }

  /** 부분 갱신 + 즉시 저장. */
  const update = (patch: Partial<StoredSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const askLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMsg("이 기기는 위치를 지원하지 않아요. 직접 입력해줘.");
      return;
    }
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
        });
        setGeoMsg("현재 위치로 맞췄어!");
      },
      () => setGeoMsg("위치를 못 가져왔어. 직접 입력해줘."),
      { timeout: 8000 },
    );
  };

  return (
    <div className="flex w-full flex-col gap-8 text-left">
      {/* ---- 캐릭터 3종 ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">캐릭터</h2>
        <div className="grid grid-cols-3 gap-3">
          {MASCOT_VARIANTS.map((v) => {
            const chosen = settings.character === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => update({ character: v.id })}
                aria-pressed={chosen}
                className="flex flex-col items-center gap-1 border-2 bg-black/30 py-3 transition-colors"
                style={{ borderColor: chosen ? COLORS.accent : "rgba(255,255,255,0.15)" }}
              >
                <CharacterPreview variant={v.id} />
                <span
                  className="font-pixel-ko text-sm"
                  style={{ color: chosen ? COLORS.accent : "rgba(255,255,255,0.7)" }}
                >
                  {v.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- 위치(기지국) ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">기지국 위치</h2>
        <p className="font-pixel-ko text-xs text-gray-400">
          달의 반구(초승달 방향)와 궤도 모니터의 현지시간에 쓰여요.
        </p>
        <button
          type="button"
          onClick={askLocation}
          className="font-pixel-ko self-start border-2 px-4 py-2 text-sm"
          style={{ color: COLORS.mascot, borderColor: COLORS.mascot }}
        >
          📍 현재 위치 가져오기
        </button>
        {geoMsg && <p className="font-pixel-ko text-xs text-gray-300">{geoMsg}</p>}
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">LAT</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={-90}
              max={90}
              value={settings.lat ?? ""}
              placeholder="위도"
              onChange={(e) =>
                update({ lat: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-2 py-2 text-sm text-white outline-none focus-visible:border-white"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-pixel text-[9px] tracking-widest text-gray-400">LON</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={-180}
              max={180}
              value={settings.lon ?? ""}
              placeholder="경도"
              onChange={(e) =>
                update({ lon: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-2 py-2 text-sm text-white outline-none focus-visible:border-white"
            />
          </label>
        </div>
      </section>

      {/* ---- 시간 표시 형식 ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-pixel-ko text-base text-white">시간 표시</h2>
        <p className="font-pixel-ko text-xs text-gray-400">
          궤도 모니터의 시계에 쓰여요.
        </p>
        <div className="flex gap-2">
          {TIME_FORMATS.map((f) => {
            const chosen = settings.timeFormat === f.id;
            const disabled = f.id === "home" && (settings.lat === null || settings.lon === null);
            return (
              <button
                key={f.id}
                type="button"
                disabled={disabled}
                onClick={() => update({ timeFormat: f.id })}
                aria-pressed={chosen}
                className="font-pixel-ko flex-1 border-2 px-1 py-2 text-xs transition-colors disabled:opacity-30"
                style={
                  chosen
                    ? { borderColor: COLORS.accent, color: COLORS.accent }
                    : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {settings.lat === null && (
          <p className="font-pixel-ko text-[11px] text-gray-500">
            * 기지국 태양시는 위치를 먼저 설정해야 골라져요.
          </p>
        )}
      </section>

      <Link
        href="/orbit"
        className="font-pixel-ko self-center text-sm underline underline-offset-4"
        style={{ color: COLORS.mascot }}
      >
        🛰️ 궤도 모니터에서 확인하기
      </Link>
    </div>
  );
}
