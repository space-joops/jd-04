"use client";

// ============================================================================
// location-picker.tsx — 지도 찍기 + 도시 검색으로 기지국 위치 고르기 (§8-4)
//
// worldmap.ts의 간이 지도를 재사용한다(에셋 0개 §11). 지도를 탭하면 그 지점의
// 위경도로, 도시 목록에서 고르면 그 도시 좌표로 위치를 정한다. 기존 GPS·수동
// 입력과 함께 쓰는 보조 UI다.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/constants";
import { CITIES } from "@/lib/cities";
import { drawLocatorMap } from "@/lib/worldmap";
import { fitCanvas } from "@/lib/canvas";
import { useT } from "../i18n-provider";

export function LocationPicker({
  lat,
  lon,
  onPick,
}: {
  lat: number | null;
  lon: number | null;
  onPick: (lat: number, lon: number, label: string | null) => void;
}) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");

  // 위치가 바뀌거나 리사이즈되면 다시 그린다. rAF 루프가 필요 없는 정적 그림이다.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const redraw = () => {
      const { w, h } = fitCanvas(canvas);
      drawLocatorMap(ctx, w, h, lat, lon);
    };
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [lat, lon]);

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 평면 지도 역변환 (drawLocatorMap 주석과 동일 공식)
    const pickedLon = Math.round(((x / rect.width) * 360 - 180) * 100) / 100;
    const pickedLat = Math.round((90 - (y / rect.height) * 180) * 100) / 100;
    onPick(
      Math.max(-90, Math.min(90, pickedLat)),
      Math.max(-180, Math.min(180, pickedLon)),
      null, // 지도로 찍었으면 도시명은 없음
    );
  };

  const q = query.trim().toLowerCase();
  const matches = q
    ? CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* 지도 찍기 */}
      <div className="flex flex-col gap-1">
        <span className="font-pixel-ko text-xs text-gray-400">{t("settings.mapHint")}</span>
        <canvas
          ref={canvasRef}
          onPointerDown={onTap}
          aria-label={t("settings.mapPick")}
          className="h-36 w-full cursor-crosshair touch-none border-2 border-white/15"
        />
      </div>

      {/* 도시 검색 */}
      <div className="flex flex-col gap-1">
        <span className="font-pixel-ko text-xs text-gray-400">{t("settings.citySearch")}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("settings.cityPlaceholder")}
          className="font-pixel-ko w-full border-2 border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus-visible:border-white"
        />
        {q && (
          <ul className="flex flex-col border-2 border-white/10 bg-black/40">
            {matches.length === 0 ? (
              <li className="font-pixel-ko px-3 py-2 text-xs text-gray-500">
                {t("settings.cityNone")}
              </li>
            ) : (
              matches.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(c.lat, c.lon, c.name);
                      setQuery("");
                    }}
                    className="font-pixel-ko flex w-full justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 focus-visible:bg-white/10"
                  >
                    <span>{c.name}</span>
                    <span className="text-gray-500">
                      {c.lat.toFixed(1)}, {c.lon.toFixed(1)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {lat !== null && lon !== null && (
        <p className="font-pixel text-[10px]" style={{ color: COLORS.mascot }}>
          {lat.toFixed(2)}, {lon.toFixed(2)}
        </p>
      )}
    </div>
  );
}
